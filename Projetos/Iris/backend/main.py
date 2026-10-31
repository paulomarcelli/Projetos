"""Ponto de entrada da API: cria a aplicação FastAPI e registra as rotas.

Execução local:  uvicorn backend.main:create_app --factory --reload
(`--factory` evita carregar a configuração só por importar este módulo.)
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError

from backend import __version__
from backend.api import routes_documents, routes_health
from backend.api.upload_limit import CorpoGrandeDemais, LimiteDeUpload
from database.session import build_engine, build_session_factory
from ingestion import errors
from ingestion.storage import Armazenamento, StorageError
from shared.config import Settings, get_settings

logger = logging.getLogger(__name__)


def _erro(e: errors.ErroDocumento) -> JSONResponse:
    return JSONResponse(status_code=e.status, content={"detail": e.mensagem, "code": e.codigo})


def _registrar_tratadores(app: FastAPI, settings: Settings) -> None:
    """Respostas de erro curtas e fixas: sem caminhos, URLs, stack traces ou mensagens internas."""

    @app.exception_handler(errors.ErroDocumento)
    async def _documento(_: Request, e: errors.ErroDocumento) -> JSONResponse:
        return _erro(e)

    @app.exception_handler(CorpoGrandeDemais)
    async def _grande(_: Request, __: CorpoGrandeDemais) -> JSONResponse:
        return _erro(errors.arquivo_grande(settings.max_upload_mb))

    @app.exception_handler(StorageError)
    async def _armazenamento(_: Request, e: StorageError) -> JSONResponse:
        logger.error("Falha no armazenamento: %s", e)
        return _erro(errors.armazenamento_indisponivel())

    @app.exception_handler(OperationalError)
    @app.exception_handler(InterfaceError)
    async def _banco(_: Request, e: Exception) -> JSONResponse:
        logger.error("Banco indisponível (%s)", type(e).__name__)
        return _erro(errors.banco_indisponivel())

    @app.exception_handler(Exception)
    async def _inesperado(_: Request, e: Exception) -> JSONResponse:
        logger.exception("Erro inesperado")
        return JSONResponse(
            status_code=500, content={"detail": "Erro interno.", "code": "internal_error"}
        )


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
        title="Projeto Iris",
        version=__version__,
        description=(
            "Plataforma de IA para prospectiva geopolítica e Relações Internacionais. "
            "Fase 2: ingestão de documentos científicos em PDF. "
            "ATENÇÃO: sem autenticação; use só em ambiente de desenvolvimento controlado."
        ),
        lifespan=lifespan,
    )
    # Estado compartilhado, definido já na criação para funcionar também em testes sem lifespan.
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = build_session_factory(engine) if engine is not None else None
    # Só guarda o caminho; as pastas são criadas no primeiro upload.
    app.state.armazenamento = Armazenamento(settings.storage_dir)

    app.add_middleware(
        LimiteDeUpload,
        caminhos={"/documents/upload"},
        max_bytes=settings.max_upload_bytes,
        max_mb=settings.max_upload_mb,
    )
    _registrar_tratadores(app, settings)
    app.include_router(routes_health.router)
    app.include_router(routes_documents.router)
    return app
