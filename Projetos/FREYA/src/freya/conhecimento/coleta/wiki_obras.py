"""Páginas de obras na wiki do MCU: enredo e o que aparece em cada filme ou série.

- "Plot" (e "Synopsis"): o enredo detalhado, que vira documento ancorado na obra e no ano, e é a matéria-prima
  da extração de relações narrativas (conhecimento/extracao.py);
- "Appearances": personagens, organizações, locais, acontecimentos, objetos e conceitos de cada obra. Cada item
  vira `APPEARS_IN` (entidade → obra), o que dá ao grafo os artefatos (Joias do Infinito, Tesseract) e os
  acontecimentos (o Estalo, a Batalha de Titã) que faltavam, cada um ligado ao seu tempo.

Itens marcados como "(mentioned)", "(background)", "(photo)" etc. não contam como aparição.
"""
from __future__ import annotations

from bs4 import BeautifulSoup

from freya.conhecimento.coleta.wiki_mcu import BASE_WIKI, LICENCA, _QUALIFICADORES_FRACOS, _texto
from freya.conhecimento.modelos import Confiabilidade, Documento, Entidade, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import slug
from freya.conhecimento.ontologia import Predicado, TipoEntidade

_SECOES = {
    None: TipoEntidade.PERSONAGEM, "Characters": TipoEntidade.PERSONAGEM, "Locations": TipoEntidade.LOCAL, "Events": TipoEntidade.ACONTECIMENTO,
    "Items": TipoEntidade.ARTEFATO, "Organizations": TipoEntidade.ORGANIZACAO, "Concepts": TipoEntidade.CONCEITO,
    "Technology": TipoEntidade.TECNOLOGIA,
}
_IGNORAR = ("Media", "Vehicles", "Creatures", "Sapient Species", "Mentioned Characters", "Species", "Songs", "Music")


def ler_obra_wiki(registro: dict, chave_obra: str, nome_obra: str, ano: int | None, titulo_para_chave: dict[str, str]) -> tuple[list[Documento], list[Entidade], list[Fato]]:
    soup = BeautifulSoup(registro["html"], "lxml")
    url = BASE_WIKI + registro["titulo"].replace(" ", "_")
    docs, ents, fatos = [], [], []

    def secao(nome: str) -> list[str]:
        h = next((x for x in soup.select("h2") if _texto(x) == nome), None)
        pars = []
        if h:
            for el in h.find_all_next():
                if el.name == "h2":
                    break
                if el.name == "p" and el.find_parent("figure") is None:
                    t = _texto(el)
                    if len(t) > 40:
                        pars.append(t)
        return pars

    for nome_secao in ("Synopsis", "Plot"):
        pars = secao(nome_secao)
        if pars:
            docs.append(Documento(doc_id=f"wiki:{chave_obra}:{nome_secao.lower()}", titulo=f"{nome_obra} — {nome_secao} (wiki do MCU)", url=url,
                                  tipo_fonte="wiki_mcu", texto="\n".join(pars), entidade=chave_obra, confiabilidade=Confiabilidade.WIKI_FAS,
                                  licenca=LICENCA, obras=[chave_obra], ano=ano, secao=nome_secao.lower()))

    h = next((x for x in soup.select("h2") if _texto(x) == "Appearances"), None)
    if h:
        doc_id = f"wiki:{chave_obra}:aparicoes"
        linhas = [f"{nome_obra} — aparições (wiki do MCU)"]
        sec = None
        for el in h.find_all_next():
            if el.name == "h2":
                break
            if el.name in ("h3", "h4"):
                sec = _texto(el)
                continue
            if sec in _IGNORAR or el.name != "li" or el.find("ul"):
                continue
            tipo = _SECOES.get(sec)
            a = el.select_one("a[title]")
            if not tipo or not a or a["title"].startswith("wikipedia:"):
                continue
            txt = _texto(el)
            if any(q in txt.lower() for q in _QUALIFICADORES_FRACOS + ("background",)):
                continue
            alvo = a["title"].split("/")[0].strip()
            chave = titulo_para_chave.get(a["title"]) or titulo_para_chave.get(alvo) or f"{tipo.value}:{slug(alvo)}"
            ents.append(Entidade(chave=chave, nome=alvo, tipo=tipo, fontes=[doc_id]))
            linhas.append(f"{sec or 'Characters'}: {txt}")
            fatos.append(Fato(sujeito=chave, predicado=Predicado.APARECE_EM, objeto=chave_obra, evidencia=f"Appearances › {sec or 'Characters'}: {txt}",
                              tipo_evidencia=TipoEvidencia.CAMPO, campo=f"appearances.{sec or 'characters'}", doc_id=doc_id, url=url, ano=ano,
                              obra=chave_obra, confiabilidade=Confiabilidade.WIKI_FAS))
        docs.append(Documento(doc_id=doc_id, titulo=f"{nome_obra} — aparições (wiki do MCU)", url=url, tipo_fonte="wiki_mcu", texto="\n".join(linhas),
                              entidade=chave_obra, confiabilidade=Confiabilidade.WIKI_FAS, licenca=LICENCA, obras=[chave_obra], ano=ano,
                              secao="aparicoes"))
    return docs, ents, fatos


