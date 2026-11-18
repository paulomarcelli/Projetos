"""Feedback Learner: resultados mudam métricas, qualidade das memórias usadas e rótulos do classificador."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

import pytest

from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.learning.feedback import FeedbackLearner
from hela.learning.ranker import StrategyRanker
from hela.memory.models import MemoryCreate
from hela.storage.repositories.tasks import TaskRepository
from tests.helpers import RelogioFalso, novo_servico


@pytest.fixture()
def fl(tmp_path: Path) -> FeedbackLearner:
    svc = novo_servico(tmp_path / "h.db")
    return FeedbackLearner(svc, StrategyRanker(svc.db, HelaConfig(), clock=svc.clock), HelaConfig(), clock=svc.clock)


def _mem(fl: FeedbackLearner, **campos):  # type: ignore[no-untyped-def]
    return fl.memories.create(MemoryCreate(**campos)).memory


def _tarefa(fl: FeedbackLearner, categoria: str = "media") -> str:
    tid = uuid.uuid4().hex
    TaskRepository(fl.db.conn).create(tid, prompt="converter vídeo", category=categoria, label_source="rules",
                                      created_at="2026-11-18T12:00:00+00:00")
    return tid


def _recuperacao(fl: FeedbackLearner, tid: str, ids: list[str]) -> None:
    fl.db.conn.execute("INSERT INTO retrievals (task_id, query, results, n_results, created_at)"
                       " VALUES (?, 'q', ?, ?, '2026-11-18T12:00:00+00:00')",
                       (tid, json.dumps([{"id": i, "included": True} for i in ids]
                                        + [{"id": "fora-do-contexto", "included": False}]), len(ids)))


def test_resultado_positivo_e_negativo_mudam_a_estrategia_certa(fl: FeedbackLearner) -> None:
    t1, t2, t3 = _tarefa(fl), _tarefa(fl), _tarefa(fl)
    fl.record_outcome(t1, success=True, quality=0.9, strategy="ffmpeg-direto", tokens={"input": 100, "output": 50})
    fl.record_outcome(t2, success=False, strategy="ffmpeg-direto")
    fl.record_outcome(t3, success=True, strategy="outra")
    m = {(r["name"], r["category"]): r for r in fl.db.conn.execute(
        "SELECT s.name, sm.* FROM strategy_metrics sm JOIN strategies s ON s.id = sm.strategy_id")}
    assert (m[("ffmpeg-direto", "media")]["n_obs"], m[("ffmpeg-direto", "media")]["successes"]) == (2, 1)
    assert m[("ffmpeg-direto", "media")]["failures"] == 1
    assert m[("ffmpeg-direto", "media")]["sum_tokens"] == 150
    assert m[("ffmpeg-direto", "")]["n_obs"] == 2  # visão geral, sem categoria
    assert (m[("outra", "media")]["n_obs"], m[("outra", "media")]["successes"]) == (1, 1)
    status = {r["id"]: r["status"] for r in fl.db.conn.execute("SELECT id, status FROM tasks")}
    assert (status[t1], status[t2]) == ("done", "failed")


def test_memorias_usadas_sobem_e_descem(fl: FeedbackLearner) -> None:
    a = _mem(fl, kind="procedural", content="ffmpeg -i a.mp4 b.gif converte vídeo em gif")
    b = _mem(fl, kind="episodic", content="usar -vf scale=320:-1 deixa o gif leve")
    t_ok, t_ruim = _tarefa(fl), _tarefa(fl)
    _recuperacao(fl, t_ok, [a.id])
    r = fl.record_outcome(t_ok, success=True)  # memórias tiradas do log de recuperações da tarefa
    assert [x["id"] for x in r["memories_adjusted"]] == [a.id]
    depois = fl.memories.get(a.id, record_access=False)
    assert depois.quality > a.quality and depois.confidence > a.confidence
    fl.record_outcome(t_ruim, success=False, used_memory_ids=[b.id])
    pior = fl.memories.get(b.id, record_access=False)
    assert pior.quality < b.quality and pior.confidence < b.confidence
    notas = fl.db.conn.execute("SELECT memory_id, rating, task_id FROM feedback ORDER BY id").fetchall()
    assert [(n["memory_id"], n["rating"]) for n in notas] == [(a.id, 1), (b.id, -1)]


def test_procedimento_usado_conta_sucesso(fl: FeedbackLearner) -> None:
    m = _mem(fl, kind="procedural", content="rodar pytest -q na raiz")
    fl.db.conn.execute("INSERT INTO procedures (id, memory_id, name, created_at, updated_at)"
                       " VALUES ('p1', ?, 'testes', 'x', 'x')", (m.id,))
    fl.record_outcome(_tarefa(fl, "test"), success=True, used_memory_ids=[m.id])
    linha = fl.db.conn.execute("SELECT success_count, failure_count, last_used FROM procedures").fetchone()
    assert (linha["success_count"], linha["failure_count"]) == (1, 0) and linha["last_used"]


def test_nota_direta_numa_memoria(fl: FeedbackLearner) -> None:
    m = _mem(fl, kind="semantic", content="o WAL deixa leitores sem esperar")
    r = fl.rate_memory(m.id, rating=-1, comment="estava desatualizada")
    assert r["memory"]["quality"] < m.quality
    with pytest.raises(InvalidInput):
        fl.rate_memory(m.id, rating=5)
    with pytest.raises(NotFound):
        fl.rate_memory("nao-existe", rating=1)


def test_correcao_de_categoria_vira_rotulo_feedback(fl: FeedbackLearner) -> None:
    tid = _tarefa(fl, "general")
    r = fl.correct_category(tid, "media")
    assert r["category"] == "media" and r["label_source"] == "feedback"
    linha = fl.db.conn.execute("SELECT category, label_source FROM tasks WHERE id = ?", (tid,)).fetchone()
    assert (linha["category"], linha["label_source"]) == ("media", "feedback")
    with pytest.raises(InvalidInput):
        fl.correct_category(tid, "Categoria Com Espaço")


def test_resultado_valida_entrada(fl: FeedbackLearner) -> None:
    tid = _tarefa(fl)
    with pytest.raises(InvalidInput):
        fl.record_outcome(tid, success=True, quality=3)
    with pytest.raises(InvalidInput):
        fl.record_outcome(tid, success=True, token_source="chute")
    with pytest.raises(NotFound):
        fl.record_outcome("nao-existe", success=True)


def test_notas_e_comentarios_sao_redigidos(fl: FeedbackLearner) -> None:
    chave = "ghp_" + "a1B2c3D4e5" * 4
    tid = _tarefa(fl)
    fl.record_outcome(tid, success=True, notes=f"usei a chave {chave}")
    assert chave not in fl.db.conn.execute("SELECT notes FROM outcomes").fetchone()[0]
