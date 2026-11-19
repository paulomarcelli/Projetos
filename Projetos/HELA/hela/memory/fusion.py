"""Funções puras da busca híbrida (RRF, ordenação e recência).

Ficam fora de hela/memory/search.py para o caminho leve do hook (hela/integration/light_recall.py)
usar exatamente as mesmas, sem carregar pydantic (revisão F3-A2).
"""

from __future__ import annotations

from hela.core.clock import parse_iso


def rrf_fuse(rankings: dict[str, list[str]], weights: dict[str, float], k: int) -> dict[str, float]:
    """Funde listas ordenadas (melhor primeiro). Devolve id → score, do maior para o menor."""
    scores: dict[str, float] = {}
    for sinal, ids in rankings.items():
        peso = weights.get(sinal, 0.0)
        if peso <= 0:
            continue
        for posicao, mid in enumerate(ids, start=1):
            scores[mid] = scores.get(mid, 0.0) + peso / (k + posicao)
    return dict(sorted(scores.items(), key=lambda kv: (-kv[1], kv[0])))


def _ordenar(valores: dict[str, float]) -> list[str]:
    """Ids do maior valor para o menor (empate decidido pelo id, para ser determinístico)."""
    return [mid for mid, _ in sorted(valores.items(), key=lambda kv: (-kv[1], kv[0]))]


def _ordem_recencia(row) -> float:
    """Valor para ordenar por recência: o mais novo entre último acesso e última edição."""
    marcas = [m for m in (row["last_accessed"], row["updated_at"]) if m]
    return max(parse_iso(m).timestamp() for m in marcas) if marcas else 0.0
