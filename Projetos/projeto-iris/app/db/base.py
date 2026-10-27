"""Base declarativa do SQLAlchemy e convenção de nomes das restrições.

Os modelos ficam em `app/db/models.py`. A convenção de nomes dá a índices e chaves nomes
estáveis e previsíveis, o que evita migrações frágeis quando o esquema evoluir.
"""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
