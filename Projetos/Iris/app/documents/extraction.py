"""Extração do texto de cada página com o pypdf (só a camada de texto do PDF; sem OCR).

PDFs escaneados (páginas que são só imagem) não têm camada de texto: essas páginas ficam com
status `empty` e o documento com `text_extractable = false`. OCR fica para uma fase futura.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import BinaryIO

import pypdf
from pypdf import PdfReader

from app.db.models import PageStatus
from app.documents.normalization import limpar_bruto, normalizar

logger = logging.getLogger(__name__)

EXTRATOR = f"pypdf {pypdf.__version__}"


@dataclass(frozen=True)
class PaginaExtraida:
    numero: int  # 1 = primeira página
    texto: str  # normalizado
    texto_bruto: str  # como o extrator devolveu (só sem NUL)
    status: PageStatus
    erro: str | None = None  # tipo do erro (nunca a mensagem, que pode conter detalhes internos)

    @property
    def tem_texto(self) -> bool:
        return self.status is PageStatus.OK

    @property
    def sha256(self) -> str | None:
        return hashlib.sha256(self.texto.encode("utf-8")).hexdigest() if self.tem_texto else None


class PdfIlegivel(Exception):
    """O PDF não pôde ser aberto (corrompido ou protegido)."""


def abrir(arquivo: BinaryIO) -> PdfReader:
    """Abre o PDF a partir de um arquivo aberto (sem copiar tudo para a memória)."""
    try:
        leitor = PdfReader(arquivo, strict=False)
        if leitor.is_encrypted and not leitor.decrypt(""):
            raise PdfIlegivel("protegido por senha")
        _ = len(leitor.pages)
    except PdfIlegivel:
        raise
    except Exception as erro:
        raise PdfIlegivel(type(erro).__name__) from None
    return leitor


def extrair_paginas(leitor: PdfReader) -> list[PaginaExtraida]:
    """Uma entrada por página, na ordem do PDF. A falha de uma página não derruba as outras."""
    resultado: list[PaginaExtraida] = []
    for indice in range(len(leitor.pages)):
        numero = indice + 1
        try:
            bruto = leitor.pages[indice].extract_text() or ""
        except Exception as erro:
            logger.info("Falha ao extrair a página %d (%s)", numero, type(erro).__name__)
            resultado.append(
                PaginaExtraida(numero, "", "", PageStatus.ERROR, type(erro).__name__[:200])
            )
            continue
        bruto = limpar_bruto(bruto)
        texto = normalizar(bruto)
        status = PageStatus.OK if texto else PageStatus.EMPTY
        resultado.append(PaginaExtraida(numero, texto, bruto, status))
    return resultado
