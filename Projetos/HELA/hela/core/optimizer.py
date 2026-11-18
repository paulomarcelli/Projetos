"""Context Optimizer: o menor contexto que ainda carrega o que importa.

Passos:
1. Quase-duplicatas: Jaccard dos shingles (k palavras) ≥ limiar → fica a de maior valor.
2. Frases redundantes entre memórias: uma frase (prosa) já entregue por uma memória não se repete
   na seguinte. Trechos protegidos idênticos também não se repetem (continuam aparecendo uma vez).
3. Empacotamento guloso dentro do orçamento:
   - as principais (as `primary_count` de maior valor) vão inteiras; se a inteira não cabe, vai o resumo;
   - as secundárias vão resumidas, escolhidas por valor/token (maior densidade primeiro).
4. Tokens estimados (caracteres / 4, rótulo "estimado") antes e depois.

Trechos protegidos **nunca são cortados nem alterados**: blocos de código entre cercas, linhas de
comando, linhas com caminho de arquivo, linhas de erro e linhas com código entre crases. Num resumo,
comandos, caminhos e erros vão inteiros; um bloco de código vai inteiro ou é trocado inteiro pelo
marcador "[código omitido: N linhas; íntegra na memória <id>]". Só a prosa pode ser encurtada.

Módulo puro: sem numpy, networkx ou pydantic (os hooks da Fase 4 podem usar).
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Optional

from hela.security.envelope import wrap_as_data

PROTECTED = frozenset({"code", "command", "path", "error", "inline_code"})
MAX_PROTECTED_IN_SUMMARY = 5
MAX_SUMMARY_SENTENCE = 240

_CERCA = re.compile(r"(```|~~~).*?\1", re.S)
_COMANDO = re.compile(
    r"^\s*(?:\$\s+|>\s+|PS>\s*)?(?:sudo\s+)?(?:pip3?|npm|npx|pnpm|yarn|git|python[0-9.]*|pytest|uv|uvx|node|deno|"
    r"ffmpeg|ffprobe|blender|docker|kubectl|make|cargo|go|curl|wget|cd|ls|cp|mv|rm|mkdir|chmod|chown|cat|grep|rg|"
    r"sed|awk|tar|zip|unzip|ssh|scp|psql|sqlite3|bash|sh|zsh|export|source|claude|hela|gh|brew|apt|apt-get|"
    r"\.{0,2}/[\w./-]+|\.venv/bin/\w+)(?:\s|$)")
_ERRO = re.compile(r"(Error|Exception)\b|Traceback|\bFAIL(ED)?\b|\bfatal:|\berro\b|\berror\b|\bfalh(a|ou)\b|"
                   r"[Ee]xit code|exit status|\berrno\b|(?-i:\bE[A-Z]{3,}\b)|panic:|Segmentation fault|\bwarning:",
                   re.IGNORECASE)
_CAMINHO = re.compile(
    r"(?:~|\.{1,2})?/[\w.@-]+(?:/[\w.@-]+)+|\b[A-Za-z]:\\[\w\\. -]+|"
    r"\b[\w-]+\.(?:py|js|mjs|ts|tsx|jsx|json|md|toml|yaml|yml|sh|ps1|css|html|sql|txt|csv|log|cfg|ini|lock|blend)\b")
_FRASE = re.compile(r"(?<=[.!?])\s+")


@dataclass
class Segment:
    kind: str          # code | command | path | error | inline_code | prose
    text: str
    line: int


@dataclass
class ContextItem:
    id: str
    kind: str
    content: str
    title: Optional[str] = None
    summary: Optional[str] = None
    value: float = 1.0
    project: Optional[str] = None


@dataclass
class OptimizedContext:
    text: str
    items: list[dict] = field(default_factory=list)
    dropped: list[dict] = field(default_factory=list)
    tokens_raw: int = 0
    tokens_optimized: int = 0
    budget_tokens: int = 0
    removed_sentences: int = 0
    token_source: str = "estimated"

    def as_dict(self) -> dict:
        return dict(self.__dict__)


def estimate_tokens(texto: str, chars_per_token: int = 4) -> int:
    """Estimativa local (não é o contador do provedor): ⌈caracteres / chars_per_token⌉."""
    return math.ceil(len(texto) / chars_per_token) if texto else 0


def _norm(texto: str) -> str:
    return re.sub(r"\s+", " ", texto.strip().casefold()).rstrip(".!?;:")


def shingles(texto: str, k: int = 3) -> set[tuple[str, ...]]:
    palavras = re.findall(r"\w+", texto.casefold())
    if len(palavras) < k:
        return {tuple(palavras)} if palavras else set()
    return {tuple(palavras[i:i + k]) for i in range(len(palavras) - k + 1)}


def jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    return len(a & b) / len(a | b) if (a or b) else 0.0


def _tipo_da_linha(linha: str) -> str:
    if "`" in linha:
        return "inline_code"
    if _COMANDO.match(linha):
        return "command"
    if _ERRO.search(linha):
        return "error"
    if _CAMINHO.search(linha):
        return "path"
    if linha.startswith(("    ", "\t")):
        return "code"
    return "prose"


def segments(texto: str) -> list[Segment]:
    """Divide o texto em trechos: blocos de código e linhas protegidas inteiros, prosa em frases."""
    saida: list[Segment] = []
    linha_n = 0

    def linhas(pedaco: str) -> None:
        nonlocal linha_n
        for linha in pedaco.split("\n"):
            if not linha.strip():
                continue
            tipo = _tipo_da_linha(linha)
            if tipo == "prose":
                for frase in _FRASE.split(linha.strip()):
                    if frase.strip():
                        saida.append(Segment("prose", frase.strip(), linha_n))
            else:
                saida.append(Segment(tipo, linha.rstrip(), linha_n))
            linha_n += 1

    pos = 0
    for m in _CERCA.finditer(texto or ""):
        linhas(texto[pos:m.start()])
        saida.append(Segment("code", m.group(0), linha_n))
        linha_n += 1
        pos = m.end()
    linhas((texto or "")[pos:])
    return saida


def _montar(segs: list[Segment]) -> str:
    """Junta os trechos: os da mesma linha com espaço, linhas diferentes com quebra de linha."""
    linhas: dict[int, list[str]] = {}
    for s in segs:
        linhas.setdefault(s.line, []).append(s.text)
    return "\n".join(" ".join(partes) for _, partes in sorted(linhas.items()))


class _Vistos:
    def __init__(self) -> None:
        self.prosa: set[str] = set()
        self.protegidos: set[str] = set()

    def filtrar(self, segs: list[Segment]) -> tuple[list[Segment], int, "_Vistos"]:
        """Tira o que já foi entregue. Devolve os trechos, quantas frases saíram e os vistos atualizados."""
        novo = _Vistos()
        novo.prosa, novo.protegidos = set(self.prosa), set(self.protegidos)
        mantidos, removidas = [], 0
        for s in segs:
            if s.kind == "prose":
                chave = _norm(s.text)
                if chave in novo.prosa:
                    removidas += 1
                    continue
                novo.prosa.add(chave)
            else:
                if s.text in novo.protegidos:
                    continue
                novo.protegidos.add(s.text)
            mantidos.append(s)
        return mantidos, removidas, novo


def _corpo(item: ContextItem, modo: str, vistos: _Vistos) -> tuple[str, int, _Vistos]:
    segs = segments(item.content)
    if modo == "full":
        mantidos, removidas, novos = vistos.filtrar(segs)
        return _montar(mantidos), removidas, novos
    # Resumo: o resumo da memória (ou a primeira frase) + comandos, caminhos e erros inteiros + marcadores.
    base = segments(item.summary) if item.summary else [s for s in segs if s.kind == "prose"][:1]
    if not item.summary and base and len(base[0].text) > MAX_SUMMARY_SENTENCE:
        corte = base[0].text[:MAX_SUMMARY_SENTENCE].rsplit(" ", 1)[0]
        base = [Segment("prose", corte + "…", base[0].line)]
    for s in base:
        s.line = -1  # o resumo abre o texto
    protegidos = [s for s in segs if s.kind in PROTECTED - {"code"}]
    escolhidos = protegidos[:MAX_PROTECTED_IN_SUMMARY]
    marcadores = [Segment("marker", f"[código omitido: {s.text.count(chr(10)) + 1} linhas; íntegra na memória "
                                    f"{item.id}]", s.line) for s in segs if s.kind == "code"]
    sobra = len(protegidos) - len(escolhidos)
    if sobra > 0:
        marcadores.append(Segment("marker", f"[+{sobra} linhas de comando, caminho ou erro omitidas; íntegra na "
                                            f"memória {item.id}]", 10 ** 6))
    mantidos, removidas, novos = vistos.filtrar(base + escolhidos)
    return _montar(mantidos + marcadores), removidas, novos


def _envelope(escolhidos: list[tuple[ContextItem, str, str]]) -> str:
    if not escolhidos:
        return ""
    ordem = sorted(escolhidos, key=lambda x: (-x[0].value, x[0].id))
    return wrap_as_data([{"id": it.id, "kind": it.kind, "project": it.project, "title": it.title,
                          "score": round(it.value, 4), "content": corpo} for it, _modo, corpo in ordem])


def optimize_context(items: list[ContextItem], budget_tokens: int, primary_count: int = 3,
                     jaccard_threshold: float = 0.8, shingle_size: int = 3,
                     chars_per_token: int = 4) -> OptimizedContext:
    if budget_tokens <= 0:
        raise ValueError("o orçamento de tokens precisa ser > 0")

    def tokens(texto: str) -> int:
        return estimate_tokens(texto, chars_per_token)

    bruto = tokens(_envelope([(it, "full", it.content) for it in items]))
    ordem = sorted(items, key=lambda it: (-it.value, it.id))
    mantidos: list[ContextItem] = []
    assinaturas: list[set] = []
    descartados: list[dict] = []
    for it in ordem:  # 1. quase-duplicatas
        sh = shingles(it.content, shingle_size)
        dono = next((m for m, s in zip(mantidos, assinaturas) if jaccard(sh, s) >= jaccard_threshold), None)
        if dono is not None:
            descartados.append({"id": it.id, "reason": "near_duplicate", "duplicate_of": dono.id})
            continue
        mantidos.append(it)
        assinaturas.append(sh)

    escolhidos: list[tuple[ContextItem, str, str]] = []
    vistos = _Vistos()
    frases_removidas = 0
    custo_atual = 0

    def aceitar(it: ContextItem, modo: str) -> bool:
        nonlocal vistos, frases_removidas, custo_atual
        corpo, removidas, novos = _corpo(it, modo, vistos)
        if not corpo.strip():
            return False
        total = tokens(_envelope(escolhidos + [(it, modo, corpo)]))
        if total > budget_tokens:
            return False
        escolhidos.append((it, modo, corpo))
        vistos, frases_removidas, custo_atual = novos, frases_removidas + removidas, total
        return True

    principais, secundarias = mantidos[:primary_count], mantidos[primary_count:]
    for it in principais:  # 2. as principais, inteiras (ou o resumo, se a inteira não cabe)
        if not (aceitar(it, "full") or aceitar(it, "summary")):
            descartados.append({"id": it.id, "reason": "budget"})
    restantes = list(secundarias)
    while restantes:  # 3. as secundárias, resumidas, por valor/token
        melhor = None
        for it in restantes:
            corpo, _r, _n = _corpo(it, "summary", vistos)
            if not corpo.strip():
                continue
            total = tokens(_envelope(escolhidos + [(it, "summary", corpo)]))
            if total <= budget_tokens:
                densidade = it.value / max(1, total - custo_atual)
                if melhor is None or densidade > melhor[0]:
                    melhor = (densidade, it)
        if melhor is None:
            break
        aceitar(melhor[1], "summary")
        restantes.remove(melhor[1])
    descartados += [{"id": it.id, "reason": "budget"} for it in restantes]

    texto = _envelope(escolhidos)
    lista = [{"id": it.id, "mode": modo, "value": round(it.value, 4), "tokens": tokens(corpo)}
             for it, modo, corpo in sorted(escolhidos, key=lambda x: (-x[0].value, x[0].id))]
    return OptimizedContext(text=texto, items=lista, dropped=descartados, tokens_raw=bruto,
                            tokens_optimized=tokens(texto), budget_tokens=budget_tokens,
                            removed_sentences=frases_removidas)
