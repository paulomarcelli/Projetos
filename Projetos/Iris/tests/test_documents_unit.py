"""Testes das partes puras da ingestão: normalização, validação, metadados, extração e disco.

Não usam banco nem rede: os PDFs são gerados aqui mesmo (tests/pdfs.py).
"""

from __future__ import annotations

import io
import uuid

import pytest
from pdfs import gerar_pdf, xmp_basico

from database.models import Document, DocumentStatus, PageStatus
from ingestion import errors, metadata
from ingestion.extraction import PdfIlegivel, abrir, extrair_paginas
from ingestion.normalization import limpar_bruto, normalizar
from ingestion.schemas import MetadadosInformados
from ingestion.storage import Armazenamento, StorageError
from ingestion.validation import (
    contar_paginas,
    copiar_com_limite,
    sanitizar_nome,
    validar_nome_e_tipo,
)

ACENTOS = "Ação, coração, pingüim, à, ñandú, ¿qué?, ¡olé!, café, Ç"


# ------------------------------------------------------------------ normalização


def test_normalizacao_preserva_acentos_e_nao_altera_palavras():
    assert normalizar(ACENTOS) == ACENTOS


def test_normalizacao_compoe_acentos_decompostos_em_nfc():
    decomposto = "Rela" + "ç" + "o" + "̃" + "es"  # ç e õ como letra + acento
    assert normalizar(decomposto) == "Relações"


def test_normalizacao_desfaz_ligaduras_e_espacos_especiais():
    assert normalizar("eﬃciente e ﬁm") == "efficiente e fim"


def test_normalizacao_remove_invisiveis_e_controles_mas_mantem_quebras():
    texto = "a\x00b\x07c­d​e﻿\r\nlinha\t2"
    assert normalizar(texto) == "abcde\nlinha 2"


def test_normalizacao_junta_espacos_e_limita_linhas_em_branco():
    assert normalizar("  um    dois  \n\n\n\n três ") == "um dois\n\ntrês"


def test_normalizacao_nao_junta_hifenizacao_nem_usa_nfkc():
    assert normalizar("inter-\nnacional") == "inter-\nnacional"
    assert normalizar("m² e ½") == "m² e ½"


def test_texto_bruto_so_perde_o_que_o_banco_nao_aceita():
    assert limpar_bruto("a\x00b\ud800c  d") == "abc  d"


# ------------------------------------------------------------------ nome e tipo


@pytest.mark.parametrize(
    ("enviado", "esperado"),
    [
        ("../../etc/passwd.pdf", "passwd.pdf"),
        ("..\\..\\Windows\\system32\\x.pdf", "x.pdf"),
        ("/abs/caminho/artigo.pdf", "artigo.pdf"),
        ("relat\x00ório\n.pdf", "relatório.pdf"),
        ("  .oculto.pdf  ", "oculto.pdf"),
        ("Relações Internacionais.pdf", "Relações Internacionais.pdf"),
    ],
)
def test_nome_e_sanitizado_sem_pastas_nem_controles(enviado, esperado):
    assert sanitizar_nome(enviado) == esperado


def test_nome_muito_longo_e_cortado_mantendo_a_extensao():
    nome = sanitizar_nome("a" * 400 + ".pdf")
    assert len(nome) == 255 and nome.endswith(".pdf")


@pytest.mark.parametrize("nome", ["artigo.txt", "artigo", ".pdf", "artigo.pdf.exe", None, ""])
def test_extensao_diferente_de_pdf_e_recusada(nome):
    with pytest.raises(errors.ErroDocumento) as erro:
        validar_nome_e_tipo(nome, "application/pdf")
    assert erro.value.codigo == "unsupported_extension"


@pytest.mark.parametrize("tipo", ["text/plain", "application/octet-stream", "", None, "image/pdf"])
def test_tipo_declarado_diferente_de_pdf_e_recusado(tipo):
    with pytest.raises(errors.ErroDocumento) as erro:
        validar_nome_e_tipo("a.pdf", tipo)
    assert erro.value.codigo == "unsupported_media_type"


def test_tipo_declarado_aceita_parametros_e_maiusculas():
    assert validar_nome_e_tipo("A.PDF", "Application/PDF; charset=binary") == (
        "A.PDF",
        "application/pdf",
    )


# ------------------------------------------------------------------ cópia em streaming


