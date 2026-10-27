"""Configuração da aplicação, lida de variáveis de ambiente (ou de um arquivo `.env` local).

Todas as configurações passam por validação ao iniciar. Se algo estiver inválido, o erro mostra
o NOME da variável e o motivo, nunca o valor: URLs de banco e chaves de API contêm segredos.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class ConfigError(RuntimeError):
    """Configuração ausente ou inválida. A mensagem nunca contém valores de variáveis."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # o mesmo .env também guarda POSTGRES_* usados pelo docker-compose
        case_sensitive=False,
    )

    app_env: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # Banco de dados. Opcional para a API subir; /health/ready informa se falta configurar.
    database_url: SecretStr | None = None
    db_connect_timeout_seconds: float = Field(default=3.0, gt=0, le=60)

    # Modelo de linguagem (OpenAI). A chave é opcional: só é exigida quando o cliente é usado.
    openai_api_key: SecretStr | None = None
    openai_model: str = Field(default="gpt-4o-mini", min_length=1)
    openai_base_url: str | None = Field(
        default=None,
        description="Endereço alternativo compatível com a API da OpenAI (opcional).",
    )
    openai_timeout_seconds: float = Field(default=30.0, gt=0, le=300)
    openai_max_retries: int = Field(default=2, ge=0, le=5)

    @field_validator("database_url")
    @classmethod
    def _validar_database_url(cls, valor: SecretStr | None) -> SecretStr | None:
        """Aceita só PostgreSQL com o driver psycopg 3; `postgresql://` é normalizado."""
        if valor is None or not valor.get_secret_value().strip():
            return None
        try:
            url = make_url(valor.get_secret_value().strip())
        except ArgumentError:
            raise ValueError("não é uma URL de banco válida") from None
        if url.get_backend_name() != "postgresql":
            raise ValueError("deve ser uma URL PostgreSQL (postgresql+psycopg://...)")
        if url.get_driver_name() not in ("psycopg", "postgresql"):
            raise ValueError("o driver deve ser psycopg (postgresql+psycopg://...)")
        if not url.host or not url.database:
            raise ValueError("a URL precisa de servidor e nome do banco")
        url = url.set(drivername="postgresql+psycopg")
        return SecretStr(url.render_as_string(hide_password=False))

    @field_validator("openai_api_key", mode="before")
    @classmethod
    def _chave_vazia_e_ausente(cls, valor: object) -> object:
        if isinstance(valor, str) and not valor.strip():
            return None
        return valor

    @field_validator("openai_base_url", mode="before")
    @classmethod
    def _base_url_vazia_e_ausente(cls, valor: object) -> object:
        if isinstance(valor, str) and not valor.strip():
            return None
        return valor

    @property
    def database_configured(self) -> bool:
        return self.database_url is not None

    @property
    def llm_configured(self) -> bool:
        return self.openai_api_key is not None


def load_settings(**overrides: object) -> Settings:
    """Lê e valida as configurações, trocando o erro técnico do pydantic por um sem valores."""
    try:
        return Settings(**overrides)  # type: ignore[arg-type]
    except ValidationError as erro:
        problemas = "; ".join(
            f"{'.'.join(str(parte) for parte in e['loc']).upper()}: {e['msg']}"
            for e in erro.errors(include_input=False, include_url=False)
        )
        raise ConfigError(f"Configuração inválida: {problemas}") from None


@lru_cache
def get_settings() -> Settings:
    return load_settings()
