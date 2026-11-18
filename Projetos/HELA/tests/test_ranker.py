"""Strategy Ranker: limite inferior de Wilson + qualidade + custos normalizados (heurística estatística)."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

import pytest

from hela.core.config import HelaConfig
from hela.learning.ranker import (
    DEFAULT_WEIGHTS, StrategyRanker, StrategyStats, WeightStore, normalize_weights, score_strategies,
    thompson_pick, wilson_interval,
)
from hela.storage.db import Database
from hela.storage.repositories.tasks import TaskRepository
from tests.helpers import RelogioFalso


@pytest.mark.parametrize("s,n,inferior", [(0, 0, 0.0), (10, 10, 0.7225), (5, 10, 0.2366), (0, 10, 0.0),
                                          (81, 263, 0.2553)])
def test_wilson_valores_conhecidos(s: int, n: int, inferior: float) -> None:
    lo, hi = wilson_interval(s, n)
    assert lo == pytest.approx(inferior, abs=1e-4)
    assert 0 <= lo <= hi <= 1


def _stats(sucessos: int, falhas: int, tokens: float | None = None, quality: float | None = None) -> StrategyStats:
    st = StrategyStats()
    for i in range(sucessos + falhas):
        st.add({"success": 1 if i < sucessos else 0, "quality": quality, "tokens": tokens, "duration_ms": None,
                "attempts": None, "compute_cost": None})
    return st


def test_zero_observacoes_nao_passa_de_dez_sucessos() -> None:
    r = score_strategies({"nova": StrategyStats(), "provada": _stats(10, 0)}, DEFAULT_WEIGHTS)
    assert r["provada"]["score"] > r["nova"]["score"]
    assert r["nova"]["n_obs"] == 0 and r["nova"]["wilson_lower"] == 0


def test_custo_menor_ganha_com_sucesso_igual() -> None:
    r = score_strategies({"cara": _stats(8, 2, tokens=9000), "barata": _stats(8, 2, tokens=1000)}, DEFAULT_WEIGHTS)
    assert r["barata"]["score"] > r["cara"]["score"]
    assert r["barata"]["components"]["tokens"] > 0.5 > r["cara"]["components"]["tokens"]


def test_componentes_e_score_em_zero_um() -> None:
    r = score_strategies({"a": _stats(3, 7, tokens=50, quality=0.9), "b": StrategyStats()}, DEFAULT_WEIGHTS)
    for item in r.values():
        assert 0 <= item["score"] <= 1
        assert all(0 <= v <= 1 for v in item["components"].values())


def test_pesos_normalizados_e_validados() -> None:
    assert normalize_weights({**DEFAULT_WEIGHTS, "success": 0.9}) != DEFAULT_WEIGHTS
    assert abs(sum(normalize_weights({k: 2 for k in DEFAULT_WEIGHTS}).values()) - 1) < 1e-9
    with pytest.raises(ValueError):
        normalize_weights({"success": 1.0})  # falta componente
    with pytest.raises(ValueError):
        normalize_weights({**DEFAULT_WEIGHTS, "success": -1})


@pytest.fixture()
def db(tmp_path: Path) -> Database:
    return Database(tmp_path / "h.db")


def test_pesos_versionados_na_tabela_versions(db: Database) -> None:
    ws = WeightStore(db, clock=RelogioFalso())
    v = ws.active()
    assert v["version"] == 1 and v["weights"] == DEFAULT_WEIGHTS
    assert ws.active()["id"] == v["id"]  # não cria outra a cada leitura
    nova = ws.create({**DEFAULT_WEIGHTS, "success": 0.55, "quality": 0.1}, note="teste", activate=True)
    assert ws.active()["version"] == 2 and ws.active()["id"] == nova["id"]
    linha = db.conn.execute("SELECT parent_id, component FROM versions WHERE id = ?", (nova["id"],)).fetchone()
    assert linha["parent_id"] == v["id"] and linha["component"] == "ranker.weights"


def _resultado(db: Database, tarefas: TaskRepository, categoria: str, estrategia: str, sucesso: int,
               tokens: int = 1000) -> None:
    tid = uuid.uuid4().hex
    tarefas.create(tid, prompt="p", category=categoria, label_source="rules", created_at="2026-11-18T12:00:00+00:00")
    db.conn.execute("INSERT INTO outcomes (task_id, strategy_id, success, tokens_input, created_at)"
                    " VALUES (?, ?, ?, ?, '2026-11-18T12:00:00+00:00')", (tid, estrategia, sucesso, tokens))


def test_a_falha_cinco_b_acerta_cinco_b_na_frente(db: Database) -> None:
    rk = StrategyRanker(db, HelaConfig(), clock=RelogioFalso())
    a = rk.ensure_strategy("estrategia-a", category="media")
    b = rk.ensure_strategy("estrategia-b", category="media")
    tarefas = TaskRepository(db.conn)
    for _ in range(5):
        _resultado(db, tarefas, "media", a, 0)
        _resultado(db, tarefas, "media", b, 1)
    r = rk.rank("media")
    assert [s["name"] for s in r["strategies"]] == ["estrategia-b", "estrategia-a"]
    assert r["method"].startswith("heurística estatística")
    assert r["weights_version"] == 1 and not r["insufficient"]
    linha = db.conn.execute("SELECT n_obs, successes, wilson_lower, weights_version FROM strategy_metrics"
                            " WHERE strategy_id = ? AND category = 'media'", (b,)).fetchone()
    assert (linha["n_obs"], linha["successes"], linha["weights_version"]) == (5, 5, 1)
    assert linha["wilson_lower"] == pytest.approx(wilson_interval(5, 5)[0])


def test_estrategia_aposentada_some_do_ranking(db: Database) -> None:
    rk = StrategyRanker(db, HelaConfig(), clock=RelogioFalso())
    a = rk.ensure_strategy("velha", category="git")
    db.conn.execute("UPDATE strategies SET status = 'retired' WHERE id = ?", (a,))
    assert rk.rank("git")["strategies"] == []
    assert rk.rank("git")["insufficient"]


def test_ranking_sem_dados_responde_insuficiente(db: Database) -> None:
    r = StrategyRanker(db, HelaConfig(), clock=RelogioFalso()).rank("data")
    assert r["strategies"] == [] and r["insufficient"] is True


def test_thompson_e_exploracao_reprodutivel() -> None:
    stats = {"a": _stats(2, 8), "b": _stats(8, 2)}
    x = thompson_pick(stats, seed=3)
    assert x == thompson_pick(stats, seed=3)
    assert x["exploration"] is True and x["strategy_id"] in stats
    escolhas = [thompson_pick(stats, seed=s)["strategy_id"] for s in range(200)]
    assert escolhas.count("b") > escolhas.count("a")


def test_pesos_padrao_em_json_sao_serializaveis() -> None:
    assert json.loads(json.dumps(DEFAULT_WEIGHTS)) == DEFAULT_WEIGHTS
