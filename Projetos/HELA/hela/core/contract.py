"""Contrato de entrada das 8 operações da HELA (docs/api.md).

O mesmo modelo valida a chamada vinda do MCP (Fase 4), da API REST (Fase 5) e do Python. Campos
desconhecidos são recusados (extra="forbid"): ninguém passa "approved": true por engano.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from hela.memory.models import Kind

Categoria = Field(None, pattern=r"^[a-z][a-z0-9_]{0,39}$")


class _Req(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RecallRequest(_Req):
    query: str = Field(min_length=1, max_length=4000)
    project: Optional[str] = Field(None, max_length=200)
    session_id: Optional[str] = Field(None, max_length=200)
    task_id: Optional[str] = Field(None, max_length=64)
    kinds: Optional[list[Kind]] = None
    budget_tokens: Optional[int] = Field(None, ge=50, le=2400)
    limit: Optional[int] = Field(None, ge=1, le=50)
    include_global: bool = True


class ClassifyRequest(_Req):
    text: str = Field(min_length=1, max_length=4000)
    project: Optional[str] = Field(None, max_length=200)


class RecommendRequest(_Req):
    query: Optional[str] = Field(None, min_length=1, max_length=4000)
    category: Optional[str] = Categoria
    project: Optional[str] = Field(None, max_length=200)
    limit: int = Field(5, ge=1, le=50)


class ProcedureSpec(_Req):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    steps: Optional[list[str]] = Field(None, max_length=50)
    script: Optional[str] = Field(None, max_length=20000)
    language: Optional[str] = Field(None, max_length=20)


class LearnRequest(_Req):
    kind: Kind
    content: str = Field(min_length=1, max_length=20000)
    title: Optional[str] = Field(None, max_length=300)
    summary: Optional[str] = Field(None, max_length=2000)
    project: Optional[str] = Field(None, max_length=200)
    tags: list[str] = Field(default_factory=list, max_length=32)
    importance: Optional[float] = Field(None, ge=0, le=1)
    expires_at: Optional[str] = None
    session_id: Optional[str] = Field(None, max_length=200)
    task_id: Optional[str] = Field(None, max_length=64)
    category: Optional[str] = Categoria   # rótulo explícito da tarefa (label_source = explicit)
    origin: Optional[str] = Field(None, max_length=80)  # ex.: tool:WebFetch (nunca vira executável)
    procedure: Optional[ProcedureSpec] = None
    # Sem quality, confidence e source: a origem é a porta que chama (Engine.learn(door=...)), não o corpo (A-7).


class Tokens(_Req):
    input: Optional[int] = Field(None, ge=0)
    output: Optional[int] = Field(None, ge=0)
    cache_read: Optional[int] = Field(None, ge=0)
    cache_creation: Optional[int] = Field(None, ge=0)
    thinking: Optional[int] = Field(None, ge=0)


class FeedbackRequest(_Req):
    task_id: Optional[str] = Field(None, max_length=64)
    success: Optional[bool] = None
    quality: Optional[float] = Field(None, ge=0, le=1)
    duration_ms: Optional[float] = Field(None, ge=0)
    attempts: Optional[int] = Field(None, ge=0, le=10_000)
    tokens: Optional[Tokens] = None
    token_source: Optional[Literal["provider", "estimated"]] = None
    compute_cost: Optional[float] = Field(None, ge=0)
    strategy: Optional[str] = Field(None, min_length=1, max_length=120)
    notes: Optional[str] = Field(None, max_length=2000)
    used_memory_ids: Optional[list[str]] = Field(None, max_length=100)
    memory_id: Optional[str] = Field(None, max_length=64)
    rating: Optional[Literal[-1, 0, 1]] = None
    comment: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Categoria
    label_source: Literal["feedback", "explicit"] = "feedback"
    source: Literal["user", "claude", "hook", "auto"] = "claude"


class ProcedureRequest(_Req):
    action: Literal["get", "list", "validate", "plan", "approve"] = "get"
    id: Optional[str] = Field(None, max_length=64)
    query: Optional[str] = Field(None, max_length=4000)
    project: Optional[str] = Field(None, max_length=200)
    script: Optional[str] = Field(None, max_length=20000)
    language: Optional[str] = Field(None, max_length=20)
    text: Optional[str] = Field(None, max_length=4000)
    limit: int = Field(10, ge=1, le=50)


class RelationshipsRequest(_Req):
    memory_id: str = Field(min_length=1, max_length=64)
    action: Literal["list", "link", "unlink"] = "list"
    depth: int = Field(1, ge=1, le=3)
    target_id: Optional[str] = Field(None, max_length=64)
    type: Optional[str] = Field(None, max_length=40)
    weight: float = Field(1.0, ge=0, le=100)
    evidence: Optional[str] = Field(None, max_length=1000)
