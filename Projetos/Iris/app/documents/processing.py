"""Processamento de um documento: `pending → processing → completed | failed`.

Recebe só o ID do documento. Hoje é chamado de forma síncrona logo após o upload; como não
depende da requisição HTTP, pode passar a rodar numa fila/worker no futuro sem mudanças.

Garantias:
- O estado `processing` é gravado (commit) antes do trabalho começar.
- Páginas, metadados e `completed` são gravados JUNTOS, numa única transação: ou entra tudo, ou
  nada. Não existe documento `completed` sem as suas páginas.
- Em falha, a transação é desfeita e o documento vira `failed` com um código de erro controlado.
  Se nem isso puder ser gravado (ex.: banco caiu), ele fica em `processing`, nunca em `completed`.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentPage, DocumentStatus, PageStatus
from app.documents import metadata
from app.documents.errors import FALHAS_DE_PROCESSAMENTO
from app.documents.extraction import EXTRATOR, PdfIlegivel, abrir, extrair_paginas
from app.documents.normalization import NORMALIZATION_VERSION
from app.documents.storage import Armazenamento

logger = logging.getLogger(__name__)


class FalhaDeProcessamento(Exception):
    def __init__(self, codigo: str, paginas: int | None = None) -> None:
        super().__init__(codigo)
        self.codigo = codigo
        self.paginas = paginas


def _agora() -> datetime:
    return datetime.now(UTC)


def _avisos(paginas: list) -> list[str]:
    avisos: list[str] = []
    vazias = [p.numero for p in paginas if p.status is PageStatus.EMPTY]
    com_erro = [p.numero for p in paginas if p.status is PageStatus.ERROR]
    if not any(p.tem_texto for p in paginas):
        avisos.append(
            "no_extractable_text: nenhuma página tem texto extraível (PDF escaneado ou só "
            "imagens?); OCR não é feito nesta fase"
        )
    elif vazias:
        avisos.append("pages_without_text: " + ", ".join(map(str, vazias)))
    if com_erro:
        avisos.append("pages_with_errors: " + ", ".join(map(str, com_erro)))
    return avisos


def _extrair_e_gravar(sessao: Session, documento: Document, armazenamento: Armazenamento) -> None:
    caminho = armazenamento.caminho(documento.storage_key)
    if not caminho.is_file():
        raise FalhaDeProcessamento("file_missing")
    try:
        arquivo = caminho.open("rb")
    except OSError:
        raise FalhaDeProcessamento("file_missing") from None
    with arquivo:
        try:
            leitor = abrir(arquivo)
        except PdfIlegivel:
            raise FalhaDeProcessamento("pdf_unreadable") from None
        paginas = extrair_paginas(leitor)
        embutidos, info = metadata.ler_embutidos(leitor)

    if all(p.status is PageStatus.ERROR for p in paginas):
        raise FalhaDeProcessamento("extraction_failed", paginas=len(paginas))

    texto_inicial = "\n\n".join(p.texto for p in paginas if p.tem_texto)[:50_000]
    atuais = {campo: getattr(documento, campo) for campo in metadata.CAMPOS}
    valores, fontes = metadata.combinar(
        atuais, documento.metadata_sources or {}, embutidos, metadata.detectar_idioma(texto_inicial)
    )
    for campo, valor in valores.items():
        setattr(documento, campo, valor)
    documento.metadata_sources = fontes
    documento.pdf_metadata = info or None

    agora = _agora()
    # Num reprocessamento futuro (failed → processing), as páginas antigas são substituídas.
    sessao.execute(delete(DocumentPage).where(DocumentPage.document_id == documento.id))
    for p in paginas:
        sessao.add(
            DocumentPage(
                document_id=documento.id,
                page_number=p.numero,
                text=p.texto,
                text_raw=p.texto_bruto,
                char_count=len(p.texto),
                has_text=p.tem_texto,
                extraction_status=p.status.value,
                extraction_error=p.erro,
                text_sha256=p.sha256,
                extractor=EXTRATOR,
                normalization_version=NORMALIZATION_VERSION,
                extracted_at=agora,
            )
        )
    documento.page_count = len(paginas)
    documento.text_extractable = any(p.tem_texto for p in paginas)
    documento.warnings = _avisos(paginas)
    documento.error_code = None
    documento.error_message = None
    documento.processed_at = agora
    documento.mudar_status(DocumentStatus.COMPLETED)


def _marcar_falha(
    sessao: Session, documento_id: uuid.UUID, codigo: str, paginas: int | None
) -> None:
    try:
        documento = sessao.get(Document, documento_id, populate_existing=True)
        if documento is None or documento.status != DocumentStatus.PROCESSING.value:
            return
        documento.mudar_status(DocumentStatus.FAILED)
        documento.error_code = codigo
        documento.error_message = FALHAS_DE_PROCESSAMENTO[codigo]
        documento.page_count = paginas
        documento.processed_at = _agora()
        sessao.commit()
    except Exception:
        sessao.rollback()
        logger.exception("Não foi possível registrar a falha do documento %s", documento_id)


def processar_documento(
    sessao: Session, armazenamento: Armazenamento, documento_id: uuid.UUID
) -> Document | None:
    documento = sessao.get(Document, documento_id, with_for_update=True)
    if documento is None:
        return None
    documento.mudar_status(DocumentStatus.PROCESSING)
    sessao.commit()

    try:
        _extrair_e_gravar(sessao, documento, armazenamento)
        sessao.commit()
    except FalhaDeProcessamento as falha:
        sessao.rollback()
        logger.info("Documento %s falhou: %s", documento_id, falha.codigo)
        _marcar_falha(sessao, documento_id, falha.codigo, falha.paginas)
    except Exception:
        sessao.rollback()
        logger.exception("Erro inesperado ao processar o documento %s", documento_id)
        _marcar_falha(sessao, documento_id, "processing_error", None)
    return sessao.get(Document, documento_id, populate_existing=True)
