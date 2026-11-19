"""Evolution Engine: propostas testadas por replay (Brier), aplicação com snapshot e rollback."""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest

from hela.core.engine import Engine
from hela.core.errors import InvalidInput
from hela.learning.evolution import EvolutionEngine
from hela.learning.ranker import COMPONENTS
from tests.helpers import RelogioFalso


@pytest.fixture()
def eng(tmp_path: Path):  # type: ignore[no-untyped-def]
    relogio = RelogioFalso()
    e = Engine(home=tmp_path / "h", clock=relogio)
    e._relogio = relogio  # type: ignore[attr-defined]
    yield e
    e.close()


def _resultado(eng: Engine, categoria: str, estrategia: str, sucesso: bool, **extra: object) -> None:
    eng._relogio.avancar(minutes=1)  # type: ignore[attr-defined]
    tid = uuid.uuid4().hex
    eng.learner.tasks.create(tid, prompt="p", category=categoria, label_source="rules",
                             created_at=eng.memories.now())
    eng.learner.record_outcome(tid, success=sucesso, strategy=estrategia, **extra)  # type: ignore[arg-type]


def _historico_deterministico(eng: Engine, n: int = 15) -> None:
    for _ in range(n):
        _resultado(eng, "media", "sempre-acerta", True, tokens={"input": 900}, token_source="estimated")
        _resultado(eng, "media", "sempre-erra", False, tokens={"input": 100}, token_source="estimated")


def test_brier_valores_conhecidos(eng: Engine) -> None:
    _resultado(eng, "git", "unica", True)
    _resultado(eng, "git", "unica", True)
    so_sucesso = {c: (1.0 if c == "success" else 0.0) for c in COMPONENTS}
    r = eng.evolution.replay_brier(so_sucesso)
    # 1ª previsão: Wilson(0/0) = 0 → erro 1. 2ª: Wilson(1/1) = 0,20657 → erro 0,62953. Média: 0,81477.
    assert r["n"] == 2 and r["brier"] == pytest.approx(0.81477, abs=1e-4)


def test_poucos_resultados_nao_propoe_pesos(eng: Engine) -> None:
    _historico_deterministico(eng, n=3)
    r = eng.evolution.propose()
    assert not [p for p in r["proposals"] if p["type"] == "adjust_weights"]
    assert any(s["type"] == "adjust_weights" and "mínimo" in s["reason"] for s in r["skipped"])


def test_pesos_so_sao_recomendados_se_o_brier_melhora(eng: Engine) -> None:
    _historico_deterministico(eng)
    pesos = [p for p in eng.evolution.propose()["proposals"] if p["type"] == "adjust_weights"]
    assert len(pesos) == 1 and pesos[0]["status"] == "tested" and pesos[0]["recommended"]
    assert pesos[0]["candidate_metric"] < pesos[0]["baseline_metric"] - eng.config.learning.evolution.min_improvement
    assert pesos[0]["metric_name"] == "brier_replay"


def test_sem_melhora_suficiente_fica_rejeitada(eng: Engine) -> None:
    _historico_deterministico(eng)
    eng.config.learning.evolution.min_improvement = 1.0  # nenhuma mudança melhora tanto
    pesos = [p for p in eng.evolution.propose()["proposals"] if p["type"] == "adjust_weights"]
    assert pesos and pesos[0]["status"] == "rejected" and not pesos[0]["recommended"]
    with pytest.raises(InvalidInput, match="testada"):
        eng.evolution.apply(pesos[0]["id"])