_ORDINAIS = {1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five"}


def _base_e_temporada(nome: str) -> tuple[str, int | None]:
    import re

    m = re.match(r"(.*?)\s*\|\s*Season\s*(\d+)", nome, re.I)
    base = (m.group(1) if m else nome).strip()
    base = re.sub(r"^(Marvel(?: Studios)?'s?\s*)", "", base, flags=re.I).strip()
    return base, (int(m.group(2)) if m else None)


def eh_pagina_de_obra(registro: dict, nome: str) -> bool:
    """A página é da obra certa? Marcas de obra + nome completo igual + mesma temporada, quando houver."""
    import re

    from freya.conhecimento.normalizacao import normalizar

    soup = BeautifulSoup(registro["html"], "lxml")
    fontes = {it.get("data-source") for it in soup.select(".pi-item.pi-data")}
    marcas = {"release", "released", "release date", "director", "directors", "network", "episodes", "premiere", "first aired", "season",
              "running time", "budget"} & fontes
    if not marcas and not ({"Plot", "Synopsis", "Episodes"} & {_texto(h) for h in soup.select("h2")}):
        return False
    base, temporada = _base_e_temporada(nome)
    titulo = registro["titulo"]
    m = re.search(r"/Season (\w+)$", titulo)
    serie = re.sub(r"\s*\((TV series|film|TV special|miniseries)\)", "", titulo.split("/")[0])

    def limpo(x: str) -> str:
        return normalizar(re.sub(r"^The\s+", "", x, flags=re.I)).replace("-", " ").replace(":", "")

    if limpo(serie) != limpo(base):
        return False
    if m:  # página de temporada: tem de ser a mesma
        return temporada is not None and m.group(1) == _ORDINAIS.get(temporada, str(temporada))
    return temporada in (None, 1)  # página da série inteira só vale para a 1ª temporada (ou minissérie)


def titulos_da_obra(nome: str, tipo: TipoEntidade) -> list[str]:
    import re

    m = re.match(r"(.*?)\s*\|\s*Season\s*(\d+)", nome, re.I)
    base = (m.group(1) if m else nome).strip()
    base = re.sub(r"^Marvel(?: Studios)?'s?\s*", "", base)
    if tipo == TipoEntidade.SERIE:
        base, temporada = _base_e_temporada(nome)
        n = temporada or 1
        o = _ORDINAIS.get(n, n)
        return [f"{base} (TV series)/Season {o}", f"{base}/Season {o}", f"{base} (TV series)", base, f"{base} (TV special)"]
    sem_artigo = re.sub(r"^The\s+", "", base)
    minusc = re.sub(r"\b(And|The|Of|In|On|At)\b", lambda m: m.group(1).lower(), base[0] + base[1:]) if len(base) > 1 else base
    minusc = minusc[0].upper() + minusc[1:]
    return list(dict.fromkeys([base, minusc, sem_artigo, f"{base} (film)", f"{sem_artigo} (film)"]))
