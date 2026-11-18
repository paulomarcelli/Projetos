"""Persistência: SQLite em WAL, migrações versionadas e repositórios."""

from hela.storage.db import Database, connect

__all__ = ["Database", "connect"]
