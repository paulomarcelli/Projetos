"""Intelligence Day: as notícias novas do MCU entram no RAG e no GraphRAG durante a análise.

A cada investigação, antes da recuperação, o orquestrador chama `atualizar()`:
1. se a última varredura tem menos de `validade_horas`, não faz nada (a análise não espera à toa);
2. lista as notícias recentes de marvel.com (sitemap de notícias + página /articles), só filmes e séries;
3. lê as que ainda não foram lidas (no máximo `maximo`), respeitando o robots.txt e o intervalo do Coletor;
4. RAG: indexa o texto das notícias nos índices vetorial e lexical, sem recriá-los;
5. GraphRAG: cria as obras e personagens marcados nas tags oficiais que o grafo ainda não tem (é assim que
   uma estreia como "VisionQuest" ou "Avengers: Doomsday" vira nó), liga cada personagem marcado à obra
   principal da notícia (RELATED_TO, com a notícia como evidência) e, com o modelo de linguagem, extrai
   relações narrativas do texto com citação literal (a mesma extração verificada do enriquecimento da base);
6. guarda o que leu em `pasta` (corpus próprio), para reaplicar ao reiniciar a API (`reaplicar()`).

Falhar aqui nunca derruba a análise: o orquestrador registra o erro na etapa e segue com a base que já tem.
"""
from __future__ import annotations

import json
import logging
import re
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

from freya.conhecimento.coleta.coletor import Coletor
from freya.conhecimento.coleta.parser_marvel import BASE
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.incremental import aplicar, corpus_do_grafo
from freya.conhecimento.modelos import Confiabilidade, Entidade, Fato, TipoEvidencia
from freya.conhecimento.ontologia import Predicado
from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.hybrid.recuperador import RecuperadorHibrido
from freya.intelligence_day.leitura import CATEGORIAS, NaoENoticia, Noticia, categoria_da_url, ler_noticia
from freya.llm.cliente import ModeloDeLinguagem

log = logging.getLogger(__name__)

SITEMAP_NOTICIAS = f"{BASE}/sitemap-news.xml"
LISTA_NOTICIAS = f"{BASE}/articles"


def agora() -> datetime:
    return datetime.now(timezone.utc)


def urls_do_sitemap(xml: str) -> list[str]:
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)


def urls_da_lista(html: str) -> list[str]:
    """Links de notícias na ordem da página (/articles lista as mais recentes primeiro)."""
    return [BASE + u for u in dict.fromkeys(re.findall(r'href="(/articles/[a-z-]+/[a-z0-9-]+)"', html))]


def da_continuidade(url: str) -> bool:
    return categoria_da_url(url) in CATEGORIAS


