"""Modelos de entrada e saída do Memory Engine (validados com pydantic).

A validação acontece na fronteira: o que entra pela CLI, MCP, hooks ou API vira um
MemoryCreate/MemoryUpdate, e só então chega ao banco.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from hela.core.clock import parse_iso, to_iso

Kind = Literal["episodic", "semantic", "procedural", "executive"]
Status = Literal["active", "archived", "quarantined", "expired", "merged"]
KINDS: tuple[str, ...] = ("episodic", "semantic", "procedural", "executive")
STATUSES: tuple[str, ...] = ("active", "archived", "quarantined", "expired", "merged")

MAX_TAGS = 32
MAX_TAG_LEN = 64


def _limpar_tags(tags: list[str]) -> list[str]:
    """Minúsculas, sem espaços nas pontas, sem repetição, em ordem alfabética."""
    limpas = sorted({t.strip().lower() for t in tags if isinstance(t, str) and t.strip()})
    if len(limpas) > MAX_TAGS:
        raise ValueError(f"no máximo {MAX_TAGS} tags")
    if any(len(t) > MAX_TAG_LEN for t in limpas):
        raise ValueError(f"cada tag pode ter no máximo {MAX_TAG_LEN} caracteres")
    return limpas


def _data_iso(valor: Any) -> Optional[str]:
    if valor is None or valor == "":
        return None
    if isinstance(valor, datetime):
        return to_iso(valor)
    if isinstance(valor, str):
        return to_iso(parse_iso(valor))
    raise ValueError("data inválida (use ISO 8601)")


class _Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class MemoryCreate(_Entrada):
    kind: Kind
    content: str = Field(min_length=1)
    title: Optional[str] = Field(None, max_length=300)
    summary: Optional[str] = Field(None, max_length=2000)
    project: Optional[str] = Field(None, max_length=200)
    tags: list[str] = Field(default_factory=list)
    source: str = Field("manual", max_length=40)
    importance: Optional[float] = Field(None, ge=0, le=1)
    quality: Optional[float] = Field(None, ge=0, le=1)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    expires_at: Optional[str] = None
    session_id: Optional[str] = None
    task_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("tags")
    @classmethod
    def _validar_tags(cls, v: list[str]) -> list[str]:
        return _limpar_tags(v)

    @field_validator("expires_at", mode="before")
    @classmethod
    def _validar_expiracao(cls, v: Any) -> Optional[str]:
        return _data_iso(v)


class MemoryUpdate(_Entrada):
    """Só os campos enviados mudam (model_fields_set). expires_at=None apaga a validade."""

    kind: Optional[Kind] = None
    content: Optional[str] = Field(None, min_length=1)
    title: Optional[str] = Field(None, max_length=300)
    summary: Optional[str] = Field(None, max_length=2000)
    project: Optional[str] = Field(None, max_length=200)
    tags: Optional[list[str]] = None
    importance: Optional[float] = Field(None, ge=0, le=1)
    quality: Optional[float] = Field(None, ge=0, le=1)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    expires_at: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None

    @field_validator("tags")
    @classmethod
    def _validar_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return None if v is None else _limpar_tags(v)

    @field_validator("expires_at", mode="before")
    @classmethod
    def _validar_expiracao(cls, v: Any) -> Optional[str]:
        return _data_iso(v)


class Memory(BaseModel):
    """Uma memória como sai do banco (sem o vetor)."""

    id: str
    kind: Kind
    title: Optional[str]
    content: str
    summary: Optional[str]
    project: Optional[str]
    tags: list[str]
    source: str
    status: Status
    content_hash: str
    embedding_model: Optional[str]
    importance: float
    quality: float
    confidence: float
    access_count: int
    last_accessed: Optional[str]
    created_at: str
    updated_at: str
    expires_at: Optional[str]
    session_id: Optional[str]
    task_id: Optional[str]
    merged_into: Optional[str]
    redactions: int
    injection_score: float
    metadata: dict[str, Any]


class NearDuplicate(BaseModel):
    id: str
    similarity: float


class CreateResult(BaseModel):
    memory: Memory
    created: bool
    duplicate_of: Optional[str] = None
    near_duplicates: list[NearDuplicate] = Field(default_factory=list)
    redactions: list[str] = Field(default_factory=list)
    quarantined: bool = False
    injection_matches: list[str] = Field(default_factory=list)
