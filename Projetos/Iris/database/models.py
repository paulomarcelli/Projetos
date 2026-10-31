"""Modelos do banco (Fase 2): documentos PDF e o texto de cada página.

O arquivo PDF em si fica no disco (STORAGE_DIR). O banco guarda só a chave relativa dele
(`storage_key`), que nunca aparece nas respostas da API.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class DocumentStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PageStatus(StrEnum):
    OK = "ok"  # texto extraído
    EMPTY = "empty"  # página lida, mas sem texto extraível (ex.: imagem escaneada)
    ERROR = "error"  # a extração desta página falhou


# Transições permitidas. `failed → processing` existe para um reprocessamento futuro.
TRANSICOES: dict[DocumentStatus, frozenset[DocumentStatus]] = {
    DocumentStatus.PENDING: frozenset({DocumentStatus.PROCESSING, DocumentStatus.FAILED}),
    DocumentStatus.PROCESSING: frozenset({DocumentStatus.COMPLETED, DocumentStatus.FAILED}),
    DocumentStatus.FAILED: frozenset({DocumentStatus.PROCESSING}),
    DocumentStatus.COMPLETED: frozenset(),
}


def _valores(enum: type[StrEnum]) -> str:
    return ", ".join(f"'{v.value}'" for v in enum)


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(f"status IN ({_valores(DocumentStatus)})", name="status_valido"),
        CheckConstraint("sha256 ~ '^[0-9a-f]{64}$'", name="sha256_hex"),
        CheckConstraint("size_bytes > 0", name="tamanho_positivo"),
        CheckConstraint("page_count IS NULL OR page_count >= 1", name="paginas_positivas"),
        CheckConstraint(
            "publication_year IS NULL OR publication_year BETWEEN 1000 AND 2100",
            name="ano_plausivel",
        ),
        # Um documento concluído sempre sabe quantas páginas tem; um que falhou sempre diz por quê.
        CheckConstraint(
            "status <> 'completed' OR (page_count IS NOT NULL AND processed_at IS NOT NULL)",
            name="concluido_coerente",
        ),
        CheckConstraint("status <> 'failed' OR error_code IS NOT NULL", name="falha_coerente"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Única: é o que impede duplicatas, inclusive com uploads simultâneos do mesmo arquivo.
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    mime_type: Mapped[str] = mapped_column(String(100), default="application/pdf")
    storage_key: Mapped[str] = mapped_column(String(200))  # relativo a STORAGE_DIR; interno
    status: Mapped[str] = mapped_column(String(20), default=DocumentStatus.PENDING.value)

    # Metadados bibliográficos. Desconhecido fica NULL: nada é inventado.
    title: Mapped[str | None] = mapped_column(Text)
    authors: Mapped[list[str] | None] = mapped_column(JSONB)
    publication_year: Mapped[int | None] = mapped_column(Integer)
    journal: Mapped[str | None] = mapped_column(Text)
    publisher: Mapped[str | None] = mapped_column(Text)
    institution: Mapped[str | None] = mapped_column(Text)
    doi: Mapped[str | None] = mapped_column(String(255))
    source_url: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(35))
    # De onde veio cada campo acima: "user", "pdf_info", "xmp", "pdf_catalog" ou "heuristic".
    metadata_sources: Mapped[dict[str, str]] = mapped_column(JSONB, default=dict)
    # Metadados embutidos no PDF, como estavam (só texto, com tamanho limitado).
    pdf_metadata: Mapped[dict[str, str] | None] = mapped_column(JSONB)

    page_count: Mapped[int | None] = mapped_column(Integer)
    text_extractable: Mapped[bool | None] = mapped_column(Boolean)
    warnings: Mapped[list[str]] = mapped_column(JSONB, default=list)
    error_code: Mapped[str | None] = mapped_column(String(50))
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    pages: Mapped[list[DocumentPage]] = relationship(
        back_populates="document",
        order_by="DocumentPage.page_number",
        cascade="all, delete-orphan",
        passive_deletes=True,  # o banco apaga as páginas (ON DELETE CASCADE)
    )

    def mudar_status(self, novo: DocumentStatus) -> None:
        """Aplica uma transição de estado, recusando as que não fazem sentido."""
        atual = DocumentStatus(self.status)
        if novo not in TRANSICOES[atual]:
            raise ValueError(f"transição inválida: {atual.value} → {novo.value}")
        self.status = novo.value


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (
        UniqueConstraint("document_id", "page_number", name="uq_document_pages_documento_pagina"),
        CheckConstraint("page_number >= 1", name="pagina_positiva"),
        CheckConstraint(f"extraction_status IN ({_valores(PageStatus)})", name="status_valido"),
        CheckConstraint("char_count >= 0", name="caracteres_nao_negativos"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    page_number: Mapped[int] = mapped_column(Integer)  # 1 = primeira página do PDF
    text: Mapped[str] = mapped_column(Text, default="")  # normalizado (conservador)
    text_raw: Mapped[str] = mapped_column(Text, default="")  # como o extrator devolveu
    char_count: Mapped[int] = mapped_column(Integer, default=0)
    has_text: Mapped[bool] = mapped_column(Boolean, default=False)
    extraction_status: Mapped[str] = mapped_column(String(20))
    extraction_error: Mapped[str | None] = mapped_column(String(200))

    # Auditoria: permite saber como e quando este texto foi produzido, e conferir se mudou.
    text_sha256: Mapped[str | None] = mapped_column(String(64))
    extractor: Mapped[str] = mapped_column(String(50))
    normalization_version: Mapped[str] = mapped_column(String(20))
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    document: Mapped[Document] = relationship(back_populates="pages")
