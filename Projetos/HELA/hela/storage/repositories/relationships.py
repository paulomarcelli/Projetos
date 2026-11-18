"""Relações entre memórias (arestas do grafo)."""

from __future__ import annotations

import sqlite3
from typing import Optional


class RelationshipRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def upsert(self, source_id: str, target_id: str, type_: str, weight: float, evidence: Optional[str],
               agora: str) -> int:
        """Cria a aresta ou atualiza peso e evidência se (origem, destino, tipo) já existe."""
        self.conn.execute(
            "INSERT INTO relationships (source_id, target_id, type, weight, evidence, created_at, updated_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)"
            " ON CONFLICT(source_id, target_id, type) DO UPDATE SET"
            " weight = excluded.weight, evidence = COALESCE(excluded.evidence, evidence),"
            " updated_at = excluded.updated_at",
            (source_id, target_id, type_, weight, evidence, agora, agora),
        )
        row = self.conn.execute(
            "SELECT id FROM relationships WHERE source_id = ? AND target_id = ? AND type = ?",
            (source_id, target_id, type_),
        ).fetchone()
        return int(row[0])

    def delete(self, source_id: str, target_id: str, type_: Optional[str] = None) -> int:
        if type_ is None:
            cur = self.conn.execute("DELETE FROM relationships WHERE source_id = ? AND target_id = ?",
                                    (source_id, target_id))
        else:
            cur = self.conn.execute(
                "DELETE FROM relationships WHERE source_id = ? AND target_id = ? AND type = ?",
                (source_id, target_id, type_))
        return cur.rowcount

    def for_memory(self, memory_id: str) -> list[sqlite3.Row]:
        return self.conn.execute(
            "SELECT * FROM relationships WHERE source_id = ? OR target_id = ? ORDER BY id",
            (memory_id, memory_id)).fetchall()

    def all(self) -> list[sqlite3.Row]:
        return self.conn.execute("SELECT * FROM relationships ORDER BY id").fetchall()

    def count(self) -> int:
        return int(self.conn.execute("SELECT COUNT(*) FROM relationships").fetchone()[0])

    def repoint(self, de: str, para: str, agora: str) -> int:
        """Move as arestas de uma memória para outra (consolidação).

        Arestas que virariam laço (para → para) ou duplicata são descartadas; nesse caso
        fica o maior peso.
        """
        movidas = 0
        for r in self.for_memory(de):
            origem = para if r["source_id"] == de else r["source_id"]
            destino = para if r["target_id"] == de else r["target_id"]
            self.conn.execute("DELETE FROM relationships WHERE id = ?", (r["id"],))
            if origem == destino:
                continue
            existente = self.conn.execute(
                "SELECT weight FROM relationships WHERE source_id = ? AND target_id = ? AND type = ?",
                (origem, destino, r["type"])).fetchone()
            peso = max(float(r["weight"]), float(existente[0])) if existente else float(r["weight"])
            self.upsert(origem, destino, r["type"], peso, r["evidence"], agora)
            movidas += 1
        return movidas
