"""Recuperação híbrida: busca vetorial + BM25, fundidas por Reciprocal Rank Fusion.

RRF: nota(d) = Σ 1 / (k_rrf + posição de d em cada lista). Diferenças em relação à Manus:
- cada lista traz `k × reserva` candidatos antes da fusão (a Manus fundia só os 5 primeiros de cada);
- no máximo `por_documento` trechos do mesmo documento no resultado, para variar as fontes;
- o resultado diz em que posição o trecho veio em cada lista (explica a nota).
"""
from __future__ import annotations

from pydantic import BaseModel

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Documento
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
        self._por_doc: dict[str, list[Chunk]] = {}  # trechos indexados neste processo, por documento (leitura direta)

    def _lembrar(self, chunks: list[Chunk]) -> None:
        for c in chunks:
            self._por_doc.setdefault(c.doc_id, []).append(c)

    def trechos(self, doc_ids: list[str]) -> list[ResultadoHibrido]:
        """Os trechos de documentos conhecidos, sem busca (os documentos-chave de um personagem estudado)."""
        return [ResultadoHibrido(chunk=c, nota_rrf=0.0) for d in dict.fromkeys(doc_ids) for c in self._por_doc.get(d, [])]

    def ultimos_capitulos(self, chave: str, n: int = 3) -> list[str]:
        """Os últimos capítulos da biografia de uma entidade (onde ela está agora), do mais antigo ao mais recente."""
        prefixo = f"wiki:{chave}:bio:"
        caps = sorted((d for d in self._por_doc if d.startswith(prefixo) and d[len(prefixo):].isdigit()), key=lambda d: int(d[len(prefixo):]))
        return caps[-n:]

    def indexar(self, corpus: Corpus) -> dict:
        chunks = [c for d in corpus.documentos.values() for c in dividir(d)]
        vetores = self.embedder.codificar([f"{c.titulo}\n{c.texto}" for c in chunks]) if chunks else []
        self.vetorial.recriar(self.embedder.dimensao)
        self.lexical.recriar()
        if chunks:
            self.vetorial.indexar(chunks, vetores)
            self.lexical.indexar(chunks)
        self._por_doc.clear()
        self._lembrar(chunks)
        return {"documentos": len(corpus.documentos), "chunks": len(chunks)}

    def adicionar(self, docs: list[Documento]) -> dict:
        """Indexa documentos novos sem recriar os índices (as notícias do Intelligence Day)."""
        chunks = [c for d in docs for c in dividir(d)]
        if chunks:
            self.vetorial.indexar(chunks, self.embedder.codificar([f"{c.titulo}\n{c.texto}" for c in chunks]))
            self.lexical.indexar(chunks)
        self._lembrar(chunks)
        return {"documentos": len(docs), "chunks": len(chunks)}

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
