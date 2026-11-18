"""Testes das relações e do grafo NetworkX com cache por versão."""

from __future__ import annotations

from pathlib import Path

import pytest

from hela.core.errors import InvalidInput, NotFound
from hela.memory.graph import MemoryGraph
from hela.memory.models import MemoryCreate
from hela.memory.service import MemoryService
from hela.storage.db import Database
from tests.helpers import novo_servico


@pytest.fixture
def svc(tmp_path: Path) -> MemoryService:
    return novo_servico(tmp_path / "g.db")


def _m(svc: MemoryService, texto: str) -> str:
    return svc.create(MemoryCreate(kind="semantic", content=texto)).memory.id


def test_relacionar_valida_entrada(svc: MemoryService) -> None:
    a, b = _m(svc, "alfa"), _m(svc, "beta")
    with pytest.raises(InvalidInput):
        svc.relate(a, a, "related")
    with pytest.raises(NotFound):
        svc.relate(a, "nao-existe", "related")
    with pytest.raises(InvalidInput):
        svc.relate(a, b, "Tipo Com Espaço")
    with pytest.raises(InvalidInput):
        svc.relate(a, b, "related", weight=-1)


def test_grafo_reflete_relacoes_e_usa_cache(svc: MemoryService) -> None:
    a, b, c = _m(svc, "alfa"), _m(svc, "beta"), _m(svc, "gama")
    svc.relate(a, b, "depends_on", weight=0.8)
    svc.relate(b, c, "related")
    grafo = MemoryGraph(svc.db)
    g1 = grafo.get()
    assert g1.has_edge(a, b) and g1.has_edge(b, c)
    assert g1.nodes[a]["kind"] == "semantic"
    assert grafo.get() is g1 and grafo.builds == 1  # sem mudança, sem reconstrução
    svc.relate(a, c, "related")
    g2 = grafo.get()
    assert g2 is not g1 and g2.has_edge(a, c) and grafo.builds == 2


def test_cache_invalidado_por_outra_conexao(svc: MemoryService, tmp_path: Path) -> None:
    a, b = _m(svc, "alfa"), _m(svc, "beta")
    grafo = MemoryGraph(svc.db)
    assert grafo.get().number_of_edges() == 0
    outro = novo_servico(tmp_path / "g.db")  # outro processo, mesmo banco
    outro.relate(a, b, "related")
    assert grafo.get().number_of_edges() == 1


def test_vizinhos_e_exclusao(svc: MemoryService) -> None:
    a, b, c, d = (_m(svc, t) for t in ("alfa", "beta", "gama", "delta"))
    svc.relate(a, b, "related")
    svc.relate(c, b, "related")
    svc.relate(c, d, "related")
    grafo = MemoryGraph(svc.db)
    assert grafo.neighbors(b) == {a, c}
    assert grafo.neighbors(a, depth=2) == {b, c}
    svc.delete(c)
    assert grafo.neighbors(b) == {a}
    assert grafo.neighbors("sem-arestas") == set()


def test_desrelacionar_e_eventos(svc: MemoryService) -> None:
    a, b = _m(svc, "alfa"), _m(svc, "beta")
    svc.relate(a, b, "related", evidence="visto juntos na sessão 1")
    assert len(svc.relations(a)) == 1
    assert svc.unrelate(a, b, "related") == 1
    assert svc.relations(a) == []
    tipos = {e["type"] for e in svc.events.recent(100)}
    assert {"relationship.created", "relationship.deleted"} <= tipos


def test_relacionar_de_novo_atualiza_peso(svc: MemoryService) -> None:
    a, b = _m(svc, "alfa"), _m(svc, "beta")
    svc.relate(a, b, "related", weight=0.2)
    svc.relate(a, b, "related", weight=0.9)
    rels = svc.relations(a)
    assert len(rels) == 1 and rels[0]["weight"] == 0.9


def test_banco_reaberto_mantem_grafo(tmp_path: Path) -> None:
    s = novo_servico(tmp_path / "r.db")
    a, b = _m(s, "alfa"), _m(s, "beta")
    s.relate(a, b, "related")
    s.db.close()
    assert MemoryGraph(Database(tmp_path / "r.db")).get().has_edge(a, b)
