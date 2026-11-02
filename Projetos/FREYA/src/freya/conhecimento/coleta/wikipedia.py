"""Enredos das obras do MCU na Wikipedia em inglês (licença CC BY-SA 4.0).

Para cada filme ou temporada da cronologia oficial, busca o artigo (REST API da Wikimedia), confere que é
uma obra da Marvel Studios e guarda a seção de enredo ("Plot", "Synopsis", "Premise") e, nas temporadas,
os resumos dos episódios. Cada enredo vira um documento ancorado na obra e no ano.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import httpx

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Confiabilidade, Documento
from freya.conhecimento.normalizacao import slug
from freya.conhecimento.ontologia import TipoEntidade

BRUTO = "https://en.wikipedia.org/w/index.php"
AGENTE = "FREYA-research/0.1 (uso pessoal e academico; https://github.com/paulomarcelli/Projetos)"
LICENCA = "CC BY-SA 4.0 (Wikipedia)"
_SECOES = ("Plot", "Synopsis", "Premise", "Story")


class ClienteWikipedia:
    def __init__(self, pasta_raw: str | Path = "data/raw/wikipedia", intervalo: float = 2.0, cliente: httpx.Client | None = None):
        self.raw = Path(pasta_raw)
        self.raw.mkdir(parents=True, exist_ok=True)
        self.intervalo = intervalo
        self.http = cliente or httpx.Client(headers={"User-Agent": AGENTE}, timeout=60, follow_redirects=True)
        self._ultimo = 0.0

    def _baixar(self, titulo: str) -> httpx.Response | None:
        for tentativa in range(3):
            espera = self.intervalo - (time.monotonic() - self._ultimo)
            if espera > 0:
                time.sleep(espera)
            self._ultimo = time.monotonic()
            r = self.http.get(BRUTO, params={"title": titulo, "action": "raw"})
            if r.status_code == 429:
                time.sleep(15 * (tentativa + 1))
                continue
            return r
        return None

    def artigo(self, titulo: str) -> dict | None:
        """Texto-fonte (wikitext) do artigo, seguindo um redirecionamento. Só guarda em disco respostas definitivas."""
        arq = self.raw / f"{slug(titulo)}.json.gz"
        if arq.exists():
            reg = json.loads(gzip.decompress(arq.read_bytes()))
            return reg if reg.get("texto") else None
        r = self._baixar(titulo)
        if r is not None and r.status_code == 200 and (m := re.match(r"#REDIRECT\s*\[\[([^\]|#]+)", r.text, re.I)):
            titulo = m.group(1).strip()
            r = self._baixar(titulo)
        if r is None or r.status_code not in (200, 404):
            return None  # limite de uso ou erro temporário: tenta de novo numa próxima execução
        reg = {"titulo": titulo, "texto": r.text if r.status_code == 200 else "", "status": r.status_code,
               "recuperado_em": datetime.now(timezone.utc).isoformat(), "sha256": hashlib.sha256(r.content).hexdigest()}
        arq.write_bytes(gzip.compress(json.dumps(reg, ensure_ascii=False).encode()))
        return reg if reg["texto"] else None


def _titulos(nome: str, tipo: TipoEntidade) -> list[str]:
    m = re.match(r"(.*?)\s*\|\s*Season\s*(\d+)", nome, re.I)
    base = (m.group(1) if m else nome).strip()
    if tipo == TipoEntidade.SERIE:
        temp = m.group(2) if m else None
        return ([f"{base} season {temp}"] if temp else []) + [f"{base} (TV series)", f"{base} (miniseries)", base]
    return [f"{base} (film)", f"{base} (2008 film)", base]


def limpar_wikitexto(t: str) -> str:
    """Wikitext -> texto: tira referências, predefinições, comentários e marcação de links e ênfase."""
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    t = re.sub(r"<ref[^>/]*/>", "", t)
    t = re.sub(r"<ref[^>]*>.*?</ref>", "", t, flags=re.S)
    for _ in range(4):  # predefinições aninhadas
        t = re.sub(r"\{\{[^{}]*\}\}", "", t)
    t = re.sub(r"\[\[(?:File|Image):[^\]]*\]\]", "", t)
    t = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", t)
    t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)
    t = re.sub(r"'{2,}", "", t)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"[ \t]+", " ", t).strip()


def enredo(wikitexto: str) -> str | None:
    """Seção de enredo (Plot/Synopsis/Premise) e, nas temporadas, os resumos curtos dos episódios."""
    if "Marvel" not in wikitexto:
        return None
    partes = []
    secoes = re.split(r"\n==\s*([^=].*?)\s*==\s*\n", "\n" + wikitexto)
    for i in range(1, len(secoes) - 1, 2):
        if secoes[i].strip() in _SECOES:
            partes += [p for p in (limpar_wikitexto(x) for x in secoes[i + 1].split("\n\n")) if len(p) > 40]
            break
    for m in re.finditer(r"\|\s*ShortSummary\s*=(.*?)(?=\n\s*\|\s*[A-Za-z]+\s*=|\n\}\})", wikitexto, re.S):
        p = limpar_wikitexto(m.group(1))
        if len(p) > 40:
            partes.append(p)
    return "\n".join(partes) if partes else None


def coletar_enredos(corpus: Corpus, obras_oficiais: list[str], cliente: ClienteWikipedia) -> tuple[Corpus, dict]:
    saida, rel = Corpus(), {"obras": 0, "com_enredo": 0, "sem_artigo": []}
    for ch in obras_oficiais:
        e = corpus.entidades.get(ch)
        if not e or not e.tipo.obra:
            continue
        rel["obras"] += 1
        for titulo in _titulos(e.nome, e.tipo):
            reg = cliente.artigo(titulo)
            texto = enredo(reg["texto"]) if reg else None
            if texto:
                ano = e.atributos.get("ano") if isinstance(e.atributos.get("ano"), int) else None
                saida.adicionar_documento(Documento(
                    doc_id=f"wikipedia:{ch}", titulo=f"{e.nome} — enredo (Wikipedia)",
                    url=f"https://en.wikipedia.org/wiki/{quote(reg['titulo'].replace(' ', '_'))}", tipo_fonte="wikipedia", texto=texto, entidade=ch,
                    confiabilidade=Confiabilidade.ENCICLOPEDIA, licenca=LICENCA, obras=[ch], ano=ano, secao="enredo"))
                rel["com_enredo"] += 1
                break
        else:
            rel["sem_artigo"].append(ch)
    return saida, rel
