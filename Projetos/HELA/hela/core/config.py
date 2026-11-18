"""Configuração da HELA.

Os padrões vivem aqui, no modelo HelaConfig, e o arquivo config/config.json do
repositório é uma cópia deles para leitura (um teste garante que os dois são iguais).
O usuário pode criar HELA_HOME/config.json com só o que quer mudar: o arquivo é
mesclado por cima dos padrões e validado.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from hela.core.paths import config_path


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EmbedderConfig(_Base):
    # hashing: padrão, sem dependências. sentence-transformers / auto: opcional (extra "neural").
    backend: Literal["hashing", "sentence-transformers", "auto"] = "hashing"
    dim: int = Field(512, ge=16, le=8192)
    model: str = "sentence-transformers/all-MiniLM-L6-v2"


class SearchWeights(_Base):
    """Peso de cada sinal na fusão RRF."""

    bm25: float = Field(1.0, ge=0)
    cosine: float = Field(1.0, ge=0)
    recency: float = Field(0.3, ge=0)
    quality: float = Field(0.3, ge=0)
    importance: float = Field(0.3, ge=0)
    graph: float = Field(0.5, ge=0)


class SearchConfig(_Base):
    rrf_k: int = Field(60, ge=1)
    candidates: int = Field(50, ge=1, le=1000)   # quantos candidatos cada sinal principal traz
    limit: int = Field(10, ge=1, le=200)
    min_cosine: float = Field(0.15, ge=0, le=1)   # abaixo disso o cosseno não indica candidato
    weights: SearchWeights = SearchWeights()


class MemoryConfig(_Base):
    max_chars: int = Field(20000, ge=100)
    default_importance: float = Field(0.5, ge=0, le=1)
    default_quality: float = Field(0.5, ge=0, le=1)
    default_confidence: float = Field(0.5, ge=0, le=1)
    near_duplicate_threshold: float = Field(0.9, gt=0, le=1)


class ConsolidationConfig(_Base):
    threshold: float = Field(0.9, gt=0, le=1)


class SecurityConfig(_Base):
    entropy_threshold: float = Field(4.2, gt=0)
    entropy_min_length: int = Field(24, ge=12)
    injection_threshold: float = Field(1.0, gt=0)
    quarantine_on_injection: bool = True


class StorageConfig(_Base):
    busy_timeout_ms: int = Field(3000, ge=0, le=60000)


class HelaConfig(_Base):
    version: int = 1
    embedder: EmbedderConfig = EmbedderConfig()
    search: SearchConfig = SearchConfig()
    memory: MemoryConfig = MemoryConfig()
    consolidation: ConsolidationConfig = ConsolidationConfig()
    security: SecurityConfig = SecurityConfig()
    storage: StorageConfig = StorageConfig()


def _mesclar(base: dict[str, Any], extra: dict[str, Any]) -> dict[str, Any]:
    saida = dict(base)
    for chave, valor in extra.items():
        if isinstance(valor, dict) and isinstance(saida.get(chave), dict):
            saida[chave] = _mesclar(saida[chave], valor)
        else:
            saida[chave] = valor
    return saida


def load_config(home: Path | None = None) -> HelaConfig:
    """Padrões + HELA_HOME/config.json (se existir). Erros citam o arquivo."""
    caminho = config_path(home)
    if not caminho.exists():
        return HelaConfig()
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        if not isinstance(dados, dict):
            raise ValueError("o arquivo precisa ser um objeto JSON")
        return HelaConfig.model_validate(_mesclar(HelaConfig().model_dump(), dados))
    except (json.JSONDecodeError, ValidationError, ValueError) as erro:
        raise ValueError(f"config.json inválido em {caminho}: {erro}") from erro