class LeitorEmPedacos(io.RawIOBase):
    """Devolve poucos bytes por leitura, como um upload lento."""

    def __init__(self, dados: bytes, passo: int) -> None:
        self.dados, self.passo, self.pos = dados, passo, 0

    def read(self, n: int = -1) -> bytes:
        pedaco = self.dados[self.pos : self.pos + self.passo]
        self.pos += len(pedaco)
        return pedaco


def test_copia_calcula_sha256_e_tamanho(tmp_path):
    import hashlib

    dados = gerar_pdf([["oi"]])
    sha, tamanho = copiar_com_limite(LeitorEmPedacos(dados, 3), tmp_path / "x", 10_000, 1)
    assert (sha, tamanho) == (hashlib.sha256(dados).hexdigest(), len(dados))
    assert (tmp_path / "x").read_bytes() == dados


@pytest.mark.parametrize(
    ("dados", "codigo"),
    [
        (b"", "empty_file"),
        (b"%PD", "invalid_signature"),
        (b"PK\x03\x04 zip disfarcado de pdf", "invalid_signature"),
        (b"<html><script>alert(1)</script></html>", "invalid_signature"),
        (b"%PDF-" + b"x" * 200, "file_too_large"),
    ],
)
def test_copia_recusa_e_apaga_o_temporario(tmp_path, dados, codigo):
    destino = tmp_path / "x"
    with pytest.raises(errors.ErroDocumento) as erro:
        copiar_com_limite(LeitorEmPedacos(dados, 2), destino, 100, 1)
    assert erro.value.codigo == codigo
    assert not destino.exists()


def test_assinatura_e_conferida_no_primeiro_bloco_antes_do_limite(tmp_path):
    """Um arquivo grande que não é PDF é recusado logo no início, sem ser copiado inteiro."""
    lidos = []

    class Origem(io.RawIOBase):
        def read(self, n=-1):
            lidos.append(n)
            return b"X" * 64 if len(lidos) < 1000 else b""

    with pytest.raises(errors.ErroDocumento) as erro:
        copiar_com_limite(Origem(), tmp_path / "x", 100_000, 1)
    assert erro.value.codigo == "invalid_signature"
    assert len(lidos) == 1


@pytest.mark.parametrize(
    "dados",
    [b"%PDF-1.4\n" + b"lixo " * 50, gerar_pdf([["texto"]])[:300], b"%PDF-1.7\n%%EOF\n"],
)
def test_pdf_corrompido_e_recusado(tmp_path, dados):
    caminho = tmp_path / "x.pdf"
    caminho.write_bytes(dados)
    with pytest.raises(errors.ErroDocumento) as erro:
        contar_paginas(caminho, 100)
    assert erro.value.codigo == "corrupted_pdf"


def test_pdf_com_paginas_demais_e_recusado(tmp_path):
    caminho = tmp_path / "x.pdf"
    caminho.write_bytes(gerar_pdf([["a"], ["b"], ["c"]]))
    assert contar_paginas(caminho, 3) == 3
    with pytest.raises(errors.ErroDocumento) as erro:
        contar_paginas(caminho, 2)
    assert erro.value.codigo == "too_many_pages"


def test_pdf_protegido_por_senha_e_recusado(tmp_path):
    from pypdf import PdfWriter

    escritor = PdfWriter()
    escritor.add_blank_page(100, 100)
    escritor.encrypt(user_password="segredo", owner_password="dono", algorithm="RC4-128")
    caminho = tmp_path / "x.pdf"
    with caminho.open("wb") as f:
        escritor.write(f)
    with pytest.raises(errors.ErroDocumento) as erro:
        contar_paginas(caminho, 100)
    assert erro.value.codigo == "encrypted_pdf"


# ------------------------------------------------------------------ extração


def test_extracao_por_pagina_preserva_numeros_acentos_e_detecta_vazias():
    dados = gerar_pdf([["Página um: ação"], None, ["Página tres: ñandú, ¿qué?"]])
    paginas = extrair_paginas(abrir(io.BytesIO(dados)))
    assert [p.numero for p in paginas] == [1, 2, 3]
    assert [p.status for p in paginas] == [PageStatus.OK, PageStatus.EMPTY, PageStatus.OK]
    assert paginas[0].texto == "Página um: ação"
    assert paginas[2].texto == "Página tres: ñandú, ¿qué?"
    assert paginas[1].sha256 is None and len(paginas[0].sha256) == 64


def test_extracao_de_varias_linhas_mantem_a_ordem():
    paginas = extrair_paginas(abrir(io.BytesIO(gerar_pdf([["linha 1", "linha 2", "(3)"]]))))
    assert paginas[0].texto == "linha 1\nlinha 2\n(3)"


