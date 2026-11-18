"""Entrypoint `hela-api` (FastAPI em 127.0.0.1, servindo o dashboard). Implementado na Fase 5."""

from __future__ import annotations

import sys
from typing import Optional

from hela._fases import CODIGO_OUTRA_FASE, avisar


def main(argv: Optional[list[str]] = None) -> int:
    avisar("hela-api", "Fase 5", "API local e dashboard")
    return CODIGO_OUTRA_FASE


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
