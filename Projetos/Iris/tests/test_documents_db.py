"""Ingestão de ponta a ponta com um PostgreSQL + pgvector REAL.

Ignorados sem IRIS_TEST_DATABASE_URL. Use um banco de TESTE: as tabelas de documentos são
esvaziadas antes e depois de cada teste.

    IRIS_TEST_DATABASE_URL=postgresql+psycopg://USUARIO:SENHA@localhost:5432/iris_test \\
        uv run pytest -m integration
"""

from __future__ import annotations

import hashlib
import os
import threading
import uuid
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from pdfs import gerar_pdf, xmp_basico
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import database.models  # noqa: F401
from backend.main import create_app
from database.base import Base
from database.models import Document, DocumentStatus
from database.session import check_pgvector
from ingestion import processing, service
from ingestion.extraction import PdfIlegivel
from ingestion.schemas import MetadadosInformados
from ingestion.storage import Armazenamento, StorageError

URL = os.environ.get("IRIS_TEST_DATABASE_URL")
RAIZ = Path(__file__).resolve().parents[1]

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not URL, reason="defina IRIS_TEST_DATABASE_URL para rodar os testes com banco"
    ),
]

TEXTO_PT = [
    "A política externa do Brasil passou por mudanças importantes nas últimas décadas.",
    "O país buscou ampliar sua presença nos fóruns multilaterais e também fortalecer as",
    "relações com os vizinhos da região. Para muitos analistas, essa estratégia foi marcada",
    "pela ideia de autonomia, e isso se refletiu na atuação do Itamaraty em temas como",
    "comércio, meio ambiente e segurança, que são centrais para a inserção do Estado.",
]


# ------------------------------------------------------------------ fixtures


@pytest.fixture
def banco():
    cfg = Config(str(RAIZ / "alembic.ini"))
    cfg.set_main_option("script_location", str(RAIZ / "database" / "migrations"))
    cfg.attributes["database_url"] = URL
    command.upgrade(cfg, "head")
    eng = create_engine(URL)
    with eng.begin() as conn:
        conn.execute(text("DELETE FROM documents"))
    yield eng
    with eng.begin() as conn:
        conn.execute(text("DELETE FROM documents"))
    eng.dispose()


@pytest.fixture
def pasta(tmp_path):
    return tmp_path / "armazenamento"


@pytest.fixture
def aplicacao(make_settings, banco, pasta):
    settings = make_settings(database_url=URL, storage_dir=pasta, max_upload_mb=2, max_pdf_pages=50)
    return create_app(settings)


@pytest.fixture
def cliente(aplicacao):
    with TestClient(aplicacao, raise_server_exceptions=False) as c:
        yield c


def enviar(cliente, dados: bytes, nome="artigo.pdf", **campos):
    return cliente.post(
        "/documents/upload", files={"file": (nome, dados, "application/pdf")}, data=campos
    )


def pdfs_guardados(pasta: Path) -> list[Path]:
    if not pasta.exists():
        return []
    return [p for p in pasta.rglob("*") if p.is_file() and not ({".tmp", ".trash"} & set(p.parts))]


def sobras(pasta: Path) -> list[Path]:
    """Temporários e itens de lixeira que não deveriam ter ficado."""
    if not pasta.exists():
        return []
    return [p for p in pasta.rglob("*") if p.is_file() and {".tmp", ".trash"} & set(p.parts)]


def contar(banco, tabela: str) -> int:
    with banco.connect() as conn:
        return conn.execute(text(f"SELECT count(*) FROM {tabela}")).scalar_one()


# ------------------------------------------------------------------ upload e extração


