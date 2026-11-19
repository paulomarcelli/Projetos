"""Origem web decidida pela porta, não pelo chamador (revisão F3-A4).

Os hooks gravam cada ferramenta usada (observations). Uma sessão que trouxe texto da web (WebFetch,
WebSearch ou uma ferramenta MCP de busca/fetch) fica marcada: o que for aprendido nela, pelo hook ou
pelo MCP, tem origem web e nunca vira script executável.

O servidor MCP não recebe o session_id do Claude Code. Por isso olha as sessões abertas no mesmo
diretório (CLAUDE_PROJECT_DIR) e, sem diretório, todas as sessões recentes: marcar a mais é seguro,
marcar a menos não.
"""

from __future__ import annotations

import sqlite3
from datetime import timedelta
from typing import Optional

from hela.core.clock import parse_iso, to_iso, utcnow
from hela.execution.assessment import is_web_origin

WEB_TOOLS = ("WebFetch", "WebSearch")
HELA_PREFIX = "mcp__hela__"
WEB_ORIGIN = "web:sessão com WebFetch/WebSearch"


def is_web_tool(nome: object) -> bool:
    if not isinstance(nome, str) or not nome:
        return False
    if nome in WEB_TOOLS:
        return True
    return nome.startswith("mcp__") and not nome.startswith(HELA_PREFIX) and is_web_origin(nome)


def _desde(horas: float, agora: Optional[str]) -> str:
    base = parse_iso(agora) if agora else utcnow()
    return to_iso(base - timedelta(hours=horas))


_WEB_SQL = ("(o.tool_name IN ('WebFetch', 'WebSearch') OR json_extract(o.payload, '$.web') = 1)")


def session_had_web(conn: sqlite3.Connection, session_id: Optional[str], horas: float,
                    agora: Optional[str] = None) -> bool:
    if not session_id:
        return False
    sql = f"SELECT 1 FROM observations o WHERE o.session_id = ? AND o.created_at >= ? AND {_WEB_SQL} LIMIT 1"
    return conn.execute(sql, (session_id, _desde(horas, agora))).fetchone() is not None


def recent_web_activity(conn: sqlite3.Connection, horas: float, project_dir: Optional[str] = None,
                        session_id: Optional[str] = None, agora: Optional[str] = None) -> bool:
    """Para o MCP: a sessão informada, as sessões abertas no mesmo diretório ou, sem diretório, qualquer uma."""
    desde = _desde(horas, agora)
    if session_id and session_had_web(conn, session_id, horas, agora):
        return True
    if project_dir:
        sql = (f"SELECT 1 FROM observations o JOIN sessions s ON s.id = o.session_id"
               f" WHERE s.cwd = ? AND s.ended_at IS NULL AND o.created_at >= ? AND {_WEB_SQL} LIMIT 1")
        return conn.execute(sql, (project_dir, desde)).fetchone() is not None
    sql = f"SELECT 1 FROM observations o WHERE o.created_at >= ? AND {_WEB_SQL} LIMIT 1"
    return conn.execute(sql, (desde,)).fetchone() is not None