def test_falha_em_uma_pagina_nao_derruba_as_outras(monkeypatch):
    from pypdf import PageObject

    original = PageObject.extract_text

    def extrair(self, *a, **k):
        if "quebrada" in original(self, *a, **k):
            raise ValueError("/caminho/interno/secreto")
        return original(self, *a, **k)

    monkeypatch.setattr(PageObject, "extract_text", extrair)
    paginas = extrair_paginas(abrir(io.BytesIO(gerar_pdf([["ok"], ["quebrada"]]))))
    assert [p.status for p in paginas] == [PageStatus.OK, PageStatus.ERROR]
    assert paginas[1].erro == "ValueError"  # só o tipo: a mensagem pode ter detalhes internos


def test_abrir_pdf_ilegivel_levanta_erro_proprio():
    with pytest.raises(PdfIlegivel):
        abrir(io.BytesIO(b"%PDF-1.4 nada aqui"))


# ------------------------------------------------------------------ metadados


@pytest.mark.parametrize(
    ("titulo", "esperado"),
    [
        ("Microsoft Word - artigo final.docx", None),
        ("relatorio_v3.pdf", None),
        ("Untitled", None),
        ("1234", None),
        ("  ", None),
        ("A política externa brasileira", "A política externa brasileira"),
    ],
)
def test_titulos_gerados_por_programas_sao_ignorados(titulo, esperado):
    assert metadata.titulo_util(titulo) == esperado


@pytest.mark.parametrize(
    ("valor", "esperado"),
    [
        ("10.1234/abc.5", "10.1234/abc.5"),
        ("doi:10.1234/ABC", "10.1234/ABC"),
        ("https://doi.org/10.5555/x-y.", "10.5555/x-y"),
        ("11.1234/abc", None),
        ("10.12/abc", None),
        ("não é doi", None),
    ],
)
def test_doi_so_com_formato_valido(valor, esperado):
    assert metadata.normalizar_doi(valor) == esperado


def test_metadados_embutidos_xmp_info_e_catalogo():
    dados = gerar_pdf(
        [["x"]],
        info={"Title": "Microsoft Word - a.docx", "Author": "Silva, Ana; Pérez, José"},
        xmp=xmp_basico(
            periodico="Revista Brasileira de Política Internacional",
            data_publicacao="2021-05-01",
            doi="10.1590/0034-7329",
        ),
        idioma_catalogo="pt-BR",
    )
    achados, info = metadata.ler_embutidos(abrir(io.BytesIO(dados)))
    assert "title" not in achados  # o único título é lixo
    assert achados["authors"] == (["Silva, Ana", "Pérez, José"], "pdf_info")  # só separa por ";"
    assert achados["journal"] == ("Revista Brasileira de Política Internacional", "xmp")
    assert achados["publication_year"] == (2021, "xmp")
    assert achados["doi"] == ("10.1590/0034-7329", "xmp")
    assert achados["language"] == ("pt-BR", "pdf_catalog")
    assert info["/Title"] == "Microsoft Word - a.docx"  # o bruto fica guardado para auditoria


def test_data_de_criacao_do_arquivo_nao_vira_ano_de_publicacao():
    dados = gerar_pdf([["x"]], info={"CreationDate": "D:20190101000000Z", "Title": "Um título"})
    achados, _ = metadata.ler_embutidos(abrir(io.BytesIO(dados)))
    assert "publication_year" not in achados
    assert achados["title"] == ("Um título", "pdf_info")


def test_pdf_sem_metadados_nao_inventa_nada():
    achados, info = metadata.ler_embutidos(abrir(io.BytesIO(gerar_pdf([["x"]]))))
    assert achados == {} and info == {}


PT = (
    "A política externa do Brasil passou por mudanças importantes nas últimas décadas. O país "
    "buscou ampliar sua presença nos fóruns multilaterais e também fortalecer as relações com os "
    "vizinhos da região. Para muitos analistas, essa estratégia foi marcada pela ideia de "
    "autonomia, e isso se refletiu na atuação do Itamaraty em temas como comércio, meio ambiente "
    "e segurança, que são centrais para a inserção internacional do Estado."
)
ES = (
    "La política exterior de México ha cambiado de manera notable en las últimas décadas. El país "
    "buscó ampliar su presencia en los foros multilaterales y también fortalecer las relaciones "
    "con los vecinos de la región. Para muchos analistas, esta estrategia fue marcada por la idea "
    "de autonomía, y esto se reflejó en la actuación de la cancillería en temas como el comercio, "
    "el medio ambiente y la seguridad, que son centrales para la inserción del Estado."
)
EN = (
    "The foreign policy of Brazil has changed in important ways over the last decades. The "
    "country sought to expand its presence in multilateral forums and to strengthen its relations "
    "with the neighbours of the region. For many analysts, this strategy was marked by the idea of "
    "autonomy, and that was reflected in the role of the ministry on issues such as trade, the "
    "environment and security, which are central to the international position of the state."
)


