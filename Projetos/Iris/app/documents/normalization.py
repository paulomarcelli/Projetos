"""Normalização CONSERVADORA do texto extraído.

O objetivo é só tornar o texto consistente para busca e leitura, sem mudar o que ele diz:
- nunca resume, traduz, corrige ortografia nem interpreta;
- nunca junta palavras hifenizadas no fim da linha (o hífen pode ser parte da palavra);
- preserva acentos e letras de qualquer idioma.

O que faz (versão "1"):
1. Quebras de linha `\\r\\n` e `\\r` viram `\\n`.
2. Unicode em forma NFC: "e" + acento combinante vira "é" (mesma aparência, mesmo texto).
   Não usa NFKC, que alteraria símbolos como "²" e "½".
3. Ligaduras tipográficas (U+FB00–FB06, como "ﬁ") viram as letras separadas ("fi").
4. Espaços especiais (sem quebra, finos etc.) viram espaço comum; tabulação vira espaço.
5. Remove caracteres invisíveis que não são texto: controles, hífen suave (U+00AD), espaço de
   largura zero, BOM e substitutos UTF-16 isolados.
6. Junta espaços repetidos, tira espaços das pontas de cada linha e deixa no máximo uma linha
   em branco seguida.
"""

from __future__ import annotations

import re
import unicodedata

NORMALIZATION_VERSION = "1"

_LIGADURAS = {
    0xFB00: "ff",
    0xFB01: "fi",
    0xFB02: "fl",
    0xFB03: "ffi",
    0xFB04: "ffl",
    0xFB05: "st",
    0xFB06: "st",
}
_ESPACOS = {cp: " " for cp in (0x00A0, *range(0x2000, 0x200B), 0x202F, 0x205F, 0x3000, 0x09)}
_INVISIVEIS = {cp: None for cp in (0x00AD, 0x200B, 0xFEFF, 0x2060)}
_TABELA = str.maketrans({**_LIGADURAS, **_ESPACOS, **_INVISIVEIS})

_ESPACOS_REPETIDOS = re.compile(r" {2,}")
_MUITAS_LINHAS_VAZIAS = re.compile(r"\n{3,}")


def _remover_controles(texto: str) -> str:
    """Remove controles (exceto \\n) e substitutos isolados (o PostgreSQL não aceita \\x00)."""
    return "".join(c for c in texto if c == "\n" or unicodedata.category(c) not in ("Cc", "Cs"))


def limpar_bruto(texto: str) -> str:
    """O mínimo para o texto bruto poder ir ao banco: tira NUL e substitutos UTF-16 isolados."""
    return "".join(c for c in texto if c != "\x00" and unicodedata.category(c) != "Cs")


def normalizar(texto: str) -> str:
    texto = texto.replace("\r\n", "\n").replace("\r", "\n")
    texto = unicodedata.normalize("NFC", texto)
    texto = texto.translate(_TABELA)
    texto = _remover_controles(texto)
    linhas = (_ESPACOS_REPETIDOS.sub(" ", linha).strip() for linha in texto.split("\n"))
    texto = "\n".join(linhas)
    texto = _MUITAS_LINHAS_VAZIAS.sub("\n\n", texto)
    return texto.strip()
