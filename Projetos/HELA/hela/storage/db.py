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
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Callable, Iterator, Optional, TypeVar

T = TypeVar("T")

DEFAULT_BUSY_TIMEOUT_MS = 3000


class FTS5Indisponivel(RuntimeError):
    """O SQLite desta máquina foi compilado sem FTS5, que a busca textual exige."""


def _garantir_wal(conn: sqlite3.Connection, busy_timeout_ms: int) -> None:
    """Liga o WAL só se ainda não estiver ligado (revisão A-1).

    Trocar o modo de diário exige trava exclusiva e não respeita o busy_timeout: com outro processo
    abrindo o mesmo banco novo, a troca falha na hora com "database is locked". Por isso: ler o modo
    primeiro (o WAL fica gravado no arquivo, então quase sempre já está ligado) e, na troca, tentar de
    novo com espera curta até o busy_timeout (no mínimo 2 s).
    """
    if str(conn.execute("PRAGMA journal_mode").fetchone()[0]).lower() == "wal":
        return
    prazo = time.monotonic() + max(busy_timeout_ms, 2000) / 1000
    while True:
        try:
            modo = conn.execute("PRAGMA journal_mode = WAL").fetchone()[0]
        except sqlite3.OperationalError as erro:
            if "locked" not in str(erro) and "busy" not in str(erro):
                raise
            modo = None
        if str(modo).lower() == "wal":
            return
        if time.monotonic() >= prazo:
            raise sqlite3.OperationalError(f"não foi possível ativar o modo WAL (ficou em {modo!r})")
        time.sleep(0.02)


def connect(path: Path, busy_timeout_ms: int = DEFAULT_BUSY_TIMEOUT_MS) -> sqlite3.Connection:
    """Abre uma conexão já configurada (WAL, busy_timeout, foreign keys, linhas por nome)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), isolation_level=None, timeout=busy_timeout_ms / 1000)
    conn.row_factory = sqlite3.Row
    conn.execute(f"PRAGMA busy_timeout = {int(busy_timeout_ms)}")
    try:
        _garantir_wal(conn, busy_timeout_ms)
    except BaseException:
        conn.close()
        raise
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
            self.conn.execute("COMMIT")  # dentro do try: um COMMIT que falha também desfaz (revisão A-5)
        except BaseException:
            if self.conn.in_transaction:
                try:
                    self.conn.execute("ROLLBACK")
                except sqlite3.Error:
                    pass  # o SQLite pode já ter desfeito sozinho (ex.: disco cheio); vale o erro original
            raise

    def try_write(self, fn: Callable[[sqlite3.Connection], T], busy_timeout_ms: int = 50) -> tuple[bool, Optional[T]]:
        """Gravação de melhor esforço (revisão F3-A1): espera no máximo busy_timeout_ms; com o banco
        ocupado, desiste e devolve (False, None). Para registros (eventos, retrievals), nunca para dado
        que o usuário mandou gravar.
        """
        if self.conn.in_transaction:  # dentro de outra transação: grava junto com ela
            return True, fn(self.conn)
        anterior = int(self.conn.execute("PRAGMA busy_timeout").fetchone()[0])
        self.conn.execute(f"PRAGMA busy_timeout = {int(busy_timeout_ms)}")
        try:
            with self.transaction():
                valor = fn(self.conn)
            return True, valor
        except sqlite3.OperationalError as erro:
            if "locked" not in str(erro) and "busy" not in str(erro):
                raise
            return False, None
        finally:
            self.conn.execute(f"PRAGMA busy_timeout = {anterior}")

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
