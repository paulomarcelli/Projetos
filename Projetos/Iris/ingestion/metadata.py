"""Metadados bibliográficos: de onde vêm e quando NÃO preencher.

Prioridade de cada campo: o que o usuário informou no upload > metadados embutidos no PDF (XMP,
dicionário Info, catálogo) > heurística segura (só idioma). Se nenhuma fonte for confiável, o campo
fica NULL. Nada é inventado e nada depende de internet.

Escolhas conservadoras:
- Ano: só do usuário ou de uma data de PUBLICAÇÃO no XMP (prism). A data de criação do arquivo
  (`/CreationDate`) NÃO é o ano de publicação e não é usada.
- Título: títulos "lixo" gerados por programas (ex.: "Microsoft Word - artigo.docx") são ignorados.
- Autores do campo `/Author`: só são separados por ";" (vírgula pode ser "Sobrenome, Nome").
- DOI: só quando o PDF declara um DOI em campo próprio e ele tem formato válido. Um DOI achado no
  meio do texto pode ser de um artigo citado, então não é usado.
- Instituição e URL de origem: só do usuário (não há campo padrão no PDF).
- Idioma: usuário > XMP/catálogo > contagem de palavras funcionais (pt, en, es) com limiares
  rígidos; texto curto ou misturado fica NULL.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Iterable
from typing import Any

from pypdf import PdfReader

from ingestion.normalization import limpar_bruto

logger = logging.getLogger(__name__)

CAMPOS = (
    "title",
    "authors",
    "publication_year",
    "journal",
    "publisher",
    "institution",
    "doi",
    "source_url",
    "language",
)

MAX_VALOR_PDF = 1000  # caracteres por valor guardado de `pdf_metadata`
MAX_CHAVES_PDF = 50

_DOI = re.compile(r"10\.\d{4,9}/[^\s\"<>]+")
_PREFIXOS_DOI = re.compile(r"^(?:doi:\s*|https?://(?:dx\.)?doi\.org/)", re.IGNORECASE)
_IDIOMA = re.compile(r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$")
_TITULO_LIXO = (
    re.compile(r"^microsoft\s+\w+\s*-\s", re.IGNORECASE),
    re.compile(r"\.(?:docx?|pdf|tex|dvi|ps|rtf|odt|indd|qxd|pages)$", re.IGNORECASE),
    re.compile(r"^[\W\d_]+$"),
)
_TITULOS_GENERICOS = {
    "untitled",
    "sem título",
    "sem titulo",
    "title",
    "título",
    "document",
    "documento",
    "unknown",
    "desconhecido",
}
_AUTORES_GENERICOS = {
    "admin",
    "administrator",
    "administrador",
    "user",
    "usuário",
    "usuario",
    "owner",
    "author",
    "autor",
    "unknown",
    "desconhecido",
}

PRISM = (
    "http://prismstandard.org/namespaces/basic/2.0/",
    "http://prismstandard.org/namespaces/basic/3.0/",
    "http://prismstandard.org/namespaces/basic/1.2/",
)


# ---------------------------------------------------------------- normalização de campos


def _texto(valor: Any, limite: int = MAX_VALOR_PDF) -> str | None:
    if valor is None:
        return None
    try:
        texto = limpar_bruto(str(valor))
    except Exception:
        return None
    texto = " ".join(texto.split())
    return texto[:limite] or None


def normalizar_doi(valor: str | None) -> str | None:
    if not valor:
        return None
    candidato = _PREFIXOS_DOI.sub("", valor.strip()).rstrip(".,;")
    return candidato if _DOI.fullmatch(candidato) and len(candidato) <= 255 else None


def normalizar_idioma(valor: str | None) -> str | None:
    if not valor:
        return None
    valor = valor.strip().replace("_", "-")
    if not _IDIOMA.fullmatch(valor) or valor.lower() in {"und", "x-unknown", "zxx", "mul"}:
        return None
    primario, *resto = valor.split("-")
    return "-".join([primario.lower(), *resto])


def titulo_util(valor: str | None) -> str | None:
    titulo = _texto(valor)
    if not titulo or len(titulo) < 3 or titulo.lower() in _TITULOS_GENERICOS:
        return None
    if any(p.search(titulo) for p in _TITULO_LIXO):
        return None
    return titulo


def _autores(nomes: Iterable[Any]) -> list[str] | None:
    vistos: list[str] = []
    for nome in nomes:
        limpo = _texto(nome, 300)
        if limpo and limpo.lower() not in _AUTORES_GENERICOS and limpo not in vistos:
            vistos.append(limpo)
    return vistos or None


def _ano(valor: Any) -> int | None:
    achado = re.match(r"^\s*(\d{4})", str(valor)) if valor is not None else None
    if not achado:
        return None
    ano = int(achado.group(1))
    return ano if 1000 <= ano <= 2100 else None


# ---------------------------------------------------------------- leitura do PDF


def _info(leitor: PdfReader) -> dict[str, str]:
    """Dicionário Info do PDF, só com valores de texto e tamanho limitado."""
    try:
        bruto = leitor.metadata
    except Exception:
        return {}
    if not bruto:
        return {}
    saida: dict[str, str] = {}
    for chave in list(bruto.keys())[:MAX_CHAVES_PDF]:
        try:
            valor = bruto[chave]
        except Exception:
            continue
        if isinstance(valor, bytes):
            continue
        texto = _texto(valor)
        nome = _texto(chave, 100)
        if texto and nome:
            saida[nome] = texto
    return saida


def _prism(xmp: Any, nome: str) -> str | None:
    """Lê um campo PRISM (ex.: doi, publicationName) como elemento ou como atributo."""
    raiz = getattr(xmp, "rdf_root", None)
    if raiz is None:
        return None
    for ns in PRISM:
        for elemento in raiz.getElementsByTagNameNS(ns, nome):
            texto = "".join(
                n.data for n in elemento.childNodes if n.nodeType == n.TEXT_NODE
            ).strip()
            if texto:
                return texto
        for descricao in raiz.getElementsByTagNameNS(
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#", "Description"
        ):
            valor = descricao.getAttributeNS(ns, nome)
            if valor:
                return valor
    return None


def _primeiro(valores: Any) -> Any:
    if isinstance(valores, dict):
        return valores.get("x-default") or next(iter(valores.values()), None)
    if isinstance(valores, list | tuple):
        return valores[0] if valores else None
    return valores


def ler_embutidos(leitor: PdfReader) -> tuple[dict[str, tuple[Any, str]], dict[str, str]]:
    """Devolve ({campo: (valor, fonte)}, metadados Info brutos para auditoria)."""
    info = _info(leitor)
    achados: dict[str, tuple[Any, str]] = {}

    def guardar(campo: str, valor: Any, fonte: str) -> None:
        if valor not in (None, "", []) and campo not in achados:
            achados[campo] = (valor, fonte)

    try:
        xmp = leitor.xmp_metadata
    except Exception:
        xmp = None
    if xmp is not None:
        try:
            guardar("title", titulo_util(_primeiro(xmp.dc_title)), "xmp")
            guardar("authors", _autores(xmp.dc_creator or []), "xmp")
            guardar("publisher", _texto(_primeiro(xmp.dc_publisher)), "xmp")
            guardar("language", normalizar_idioma(_texto(_primeiro(xmp.dc_language), 35)), "xmp")
            guardar("doi", normalizar_doi(_prism(xmp, "doi")), "xmp")
            guardar("doi", normalizar_doi(_texto(_primeiro(xmp.dc_identifier))), "xmp")
            guardar("journal", _texto(_prism(xmp, "publicationName")), "xmp")
            guardar(
                "publication_year",
                _ano(_prism(xmp, "publicationDate") or _prism(xmp, "coverDate")),
                "xmp",
            )
        except Exception as erro:  # XMP malformado não deve derrubar o processamento
            logger.info("XMP ignorado (%s)", type(erro).__name__)

    guardar("title", titulo_util(info.get("/Title")), "pdf_info")
    if "/Author" in info:
        guardar("authors", _autores(info["/Author"].split(";")), "pdf_info")
    guardar("doi", normalizar_doi(info.get("/doi") or info.get("/DOI")), "pdf_info")

    try:
        idioma_catalogo = leitor.trailer["/Root"].get("/Lang")
    except Exception:
        idioma_catalogo = None
    guardar("language", normalizar_idioma(_texto(idioma_catalogo, 35)), "pdf_catalog")
    return achados, info


# ---------------------------------------------------------------- idioma por heurística

_PALAVRAS = {
    "pt": "o os do da dos das no na nos nas em um uma não é são ao à às pelo pela pelos pelas "
    "também mais foi seu sua seus suas e isso ele ela eles elas quando muito já entre sobre",
    "es": "el los las del en un una no es son al por también más fue su sus y esto él ella "
    "ellos ellas cuando muy ya la lo entre sobre",
    "en": "the of and to in is are was were that this with for on by from be it an at which "
    "not or have has but their its",
}
_CONTAGEM = {idioma: set(texto.split()) for idioma, texto in _PALAVRAS.items()}
# Palavras de mais de um idioma não ajudam a distinguir: saem de todos.
_COMUNS = {p for a in _CONTAGEM for b in _CONTAGEM if a < b for p in _CONTAGEM[a] & _CONTAGEM[b]}
PALAVRAS_FUNCIONAIS = {idioma: palavras - _COMUNS for idioma, palavras in _CONTAGEM.items()}

MIN_PALAVRAS = 40
MIN_PROPORCAO = 0.08
VANTAGEM = 3.0
_PALAVRA = re.compile(r"[^\W\d_]+")


def detectar_idioma(texto: str) -> str | None:
    """Idioma (pt, en ou es) só quando a evidência é forte; senão None."""
    palavras = _PALAVRA.findall(texto[:50_000].lower())
    if len(palavras) < MIN_PALAVRAS:
        return None
    pontos = {
        idioma: sum(1 for p in palavras if p in conjunto)
        for idioma, conjunto in PALAVRAS_FUNCIONAIS.items()
    }
    ordem = sorted(pontos, key=pontos.__getitem__, reverse=True)
    melhor, segundo = pontos[ordem[0]], pontos[ordem[1]]
    if melhor / len(palavras) < MIN_PROPORCAO or melhor < VANTAGEM * segundo:
        return None
    return ordem[0]


# ---------------------------------------------------------------- combinação


def combinar(
    atuais: dict[str, Any],
    fontes: dict[str, str],
    embutidos: dict[str, tuple[Any, str]],
    idioma_heuristico: str | None,
) -> tuple[dict[str, Any], dict[str, str]]:
    """Preenche só os campos que o usuário NÃO informou. Devolve (valores, fontes)."""
    valores = dict(atuais)
    novas_fontes = dict(fontes)
    for campo in CAMPOS:
        if novas_fontes.get(campo) == "user":
            continue
        if campo in embutidos:
            valores[campo], novas_fontes[campo] = embutidos[campo]
        elif campo == "language" and idioma_heuristico:
            valores[campo], novas_fontes[campo] = idioma_heuristico, "heuristic"
    return valores, novas_fontes
