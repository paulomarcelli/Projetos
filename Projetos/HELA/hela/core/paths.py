"""Onde a HELA guarda os dados.

Tudo fica em uma pasta só, ~/.hela por padrão. A variável HELA_HOME troca essa pasta
(os testes usam isso para nunca tocar nos dados reais).
"""

from __future__ import annotations

import os
from pathlib import Path


def hela_home() -> Path:
    """Pasta de dados da HELA: $HELA_HOME, ou ~/.hela."""
    valor = os.environ.get("HELA_HOME", "").strip()
    if valor:
        return Path(valor).expanduser()
    return Path(os.path.expanduser("~")) / ".hela"


def db_path(home: Path | None = None) -> Path:
    """Caminho do banco SQLite dentro da pasta de dados."""
    return (home or hela_home()) / "hela.db"


def config_path(home: Path | None = None) -> Path:
    """Caminho do config.json do usuário (opcional; os padrões valem sem ele)."""
    return (home or hela_home()) / "config.json"
