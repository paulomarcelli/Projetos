"""Gera PDFs pequenos e válidos para os testes, sem bibliotecas extras nem downloads.

Usa a fonte padrão Helvetica com WinAnsiEncoding (cp1252), que cobre os acentos de português,
espanhol e inglês. Cada página é uma lista de linhas; `None` gera uma página sem texto (como
uma página escaneada).
"""

from __future__ import annotations


def _literal(texto: str) -> bytes:
    """String literal de PDF em cp1252, com escapes para (, ), \\ e bytes não ASCII."""
    saida = bytearray(b"(")
    for byte in texto.encode("cp1252"):
        if byte in b"()\\":
            saida += b"\\" + bytes([byte])
        elif byte < 32 or byte > 126:
            saida += f"\\{byte:03o}".encode()
        else:
            saida.append(byte)
    return bytes(saida + b")")


def _texto_info(texto: str) -> bytes:
    """String de texto do dicionário Info em UTF-16BE (aceita qualquer caractere)."""
    return b"<FEFF" + texto.encode("utf-16-be").hex().upper().encode() + b">"


def _conteudo(linhas: list[str]) -> bytes:
    partes = [b"BT /F1 12 Tf 14 TL 72 760 Td"]
    for i, linha in enumerate(linhas):
        partes.append((b"" if i == 0 else b"T* ") + _literal(linha) + b" Tj")
    partes.append(b"ET")
    return b"\n".join(partes)


def gerar_pdf(
    paginas: list[list[str] | None],
    *,
    info: dict[str, str] | None = None,
    xmp: str | None = None,
    idioma_catalogo: str | None = None,
) -> bytes:
    objetos: list[bytes] = []

    def novo(corpo: bytes) -> int:
        objetos.append(corpo)
        return len(objetos)

    catalogo = novo(b"")  # preenchido no fim
    raiz_paginas = novo(b"")
    fonte = novo(
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    )
    filhos = []
    for linhas in paginas:
        recursos = f"<< /Font << /F1 {fonte} 0 R >> >>".encode()
        if linhas is None:
            conteudo = novo(b"<< /Length 0 >>\nstream\n\nendstream")
        else:
            dados = _conteudo(linhas)
            conteudo = novo(b"<< /Length %d >>\nstream\n" % len(dados) + dados + b"\nendstream")
        filhos.append(
            novo(
                b"<< /Type /Page /Parent %d 0 R /MediaBox [0 0 612 792] /Resources %s "
                b"/Contents %d 0 R >>" % (raiz_paginas, recursos, conteudo)
            )
        )
    objetos[raiz_paginas - 1] = b"<< /Type /Pages /Kids [%s] /Count %d >>" % (
        b" ".join(b"%d 0 R" % f for f in filhos),
        len(filhos),
    )
    extras = b""
    if xmp is not None:
        dados = xmp.encode("utf-8")
        meta = novo(
            b"<< /Type /Metadata /Subtype /XML /Length %d >>\nstream\n" % len(dados)
            + dados
            + b"\nendstream"
        )
        extras += b" /Metadata %d 0 R" % meta
    if idioma_catalogo is not None:
        extras += b" /Lang " + _literal(idioma_catalogo)
    objetos[catalogo - 1] = b"<< /Type /Catalog /Pages %d 0 R%s >>" % (raiz_paginas, extras)

    referencia_info = None
    if info:
        corpo = b" ".join(b"/" + k.encode() + b" " + _texto_info(v) for k, v in info.items())
        referencia_info = novo(b"<< " + corpo + b" >>")

    saida = bytearray(b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n")
    posicoes = []
    for numero, corpo in enumerate(objetos, start=1):
        posicoes.append(len(saida))
        saida += b"%d 0 obj\n" % numero + corpo + b"\nendobj\n"
    inicio_xref = len(saida)
    saida += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objetos) + 1)
    for posicao in posicoes:
        saida += b"%010d 00000 n \n" % posicao
    trailer = b"<< /Size %d /Root %d 0 R" % (len(objetos) + 1, catalogo)
    if referencia_info:
        trailer += b" /Info %d 0 R" % referencia_info
    saida += b"trailer\n" + trailer + b" >>\nstartxref\n%d\n%%%%EOF\n" % inicio_xref
    return bytes(saida)


def xmp_basico(
    *,
    titulo: str | None = None,
    autores: list[str] | None = None,
    idioma: str | None = None,
    editora: str | None = None,
    doi: str | None = None,
    periodico: str | None = None,
    data_publicacao: str | None = None,
) -> str:
    partes = []
    if titulo:
        partes.append(
            f'<dc:title><rdf:Alt><rdf:li xml:lang="x-default">{titulo}</rdf:li></rdf:Alt>'
            "</dc:title>"
        )
    if autores:
        itens = "".join(f"<rdf:li>{a}</rdf:li>" for a in autores)
        partes.append(f"<dc:creator><rdf:Seq>{itens}</rdf:Seq></dc:creator>")
    if idioma:
        partes.append(f"<dc:language><rdf:Bag><rdf:li>{idioma}</rdf:li></rdf:Bag></dc:language>")
    if editora:
        partes.append(f"<dc:publisher><rdf:Bag><rdf:li>{editora}</rdf:li></rdf:Bag></dc:publisher>")
    if doi:
        partes.append(f"<prism:doi>{doi}</prism:doi>")
    if periodico:
        partes.append(f"<prism:publicationName>{periodico}</prism:publicationName>")
    if data_publicacao:
        partes.append(f"<prism:publicationDate>{data_publicacao}</prism:publicationDate>")
    return (
        '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>'
        '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
        '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:prism="http://prismstandard.org/namespaces/basic/2.0/">'
        + "".join(partes)
        + "</rdf:Description></rdf:RDF></x:xmpmeta>"
        '<?xpacket end="w"?>'
    )
