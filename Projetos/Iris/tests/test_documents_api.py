"""Recusas do upload pela API, sem banco de dados.

A validação acontece antes de qualquer acesso ao banco. Por isso estes testes usam uma URL de banco
que não responde (porta fechada em 127.0.0.1): se alguma recusa tocasse o banco, viraria 503.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from pdfs import gerar_pdf

from backend.main import create_app

BANCO_FECHADO = "postgresql+psycopg://iris:senha-do-teste@127.0.0.1:9/iris"


@pytest.fixture
def pasta(tmp_path):
    return tmp_path / "armazenamento"


@pytest.fixture
def cliente(make_settings, pasta):
    settings = make_settings(
        database_url=BANCO_FECHADO, db_connect_timeout_seconds=1, storage_dir=pasta, max_upload_mb=1
    )
    with TestClient(create_app(settings), raise_server_exceptions=False) as c:
        yield c


def enviar(cliente, dados: bytes, nome="artigo.pdf", tipo="application/pdf", **campos):
    return cliente.post("/documents/upload", files={"file": (nome, dados, tipo)}, data=campos)


def sem_sobras(pasta) -> bool:
    """Nenhum arquivo (nem temporário) ficou no armazenamento."""
    return not pasta.exists() or not [p for p in pasta.rglob("*") if p.is_file()]


def assert_sem_vazamento(resposta, pasta):
    corpo = resposta.text
    for proibido in (str(pasta), "/tmp", "Traceback", "senha-do-teste", "psycopg", ".part"):
        assert proibido not in corpo


@pytest.mark.parametrize(
    ("nome", "tipo", "dados", "status", "codigo"),
    [
        ("notas.txt", "text/plain", b"apenas texto", 415, "unsupported_extension"),
        ("artigo.pdf", "text/plain", gerar_pdf([["x"]]), 415, "unsupported_media_type"),
        ("artigo.pdf", "application/pdf", b"MZ\x90\x00 executavel", 415, "invalid_signature"),
        ("artigo.pdf", "application/pdf", b"<script>alert(1)</script>", 415, "invalid_signature"),
        ("artigo.pdf", "application/pdf", b"", 400, "empty_file"),
        ("artigo.pdf", "application/pdf", b"%PDF-1.4\n" + b"lixo" * 99, 422, "corrupted_pdf"),
        ("artigo.pdf", "application/pdf", gerar_pdf([["x"]])[:250], 422, "corrupted_pdf"),
        ("artigo.exe", "application/pdf", gerar_pdf([["x"]]), 415, "unsupported_extension"),
    ],
)
def test_upload_recusado_com_codigo_claro(cliente, pasta, nome, tipo, dados, status, codigo):
    r = enviar(cliente, dados, nome, tipo)
    assert r.status_code == status
    assert r.json()["code"] == codigo
    assert sem_sobras(pasta)
    assert_sem_vazamento(r, pasta)


def test_upload_grande_demais_e_recusado_no_caminho(cliente, pasta):
    grande = gerar_pdf([["x"]]) + b"%" + b"0" * (1024 * 1024)
    r = enviar(cliente, grande)
    assert r.status_code == 413 and r.json()["code"] == "file_too_large"
    assert sem_sobras(pasta)


def test_corpo_gigante_e_recusado_pelo_content_length_antes_de_ler(cliente):
    def nunca_lido():
        raise AssertionError("o corpo não deveria ser lido")
        yield b""  # pragma: no cover

    r = cliente.post(
        "/documents/upload",
        content=nunca_lido(),
        headers={
            "content-type": "multipart/form-data; boundary=x",
            "content-length": str(50 * 1024 * 1024),
        },
    )
    assert r.status_code == 413 and r.json()["code"] == "file_too_large"


def test_corpo_sem_content_length_e_cortado_ao_passar_do_limite(cliente, pasta):
    enviados = 0

    def corpo():
        nonlocal enviados
        yield (
            b'--x\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n'
            b"Content-Type: application/pdf\r\n\r\n%PDF-1.7\n"
        )
        for _ in range(10):  # 10 MB, bem acima do limite de 1 MB (+ folga)
            enviados += 1
            yield b"0" * (1024 * 1024)
        yield b"\r\n--x--\r\n"

    r = cliente.post(
        "/documents/upload",
        content=corpo(),
        headers={"content-type": "multipart/form-data; boundary=x"},
    )
    assert r.status_code == 413 and r.json()["code"] == "file_too_large"
    assert sem_sobras(pasta)


def test_metadados_invalidos_sao_recusados_antes_do_arquivo(cliente, pasta):
    r = enviar(cliente, gerar_pdf([["x"]]), doi="isso-nao-e-doi", publication_year="ontem")
    assert r.status_code == 422
    assert r.json()["code"] == "invalid_metadata"
    assert "doi" in r.json()["detail"] and "publication_year" in r.json()["detail"]
    assert "isso-nao-e-doi" not in r.text  # o valor enviado não é ecoado
    assert sem_sobras(pasta)


def test_sem_arquivo_e_erro_de_validacao(cliente):
    assert cliente.post("/documents/upload", data={"title": "x"}).status_code == 422


def test_pdf_valido_com_banco_fora_do_ar_da_503_sem_vazar_nada(cliente, pasta):
    r = enviar(cliente, gerar_pdf([["Texto válido"]]), nome="../../segredo.pdf")
    assert r.status_code == 503 and r.json()["code"] == "database_unavailable"
    assert_sem_vazamento(r, pasta)
    assert sem_sobras(pasta)  # o temporário foi apagado


def test_sem_banco_configurado_da_503(make_settings, tmp_path):
    app = create_app(make_settings(storage_dir=tmp_path))
    with TestClient(app) as c:
        for r in (
            c.get("/documents"),
            c.get("/documents/00000000-0000-0000-0000-000000000000"),
            c.post("/documents/upload", files={"file": ("a.pdf", b"%PDF-", "application/pdf")}),
        ):
            assert r.status_code == 503 and r.json()["code"] == "database_not_configured"


def test_id_invalido_e_erro_de_validacao(cliente):
    assert cliente.get("/documents/../../etc/passwd").status_code == 404
    assert cliente.get("/documents/nao-e-uuid").status_code == 422
    assert cliente.delete("/documents/nao-e-uuid").status_code == 422


def test_paginacao_fora_dos_limites_e_recusada(cliente):
    assert cliente.get("/documents?limit=0").status_code == 422
    assert cliente.get("/documents?limit=101").status_code == 422
    assert cliente.get("/documents?offset=-1").status_code == 422


def test_rotas_de_outros_metodos_nao_sao_afetadas_pelo_limite(cliente):
    assert cliente.get("/health").status_code == 200
