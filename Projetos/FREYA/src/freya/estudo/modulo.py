"""Estudo de personagens: antes de analisar, a F.R.E.Y.A. lê a história completa de quem a questão cita.

A base inicial tem o perfil oficial e a biografia principal da wiki, mas não tem o que torna uma análise certeira:
- as **variantes** (o Loki da série "Loki" não é o Loki que morre em "Guerra Infinita": é "Loki/New York Time Heist");
- o **enredo das séries**, episódio por episódio (é no último episódio que Loki vira o guardião do multiverso).

Para cada personagem focal ainda não estudado, `estudar()`:
1. lê o Hub do personagem na wiki do MCU e, das variantes que ele lista como subpáginas ("Loki/…"), as que têm
   biografia; cada uma vira entidade com a sua biografia e se liga ao personagem (RELATED_TO, "variante");
2. das séries em que o personagem ou as variantes aparecem, das mais recentes para as mais antigas, lê o
   enredo da temporada e o de cada episódio;
3. junta tudo ao RAG e ao grafo (sem recriar a base) e guarda em `pasta`, para não repetir a leitura.

Fonte: wiki do MCU (fãs, CC BY-SA 3.0), com a mesma confiabilidade `wiki_fas` do resto da base.
"""
from __future__ import annotations

import logging
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

from freya.conhecimento.coleta.aprofundar_wiki import indice_de_obras
from freya.conhecimento.coleta.wiki_mcu import BASE_WIKI, ClienteWiki, LeitorWiki, _texto
from freya.conhecimento.coleta.wiki_obras import eh_pagina_de_obra, ler_obra_wiki, titulos_da_obra
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.incremental import Guardado, aplicar, corpus_do_grafo
from freya.conhecimento.modelos import Confiabilidade, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import slug
from freya.conhecimento.ontologia import Predicado, TipoEntidade
from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.hybrid.recuperador import RecuperadorHibrido

log = logging.getLogger(__name__)

# animações ficam fora do estudo: a análise é da continuidade live action
ANIMACAO = re.compile(r"animation|what if|x-men '97|marvel zombies|your friendly neighborhood|eyes of wakanda", re.I)


def variantes_do_hub(html: str, nome: str) -> list[str]:
    """Subpáginas do personagem citadas no Hub ("Loki/New York Time Heist"), na ordem da página."""
    soup = BeautifulSoup(html, "lxml")
    return list(dict.fromkeys(a["title"] for a in soup.select("a[title]") if a["title"].startswith(f"{nome}/")))


def episodios(html: str) -> list[str]:
    """Páginas de episódio listadas na seção "Episodes" da página da temporada ("Ouroboros", "Glorious Purpose (Loki Season Two)")."""
    soup = BeautifulSoup(html, "lxml")
    h = next((x for x in soup.select("h2") if _texto(x) == "Episodes"), None)
    if h is None:
        return []
    titulos = []
    for el in h.find_all_next():
        if el.name == "h2":
            break
        # na tabela de episódios, o título é o link em itálico; os demais links são roteiristas, diretores e personagens
        if el.name == "a" and el.get("title") and el.parent.name == "i" and el.find_parent("td") and ":" not in el["title"]:
            titulos.append(el["title"])
    return list(dict.fromkeys(titulos))


def tem_biografia(html: str) -> bool:
    return any(_texto(h).startswith("Biography") for h in BeautifulSoup(html, "lxml").select("h2"))


