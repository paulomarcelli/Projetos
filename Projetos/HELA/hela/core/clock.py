"""Datas em um formato único.

Todas as datas do banco são texto ISO 8601 em UTC com microssegundos
("2026-11-18T12:00:00.000000+00:00"). Com um formato só, comparar texto no SQL
(por exemplo, expires_at <= agora) é o mesmo que comparar datas.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable

Clock = Callable[[], datetime]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    """Converte para o formato do banco. Data sem fuso é tratada como UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat(timespec="microseconds")


def parse_iso(texto: str) -> datetime:
    """Lê uma data ISO (aceita o 'Z' final) e devolve em UTC."""
    dt = datetime.fromisoformat(texto.strip().replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
