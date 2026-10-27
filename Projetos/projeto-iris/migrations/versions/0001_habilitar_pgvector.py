"""Habilita a extensão pgvector.

Revision ID: 0001
Revises:
Create Date: 2026-10-27

Esta é a única alteração de esquema da Fase 1: nenhuma tabela é criada. A extensão fica pronta
para a Fase 2 (trechos de documentos com embeddings).

Requer o pgvector instalado no servidor (a imagem `pgvector/pgvector` do docker-compose já o
traz) e permissão para criar extensões (o usuário padrão da imagem é superusuário).
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    # Sem CASCADE de propósito: se já existirem colunas do tipo vector, o PostgreSQL recusa em
    # vez de apagar dados em silêncio.
    op.execute("DROP EXTENSION IF EXISTS vector")
