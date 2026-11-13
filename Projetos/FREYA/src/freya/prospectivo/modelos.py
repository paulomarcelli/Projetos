"""A análise prospectiva: o único produto da F.R.E.Y.A.

Toda afirmação tem um tipo epistêmico e cita evidências do registro:
- `confirmado`: dito explicitamente numa fonte oficial (exige evidência);
- `inferencia`: conclusão que decorre das evidências citadas (exige evidência);
- `hipotese`: possibilidade levantada pela análise (pode não ter evidência direta; nunca vira fato).
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class TipoEpistemico(str, Enum):
    CONFIRMADO = "confirmado"
    INFERENCIA = "inferencia"
    HIPOTESE = "hipotese"


class Afirmacao(BaseModel):
    texto: str
    tipo: TipoEpistemico
    evidencias: list[str] = Field(default_factory=list, description="ids do registro (E1, E2…)")


class Ator(BaseModel):
    entidade: str = Field(description="chave da entidade no grafo")
    papel: str
    fundamentos: list[Afirmacao] = Field(default_factory=list)


class RelacaoSistemica(BaseModel):
    entidades: list[str] = Field(description="chaves das entidades envolvidas")
    natureza: str = Field(description="ex.: aliança, rivalidade, dependência, pertencimento")
    descricao: Afirmacao


class Variavel(BaseModel):
    nome: str
    descricao: Afirmacao
    entidades: list[str] = Field(default_factory=list)


class Incerteza(BaseModel):
    nome: str
    por_que_importa: Afirmacao
    polos: list[str] = Field(default_factory=list, description="os dois desfechos extremos da incerteza")


class Desdobramento(BaseModel):
    descricao: Afirmacao
    consequencias_diretas: list[Afirmacao] = Field(default_factory=list)
    consequencias_indiretas: list[Afirmacao] = Field(default_factory=list)


class Cenario(BaseModel):
    id: str
    nome: str
    logica: Afirmacao
    premissas: list[Afirmacao] = Field(default_factory=list)
    desenvolvimento: list[Afirmacao] = Field(default_factory=list)
    consequencias: list[Afirmacao] = Field(default_factory=list)
    sinais: list[Afirmacao] = Field(default_factory=list, description="o que indicaria que este cenário está se confirmando")
    entidades: list[str] = Field(default_factory=list)


class CorpoDaAnalise(BaseModel):
    """O que o motor (modelo de linguagem ou modo determinístico) produz; o resto é preenchido pela orquestração."""

    resposta: list[Afirmacao] = Field(default_factory=list, description="a análise prospectiva explicada em parágrafos corridos, um por item")
    contexto: list[Afirmacao] = Field(default_factory=list)
    atores: list[Ator] = Field(default_factory=list)
    relacoes_sistemicas: list[RelacaoSistemica] = Field(default_factory=list)
    variaveis: list[Variavel] = Field(default_factory=list)
    tendencias_e_sinais: list[Afirmacao] = Field(default_factory=list)
    incertezas_criticas: list[Incerteza] = Field(default_factory=list)
    desdobramentos: list[Desdobramento] = Field(default_factory=list)
    cenarios: list[Cenario] = Field(default_factory=list)
    limitacoes: list[str] = Field(default_factory=list)


class RegistroDeValidacao(BaseModel):
    removidas: list[str] = Field(default_factory=list)
    rebaixadas: list[str] = Field(default_factory=list)
    citacoes_invalidas: list[str] = Field(default_factory=list)
    entidades_desconhecidas: list[str] = Field(default_factory=list)


class AnaliseProspectiva(CorpoDaAnalise):
    questao: str
    horizonte: str | None = None
    continuidade: str = "MCU"
    modo: str  # "modelo" ou "deterministico"
    modelo: str | None = None
    gerada_em: datetime
    validacao: RegistroDeValidacao = Field(default_factory=RegistroDeValidacao)
