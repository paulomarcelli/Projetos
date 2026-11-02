"""Normalização de nomes: apóstrofos, acentos, caixa e espaços. Base da chave e da resolução de entidades."""
from __future__ import annotations

import re
import unicodedata

from freya.conhecimento.ontologia import TipoEntidade

_APOSTROFOS = str.maketrans({"’": "'", "‘": "'", "ʼ": "'", "`": "'", "´": "'", "“": '"', "”": '"', "–": "-", "—": "-"})


def normalizar(texto: str) -> str:
    """Forma comparável: sem acento, apóstrofo reto, minúsculas, espaços simples."""
    t = unicodedata.normalize("NFKD", texto.translate(_APOSTROFOS))
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", t).strip().casefold()


def slug(texto: str) -> str:
    t = normalizar(texto).replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def chave(tipo: TipoEntidade, nome_ou_slug: str) -> str:
    return f"{tipo.value}:{slug(nome_ou_slug)}"


def tipo_da_chave(chave_entidade: str) -> TipoEntidade:
    return TipoEntidade(chave_entidade.split(":", 1)[0])


def contem_termo(texto_normalizado: str, termo_normalizado: str) -> bool:
    """O termo aparece como palavra inteira (evita "Thor" casar com "Thorough")."""
    if not termo_normalizado:
        return False
    return re.search(rf"(?<![a-z0-9]){re.escape(termo_normalizado)}(?![a-z0-9])", texto_normalizado) is not None