def test_upload_valido_cria_documento_concluido(cliente, pasta, banco):
    dados = gerar_pdf([["Introdução"], ["Conclusão"]])
    r = enviar(cliente, dados, nome="Relações Exteriores.pdf")
    assert r.status_code == 201, r.text
    corpo = r.json()
    assert corpo["status"] == "completed" and corpo["duplicate"] is False
    assert corpo["page_count"] == 2 and corpo["text_extractable"] is True
    assert corpo["sha256"] == hashlib.sha256(dados).hexdigest()
    assert corpo["size_bytes"] == len(dados)
    assert corpo["original_filename"] == "Relações Exteriores.pdf"
    assert corpo["error"] is None and corpo["processed_at"] is not None
    assert "storage_key" not in corpo

    doc_id = uuid.UUID(corpo["id"])
    assert pdfs_guardados(pasta) == [pasta.resolve() / doc_id.hex[:2] / f"{doc_id.hex}.pdf"]
    assert pdfs_guardados(pasta)[0].read_bytes() == dados
    assert sobras(pasta) == []
    assert cliente.get(f"/documents/{doc_id}").json() == {
        k: v for k, v in corpo.items() if k != "duplicate"
    }
    assert contar(banco, "document_pages") == 2


def test_texto_por_pagina_com_numeros_e_acentos(cliente):
    dados = gerar_pdf(
        [
            ["Página 1: ação, coração, pingüim, à"],
            ["Página 2: ñandú, ¿qué?, ¡olé!, café"],
            ["Page 3: naïve façade — “quotes”"],
        ]
    )
    doc = enviar(cliente, dados).json()
    paginas = cliente.get(f"/documents/{doc['id']}/pages").json()
    assert paginas["total"] == 3
    assert [p["page_number"] for p in paginas["items"]] == [1, 2, 3]
    assert [p["text"] for p in paginas["items"]] == [
        "Página 1: ação, coração, pingüim, à",
        "Página 2: ñandú, ¿qué?, ¡olé!, café",
        "Page 3: naïve façade — “quotes”",
    ]
    primeira = paginas["items"][0]
    assert primeira["extraction_status"] == "ok" and primeira["has_text"] is True
    assert primeira["text_sha256"] == hashlib.sha256(primeira["text"].encode()).hexdigest()
    assert primeira["extractor"].startswith("pypdf ")
    assert primeira["normalization_version"] == "1"
    assert primeira["text_raw"] is None  # só com include_raw=true
    bruto = cliente.get(f"/documents/{doc['id']}/pages?include_raw=true&limit=1&offset=1").json()
    assert bruto["items"][0]["page_number"] == 2
    assert bruto["items"][0]["text_raw"] == "Página 2: ñandú, ¿qué?, ¡olé!, café"


def test_pdf_sem_texto_extraivel_e_sinalizado(cliente):
    corpo = enviar(cliente, gerar_pdf([None, None])).json()
    assert corpo["status"] == "completed"
    assert corpo["text_extractable"] is False
    assert any(a.startswith("no_extractable_text") for a in corpo["warnings"])
    assert corpo["language"] is None
    paginas = cliente.get(f"/documents/{corpo['id']}/pages").json()["items"]
    assert [(p["extraction_status"], p["has_text"], p["text"]) for p in paginas] == [
        ("empty", False, ""),
        ("empty", False, ""),
    ]


def test_pagina_sem_texto_no_meio_e_listada_nos_avisos(cliente):
    corpo = enviar(cliente, gerar_pdf([["um"], None, ["três"]])).json()
    assert corpo["text_extractable"] is True
    assert corpo["warnings"] == ["pages_without_text: 2"]


# ------------------------------------------------------------------ metadados


