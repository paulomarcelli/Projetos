"""Tarefas (tabela tasks) e sessões mínimas (tabela sessions).

A tarefa é o fio que liga uma recuperação (retrievals), um resultado (outcomes) e o feedback.
O prompt chega aqui já redigido (quem chama passa pela redação).
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any, Optional

COLUNAS = ("id", "session_id", "prompt", "prompt_hash", "project", "category", "complexity", "tools",
           "label_source", "status", "assisted", "transcript_offset_start", "transcript_offset_end",
           "created_at", "completed_at", "metadata")
_JSON = {"tools", "metadata"}


class TaskRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def ensure_session(self, session_id: str, agora: str, **campos: Any) -> None:
        """Cria a sessão se ainda não existe (as tarefas têm chave estrangeira para ela)."""
        self.conn.execute(
            "INSERT INTO sessions (id, started_at, cwd, project, source) VALUES (?, ?, ?, ?, ?)"
            " ON CONFLICT(id) DO NOTHING",
            (session_id, agora, campos.get("cwd"), campos.get("project"), campos.get("source")))

    def create(self, task_id: str, prompt: str, created_at: str, **campos: Any) -> None:
        row = {"id": task_id, "prompt": prompt, "created_at": created_at, **campos}
        invalidos = set(row) - set(COLUNAS)
        if invalidos:
            raise ValueError(f"colunas desconhecidas em tasks: {sorted(invalidos)}")
        cols = [c for c in COLUNAS if c in row]
        valores = [json.dumps(row[c], ensure_ascii=False) if c in _JSON else row[c] for c in cols]
        self.conn.execute(f"INSERT INTO tasks ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", valores)

    def get(self, task_id: str) -> Optional[dict[str, Any]]:
        row = self.conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            return None
        d = dict(row)
        for c in _JSON:
            d[c] = json.loads(d[c]) if d[c] else ([] if c == "tools" else {})
        return d

    def update(self, task_id: str, **campos: Any) -> None:
        invalidos = set(campos) - (set(COLUNAS) - {"id"})
        if invalidos:
            raise ValueError(f"colunas desconhecidas em tasks: {sorted(invalidos)}")
        if not campos:
            return
        sets = ", ".join(f"{c} = ?" for c in campos)
        valores = [json.dumps(v, ensure_ascii=False) if c in _JSON else v for c, v in campos.items()]
        self.conn.execute(f"UPDATE tasks SET {sets} WHERE id = ?", [*valores, task_id])
