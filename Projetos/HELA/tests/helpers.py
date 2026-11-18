"""Utilitários dos testes (relógio controlável e montagem do serviço)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone


class RelogioFalso:
    """Relógio que só anda quando o teste manda."""

    def __init__(self, inicio: datetime | None = None) -> None:
        self.agora = inicio or datetime(2026, 11, 18, 12, 0, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.agora

    def avancar(self, **kwargs: float) -> None:
        self.agora += timedelta(**kwargs)
