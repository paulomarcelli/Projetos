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


def novo_servico(caminho, relogio=None, config=None):
    """MemoryService num banco novo, com o embedder padrão."""
    from hela.core.config import HelaConfig
    from hela.memory.embedder import HashingEmbedder
    from hela.memory.service import MemoryService
    from hela.storage.db import Database

    return MemoryService(Database(caminho), HashingEmbedder(), config or HelaConfig(), clock=relogio or RelogioFalso())
