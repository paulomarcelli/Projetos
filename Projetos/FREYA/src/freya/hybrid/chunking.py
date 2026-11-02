"""Divisão dos documentos em trechos (chunks) por sentenças, com sobreposição.

O chunker da Manus tratava `CHUNK_SIZE=850` como caracteres ÷ 5 e cortava no meio das frases. Aqui o
limite é em palavras e o corte respeita frases e linhas, para que a evidência devolvida seja legível.
"""
from __future__ import annotations

import re

from pydantic import BaseModel

from freya.conhecimento.modelos import Documento

MAX_PALAVRAS = 160
SOBREPOSICAO_FRASES = 1


class Chunk(BaseModel):
    chunk_id: str
    doc_id: str
    texto: str
    titulo: str
    url: str
    entidade: str | None = None
    captura_id: str | None = None
    continuidade: str = "MCU"
    tipo_fonte: str = "official_marvel"
    ano: int | None = None
    secao: str | None = None


def _frases(texto: str) -> list[str]:
    partes = []
    for linha in texto.splitlines():
        linha = linha.strip()
        if linha:
            partes += [f.strip() for f in re.split(r"(?<=[.!?])\s+(?=[A-Z“\"'])", linha) if f.strip()]
    return partes


def dividir(doc: Documento, max_palavras: int = MAX_PALAVRAS, sobreposicao: int = SOBREPOSICAO_FRASES) -> list[Chunk]:
    frases = _frases(doc.texto)
    grupos: list[list[str]] = []
    atual: list[str] = []
    for f in frases:
        if atual and sum(len(x.split()) for x in atual) + len(f.split()) > max_palavras:
            grupos.append(atual)
            atual = atual[-sobreposicao:] if sobreposicao else []
        atual.append(f)
    if atual:
        grupos.append(atual)
    base = dict(doc_id=doc.doc_id, titulo=doc.titulo, url=doc.url, entidade=doc.entidade, captura_id=doc.captura_id,
                continuidade=doc.continuidade.value, tipo_fonte=doc.tipo_fonte, ano=doc.ano, secao=doc.secao)
    return [Chunk(chunk_id=f"{doc.doc_id}#{i}", texto="\n".join(g), **base) for i, g in enumerate(grupos)]
