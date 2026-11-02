"""Índices do Hybrid RAG: vetorial (Qdrant) e lexical (Elasticsearch BM25), com versões em memória.

As versões em memória (Qdrant em `:memory:` e BM25 com rank-bm25) têm a mesma interface e servem aos
testes e ao uso sem os serviços. Em produção: Qdrant e Elasticsearch, como na entrega da Manus.
"""
from __future__ import annotations

import hashlib
import math
import re
import uuid
from typing import Protocol

from freya.conhecimento.normalizacao import normalizar
from freya.hybrid.chunking import Chunk

_CAMPOS = ("chunk_id", "doc_id", "texto", "titulo", "url", "entidade", "captura_id", "continuidade", "tipo_fonte", "ano", "secao")


class Embedder(Protocol):
    dimensao: int

    def codificar(self, textos: list[str]) -> list[list[float]]: ...


class IndiceVetorial(Protocol):
    def recriar(self, dimensao: int) -> None: ...
    def indexar(self, chunks: list[Chunk], vetores: list[list[float]]) -> None: ...
    def buscar(self, vetor: list[float], k: int, continuidade: str = "MCU") -> list[Chunk]: ...


class IndiceLexical(Protocol):
    def recriar(self) -> None: ...
    def indexar(self, chunks: list[Chunk]) -> None: ...
    def buscar(self, consulta: str, k: int, continuidade: str = "MCU") -> list[Chunk]: ...


# ------------------------------------------------------------------ embeddings

class EmbedderSentenceTransformers:
    """Modelo multilíngue da Manus (consultas em português sobre textos em inglês)."""

    def __init__(self, modelo: str):
        from sentence_transformers import SentenceTransformer

        self._m = SentenceTransformer(modelo)
        self.dimensao = int(self._m.get_sentence_embedding_dimension())

    def codificar(self, textos: list[str]) -> list[list[float]]:
        return self._m.encode(textos, normalize_embeddings=True, batch_size=64, show_progress_bar=False).tolist()


class EmbedderHash:
    """Embedding determinístico por hashing de palavras: só para testes (não é semântico)."""

    def __init__(self, dimensao: int = 256):
        self.dimensao = dimensao

    def codificar(self, textos: list[str]) -> list[list[float]]:
        saida = []
        for t in textos:
            v = [0.0] * self.dimensao
            for palavra in re.findall(r"[a-z0-9]+", normalizar(t)):
                v[int(hashlib.md5(palavra.encode()).hexdigest(), 16) % self.dimensao] += 1.0
            n = math.sqrt(sum(x * x for x in v)) or 1.0
            saida.append([x / n for x in v])
        return saida


# ------------------------------------------------------------------ Qdrant

class IndiceQdrant:
    def __init__(self, url: str | None = None, colecao: str = "freya_chunks", cliente=None):
        from qdrant_client import QdrantClient

        self.cliente = cliente or (QdrantClient(location=":memory:") if url in (None, ":memory:") else QdrantClient(url=url))
        self.colecao = colecao

    def recriar(self, dimensao: int) -> None:
        from qdrant_client import models

        if self.cliente.collection_exists(self.colecao):
            self.cliente.delete_collection(self.colecao)
        self.cliente.create_collection(self.colecao, vectors_config=models.VectorParams(size=dimensao, distance=models.Distance.COSINE))
        self.cliente.create_payload_index(self.colecao, "continuidade", models.PayloadSchemaType.KEYWORD)

    def indexar(self, chunks: list[Chunk], vetores: list[list[float]]) -> None:
        from qdrant_client import models

        pontos = [models.PointStruct(id=str(uuid.uuid5(uuid.NAMESPACE_URL, c.chunk_id)), vector=v, payload=c.model_dump(include=set(_CAMPOS)))
                  for c, v in zip(chunks, vetores)]
        for i in range(0, len(pontos), 256):
            self.cliente.upsert(self.colecao, pontos[i:i + 256])

    def buscar(self, vetor: list[float], k: int, continuidade: str = "MCU") -> list[Chunk]:
        from qdrant_client import models

        filtro = models.Filter(must=[models.FieldCondition(key="continuidade", match=models.MatchValue(value=continuidade))])
        pontos = self.cliente.query_points(collection_name=self.colecao, query=vetor, limit=k, query_filter=filtro).points
        return [Chunk.model_validate(p.payload) for p in pontos]


# ------------------------------------------------------------------ Elasticsearch (BM25)

_MAPEAMENTO = {
    "properties": {
        "texto": {"type": "text", "analyzer": "standard",
                  "fields": {"en": {"type": "text", "analyzer": "english"}, "pt": {"type": "text", "analyzer": "portuguese"}}},
        "titulo": {"type": "text", "fields": {"en": {"type": "text", "analyzer": "english"}}},
        **{c: {"type": "keyword"} for c in ("chunk_id", "doc_id", "url", "entidade", "captura_id", "continuidade", "tipo_fonte", "secao")},
        "ano": {"type": "integer"},
    }
}


class IndiceElasticsearch:
    def __init__(self, url: str, indice: str = "freya_chunks", cliente=None):
        from elasticsearch import Elasticsearch

        self.cliente = cliente or Elasticsearch(url, request_timeout=60)
        self.indice = indice

    def recriar(self) -> None:
        if self.cliente.indices.exists(index=self.indice):
            self.cliente.indices.delete(index=self.indice)
        self.cliente.indices.create(index=self.indice, mappings=_MAPEAMENTO)

    def indexar(self, chunks: list[Chunk]) -> None:
        from elasticsearch.helpers import bulk

        bulk(self.cliente, ({"_index": self.indice, "_id": c.chunk_id, "_source": c.model_dump(include=set(_CAMPOS))} for c in chunks))
        self.cliente.indices.refresh(index=self.indice)

    def buscar(self, consulta: str, k: int, continuidade: str = "MCU") -> list[Chunk]:
        q = {"bool": {"must": {"multi_match": {"query": consulta, "fields": ["texto", "texto.en", "texto.pt", "titulo^2", "titulo.en^2"],
                                               "type": "most_fields"}},
                      "filter": {"term": {"continuidade": continuidade}}}}
        hits = self.cliente.search(index=self.indice, query=q, size=k)["hits"]["hits"]
        return [Chunk.model_validate(h["_source"]) for h in hits]


class IndiceLexicalMemoria:
    """BM25 em memória (rank-bm25), com o mesmo pré-processamento para pt e en (sem stemming)."""

    def __init__(self):
        self.chunks: list[Chunk] = []
        self._bm25 = None

    @staticmethod
    def _tokens(t: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", normalizar(t))

    def recriar(self) -> None:
        self.chunks, self._bm25 = [], None

    def indexar(self, chunks: list[Chunk]) -> None:
        from rank_bm25 import BM25Okapi

        self.chunks += chunks
        self._bm25 = BM25Okapi([self._tokens(c.titulo + " " + c.texto) for c in self.chunks])

    def buscar(self, consulta: str, k: int, continuidade: str = "MCU") -> list[Chunk]:
        if not self._bm25:
            return []
        notas = self._bm25.get_scores(self._tokens(consulta))
        ordem = sorted(range(len(self.chunks)), key=lambda i: notas[i], reverse=True)
        return [self.chunks[i] for i in ordem if notas[i] > 0 and self.chunks[i].continuidade == continuidade][:k]