def test_metadados_do_usuario_e_do_pdf_sao_persistidos(cliente, aplicacao):
    dados = gerar_pdf(
        [TEXTO_PT],
        info={"Title": "Título embutido", "Author": "Silva, Ana; Souza, Bruno"},
        xmp=xmp_basico(periodico="Revista Brasileira de Política Internacional"),
    )
    corpo = enviar(
        cliente,
        dados,
        title="Título informado pelo usuário",
        publication_year="2023",
        institution="Universidade de Brasília",
        source_url="https://exemplo.org/artigo",
        doi="https://doi.org/10.1590/0034-7329202300101",
    ).json()
    assert corpo["title"] == "Título informado pelo usuário"
    assert corpo["authors"] == ["Silva, Ana", "Souza, Bruno"]
    assert corpo["publication_year"] == 2023
    assert corpo["journal"] == "Revista Brasileira de Política Internacional"
    assert corpo["institution"] == "Universidade de Brasília"
    assert corpo["source_url"] == "https://exemplo.org/artigo"
    assert corpo["doi"] == "10.1590/0034-7329202300101"
    assert corpo["language"] == "pt"
    assert corpo["publisher"] is None
    assert corpo["metadata_sources"] == {
        "title": "user",
        "publication_year": "user",
        "institution": "user",
        "source_url": "user",
        "doi": "user",
        "authors": "pdf_info",
        "journal": "xmp",
        "language": "heuristic",
    }
    assert corpo["pdf_metadata"]["/Title"] == "Título embutido"

    # Persistido de fato: uma aplicação nova (sem nada em memória) lê o mesmo.
    with TestClient(create_app(aplicacao.state.settings)) as outro:
        assert outro.get(f"/documents/{corpo['id']}").json()["title"] == corpo["title"]


def test_metadados_desconhecidos_ficam_nulos(cliente):
    corpo = enviar(cliente, gerar_pdf([["Texto curto."]])).json()
    for campo in (
        "title",
        "authors",
        "publication_year",
        "journal",
        "publisher",
        "institution",
        "doi",
        "source_url",
        "language",
        "pdf_metadata",
    ):
        assert corpo[campo] is None, campo
    assert corpo["metadata_sources"] == {}


def test_autores_informados_separados_por_ponto_e_virgula(cliente):
    corpo = enviar(cliente, gerar_pdf([["x"]]), authors="Ana Silva; José Pérez ;").json()
    assert corpo["authors"] == ["Ana Silva", "José Pérez"]
    assert corpo["metadata_sources"]["authors"] == "user"


# ------------------------------------------------------------------ duplicatas


def test_mesmo_arquivo_devolve_o_documento_existente(cliente, pasta, banco):
    dados = gerar_pdf([["igual"]])
    primeiro = enviar(cliente, dados, nome="a.pdf")
    segundo = enviar(cliente, dados, nome="outro-nome.pdf", title="ignorado")
    assert primeiro.status_code == 201 and segundo.status_code == 200
    assert segundo.json()["duplicate"] is True
    assert segundo.json()["id"] == primeiro.json()["id"]
    assert segundo.json()["status"] == "completed"
    assert segundo.json()["original_filename"] == "a.pdf"  # nada do segundo envio foi gravado
    assert contar(banco, "documents") == 1
    assert len(pdfs_guardados(pasta)) == 1 and sobras(pasta) == []


def test_duplicata_detectada_pela_restricao_unica_quando_a_consulta_perde_a_corrida(
    cliente, pasta, banco, monkeypatch
):
    dados = gerar_pdf([["corrida"]])
    original = enviar(cliente, dados).json()

    real = service.buscar_por_sha
    chamadas = []

    def consulta_atrasada(sessao, sha):
        chamadas.append(sha)
        return None if len(chamadas) == 1 else real(sessao, sha)  # 1ª: "ainda não existe"

    monkeypatch.setattr(service, "buscar_por_sha", consulta_atrasada)
    r = enviar(cliente, dados)
    assert r.status_code == 200 and r.json()["duplicate"] is True
    assert r.json()["id"] == original["id"]
    assert len(chamadas) == 2  # a 2ª veio depois do IntegrityError
    assert contar(banco, "documents") == 1
    assert len(pdfs_guardados(pasta)) == 1 and sobras(pasta) == []


def test_uploads_simultaneos_do_mesmo_arquivo_geram_um_documento(aplicacao, pasta, banco):
    dados = gerar_pdf([["simultâneo"]])
    fabrica = aplicacao.state.session_factory
    armazenamento = aplicacao.state.armazenamento
    barreira = threading.Barrier(4)
    resultados, falhas = [], []

    def enviar_direto():
        import io

        with fabrica() as sessao:
            try:
                barreira.wait()
                doc, dup = service.receber_upload(
                    sessao,
                    armazenamento,
                    aplicacao.state.settings,
                    io.BytesIO(dados),
                    "a.pdf",
                    "application/pdf",
                    MetadadosInformados(),
                )
                resultados.append((doc.id, dup))
            except Exception as erro:  # pragma: no cover - só se algo der errado
                falhas.append(erro)

    tarefas = [threading.Thread(target=enviar_direto) for _ in range(4)]
    for t in tarefas:
        t.start()
    for t in tarefas:
        t.join(timeout=30)
    assert falhas == []
    assert len({i for i, _ in resultados}) == 1
    assert sorted(dup for _, dup in resultados) == [False, True, True, True]
    assert contar(banco, "documents") == 1
    assert len(pdfs_guardados(pasta)) == 1 and sobras(pasta) == []


