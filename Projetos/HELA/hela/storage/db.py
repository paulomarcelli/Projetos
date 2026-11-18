"""Conexão com o SQLite.

Decisões:
- WAL: leitores (MCP, hooks, dashboard) não esperam o escritor, e uma queda no meio
  de uma escrita não corrompe o banco.
- busy_timeout: dois processos escrevendo ao mesmo tempo esperam em vez de falhar na hora.
- foreign_keys: o SQLite vem com elas desligadas; ligamos em toda conexão.
- isolation_level=None: nada de transação implícita do módulo sqlite3. Quem precisa de
  atomicidade usa Database.transaction(), que abre BEGIN IMMEDIATE explicitamente.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DEFAULT_BUSY_TIMEOUT_MS = 3000


class FTS5Indisponivel(RuntimeError):
    """O SQLite desta máquina foi compilado sem FTS5, que a busca textual exige."""


def connect(path: Path, busy_timeout_ms: int = DEFAULT_BUSY_TIMEOUT_MS) -> sqlite3.Connection:
    """Abre uma conexão já configurada (WAL, busy_timeout, foreign keys, linhas por nome)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), isolation_level=None, timeout=busy_timeout_ms / 1000)
    conn.row_factory = sqlite3.Row
    conn.execute(f"PRAGMA busy_timeout = {int(busy_timeout_ms)}")
    modo = conn.execute("PRAGMA journal_mode = WAL").fetchone()[0]
    if str(modo).lower() != "wal":
        conn.close()
        raise sqlite3.OperationalError(f"não foi possível ativar o modo WAL (ficou em {modo!r})")
    # NORMAL é seguro com WAL: uma queda de energia pode perder a última transação, nunca corromper.
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA foreign_keys = ON")
    # Conteúdo apagado é sobrescrito com zeros, em vez de ficar em páginas livres do arquivo.
    conn.execute("PRAGMA secure_delete = ON")
    return conn


def check_fts5(conn: sqlite3.Connection) -> None:
    """Falha com uma mensagem clara se o SQLite não tiver FTS5."""
    try:
        conn.execute("CREATE VIRTUAL TABLE temp.__hela_fts5_check USING fts5(x)")
        conn.execute("DROP TABLE temp.__hela_fts5_check")
    except sqlite3.OperationalError as erro:  # pragma: no cover - depende da compilação do SQLite
        raise FTS5Indisponivel(
            "O SQLite deste Python não tem FTS5. Use um Python com SQLite >= 3.9 compilado com FTS5."
        ) from erro


class Database:
    """Banco da HELA: abre a conexão e aplica as migrações pendentes."""

    def __init__(self, path: Path, busy_timeout_ms: int = DEFAULT_BUSY_TIMEOUT_MS) -> None:
        # Import tardio para evitar ciclo (migrations importa este módulo nos testes).
        from hela.storage.migrations import apply_migrations

        self.path = Path(path)
        self.conn = connect(self.path, busy_timeout_ms)
        try:
            check_fts5(self.conn)
            apply_migrations(self.conn)
        except BaseException:
            self.conn.close()  # não deixa conexão aberta se o banco não subiu
            raise

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        """Transação de escrita: tudo ou nada.

        BEGIN IMMEDIATE pega o lock de escrita logo no início, então o busy_timeout vale
        aqui e não no meio da transação. Transações aninhadas reaproveitam a de fora.
        """
        if self.conn.in_transaction:
            yield self.conn
            return
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            yield self.conn
        except BaseException:
            self.conn.execute("ROLLBACK")
            raise
        else:
            self.conn.execute("COMMIT")

    def purge(self) -> None:
        """Tira dos arquivos os restos de conteúdo apagado ou editado.

        - FTS5: apagar só grava uma marca; o termo antigo fica no segmento até uma fusão.
          'optimize' funde tudo e descarta os termos apagados.
        - WAL: guarda as versões antigas das páginas até o checkpoint. TRUNCATE copia para o
          banco e zera o arquivo -wal. Se outro processo estiver lendo, o checkpoint fica
          parcial (não dá erro) e termina no próximo.
        Custa uma reescrita do índice: usado em exclusão e edição de texto, que são raras.
        """
        if self.conn.in_transaction:
            return
        self.conn.execute("INSERT INTO memories_fts (memories_fts) VALUES ('optimize')")
        self.conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    def close(self) -> None:
        self.conn.close()
