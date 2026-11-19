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

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from hela.core.errors import describe_validation_error
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
    # Ativação espalhada no grafo de relações (hela/memory/activation.py), sem networkx.
    graph_activation: bool = True
    activation_steps: int = Field(2, ge=1, le=4)
    activation_decay: float = Field(0.5, gt=0, lt=1)


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


class ClassifierConfig(_Base):
    """Naive Bayes: só treina com rótulos explicit/feedback e só assume se bater as regras."""

    min_per_class: int = Field(5, ge=2)        # classe com menos exemplos fica fora do treino
    min_classes: int = Field(2, ge=2)
    cv_folds: int = Field(5, ge=2, le=20)
    alpha: float = Field(1.0, gt=0)            # suavização de Laplace
    min_cv_accuracy: float = Field(0.6, ge=0, le=1)
    max_vocab: int = Field(5000, ge=50, le=200000)


class RankerConfig(_Base):
    """Strategy Ranker (heurística estatística). Os pesos ficam em config/ranker_weights.json e na tabela versions."""

    z: float = Field(1.96, gt=0)               # 95% no intervalo de Wilson
    quality_prior: float = Field(0.5, ge=0, le=1)
    quality_prior_weight: float = Field(2.0, ge=0)
    min_obs: int = Field(3, ge=1)              # abaixo disso a recomendação sai marcada como pouco observada
    thompson: bool = False                     # exploração opcional (Thompson sampling), desligada


class FeedbackConfig(_Base):
    reinforce_quality: float = Field(0.05, ge=0, le=0.5)
    reinforce_confidence: float = Field(0.05, ge=0, le=0.5)
    decay_quality: float = Field(0.08, ge=0, le=0.5)
    decay_confidence: float = Field(0.05, ge=0, le=0.5)
    # Teto para reforço vindo de máquina (MCP, hooks): daí para cima, só nota humana (revisão F3-A3).
    machine_quality_cap: float = Field(0.8, ge=0, le=1)


class EvolutionConfig(_Base):
    min_outcomes: int = Field(20, ge=2)        # replay com menos resultados não propõe pesos
    weight_step: float = Field(0.1, gt=0, le=0.5)
    min_improvement: float = Field(0.002, ge=0)  # melhora mínima no Brier para recomendar
    promote_min_obs: int = Field(5, ge=1)
    promote_min_wilson: float = Field(0.6, ge=0, le=1)
    deprecate_min_obs: int = Field(5, ge=1)
    duplicate_threshold: float = Field(0.9, gt=0, le=1)


class LearningConfig(_Base):
    classifier: ClassifierConfig = ClassifierConfig()
    ranker: RankerConfig = RankerConfig()
    feedback: FeedbackConfig = FeedbackConfig()
    evolution: EvolutionConfig = EvolutionConfig()


class RouterConfig(_Base):
    min_relevance: float = Field(0.35, ge=0, le=1)  # max(cosseno, cobertura) mínimo para entrar no contexto
    min_trust: float = Field(0.1, ge=0, le=1)       # quality × confidence mínimo
    limit_per_step: int = Field(5, ge=1, le=50)
    budget_tokens: int = Field(1200, ge=50, le=2400)
    max_budget_tokens: int = Field(2400, ge=50, le=2400)  # 2400 × 4 caracteres < 10.000 (limite do hook)
    max_strategies: int = Field(3, ge=0, le=20)


class OptimizerConfig(_Base):
    shingle_size: int = Field(3, ge=1, le=10)
    jaccard_threshold: float = Field(0.8, gt=0, le=1)
    primary_count: int = Field(3, ge=0, le=20)
    chars_per_token: int = Field(4, ge=1, le=10)


class ExecutionConfig(_Base):
    allowed_hosts: list[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1", "::1"])


class HelaConfig(_Base):
    version: int = 1
    embedder: EmbedderConfig = EmbedderConfig()
    search: SearchConfig = SearchConfig()
    memory: MemoryConfig = MemoryConfig()
    consolidation: ConsolidationConfig = ConsolidationConfig()
    security: SecurityConfig = SecurityConfig()
    storage: StorageConfig = StorageConfig()
    learning: LearningConfig = LearningConfig()
    router: RouterConfig = RouterConfig()
    optimizer: OptimizerConfig = OptimizerConfig()
    execution: ExecutionConfig = ExecutionConfig()

    @model_validator(mode="after")
    def _orcamento(self) -> "HelaConfig":
        if self.router.budget_tokens > self.router.max_budget_tokens:
            raise ValueError("router.budget_tokens não pode passar de router.max_budget_tokens")
        return self


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
    except ValidationError as erro:
        raise ValueError(f"config.json inválido em {caminho}: {describe_validation_error(erro)}") from None
    except (json.JSONDecodeError, ValueError) as erro:
        raise ValueError(f"config.json inválido em {caminho}: {erro}") from erro
