"""Fixtures: provedores falsos (sem rede, sem créditos) e banco em memória."""
from __future__ import annotations

import copy
from dataclasses import replace

import pytest

from atlas import casos
from atlas.config import Config
from atlas.modelos import SimulacaoEntrada
from atlas.persistencia import Banco
from atlas.provedores.busca import ResultadoBusca
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import RespostaLLM


def analise_valida(evid: str | None = "E1") -> dict:
    ids = [evid] if evid else []
    narr = lambda t: [{"texto": t, "natureza": "hipotese", "evidencia_ids": []}]  # noqa: E731
    return {
        "resumo_executivo": [{"texto": "As tarifas foram ampliadas.", "natureza": "fato", "evidencia_ids": ids}, {"texto": "A pressão econômica cresce.", "natureza": "interpretacao", "evidencia_ids": []}],
        "atores": [{"ator_id": "usa", "interesses": ["reduzir déficit"], "postura": "confrontacional"}, {"ator_id": "chn", "interesses": ["preservar exportações"], "postura": "neutra"}],
        "cenarios": [
            {"tipo": "continuidade", "titulo": "Status quo", "narrativa": narr("segue"), "plausibilidade": "alto", "justificativa": "x"},
            {"tipo": "escalada", "titulo": "Escalada", "narrativa": narr("piora"), "plausibilidade": "moderado", "justificativa": "x"},
            {"tipo": "desescalada", "titulo": "Acordo", "narrativa": narr("melhora"), "plausibilidade": "moderado", "justificativa": "x"},
        ],
        "impactos": [{"dimensao": "economico", "titulo": "Comércio", "mecanismo": "tarifa → preço → demanda", "por_cenario": {"continuidade": "moderado", "escalada": "alto", "desescalada": "baixo"}, "evidencia_ids": ids}],
        "matriz": [{"tipo": "risco", "titulo": "Inflação", "probabilidade": "moderado", "impacto": "alto", "justificativa": "qualitativa"}],
        "relacoes": [{"origem": "usa", "destino": "chn", "tipo": "tensao", "intensidade": "alto", "descricao": "disputa"}],
        "confianca": "moderado",
        "justificativa_confianca": "fontes recentes",
        "incertezas": ["reação de terceiros"],
    }


class FakeLLM:
    """Responde por tarefa; aceita filas de respostas e erros. Registra cada chamada."""

    def __init__(self, nome: str = "gemini", respostas: dict | None = None):
        self.nome = nome
        self.respostas = respostas or {}
        self.chamadas: list[tuple[str, str]] = []

    async def gerar_json(self, tarefa, sistema, usuario, contexto):
        self.chamadas.append((tarefa, usuario))
        r = self.respostas.get(tarefa)
        if isinstance(r, list):
            r = r.pop(0) if len(r) > 1 else r[0]
        if isinstance(r, Exception):
            raise r
        if r is None:
            if tarefa == "extrair_evidencias":
                r = {"evidencias": [{"afirmacao": "Tarifas ampliadas segundo o governo.", "fonte_ids": ["F1"], "status": "confirmado", "relacao": "favorece"}, {"afirmacao": "Analistas veem impacto limitado.", "fonte_ids": ["F2"], "status": "alegado", "relacao": "contraria"}], "lacunas": []}
            elif tarefa == "analisar":
                r = analise_valida()
            elif tarefa == "verificar":
                r = {"problemas": [], "observacoes": ["ok"]}
        return RespostaLLM(copy.deepcopy(r), 100, 50)

    def contar(self, tarefa: str) -> int:
        return sum(1 for t, _ in self.chamadas if t == tarefa)


class FakeBusca:
    def __init__(self, nome: str = "tavily", erro: ErroProvedor | None = None):
        self.nome = nome
        self.erro = erro
        self.consultas: list[str] = []

    async def buscar(self, consulta, maximo):
        self.consultas.append(consulta)
        if self.erro:
            raise self.erro
        return [
            ResultadoBusca(titulo="USTR anuncia tarifas", url="https://ustr.gov/a", trecho="tarifas ampliadas", publicador="ustr.gov", data_publicacao="2026-09-01"),
            ResultadoBusca(titulo="Análise", url="https://example.org/b", trecho="impacto limitado", publicador="example.org"),
        ]


@pytest.fixture
def cfg(tmp_path) -> Config:
    return replace(Config(), db_path=tmp_path / "t.db", gemini_api_key="x", tavily_api_key="y", modo="auto", max_revisoes=2, max_buscas=2, max_chamadas_llm=20, tentativas_api=1)


@pytest.fixture
def banco() -> Banco:
    return Banco(":memory:")


@pytest.fixture
def caso():
    return casos.obter("eua-china-tarifas")


@pytest.fixture
def entrada() -> SimulacaoEntrada:
    return SimulacaoEntrada(caso_id="eua-china-tarifas", valores={"tarifa": 60}, horizonte_meses=12)
