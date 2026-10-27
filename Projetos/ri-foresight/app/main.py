"""Ponto de entrada da API: cria a aplicação FastAPI e registra as rotas.

Execução local:  uvicorn app.main:create_app --factory --reload
(`--factory` evita carregar a configuração só por importar este módulo.)
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import __version__
from app.api import routes_health
from app.core.config import Settings, get_settings
from app.db.session import build_engine, build_session_factory


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(
        level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )

    engine = build_engine(settings)  # só prepara o pool; a conexão real é feita sob demanda

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        if engine is not None:
            engine.dispose()

    app = FastAPI(
        title="RI Foresight",
        version=__version__,
        description=(
            "Plataforma de IA para prospectiva geopolítica e Relações Internacionais. "
            "Fase 1: fundação técnica (apenas endpoints de saúde)."
        ),
        lifespan=lifespan,
    )
    # Estado compartilhado, definido já na criação para funcionar também em testes sem lifespan.
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = build_session_factory(engine) if engine is not None else None

    app.include_router(routes_health.router)
    return app
