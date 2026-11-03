"""Leitura da wiki do MCU (marvelcinematicuniverse.fandom.com), licença CC BY-SA 3.0.

Fonte secundária (escrita por fãs), usada para aprofundar o que a fonte oficial resume:
- infobox: nome real, apelidos, espécie, cidadania, estado (vivo/morto), filiações (atuais e antigas);
- "Relationships": parentes, aliados e inimigos, com a nuance da relação ("Adoptive Brother, Former Teammate");
- "Biography": a trajetória em capítulos cronológicos, cada um ancorado nas obras que cita (e, daí, no ano).

Regras:
- toda entidade de partida é oficial (marvel.com); a página da wiki só é aceita se o nome ou um apelido oficial
  aparece no título, no nome real ou nos apelidos da página;
- trechos que a própria wiki marca como de canonicidade incerta ("Unconfirmed") ou de mídia inspirada
  ("Inspired") são descartados; livros, quadrinhos e jogos derivados não contam como aparição;
- cada fato leva a confiabilidade `wiki_fas`, a URL, a revisão da página e a licença.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import httpx
from bs4 import BeautifulSoup, Tag

from freya.conhecimento.modelos import Confiabilidade, Documento, Entidade, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import normalizar, slug
from freya.conhecimento.ontologia import Predicado, TipoEntidade

log = logging.getLogger(__name__)

API = "https://marvelcinematicuniverse.fandom.com/api.php"
BASE_WIKI = "https://marvelcinematicuniverse.fandom.com/wiki/"
AGENTE = "FREYA-research/0.1 (uso pessoal e academico; https://github.com/paulomarcelli/Projetos)"
LICENCA = "CC BY-SA 3.0 (MCU Wiki, Fandom)"
_REF_INCERTA = ("unconfirmed", "inspired", "information is revealed in media that is inspired", "canonicity")
_QUALIFICADORES_FRACOS = ("mentioned", "photo", "footage", "archive", "depiction", "illusion", "corpse", "indirectly", "voice", "flashback")
_SECOES_RELACAO = {"Family": Predicado.PARENTE_DE, "Allies": Predicado.ALIADO_DE, "Enemies": Predicado.INIMIGO_DE}


# ------------------------------------------------------------------ cliente da API

class ClienteWiki:
    def __init__(self, pasta_raw: str | Path = "data/raw/wiki", intervalo: float = 1.5, cliente: httpx.Client | None = None):
        self.raw = Path(pasta_raw)
        self.raw.mkdir(parents=True, exist_ok=True)
        self.intervalo = intervalo
        self.http = cliente or httpx.Client(headers={"User-Agent": AGENTE}, timeout=60, follow_redirects=True)
        self._ultimo = 0.0

    def _get(self, params: dict) -> dict:
        espera = self.intervalo - (time.monotonic() - self._ultimo)
        if espera > 0:
            time.sleep(espera)
        self._ultimo = time.monotonic()
        for tentativa in range(3):
            r = self.http.get(API, params={**params, "format": "json"})
            if r.status_code == 429:
                time.sleep(10 * (tentativa + 1))
                continue
            r.raise_for_status()
            return r.json()
        r.raise_for_status()
        return {}

    def pagina(self, titulo: str) -> dict | None:
        """Página analisada (HTML), com cópia local comprimida. None se não existir."""
        nome = slug(titulo)
        if len(nome) > 40:  # nomes longos estouram o limite de 260 caracteres de caminho do Windows
            nome = f"{nome[:32]}-{hashlib.sha1(titulo.encode()).hexdigest()[:8]}"
        arq = self.raw / f"{nome}.json.gz"
        if arq.exists():
            return json.loads(gzip.decompress(arq.read_bytes()))
        d = self._get({"action": "parse", "page": titulo, "prop": "text|revid|displaytitle", "redirects": 1, "disablelimitreport": 1})
        if "error" in d:
            return None
        p = d["parse"]
        html = p["text"]["*"]
        registro = {"titulo": p["title"], "revid": p.get("revid"), "html": html, "pedido": titulo,
                    "recuperado_em": datetime.now(timezone.utc).isoformat(), "sha256": hashlib.sha256(html.encode()).hexdigest()}
        arq.write_bytes(gzip.compress(json.dumps(registro, ensure_ascii=False).encode()))
        return registro

    def buscar(self, termo: str, n: int = 3) -> list[str]:
        """Busca da própria wiki (para nomes que não são título de página)."""
        d = self._get({"action": "query", "list": "search", "srsearch": termo, "srlimit": n, "srnamespace": 0})
        return [x["title"] for x in d.get("query", {}).get("search", [])]

    def resolver_titulos(self, titulos: list[str]) -> dict[str, str]:
        """Título -> título canônico (segue redirecionamentos), em lotes de 50."""
        saida: dict[str, str] = {}
        cache = self.raw / "_redirects.json"
        conhecido = json.loads(cache.read_text()) if cache.exists() else {}
        faltam = [t for t in dict.fromkeys(titulos) if t not in conhecido]
        for i in range(0, len(faltam), 50):
            lote = faltam[i:i + 50]
            d = self._get({"action": "query", "titles": "|".join(lote), "redirects": 1})
            mapa = {x["from"]: x["to"] for x in d.get("query", {}).get("redirects", [])}
            norm = {x["from"]: x["to"] for x in d.get("query", {}).get("normalized", [])}
            for t in lote:
                t2 = norm.get(t, t)
                conhecido[t] = mapa.get(t2, t2)
        cache.write_text(json.dumps(conhecido, ensure_ascii=False))
        for t in titulos:
            saida[t] = conhecido.get(t, t)
        return saida


# ------------------------------------------------------------------ leitura do HTML

def _texto(el: Tag) -> str:
    for s in el.select("sup.reference, .mw-editsection"):
        s.decompose()
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).replace(" ,", ",").replace(" .", ".").strip()


def _infobox(soup: BeautifulSoup) -> dict[str, Tag]:
    return {it.get("data-source"): it.select_one(".pi-data-value") for it in soup.select(".pi-item.pi-data") if it.select_one(".pi-data-value")}


def _segmentos(valor: Tag) -> list[tuple[str, str | None]]:
    """Divide o valor de um campo em itens (texto, título do primeiro link), pelos <br> e <li>."""
    html = re.sub(r"<br\s*/?>", "\n", str(valor))
    html = re.sub(r"</li>", "\n", html)
    itens = []
    for parte in html.split("\n"):
        frag = BeautifulSoup(parte, "lxml")
        for s in frag.select("sup.reference"):
            s.decompose()
        txt = re.sub(r"\s+", " ", frag.get_text(" ", strip=True)).strip(" ,")
        a = frag.select_one("a[title]")
        if txt:
            itens.append((txt, a.get("title") if a else None))
    return itens


def nomes_da_pagina(soup: BeautifulSoup, titulo: str) -> set[str]:
    nomes = {normalizar(titulo)}
    ib = _infobox(soup)
    for campo in ("real name", "alias", "name"):
        if campo in ib:
            for txt, _ in _segmentos(ib[campo]):
                # os rótulos do campo ("Codenames", "Nicknames"...) vêm colados aos nomes: viram separadores
                txt = re.sub(r"(Codenames|Nicknames|In-Universe Media|Undercover Aliases|Titles|Aliases)", "|", txt)
                for parte in re.split(r"\s{2,}|;|/|\|", txt):
                    p = parte.strip(" ,")
                    if 2 < len(p) < 50:
                        nomes.add(normalizar(p))
    return nomes


def referencias(soup: BeautifulSoup) -> dict[str, str]:
    """id da nota (cite_note-AAoU-12) -> texto da referência (nome da obra ou aviso)."""
    refs = {}
    for li in soup.select("ol.references li[id]"):
        rt = li.select_one(".reference-text")
        refs[li["id"]] = re.sub(r"\s+", " ", (rt or li).get_text(" ", strip=True))
    return refs


@dataclass
class LeituraWiki:
    documentos: list[Documento] = field(default_factory=list)
    entidades: list[Entidade] = field(default_factory=list)
    fatos: list[Fato] = field(default_factory=list)
    alvos: list[str] = field(default_factory=list)  # títulos citados nas relações (para resolver depois)
    descartados_incertos: int = 0
    aparicoes_ignoradas: int = 0


class LeitorWiki:
    def __init__(self, obras: dict[str, tuple[str, int | None]], titulo_para_chave: dict[str, str]):
        """`obras`: nome normalizado -> (chave, ano); `titulo_para_chave`: título canônico da wiki -> chave oficial."""
        self.obras = obras
        self.titulo_para_chave = titulo_para_chave

    def obra_de(self, texto: str) -> tuple[str, int | None] | None:
        t = normalizar(re.sub(r"\(.*?\)", "", texto)).strip(" '\"")
        t = re.sub(r"^marvel studios'? ", "", t)
        return self.obras.get(t)

    def chave_alvo(self, titulo: str, tipo_padrao: TipoEntidade) -> str:
        return self.titulo_para_chave.get(titulo) or f"{tipo_padrao.value}:{slug(titulo)}"

    def ler(self, registro: dict, chave: str, nome: str, tipo: TipoEntidade) -> LeituraWiki:
        r = LeituraWiki()
        soup = BeautifulSoup(registro["html"], "lxml")
        titulo = registro["titulo"]
        url = BASE_WIKI + titulo.replace(" ", "_")
        doc_base = f"wiki:{chave}"
        refs = referencias(soup)
        ib = _infobox(soup)

        # -------- infobox: identidade e filiações
        atributos: dict = {"wiki_titulo": titulo, "wiki_revid": registro.get("revid")}
        for campo, nome_attr in (("real name", "nome_real"), ("species", "especie"), ("citizenship", "cidadania"), ("status", "estado"),
                                 ("DOB", "nascimento"), ("DOD", "morte"), ("snapped", "blip"), ("title", "titulos")):
            if campo in ib:
                atributos[nome_attr] = re.sub(r"\s*\[\s*\d+\s*\]", "", ib[campo].get_text(" ", strip=True))[:200]
        linhas_ib = [f"{nome} — wiki do MCU (fonte secundária, {LICENCA})"]
        linhas_ib += [f"{k}: {v}" for k, v in atributos.items() if not k.startswith("wiki_") and v]
        apelidos = sorted(n for n in nomes_da_pagina(soup, titulo) if n != normalizar(nome))
        r.entidades.append(Entidade(chave=chave, nome=nome, tipo=tipo, apelidos=[], atributos=atributos, fontes=[f"{doc_base}:perfil"]))

        if "affiliation" in ib:
            for txt, alvo in _segmentos(ib["affiliation"]):
                if not alvo:
                    continue
                antiga = "formerly" in txt.lower()
                k_alvo = self.chave_alvo(alvo, TipoEntidade.ORGANIZACAO)
                r.alvos.append(alvo)
                r.entidades.append(Entidade(chave=k_alvo, nome=alvo, tipo=TipoEntidade.ORGANIZACAO, fontes=[f"{doc_base}:perfil"]))
                linhas_ib.append(f"Affiliation: {txt}")
                r.fatos.append(Fato(sujeito=chave, predicado=Predicado.MEMBRO_DE, objeto=k_alvo, evidencia=f"Infobox › Affiliation: {txt}",
                                    tipo_evidencia=TipoEvidencia.CAMPO, campo="infobox.affiliation", doc_id=f"{doc_base}:perfil", url=url,
                                    qualificador="antiga" if antiga else "atual", confiabilidade=Confiabilidade.WIKI_FAS))
        for campo in ("movie", "tv series"):
            if campo not in ib:
                continue
            for txt, alvo in _segmentos(ib[campo]):
                obra = self.obra_de(alvo or txt)
                if not obra:
                    continue
                fraco = any(q in txt.lower() for q in _QUALIFICADORES_FRACOS)
                if fraco:  # menção, foto, arquivo: não é aparição na história
                    r.aparicoes_ignoradas += 1
                    continue
                linhas_ib.append(f"Appears in: {txt}")
                r.fatos.append(Fato(sujeito=chave, predicado=Predicado.APARECE_EM, objeto=obra[0], evidencia=f"Infobox › {campo}: {txt}",
                                    tipo_evidencia=TipoEvidencia.CAMPO, campo=f"infobox.{campo}", doc_id=f"{doc_base}:perfil", url=url,
                                    ano=obra[1], obra=obra[0], confiabilidade=Confiabilidade.WIKI_FAS))

        # -------- Relationships: parentes, aliados, inimigos (com a nuance)
        h_rel = next((h for h in soup.select("h2") if _texto(h).startswith("Relationships")), None)
        if h_rel:
            secao = None
            for el in h_rel.find_all_next():
                if el.name == "h2":
                    break
                if el.name == "h3":
                    secao = _texto(el)
                    continue
                pred = _SECOES_RELACAO.get(secao or "")
                if not pred or el.name != "li" or el.find("ul"):
                    continue  # só itens-folha (o item-grupo "Asgardians" não é uma pessoa)
                a = el.select_one("a[title]")
                if not a:
                    continue
                alvo = a["title"]
                txt = _texto(el)
                qual = txt.split(" - ", 1)[1].strip() if " - " in txt else None
                k_alvo = self.chave_alvo(alvo, TipoEntidade.PERSONAGEM)
                if k_alvo == chave:
                    continue
                r.alvos.append(alvo)
                r.entidades.append(Entidade(chave=k_alvo, nome=alvo, tipo=TipoEntidade.PERSONAGEM,
                                            atributos={"falecido": True} if "†" in txt else {}, fontes=[f"{doc_base}:perfil"]))
                linhas_ib.append(f"{secao}: {txt}")
                r.fatos.append(Fato(sujeito=chave, predicado=pred, objeto=k_alvo, evidencia=f"Relationships › {secao}: {txt}",
                                    tipo_evidencia=TipoEvidencia.CAMPO, campo=f"relationships.{secao}", doc_id=f"{doc_base}:perfil", url=url,
                                    qualificador=qual, confiabilidade=Confiabilidade.WIKI_FAS))
        r.documentos.append(Documento(doc_id=f"{doc_base}:perfil", titulo=f"{nome} — perfil (wiki do MCU)", url=url, tipo_fonte="wiki_mcu",
                                      texto="\n".join(linhas_ib), entidade=chave, confiabilidade=Confiabilidade.WIKI_FAS, licenca=LICENCA,
                                      secao="perfil"))
        r.entidades[0].apelidos = [a for a in apelidos][:12]

        # -------- Biography: capítulos cronológicos ancorados nas obras citadas
        h_bio = next((h for h in soup.select("h2") if _texto(h).startswith("Biography")), None)
        if h_bio:
            capitulo, sub, paragrafos, notas = None, None, [], []
            blocos: list[tuple[str, str | None, list[str], list[str]]] = []

            def fechar():
                if capitulo and paragrafos:
                    blocos.append((capitulo, sub, list(paragrafos), list(notas)))

            for el in h_bio.find_all_next():
                if el.name == "h2":
                    break
                if el.name in ("h3", "h4"):
                    fechar()
                    paragrafos.clear()
                    notas.clear()
                    if el.name == "h3":
                        capitulo, sub = _texto(el), None
                    else:
                        sub = _texto(el)
                    continue
                if el.name == "p" and el.find_parent("table") is None and el.find_parent("figure") is None \
                        and el.find_parent(class_=re.compile(r"thumb|caption|gallery")) is None:
                    notas += [a["href"].lstrip("#") for a in el.select("sup.reference a[href]")]
                    t = _texto(el)
                    if len(t) > 40:
                        paragrafos.append(t)
            fechar()
            ordem_cap: dict[str, int] = {}
            for n, (cap, sub_, pars, nts) in enumerate(blocos, 1):
                textos_ref = [refs.get(x, "") for x in nts]
                incertos = [t for t in textos_ref if any(k in t.lower() for k in _REF_INCERTA)]
                obras = [o for o in (self.obra_de(t) for t in textos_ref) if o]
                if textos_ref and len(incertos) == len(textos_ref):
                    r.descartados_incertos += 1
                    continue
                chaves_obras = list(dict.fromkeys(o[0] for o in obras))
                anos = [o[1] for o in obras if o[1]]
                ano = min(anos) if anos else None
                texto = "\n".join(pars)
                did = f"{doc_base}:bio:{n}"
                titulo_bloco = f"{nome} — {cap}" + (f" › {sub_}" if sub_ else "")
                r.documentos.append(Documento(doc_id=did, titulo=titulo_bloco, url=url, tipo_fonte="wiki_mcu", texto=texto, entidade=chave,
                                              confiabilidade=Confiabilidade.WIKI_FAS, licenca=LICENCA, obras=chaves_obras, ano=ano, ordem=n,
                                              secao=cap))
                if cap not in ordem_cap:  # um acontecimento por capítulo da trajetória
                    ordem_cap[cap] = len(ordem_cap) + 1
                    primeira = re.split(r"(?<=[.!?])\s+", pars[0])[0]
                    ev = Entidade(chave=f"event:{chave.split(':', 1)[1]}--wiki-{slug(cap)}", nome=f"{nome}: {cap}", tipo=TipoEntidade.ACONTECIMENTO,
                                  descricao=primeira, atributos={"ordem_na_trajetoria": ordem_cap[cap], "personagem": chave, "ano": ano},
                                  fontes=[did])
                    r.entidades.append(ev)
                    r.fatos.append(Fato(sujeito=chave, predicado=Predicado.VIVENCIA, objeto=ev.chave, evidencia=primeira, doc_id=did, url=url,
                                        ordem=ordem_cap[cap], ano=ano, obra=chaves_obras[0] if chaves_obras else None,
                                        confiabilidade=Confiabilidade.WIKI_FAS))
        return r


def pagina_confere(registro: dict, nome: str, apelidos: list[str]) -> bool:
    """A página da wiki é do mesmo personagem? Algum nome oficial tem de aparecer nos nomes da página."""
    soup = BeautifulSoup(registro["html"], "lxml")
    if not soup.select(".portable-infobox"):
        return False  # página de desambiguação ou sem ficha
    nomes = nomes_da_pagina(soup, registro["titulo"])
    oficiais = {normalizar(x) for x in [nome, *apelidos] if x}
    return any(o in nomes or any(o == n or (len(o) > 4 and o in n) for n in nomes) for o in oficiais)
