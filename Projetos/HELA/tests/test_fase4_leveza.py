"""O caminho do hook não carrega pydantic, networkx nem o Engine (revisão F3-A2)."""

from __future__ import annotations

import json
import subprocess
import sys

import pytest

PESADOS = ("pydantic", "networkx", "hela.core.engine", "hela.core.router", "hela.memory.service",
           "hela.memory.search", "hela.core.config", "mcp")


def _modulos_carregados(modulo: str) -> set[str]:
    codigo = f"import sys, json; import {modulo}; print(json.dumps(sorted(sys.modules)))"
    saida = subprocess.run([sys.executable, "-c", codigo], capture_output=True, text=True, check=True)
    return set(json.loads(saida.stdout))


@pytest.mark.parametrize("modulo", [
    "hela.memory.fusion", "hela.core.relevance", "hela.memory.vector_cache", "hela.integration.light_config",
    "hela.integration.light_recall", "hela.integration.hooks", "hela.integration.transcript",
    "hela.integration.web_taint",
])
def test_modulo_leve_nao_carrega_pesados(modulo):
    carregados = _modulos_carregados(modulo)
    pesados = sorted(m for m in carregados if any(m == p or m.startswith(p + ".") for p in PESADOS))
    assert pesados == [], f"{modulo} carregou {pesados}"


def test_fusao_e_relevancia_sao_as_mesmas_do_router():
    from hela.core import relevance, router
    from hela.memory import fusion, search

    assert router.coverage is relevance.coverage and router.query_terms is relevance.query_terms
    assert search.rrf_fuse is fusion.rrf_fuse
