"""Entrypoint `hela-hook <evento>` (hooks do Claude Code). Implementado na Fase 4.

Mesmo como aviso, segue a regra dos hooks da HELA: fail-open. Sai com código 0 e não
escreve nada no stdout, para nunca bloquear nem poluir uma sessão do Claude Code.
"""

from __future__ import annotations

import sys
from typing import Optional

from hela._fases import avisar


def main(argv: Optional[list[str]] = None) -> int:
    avisar("hela-hook", "Fase 4", "captura de experiências pelos hooks SessionStart, UserPromptSubmit, "
           "PostToolUse, PostToolUseFailure, Stop e SessionEnd")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
