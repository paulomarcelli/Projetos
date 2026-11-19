"""Configuração do hook sem pydantic (revisão F3-A2: pydantic custa ~70 ms só para importar).

Só as chaves que o caminho leve usa. Os padrões são os mesmos do HelaConfig (um teste confere) e o
HELA_HOME/config.json do usuário é mesclado por cima, com a mesma checagem de tipo e de faixa das chaves
usadas aqui. Arquivo inválido levanta ValueError: o hook trata como "não fazer nada" (fail-open).
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

DEFAULTS: dict[str, Any] = {
    "embedder": {"backend": "hashing", "dim": 512},
    "search": {
        "rrf_k": 60, "candidates": 50, "min_cosine": 0.15,
        "weights": {"bm25": 1.0, "cosine": 1.0, "recency": 0.3, "quality": 0.3, "importance": 0.3, "graph": 0.5},
        "graph_activation": True, "activation_steps": 2, "activation_decay": 0.5,
    },
    "security": {"entropy_threshold": 4.2, "entropy_min_length": 24},
    "router": {"min_relevance": 0.35, "min_trust": 0.1, "limit_per_step": 5, "budget_tokens": 1200},
    "optimizer": {"shingle_size": 3, "jaccard_threshold": 0.8, "primary_count": 3, "chars_per_token": 4},
    "integration": {
        "enabled": True, "hook_deadline_ms": 250, "hook_busy_timeout_ms": 150, "hook_max_input_bytes": 5_000_000,
        "observation_max_chars": 300, "web_taint_hours": 12.0,
    },
}

# Faixas (mínimo, máximo) iguais às do HelaConfig para as chaves numéricas usadas aqui.
_FAIXAS: dict[str, tuple[float, float]] = {
    "embedder.dim": (16, 8192), "search.rrf_k": (1, 10**9), "search.candidates": (1, 1000),
    "search.min_cosine": (0, 1), "search.activation_steps": (1, 4), "search.activation_decay": (1e-9, 1 - 1e-9),
    "security.entropy_threshold": (1e-9, 10**9), "security.entropy_min_length": (12, 10**9),
    "router.min_relevance": (0, 1), "router.min_trust": (0, 1), "router.limit_per_step": (1, 50),
    "router.budget_tokens": (50, 2400), "optimizer.shingle_size": (1, 10), "optimizer.jaccard_threshold": (1e-9, 1),
    "optimizer.primary_count": (0, 20), "optimizer.chars_per_token": (1, 10),
    "integration.hook_deadline_ms": (50, 5000), "integration.hook_busy_timeout_ms": (0, 2000),
    "integration.hook_max_input_bytes": (10_000, 100_000_000), "integration.observation_max_chars": (50, 2000),
    "integration.web_taint_hours": (1e-9, 720),
}
_PESOS = ("bm25", "cosine", "recency", "quality", "importance", "graph")


def _conferir(chave: str, padrao: Any, valor: Any) -> Any:
    if isinstance(padrao, bool):
        if not isinstance(valor, bool):
            raise ValueError(f"{chave} precisa ser true ou false")
        return valor
    if isinstance(padrao, (int, float)):
        if isinstance(valor, bool) or not isinstance(valor, (int, float)):
            raise ValueError(f"{chave} precisa ser um número")
        if isinstance(padrao, int) and not isinstance(valor, int):
            raise ValueError(f"{chave} precisa ser inteiro")
        minimo, maximo = _FAIXAS.get(chave, (0 if chave.split(".")[-1] in _PESOS else float("-inf"), float("inf")))
        if not minimo <= valor <= maximo:
            raise ValueError(f"{chave} fora da faixa")
        return float(valor) if isinstance(padrao, float) else valor
    if isinstance(padrao, str):
        if not isinstance(valor, str):
            raise ValueError(f"{chave} precisa ser texto")
        return valor
    return valor


def _mesclar(base: dict[str, Any], extra: dict[str, Any], prefixo: str = "") -> None:
    for chave, valor in extra.items():
        if chave not in base:
            continue  # chave que o hook não usa: quem valida é o HelaConfig no Engine
        nome = f"{prefixo}{chave}"
        if isinstance(base[chave], dict):
            if not isinstance(valor, dict):
                raise ValueError(f"{nome} precisa ser um objeto")
            _mesclar(base[chave], valor, nome + ".")
        else:
            base[chave] = _conferir(nome, base[chave], valor)


def load_light_config(home: Path) -> dict[str, Any]:
    """Padrões + HELA_HOME/config.json (só as chaves do hook)."""
    cfg = copy.deepcopy(DEFAULTS)
    caminho = Path(home) / "config.json"
    try:
        texto = caminho.read_text(encoding="utf-8")
    except FileNotFoundError:
        return cfg
    except OSError as erro:
        raise ValueError(f"config.json ilegível: {type(erro).__name__}") from None
    try:
        dados = json.loads(texto)
    except ValueError:
        raise ValueError("config.json inválido (JSON)") from None
    if not isinstance(dados, dict):
        raise ValueError("config.json precisa ser um objeto JSON")
    _mesclar(cfg, dados)
    if cfg["embedder"]["backend"] not in ("hashing", "sentence-transformers", "auto"):
        raise ValueError("embedder.backend inválido")
    return cfg
