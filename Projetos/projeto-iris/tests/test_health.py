"""Endpoints de saúde: processo (/health) e prontidão das dependências (/health/ready)."""

from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from app.api import routes_health
from app.main import create_app

SENHA = "SENHA_SECRETA_DO_BANCO"
CHAVE = "sk-CHAVE-SECRETA-DA-OPENAI"
URL_BANCO = f"postgresql://usuario_x:{SENHA}@127.0.0.1:1/banco_x"  # porta 1: ninguém escuta


def cliente(make_settings, **valores) -> TestClient:
    return TestClient(create_app(make_settings(**valores)))


def test_aplicacao_inicia_sem_banco_nem_chave(make_settings):
    with cliente(make_settings) as c:  # `with` executa também o ciclo de vida (startup/shutdown)
        assert c.get("/health").status_code == 200


def test_health_responde_ok(make_settings):
    resposta = cliente(make_settings).get("/health")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_health_nao_consulta_dependencias(make_settings, monkeypatch):
    def nao_deveria_ser_chamado(*_a, **_k):
        raise AssertionError("/health não pode consultar o banco")

    monkeypatch.setattr(routes_health, "check_database", nao_deveria_ser_chamado)
    assert cliente(make_settings, database_url=URL_BANCO).get("/health").status_code == 200


def test_ready_sem_banco_configurado_nao_esta_pronto(make_settings):
    resposta = cliente(make_settings).get("/health/ready")
    assert resposta.status_code == 503
    corpo = resposta.json()
    assert corpo["status"] == "not_ready"
    assert corpo["checks"] == {"database": "not_configured", "pgvector": "unknown"}
    assert corpo["optional"] == {"llm": "not_configured"}


def test_ready_pronto_quando_banco_e_pgvector_respondem(make_settings, monkeypatch):
    monkeypatch.setattr(routes_health, "check_database", lambda _e: True)
    monkeypatch.setattr(routes_health, "check_pgvector", lambda _e: True)
    resposta = cliente(make_settings, database_url=URL_BANCO, openai_api_key=CHAVE).get(
        "/health/ready"
    )
    assert resposta.status_code == 200
    assert resposta.json() == {
        "status": "ready",
        "checks": {"database": "ok", "pgvector": "ok"},
        "optional": {"llm": "configured"},
    }


def test_ready_banco_indisponivel(make_settings, monkeypatch):
    monkeypatch.setattr(routes_health, "check_database", lambda _e: False)
    corpo = cliente(make_settings, database_url=URL_BANCO).get("/health/ready").json()
    assert corpo["status"] == "not_ready"
    assert corpo["checks"] == {"database": "unavailable", "pgvector": "unknown"}


def test_ready_pgvector_ausente_indica_migracao_pendente(make_settings, monkeypatch):
    monkeypatch.setattr(routes_health, "check_database", lambda _e: True)
    monkeypatch.setattr(routes_health, "check_pgvector", lambda _e: False)
    resposta = cliente(make_settings, database_url=URL_BANCO).get("/health/ready")
    assert resposta.status_code == 503
    assert resposta.json()["checks"] == {"database": "ok", "pgvector": "missing"}


def test_ready_com_banco_inalcancavel_de_verdade_falha_rapido_e_sem_vazar(make_settings):
    inicio = time.monotonic()
    resposta = cliente(make_settings, database_url=URL_BANCO, db_connect_timeout_seconds=1).get(
        "/health/ready"
    )
    assert time.monotonic() - inicio < 10
    assert resposta.status_code == 503
    assert resposta.json()["checks"]["database"] == "unavailable"
    for segredo in (SENHA, "usuario_x", "banco_x", "127.0.0.1"):
        assert segredo not in resposta.text


@pytest.mark.parametrize("caminho", ["/health", "/health/ready", "/docs", "/openapi.json"])
def test_nenhuma_resposta_expoe_segredos(make_settings, caminho):
    c = cliente(make_settings, database_url=URL_BANCO, openai_api_key=CHAVE)
    texto = c.get(caminho).text
    for segredo in (SENHA, CHAVE):
        assert segredo not in texto


def test_documentacao_automatica_lista_saude_e_documentos(make_settings):
    c = cliente(make_settings)
    assert c.get("/docs").status_code == 200
    esquema = c.get("/openapi.json").json()
    assert sorted(esquema["paths"]) == [
        "/documents",
        "/documents/upload",
        "/documents/{document_id}",
        "/documents/{document_id}/pages",
        "/health",
        "/health/ready",
    ]
    assert esquema["info"]["title"] == "Projeto Iris"
