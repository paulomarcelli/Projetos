"""Migração 3 (Fase 4): contador dos vetores, linguagem aprovada e cursores do transcript."""

from __future__ import annotations

from hela.storage.db import Database
from hela.storage.migrations import MIGRATIONS, current_version


def _versao(db: Database) -> int:
    return int(db.conn.execute("SELECT value FROM meta WHERE key = 'vectors_version'").fetchone()[0])


def _inserir(db: Database, mid: str, h: str) -> None:
    db.conn.execute(
        "INSERT INTO memories (id, kind, content, content_hash, embedding, embedding_model, created_at, updated_at)"
        " VALUES (?, 'semantic', 'x', ?, x'00000000', 'm', '2026-01-01', '2026-01-01')", (mid, h))


def test_migracao_3_existe_e_e_a_ultima(tmp_path):
    db = Database(tmp_path / "h.db")
    assert MIGRATIONS[-1].version == 3 and current_version(db.conn) == 3
    colunas = {r[1] for r in db.conn.execute("PRAGMA table_info(procedures)")}
    assert "approved_language" in colunas
    cursores = {r[1] for r in db.conn.execute("PRAGMA table_info(transcript_cursors)")}
    assert {"path", "session_id", "offset", "recent_ids", "updated_at"} <= cursores


def test_contador_dos_vetores_sobe_so_quando_o_vetor_muda_ou_some(tmp_path):
    db = Database(tmp_path / "h.db")
    assert _versao(db) == 0
    _inserir(db, "a", "h1")
    assert _versao(db) == 0  # inserção é seguida pelo maior rid, não pelo contador
    db.conn.execute("UPDATE memories SET access_count = 3, last_accessed = 'x', quality = 0.9 WHERE id = 'a'")
    assert _versao(db) == 0  # acesso e qualidade não mexem nos vetores
    db.conn.execute("UPDATE memories SET embedding = x'01000000' WHERE id = 'a'")
    assert _versao(db) == 1
    db.conn.execute("UPDATE memories SET embedding_model = 'outro' WHERE id = 'a'")
    assert _versao(db) == 2
    db.conn.execute("DELETE FROM memories WHERE id = 'a'")
    assert _versao(db) == 3
