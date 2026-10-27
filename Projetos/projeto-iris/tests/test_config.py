"""Validação das configurações."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.core.config import ConfigError, Settings, get_settings, load_settings

RAIZ = Path(__file__).resolve().parents[1]


def test_padroes_funcionam_sem_nenhuma_variavel(make_settings):
    s = make_settings()
    assert s.app_env == "development"
    assert not s.database_configured
    assert not s.llm_configured
    assert s.openai_timeout_seconds == 30


def test_le_variaveis_de_ambiente(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL", "modelo-x")
    monkeypatch.setenv("OPENAI_API_KEY", "chave-teste")
    monkeypatch.setenv("OPENAI_TIMEOUT_SECONDS", "12.5")
    s = Settings(_env_file=None)
    assert s.openai_model == "modelo-x"
    assert s.openai_timeout_seconds == 12.5
    assert s.llm_configured


def test_database_url_postgresql_e_normalizada_para_psycopg(make_settings):
    s = make_settings(database_url="postgresql://u:p@localhost:5432/db")
    assert s.database_url.get_secret_value() == "postgresql+psycopg://u:p@localhost:5432/db"
    assert s.database_configured


@pytest.mark.parametrize(
    "url",
    [
        "mysql://u:p@localhost/db",
        "sqlite:///arquivo.db",
        "postgresql+asyncpg://u:p@localhost/db",
        "isto nao e uma url",
        "postgresql://u:p@localhost",
    ],
)
def test_database_url_invalida_e_rejeitada(url):
    with pytest.raises(ConfigError) as erro:
        load_settings(_env_file=None, database_url=url)
    assert "DATABASE_URL" in str(erro.value)


def test_erro_de_configuracao_nao_vaza_o_valor():
    with pytest.raises(ConfigError) as erro:
        load_settings(_env_file=None, database_url="mysql://usuario:SENHA_SECRETA_123@host/db")
    assert "SENHA_SECRETA_123" not in str(erro.value)
    assert "usuario" not in str(erro.value)


@pytest.mark.parametrize(
    ("campo", "valor"),
    [
        ("openai_timeout_seconds", 0),
        ("openai_timeout_seconds", 9999),
        ("openai_max_retries", -1),
        ("openai_max_retries", 50),
        ("db_connect_timeout_seconds", 0),
        ("log_level", "FALADOR"),
        ("app_env", "staging"),
        ("openai_model", ""),
    ],
)
def test_valores_fora_do_permitido_sao_rejeitados(campo, valor):
    with pytest.raises(ConfigError) as erro:
        load_settings(_env_file=None, **{campo: valor})
    assert campo.upper() in str(erro.value)


def test_strings_vazias_viram_ausentes(make_settings):
    s = make_settings(database_url="  ", openai_api_key="", openai_base_url="")
    assert s.database_url is None
    assert s.openai_api_key is None
    assert s.openai_base_url is None


def test_repr_nao_expoe_segredos(make_settings):
    s = make_settings(
        database_url="postgresql://u:SENHA_DB@localhost/db", openai_api_key="sk-CHAVE-SECRETA"
    )
    texto = f"{s!r} {s}"
    assert "SENHA_DB" not in texto
    assert "sk-CHAVE-SECRETA" not in texto


def test_env_example_e_um_arquivo_de_configuracao_valido():
    """O exemplo documentado precisa realmente funcionar quando copiado para .env."""
    s = Settings(_env_file=RAIZ / ".env.example")
    assert s.database_configured
    assert s.llm_configured
    assert s.openai_model


def test_get_settings_e_cacheada(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL", "primeiro")
    primeiro = get_settings()
    monkeypatch.setenv("OPENAI_MODEL", "segundo")
    assert get_settings() is primeiro
