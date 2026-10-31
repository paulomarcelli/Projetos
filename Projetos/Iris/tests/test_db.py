"""Testes de integração com um PostgreSQL + pgvector REAL.

Ficam ignorados quando IRIS_TEST_DATABASE_URL não está definida. Use um banco de TESTE: estes
testes aplicam e desfazem as migrações (habilitam e removem a extensão `vector`, criam e apagam
as tabelas de documentos).

    docker compose up -d --wait
    IRIS_TEST_DATABASE_URL=postgresql+psycopg://USUARIO:SENHA@localhost:5432/iris_test \\
        uv run pytest -m integration
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.db.session import (
    build_engine,
    build_session_factory,
    check_database,
    check_pgvector,
    get_session,
)
from app.main import create_app

URL = os.environ.get("IRIS_TEST_DATABASE_URL")
RAIZ = Path(__file__).resolve().parents[1]

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not URL, reason="defina IRIS_TEST_DATABASE_URL para rodar os testes com banco"
    ),
]


@pytest.fixture
def settings(make_settings):
    return make_settings(database_url=URL, db_connect_timeout_seconds=3)


@pytest.fixture
def engine(settings):
    eng = build_engine(settings)
    yield eng
    eng.dispose()


@pytest.fixture
def alembic_cfg(settings) -> Config:
    cfg = Config(str(RAIZ / "alembic.ini"))
    cfg.set_main_option("script_location", str(RAIZ / "migrations"))
    cfg.set_main_option("prepend_sys_path", str(RAIZ))
    cfg.attributes["database_url"] = settings.database_url.get_secret_value()
    return cfg


@pytest.fixture
def banco_sem_migracao(alembic_cfg):
    """Estado inicial conhecido: nenhuma migração aplicada."""
    command.downgrade(alembic_cfg, "base")
    yield alembic_cfg
    command.downgrade(alembic_cfg, "base")


def test_conecta_ao_banco(engine):
    assert check_database(engine) is True


def test_pgvector_ausente_ate_a_migracao_e_presente_depois(engine, banco_sem_migracao):
    assert check_pgvector(engine) is False
    command.upgrade(banco_sem_migracao, "head")
    assert check_pgvector(engine) is True


def test_migracao_e_idempotente(engine, banco_sem_migracao):
    command.upgrade(banco_sem_migracao, "head")
    command.upgrade(banco_sem_migracao, "head")  # segunda vez: nada a fazer, sem erro
    with engine.connect() as conn:
        assert conn.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0002"


def test_migracao_0001_nao_cria_tabelas_alem_do_controle_do_alembic(engine, banco_sem_migracao):
    command.upgrade(banco_sem_migracao, "0001")
    with engine.connect() as conn:
        tabelas = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        ).scalars()
        assert set(tabelas) == {"alembic_version"}


def test_tipo_vector_funciona_apos_a_migracao(engine, banco_sem_migracao):
    """Fumaça do pgvector: só confirma que o tipo existe (sem embeddings nem índices na Fase 1)."""
    command.upgrade(banco_sem_migracao, "head")
    with engine.connect() as conn:
        distancia = conn.execute(
            text("SELECT '[1,2,3]'::vector(3) <-> '[1,2,4]'::vector(3)")
        ).scalar()
    assert distancia == pytest.approx(1.0)


def test_downgrade_remove_a_extensao(engine, banco_sem_migracao):
    command.upgrade(banco_sem_migracao, "head")
    command.downgrade(banco_sem_migracao, "base")
    assert check_pgvector(engine) is False


def test_readiness_de_ponta_a_ponta(settings, banco_sem_migracao):
    with TestClient(create_app(settings)) as c:
        antes = c.get("/health/ready")
        assert antes.status_code == 503
        assert antes.json()["checks"] == {"database": "ok", "pgvector": "missing"}

        command.upgrade(banco_sem_migracao, "head")
        depois = c.get("/health/ready")
        assert depois.status_code == 200
        assert depois.json()["checks"] == {"database": "ok", "pgvector": "ok"}


def test_credenciais_erradas_dao_indisponivel_sem_vazar(make_settings, caplog):
    url = make_url(URL).set(password="senha-errada-xyz")
    eng = build_engine(make_settings(database_url=url.render_as_string(hide_password=False)))
    try:
        assert check_database(eng) is False
    finally:
        eng.dispose()
    assert "senha-errada-xyz" not in caplog.text  # o log registra o tipo do erro, nunca a URL


def test_sessao_por_requisicao_executa_consultas_e_devolve_a_conexao(settings):
    app = create_app(settings)

    class Req:  # só precisa expor app.state, como a Request do FastAPI
        pass

    req = Req()
    req.app = app
    gerador = get_session(req)
    sessao = next(gerador)
    assert sessao.execute(text("SELECT 42")).scalar() == 42
    gerador.close()
    assert app.state.engine.pool.checkedout() == 0


def test_sessao_desfaz_a_transacao_quando_ha_erro(settings):
    app = create_app(settings)
    req = type("Req", (), {"app": app})()
    gerador = get_session(req)
    sessao = next(gerador)
    sessao.execute(text("CREATE TEMP TABLE t_rollback (x int)"))
    with pytest.raises(RuntimeError):
        gerador.throw(RuntimeError("falha simulada"))
    assert app.state.engine.pool.checkedout() == 0


def test_fabrica_de_sessoes_usa_a_mesma_engine(engine):
    fabrica = build_session_factory(engine)
    with fabrica() as sessao:
        assert sessao.get_bind() is engine


def test_url_de_teste_usa_o_driver_esperado():
    assert make_url(URL).get_backend_name() == "postgresql"
    assert create_engine(URL)  # a URL é válida para o SQLAlchemy
