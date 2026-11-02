"""Configuração lida do ambiente (.env). Nenhum segredo tem valor padrão no código."""
from __future__ import annotations

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    qdrant_url: str = "http://localhost:6333"
    elasticsearch_url: str = "http://localhost:9200"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: SecretStr | None = None

    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = None

    freya_db_path: str = "data/freya.db"
    coleta_intervalo: float = 2.0

    # nomes dos índices
    colecao_vetorial: str = "freya_chunks"
    indice_lexical: str = "freya_chunks"


@lru_cache
def config() -> Config:
    return Config()
