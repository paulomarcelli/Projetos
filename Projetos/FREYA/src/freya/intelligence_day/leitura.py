"""Leitura de uma notícia de marvel.com: texto, data, obra principal e entidades marcadas.

A página de notícia traz o mesmo estado JSON das outras páginas oficiais. Dele saem:
- o cabeçalho (`article_header`): título, subtítulo, autor, data e categoria;
- os blocos de texto (`content_block` com `body_content.type == "text"`), em HTML;
- as tags (`article_tags`): links tipados para obras e personagens de marvel.com, a mesma chave do grafo
  (ex.: `/tv-shows/visionquest/1` → `series:visionquest-1`). É por elas que obras novas, como uma série que
  acabou de estrear, entram no grafo sem que nada seja inventado.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime

from bs4 import BeautifulSoup

from freya.conhecimento.coleta.parser_marvel import BASE, chave_por_link
from freya.conhecimento.modelos import Confiabilidade, Documento
from freya.conhecimento.ontologia import OBRAS, TipoEntidade

# categorias da continuidade cinematográfica; quadrinhos, jogos e eventos ficam de fora
CATEGORIAS = ("movies", "tv-shows")


@dataclass
class Tag:
    chave: str
    nome: str
    tipo: TipoEntidade


@dataclass
class Noticia:
    url: str
    titulo: str
    subtitulo: str
    publicada_em: date | None
    categoria: str
    texto: str
    tags: list[Tag] = field(default_factory=list)

    @property
    def slug(self) -> str:
        return self.url.rstrip("/").rsplit("/", 1)[-1]

    @property
    def obras(self) -> list[Tag]:
        return [t for t in self.tags if t.tipo in OBRAS]

    @property
    def personagens(self) -> list[Tag]:
        return [t for t in self.tags if t.tipo == TipoEntidade.PERSONAGEM]

    def documento(self, captura_id: str | None = None) -> Documento:
        quando = self.publicada_em.isoformat() if self.publicada_em else "sem data"
        return Documento(doc_id=f"noticia:{self.slug}", titulo=self.titulo, url=self.url, tipo_fonte="official_marvel_news",
                         texto="\n".join(x for x in (self.titulo, self.subtitulo, self.texto) if x), captura_id=captura_id,
                         ano=self.publicada_em.year if self.publicada_em else None, secao=f"Notícia de {quando}",
                         confiabilidade=Confiabilidade.OFICIAL, entidade=self.obras[0].chave if self.obras else None,
                         obras=[t.chave for t in self.obras])


class NaoENoticia(ValueError):
    pass


def categoria_da_url(url: str) -> str | None:
    m = re.search(r"/articles/([a-z-]+)/[^/]+/?$", url)
    return m.group(1) if m else None


def _data(texto: str | None) -> date | None:
    if not texto:
        return None
    for fmt in ("%Y-%m-%d", "%B %d, %Y"):
        try:
            return datetime.strptime(texto.strip()[:10] if fmt == "%Y-%m-%d" else texto.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _componentes(estado: dict) -> list[dict]:
    for c in estado.get("components") or []:
        for a in c.get("article_components") or []:
            if a.get("content_components"):
                return a["content_components"]
    raise NaoENoticia("a página não tem o corpo de uma notícia")


def ler_noticia(estado: dict, url: str) -> Noticia:
    blocos = _componentes(estado)
    cab = next((b for b in blocos if b.get("component_type") == "article_header"), {})
    paragrafos: list[str] = []
    for b in blocos:
        corpo = b.get("body_content")
        if b.get("component_type") == "content_block" and isinstance(corpo, dict) and corpo.get("type") == "text":
            sopa = BeautifulSoup(corpo.get("value") or "", "lxml")
            paragrafos += [" ".join(p.get_text(" ").split()) for p in sopa.find_all("p")]
    tags: list[Tag] = []
    for b in blocos:
        for t in b.get("tags") or [] if b.get("component_type") == "article_tags" else []:
            achada = chave_por_link(t.get("link") or "")
            if achada and t.get("title") and achada[1] not in {x.chave for x in tags}:
                tags.append(Tag(chave=achada[1], nome=t["title"].strip(), tipo=achada[0]))
    schema = next((m.get("json_schema") for m in estado.get("meta_tags") or [] if m.get("json_schema")), None) or [{}]
    publicada = _data(schema[0].get("object", {}).get("datePublished")) or _data(cab.get("publish_date"))
    titulo = (cab.get("title") or "").strip()
    if not titulo or not paragrafos:
        raise NaoENoticia("notícia sem título ou sem texto")
    return Noticia(url=url if url.startswith("http") else BASE + url, titulo=titulo, subtitulo=(cab.get("subtitle") or "").strip(),
                   publicada_em=publicada, categoria=categoria_da_url(url) or "", texto="\n".join(p for p in paragrafos if p), tags=tags)
