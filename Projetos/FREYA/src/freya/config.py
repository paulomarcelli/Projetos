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
    freya_host: str = "127.0.0.1"
    # sites que podem chamar a API pelo navegador (o futuro frontend), separados por vírgula
    freya_cors_origens: str = ""
    coleta_intervalo: float = 2.0

    # Intelligence Day: notícias novas de marvel.com entram no RAG e no grafo durante a análise
    intelligence_day: bool = True
    intelligence_day_horas: float = 24.0  # intervalo mínimo entre duas varreduras das notícias
    intelligence_day_maximo: int = 8  # notícias novas lidas por varredura
    intelligence_day_trechos: int = 16  # chamadas ao modelo para extrair relações, por varredura

    # nomes dos índices
    colecao_vetorial: str = "freya_chunks"
    indice_lexical: str = "freya_chunks"

    @property
    def cors_origens_lista(self) -> list[str]:
        return [o.strip() for o in self.freya_cors_origens.split(",") if o.strip()]


@lru_cache
def config() -> Config:
    return Config()
