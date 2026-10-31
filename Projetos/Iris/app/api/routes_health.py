"""Endpoints de saúde.

- `/health`: o PROCESSO está de pé? Não consulta nenhuma dependência (serve de liveness).
- `/health/ready`: as DEPENDÊNCIAS necessárias estão prontas? Hoje: banco e extensão pgvector.

As respostas trazem apenas estados curtos ("ok", "unavailable"...). Nunca incluem URLs,
usuários, mensagens de erro ou qualquer valor de configuração.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import Settings
from app.db.session import check_database, check_pgvector

router = APIRouter(tags=["saúde"])


class LivenessResponse(BaseModel):
    status: Literal["ok"]


class ReadinessResponse(BaseModel):
    status: Literal["ready", "not_ready"]
    checks: dict[str, Literal["ok", "unavailable", "missing", "not_configured", "unknown"]]
    optional: dict[str, Literal["configured", "not_configured"]]


@router.get("/health", response_model=LivenessResponse, summary="O processo está operacional")
def health() -> LivenessResponse:
    return LivenessResponse(status="ok")


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    responses={
        503: {"model": ReadinessResponse, "description": "Alguma dependência não está pronta"}
    },
    summary="As dependências necessárias estão prontas",
)
def readiness(request: Request) -> JSONResponse:
    settings: Settings = request.app.state.settings
    engine = request.app.state.engine

    if engine is None:
        database, pgvector = "not_configured", "unknown"
    elif check_database(engine):
        database = "ok"
        # "missing" = banco acessível, mas a migração que habilita o pgvector ainda não rodou.
        pgvector = "ok" if check_pgvector(engine) else "missing"
    else:
        database, pgvector = "unavailable", "unknown"

    pronto = database == "ok" and pgvector == "ok"
    corpo = ReadinessResponse(
        status="ready" if pronto else "not_ready",
        checks={"database": database, "pgvector": pgvector},
        # O LLM é informativo: verificar de verdade custaria dinheiro e dependeria de um serviço
        # externo, então a prontidão não o chama nem o exige.
        optional={"llm": "configured" if settings.llm_configured else "not_configured"},
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK if pronto else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=corpo.model_dump(),
    )
