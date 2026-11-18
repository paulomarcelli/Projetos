"""Configuração comum dos testes.

Todos os testes rodam com HELA_HOME e HOME apontando para pastas temporárias:
assim nenhum teste toca no ~/.hela real, mesmo que algum código esqueça o HELA_HOME.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterator

import pytest


@pytest.fixture(autouse=True)
def hela_home_temporario(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    home = tmp_path / "hela-home"
    monkeypatch.setenv("HELA_HOME", str(home))
    monkeypatch.setenv("HOME", str(tmp_path / "home-falso"))
    return home


@pytest.fixture(autouse=True)
def fecha_conexoes(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Fecha, no fim de cada teste, as conexões SQLite que ele abriu e esqueceu abertas."""
    abertas: list[sqlite3.Connection] = []
    original = sqlite3.connect

    def registrar(*args, **kwargs):  # type: ignore[no-untyped-def]
        conn = original(*args, **kwargs)
        abertas.append(conn)
        return conn

    monkeypatch.setattr(sqlite3, "connect", registrar)
    yield
    for conn in abertas:
        conn.close()
