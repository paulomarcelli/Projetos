"""Testes do armazenamento: esquema, migrações, WAL, FTS5 e contador do grafo."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from hela.core.paths import db_path, hela_home
from hela.storage.db import Database, connect
from hela.storage.migrations import MIGRATIONS, Migration, apply_migrations, current_version

TABELAS = {
    "schema_version", "meta", "memories", "memories_fts", "procedures", "tasks", "outcomes",
    "relationships", "feedback", "strategies", "strategy_metrics", "retrievals", "observations",
    "events", "sessions", "versions", "evolution_proposals", "classifier_models",
}


def _tabelas(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    return {r[0] for r in rows}


def _nova_memoria(conn: sqlite3.Connection, mid: str, content: str) -> None:
    conn.execute(
        "INSERT INTO memories (id, kind, content, content_hash, created_at, updated_at)"
        " VALUES (?, 'semantic', ?, ?, '2026-01-01T00:00:00.000000+00:00', '2026-01-01T00:00:00.000000+00:00')",
        (mid, content, "hash-" + mid),
    )


def test_hela_home_vem_da_variavel_de_ambiente(hela_home_temporario: Path) -> None:
    assert hela_home() == hela_home_temporario
    assert db_path() == hela_home_temporario / "hela.db"


def test_hela_home_padrao_e_ponto_hela_no_home(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("HELA_HOME")
    monkeypatch.setenv("HOME", str(tmp_path))
    assert hela_home() == tmp_path / ".hela"


def test_esquema_completo_criado(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")
    assert TABELAS <= _tabelas(db.conn)
    assert current_version(db.conn) == MIGRATIONS[-1].version


def test_kind_restrito_aos_quatro_tipos(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")
    with pytest.raises(sqlite3.IntegrityError):
        db.conn.execute(
            "INSERT INTO memories (id, kind, content, content_hash, created_at, updated_at)"
            " VALUES ('x', 'sonho', 'c', 'h', 'a', 'a')"
        )


def test_reabrir_nao_reaplica_migracoes(tmp_path: Path) -> None:
    Database(tmp_path / "h.db").close()
    db = Database(tmp_path / "h.db")
    linhas = db.conn.execute("SELECT COUNT(*) FROM schema_version").fetchone()[0]
    assert linhas == len(MIGRATIONS)


def test_migracao_com_erro_faz_rollback(tmp_path: Path) -> None:
    conn = connect(tmp_path / "h.db")
    ruins = [Migration(1, "quebrada", "CREATE TABLE ok_1 (a INTEGER); CREATE TABLE ;")]
    with pytest.raises(sqlite3.Error):
        apply_migrations(conn, ruins)
    assert current_version(conn) == 0
    assert "ok_1" not in _tabelas(conn)


def test_pragmas_wal_busy_timeout_e_foreign_keys(tmp_path: Path) -> None:
    conn = connect(tmp_path / "h.db", busy_timeout_ms=3000)
    assert conn.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    assert conn.execute("PRAGMA busy_timeout").fetchone()[0] == 3000
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1


def test_wal_permite_ler_durante_escrita(tmp_path: Path) -> None:
    escritor = Database(tmp_path / "h.db")
    leitor = connect(tmp_path / "h.db")
    _nova_memoria(escritor.conn, "m1", "primeira")
    escritor.conn.execute("BEGIN IMMEDIATE")
    _nova_memoria(escritor.conn, "m2", "segunda")
    # Com a escrita aberta, o leitor não trava e vê o estado confirmado.
    assert leitor.execute("SELECT COUNT(*) FROM memories").fetchone()[0] == 1
    escritor.conn.execute("COMMIT")
    assert leitor.execute("SELECT COUNT(*) FROM memories").fetchone()[0] == 2


def test_transacao_desfaz_tudo_em_erro(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")
    with pytest.raises(RuntimeError):
        with db.transaction() as conn:
            _nova_memoria(conn, "m1", "vai sumir")
            raise RuntimeError("queda no meio")
    assert db.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0] == 0


def test_fts5_acompanha_insert_update_delete(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")
    _nova_memoria(db.conn, "m1", "renderização no Blender com Cycles")

    def achar(termo: str) -> list[str]:
        sql = ("SELECT m.id FROM memories_fts f JOIN memories m ON m.rid = f.rowid"
               " WHERE memories_fts MATCH ?")
        return [r[0] for r in db.conn.execute(sql, (termo,))]

    assert achar("blender") == ["m1"]
    assert achar("renderizacao") == ["m1"]  # acentos removidos no índice
    db.conn.execute("UPDATE memories SET content = 'compilação com Vite' WHERE id = 'm1'")
    assert achar("blender") == []
    assert achar("vite") == ["m1"]
    db.conn.execute("DELETE FROM memories WHERE id = 'm1'")
    assert achar("vite") == []


def test_graph_version_sobe_com_relacoes_inclusive_em_cascata(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")

    def versao() -> int:
        return int(db.conn.execute("SELECT value FROM meta WHERE key='graph_version'").fetchone()[0])

    _nova_memoria(db.conn, "a", "a")
    _nova_memoria(db.conn, "b", "b")
    v0 = versao()
    db.conn.execute(
        "INSERT INTO relationships (source_id, target_id, type, created_at, updated_at)"
        " VALUES ('a', 'b', 'related', 'x', 'x')"
    )
    v1 = versao()
    assert v1 > v0
    db.conn.execute("UPDATE relationships SET weight = 0.3")
    v2 = versao()
    assert v2 > v1
    db.conn.execute("DELETE FROM memories WHERE id = 'a'")  # apaga a aresta em cascata
    assert db.conn.execute("SELECT COUNT(*) FROM relationships").fetchone()[0] == 0
    assert versao() > v2


def test_relacao_consigo_mesma_e_recusada(tmp_path: Path) -> None:
    db = Database(tmp_path / "h.db")
    _nova_memoria(db.conn, "a", "a")
    with pytest.raises(sqlite3.IntegrityError):
        db.conn.execute(
            "INSERT INTO relationships (source_id, target_id, type, created_at, updated_at)"
            " VALUES ('a', 'a', 'related', 'x', 'x')"
        )
