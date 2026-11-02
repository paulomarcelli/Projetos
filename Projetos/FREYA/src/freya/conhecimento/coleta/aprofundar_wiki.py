"""Aprofundamento pela wiki do MCU: parte das entidades oficiais e traz relações, nuances e biografias.

1. Para cada personagem oficial, procura a página da wiki pelo nome civil, pelos apelidos e pelo nome, e só a
   aceita se a identidade conferir (wiki_mcu.pagina_confere).
2. Junta os títulos citados nas relações e resolve os redirecionamentos da wiki, para ligar "Loki Laufeyson"
   ao Loki oficial quando a página dele também foi encontrada.
3. Lê as páginas e grava o corpus em data/corpus/wiki/ (fora do git; licença CC BY-SA 3.0 com atribuição).
"""
from __future__ import annotations

import logging
import re

from bs4 import BeautifulSoup

from freya.conhecimento.coleta.wiki_mcu import ClienteWiki, LeitorWiki, pagina_confere
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.normalizacao import normalizar
from freya.conhecimento.ontologia import OBRAS, TipoEntidade
from freya.conhecimento.resolucao import variantes

log = logging.getLogger(__name__)


def indice_de_obras(corpus: Corpus) -> dict[str, tuple[str, int | None]]:
    obras: dict[str, tuple[str, int | None]] = {}
    for e in corpus.entidades.values():
        if e.tipo in OBRAS:
            ano = e.atributos.get("ano")
            for v in variantes(e.nome):
                obras.setdefault(v.replace(" | ", " ").replace("season ", "season "), (e.chave, ano if isinstance(ano, int) else None))
                base = v.split(" season ")[0].strip()
                obras.setdefault(base, (e.chave, ano if isinstance(ano, int) else None))
    return obras


_HONORIFICOS = re.compile(r"^(the|dr\.?|doctor|queen|king|prince|princess|general|agent|captain|lord|lady|mr\.?|mrs\.?|ms\.?)\s+", re.I)


def _candidatos(nome: str, apelidos: list[str], identidade: str | None) -> list[str]:
    vistos, saida = set(), []
    for t in [identidade, *apelidos, nome]:
        if not t:
            continue
        for v in (t, _HONORIFICOS.sub("", t), t.title()):
            if v and normalizar(v) not in vistos:
                vistos.add(normalizar(v))
                saida.append(v)
    return saida


def _primeira_que_confere(cliente: ClienteWiki, titulos: list[str], e) -> dict | None:
    for titulo in titulos:
        reg = cliente.pagina(titulo)
        nomes = [x for n in [e.nome, *e.apelidos] for x in (n, _HONORIFICOS.sub("", n), re.sub(r"^the\s+", "", n, flags=re.I))]
        if reg and pagina_confere(reg, e.nome, nomes):
            return reg
    return None


def aprofundar(oficial: Corpus, cliente: ClienteWiki, limite: int | None = None) -> tuple[Corpus, dict]:
    rel = {"personagens": 0, "encontradas": 0, "nao_encontradas": [], "paginas_lidas": 0, "trechos_incertos_descartados": 0,
           "aparicoes_ignoradas": 0}
    personagens = [e for e in oficial.entidades.values() if e.tipo == TipoEntidade.PERSONAGEM and e.atributos.get("url")]
    personagens += [e for e in oficial.entidades.values() if e.tipo == TipoEntidade.PERSONAGEM and not e.atributos.get("url")]
    if limite:
        personagens = personagens[:limite]
    rel["personagens"] = len(personagens)

    achadas: dict[str, tuple[str, dict]] = {}  # chave oficial -> (título canônico, registro)
    for e in personagens:
        candidatos = _candidatos(e.nome, e.apelidos, e.atributos.get("identidade"))
        reg = _primeira_que_confere(cliente, candidatos, e)
        if reg is None:  # nome que não é título: busca da wiki, com a mesma conferência de identidade
            termo = e.atributos.get("identidade") or _HONORIFICOS.sub("", e.nome)
            reg = _primeira_que_confere(cliente, cliente.buscar(termo), e)
        if reg and reg["titulo"] not in {t for t, _ in achadas.values()}:
            achadas[e.chave] = (reg["titulo"], reg)
        elif reg is None:
            rel["nao_encontradas"].append(e.chave)
    rel["encontradas"] = len(achadas)

    # títulos citados nas relações -> título canônico -> chave oficial
    citados = set()
    for _, reg in achadas.values():
        soup = BeautifulSoup(reg["html"], "lxml")
        citados |= {a["title"] for a in soup.select(".portable-infobox a[title], h2 ~ ul li a[title]")}
    canonico = cliente.resolver_titulos(sorted(citados))
    titulo_para_chave = {t: ch for ch, (t, _) in achadas.items()}
    for link, canon in canonico.items():
        if canon in titulo_para_chave:
            titulo_para_chave[link] = titulo_para_chave[canon]

    leitor = LeitorWiki(indice_de_obras(oficial), titulo_para_chave)
    wiki = Corpus()
    for ch, (_, reg) in achadas.items():
        e = oficial.entidades[ch]
        r = leitor.ler(reg, ch, e.nome, e.tipo)
        rel["paginas_lidas"] += 1
        rel["trechos_incertos_descartados"] += r.descartados_incertos
        rel["aparicoes_ignoradas"] += r.aparicoes_ignoradas
        for d in r.documentos:
            wiki.adicionar_documento(d)
        for x in r.entidades:
            wiki.adicionar_entidade(x)
        for f in r.fatos:
            wiki.adicionar_fato(f)
    rel["resumo"] = wiki.resumo()
    return wiki, rel


def aprofundar_obras(oficial: Corpus, cliente: ClienteWiki, obras_oficiais: list[str], titulo_para_chave: dict[str, str]) -> tuple[Corpus, dict]:
    """Enredo e aparições de cada obra da cronologia oficial, a partir das páginas de obra da wiki."""
    from freya.conhecimento.coleta.wiki_obras import eh_pagina_de_obra, ler_obra_wiki, titulos_da_obra

    saida, rel = Corpus(), {"obras": 0, "com_pagina": 0, "sem_pagina": []}
    for ch in dict.fromkeys(obras_oficiais):
        e = oficial.entidades.get(ch)
        if not e:
            continue
        rel["obras"] += 1
        tentativas = titulos_da_obra(e.nome, e.tipo)
        tentativas += [t for t in cliente.buscar(re.sub(r"\s*\|.*$", "", e.nome)) if t not in tentativas][:2]
        for titulo in tentativas:
            reg = cliente.pagina(titulo)
            if not reg or not eh_pagina_de_obra(reg, e.nome):
                continue
            ano = e.atributos.get("ano") if isinstance(e.atributos.get("ano"), int) else None
            docs, ents, fatos = ler_obra_wiki(reg, ch, e.nome, ano, titulo_para_chave)
            if not docs:
                continue
            for d in docs:
                saida.adicionar_documento(d)
            for x in ents:
                saida.adicionar_entidade(x)
            for f in fatos:
                if f.sujeito != f.objeto:
                    saida.adicionar_fato(f)
            rel["com_pagina"] += 1
            break
        else:
            rel["sem_pagina"].append(ch)
    rel["resumo"] = saida.resumo()
    return saida, rel


def mapa_de_titulos(oficial: Corpus, wiki: Corpus) -> dict[str, str]:
    """Título da wiki -> chave oficial, a partir das páginas de personagem já lidas."""
    mapa = {}
    for e in wiki.entidades.values():
        t = e.atributos.get("wiki_titulo")
        if t and e.chave in oficial.entidades:
            mapa[t] = e.chave
    return mapa
