"""Repositório de memórias: o único lugar com SQL da tabela memories.

As funções recebem e devolvem dicionários e linhas; regras (redação, deduplicação,
quarentena) ficam no serviço (hela/memory/service.py).
"""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

import numpy as np

COLUNAS = (
    "id", "kind", "title", "content", "summary", "project", "tags", "source", "status", "content_hash",
    "embedding", "embedding_model", "importance", "quality", "confidence", "access_count", "last_accessed",
    "created_at", "updated_at", "expires_at", "session_id", "task_id", "merged_into", "redactions",
    "injection_score", "metadata",
)
EDITAVEIS = frozenset(COLUNAS) - {"id"}


@dataclass
class MemoryFilter:
    """Filtros comuns à listagem e à busca.

    statuses: por padrão só 'active'.
    tags: a memória precisa ter todas.
    include_global: com project definido, inclui também memórias sem projeto.
    not_expired_at: exclui memórias com expires_at <= essa data (mesmo ainda marcadas active).
    """

    kinds: Optional[list[str]] = None
    project: Optional[str] = None
    include_global: bool = False
    tags: Optional[list[str]] = None
    statuses: Optional[list[str]] = field(default_factory=lambda: ["active"])
    not_expired_at: Optional[str] = None
    min_quality: Optional[float] = None
    ids: Optional[list[str]] = None

    def where(self, alias: str = "m") -> tuple[str, list[Any]]:
        partes: list[str] = []
        args: list[Any] = []

        def em(coluna: str, valores: Iterable[Any]) -> None:
            valores = list(valores)
            partes.append(f"{alias}.{coluna} IN ({','.join('?' * len(valores))})")
            args.extend(valores)

        if self.kinds:
            em("kind", self.kinds)
        if self.statuses:
            em("status", self.statuses)
        if self.ids is not None:
            if not self.ids:
                partes.append("0")
            else:
                em("id", self.ids)
        if self.project is not None:
            if self.include_global:
                partes.append(f"({alias}.project = ? OR {alias}.project IS NULL)")
            else:
                partes.append(f"{alias}.project = ?")
            args.append(self.project)
        for tag in self.tags or []:
            partes.append(f"EXISTS (SELECT 1 FROM json_each({alias}.tags) WHERE json_each.value = ?)")
            args.append(tag.strip().lower())
        if self.not_expired_at:
            partes.append(f"({alias}.expires_at IS NULL OR {alias}.expires_at > ?)")
            args.append(self.not_expired_at)
        if self.min_quality is not None:
            partes.append(f"{alias}.quality >= ?")
            args.append(self.min_quality)
        return (" AND ".join(partes) if partes else "1"), args


_TERMO = re.compile(r"\w+", re.UNICODE)


def fts_query(texto: str, max_termos: int = 32) -> Optional[str]:
    """Transforma texto livre numa consulta FTS5 segura: termos entre aspas, unidos por OR.

    Assim aspas, asteriscos, hífens e dois-pontos do usuário nunca viram sintaxe do FTS5.
    """
    termos = list(dict.fromkeys(t.lower() for t in _TERMO.findall(texto or "")))[:max_termos]
    if not termos:
        return None
    return " OR ".join(f'"{t}"' for t in termos)


class MemoryRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    # --- escrita -------------------------------------------------------------------------
    def insert(self, row: dict[str, Any]) -> None:
        colunas = [c for c in COLUNAS if c in row]
        sql = f"INSERT INTO memories ({','.join(colunas)}) VALUES ({','.join('?' * len(colunas))})"
        self.conn.execute(sql, [_para_sql(c, row[c]) for c in colunas])

    def update(self, memory_id: str, campos: dict[str, Any]) -> None:
        invalidos = set(campos) - EDITAVEIS
        if invalidos:
            raise ValueError(f"campos não editáveis: {sorted(invalidos)}")
        if not campos:
            return
        sets = ", ".join(f"{c} = ?" for c in campos)
        self.conn.execute(f"UPDATE memories SET {sets} WHERE id = ?",
                          [*(_para_sql(c, v) for c, v in campos.items()), memory_id])

    def delete(self, memory_id: str) -> bool:
        return self.conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,)).rowcount > 0

    def touch(self, ids: list[str], quando: str) -> None:
        """Atualiza access_count e last_accessed (uma leitura conta como um acesso)."""
        if ids:
            self.conn.execute(
                f"UPDATE memories SET access_count = access_count + 1, last_accessed = ?"
                f" WHERE id IN ({','.join('?' * len(ids))})", [quando, *ids])

    def expire_due(self, agora: str) -> list[str]:
        ids = [r[0] for r in self.conn.execute(
            "SELECT id FROM memories WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= ?",
            (agora,))]
        if ids:
            self.conn.execute(
                f"UPDATE memories SET status = 'expired', updated_at = ? WHERE id IN ({','.join('?' * len(ids))})",
                [agora, *ids])
        return ids

    # --- leitura -------------------------------------------------------------------------
    def get(self, memory_id: str) -> Optional[sqlite3.Row]:
        return self.conn.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()

    def get_by_hash(self, h: str) -> Optional[sqlite3.Row]:
        return self.conn.execute("SELECT * FROM memories WHERE content_hash = ?", (h,)).fetchone()

    def list(self, filtro: MemoryFilter, limit: int = 100, offset: int = 0,
             order: str = "created_at DESC") -> list[sqlite3.Row]:
        if order not in _ORDENS:
            raise ValueError(f"ordenação inválida: {order}")
        where, args = filtro.where()
        sql = f"SELECT * FROM memories m WHERE {where} ORDER BY m.{order}, m.rid DESC LIMIT ? OFFSET ?"
        return self.conn.execute(sql, [*args, int(limit), int(offset)]).fetchall()

    def count(self, filtro: MemoryFilter) -> int:
        where, args = filtro.where()
        return int(self.conn.execute(f"SELECT COUNT(*) FROM memories m WHERE {where}", args).fetchone()[0])

    def fts(self, texto: str, filtro: MemoryFilter, limit: int) -> list[tuple[str, float]]:
        """(id, bm25) em ordem de relevância; bm25 menor é melhor no FTS5."""
        consulta = fts_query(texto)
        if consulta is None:
            return []
        where, args = filtro.where()
        sql = (
            "SELECT m.id, bm25(memories_fts, 3.0, 1.0, 1.5, 1.0) AS score"
            " FROM memories_fts JOIN memories m ON m.rid = memories_fts.rowid"
            f" WHERE memories_fts MATCH ? AND {where} ORDER BY score LIMIT ?"
        )
        return [(r[0], float(r[1])) for r in self.conn.execute(sql, [consulta, *args, int(limit)])]

    def embeddings(self, filtro: MemoryFilter, model: str) -> tuple[list[str], np.ndarray]:
        """Ids e matriz (n, dim) dos vetores do modelo pedido."""
        where, args = filtro.where()
        rows = self.conn.execute(
            f"SELECT m.id, m.embedding FROM memories m WHERE {where} AND m.embedding_model = ?"
            " AND m.embedding IS NOT NULL", [*args, model]).fetchall()
        if not rows:
            return [], np.zeros((0, 0), dtype=np.float32)
        return [r[0] for r in rows], np.vstack([np.frombuffer(r[1], dtype=np.float32) for r in rows])

    def counts_by(self, coluna: str) -> dict[str, int]:
        if coluna not in ("kind", "status", "project", "source"):
            raise ValueError(coluna)
        return {str(r[0]): int(r[1]) for r in
                self.conn.execute(f"SELECT {coluna}, COUNT(*) FROM memories GROUP BY {coluna}")}


_ORDENS = frozenset({
    "created_at DESC", "created_at ASC", "updated_at DESC", "last_accessed DESC",
    "access_count DESC", "quality DESC", "importance DESC",
})


def _para_sql(coluna: str, valor: Any) -> Any:
    if coluna in ("tags", "metadata"):
        return json.dumps(valor if valor is not None else ([] if coluna == "tags" else {}), ensure_ascii=False)
    return valor


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = {k: row[k] for k in row.keys() if k not in ("rid", "embedding")}
    d["tags"] = json.loads(d.get("tags") or "[]")
    d["metadata"] = json.loads(d.get("metadata") or "{}")
    return d
