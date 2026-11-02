"""Registro de evidências de uma investigação.

É o elo comum entre os três mecanismos: cada trecho recuperado pelo Hybrid RAG e cada relação ou momento
recuperado pelo GraphRAG recebe um id (E1, E2…). O motor prospectivo só pode citar esses ids, o validador
confere cada citação e o grafo visual liga cada aresta às mesmas evidências.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, PrivateAttr

from freya.graph.modelos import Aresta
from freya.hybrid.recuperador import ResultadoHibrido


class Fonte(BaseModel):
    doc_id: str
    url: str
    titulo: str | None = None
    captura_id: str | None = None
    confiabilidade: str = "oficial"
    licenca: str | None = None


class Evidencia(BaseModel):
    id: str
    tipo: str  # trecho | relacao | momento | aparicao
    texto: str  # trecho literal ou citação/campo que sustenta a relação
    fonte: Fonte
    chunk_id: str | None = None
    aresta_id: str | None = None
    entidades: list[str] = Field(default_factory=list)
    nota: float | None = None  # nota RRF, para trechos


class RegistroDeEvidencias(BaseModel):
    itens: dict[str, Evidencia] = Field(default_factory=dict)
    _por_origem: dict[str, str] = PrivateAttr(default_factory=dict)

    def model_post_init(self, __context) -> None:
        self._por_origem = {(e.chunk_id or e.aresta_id or ""): e.id for e in self.itens.values()}

    def _novo_id(self) -> str:
        return f"E{len(self.itens) + 1}"

    def de_trecho(self, r: ResultadoHibrido) -> str:
        if r.chunk.chunk_id in self._por_origem:
            return self._por_origem[r.chunk.chunk_id]
        e = Evidencia(id=self._novo_id(), tipo="trecho", texto=r.chunk.texto, chunk_id=r.chunk.chunk_id, nota=round(r.nota_rrf, 5),
                      fonte=Fonte(doc_id=r.chunk.doc_id, url=r.chunk.url, titulo=r.chunk.titulo, captura_id=r.chunk.captura_id,
                                  confiabilidade=r.chunk.confiabilidade),
                      entidades=[r.chunk.entidade] if r.chunk.entidade else [])
        self.itens[e.id] = e
        self._por_origem[r.chunk.chunk_id] = e.id
        return e.id

    def de_aresta(self, a: Aresta, tipo: str = "relacao") -> str:
        if a.id in self._por_origem:
            return self._por_origem[a.id]
        e = Evidencia(id=self._novo_id(), tipo=tipo, texto=a.evidencia.citacao, aresta_id=a.id,
                      fonte=Fonte(doc_id=a.evidencia.doc_id, url=a.evidencia.url, captura_id=a.evidencia.captura_id,
                                  confiabilidade=a.evidencia.confiabilidade),
                      entidades=[a.origem, a.destino])
        self.itens[e.id] = e
        self._por_origem[a.id] = e.id
        return e.id

    def id_da_aresta(self, aresta_id: str) -> str | None:
        return self._por_origem.get(aresta_id)

    def existe(self, eid: str) -> bool:
        return eid in self.itens
