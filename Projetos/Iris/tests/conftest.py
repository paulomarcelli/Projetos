"""Fixtures compartilhadas. Os testes comuns não dependem de chave, banco nem internet."""

from __future__ import annotations

import ipaddress
import os
import socket

import pytest

from app.core.config import Settings, get_settings

PREFIXOS_DE_CONFIG = (
    "OPENAI_",
    "DATABASE_",
    "DB_",
    "APP_",
    "LOG_",
    "POSTGRES_",
    "STORAGE_",
    "MAX_",
)


@pytest.fixture(autouse=True)
def ambiente_limpo(monkeypatch):
    """Cada teste começa sem variáveis de configuração herdadas da máquina de quem roda."""
    for nome in list(os.environ):
        if nome.startswith(PREFIXOS_DE_CONFIG):
            monkeypatch.delenv(nome)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def sem_rede_externa(monkeypatch):
    """Falha se algum teste tentar conectar fora da própria máquina.

    Garante que nenhum teste faça chamada (paga) à OpenAI ou a qualquer serviço externo. Conexões
    para 127.0.0.1/localhost continuam permitidas (o banco local dos testes de integração).
    """
    conectar_original = socket.socket.connect

    def conectar_somente_local(self, endereco):
        if isinstance(endereco, tuple):
            host = str(endereco[0])
            try:
                local = ipaddress.ip_address(host).is_loopback
            except ValueError:
                local = host == "localhost"
            if not local:
                raise RuntimeError(f"Rede externa bloqueada nos testes (destino: {host}).")
        return conectar_original(self, endereco)

    monkeypatch.setattr(socket.socket, "connect", conectar_somente_local)


@pytest.fixture
def make_settings():
    """Cria Settings ignorando o arquivo .env da máquina."""

    def _criar(**valores) -> Settings:
        return Settings(_env_file=None, **valores)

    return _criar
