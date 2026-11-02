"""Estruturas do grafo devolvidas pelo GraphRAG: nós, arestas (com evidência), caminhos e subgrafos."""
from __future__ import annotations

from pydantic import BaseModel, Field


class EvidenciaAresta(BaseModel):
    citacao: str
    tipo: str  # texto | campo_estruturado
    campo: str | None = None
    doc_id: str
    url: str
    captura_id: str | None = None
    confiabilidade: str = "oficial"


class No(BaseModel):
    chave: str
    nome: str
    tipo: str
    apelidos: list[str] = Field(default_factory=list)
    descricao: str | None = None
    atributos: dict = Field(default_factory=dict)


class Aresta(BaseModel):
    id: str
    origem: str
    destino: str
    predicado: str
    predicado_original: str | None = None
    ordem: int | None = None
    ano: int | None = None
    obra: str | None = None
    qualificador: str | None = None
    evidencia: EvidenciaAresta


class Caminho(BaseModel):
    nos: list[str]  # chaves, na ordem
    arestas: list[Aresta]  # arestas[i] liga nos[i] e nos[i+1] (em qualquer direção)

    @property
    def saltos(self) -> int:
        return len(self.arestas)


class Subgrafo(BaseModel):
    nos: dict[str, No] = Field(default_factory=dict)
    arestas: dict[str, Aresta] = Field(default_factory=dict)

    def juntar(self, outro: "Subgrafo") -> "Subgrafo":
        self.nos.update(outro.nos)
        self.arestas.update(outro.arestas)
        return self
