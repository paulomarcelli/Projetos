"""Detecção de prompt injection em textos que vão virar memória.

Uma memória volta para o contexto do Claude em outra sessão. Se alguém conseguir gravar
"ignore as instruções anteriores..." como memória, esse texto reapareceria mais tarde
dentro do contexto. Por isso o texto suspeito vai para a quarentena (status='quarantined'):
continua no banco, visível no dashboard, mas nunca é recuperado automaticamente.

É uma heurística por padrões (inglês e português), com pesos. Não pega tudo, e é por
isso que existe também o invólucro (envelope.py), que marca toda memória como dado.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

LIMIAR_PADRAO = 1.0

_QUAL_EN = r"(?:previous|prior|above|earlier|all|your|the system|system|original)"
_QUAL_PT = r"(?:anteriores|acima|previas|todas|suas|seus|do sistema|originais)"
_OBJ_EN = r"(?:instructions?|rules|prompts?|directives|guidelines)"
_OBJ_PT = r"(?:instrucoes|instrucao|regras|ordens|diretrizes)"

# (nome, peso, regex aplicada ao texto normalizado: minúsculas e sem acentos).
_PADROES: list[tuple[str, float, re.Pattern[str]]] = [
    ("ignore_instructions_en", 1.0, re.compile(
        rf"\b(?:ignore|disregard|forget|override|bypass)\b[^.\n]{{0,40}}?"
        rf"(?:\b{_QUAL_EN}\b[^.\n]{{0,25}}?\b{_OBJ_EN}\b|\b{_OBJ_EN}\b[^.\n]{{0,25}}?\b{_QUAL_EN}\b)")),
    ("ignore_instructions_pt", 1.0, re.compile(
        rf"\b(?:ignore|ignora|ignorar|desconsidere|desconsiderar|esqueca|esquecer|descarte)\b[^.\n]{{0,40}}?"
        rf"(?:\b{_QUAL_PT}\b[^.\n]{{0,25}}?\b{_OBJ_PT}\b|\b{_OBJ_PT}\b[^.\n]{{0,25}}?\b{_QUAL_PT}\b)")),
    ("new_instructions", 1.0, re.compile(
        r"\b(?:new|updated)\s+(?:system\s+)?(?:instructions?|rules)\s*:|\bnovas\s+(?:instrucoes|regras)\s*:")),
    ("reveal_system_prompt", 1.0, re.compile(
        r"\b(?:reveal|print|show|leak|output|repeat|revele|mostre|imprima|vaze|repita)\b[^.\n]{0,30}?"
        r"\b(?:system prompt|prompt do sistema|hidden instructions|instrucoes ocultas)")),
    ("role_tags", 1.0, re.compile(
        r"</?\s*(?:system|assistant|instructions?)\s*>|<\|im_(?:start|end)\|>|\[/?inst\]")),
    ("jailbreak", 1.0, re.compile(r"\b(?:jailbreak|do anything now|developer mode enabled|modo desenvolvedor ativado)\b")),
    ("you_are_now_pt", 1.0, re.compile(r"\ba partir de agora,?\s+voce\s+(?:e|sera|deve|vai|esta)\b")),
    ("you_are_now_en", 0.6, re.compile(r"\byou are now\b|\bfrom now on,?\s+you\b")),
    ("act_unrestricted", 1.0, re.compile(
        r"\b(?:act as|pretend to be|finja ser|aja como)\b[^.\n]{0,40}?"
        r"\b(?:unrestricted|without (?:any )?(?:rules|restrictions|limits)|sem (?:regras|restricoes|limites))")),
    ("exfiltrate", 0.6, re.compile(
        r"\b(?:send|upload|exfiltrate|post|envie|mande|publique)\b[^.\n]{0,40}?"
        r"(?:\.env\b|credentials|credenciais|api keys?|chaves? de api|ssh keys?)")),
]


@dataclass
class InjectionReport:
    suspicious: bool
    score: float
    matches: list[str] = field(default_factory=list)


def _normalizar(texto: str) -> str:
    # Tira os caracteres de formatação invisíveis (categoria Cf: largura zero, hífen invisível,
    # controle de direção como U+202E), usados para esconder palavras do detector.
    texto = "".join(c for c in texto if unicodedata.category(c) != "Cf")
    # NFKD desfaz letras de largura cheia e separa os acentos, que saem logo depois.
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return texto.casefold()


def detect_injection(text: str, threshold: float = LIMIAR_PADRAO) -> InjectionReport:
    """Pontua o texto pelos padrões encontrados; suspeito se a soma passar do limiar."""
    if not text:
        return InjectionReport(False, 0.0)
    norm = _normalizar(text)
    nomes: list[str] = []
    score = 0.0
    for nome, peso, padrao in _PADROES:
        if padrao.search(norm):
            nomes.append(nome)
            score += peso
    return InjectionReport(score >= threshold, round(score, 3), nomes)
