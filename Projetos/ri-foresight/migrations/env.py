"""Ambiente do Alembic: usa a mesma configuração validada da aplicação."""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import ConfigError, get_settings
from app.db.base import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# Quando a Fase 2 criar modelos, importe-os aqui para o autogenerate enxergá-los.
target_metadata = Base.metadata


def _database_url() -> str:
    # Permite que os testes passem a URL por `alembic.config.Config.attributes`.
    url = config.attributes.get("database_url")
    if url:
        return url
    settings = get_settings()
    if settings.database_url is None:
        raise ConfigError("DATABASE_URL não está configurada; não há banco para migrar.")
    return settings.database_url.get_secret_value()


def run_migrations_offline() -> None:
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(_database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
