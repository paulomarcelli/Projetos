"""Correções dos achados altos da revisão da Fase 2 (docs/revisoes/2026-11-18-fase2.md, A-1 a A-7).

Baseados nos testes de ataque da Sabrina. Chaves falsas montadas em tempo de execução.
"""

from __future__ import annotations

import multiprocessing as mp
import sqlite3
import time
from pathlib import Path

import pytest

from hela.core.engine import Engine
from hela.storage.db import Database, connect
from hela.storage.migrations import MIGRATIONS, apply_migrations, current_version


# --- A-5 · COMMIT que falha não deixa a conexão presa -----------------------------------

def test_commit_que_falha_nao_deixa_transacao_aberta(tmp_path: Path) -> None:
    db = Database(tmp_path / "x.db")
    with pytest.raises(sqlite3.Error):
        with db.transaction() as c:
            c.execute("PRAGMA defer_foreign_keys = ON")  # a FK só é conferida no COMMIT, que falha
            c.execute("INSERT INTO relationships (source_id, target_id, type, created_at, updated_at)"
                      " VALUES ('nao', 'existe', 't', 'x', 'x')")
    assert not db.conn.in_transaction
    outro = sqlite3.connect(str(tmp_path / "x.db"), timeout=0.2)
    outro.execute("BEGIN IMMEDIATE")  # não fica travado
    outro.execute("ROLLBACK")
    outro.close()
    with db.transaction() as c:  # e a próxima transação grava de verdade
        c.execute("INSERT INTO meta (key, value) VALUES ('depois', '1')")
    db.close()
    confere = sqlite3.connect(str(tmp_path / "x.db"))
    assert confere.execute("SELECT value FROM meta WHERE key = 'depois'").fetchone() == ("1",)
    confere.close()


# --- A-1 · migrações concorrentes -------------------------------------------------------

def _abre(caminho: str, barreira, fila) -> None:  # type: ignore[no-untyped-def]
    try:
        barreira.wait()
        Database(Path(caminho)).close()
        fila.put("ok")
    except Exception as erro:  # noqa: BLE001
        fila.put(f"{type(erro).__name__}: {erro}")


def _concorrente(caminhos: list[Path], n: int = 4) -> list[str]:
    ctx = mp.get_context("spawn")
    falhas: list[str] = []
    for caminho in caminhos:
        barreira, fila = ctx.Barrier(n), ctx.Queue()
        ps = [ctx.Process(target=_abre, args=(str(caminho), barreira, fila)) for _ in range(n)]
        for p in ps:
            p.start()
        for p in ps:
            p.join(60)
        falhas += [r for r in (fila.get(timeout=5) for _ in ps) if r != "ok"]
    return falhas


def test_primeira_abertura_concorrente(tmp_path: Path) -> None:
    caminhos = [tmp_path / f"novo{i}" / "hela.db" for i in range(6)]
    assert _concorrente(caminhos) == []
    for c in caminhos:
        conn = connect(c)
        assert current_version(conn) == MIGRATIONS[-1].version
        conn.close()


def test_atualizacao_concorrente_de_v1_para_v2(tmp_path: Path) -> None:
    caminhos = []
    for i in range(6):
        c = tmp_path / f"v1_{i}.db"
        conn = connect(c)
        apply_migrations(conn, [m for m in MIGRATIONS if m.version == 1])
        conn.close()
        caminhos.append(c)
    assert _concorrente(caminhos) == []


def test_aplicar_migracao_ja_aplicada_por_outro_processo_e_inofensivo(tmp_path: Path) -> None:
    conn = connect(tmp_path / "a.db")
    assert apply_migrations(conn) == MIGRATIONS[-1].version
    assert apply_migrations(conn) == MIGRATIONS[-1].version  # nada a fazer, nada quebra
    conn.close()


def test_wal_nao_e_pedido_de_novo(tmp_path: Path) -> None:
    caminho = tmp_path / "w.db"
    connect(caminho).close()
    trava = sqlite3.connect(str(caminho))
    trava.execute("BEGIN EXCLUSIVE")  # alguém escrevendo: trocar o modo de diário travaria
    try:
        inicio = time.perf_counter()
        conn = connect(caminho, busy_timeout_ms=200)
        assert (time.perf_counter() - inicio) < 1.0
        conn.close()
    finally:
        trava.execute("ROLLBACK")
        trava.close()


# --- A-2 · busca com outro processo gravando --------------------------------------------

