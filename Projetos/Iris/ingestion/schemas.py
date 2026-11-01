"""Formatos de entrada e saída da API de documentos.

As respostas nunca incluem `storage_key` nem qualquer caminho do servidor.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Any
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from ingestion.metadata import normalizar_doi, normalizar_idioma

Texto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class MetadadosInformados(BaseModel):
    """Metadados opcionais enviados junto com o PDF. Têm prioridade sobre os do arquivo."""

    model_config = ConfigDict(extra="forbid")

    title: Texto | None = None
    authors: list[Annotated[str, StringConstraints(min_length=1, max_length=300)]] | None = Field(
        default=None, max_length=200
    )
    publication_year: int | None = Field(default=None, ge=1000, le=2100)
    journal: Texto | None = None
    publisher: Texto | None = None
    institution: Texto | None = None
    doi: str | None = None
    source_url: str | None = Field(default=None, max_length=2048)
    language: str | None = None

    @field_validator("doi")
    @classmethod
    def _doi(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        doi = normalizar_doi(valor)
        if doi is None:
            raise ValueError("DOI em formato inválido (esperado 10.xxxx/...)")
        return doi

    @field_validator("source_url")
    @classmethod
    def _url(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        valor = valor.strip()
        partes = urlsplit(valor)
        if partes.scheme not in ("http", "https") or not partes.netloc:
            raise ValueError("a URL deve começar com http:// ou https://")
        return valor

    @field_validator("language")
    @classmethod
    def _idioma(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        idioma = normalizar_idioma(valor)
        if idioma is None:
            raise ValueError("código de idioma inválido (ex.: pt, en, es, pt-BR)")
        return idioma

    def preenchidos(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)


class ErroResposta(BaseModel):
    detail: str
    code: str


class ErroDeProcessamento(BaseModel):
    code: str
    message: str | None


class DocumentoResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    original_filename: str
    size_bytes: int
    sha256: str
    page_count: int | None
    text_extractable: bool | None
    title: str | None
    authors: list[str] | None
    publication_year: int | None
    language: str | None
    created_at: datetime
    processed_at: datetime | None


class DocumentoDetalhe(DocumentoResumo):
    mime_type: str
    journal: str | None
    publisher: str | None
    institution: str | None
    doi: str | None
    source_url: str | None
    metadata_sources: dict[str, str]
    pdf_metadata: dict[str, str] | None
    warnings: list[str]
    error: ErroDeProcessamento | None = None
    updated_at: datetime

    @classmethod
    def de(cls, documento: Any, **extras: Any) -> Any:
        """Monta a resposta a partir do modelo do banco (sem `storage_key`)."""
        erro = (
            ErroDeProcessamento(code=documento.error_code, message=documento.error_message)
            if documento.error_code
            else None
        )
        campos = {c: getattr(documento, c) for c in DocumentoDetalhe.model_fields if c != "error"}
        return cls(**campos, error=erro, **extras)


class UploadResposta(DocumentoDetalhe):
    duplicate: bool = Field(
        description="true quando o mesmo arquivo (mesmo SHA-256) já existia; nada novo foi salvo."
    )


class PaginaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_number: int
    text: str
    text_raw: str | None = None
    char_count: int
    has_text: bool
    extraction_status: str
    extraction_error: str | None
    text_sha256: str | None
    extractor: str
    normalization_version: str
    extracted_at: datetime


class Pagina[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int
