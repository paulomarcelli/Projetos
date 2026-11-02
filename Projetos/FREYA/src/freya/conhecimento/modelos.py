"""Modelos da base de conhecimento: captura de fonte, documento, entidade e fato.

Regra de procedência: todo fato aponta para a evidência literal (trecho de texto ou campo estruturado da
página), para o documento de origem e, quando existir, para a captura (data, hash e cópia local da fonte).
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from freya.conhecimento.ontologia import Predicado, TipoEntidade


class Confiabilidade(str, Enum):
    """De onde vem a afirmação, em ordem de autoridade."""

    OFICIAL = "oficial"  # marvel.com
    ENCICLOPEDIA = "enciclopedia"  # Wikipedia (CC BY-SA)
    WIKI_FAS = "wiki_fas"  # wiki do MCU feita por fãs (CC BY-SA): detalhada, mas secundária


class Continuidade(str, Enum):
    MCU = "MCU"  # continuidade cinematográfica (live action) — a única ingerida hoje
    QUADRINHOS = "COMICS"  # existe para ser recusada explicitamente, nunca misturada


class Captura(BaseModel):
    """Cópia de uma página oficial no momento da coleta, para a evidência poder ser conferida depois."""

    id: str  # sha256 do conteúdo
    url: str
    recuperado_em: datetime
    caminho_local: str  # data/raw/<sha256>.json (fora do git)
    status_http: int


class Documento(BaseModel):
    doc_id: str
    titulo: str
    url: str
    tipo_fonte: str = "official_marvel"
    continuidade: Continuidade = Continuidade.MCU
    lingua: str = "en"
    texto: str
    entidade: str | None = None  # chave da entidade principal da página
    captura_id: str | None = None
    ano: int | None = None
    secao: str | None = None  # ex.: "Story Moments: Suit Up"
    confiabilidade: Confiabilidade = Confiabilidade.OFICIAL
    licenca: str | None = None  # ex.: "CC BY-SA 3.0" (wiki), "CC BY-SA 4.0" (Wikipedia)
    obras: list[str] = Field(default_factory=list)  # obras que o trecho cobre (âncora no tempo)
    ordem: int | None = None  # posição numa biografia cronológica


class Entidade(BaseModel):
    chave: str  # tipo:slug
    nome: str
    tipo: TipoEntidade
    apelidos: list[str] = Field(default_factory=list)
    descricao: str | None = None
    atributos: dict[str, str | int | float | None] = Field(default_factory=dict)
    fontes: list[str] = Field(default_factory=list)  # doc_ids


class TipoEvidencia(str, Enum):
    TEXTO = "texto"  # trecho literal de texto corrido
    CAMPO = "campo_estruturado"  # campo da página (ex.: aba "Enemies" do perfil on-screen)


class Fato(BaseModel):
    sujeito: str  # chave
    predicado: Predicado
    objeto: str  # chave
    evidencia: str
    tipo_evidencia: TipoEvidencia = TipoEvidencia.TEXTO
    campo: str | None = None  # caminho do campo, quando estruturado
    doc_id: str
    url: str
    captura_id: str | None = None
    predicado_original: str | None = None
    ordem: int | None = None  # posição numa sequência (momentos da trajetória, cronologia)
    ano: int | None = None
    obra: str | None = None  # obra em que a relação vale ou aparece (âncora no tempo)
    qualificador: str | None = None  # nuance da relação, como a fonte escreve (ex.: "Adoptive Brother, Former Teammate")
    confiabilidade: Confiabilidade = Confiabilidade.OFICIAL

    @property
    def id(self) -> str:
        return f"{self.sujeito}|{self.predicado.value}|{self.objeto}|{self.doc_id}"
