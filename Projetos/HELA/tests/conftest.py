"""Configuração comum dos testes.

Todos os testes rodam com HELA_HOME e HOME apontando para pastas temporárias:
assim nenhum teste toca no ~/.hela real, mesmo que algum código esqueça o HELA_HOME.
"""

from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def hela_home_temporario(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    home = tmp_path / "hela-home"
    monkeypatch.setenv("HELA_HOME", str(home))
    monkeypatch.setenv("HOME", str(tmp_path / "home-falso"))
    return home
