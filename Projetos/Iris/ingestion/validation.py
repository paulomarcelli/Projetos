"""Validação do upload, feita ANTES de tocar no banco.

Ordem: nome/extensão → tipo declarado → cópia em streaming (tamanho, SHA-256, assinatura) →
estrutura do PDF. Qualquer recusa apaga o arquivo temporário.

O PDF nunca é "executado": o pypdf só lê a estrutura e o texto; JavaScript, formulários e anexos
embutidos são ignorados. Nenhum visualizador ou conversor externo é chamado.
"""

from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import BinaryIO

from pypdf import PdfReader

from ingestion import errors

logger = logging.getLogger(__name__)

MIMES_ACEITOS = frozenset({"application/pdf", "application/x-pdf"})
ASSINATURA = b"%PDF-"
BLOCO = 1024 * 1024  # 1 MB por leitura: o arquivo nunca fica inteiro na memória
MAX_NOME = 255
_ESPACOS = re.compile(r"\s+")


@dataclass(frozen=True)
class ArquivoValidado:
    temporario: Path
    nome: str
    mime: str
    sha256: str
    tamanho: int
    paginas: int


def sanitizar_nome(nome: str | None) -> str:
    """Nome só para EXIBIÇÃO (nunca vira caminho): sem pastas, controles nem tamanho excessivo."""
    nome = (nome or "").replace("\\", "/")
    nome = PurePosixPath(nome).name if nome else ""
    nome = unicodedata.normalize("NFC", nome)
    # Remove controles, caracteres de formatação invisíveis e de uso privado (categoria "C").
    nome = "".join(c for c in nome if unicodedata.category(c)[0] != "C")
    nome = _ESPACOS.sub(" ", nome).strip().strip(".").strip()
    if len(nome) > MAX_NOME:
        sufixo = PurePosixPath(nome).suffix[:10]
        nome = nome[: MAX_NOME - len(sufixo)] + sufixo
    return nome


def validar_nome_e_tipo(nome_enviado: str | None, tipo_declarado: str | None) -> tuple[str, str]:
    nome = sanitizar_nome(nome_enviado)
    caminho = PurePosixPath(nome)
    if caminho.suffix.lower() != ".pdf" or not caminho.stem:
        raise errors.extensao_invalida()
    mime = (tipo_declarado or "").split(";", 1)[0].strip().lower()
    if mime not in MIMES_ACEITOS:
        raise errors.tipo_invalido()
    return nome, mime


def copiar_com_limite(
    origem: BinaryIO, destino: Path, max_bytes: int, max_mb: int
) -> tuple[str, int]:
    """Copia em blocos calculando SHA-256 e tamanho. Recusa (e apaga) se passar do limite,
    se estiver vazio ou se não começar com a assinatura de PDF."""
    sha = hashlib.sha256()
    tamanho = 0
    inicio = b""
    try:
        with destino.open("xb") as saida:
            while bloco := origem.read(BLOCO):
                if len(inicio) < len(ASSINATURA):
                    inicio += bloco[: len(ASSINATURA) - len(inicio)]
                    if len(inicio) == len(ASSINATURA) and inicio != ASSINATURA:
                        raise errors.assinatura_invalida()
                tamanho += len(bloco)
                if tamanho > max_bytes:
                    raise errors.arquivo_grande(max_mb)
                sha.update(bloco)
                saida.write(bloco)
        if tamanho == 0:
            raise errors.arquivo_vazio()
        if inicio != ASSINATURA:  # arquivo menor que a própria assinatura
            raise errors.assinatura_invalida()
    except BaseException:
        destino.unlink(missing_ok=True)
        raise
    return sha.hexdigest(), tamanho


def contar_paginas(caminho: Path, max_paginas: int) -> int:
    """Abre a estrutura do PDF. Recusa corrompido, protegido por senha, vazio ou longo demais."""
    try:
        leitor = PdfReader(caminho, strict=False)
        if leitor.is_encrypted:
            try:
                liberado = leitor.decrypt("")
            except Exception:
                liberado = 0
            if not liberado:
                raise errors.pdf_protegido()
        paginas = len(leitor.pages)
    except errors.ErroDocumento:
        raise
    except Exception as erro:  # o pypdf pode levantar vários tipos para arquivos ruins
        logger.info("PDF recusado na validação (%s)", type(erro).__name__)
        raise errors.pdf_corrompido() from None
    if paginas < 1:
        raise errors.pdf_corrompido()
    if paginas > max_paginas:
        raise errors.paginas_demais(max_paginas)
    return paginas


def validar_upload(
    origem: BinaryIO,
    nome_enviado: str | None,
    tipo_declarado: str | None,
    temporario: Path,
    *,
    max_bytes: int,
    max_mb: int,
    max_paginas: int,
) -> ArquivoValidado:
    nome, mime = validar_nome_e_tipo(nome_enviado, tipo_declarado)
    sha256, tamanho = copiar_com_limite(origem, temporario, max_bytes, max_mb)
    try:
        paginas = contar_paginas(temporario, max_paginas)
    except BaseException:
        temporario.unlink(missing_ok=True)
        raise
    return ArquivoValidado(temporario, nome, mime, sha256, tamanho, paginas)
