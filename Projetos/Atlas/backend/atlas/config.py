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
    # no roteamento, vários modelos do Gemini: cada um tem cota gratuita própria (ex.: 20 req/dia por modelo)
    gemini_modelos_txt: str = field(default_factory=lambda: os.environ.get("ATLAS_GEMINI_MODELOS", ""))
    # opcional: low | high — nível de raciocínio dos modelos Gemini 3 (low responde mais rápido)
    gemini_thinking: str | None = field(default_factory=lambda: os.environ.get("ATLAS_GEMINI_THINKING") or None)
    tavily_api_key: str | None = field(default_factory=lambda: os.environ.get("TAVILY_API_KEY") or None)
    # provedores: "auto" usa Gemini/Tavily se houver chave; senão, modo demonstrativo
    provedor_ia: str = field(default_factory=lambda: os.environ.get("ATLAS_PROVEDOR_IA", "auto").lower())
    provedor_busca: str = field(default_factory=lambda: os.environ.get("ATLAS_PROVEDOR_BUSCA", "auto").lower())
    # Ollama: IA local e gratuita (https://ollama.com)
    ollama_url: str = field(default_factory=lambda: os.environ.get("ATLAS_OLLAMA_URL", "http://localhost:11434"))
    ollama_model: str = field(default_factory=lambda: os.environ.get("ATLAS_OLLAMA_MODEL", "qwen2.5:7b"))
    ollama_timeout_s: float = field(default_factory=lambda: _float("ATLAS_OLLAMA_TIMEOUT_S", 300.0))
    # qualquer API compatível com a da OpenAI (Groq, OpenRouter, Mistral, LM Studio…)
    openai_base_url: str | None = field(default_factory=lambda: os.environ.get("ATLAS_OPENAI_BASE_URL") or None)
    openai_model: str | None = field(default_factory=lambda: os.environ.get("ATLAS_OPENAI_MODEL") or None)
    openai_api_key: str | None = field(default_factory=lambda: os.environ.get("ATLAS_OPENAI_API_KEY") or None)
    # roteamento: "researcher=openai,gemini;analyst=gemini,openai;verifier=openai,gemini"
    rotas_txt: str = field(default_factory=lambda: os.environ.get("ATLAS_ROTAS", ""))
    # OmniRoute (gateway local que roteia entre 60+ provedores): https://github.com/diegosouzapw/OmniRoute
    omniroute_url: str = field(default_factory=lambda: os.environ.get("ATLAS_OMNIROUTE_URL", "http://localhost:20128/v1"))
    omniroute_model: str = field(default_factory=lambda: os.environ.get("ATLAS_OMNIROUTE_MODEL", "auto/best-free"))
    omniroute_api_key: str | None = field(default_factory=lambda: os.environ.get("ATLAS_OMNIROUTE_API_KEY") or None)
    # opcional: low | medium | high (modelos de raciocínio como gpt-oss; reduz tokens gastos)
    openai_reasoning: str | None = field(default_factory=lambda: os.environ.get("ATLAS_OPENAI_REASONING_EFFORT") or None)
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
    def ia(self) -> str:
        """Provedor de IA efetivo: gemini | ollama | openai | demo."""
        p = self.provedor_ia
        if self.modo == "demo" or p == "demo":
            return "demo"
        if p == "ollama":
            return "ollama"
        if p == "omniroute":
            return "omniroute"
        if p == "roteado":
            return "roteado" if self.provedores_disponiveis() else "demo"
        if p == "openai":
            return "openai" if self.openai_base_url and self.openai_model else "demo"
        if p in ("auto", "gemini"):
            return "gemini" if self.gemini_api_key else "demo"
        return "demo"

    @property
    def busca(self) -> str:
        """Provedor de busca efetivo: tavily | gdelt | demo."""
        p = self.provedor_busca
        if self.modo == "demo" or p == "demo":
            return "demo"
        if p == "gdelt":
            return "gdelt"
        if p in ("auto", "tavily"):
            return "tavily" if self.tavily_api_key else "demo"
        return "demo"

    @property
    def gemini_modelos(self) -> list[str]:
        lista = [m.strip() for m in self.gemini_modelos_txt.split(",") if m.strip()]
        return list(dict.fromkeys(lista)) or [self.gemini_model]

    def provedores_disponiveis(self) -> list[str]:
        """Provedores com configuração suficiente para o roteamento (Ollama só se citado nas rotas)."""
        disp = []
        if self.gemini_api_key:
            disp.append("gemini")
        if self.openai_base_url and self.openai_model:
            disp.append("openai")
        if "ollama" in self.rotas_txt:
            disp.append("ollama")
        if "omniroute" in self.rotas_txt:
            disp.append("omniroute")
        return disp

    @property
    def rotas(self) -> dict[str, list[str]]:
        """Ordem de preferência por agente. Padrão: o modelo que melhor segue o formato analisa;
        o mais barato/rápido extrai e verifica; cada um é o fallback do outro."""
        disp = self.provedores_disponiveis()
        padrao_analise = [p for p in ("gemini", "openai", "omniroute", "ollama") if p in disp]
        padrao_apoio = [p for p in ("openai", "gemini", "omniroute", "ollama") if p in disp]
        rotas = {"researcher": padrao_apoio, "analyst": padrao_analise, "verifier": padrao_apoio}
        for parte in self.rotas_txt.split(";"):
            if "=" in parte:
                agente, lista = parte.split("=", 1)
                nomes = [x.strip().lower() for x in lista.split(",") if x.strip().lower() in disp]
                if agente.strip().lower() in rotas and nomes:
                    rotas[agente.strip().lower()] = nomes
        return rotas

    def expandir(self, nomes: list[str]) -> list[str]:
        """'gemini' vira uma entrada por modelo ('gemini:gemini-3.7-flash'…): cada modelo tem cota própria."""
        return [x for n in nomes for x in ([f"gemini:{m}" for m in self.gemini_modelos] if n == "gemini" else [n])]

    @property
    def rotas_expandidas(self) -> dict[str, list[str]]:
        return {ag: self.expandir(lista) for ag, lista in self.rotas.items()}

    @property
    def modelo_ia(self) -> str | None:
        if self.ia == "roteado":
            nomes = {"gemini": ", ".join(self.gemini_modelos), "openai": self.openai_model, "ollama": self.ollama_model, "omniroute": f"OmniRoute {self.omniroute_model}"}
            return " + ".join(f"{nomes[p]}" for p in self.provedores_disponiveis())
        return {"gemini": self.gemini_model, "ollama": self.ollama_model, "openai": self.openai_model, "omniroute": self.omniroute_model}.get(self.ia)

    @property
    def ia_real(self) -> bool:
        return self.ia != "demo"

    @property
    def busca_real(self) -> bool:
        return self.busca != "demo"


def carregar() -> Config:
    """Lê backend/.env (se existir) sem sobrescrever variáveis já definidas no ambiente."""
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)
    except ImportError:  # python-dotenv é opcional
        pass
    return Config()
