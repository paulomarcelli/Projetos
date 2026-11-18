"""Normalização de texto para deduplicação.

Duas memórias são "a mesma" quando o texto normalizado é igual: mesma forma Unicode
(NFKC), sem diferença de maiúsculas e com espaços colapsados. A pontuação é mantida de
propósito: em código e comandos, "a.b" e "ab" são coisas diferentes.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata

_ESPACOS = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    return _ESPACOS.sub(" ", unicodedata.normalize("NFKC", text or "").casefold()).strip()


def content_hash(text: str) -> str:
    """sha256 (hex) do texto normalizado."""
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()
