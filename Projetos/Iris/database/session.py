"""Conexão com o PostgreSQL: engine, sessões e verificações de prontidão."""

from __future__ import annotations

import logging
from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from shared.config import Settings

logger = logging.getLogger(__name__)


def build_engine(settings: Settings) -> Engine | None:
    """Cria o engine, ou devolve None se o banco não foi configurado. Não conecta ainda."""
    if settings.database_url is None:
        return None
    return create_engine(
        settings.database_url.get_secret_value(),
        pool_pre_ping=True,  # descarta conexões mortas antes de usá-las
        connect_args={"connect_timeout": max(1, round(settings.db_connect_timeout_seconds))},
    )


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    # expire_on_commit=False: objetos continuam legíveis depois do commit, o que simplifica os
    # serviços e as respostas da API que os usam.
    return sessionmaker(bind=engine, expire_on_commit=False)


def get_session(request: Request) -> Iterator[Session]:
    """Dependência do FastAPI: uma sessão por requisição.

    Não faz commit sozinha: quem escreve decide quando confirmar. Em erro, desfaz e devolve a
    conexão ao pool.
    """
    factory: sessionmaker[Session] | None = request.app.state.session_factory
    if factory is None:
        raise RuntimeError("Banco de dados não configurado (defina DATABASE_URL).")
    with factory() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise


def check_database(engine: Engine) -> bool:
    """True se conseguir executar `SELECT 1`. Nunca propaga o erro (pode conter a URL)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError as erro:
        logger.warning("Banco indisponível (%s)", type(erro).__name__)
        return False
    return True


def check_pgvector(engine: Engine) -> bool:
    """True se a extensão `vector` estiver habilitada neste banco (criada pela migração 0001)."""
    try:
        with engine.connect() as conn:
            achou = conn.execute(
                text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
            ).scalar()
    except SQLAlchemyError as erro:
        logger.warning("Não foi possível verificar o pgvector (%s)", type(erro).__name__)
        return False
    return achou is not None
