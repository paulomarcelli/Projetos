"""Relevância absoluta de uma memória para uma consulta (cobertura dos termos).

Usada pelo Cognitive Router e pelo caminho leve do hook; fica aqui, sem dependências pesadas,
para os dois usarem a mesma regra (revisão F3-A2).
"""

from __future__ import annotations

from hela.learning.taxonomy import STOPWORDS, normalize, words


def query_terms(texto: str) -> list[str]:
    return list(dict.fromkeys(p for p in words(texto) if len(p) >= 2 and p not in STOPWORDS))


def coverage(consulta: list[str], texto: str) -> float:
    """Fração dos termos da consulta presentes no texto (prefixo de 5 letras para termos longos)."""
    if not consulta:
        return 0.0
    palavras = set(normalize(texto).split())
    prefixos = {p[:5] for p in palavras if len(p) >= 5}
    achados = sum(1 for t in consulta if t in palavras or (len(t) >= 5 and t[:5] in prefixos))
    return achados / len(consulta)
