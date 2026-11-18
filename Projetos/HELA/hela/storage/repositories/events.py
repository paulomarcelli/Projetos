"""Linha do tempo do motor (tabela events), que o dashboard vai ler.

Regra: um evento guarda só ids, tipos e contagens. Nunca o conteúdo de uma memória.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any, Optional


class EventRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def log(self, ts: str, type_: str, entity: Optional[str] = None, entity_id: Optional[str] = None,
            data: Optional[dict[str, Any]] = None) -> int:
        cur = self.conn.execute(
            "INSERT INTO events (ts, type, entity, entity_id, data) VALUES (?, ?, ?, ?, ?)",
            (ts, type_, entity, entity_id, json.dumps(data or {}, ensure_ascii=False)),
        )
        return int(cur.lastrowid)

    def recent(self, limit: int = 50, after_id: Optional[int] = None,
               types: Optional[list[str]] = None) -> list[dict[str, Any]]:
        """Eventos mais novos primeiro; after_id serve para o dashboard buscar só os novos."""
        partes, args = [], []
        if after_id is not None:
            partes.append("id > ?")
            args.append(int(after_id))
        if types:
            partes.append(f"type IN ({','.join('?' * len(types))})")
            args.extend(types)
        where = " AND ".join(partes) or "1"
        rows = self.conn.execute(
            f"SELECT id, ts, type, entity, entity_id, data FROM events WHERE {where} ORDER BY id DESC LIMIT ?",
            [*args, int(limit)],
        ).fetchall()
        return [{"id": r["id"], "ts": r["ts"], "type": r["type"], "entity": r["entity"],
                 "entity_id": r["entity_id"], "data": json.loads(r["data"])} for r in rows]

    def count(self) -> int:
        return int(self.conn.execute("SELECT COUNT(*) FROM events").fetchone()[0])