def test_restricao_unica_existe_no_banco(banco):
    sha = "a" * 64
    sql = text(
        "INSERT INTO documents (id, sha256, original_filename, size_bytes, mime_type, "
        "storage_key, status, metadata_sources, warnings) VALUES (:id, :sha, 'a.pdf', 1, "
        "'application/pdf', 'k', 'pending', '{}', '[]')"
    )
    with banco.begin() as conn:
        conn.execute(sql, {"id": uuid.uuid4(), "sha": sha})
    with pytest.raises(IntegrityError), banco.begin() as conn:
        conn.execute(sql, {"id": uuid.uuid4(), "sha": sha})


def test_banco_recusa_estado_concluido_incoerente(banco):
    with pytest.raises(IntegrityError), banco.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO documents (id, sha256, original_filename, size_bytes, mime_type, "
                "storage_key, status, metadata_sources, warnings) VALUES (:id, :sha, 'a.pdf', 1, "
                "'application/pdf', 'k', 'completed', '{}', '[]')"
            ),
            {"id": uuid.uuid4(), "sha": "b" * 64},
        )


# ------------------------------------------------------------------ listagem e 404


def test_listagem_paginada_e_filtrada(cliente):
    ids = [enviar(cliente, gerar_pdf([[f"documento {i}"]])).json()["id"] for i in range(3)]
    pagina1 = cliente.get("/documents?limit=2").json()
    pagina2 = cliente.get("/documents?limit=2&offset=2").json()
    assert (pagina1["total"], pagina1["limit"], pagina1["offset"]) == (3, 2, 0)
    assert len(pagina1["items"]) == 2 and len(pagina2["items"]) == 1
    vistos = [d["id"] for d in pagina1["items"] + pagina2["items"]]
    assert sorted(vistos) == sorted(ids)
    assert vistos[0] == ids[-1]  # mais recente primeiro
    assert "storage_key" not in pagina1["items"][0]
    assert cliente.get("/documents?status=completed").json()["total"] == 3
    assert cliente.get("/documents?status=failed").json()["total"] == 0
    assert cliente.get("/documents?offset=10").json()["items"] == []
    assert cliente.get("/documents?status=inventado").status_code == 422


def test_documento_inexistente_da_404(cliente):
    inexistente = uuid.uuid4()
    for r in (
        cliente.get(f"/documents/{inexistente}"),
        cliente.get(f"/documents/{inexistente}/pages"),
        cliente.delete(f"/documents/{inexistente}"),
    ):
        assert r.status_code == 404 and r.json() == {
            "detail": "Documento não encontrado.",
            "code": "not_found",
        }


# ------------------------------------------------------------------ remoção


def test_remocao_apaga_registro_paginas_e_arquivo(cliente, pasta, banco):
    manter = enviar(cliente, gerar_pdf([["fica"]])).json()
    doc = enviar(cliente, gerar_pdf([["sai"], ["sai também"]])).json()
    assert len(pdfs_guardados(pasta)) == 2

    r = cliente.delete(f"/documents/{doc['id']}")
    assert r.status_code == 204 and r.content == b""
    assert cliente.get(f"/documents/{doc['id']}").status_code == 404
    assert cliente.delete(f"/documents/{doc['id']}").status_code == 404
    assert contar(banco, "documents") == 1
    assert contar(banco, "document_pages") == 1  # só a página do que ficou
    restantes = pdfs_guardados(pasta)
    assert [p.stem for p in restantes] == [uuid.UUID(manter["id"]).hex]
    assert sobras(pasta) == []


