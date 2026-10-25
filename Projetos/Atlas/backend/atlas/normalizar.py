"""Normaliza rótulos qualitativos que modelos menores escrevem de formas variadas.

Só mapeia sinônimos inequívocos ("Média", "moderate", "alta" → "moderado"/"alto"…).
Valores não reconhecidos ficam como estão e o contrato Pydantic os recusa.
"""
from __future__ import annotations

import unicodedata
from typing import Any


def _chave(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto.strip().lower())
    return "".join(c for c in t if not unicodedata.combining(c)).replace("-", " ").replace("_", " ")


NIVEL = {
    "baixo": "baixo", "baixa": "baixo", "low": "baixo",
    "moderado": "moderado", "moderada": "moderado", "medio": "moderado", "media": "moderado", "moderate": "moderado", "medium": "moderado",
    "alto": "alto", "alta": "alto", "high": "alto", "elevado": "alto", "elevada": "alto",
    "muito baixo": "baixo", "muito baixa": "baixo", "very low": "baixo", "leve": "baixo", "fraco": "baixo", "fraca": "baixo", "minimo": "baixo", "minima": "baixo", "reduzido": "baixo", "reduzida": "baixo",
    "intermediario": "moderado", "intermediaria": "moderado", "razoavel": "moderado",
    "muito alto": "alto", "muito alta": "alto", "very high": "alto", "critico": "alto", "critica": "alto", "critical": "alto", "severo": "alto", "severa": "alto", "forte": "alto", "extremo": "alto", "extrema": "alto", "significativo": "alto", "significativa": "alto",
}
NATUREZA = {
    "fato": "fato", "fact": "fato", "fato verificado": "fato",
    "interpretacao": "interpretacao", "interpretation": "interpretacao", "analise": "interpretacao",
    "premissa": "premissa", "assumption": "premissa", "premise": "premissa",
    "hipotese": "hipotese", "hypothesis": "hipotese",
}
CENARIO = {"continuidade": "continuidade", "continuity": "continuidade", "status quo": "continuidade", "escalada": "escalada", "escalation": "escalada", "desescalada": "desescalada", "de escalation": "desescalada", "deescalation": "desescalada"}
POSTURA = {"cooperativa": "cooperativa", "cooperativo": "cooperativa", "cooperative": "cooperativa", "neutra": "neutra", "neutro": "neutra", "neutral": "neutra", "confrontacional": "confrontacional", "confrontational": "confrontacional"}
RELACAO = {"cooperacao": "cooperacao", "cooperation": "cooperacao", "tensao": "tensao", "tension": "tensao", "dependencia": "dependencia", "dependency": "dependencia", "neutra": "neutra", "neutral": "neutra"}
DIMENSAO = {"economico": "economico", "economica": "economico", "economic": "economico", "diplomatico": "diplomatico", "diplomatica": "diplomatico", "diplomatic": "diplomatico", "estrategico": "estrategico", "estrategica": "estrategico", "strategic": "estrategico"}
TIPO_MATRIZ = {"risco": "risco", "risk": "risco", "ameaca": "risco", "threat": "risco", "riscos": "risco", "oportunidade": "oportunidade", "opportunity": "oportunidade", "oportunidades": "oportunidade"}


def _nivel_numerico(valor: float) -> str | None:
    """1–3 → baixo/moderado/alto; 0–1 e 0–100 usam as mesmas faixas do motor (34/67)."""
    if isinstance(valor, bool):
        return None
    if float(valor).is_integer() and 1 <= valor <= 3:
        return ("baixo", "moderado", "alto")[int(valor) - 1]
    escala = valor * 100 if 0 <= valor <= 1 else valor
    if not 0 <= escala <= 100:
        return None
    return "baixo" if escala < 34 else "moderado" if escala < 67 else "alto"


def _m(tabela: dict[str, str], valor: Any) -> Any:
    if isinstance(valor, str):
        chave = _chave(valor)
        if chave in tabela:
            return tabela[chave]
        # "Alto (impacto relevante)" ou "alto - pressão" → usa a primeira palavra/expressão reconhecida
        for sep in ("(", " - ", ":", ",", "/"):
            if sep in chave and chave.split(sep)[0].strip() in tabela:
                return tabela[chave.split(sep)[0].strip()]
        return valor
    if tabela is NIVEL and isinstance(valor, (int, float)):
        return _nivel_numerico(valor) or valor
    return valor


def _ajustar(obj: dict, campo: str, tabela: dict[str, str]) -> None:
    """Só altera campos presentes: um campo ausente deve continuar ausente para o contrato apontar."""
    if campo in obj:
        obj[campo] = _m(tabela, obj[campo])


def _afirmacoes(lista: Any) -> None:
    for a in lista if isinstance(lista, list) else []:
        if isinstance(a, dict):
            _ajustar(a, "natureza", NATUREZA)


def analise(d: dict) -> dict:
    """Aplica os mapeamentos no dicionário da saída do Analyst (in-place) e o devolve."""
    _ajustar(d, "confianca", NIVEL)
    _afirmacoes(d.get("resumo_executivo"))
    for c in d.get("cenarios") or []:
        if isinstance(c, dict):
            _ajustar(c, "tipo", CENARIO)
            _ajustar(c, "plausibilidade", NIVEL)
            _afirmacoes(c.get("narrativa"))
    for i in d.get("impactos") or []:
        if isinstance(i, dict):
            _ajustar(i, "dimensao", DIMENSAO)
            if "natureza" in i:
                i["natureza"] = _m(NATUREZA, i["natureza"])
            if isinstance(i.get("por_cenario"), dict):
                i["por_cenario"] = {_m(CENARIO, k): _m(NIVEL, v) for k, v in i["por_cenario"].items()}
    for m in d.get("matriz") or []:
        if isinstance(m, dict):
            _ajustar(m, "tipo", TIPO_MATRIZ)
            _ajustar(m, "probabilidade", NIVEL)
            _ajustar(m, "impacto", NIVEL)
            if isinstance(m.get("cenarios"), list):
                m["cenarios"] = [_m(CENARIO, x) for x in m["cenarios"]]
    for a in d.get("atores") or []:
        if isinstance(a, dict):
            _ajustar(a, "postura", POSTURA)
    for r in d.get("relacoes") or []:
        if isinstance(r, dict):
            _ajustar(r, "tipo", RELACAO)
            _ajustar(r, "intensidade", NIVEL)
    return d
