"""Classificação de tarefas por regras (palavras-chave da taxonomia).

É o modo padrão do Task Classifier e continua sendo a fonte da complexidade e das ferramentas
mesmo quando o Naive Bayes assume a categoria. Módulo puro: sem numpy, networkx ou pydantic.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from hela.learning.taxonomy import (
    CATEGORIES, COMPLEXITY_HIGH, COMPLEXITY_LOW, DEFAULT_CATEGORY, STEP_MARKERS, TOOL_HINTS, TOOL_ORDER,
    match_keywords, words,
)

_ENUMERACAO = re.compile(r"(?m)^\s*(?:\d+[.)]|[-*•])\s+")
_ARQUIVO = re.compile(r"[\w./\\-]+\.(?:py|js|ts|tsx|jsx|json|md|css|html|sql|sh|yml|yaml|toml|go|rs|java|rb|php)\b")


@dataclass
class RuleResult:
    category: str
    confidence: float                      # pontos da vencedora / pontos de todas (0 se nenhuma casou)
    scores: dict[str, int]
    matched: dict[str, list[str]]
    complexity: str                        # low | medium | high
    complexity_score: int
    complexity_signals: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {"category": self.category, "confidence": self.confidence, "scores": self.scores,
                "matched": self.matched, "complexity": self.complexity, "complexity_score": self.complexity_score,
                "complexity_signals": self.complexity_signals, "tools": self.tools}


def _complexidade(texto: str, palavras: list[str], categoria: str) -> tuple[str, int, list[str]]:
    pontos, sinais = CATEGORIES[categoria].base_complexity, []
    if pontos:
        sinais.append(f"categoria {categoria}")
    n = len(palavras)
    if n > 80:
        pontos += 2
        sinais.append(f"{n} palavras")
    elif n > 30:
        pontos += 1
        sinais.append(f"{n} palavras")
    altos = match_keywords(palavras, COMPLEXITY_HIGH)
    if altos:
        pontos += min(4, 2 * len(altos))
        sinais.append("escopo amplo: " + ", ".join(altos))
    passos = len(match_keywords(palavras, STEP_MARKERS)) + len(_ENUMERACAO.findall(texto))
    if passos:
        pontos += min(3, passos)
        sinais.append(f"{passos} passos")
    arquivos = len(set(_ARQUIVO.findall(texto)))
    if arquivos >= 3:
        pontos += 1
        sinais.append(f"{arquivos} arquivos citados")
    baixos = match_keywords(palavras, COMPLEXITY_LOW)
    if baixos:
        pontos -= 2
        sinais.append("pedido pequeno: " + ", ".join(baixos))
    nivel = "low" if pontos <= 0 else "medium" if pontos <= 3 else "high"
    return nivel, pontos, sinais


def _ferramentas(palavras: list[str]) -> list[str]:
    achadas = {t for t, kws in TOOL_HINTS.items() if match_keywords(palavras, kws)}
    if "Edit" in achadas:
        achadas.add("Read")  # editar exige ler antes
    return [t for t in TOOL_ORDER if t in achadas]


def classify_by_rules(texto: str) -> RuleResult:
    palavras = words(texto)
    matched = {nome: match_keywords(palavras, cat.keywords) for nome, cat in CATEGORIES.items() if cat.keywords}
    scores = {nome: len(kws) for nome, kws in matched.items() if kws}
    total = sum(scores.values())
    if total:
        ordem = list(CATEGORIES)  # empate: a que vem primeiro na taxonomia
        categoria = max(scores, key=lambda c: (scores[c], -ordem.index(c)))
        confianca = round(scores[categoria] / total, 4)
    else:
        categoria, confianca = DEFAULT_CATEGORY, 0.0
    nivel, pontos, sinais = _complexidade(texto, palavras, categoria)
    return RuleResult(category=categoria, confidence=confianca, scores=scores,
                      matched={c: k for c, k in matched.items() if k}, complexity=nivel,
                      complexity_score=pontos, complexity_signals=sinais, tools=_ferramentas(palavras))