def test_remocao_que_falha_no_banco_devolve_o_arquivo(cliente, pasta, monkeypatch):
    doc = enviar(cliente, gerar_pdf([["x"]])).json()
    original = Session.commit

    def commit_quebrado(self):
        raise RuntimeError("falha simulada no commit")

    monkeypatch.setattr(Session, "commit", commit_quebrado)
    r = cliente.delete(f"/documents/{doc['id']}")
    monkeypatch.setattr(Session, "commit", original)

    assert r.status_code == 500 and r.json() == {
        "detail": "Erro interno.",
        "code": "internal_error",
    }
    assert cliente.get(f"/documents/{doc['id']}").status_code == 200
    assert len(pdfs_guardados(pasta)) == 1 and sobras(pasta) == []


def test_remocao_que_falha_no_disco_nao_apaga_o_registro(cliente, pasta, monkeypatch):
    doc = enviar(cliente, gerar_pdf([["x"]])).json()

    def disco_quebrado(self, chave):
        raise StorageError("não foi possível remover o arquivo")

    monkeypatch.setattr(Armazenamento, "mover_para_lixeira", disco_quebrado)
    r = cliente.delete(f"/documents/{doc['id']}")
    assert r.status_code == 503 and r.json()["code"] == "storage_unavailable"
    assert cliente.get(f"/documents/{doc['id']}").status_code == 200


def test_documento_em_processamento_nao_pode_ser_removido(cliente, banco):
    doc = enviar(cliente, gerar_pdf([["x"]])).json()
    with banco.begin() as conn:
        conn.execute(
            text("UPDATE documents SET status = 'processing' WHERE id = :id"), {"id": doc["id"]}
        )
    r = cliente.delete(f"/documents/{doc['id']}")
    assert r.status_code == 409 and r.json()["code"] == "document_processing"
    assert cliente.get(f"/documents/{doc['id']}").status_code == 200


# ------------------------------------------------------------------ falhas de processamento


def test_erro_inesperado_no_processamento_vira_failed_sem_vazar(cliente, pasta, banco, monkeypatch):
    def quebra(_leitor):
        raise RuntimeError(f"erro interno em {pasta}/segredo")

    monkeypatch.setattr(processing, "extrair_paginas", quebra)
    r = enviar(cliente, gerar_pdf([["x"]]))
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["status"] == "failed"
    assert corpo["error"] == {
        "code": "processing_error",
        "message": "Erro inesperado durante o processamento.",
    }
    assert str(pasta) not in r.text and "segredo" not in r.text
    assert contar(banco, "document_pages") == 0
    assert cliente.get(f"/documents/{corpo['id']}/pages").json()["total"] == 0
    # O documento falho continua consistente: pode ser removido normalmente.
    assert cliente.delete(f"/documents/{corpo['id']}").status_code == 204
    assert pdfs_guardados(pasta) == []


def test_falha_em_todas_as_paginas_vira_extraction_failed(cliente, banco, monkeypatch):
    from pypdf import PageObject

    def quebra(self, *a, **k):
        raise ValueError("página ruim")

    monkeypatch.setattr(PageObject, "extract_text", quebra)
    corpo = enviar(cliente, gerar_pdf([["a"], ["b"]])).json()
    assert corpo["status"] == "failed"
    assert corpo["error"]["code"] == "extraction_failed"
    assert corpo["page_count"] == 2
    assert contar(banco, "document_pages") == 0


def test_pdf_que_nao_abre_no_processamento_vira_pdf_unreadable(cliente, monkeypatch):
    def nao_abre(_arquivo):
        raise PdfIlegivel("x")

    monkeypatch.setattr(processing, "abrir", nao_abre)
    corpo = enviar(cliente, gerar_pdf([["a"]])).json()
    assert (corpo["status"], corpo["error"]["code"]) == ("failed", "pdf_unreadable")