def test_aplicar_cria_versao_e_rollback_devolve_byte_a_byte(eng: Engine) -> None:
    _historico_deterministico(eng)
    antes = eng.ranker.weights.active()
    pid = next(p["id"] for p in eng.evolution.propose()["proposals"] if p["type"] == "adjust_weights")
    aplicada = eng.evolution.apply(pid)
    depois = eng.ranker.weights.active()
    assert aplicada["status"] == "applied" and depois["version"] == antes["version"] + 1
    assert aplicada["version_id"] == depois["id"] and depois["weights"] != antes["weights"]
    assert eng.ranker.rank("media")["weights_version"] == depois["version"]
    desfeita = eng.evolution.rollback(pid)
    voltou = eng.ranker.weights.active()
    assert desfeita["status"] == "rolled_back"
    assert voltou["id"] == antes["id"] and voltou["data"] == antes["data"]  # os mesmos bytes
    with pytest.raises(InvalidInput):
        eng.evolution.rollback(pid)


def test_depreciar_estrategia_estatisticamente_pior(eng: Engine) -> None:
    for _ in range(8):
        _resultado(eng, "data", "ruim", False)
        _resultado(eng, "data", "boa", True)
    props = [p for p in eng.evolution.propose()["proposals"] if p["type"] == "deprecate_strategy"]
    assert [p["target_name"] for p in props] == ["ruim"]
    eng.evolution.apply(props[0]["id"])
    assert [s["name"] for s in eng.ranker.rank("data")["strategies"]] == ["boa"]
    eng.evolution.rollback(props[0]["id"])
    assert {s["name"] for s in eng.ranker.rank("data")["strategies"]} == {"boa", "ruim"}


def test_promover_procedimento_com_wilson_alto(eng: Engine) -> None:
    p = eng.procedures.create(name="gif leve", script="ffmpeg -i a.mp4 b.gif", language="shell")
    eng.db.conn.execute("UPDATE procedures SET success_count = 9 WHERE id = ?", (p["id"],))
    props = [x for x in eng.evolution.propose()["proposals"] if x["type"] == "promote_procedure"]
    assert len(props) == 1 and props[0]["candidate_metric"] >= 0.6
    antes = eng.get(p["memory_id"], record_access=False)
    eng.evolution.apply(props[0]["id"])
    promovida = eng.get(p["memory_id"], record_access=False)
    assert promovida.importance >= 0.9 and "promovido" in promovida.tags
    assert eng.procedures.get(p["id"])["approved"] is False  # promover nunca aprova script
    eng.evolution.rollback(props[0]["id"])
    voltou = eng.get(p["memory_id"], record_access=False)
    assert (voltou.importance, voltou.tags) == (antes.importance, antes.tags)
    assert not [x for x in eng.evolution.propose()["proposals"] if x["type"] == "promote_procedure"
                and x["status"] == "tested" and x["id"] == props[0]["id"]]


def test_mesclar_duplicatas_e_desfazer(eng: Engine) -> None:
    a = eng.remember(kind="semantic", content="O modo WAL do SQLite deixa os leitores sem esperar o escritor.").memory
    b = eng.remember(kind="semantic", content="O modo WAL do SQLite deixa os leitores sem esperar o escritor!!").memory
    c = eng.remember(kind="semantic", content="busy_timeout evita erro de banco travado").memory
    eng.relate(b.id, c.id, "related", weight=0.7)
    arestas_antes = {(r["source_id"], r["target_id"], r["type"], r["weight"]) for r in eng.relations(c.id)}
    props = [p for p in eng.evolution.propose()["proposals"] if p["type"] == "merge_duplicates"]
    assert len(props) == 1 and set(props[0]["proposal"]["memory_ids"]) == {a.id, b.id}
    eng.evolution.apply(props[0]["id"])
    status = {m: eng.get(m, record_access=False).status for m in (a.id, b.id)}
    assert sorted(status.values()) == ["active", "merged"]
    eng.evolution.rollback(props[0]["id"])
    assert {eng.get(m, record_access=False).status for m in (a.id, b.id)} == {"active"}
    arestas_depois = {(r["source_id"], r["target_id"], r["type"], r["weight"]) for r in eng.relations(c.id)}
    assert arestas_depois == arestas_antes


def test_lista_e_banco_vazio(eng: Engine) -> None:
    r = eng.evolution.propose()
    assert r["proposals"] == [] and r["skipped"]
    assert eng.evolution.list() == []
