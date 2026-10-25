"""Configuração central. Tudo vem de variáveis de ambiente; nenhum segredo no código."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _int(nome: str, padrao: int) -> int:
    try:
        return int(os.environ.get(nome, padrao))
    except ValueError:
        return padrao


def _float(nome: str, padrao: float) -> float:
    try:
        return float(os.environ.get(nome, padrao))
    except ValueError:
        return padrao


@dataclass(frozen=True)
class Config:
    gemini_api_key: str | None = field(default_factory=lambda: os.environ.get("GEMINI_API_KEY") or None)
    gemini_model: str = field(default_factory=lambda: os.environ.get("ATLAS_GEMINI_MODEL", "gemini-3.6-flash"))
    tavily_api_key: str | None = field(default_factory=lambda: os.environ.get("TAVILY_API_KEY") or None)
    # "auto": usa provedores reais se houver chave; "demo": força o modo demonstrativo
    modo: str = field(default_factory=lambda: os.environ.get("ATLAS_MODO", "auto").lower())
    db_path: Path = field(default_factory=lambda: Path(os.environ.get("ATLAS_DB", Path(__file__).resolve().parent.parent / "atlas.db")))
    max_revisoes: int = field(default_factory=lambda: _int("ATLAS_MAX_REVISOES", 2))
    max_buscas: int = field(default_factory=lambda: _int("ATLAS_MAX_BUSCAS", 4))
    resultados_por_busca: int = field(default_factory=lambda: _int("ATLAS_RESULTADOS_POR_BUSCA", 4))
    timeout_s: float = field(default_factory=lambda: _float("ATLAS_TIMEOUT_S", 45.0))
    tentativas_api: int = field(default_factory=lambda: _int("ATLAS_TENTATIVAS_API", 2))
    # teto de chamadas de IA por simulação (protege a cota gratuita)
    max_chamadas_llm: int = field(default_factory=lambda: _int("ATLAS_MAX_CHAMADAS_LLM", 8))
    # teto diário de simulações reais (0 = sem teto)
    max_simulacoes_dia: int = field(default_factory=lambda: _int("ATLAS_MAX_SIMULACOES_DIA", 40))
    cache_horas: int = field(default_factory=lambda: _int("ATLAS_CACHE_HORAS", 24))
    origens_cors: tuple[str, ...] = field(default_factory=lambda: tuple(o.strip() for o in os.environ.get("ATLAS_CORS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()))

    @property
    def ia_real(self) -> bool:
        return self.modo != "demo" and bool(self.gemini_api_key)

    @property
    def busca_real(self) -> bool:
        return self.modo != "demo" and bool(self.tavily_api_key)


def carregar() -> Config:
    """Lê backend/.env (se existir) sem sobrescrever variáveis já definidas no ambiente."""
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)
    except ImportError:  # python-dotenv é opcional
        pass
    return Config()