def test_busca_devolve_resultado_com_escrita_travada(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:  # busy_timeout padrão: 3 s
        eng.remember(kind="procedural", content="rodar testes com pytest -q")
        trava = sqlite3.connect(str(eng.db.path))
        trava.execute("BEGIN IMMEDIATE")  # outro processo segurando a escrita
        try:
            inicio = time.perf_counter()
            hits = eng.search("pytest")
            assert (time.perf_counter() - inicio) < 0.3 and hits
        finally:
            trava.execute("ROLLBACK")
            trava.close()


def test_busca_sem_registro_nao_grava(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        m = eng.remember(kind="procedural", content="rodar testes com pytest -q").memory
        eventos = eng.memories.events.count()
        assert eng.search("pytest", record=False)
        assert eng.memories.events.count() == eventos
        assert eng.get(m.id, record_access=False).access_count == 0


# --- A-3 · ReDoS na redação ---------------------------------------------------------------
from hela.security.redaction import redact  # noqa: E402

SENHA = "S3nha" + "F0rte" + "xyz"
CHAVE_AWS = "AKIA" + "Z7Q2" * 4


@pytest.mark.parametrize("texto", ["a." * 50_000, "a-" * 50_000, "x://" + "a." * 30_000, "a_" * 50_000])
def test_redacao_em_tempo_linear(texto: str) -> None:
    inicio = time.perf_counter()
    redact(texto)
    assert time.perf_counter() - inicio < 0.2


def test_conteudo_grande_demais_e_recusado_antes_da_redacao(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import hela.memory.service as servico
    from hela.core.errors import InvalidInput

    chamadas = []
    monkeypatch.setattr(servico, "redact", lambda t, **k: chamadas.append(len(t)) or redact(t, **k))
    with Engine(home=tmp_path / "h") as eng:
        with pytest.raises(InvalidInput, match="max_chars"):
            eng.remember(kind="semantic", content="a" * 25_000)
    assert all(n <= 25_000 for n in chamadas) and 25_000 not in chamadas


# --- A-4 · segredos que escapavam --------------------------------------------------------
NEGATIVOS = {
    "django_secret_key": f"SECRET_KEY={SENHA}",
    "db_pass": f"DB_PASS={SENHA}",
    "encryption_key_curta": "ENCRYPTION_KEY=abc123",
    "curl_u": f"curl -u admin:{SENHA} https://api.exemplo.com/v1",
    "curl_user": f"curl --user admin:{SENHA} https://api.exemplo.com/v1",
    "mysql_p": f"mysql -u root -p{SENHA} app",
    "flag_password_espaco": f"docker login --password {SENHA} registry.exemplo.com",
    "basic_auth": "Authorization: Basic " + "YWRtaW46" + "aHVudGVyMg==",
    "cookie": f"Cookie: sessionid={SENHA}abc",
    "netrc": f"machine api.exemplo.com login paulo password {SENHA}",
    "aws_secret_com_barra": "aws_secret " + "wJalrXUtnFEMI/K7MDENG/" + "bPxRfiCYEXAMPLEKEY",
    "url_senha_com_arroba": "postgres://app:" + "p@ss" + SENHA + "@db.local/app",
    "hex_64_solto": "chave do webhook " + "9f8e7d6c5b4a3210" * 4,
}
SEGREDOS = (SENHA, "abc123", "aHVudGVyMg==", "bPxRfiCYEXAMPLEKEY", "9f8e7d6c5b4a3210" * 4)


@pytest.mark.parametrize("nome", sorted(NEGATIVOS))
def test_redacao_negativos(nome: str) -> None:
    texto = NEGATIVOS[nome]
    r = redact(texto)
    for segredo in SEGREDOS:
        if segredo in texto:
            assert segredo not in r.text, f"{nome}: vazou -> {r.text}"
    assert redact(r.text).text == r.text  # continua idempotente


@pytest.mark.parametrize("texto", [
    "mkdir -p dist && cp -pr assets dist/",
    "sha256 " + "c3b2" * 16 + " confere com o arquivo baixado",
    "imagem docker@sha256:" + "ab12" * 16,
    "commit 8248e68d1e7a7398fac0266dcde420b4b5937e68",
    "o método getUserAccountSettingsById devolve o perfil",
    "a variável primary_key=True vem do ORM",
])
def test_redacao_nao_pega_texto_tecnico_comum(texto: str) -> None:
    assert redact(texto).text == texto


def test_entropia_pega_token_aleatorio_de_24_a_32() -> None:
    import random
    import string

    rnd = random.Random(42)
    alfabeto = string.ascii_letters + string.digits
    for n in (24, 28, 32):
        perdidos = sum("".join(t) in redact(f"valor {''.join(t)} fim").text
                       for t in (["".join(rnd.choice(alfabeto) for _ in range(n))] for _ in range(500)))
        assert perdidos / 500 < 0.05, (n, perdidos)


def test_tags_metadata_project_e_source_redigidos(tmp_path: Path) -> None:
    with Engine(home=tmp_path / "h") as eng:
        r = eng.remember(kind="semantic", content="qualquer coisa", tags=[f"k {CHAVE_AWS}"],
                         metadata={f"chave {CHAVE_AWS}": "v"}, project=f"proj {CHAVE_AWS}",
                         source=f"api {CHAVE_AWS}"[:40])
        m = r.memory
        bruto = " ".join([*m.tags, *m.metadata, m.project or "", m.source])
        assert CHAVE_AWS.lower() not in bruto.lower(), bruto
        eventos = str(eng.events(limit=5))
        assert CHAVE_AWS not in eventos


def test_id_de_memoria_e_hash_de_commit_nao_sao_redigidos() -> None:
    import uuid

    texto = f"memória {uuid.uuid4().hex} e commit {'8248e68d1e7a7398fac0266dcde420b4b5937e68'}"
    assert redact(texto).text == texto
