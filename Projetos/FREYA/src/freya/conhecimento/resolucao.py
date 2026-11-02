"""Resolução de entidades entre fontes: o mesmo personagem, obra ou organização com nomes diferentes.

A coleta oficial (marvel.com) é a referência: suas chaves vêm da URL oficial (`character:iron-man-tony-stark`).
Uma entidade de outra fonte (ex.: o corpus da Manus, `character:tony-stark`) é fundida à oficial quando
um dos nomes dela, normalizado, coincide com o nome ou um apelido oficial de UMA única entidade de tipo
compatível. Se coincidir com duas ou mais, o nome é ambíguo (ex.: "Captain America" = Steve Rogers e
Sam Wilson) e nada é fundido: a ambiguidade fica registrada no relatório, em vez de virar um erro no grafo.
"""
from __future__ import annotations

from collections import defaultdict

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Entidade, Fato
from freya.conhecimento.normalizacao import normalizar
from freya.conhecimento.ontologia import OBRAS, TipoEntidade

_PREFIXOS = ("dr. ", "doctor ", "the ", "marvel's ", "marvel studios' ", "marvel studios ")


def variantes(nome: str) -> set[str]:
    n = normalizar(nome).replace(" | ", " ").replace("|", " ")
    formas = {n, n.replace("'", "")}
    for p in _PREFIXOS:
        if n.startswith(p):
            formas.add(n[len(p):])
    # "loki season 1" ~ "loki" temporada 1: a chave oficial guarda a temporada no fim
    return {f.strip() for f in formas if f.strip()}


def _grupo(tipo: TipoEntidade) -> str:
    return "obra" if tipo in OBRAS else tipo.value


def _nomes(e: Entidade) -> set[str]:
    s = set()
    for n in [e.nome, *e.apelidos]:
        if n:
            s |= variantes(n)
    return s


def resolver(oficial: Corpus, outro: Corpus) -> tuple[Corpus, dict]:
    """Une `outro` a `oficial`, reescrevendo as chaves de `outro` que correspondem a entidades oficiais."""
    indice: dict[tuple[str, str], set[str]] = defaultdict(set)
    for e in oficial.entidades.values():
        for n in _nomes(e):
            indice[(_grupo(e.tipo), n)].add(e.chave)

    mapa: dict[str, str] = {}
    ambiguos: dict[str, list[str]] = {}
    for e in outro.entidades.values():
        if e.chave in oficial.entidades:
            mapa[e.chave] = e.chave
            continue
        # primeiro o nome próprio da entidade; os apelidos só entram se o nome não decidir
        candidatos: set[str] = set()
        for n in variantes(e.nome):
            candidatos |= indice.get((_grupo(e.tipo), n), set())
        if len(candidatos) != 1:
            for n in _nomes(e):
                candidatos |= indice.get((_grupo(e.tipo), n), set())
        if len(candidatos) == 1:
            mapa[e.chave] = next(iter(candidatos))
        elif len(candidatos) > 1:
            ambiguos[e.chave] = sorted(candidatos)

    unido = Corpus().unir(oficial)
    for d in outro.documentos.values():
        unido.adicionar_documento(d)
    for e in outro.entidades.values():
        destino = mapa.get(e.chave, e.chave)
        if destino != e.chave:
            unido.adicionar_entidade(Entidade(chave=destino, nome=unido.entidades[destino].nome, tipo=unido.entidades[destino].tipo,
                                              apelidos=[e.nome, *e.apelidos], atributos=e.atributos, fontes=e.fontes))
        else:
            unido.adicionar_entidade(e)
    for f in outro.fatos.values():
        novo = f.model_copy(update={"sujeito": mapa.get(f.sujeito, f.sujeito), "objeto": mapa.get(f.objeto, f.objeto)})
        if novo.sujeito != novo.objeto:
            unido.adicionar_fato(Fato.model_validate(novo.model_dump()))
    relatorio = {
        "fundidas": {k: v for k, v in mapa.items() if k != v},
        "ambiguas": ambiguos,
        "mantidas_sem_correspondencia": sorted(k for k in outro.entidades if k not in mapa and k not in ambiguos),
    }
    return unido, relatorio