@pytest.mark.parametrize(("texto", "idioma"), [(PT, "pt"), (ES, "es"), (EN, "en")])
def test_idioma_detectado_com_evidencia_forte(texto, idioma):
    assert metadata.detectar_idioma(texto) == idioma


@pytest.mark.parametrize(
    "texto",
    ["", "Brasil México 2021", "Relações Internacionais " * 30, PT[:150] + " " + EN[:200]],
)
def test_idioma_fica_nulo_quando_incerto(texto):
    assert metadata.detectar_idioma(texto) is None


def test_combinar_respeita_o_usuario_e_registra_a_fonte():
    valores, fontes = metadata.combinar(
        {"title": "Do usuário", "language": None},
        {"title": "user"},
        {"title": ("Do PDF", "xmp"), "doi": ("10.1234/x", "pdf_info")},
        "pt",
    )
    assert valores["title"] == "Do usuário" and fontes["title"] == "user"
    assert valores["doi"] == "10.1234/x" and fontes["doi"] == "pdf_info"
    assert valores["language"] == "pt" and fontes["language"] == "heuristic"
    assert "journal" not in fontes


def test_metadados_informados_validam_formatos():
    ok = MetadadosInformados(
        doi="https://doi.org/10.1234/X", language="PT-br", source_url="https://ex.org/a"
    )
    assert (ok.doi, ok.language) == ("10.1234/X", "pt-br")
    for campo, valor in [
        ("doi", "abc"),
        ("language", "português"),
        ("source_url", "javascript:alert(1)"),
        ("source_url", "file:///etc/passwd"),
        ("publication_year", 3000),
        ("nao_existe", "x"),
    ]:
        with pytest.raises(ValueError):
            MetadadosInformados(**{campo: valor})


# ------------------------------------------------------------------ estados


def test_transicoes_de_estado_coerentes():
    d = Document(status=DocumentStatus.PENDING.value)
    d.mudar_status(DocumentStatus.PROCESSING)
    d.mudar_status(DocumentStatus.COMPLETED)
    with pytest.raises(ValueError):
        d.mudar_status(DocumentStatus.PROCESSING)  # concluído não volta
    with pytest.raises(ValueError):
        Document(status="pending").mudar_status(DocumentStatus.COMPLETED)  # não pula etapa


# ------------------------------------------------------------------ disco


def test_chave_de_armazenamento_vem_do_uuid(tmp_path):
    a = Armazenamento(tmp_path)
    i = uuid.UUID("12345678123456781234567812345678")
    assert a.chave_para(i) == "12/12345678123456781234567812345678.pdf"
    assert a.caminho(a.chave_para(i)).is_relative_to(tmp_path.resolve())


@pytest.mark.parametrize(
    "chave",
    [
        "../../etc/passwd",
        "12/../../x.pdf",
        "/etc/passwd",
        "12/12345678123456781234567812345678.pdf/../../x",
        "ab/arquivo.pdf",
    ],
)
def test_chaves_fora_do_formato_sao_recusadas(tmp_path, chave):
    with pytest.raises(StorageError):
        Armazenamento(tmp_path).caminho(chave)


def test_lixeira_e_restauracao(tmp_path):
    a = Armazenamento(tmp_path)
    chave = a.chave_para(uuid.uuid4())
    temp = a.novo_temporario()
    temp.write_bytes(b"%PDF-x")
    a.instalar(temp, chave)
    assert a.existe(chave) and not temp.exists()
    na_lixeira = a.mover_para_lixeira(chave)
    assert not a.existe(chave) and na_lixeira.exists()
    a.restaurar(na_lixeira, chave)
    assert a.existe(chave)
    assert a.mover_para_lixeira(a.chave_para(uuid.uuid4())) is None  # inexistente: nada a fazer


def test_mensagem_de_erro_de_disco_nao_revela_caminho(tmp_path):
    bloqueado = tmp_path / "arquivo"
    bloqueado.write_text("não é pasta")
    with pytest.raises(StorageError) as erro:
        Armazenamento(bloqueado / "sub").preparar()
    assert str(tmp_path) not in str(erro.value)
