"""Testes da fachada Engine (o que CLI, MCP, hooks e API vão usar)."""

from __future__ import annotations

import os
import stat
from pathlib import Path

import pytest

from hela.core.engine import Engine
from hela.core.errors import InvalidInput, NotFound
from hela.memory.embedder import HashingEmbedder
from tests.helpers import RelogioFalso


def test_engine_usa_hela_home_e_cria_banco_privado(hela_home_temporario: Path) -> None:
    with Engine() as eng:
        assert eng.home == hela_home_temporario
        assert (hela_home_temporario / "hela.db").exists()
        if os.name == "posix":
            assert stat.S_IMODE(hela_home_temporario.stat().st_mode) == 0o700
            assert stat.S_IMODE((hela_home_temporario / "hela.db").stat().st_mode) == 0o600
    assert not (Path(os.environ["HOME"]) / ".hela").exists()  # o ~/.hela "real" nunca é tocado


def test_fluxo_completo_pela_fachada(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h", clock=RelogioFalso()) as eng:
        a = eng.remember(kind="procedural", content="Rodar testes com pytest -q", tags=["python"]).memory
        b = eng.remember(kind="semantic", content="pytest descobre arquivos test_*.py").memory
        eng.relate(a.id, b.id, "related")
        hits = eng.search("como rodar testes pytest", kinds=["procedural"])
        assert hits[0].memory.id == a.id
        assert eng.neighbors(a.id) == {b.id}
        assert eng.update(a.id, quality=0.9).quality == 0.9
        assert eng.archive(a.id).status == "archived"
        assert eng.search("rodar testes pytest", kinds=["procedural"]) == []
        bloco = eng.as_context(eng.search("pytest"))
        assert bloco.startswith("<hela_memories") and b.id in bloco
        eng.delete(b.id)
        with pytest.raises(NotFound):
            eng.get(b.id)


def test_entrada_invalida_vira_invalid_input(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        with pytest.raises(InvalidInput, match="kind"):
            eng.remember(kind="sonho", content="x")
        with pytest.raises(InvalidInput, match="campo_que_nao_existe"):
            eng.remember(kind="semantic", content="x", campo_que_nao_existe=1)
        m = eng.remember(kind="semantic", content="ok").memory
        with pytest.raises(InvalidInput, match="quality"):
            eng.update(m.id, quality=7)


def test_stats(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        eng.remember(kind="semantic", content="um")
        eng.remember(kind="episodic", content="dois")
        s = eng.stats()
        assert s["memories"]["total"] == 2
        assert s["memories"]["by_kind"] == {"episodic": 1, "semantic": 1}
        assert s["memories"]["by_status"] == {"active": 2}
        assert s["schema_version"] == 1 and s["journal_mode"] == "wal"
        assert s["embedder"] == "hashing-512-v1"
        assert s["embedding_models"] == {"hashing-512-v1": 2}
        assert s["events"] >= 2


def test_trocar_de_embedder_e_reembed(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        eng.remember(kind="semantic", content="SQLite em modo WAL")
    with Engine(home=tmp_path / "h", embedder=HashingEmbedder(dim=64)) as eng:
        assert eng.stats()["embedding_models"] == {"hashing-512-v1": 1}
        assert eng.reembed() == 1
        assert eng.stats()["embedding_models"] == {"hashing-64-v1": 1}
        assert eng.search("sqlite wal")[0].signals["cosine"] == 1


def test_manutencao_expira_e_consolida(tmp_path: Path) -> None:
    relogio = RelogioFalso()
    with Engine(home=tmp_path / "h", clock=relogio) as eng:
        eng.remember(kind="semantic", content="vale pouco", expires_at="2026-11-18T12:30:00Z")
        eng.remember(kind="semantic", content="Publicar com npm run build e copiar dist")
        eng.remember(kind="semantic", content="Publicar com npm run build e copiar dist!")
        relogio.avancar(hours=1)
        rel = eng.maintenance()
        assert rel["expired"] == 1 and rel["merged"] == 1


def test_config_do_usuario_e_lida(tmp_path: Path) -> None:
    home = tmp_path / "h"
    home.mkdir()
    (home / "config.json").write_text('{"search": {"limit": 1}}', encoding="utf-8")
    with Engine(home=home) as eng:
        eng.remember(kind="semantic", content="pytest um")
        eng.remember(kind="semantic", content="pytest dois")
        assert len(eng.search("pytest")) == 1


def test_embedder_invalido_nao_deixa_banco_aberto(tmp_path: Path) -> None:
    home = tmp_path / "h"
    home.mkdir()
    (home / "config.json").write_text('{"embedder": {"backend": "sentence-transformers"}}', encoding="utf-8")
    import importlib.util

    if importlib.util.find_spec("sentence_transformers") is not None:
        pytest.skip("sentence-transformers instalado")
    with pytest.raises(ValueError, match="não está instalado"):
        Engine(home=home)
