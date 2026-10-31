"""Endpoints de documentos PDF.

SEGURANÇA: estes endpoints NÃO têm autenticação nem controle de acesso. Qualquer pessoa que
alcance a API pode enviar, ler e apagar documentos. Use só em ambiente de desenvolvimento
controlado (a API escuta em localhost por padrão). Antes de qualquer exposição pública é preciso
autenticação, autorização, limite de requisições e varredura de arquivos (veja o README).
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.models import DocumentStatus
from app.db.session import get_session
from app.documents import errors, service
from app.documents.schemas import (
    DocumentoDetalhe,
    DocumentoResumo,
    ErroResposta,
    MetadadosInformados,
    Pagina,
    PaginaResposta,
    UploadResposta,
)
from app.documents.storage import Armazenamento

router = APIRouter(prefix="/documents", tags=["documentos"])

ERROS: dict[int | str, dict] = {
    codigo: {"model": ErroResposta} for codigo in (400, 404, 409, 413, 415, 422, 500, 503)
}


def sessao_documentos(request: Request) -> Iterator[Session]:
    if request.app.state.session_factory is None:
        raise errors.banco_nao_configurado()
    yield from get_session(request)


def armazenamento_da_app(request: Request) -> Armazenamento:
    return request.app.state.armazenamento


def settings_da_app(request: Request) -> Settings:
    return request.app.state.settings


SessaoDep = Annotated[Session, Depends(sessao_documentos)]
ArmazenamentoDep = Annotated[Armazenamento, Depends(armazenamento_da_app)]
Limite = Annotated[int, Query(ge=1, le=100, description="Itens por página (1 a 100).")]
Deslocamento = Annotated[int, Query(ge=0, description="Quantos itens pular.")]
CampoTexto = Annotated[str | None, Form()]


def _metadados(**campos: str | None) -> MetadadosInformados:
    """Monta os metadados informados; campo vazio conta como não informado."""
    dados: dict[str, object] = {
        nome: valor.strip() for nome, valor in campos.items() if valor and valor.strip()
    }
    if "authors" in dados:
        dados["authors"] = [a.strip() for a in str(dados["authors"]).split(";") if a.strip()]
    try:
        return MetadadosInformados(**dados)
    except ValidationError as erro:
        nomes = sorted({str(e["loc"][0]) for e in erro.errors() if e["loc"]})
        raise errors.metadados_invalidos(nomes) from None


@router.post(
    "/upload",
    response_model=UploadResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Envia um PDF, extrai o texto por página e grava os metadados",
    responses={200: {"model": UploadResposta, "description": "Arquivo já existente"}, **ERROS},
)
def upload(
    request: Request,
    response: Response,
    sessao: SessaoDep,
    armazenamento: ArmazenamentoDep,
    file: Annotated[UploadFile, File(description="Arquivo PDF.")],
    title: CampoTexto = None,
    authors: Annotated[str | None, Form(description="Autores separados por ';'.")] = None,
    publication_year: CampoTexto = None,
    journal: CampoTexto = None,
    publisher: CampoTexto = None,
    institution: CampoTexto = None,
    doi: CampoTexto = None,
    source_url: CampoTexto = None,
    language: Annotated[str | None, Form(description="Código do idioma: pt, en, es...")] = None,
) -> UploadResposta:
    # Rota síncrona (`def`): o FastAPI a roda numa thread, então a extração não trava o servidor.
    informados = _metadados(
        title=title,
        authors=authors,
        publication_year=publication_year,
        journal=journal,
        publisher=publisher,
        institution=institution,
        doi=doi,
        source_url=source_url,
        language=language,
    )
    documento, duplicado = service.receber_upload(
        sessao,
        armazenamento,
        settings_da_app(request),
        file.file,
        file.filename,
        file.content_type,
        informados,
    )
    if duplicado:
        response.status_code = status.HTTP_200_OK
    return UploadResposta.de(documento, duplicate=duplicado)


@router.get("", response_model=Pagina[DocumentoResumo], summary="Lista os documentos")
def listar(
    sessao: SessaoDep,
    limit: Limite = 20,
    offset: Deslocamento = 0,
    status_filtro: Annotated[DocumentStatus | None, Query(alias="status")] = None,
) -> Pagina[DocumentoResumo]:
    itens, total = service.listar(sessao, limit, offset, status_filtro)
    return Pagina[DocumentoResumo](
        items=[DocumentoResumo.model_validate(d) for d in itens],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentoDetalhe,
    summary="Detalhes e metadados de um documento",
    responses=ERROS,
)
def detalhe(document_id: uuid.UUID, sessao: SessaoDep) -> DocumentoDetalhe:
    return DocumentoDetalhe.de(service.obter(sessao, document_id))


@router.get(
    "/{document_id}/pages",
    response_model=Pagina[PaginaResposta],
    response_model_exclude_none=False,
    summary="Texto extraído, página por página",
    responses=ERROS,
)
def paginas(
    document_id: uuid.UUID,
    sessao: SessaoDep,
    limit: Limite = 20,
    offset: Deslocamento = 0,
    include_raw: Annotated[
        bool, Query(description="Inclui o texto bruto, antes da normalização.")
    ] = False,
) -> Pagina[PaginaResposta]:
    itens, total = service.listar_paginas(sessao, document_id, limit, offset)
    respostas = []
    for p in itens:
        resposta = PaginaResposta.model_validate(p)
        if not include_raw:
            resposta.text_raw = None
        respostas.append(resposta)
    return Pagina[PaginaResposta](items=respostas, total=total, limit=limit, offset=offset)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove o documento, suas páginas e o arquivo",
    responses=ERROS,
)
def remover(document_id: uuid.UUID, sessao: SessaoDep, armazenamento: ArmazenamentoDep) -> Response:
    service.remover(sessao, armazenamento, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
