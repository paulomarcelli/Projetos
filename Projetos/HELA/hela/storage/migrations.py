"""Migrações versionadas.

Cada migração tem um número, um nome e o SQL. A tabela schema_version guarda as que já
rodaram. Uma migração roda inteira ou não roda: o SQL e o registro na schema_version
ficam na mesma transação, e qualquer erro desfaz tudo.

Para mudar o esquema numa fase futura: acrescente Migration(2, ...) ao fim da lista.
Nunca edite uma migração que já foi publicada.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone

from hela.storage.schema_v1 import SCHEMA_V1
from hela.storage.schema_v2 import SCHEMA_V2


@dataclass(frozen=True)
class Migration:
    version: int
    name: str
    sql: str


MIGRATIONS: list[Migration] = [
    Migration(1, "esquema inicial (Fase 2)", SCHEMA_V1),
    Migration(2, "aprendizado e roteador (Fase 3)", SCHEMA_V2),
]

_SCHEMA_VERSION_DDL = """
CREATE TABLE IF NOT EXISTS schema_version (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at TEXT NOT NULL
)
"""


def current_version(conn: sqlite3.Connection) -> int:
    """Maior versão aplicada (0 se o banco é novo)."""
    conn.execute(_SCHEMA_VERSION_DDL)
    row = conn.execute("SELECT MAX(version) FROM schema_version").fetchone()
    return int(row[0] or 0)


def apply_migrations(conn: sqlite3.Connection, migrations: list[Migration] | None = None) -> int:
    """Aplica as migrações pendentes, em ordem. Devolve a versão final.

    A conexão precisa estar em autocommit (isolation_level=None), como a de connect():
    assim o BEGIN/COMMIT do script é o que vale.
    """
    lista = sorted(migrations if migrations is not None else MIGRATIONS, key=lambda m: m.version)
    versao = current_version(conn)
    for mig in lista:
        if mig.version <= versao:
            continue
        agora = datetime.now(timezone.utc).isoformat(timespec="microseconds")
        nome = mig.name.replace("'", "''")
        script = (
            "BEGIN IMMEDIATE;\n"
            f"{mig.sql}\n;\n"
            f"INSERT INTO schema_version (version, name, applied_at) VALUES ({mig.version}, '{nome}', '{agora}');\n"
            "COMMIT;"
        )
        try:
            conn.executescript(script)
        except sqlite3.Error:
            if conn.in_transaction:
                conn.execute("ROLLBACK")
            raise
        versao = mig.version
    return versao
