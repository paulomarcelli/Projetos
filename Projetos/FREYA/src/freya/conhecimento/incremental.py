"""Conhecimento que chega com a API no ar (notícias, estudos de personagem): junta-se à base sem recriá-la.

Cada fonte guarda o que leu num corpus próprio (`pasta/corpus`) e um `estado.json`; ao reiniciar a API, a base
é recriada e `reaplicar()` devolve esse conhecimento aos índices e ao grafo.
"""
from __future__ import annotations

import json
from pathlib import Path

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Entidade
from freya.conhecimento.ontologia import TipoEntidade
from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.hybrid.recuperador import RecuperadorHibrido


def aplicar(hibrido: RecuperadorHibrido, grafo: ArmazenamentoGrafo, corpus: Corpus) -> dict:
    """Junta um corpus aos índices e ao grafo: entidades novas, arestas entre nós existentes e os trechos no RAG."""
    novas = grafo.adicionar_entidades(list(corpus.entidades.values()))
    arestas = grafo.adicionar_fatos(list(corpus.fatos.values()))
    rag = hibrido.adicionar(list(corpus.documentos.values()))
    return {"entidades_novas": novas, "relacoes": arestas, "trechos": rag["chunks"]}


def corpus_do_grafo(grafo: ArmazenamentoGrafo) -> Corpus:
    """As entidades do grafo como corpus (para reconhecer nomes e indexar obras), sem documentos nem fatos."""
    c = Corpus()
    for no in grafo.nos():
        try:
            c.adicionar_entidade(Entidade(chave=no.chave, nome=no.nome, tipo=TipoEntidade(no.tipo), apelidos=no.apelidos,
                                          atributos={k: v for k, v in no.atributos.items() if isinstance(v, (str, int, float))}))
        except ValueError:
            continue
    return c


class Guardado:
    """Corpus e estado de uma fonte incremental, em disco."""

    def __init__(self, pasta: str | Path, estado_inicial: dict):
        self.pasta = Path(pasta)
        self._arq = self.pasta / "estado.json"
        self.estado: dict = json.loads(self._arq.read_text(encoding="utf-8")) if self._arq.exists() else estado_inicial

    def salvar_estado(self) -> None:
        self.pasta.mkdir(parents=True, exist_ok=True)
        self._arq.write_text(json.dumps(self.estado, ensure_ascii=False, indent=1), encoding="utf-8")

    def corpus(self) -> Corpus:
        return Corpus.carregar(self.pasta / "corpus") if (self.pasta / "corpus").exists() else Corpus()

    def juntar(self, novo: Corpus) -> None:
        self.corpus().unir(novo).salvar(self.pasta / "corpus")
