"""Correções dos achados altos da revisão da Fase 2 (docs/revisoes/2026-11-18-fase2.md, A-1 a A-7).

Baseados nos testes de ataque da Sabrina. Chaves falsas montadas em tempo de execução.
"""

from __future__ import annotations

import multiprocessing as mp
import sqlite3
import time
from pathlib import Path

import pytest

from hela.core.engine import Engine
from hela.storage.db import Database, connect
from hela.storage.migrations import MIGRATIONS, apply_migrations, current_version


# --- A-5 · COMMIT que falha não deixa a conexão presa -----------------------------------

def test_commit_que_falha_nao_deixa_transacao_aberta(tmp_path: Path) -> None:
    db = Database(tmp_path / "x.db")
    with pytest.raises(sqlite3.Error):
        with db.transaction() as c:
            c.execute("PRAGMA defer_foreign_keys = ON")  # a FK só é conferida no COMMIT, que falha
            c.execute("INSERT INTO relationships (source_id, target_id, type, created_at, updated_at)"
                      " VALUES ('nao', 'existe', 't', 'x', 'x')")
    assert not db.conn.in_transaction
    outro = sqlite3.connect(str(tmp_path / "x.db"), timeout=0.2)
    outro.execute("BEGIN IMMEDIATE")  # não fica travado
    outro.execute("ROLLBACK")
    outro.close()
    with db.transaction() as c:  # e a próxima transação grava de verdade
        c.execute("INSERT INTO meta (key, value) VALUES ('depois', '1')")
    db.close()
    confere = sqlite3.connect(str(tmp_path / "x.db"))
    assert confere.execute("SELECT value FROM meta WHERE key = 'depois'").fetchone() == ("1",)
    confere.close()


# --- A-1 · migrações concorrentes -------------------------------------------------------

def _abre(caminho: str, barreira, fila) -> None:  # type: ignore[no-untyped-def]
    try:
        barreira.wait()
        Database(Path(caminho)).close()
        fila.put("ok")
    except Exception as erro:  # noqa: BLE001
        fila.put(f"{type(erro).__name__}: {erro}")


def _concorrente(caminhos: list[Path], n: int = 4) -> list[str]:
    ctx = mp.get_context("spawn")
    falhas: list[str] = []
    for caminho in caminhos:
        barreira, fila = ctx.Barrier(n), ctx.Queue()
        ps = [ctx.Process(target=_abre, args=(str(caminho), barreira, fila)) for _ in range(n)]
        for p in ps:
            p.start()
        for p in ps:
            p.join(60)
        falhas += [r for r in (fila.get(timeout=5) for _ in ps) if r != "ok"]
    return falhas


def test_primeira_abertura_concorrente(tmp_path: Path) -> None:
    caminhos = [tmp_path / f"novo{i}" / "hela.db" for i in range(6)]
    assert _concorrente(caminhos) == []
    for c in caminhos:
        conn = connect(c)
        assert current_version(conn) == MIGRATIONS[-1].version
        conn.close()


def test_atualizacao_concorrente_de_v1_para_v2(tmp_path: Path) -> None:
    caminhos = []
    for i in range(6):
        c = tmp_path / f"v1_{i}.db"
        conn = connect(c)
        apply_migrations(conn, [m for m in MIGRATIONS if m.version == 1])
        conn.close()
        caminhos.append(c)
    assert _concorrente(caminhos) == []


def test_aplicar_migracao_ja_aplicada_por_outro_processo_e_inofensivo(tmp_path: Path) -> None:
    conn = connect(tmp_path / "a.db")
    assert apply_migrations(conn) == MIGRATIONS[-1].version
    assert apply_migrations(conn) == MIGRATIONS[-1].version  # nada a fazer, nada quebra
    conn.close()


def test_wal_nao_e_pedido_de_novo(tmp_path: Path) -> None:
    caminho = tmp_path / "w.db"
    connect(caminho).close()
    trava = sqlite3.connect(str(caminho))
    trava.execute("BEGIN EXCLUSIVE")  # alguém escrevendo: trocar o modo de diário travaria
    try:
        inicio = time.perf_counter()
        conn = connect(caminho, busy_timeout_ms=200)
        assert (time.perf_counter() - inicio) < 1.0
        conn.close()
    finally:
        trava.execute("ROLLBACK")
        trava.close()


# --- A-2 · busca com outro processo gravando --------------------------------------------

def test_busca_devolve_resultado_com_escrita_travada(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:  # busy_timeout padrão: 3 s
        eng.remember(kind="procedural", content="rodar testes com pytest -q")
        trava = sqlite3.connect(str(eng.db.path))
        trava.execute("BEGIN IMMEDIATE")  # outro processo segurando a escrita
        try:
            inicio = time.perf_counter()
            hits = eng.search("pytest")
            assert (time.perf_counter() - inicio) < 0.3 and hits
        finally:
            trava.execute("ROLLBACK")
            trava.close()


def test_busca_sem_registro_nao_grava(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        m = eng.remember(kind="procedural", content="rodar testes com pytest -q").memory
        eventos = eng.memories.events.count()
        assert eng.search("pytest", record=False)
        assert eng.memories.events.count() == eventos
        assert eng.get(m.id, record_access=False).access_count == 0
