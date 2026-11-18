"""Engine: a fachada única da HELA.

CLI, servidor MCP, hooks e API falam só com esta classe. Ela abre o banco, lê a
configuração, escolhe o embedder e expõe as operações com entrada validada: qualquer
erro de validação vira InvalidInput, com mensagem legível.

Uso:
    with Engine() as eng:
        eng.remember(kind="procedural", content="Rodar testes: pytest -q")
        hits = eng.search("como rodar os testes")
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Iterable, Optional, TypeVar, Union

from pydantic import BaseModel, ValidationError

from hela.core.clock import Clock, utcnow
from hela.core.config import HelaConfig, load_config
from hela.core.errors import InvalidInput, describe_validation_error
from hela.core.paths import db_path, hela_home
from hela.memory.consolidation import ConsolidationReport, consolidate
from hela.memory.embedder import Embedder, make_embedder
from hela.memory.graph import MemoryGraph
from hela.memory.models import CreateResult, Memory, MemoryCreate, MemoryUpdate
from hela.memory.search import ActivationProvider, HybridSearch, SearchHit
from hela.memory.service import MemoryService
from hela.memory.transfer import ImportReport, check_import_size, export_data, export_to_file, import_data
from hela.security.envelope import wrap_as_data
from hela.storage.db import Database
from hela.storage.migrations import current_version
from hela.storage.repositories.memories import MemoryFilter

M = TypeVar("M", bound=BaseModel)


def _validar(modelo: type[M], dados: dict[str, Any]) -> M:
    try:
        return modelo.model_validate(dados)
    except ValidationError as erro:
        raise InvalidInput(f"entrada inválida ({describe_validation_error(erro)})") from None


def _privado(caminho: Path, modo: int) -> None:
    """Restringe permissões (dados pessoais): pasta 700, banco 600. Ignorado fora do POSIX."""
    if os.name == "posix" and caminho.exists():
        os.chmod(caminho, modo)


class Engine:
    def __init__(self, home: Optional[Path] = None, config: Optional[HelaConfig] = None,
                 clock: Clock = utcnow, embedder: Optional[Embedder] = None,
                 activation: Optional[ActivationProvider] = None) -> None:
        self.home = Path(home) if home is not None else hela_home()
        self.home.mkdir(parents=True, exist_ok=True)
        _privado(self.home, 0o700)
        self.config = config or load_config(self.home)
        self.db = Database(db_path(self.home), busy_timeout_ms=self.config.storage.busy_timeout_ms)
        _privado(self.db.path, 0o600)
        ecfg = self.config.embedder
        try:
            self.embedder = embedder or make_embedder(ecfg.backend, ecfg.dim, ecfg.model)
        except BaseException:
            self.db.close()
            raise
        self.memories = MemoryService(self.db, self.embedder, self.config, clock=clock)
        self.graph = MemoryGraph(self.db)
        # activation: encaixe para a ativação no grafo (Fase 3). Sem ele, a busca usa os outros sinais.
        self.searcher = HybridSearch(self.memories, activation=activation)

    # --- ciclo de vida -------------------------------------------------------------------
    def close(self) -> None:
        self.db.close()

    def __enter__(self) -> "Engine":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    # --- memórias ------------------------------------------------------------------------
    def remember(self, data: Optional[MemoryCreate] = None, **campos: Any) -> CreateResult:
        """Grava uma memória (redação, deduplicação e quarentena incluídas)."""
        return self.memories.create(data or _validar(MemoryCreate, campos))

    def get(self, memory_id: str, record_access: bool = True) -> Memory:
        return self.memories.get(memory_id, record_access=record_access)

    def update(self, memory_id: str, **campos: Any) -> Memory:
        return self.memories.update(memory_id, _validar(MemoryUpdate, campos))

    def archive(self, memory_id: str) -> Memory:
        return self.memories.archive(memory_id)

    def restore(self, memory_id: str, force: bool = False) -> Memory:
        return self.memories.restore(memory_id, force=force)

    def delete(self, memory_id: str) -> None:
        self.memories.delete(memory_id)

    def adjust_quality(self, memory_id: str, quality_delta: float = 0.0, confidence_delta: float = 0.0) -> Memory:
        return self.memories.adjust_quality(memory_id, quality_delta, confidence_delta)

    @staticmethod
    def _filtro(kinds: Optional[Iterable[str]] = None, project: Optional[str] = None, include_global: bool = False,
                tags: Optional[Iterable[str]] = None, statuses: Optional[Iterable[str]] = ("active",),
                min_quality: Optional[float] = None) -> MemoryFilter:
        from hela.memory.models import KINDS, STATUSES

        kinds_l = list(kinds) if kinds else None
        statuses_l = list(statuses) if statuses else None
        if kinds_l and set(kinds_l) - set(KINDS):
            raise InvalidInput(f"kind inválido: {sorted(set(kinds_l) - set(KINDS))} (use {', '.join(KINDS)})")
        if statuses_l and set(statuses_l) - set(STATUSES):
            raise InvalidInput(f"status inválido: {sorted(set(statuses_l) - set(STATUSES))}")
        if min_quality is not None and not 0 <= min_quality <= 1:
            raise InvalidInput("min_quality precisa estar entre 0 e 1")
        return MemoryFilter(kinds=kinds_l, project=project, include_global=include_global,
                            tags=list(tags) if tags else None, statuses=statuses_l, min_quality=min_quality)

    def list(self, kinds: Optional[Iterable[str]] = None, project: Optional[str] = None,
             tags: Optional[Iterable[str]] = None, statuses: Optional[Iterable[str]] = ("active",),
             limit: int = 100, offset: int = 0, order: str = "created_at DESC") -> list[Memory]:
        if not 1 <= limit <= 10_000 or offset < 0:
            raise InvalidInput("limit precisa estar entre 1 e 10000 e offset >= 0")
        try:
            return self.memories.list(self._filtro(kinds, project, False, tags, statuses),
                                      limit=limit, offset=offset, order=order)
        except ValueError as erro:
            raise InvalidInput(str(erro)) from erro

    def search(self, query: str, kinds: Optional[Iterable[str]] = None, project: Optional[str] = None,
               include_global: bool = False, tags: Optional[Iterable[str]] = None,
               statuses: Optional[Iterable[str]] = ("active",), min_quality: Optional[float] = None,
               limit: Optional[int] = None, record_access: bool = True) -> list[SearchHit]:
        filtro = self._filtro(kinds, project, include_global, tags, statuses, min_quality)
        return self.searcher.search(query, filtro, limit=limit, record_access=record_access)

    @staticmethod
    def as_context(hits: Iterable[Union[SearchHit, Memory]]) -> str:
        """Bloco "dados, não instruções" para entregar ao Claude."""
        itens = []
        for h in hits:
            m = h.memory if isinstance(h, SearchHit) else h
            itens.append({"id": m.id, "kind": m.kind, "project": m.project, "title": m.title,
                          "score": round(h.score, 4) if isinstance(h, SearchHit) else None, "content": m.content})
        return wrap_as_data(itens)

    # --- grafo ---------------------------------------------------------------------------
    def relate(self, source_id: str, target_id: str, type_: str = "related", weight: float = 1.0,
               evidence: Optional[str] = None) -> int:
        return self.memories.relate(source_id, target_id, type_, weight, evidence)

    def unrelate(self, source_id: str, target_id: str, type_: Optional[str] = None) -> int:
        return self.memories.unrelate(source_id, target_id, type_)

    def relations(self, memory_id: str) -> list[dict[str, Any]]:
        return self.memories.relations(memory_id)

    def neighbors(self, memory_id: str, depth: int = 1) -> set[str]:
        if not 1 <= depth <= 5:
            raise InvalidInput("depth precisa estar entre 1 e 5")
        return self.graph.neighbors(memory_id, depth)

    # --- manutenção ----------------------------------------------------------------------
    def expire(self) -> list[str]:
        return self.memories.expire()

    def consolidate(self, threshold: Optional[float] = None, dry_run: bool = False) -> ConsolidationReport:
        if threshold is not None and not 0 < threshold <= 1:
            raise InvalidInput("threshold precisa estar em (0, 1]")
        return consolidate(self.memories, threshold=threshold, dry_run=dry_run)

    def reembed(self) -> int:
        return self.memories.reembed()

    def maintenance(self) -> dict[str, int]:
        """Rotina de limpeza: expira as vencidas e consolida as quase-duplicatas."""
        expiradas = self.expire()
        rel = self.consolidate()
        return {"expired": len(expiradas), "merged": rel.merged, "clusters": len(rel.clusters)}

    # --- transferência -------------------------------------------------------------------
    def export_data(self, include_quarantined: bool = False) -> dict[str, Any]:
        return export_data(self.memories, include_quarantined=include_quarantined)

    def export_to_file(self, path: Path, include_quarantined: bool = False) -> int:
        return export_to_file(self.memories, path, include_quarantined=include_quarantined)

    def import_data(self, data: Union[str, bytes, dict[str, Any]], trusted: bool = False,
                    dry_run: bool = False) -> ImportReport:
        return import_data(self.memories, data, trusted=trusted, dry_run=dry_run)

    def import_file(self, path: Path, trusted: bool = False, dry_run: bool = False) -> ImportReport:
        caminho = Path(path)
        if not caminho.is_file():
            raise InvalidInput(f"arquivo não encontrado (ou não é um arquivo comum): {caminho}")
        check_import_size(caminho.stat().st_size)  # recusa antes de ler o arquivo
        return self.import_data(caminho.read_bytes(), trusted=trusted, dry_run=dry_run)

    # --- observação ----------------------------------------------------------------------
    def events(self, limit: int = 50, after_id: Optional[int] = None,
               types: Optional[list[str]] = None) -> list[dict[str, Any]]:
        return self.memories.events.recent(limit=limit, after_id=after_id, types=types)

    def stats(self) -> dict[str, Any]:
        conn = self.db.conn
        repo = self.memories.memories
        tamanho = sum(p.stat().st_size for p in self.db.path.parent.glob(self.db.path.name + "*") if p.is_file())
        modelos = {str(r[0]): int(r[1]) for r in conn.execute(
            "SELECT embedding_model, COUNT(*) FROM memories WHERE embedding IS NOT NULL GROUP BY embedding_model")}
        por_status = repo.counts_by("status")
        return {
            "home": str(self.home),
            "db_path": str(self.db.path),
            "db_bytes": tamanho,
            "schema_version": current_version(conn),
            "journal_mode": str(conn.execute("PRAGMA journal_mode").fetchone()[0]),
            "embedder": self.embedder.name,
            "config_file": (self.home / "config.json").exists(),
            "memories": {"total": sum(por_status.values()), "by_kind": repo.counts_by("kind"), "by_status": por_status},
            "embedding_models": modelos,
            "relationships": self.memories.relationships.count(),
            "graph_version": self.graph.version(),
            "events": self.memories.events.count(),
        }