def test_erro_do_banco_na_transacao_final_nunca_deixa_concluido(cliente, banco, monkeypatch):
    # Valor longo demais para a coluna `extractor`: o PostgreSQL recusa no commit final.
    monkeypatch.setattr(processing, "EXTRATOR", "x" * 500)
    corpo = enviar(cliente, gerar_pdf([["a"], ["b"]])).json()
    assert corpo["status"] == "failed" and corpo["error"]["code"] == "processing_error"
    assert corpo["text_extractable"] is None  # nada da transação desfeita ficou gravado
    assert contar(banco, "document_pages") == 0


def test_arquivo_ausente_no_processamento_vira_file_missing(aplicacao, banco):
    fabrica = aplicacao.state.session_factory
    doc_id = uuid.uuid4()
    with fabrica() as sessao:
        sessao.add(
            Document(
                id=doc_id,
                sha256="c" * 64,
                original_filename="a.pdf",
                size_bytes=10,
                storage_key=Armazenamento.chave_para(doc_id),
                status=DocumentStatus.PENDING.value,
                metadata_sources={},
                warnings=[],
            )
        )
        sessao.commit()
        doc = processing.processar_documento(sessao, aplicacao.state.armazenamento, doc_id)
    assert doc.status == "failed" and doc.error_code == "file_missing"


# ------------------------------------------------------------------ integridade e segurança


def test_falha_ao_gravar_o_arquivo_nao_deixa_registro(cliente, pasta, banco, monkeypatch):
    def disco_cheio(self, temporario, chave):
        raise StorageError("não foi possível gravar o arquivo")

    monkeypatch.setattr(Armazenamento, "instalar", disco_cheio)
    r = enviar(cliente, gerar_pdf([["x"]]))
    assert r.status_code == 503 and r.json()["code"] == "storage_unavailable"
    assert contar(banco, "documents") == 0
    assert pdfs_guardados(pasta) == [] and sobras(pasta) == []


def test_falha_no_commit_do_upload_nao_deixa_registro_nem_arquivo(
    cliente, pasta, banco, monkeypatch
):
    def commit_quebrado(self):
        raise RuntimeError("falha simulada")

    monkeypatch.setattr(Session, "commit", commit_quebrado)
    r = enviar(cliente, gerar_pdf([["x"]]))
    monkeypatch.undo()
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    assert contar(banco, "documents") == 0
    assert pdfs_guardados(pasta) == [] and sobras(pasta) == []


@pytest.mark.parametrize(
    "nome",
    ["../../../etc/passwd.pdf", "..\\..\\boot.pdf", "/abs/olá.pdf", "a/../../b.pdf"],
)
def test_nome_malicioso_nao_vira_caminho(cliente, pasta, tmp_path, nome):
    corpo = enviar(cliente, gerar_pdf([[nome]]), nome=nome).json()
    assert corpo["status"] == "completed"
    assert "/" not in corpo["original_filename"] and "\\" not in corpo["original_filename"]
    doc_id = uuid.UUID(corpo["id"])
    assert pdfs_guardados(pasta) == [pasta.resolve() / doc_id.hex[:2] / f"{doc_id.hex}.pdf"]
    # Nada foi escrito fora do armazenamento.
    assert sorted(p.name for p in tmp_path.iterdir()) == ["armazenamento"]


def test_nenhuma_resposta_expoe_caminho_interno(cliente, pasta):
    doc = enviar(cliente, gerar_pdf([["x"]])).json()
    respostas = [
        cliente.get("/documents"),
        cliente.get(f"/documents/{doc['id']}"),
        cliente.get(f"/documents/{doc['id']}/pages?include_raw=true"),
        enviar(cliente, gerar_pdf([["x"]])),
    ]
    for r in respostas:
        assert str(pasta) not in r.text
        assert str(pasta.resolve()) not in r.text
        assert "storage_key" not in r.text
        assert uuid.UUID(doc["id"]).hex + ".pdf" not in r.text


# ------------------------------------------------------------------ esquema


def test_migracao_corresponde_aos_modelos(banco):
    with banco.connect() as conn:
        diferencas = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diferencas == []


def test_migracao_de_documentos_mantem_o_pgvector(banco):
    assert check_pgvector(banco) is True
