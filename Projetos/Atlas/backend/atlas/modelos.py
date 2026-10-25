"""Contratos de dados do ATLAS (entrada, saídas de cada agente, resultado e comparação).

Tudo que passa entre agentes é validado por estes modelos: o orquestrador rejeita
saídas fora do formato antes de repassá-las adiante.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

Nivel = Literal["baixo", "moderado", "alto"]
Natureza = Literal["fato", "interpretacao", "premissa", "hipotese"]
Dimensao = Literal["economico", "diplomatico", "estrategico"]
TipoCenario = Literal["continuidade", "escalada", "desescalada"]
NomeAgente = Literal["orquestrador", "researcher", "analyst", "verifier"]

LIMITE_TEXTO = 2000


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Estrito(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


# ---------------------------------------------------------------- catálogo de casos
class Variavel(Estrito):
    id: str
    nome: str
    descricao: str
    minimo: float = 0
    maximo: float = 100
    passo: float = 1
    padrao: float
    unidade: str = ""
    rotulos: list[str] = Field(default_factory=list, description="rótulos qualitativos do mínimo ao máximo")
    pesos: dict[Dimensao, float] = Field(default_factory=dict, description="peso da variável em cada dimensão (0–1)")
    efeito_escalada: float = Field(0, ge=-1, le=1, description="positivo empurra para escalada, negativo para desescalada")


class Ator(Estrito):
    id: str
    nome: str
    iso3: str | None = Field(None, description="código ISO 3166-1 alfa-3, para o mapa (blocos usam None)")
    papel: str


class Caso(Estrito):
    id: str
    titulo: str
    resumo: str
    contexto: str
    atores: list[Ator]
    variaveis: list[Variavel]
    horizontes_meses: list[int] = Field(default_factory=lambda: [3, 6, 12, 24])
    hipoteses: list[str]
    consultas: list[str] = Field(description="consultas de pesquisa base (o Researcher pode refiná-las)")
    premissas_padrao: list[str]
    personalizado: bool = False


# ---------------------------------------------------------------- entrada
class SimulacaoEntrada(Estrito):
    caso_id: str = Field(min_length=1, max_length=60)
    valores: dict[str, float] = Field(default_factory=dict)
    horizonte_meses: int = Field(12, ge=1, le=60)
    premissas_extra: list[str] = Field(default_factory=list, max_length=6)
    titulo_personalizado: str | None = Field(None, max_length=140)
    descricao_personalizada: str | None = Field(None, max_length=1500)
    base_id: str | None = Field(None, max_length=40, description="simulação anterior que esta revisa (para comparação)")

    @field_validator("premissas_extra")
    @classmethod
    def _premissas(cls, v: list[str]) -> list[str]:
        limpas = [p.strip()[:300] for p in v if p and p.strip()]
        return limpas


# ---------------------------------------------------------------- Researcher
class Fonte(Estrito):
    id: str
    titulo: str
    url: str | None = None
    publicador: str | None = None
    data_publicacao: str | None = None
    data_consulta: str = Field(default_factory=agora)
    trecho: str = ""
    consulta: str | None = None
    demonstrativa: bool = False


class Evidencia(Estrito):
    id: str
    afirmacao: str = Field(max_length=LIMITE_TEXTO)
    fonte_ids: list[str] = Field(default_factory=list)
    status: Literal["confirmado", "alegado", "incerto"] = "incerto"
    relacao: Literal["favorece", "contraria", "contexto"] = "contexto"
    hipotese: str | None = None


class PacoteEvidencias(Estrito):
    consultas: list[str] = Field(default_factory=list)
    fontes: list[Fonte] = Field(default_factory=list)
    evidencias: list[Evidencia] = Field(default_factory=list)
    lacunas: list[str] = Field(default_factory=list)
    pesquisa_real: bool = False
    erro: str | None = None


# ---------------------------------------------------------------- motor determinístico
class IndiceDimensao(Estrito):
    valor: float = Field(ge=0, le=100)
    nivel: Nivel
    contribuicoes: dict[str, float]


class SaidaMotor(Estrito):
    valores_normalizados: dict[str, float]
    indices: dict[Dimensao, IndiceDimensao]
    propensao_escalada: IndiceDimensao
    fator_horizonte: float
    formula: str
    limitacoes: list[str]


# ---------------------------------------------------------------- Analyst
class Afirmacao(Estrito):
    texto: str = Field(max_length=LIMITE_TEXTO)
    natureza: Natureza
    evidencia_ids: list[str] = Field(default_factory=list)


class Cenario(Estrito):
    tipo: TipoCenario
    titulo: str
    narrativa: list[Afirmacao]
    gatilhos: list[str] = Field(default_factory=list)
    indicadores: list[str] = Field(default_factory=list, description="sinais observáveis que indicariam este cenário")
    plausibilidade: Nivel
    justificativa: str


class Impacto(Estrito):
    dimensao: Dimensao
    titulo: str
    mecanismo: str = Field(description="cadeia causal explícita")
    por_cenario: dict[TipoCenario, Nivel]
    natureza: Natureza = "interpretacao"
    evidencia_ids: list[str] = Field(default_factory=list)


class AnaliseAtor(Estrito):
    ator_id: str
    interesses: list[str]
    incentivos: list[str] = Field(default_factory=list)
    capacidades: list[str] = Field(default_factory=list)
    restricoes: list[str] = Field(default_factory=list)
    postura: Literal["cooperativa", "neutra", "confrontacional"]


class ItemMatriz(Estrito):
    tipo: Literal["risco", "oportunidade"]
    titulo: str
    probabilidade: Nivel = Field(description="classificação qualitativa, não percentual")
    impacto: Nivel
    justificativa: str
    cenarios: list[TipoCenario] = Field(default_factory=list)


class Relacao(Estrito):
    origem: str
    destino: str
    tipo: Literal["cooperacao", "tensao", "dependencia", "neutra"]
    intensidade: Nivel
    descricao: str


class SaidaAnalyst(Estrito):
    resumo_executivo: list[Afirmacao]
    atores: list[AnaliseAtor]
    cenarios: list[Cenario]
    impactos: list[Impacto]
    matriz: list[ItemMatriz]
    relacoes: list[Relacao]
    confianca: Nivel
    justificativa_confianca: str
    incertezas: list[str]


# ---------------------------------------------------------------- Verifier
class Problema(Estrito):
    severidade: Literal["critico", "alerta"]
    alvo: Literal["researcher", "analyst"]
    local: str
    descricao: str
    origem: Literal["regra", "ia"] = "regra"


class RelatorioVerificacao(Estrito):
    rodada: int
    aprovado: bool
    problemas: list[Problema] = Field(default_factory=list)
    observacoes: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------- execução e resultado
class Evento(Estrito):
    seq: int
    ts: str = Field(default_factory=agora)
    agente: NomeAgente
    tipo: Literal["inicio", "progresso", "resultado", "aviso", "erro", "fim"]
    mensagem: str
    dados: dict = Field(default_factory=dict)


class Uso(Estrito):
    chamadas_llm: int = 0
    tokens_entrada: int = 0
    tokens_saida: int = 0
    buscas: int = 0
    cache_hits: int = 0
    por_provedor: dict[str, int] = Field(default_factory=dict, description="respostas de IA por provedor (roteamento)")


class RegistroPremissas(Estrito):
    premissas: list[str]
    horizonte_meses: int
    condicoes_iniciais: list[str]
    limitacoes: list[str]


class Modo(Estrito):
    ia: Literal["gemini", "ollama", "openai", "roteado", "demo"]
    busca: Literal["tavily", "gdelt", "demo"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def demonstrativo(self) -> bool:
        return self.ia == "demo" or self.busca == "demo"


class Resultado(Estrito):
    id: str
    criada_em: str = Field(default_factory=agora)
    status: Literal["pendente", "executando", "concluida", "parcial", "falhou"] = "pendente"
    entrada: SimulacaoEntrada
    caso: Caso
    registro: RegistroPremissas | None = None
    motor: SaidaMotor | None = None
    evidencias: PacoteEvidencias | None = None
    analise: SaidaAnalyst | None = None
    verificacoes: list[RelatorioVerificacao] = Field(default_factory=list)
    modo: Modo
    uso: Uso = Field(default_factory=Uso)
    avisos: list[str] = Field(default_factory=list)
    erro: str | None = None


class ResumoSimulacao(Estrito):
    id: str
    criada_em: str
    status: str
    caso_id: str
    titulo: str
    horizonte_meses: int
    modo: Modo
    confianca: Nivel | None = None
    base_id: str | None = None


# ---------------------------------------------------------------- comparação
class MudancaVariavel(Estrito):
    id: str
    nome: str
    antes: float | None
    depois: float | None


class MudancaConclusao(Estrito):
    item: str
    antes: str
    depois: str


class Comparacao(Estrito):
    a_id: str
    b_id: str
    mesmo_caso: bool
    variaveis: list[MudancaVariavel]
    horizonte: tuple[int, int]
    premissas_adicionadas: list[str]
    premissas_removidas: list[str]
    indices: dict[str, tuple[float, float]]
    mudancas: list[MudancaConclusao]
    inalteradas: list[str]
    aviso: str = (
        "A comparação mostra como os resultados do modelo mudam sob premissas diferentes. "
        "Ela não demonstra que uma mudança de variável causaria esse efeito no mundo real."
    )
