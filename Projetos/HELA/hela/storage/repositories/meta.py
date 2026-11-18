"""Chave/valor interno (tabela meta)."""

from __future__ import annotations

import sqlite3
from typing import Optional


class MetaRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def get(self, key: str) -> Optional[str]:
        row = self.conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
        return None if row is None else str(row[0])

    def set(self, key: str, value: str) -> None:
        self.conn.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )

    def graph_version(self) -> int:
        """Sobe a cada mudança em relationships (triggers do esquema)."""
        return int(self.get("graph_version") or 0)
