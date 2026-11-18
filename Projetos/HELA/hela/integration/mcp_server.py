"""Entrypoint `hela-mcp` (servidor MCP em stdio). Implementado na Fase 4."""

from __future__ import annotations

import sys
from typing import Optional

from hela._fases import CODIGO_OUTRA_FASE, avisar


def main(argv: Optional[list[str]] = None) -> int:
    avisar("hela-mcp", "Fase 4", "servidor MCP com hela_recall, hela_learn e as outras ferramentas")
    return CODIGO_OUTRA_FASE


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
