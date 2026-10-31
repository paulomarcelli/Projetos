"""Cria as tabelas de documentos PDF e de texto por página.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-27

Migração incremental: só CRIA as duas tabelas novas. Não altera a extensão pgvector nem nenhum
dado existente.

Atenção: o downgrade APAGA as duas tabelas e todo o seu conteúdo (os PDFs no disco ficam). Só
rode `alembic downgrade 0001` de propósito.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("storage_key", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("authors", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("publication_year", sa.Integer(), nullable=True),
        sa.Column("journal", sa.Text(), nullable=True),
        sa.Column("publisher", sa.Text(), nullable=True),
        sa.Column("institution", sa.Text(), nullable=True),
        sa.Column("doi", sa.String(length=255), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("language", sa.String(length=35), nullable=True),
        sa.Column("metadata_sources", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("pdf_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("text_extractable", sa.Boolean(), nullable=True),
        sa.Column("warnings", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("error_code", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed')",
            name=op.f("ck_documents_status_valido"),
        ),
        sa.CheckConstraint("sha256 ~ '^[0-9a-f]{64}$'", name=op.f("ck_documents_sha256_hex")),
        sa.CheckConstraint("size_bytes > 0", name=op.f("ck_documents_tamanho_positivo")),
        sa.CheckConstraint(
            "page_count IS NULL OR page_count >= 1", name=op.f("ck_documents_paginas_positivas")
        ),
        sa.CheckConstraint(
            "publication_year IS NULL OR publication_year BETWEEN 1000 AND 2100",
            name=op.f("ck_documents_ano_plausivel"),
        ),
        sa.CheckConstraint(
            "status <> 'completed' OR (page_count IS NOT NULL AND processed_at IS NOT NULL)",
            name=op.f("ck_documents_concluido_coerente"),
        ),
        sa.CheckConstraint(
            "status <> 'failed' OR error_code IS NOT NULL",
            name=op.f("ck_documents_falha_coerente"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
        sa.UniqueConstraint("sha256", name=op.f("uq_documents_sha256")),
    )

    op.create_table(
        "document_pages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("text_raw", sa.Text(), nullable=False),
        sa.Column("char_count", sa.Integer(), nullable=False),
        sa.Column("has_text", sa.Boolean(), nullable=False),
        sa.Column("extraction_status", sa.String(length=20), nullable=False),
        sa.Column("extraction_error", sa.String(length=200), nullable=True),
        sa.Column("text_sha256", sa.String(length=64), nullable=True),
        sa.Column("extractor", sa.String(length=50), nullable=False),
        sa.Column("normalization_version", sa.String(length=20), nullable=False),
        sa.Column(
            "extracted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("page_number >= 1", name=op.f("ck_document_pages_pagina_positiva")),
        sa.CheckConstraint(
            "extraction_status IN ('ok', 'empty', 'error')",
            name=op.f("ck_document_pages_status_valido"),
        ),
        sa.CheckConstraint(
            "char_count >= 0", name=op.f("ck_document_pages_caracteres_nao_negativos")
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_document_pages_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_document_pages")),
        sa.UniqueConstraint(
            "document_id", "page_number", name="uq_document_pages_documento_pagina"
        ),
    )
    op.create_index(
        op.f("ix_document_pages_document_id"), "document_pages", ["document_id"], unique=False
    )
    # Listagem paginada de documentos ordena por data de criação.
    op.create_index("ix_documents_created_at", "documents", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_documents_created_at", table_name="documents")
    op.drop_index(op.f("ix_document_pages_document_id"), table_name="document_pages")
    op.drop_table("document_pages")
    op.drop_table("documents")