class IntelligenceDay:
    def __init__(self, hibrido: RecuperadorHibrido, grafo: ArmazenamentoGrafo, modelo: ModeloDeLinguagem | None = None,
                 pasta: str | Path = "data/intelligence_day", coletor: Coletor | None = None, intervalo: float = 2.0,
                 validade_horas: float = 24.0, maximo: int = 8, trechos: int = 16):
        self.hibrido, self.grafo, self.modelo = hibrido, grafo, modelo
        self.pasta = Path(pasta)
        self._coletor, self._intervalo = coletor, intervalo
        self.validade = timedelta(hours=validade_horas)
        self.maximo, self.trechos = maximo, trechos
        self._trava = threading.Lock()  # duas análises ao mesmo tempo não varrem as notícias duas vezes
        self._estado_arq = self.pasta / "estado.json"
        self.estado: dict = json.loads(self._estado_arq.read_text(encoding="utf-8")) if self._estado_arq.exists() else {"lidas": {}}

    @property
    def coletor(self) -> Coletor:
        if self._coletor is None:
            self._coletor = Coletor(intervalo=self._intervalo)
        return self._coletor

    # ---------------------------------------------------------------- estado
    def _salvar_estado(self) -> None:
        self.pasta.mkdir(parents=True, exist_ok=True)
        self._estado_arq.write_text(json.dumps(self.estado, ensure_ascii=False, indent=1), encoding="utf-8")

    def _corpus(self) -> Corpus:
        return Corpus.carregar(self.pasta / "corpus") if (self.pasta / "corpus").exists() else Corpus()

    def em_dia(self) -> bool:
        ultima = self.estado.get("ultima_varredura")
        return bool(ultima) and agora() - datetime.fromisoformat(ultima) < self.validade

    # ---------------------------------------------------------------- fontes
    def listar(self) -> list[str]:
        """Notícias de filmes e séries, da mais recente para a mais antiga, sem repetição."""
        c = self.coletor
        c.carregar_robots()
        urls: list[str] = []
        for fonte, ler in ((SITEMAP_NOTICIAS, urls_do_sitemap), (LISTA_NOTICIAS, urls_da_lista)):
            if not c.permitido(fonte):
                continue
            resp = c._get(fonte)
            if resp.status_code == 200:
                urls += ler(resp.text)
            else:
                log.warning("intelligence day: HTTP %s em %s", resp.status_code, fonte)
        return [u for u in dict.fromkeys(urls) if da_continuidade(u)]

    # ---------------------------------------------------------------- grafo
    def _entidades_e_fatos(self, n: Noticia, doc_id: str, captura_id: str | None) -> tuple[list[Entidade], list[Fato]]:
        entidades = [Entidade(chave=t.chave, nome=t.nome, tipo=t.tipo, fontes=[doc_id]) for t in n.tags]
        fatos = []
        if n.obras:
            obra = n.obras[0]  # a obra principal da notícia: a primeira marcada
            for p in n.personagens:
                fatos.append(Fato(sujeito=p.chave, predicado=Predicado.RELACIONADO_A, objeto=obra.chave, evidencia=n.titulo,
                                  tipo_evidencia=TipoEvidencia.CAMPO, campo="article_tags", doc_id=doc_id, url=n.url, captura_id=captura_id,
                                  ano=n.publicada_em.year if n.publicada_em else None, obra=obra.chave,
                                  qualificador=f"marcados juntos na notícia oficial de {n.publicada_em or 'data desconhecida'}",
                                  confiabilidade=Confiabilidade.OFICIAL, predicado_original="article_tags"))
        return entidades, fatos

    def _aplicar(self, corpus: Corpus) -> dict:
        return aplicar(self.hibrido, self.grafo, corpus)

    # ---------------------------------------------------------------- uso
    def reaplicar(self) -> dict:
        """Ao iniciar a API: põe de volta nos índices e no grafo as notícias já lidas."""
        corpus = self._corpus()
        return self._aplicar(corpus) if corpus.documentos else {"entidades_novas": 0, "relacoes": 0, "trechos": 0}

    def atualizar(self, forcar: bool = False) -> dict:
        with self._trava:
            if not forcar and self.em_dia():
                return {"varredura": "em dia", "ultima_varredura": self.estado["ultima_varredura"], "noticias_novas": 0,
                        "noticias_na_base": len(self.estado["lidas"])}
            lidas: dict = self.estado.setdefault("lidas", {})
            pendentes = [u for u in self.listar() if u not in lidas][: self.maximo]
            novo = Corpus()
            titulos, falhas = [], 0
            for url in pendentes:
                cap = self.coletor.capturar(url)
                if cap is None:
                    falhas += 1
                    continue
                conteudo, captura = cap
                try:
                    n = ler_noticia(json.loads(conteudo), url)
                except NaoENoticia as e:
                    log.info("intelligence day: %s ignorada (%s)", url, e)
                    lidas[url] = {"ignorada": str(e)}
                    continue
                doc = n.documento(captura.id)
                novo.adicionar_documento(doc)
                ents, fatos = self._entidades_e_fatos(n, doc.doc_id, captura.id)
                for e in ents:
                    novo.adicionar_entidade(e)
                for f in fatos:
                    novo.adicionar_fato(f)
                lidas[url] = {"titulo": n.titulo, "publicada_em": n.publicada_em.isoformat() if n.publicada_em else None, "doc_id": doc.doc_id,
                              "obras": [t.nome for t in n.obras]}
                titulos.append(n.titulo)

            resumo = {"varredura": "feita", "noticias_novas": len(titulos), "titulos": titulos, "falhas": falhas}
            if novo.documentos:
                resumo.update(self._aplicar(novo))
                if self.modelo is not None:
                    resumo["relacoes_do_texto"] = self._extrair(novo)
                guardado = self._corpus().unir(novo)
                guardado.salvar(self.pasta / "corpus")
            self.estado["ultima_varredura"] = agora().isoformat()
            self._salvar_estado()
            resumo["noticias_na_base"] = len([v for v in lidas.values() if "doc_id" in v])
            return resumo

    def _extrair(self, novo: Corpus) -> int:
        """Relações narrativas do texto das notícias, com citação literal, entre entidades do grafo."""
        from freya.conhecimento.extracao import extrair

        fatos, rel = extrair(corpus_do_grafo(self.grafo), list(novo.documentos.values()), self.modelo, limite=self.trechos)
        log.info("intelligence day: extração %s", rel)
        for f in fatos:
            f.qualificador = "relação citada numa notícia oficial"
            novo.adicionar_fato(f)
        return self.grafo.adicionar_fatos(fatos)