class EstudoDePersonagens:
    def __init__(self, hibrido: RecuperadorHibrido, grafo: ArmazenamentoGrafo, pasta: str | Path = "data/estudos",
                 cliente: ClienteWiki | None = None, max_variantes: int = 3, max_series: int = 3, max_episodios: int = 18):
        self.hibrido, self.grafo = hibrido, grafo
        self.guardado = Guardado(pasta, {"estudados": {}})
        self._cliente = cliente
        self.max_variantes, self.max_series, self.max_episodios = max_variantes, max_series, max_episodios
        self._trava = threading.Lock()

    def _pagina(self, titulo: str) -> dict | None:
        """Uma página que falha (rede, disco) não interrompe o estudo: fica de fora e o resto segue."""
        try:
            return self.cliente.pagina(titulo)
        except Exception as e:
            log.warning("estudo: página %s indisponível (%s)", titulo, str(e)[:120])
            return None

    @property
    def cliente(self) -> ClienteWiki:
        if self._cliente is None:
            self._cliente = ClienteWiki()
        return self._cliente

    def estudado(self, chave: str) -> bool:
        return chave in self.guardado.estado["estudados"]

    def ficha(self, chave: str) -> dict:
        """O que o estudo deixou para a análise: variantes e documentos-chave (vazio se não foi estudado)."""
        return self.guardado.estado["estudados"].get(chave, {})

    def reaplicar(self) -> dict:
        corpus = self.guardado.corpus()
        return aplicar(self.hibrido, self.grafo, corpus) if corpus.documentos else {"entidades_novas": 0, "relacoes": 0, "trechos": 0}

    # ---------------------------------------------------------------- leitura
    def _variantes(self, chave: str, nome: str, leitor: LeitorWiki, novo: Corpus) -> list[str]:
        hub = self._pagina(f"Hub:{nome}")
        if not hub:
            return []
        candidatas = []
        for titulo in variantes_do_hub(hub["html"], nome)[: self.max_variantes * 2]:
            reg = self._pagina(titulo)
            if not reg or not tem_biografia(reg["html"]):
                continue
            ch = f"character:{slug(titulo)}"
            r = leitor.ler(reg, ch, titulo, TipoEntidade.PERSONAGEM)
            capitulos = sum(d.doc_id.startswith(f"wiki:{ch}:bio:") for d in r.documentos)
            if capitulos:
                candidatas.append((capitulos, titulo, ch, r))
        # as variantes com mais história primeiro (a protagonista de uma série tem dezenas de capítulos; uma ponta, um ou dois)
        lidas = []
        for _, titulo, ch, r in sorted(candidatas, key=lambda x: -x[0])[: self.max_variantes]:
            for d in r.documentos:
                novo.adicionar_documento(d)
            for e in r.entidades:
                novo.adicionar_entidade(e)
            for f in r.fatos:
                novo.adicionar_fato(f)
            novo.adicionar_fato(Fato(sujeito=ch, predicado=Predicado.RELACIONADO_A, objeto=chave, evidencia=f"Hub:{nome} › {titulo}",
                                     tipo_evidencia=TipoEvidencia.CAMPO, campo="hub", doc_id=f"wiki:{ch}:perfil",
                                     url=BASE_WIKI + f"Hub:{nome}".replace(" ", "_"), qualificador=f"variante de {nome}",
                                     confiabilidade=Confiabilidade.WIKI_FAS))
            lidas.append(ch)
        return lidas

    def _series(self, chaves: list[str]) -> list[tuple[str, str, int | None]]:
        """Séries em que os personagens aparecem, das mais recentes para as mais antigas: (chave, nome, ano)."""
        vistas: dict[str, tuple[str, str, int | None]] = {}
        sub = self.grafo.vizinhanca(chaves, profundidade=1, limite=400)
        for a in sub.arestas.values():
            if a.predicado != "APPEARS_IN" or a.origem not in chaves:
                continue
            no = sub.nos.get(a.destino) or self.grafo.no(a.destino)
            if no and no.tipo == "series" and not ANIMACAO.search(f"{no.chave} {no.nome}"):
                ano = a.ano or no.atributos.get("ano")
                vistas[no.chave] = (no.chave, no.nome, ano if isinstance(ano, int) else None)
        # a série sem temporada ("Loki") vale pelas temporadas que o grafo tem ("Loki | Season 2", "Loki | Season 1")
        temporadas: dict[str, tuple[str, str, int | None, int]] = {}
        for chave, nome, ano in vistas.values():
            achadas = [(t, n) for n in range(6, 0, -1) if (t := self.grafo.no(f"{chave}-{n}")) and "| Season" in t.nome]
            for t, n in achadas or [(None, 1)]:
                if t is None:
                    temporadas[chave] = (chave, nome, ano, 1)
                else:
                    a_t = t.atributos.get("ano")
                    temporadas[t.chave] = (t.chave, t.nome, a_t if isinstance(a_t, int) else ano, n)
        ordem = sorted(temporadas.values(), key=lambda x: (-(x[2] or 0), -x[3]))
        return [(c, n, a) for c, n, a, _ in ordem][: self.max_series]

    def _enredos(self, series: list[tuple[str, str, int | None]], novo: Corpus) -> tuple[int, list[str]]:
        """Lê o enredo das temporadas e dos episódios; devolve (episódios lidos, documentos-chave).

        Documentos-chave: o enredo de cada temporada lida e os dois últimos episódios da mais recente (o desfecho).
        A análise sempre os recebe, sem depender da busca.
        """
        lidos, chave_docs = 0, []
        for i, (chave_obra, nome_obra, ano) in enumerate(series):
            eps_desta: list[str] = []
            reg = next((r for t in titulos_da_obra(nome_obra, TipoEntidade.SERIE)
                        if (r := self._pagina(t)) and eh_pagina_de_obra(r, nome_obra)), None)
            if not reg:
                continue
            docs, _, _ = ler_obra_wiki(reg, chave_obra, nome_obra, ano, {})
            for d in docs:
                if d.secao in ("plot", "synopsis"):
                    d.doc_id = f"{d.doc_id}:estudo"
                    novo.adicionar_documento(d)
                    if d.secao == "plot":
                        chave_docs.append(d.doc_id)
            for ep in episodios(reg["html"]):
                if lidos >= self.max_episodios:
                    break
                r = self._pagina(ep)
                if not r:
                    continue
                nome_ep = re.sub(r"\s*\(.+\)$", "", ep)
                for d in ler_obra_wiki(r, chave_obra, nome_ep, ano, {})[0]:
                    if d.secao in ("plot", "synopsis"):
                        d.doc_id = f"wiki:{chave_obra}:ep-{slug(nome_ep)}:{d.secao}"
                        d.titulo = f"{nome_obra} — episódio “{nome_ep}” — {d.secao} (wiki do MCU)"
                        novo.adicionar_documento(d)
                        if d.secao == "plot":
                            eps_desta.append(d.doc_id)
                lidos += 1
            if i == 0:
                chave_docs += eps_desta[-2:]
        return lidos, chave_docs

    # ---------------------------------------------------------------- uso
    def estudar(self, chave: str, nome: str) -> dict:
        with self._trava:
            if self.estudado(chave):
                return {"personagem": chave, "estudo": "já feito"}
            base = corpus_do_grafo(self.grafo)
            leitor = LeitorWiki(indice_de_obras(base), {})
            novo = Corpus()
            variantes = self._variantes(chave, nome, leitor, novo)
            for v in variantes:  # a variante precisa estar no grafo para as séries dela serem achadas
                self.grafo.adicionar_entidades([e for e in novo.entidades.values() if e.chave == v])
                self.grafo.adicionar_fatos([f for f in novo.fatos.values() if f.sujeito == v])
            series = self._series([chave, *variantes])
            episodios_lidos, enredos = self._enredos(series, novo)
            resumo = {"personagem": chave, "variantes": variantes, "series": [s[1] for s in series], "episodios": episodios_lidos,
                      **aplicar(self.hibrido, self.grafo, novo)}
            self.guardado.juntar(novo)
            self.guardado.estado["estudados"][chave] = {"em": datetime.now(timezone.utc).isoformat(), "variantes": variantes,
                                                        "series": [s[1] for s in series], "episodios": episodios_lidos, "enredos": enredos}
            self.guardado.salvar_estado()
            return resumo
