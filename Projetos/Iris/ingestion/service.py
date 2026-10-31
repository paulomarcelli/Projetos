"""Casos de uso dos documentos, independentes do HTTP (as rotas só traduzem entrada e saída)."""

from __future__ import annotations

import logging
import uuid
from collections.abc import Sequence
from typing import BinaryIO

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database.models import Document, DocumentPage, DocumentStatus
from ingestion import errors
from ingestion.processing import processar_documento
from ingestion.schemas import MetadadosInformados
from ingestion.storage import Armazenamento
from ingestion.validation import validar_upload
from shared.config import Settings

logger = logging.getLogger(__name__)


def buscar_por_sha(sessao: Session, sha256: str) -> Document | None:
    return sessao.execute(select(Document).where(Document.sha256 == sha256)).scalar_one_or_none()


def receber_upload(
    sessao: Session,
    armazenamento: Armazenamento,
    settings: Settings,
    origem: BinaryIO,
    nome_enviado: str | None,
    tipo_declarado: str | None,
    informados: MetadadosInformados,
) -> tuple[Document, bool]:
    """Valida, deduplica, guarda e processa. Devolve (documento, é_duplicata)."""
    temporario = armazenamento.novo_temporario()
    try:
        arquivo = validar_upload(
            origem,
            nome_enviado,
            tipo_declarado,
            temporario,
            max_bytes=settings.max_upload_bytes,
            max_mb=settings.max_upload_mb,
            max_paginas=settings.max_pdf_pages,
        )

        existente = buscar_por_sha(sessao, arquivo.sha256)
        if existente is not None:
            return existente, True

        documento_id = uuid.uuid4()
        dados = informados.preenchidos()
        documento = Document(
            id=documento_id,
            sha256=arquivo.sha256,
            original_filename=arquivo.nome,
            size_bytes=arquivo.tamanho,
            mime_type="application/pdf",
            storage_key=Armazenamento.chave_para(documento_id),
            status=DocumentStatus.PENDING.value,
            metadata_sources=dict.fromkeys(dados, "user"),
            warnings=[],
            **dados,
        )
        sessao.add(documento)
        try:
            sessao.flush()  # a restrição única do SHA-256 é conferida aqui
        except IntegrityError:
            # Outro upload do mesmo arquivo terminou primeiro: devolve o que ele criou.
            sessao.rollback()
            existente = buscar_por_sha(sessao, arquivo.sha256)
            if existente is None:
                raise
            return existente, True

        armazenamento.instalar(arquivo.temporario, documento.storage_key)
        try:
            sessao.commit()
        except BaseException:
            sessao.rollback()
            armazenamento.descartar(armazenamento.caminho(documento.storage_key))
            raise
    finally:
        armazenamento.descartar(temporario)  # já foi movido ou deve sumir

    processado = processar_documento(sessao, armazenamento, documento_id)
    return (processado or documento), False


def listar(
    sessao: Session, limite: int, deslocamento: int, status: DocumentStatus | None = None
) -> tuple[Sequence[Document], int]:
    filtro = [] if status is None else [Document.status == status.value]
    total = sessao.execute(select(func.count()).select_from(Document).where(*filtro)).scalar_one()
    itens = (
        sessao.execute(
            select(Document)
            .where(*filtro)
            .order_by(Document.created_at.desc(), Document.id)
            .limit(limite)
            .offset(deslocamento)
        )
        .scalars()
        .all()
    )
    return itens, total


def obter(sessao: Session, documento_id: uuid.UUID) -> Document:
    documento = sessao.get(Document, documento_id)
    if documento is None:
        raise errors.nao_encontrado()
    return documento


def listar_paginas(
    sessao: Session, documento_id: uuid.UUID, limite: int, deslocamento: int
) -> tuple[Sequence[DocumentPage], int]:
    obter(sessao, documento_id)
    filtro = DocumentPage.document_id == documento_id
    total = sessao.execute(
        select(func.count()).select_from(DocumentPage).where(filtro)
    ).scalar_one()
    paginas = (
        sessao.execute(
            select(DocumentPage)
            .where(filtro)
            .order_by(DocumentPage.page_number)
            .limit(limite)
            .offset(deslocamento)
        )
        .scalars()
        .all()
    )
    return paginas, total


def remover(sessao: Session, armazenamento: Armazenamento, documento_id: uuid.UUID) -> None:
    """Apaga registro, páginas e arquivo de forma consistente.

    1. Trava a linha do documento (outra remoção simultânea espera).
    2. Move o arquivo para a lixeira interna (reversível).
    3. Apaga no banco (as páginas saem junto, por ON DELETE CASCADE) e confirma.
    4. Só então apaga o arquivo de vez. Se o commit falhar, o arquivo volta para o lugar.
    """
    documento = sessao.execute(
        select(Document).where(Document.id == documento_id).with_for_update()
    ).scalar_one_or_none()
    if documento is None:
        sessao.rollback()
        raise errors.nao_encontrado()
    if documento.status == DocumentStatus.PROCESSING.value:
        sessao.rollback()
        raise errors.em_processamento()

    chave = documento.storage_key
    try:
        na_lixeira = armazenamento.mover_para_lixeira(chave)
    except BaseException:
        sessao.rollback()
        raise
    try:
        sessao.delete(documento)
        sessao.commit()
    except BaseException:
        sessao.rollback()
        if na_lixeira is not None:
            armazenamento.restaurar(na_lixeira, chave)
        raise
    armazenamento.descartar(na_lixeira)
