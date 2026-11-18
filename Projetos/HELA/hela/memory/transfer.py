"""Exportação e importação em JSON versionado.

Formato (versão 1):
    {"format": "hela-export", "version": 1, "exported_at": "...", "hela_version": "...",
     "schema_version": 1, "memories": [...], "relationships": [...]}

- Os vetores não vão no arquivo: são recalculados na importação, com o embedder do
  banco de destino (que pode ser outro).
- Memórias 'merged' ficam fora (já estão representadas pela vencedora).
- session_id e task_id ficam fora: apontam para tabelas que o outro banco não tem.
- Na importação, cada memória passa pelo mesmo caminho de create(): redação,
  deduplicação e quarentena valem de novo. O arquivo inteiro é validado antes, e a
  gravação acontece numa transação só: ou entra tudo, ou nada.
"""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from hela import __version__
from hela.core.errors import InvalidInput
from hela.memory.models import Kind, MemoryCreate, data_iso
from hela.memory.service import MemoryService
from hela.storage.migrations import current_version
from hela.storage.repositories.memories import MemoryFilter

EXPORT_FORMAT = "hela-export"
EXPORT_VERSION = 1
MAX_IMPORT_BYTES = 100 * 1024 * 1024


class ExportedMemory(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=64)
    kind: Kind
    content: str = Field(min_length=1)
    title: Optional[str] = None
    summary: Optional[str] = None
    project: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    source: str = "import"
    status: Literal["active", "archived", "quarantined", "expired"] = "active"
    importance: float = Field(0.5, ge=0, le=1)
    quality: float = Field(0.5, ge=0, le=1)
    confidence: float = Field(0.5, ge=0, le=1)
    access_count: int = Field(0, ge=0)
    last_accessed: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    expires_at: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("last_accessed", "created_at", "updated_at", "expires_at", mode="before")
    @classmethod
    def _normalizar_data(cls, v: Any) -> Optional[str]:
        # Uma data só no formato do banco (UTC, microssegundos): o SQL compara texto.
        try:
            return data_iso(v)
        except (TypeError, ValueError) as erro:
            raise ValueError(f"data inválida: {v!r}") from erro


class ExportedRelationship(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source_id: str
    target_id: str
    type: str
    weight: float = Field(1.0, ge=0)
    evidence: Optional[str] = None


class ExportDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    format: Literal["hela-export"]
    version: Literal[1]
    memories: list[ExportedMemory]
    relationships: list[ExportedRelationship] = Field(default_factory=list)


class ImportReport(BaseModel):
    created: int = 0
    duplicates: int = 0
    quarantined: int = 0
    redactions: int = 0
    relationships: int = 0
    skipped_relationships: int = 0


_CAMPOS_MEMORIA = tuple(ExportedMemory.model_fields)


def export_data(service: MemoryService) -> dict[str, Any]:
    memorias = service.list(MemoryFilter(statuses=["active", "archived", "quarantined", "expired"]),
                            limit=10_000_000, order="created_at ASC")
    ids = {m.id for m in memorias}
    relacoes = [
        {"source_id": r["source_id"], "target_id": r["target_id"], "type": r["type"],
         "weight": r["weight"], "evidence": r["evidence"]}
        for r in service.relationships.all() if r["source_id"] in ids and r["target_id"] in ids
    ]
    dados = {
        "format": EXPORT_FORMAT,
        "version": EXPORT_VERSION,
        "exported_at": service.now(),
        "hela_version": __version__,
        "schema_version": current_version(service.db.conn),
        "memories": [{c: getattr(m, c) for c in _CAMPOS_MEMORIA} for m in memorias],
        "relationships": relacoes,
    }
    with service.db.transaction():
        service.events.log(service.now(), "export.done", None, None,
                           {"memories": len(memorias), "relationships": len(relacoes)})
    return dados


def export_to_file(service: MemoryService, path: Path) -> int:
    """Grava o JSON de forma atômica (temporário + rename). Devolve quantas memórias foram."""
    dados = export_data(service)
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".hela-export-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise
    return len(dados["memories"])


def _ler(dados: Union[str, bytes, dict[str, Any]]) -> ExportDocument:
    if isinstance(dados, (str, bytes)):
        if len(dados) > MAX_IMPORT_BYTES:
            raise InvalidInput(f"arquivo grande demais para importar (limite {MAX_IMPORT_BYTES // 2**20} MB)")
        try:
            dados = json.loads(dados)
        except json.JSONDecodeError as erro:
            raise InvalidInput(f"o arquivo não é JSON válido: {erro}") from erro
    if not isinstance(dados, dict):
        raise InvalidInput("o arquivo precisa ser um objeto JSON no formato hela-export")
    try:
        return ExportDocument.model_validate(dados)
    except ValidationError as erro:
        raise InvalidInput(f"arquivo de exportação inválido: {erro}") from erro


def import_data(service: MemoryService, dados: Union[str, bytes, dict[str, Any]]) -> ImportReport:
    doc = _ler(dados)
    try:
        entradas = [
            (m, MemoryCreate(kind=m.kind, content=m.content, title=m.title, summary=m.summary, project=m.project,
                             tags=m.tags, source=m.source, importance=m.importance, quality=m.quality,
                             confidence=m.confidence, expires_at=m.expires_at, metadata=m.metadata))
            for m in doc.memories
        ]
    except ValidationError as erro:
        raise InvalidInput(f"memória inválida no arquivo: {erro}") from erro

    rel = ImportReport()
    mapa: dict[str, str] = {}  # id no arquivo → id neste banco
    with service.db.transaction():
        for m, entrada in entradas:
            preservar = {"id": m.id, "status": m.status, "access_count": m.access_count,
                         "last_accessed": m.last_accessed}
            if m.created_at:
                preservar["created_at"] = m.created_at
            if m.updated_at:
                preservar["updated_at"] = m.updated_at
            r = service.create(entrada, preserve=preservar)
            mapa[m.id] = r.memory.id
            rel.redactions += len(r.redactions)
            if r.created:
                rel.created += 1
                rel.quarantined += int(r.quarantined)
            else:
                rel.duplicates += 1
        for r_ in doc.relationships:
            origem, destino = mapa.get(r_.source_id), mapa.get(r_.target_id)
            if not origem or not destino or origem == destino:
                rel.skipped_relationships += 1
                continue
            service.relate(origem, destino, r_.type, weight=r_.weight, evidence=r_.evidence)
            rel.relationships += 1
        service.events.log(service.now(), "import.done", None, None, rel.model_dump())
    return rel
