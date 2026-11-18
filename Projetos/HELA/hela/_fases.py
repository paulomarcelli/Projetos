"""Avisos honestos para o que ainda não existe.

Comandos e entrypoints de fases futuras não fingem funcionar: dizem em que fase chegam.
"""

from __future__ import annotations

import sys

CODIGO_OUTRA_FASE = 3


def avisar(comando: str, fase: str, o_que: str) -> str:
    mensagem = (f"hela: '{comando}' ainda não existe nesta versão ({o_que}). "
                f"Chega na {fase} do plano (docs/plano.md, seção 6).")
    print(mensagem, file=sys.stderr)
    return mensagem
