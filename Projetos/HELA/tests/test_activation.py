"""Ativação espalhada no grafo de relações (sem networkx)."""

from __future__ import annotations

from pathlib import Path

import pytest

from hela.core.engine import Engine
from hela.memory.activation import GraphActivation
from hela.memory.models import MemoryCreate
from tests.helpers import RelogioFalso, novo_servico


def _cadeia(tmp_path: Path):  # type: ignore[no-untyped-def]
    svc = novo_servico(tmp_path / "h.db")
    ids = [svc.create(MemoryCreate(kind="semantic", content=f"memória número {n}")).memory.id for n in "abcde"]
    for x, y in zip(ids, ids[1:]):
        svc.relate(x, y, "related")
    return svc, ids


def test_ativacao_respeita_o_limite_de_passos(tmp_path: Path) -> None:
    svc, (a, b, c, d, e) = _cadeia(tmp_path)
    act = GraphActivation(svc.db.conn, steps=2, decay=0.5).activation({a: 1.0})
    assert act[b] == pytest.approx(0.5) and act[c] == pytest.approx(0.25)
    assert d not in act and e not in act
    act3 = GraphActivation(svc.db.conn, steps=3, decay=0.5).activation({a: 1.0})
    assert act3[d] == pytest.approx(0.125) and e not in act3


def test_peso_da_aresta_limita_a_energia(tmp_path: Path) -> None:
    svc, (a, b, *_resto) = _cadeia(tmp_path)
    svc.relate(a, b, "related", weight=0.2)
    act = GraphActivation(svc.db.conn, steps=1, decay=0.5).activation({a: 1.0})
    assert act[b] == pytest.approx(0.1)


def test_sem_sementes_ou_sem_arestas(tmp_path: Path) -> None:
    svc = novo_servico(tmp_path / "h.db")
    assert GraphActivation(svc.db.conn).activation({}) == {}
    m = svc.create(MemoryCreate(kind="semantic", content="sozinha")).memory
    assert GraphActivation(svc.db.conn).activation({m.id: 1.0}) == {}


def test_busca_do_engine_usa_o_grafo(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h", clock=RelogioFalso()) as eng:
        a = eng.remember(kind="procedural", content="rodar a suíte com pytest -q na raiz do projeto").memory
        b = eng.remember(kind="semantic", content="o workflow do GitHub Actions dispara a cada push").memory
        eng.relate(a.id, b.id, "related")
        hits = {h.memory.id: h for h in eng.search("pytest")}
        assert a.id in hits and b.id in hits  # b não tem a palavra, veio pela relação com a
        assert hits[b.id].signals["graph"] is not None and hits[b.id].signals["bm25"] is None
