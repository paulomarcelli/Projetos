"""Recuperação híbrida: busca vetorial + BM25, fundidas por Reciprocal Rank Fusion.

RRF: nota(d) = Σ 1 / (k_rrf + posição de d em cada lista). Diferenças em relação à Manus:
- cada lista traz `k × reserva` candidatos antes da fusão (a Manus fundia só os 5 primeiros de cada);
- no máximo `por_documento` trechos do mesmo documento no resultado, para variar as fontes;
- o resultado diz em que posição o trecho veio em cada lista (explica a nota).
"""
from __future__ import annotations

from pydantic import BaseModel

from freya.conhecimento.corpus import Corpus
from freya.hybrid.chunking import Chunk, dividir
from freya.hybrid.indices import Embedder, IndiceLexical, IndiceVetorial


class ResultadoHibrido(BaseModel):
    chunk: Chunk
    nota_rrf: float
    posicao_vetorial: int | None = None
    posicao_lexical: int | None = None


class RecuperadorHibrido:
    def __init__(self, embedder: Embedder, vetorial: IndiceVetorial, lexical: IndiceLexical, k_rrf: int = 60):
        self.embedder, self.vetorial, self.lexical, self.k_rrf = embedder, vetorial, lexical, k_rrf

    def indexar(self, corpus: Corpus) -> dict:
        chunks = [c for d in corpus.documentos.values() for c in dividir(d)]
        vetores = self.embedder.codificar([f"{c.titulo}\n{c.texto}" for c in chunks]) if chunks else []
        self.vetorial.recriar(self.embedder.dimensao)
        self.lexical.recriar()
        if chunks:
            self.vetorial.indexar(chunks, vetores)
            self.lexical.indexar(chunks)
        return {"documentos": len(corpus.documentos), "chunks": len(chunks)}

    def buscar(self, consulta: str, k: int = 8, reserva: int = 6, por_documento: int = 2) -> list[ResultadoHibrido]:
        if not consulta.strip():
            return []
        n = k * reserva
        vet = self.vetorial.buscar(self.embedder.codificar([consulta])[0], n)
        lex = self.lexical.buscar(consulta, n)
        notas: dict[str, ResultadoHibrido] = {}
        for pos, c in enumerate(vet, 1):
            notas[c.chunk_id] = ResultadoHibrido(chunk=c, nota_rrf=1 / (self.k_rrf + pos), posicao_vetorial=pos)
        for pos, c in enumerate(lex, 1):
            r = notas.get(c.chunk_id) or ResultadoHibrido(chunk=c, nota_rrf=0.0)
            r.nota_rrf += 1 / (self.k_rrf + pos)
            r.posicao_lexical = pos
            notas[c.chunk_id] = r
        saida, por_doc = [], {}
        for r in sorted(notas.values(), key=lambda x: x.nota_rrf, reverse=True):
            if por_doc.get(r.chunk.doc_id, 0) >= por_documento:
                continue
            por_doc[r.chunk.doc_id] = por_doc.get(r.chunk.doc_id, 0) + 1
            saida.append(r)
            if len(saida) == k:
                break
        return saida
