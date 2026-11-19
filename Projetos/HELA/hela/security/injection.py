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


_PADROES += [
    # Sinônimos comuns de "ignore o que veio antes" (revisão A-6).
    ("disregard_above", 1.0, re.compile(
        r"\b(?:ignore|disregard|forget|override)\b[^.]{0,20}?\b(?:everything|anything|all|whatever)\b[^.]{0,15}?"
        r"\b(?:above|before|previous|prior|said|earlier)\b|\b(?:desconsidere|ignore|esqueca)\b[^.]{0,15}?"
        r"\btudo\b[^.]{0,15}?\b(?:acima|antes|anterior)\b")),
    ("from_now_on", 0.6, re.compile(r"\bfrom (?:this point|now) on\b|\bdaqui (?:pra|para) frente\b")),
    # Baixar e executar: sozinho é comum em instrução de instalação; junto de outro sinal, quarentena.
    ("pipe_to_shell", 0.6, re.compile(r"\b(?:curl|wget)\b[^\n|]{0,200}\|\s*(?:sudo\s+)?(?:ba|z)?sh\b")),
]

# Caracteres invisíveis que escondem texto do detector (e que um modelo de linguagem ainda lê):
# tags Unicode (U+E0000–E007F, "ASCII smuggling"), seletores de variação, CGJ, preenchimentos
# hangul, largura zero e controles de direção. São tirados do texto GRAVADO, não só da cópia
# que o detector lê (revisão A-6).
_TAGS_UNICODE = re.compile("[\U000E0000-\U000E007F]")
_INVISIVEIS = re.compile(
    "[\U000E0000-\U000E007F\U000E0100-\U000E01EF\uFE00-\uFE0F\u034F\u115F\u1160\u3164\uFFA0"
    "\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD\u180E]")

# Homóglifos mais comuns (cirílico e grego que parecem latinos), já em minúsculas.
_HOMOGLIFOS = str.maketrans({
    "а": "a", "в": "b", "е": "e", "к": "k", "м": "m", "н": "h", "о": "o", "р": "p", "с": "c", "т": "t",
    "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "һ": "h", "ԁ": "d", "ӏ": "l", "ɡ": "g",
    "α": "a", "β": "b", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ο": "o", "ρ": "p", "τ": "t", "υ": "u",
    "χ": "x",
})


def has_unicode_tags(texto: str) -> bool:
    return bool(texto) and bool(_TAGS_UNICODE.search(texto))


def strip_invisible(texto: str) -> str:
    """Tira os caracteres invisíveis usados para esconder texto (vale para o texto gravado)."""
    return _INVISIVEIS.sub("", texto) if texto else texto


@dataclass
class InjectionReport:
    suspicious: bool
    score: float
    matches: list[str] = field(default_factory=list)


def _normalizar(texto: str) -> str:
    # Tira os caracteres de formatação invisíveis (categoria Cf: largura zero, hífen invisível,
    # controle de direção como U+202E), usados para esconder palavras do detector.
    texto = _INVISIVEIS.sub("", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Cf")
    # NFKD desfaz letras de largura cheia e separa os acentos, que saem logo depois.
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    # Quebra de linha vira espaço (os padrões não atravessam linha) e homóglifos viram latinos.
    return re.sub(r"\s+", " ", texto.casefold()).translate(_HOMOGLIFOS)


def detect_injection(text: str, threshold: float = LIMIAR_PADRAO) -> InjectionReport:
    """Pontua o texto pelos padrões encontrados; suspeito se a soma passar do limiar."""
    if not text:
        return InjectionReport(False, 0.0)
    norm = _normalizar(text)
    nomes: list[str] = []
    score = 0.0
    if has_unicode_tags(text):  # não existe uso legítimo de tags Unicode numa memória
        nomes.append("unicode_tags")
        score += 1.0
        escondido = "".join(chr(ord(c) - 0xE0000) for c in _TAGS_UNICODE.findall(text))
        norm = norm + " " + _normalizar(escondido)  # e o que estava escondido também é lido
    for nome, peso, padrao in _PADROES:
        if padrao.search(norm):
            nomes.append(nome)
            score += peso
    return InjectionReport(score >= threshold, round(score, 3), nomes)
