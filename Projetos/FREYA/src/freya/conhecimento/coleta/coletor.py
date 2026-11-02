"""Coletor de páginas oficiais de marvel.com.

Regras:
- respeita o robots.txt de marvel.com (lido a cada execução);
- identifica-se como F.R.E.Y.A. e espera `intervalo` segundos entre requisições;
- guarda uma cópia do estado de cada página (data/raw/<sha256>.json, fora do git) com data e hash,
  para que cada evidência possa ser conferida depois;
- retoma de onde parou: uma URL já capturada não é baixada de novo (use `recoletar=True` para forçar);
- só segue páginas de filmes, séries e perfis on-screen de personagens (continuidade cinematográfica).

O conteúdo coletado fica só na máquina de quem roda: não é publicado (Termos de Uso da Marvel).
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import time
import urllib.robotparser
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

import httpx

from freya.conhecimento.coleta.parser_marvel import BASE, PaginaInvalida, chave_por_link, extrair_estado, ler_pagina
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Captura

log = logging.getLogger(__name__)

AGENTE = "Mozilla/5.0 (compatible; FREYA-collector/0.1; uso pessoal e academico)"
CRONOLOGIA = f"{BASE}/articles/movies/mcu-timeline-order-disney-plus"


class Coletor:
    def __init__(self, pasta_raw: str | Path = "data/raw", intervalo: float = 2.0, cliente: httpx.Client | None = None):
        self.raw = Path(pasta_raw)
        self.raw.mkdir(parents=True, exist_ok=True)
        self.intervalo = intervalo
        self.cliente = cliente or httpx.Client(headers={"User-Agent": AGENTE}, timeout=30, follow_redirects=True)
        self._indice_arq = self.raw / "indice.json"
        self.indice: dict[str, dict] = json.loads(self._indice_arq.read_text()) if self._indice_arq.exists() else {}
        self._ultimo = 0.0
        self.robots = urllib.robotparser.RobotFileParser()

    # ---------------------------------------------------------------- rede
    def carregar_robots(self) -> None:
        resp = self._get(f"{BASE}/robots.txt")
        self.robots.parse(resp.text.splitlines())

    def permitido(self, url: str) -> bool:
        return self.robots.can_fetch(AGENTE, url)

    def _get(self, url: str) -> httpx.Response:
        espera = self.intervalo - (time.monotonic() - self._ultimo)
        if espera > 0:
            time.sleep(espera)
        self._ultimo = time.monotonic()
        return self.cliente.get(url)

    # ---------------------------------------------------------------- captura
    def capturar(self, url: str, recoletar: bool = False) -> tuple[str, Captura] | None:
        """Baixa (ou relê do disco) a página e devolve (html_ou_estado, captura)."""
        if not recoletar and url in self.indice:
            meta = self.indice[url]
            caminho = Path(meta["caminho_local"])
            if meta.get("status_http") == 200 and caminho.exists():
                return caminho.read_text(encoding="utf-8"), Captura.model_validate(meta)
        if not recoletar and self.indice.get(url, {}).get("status_http") == 404:
            return None  # página que não existe: não pede de novo
        if not self.permitido(url):
            log.warning("robots.txt não permite: %s", url)
            return None
        resp = self._get(url)
        if resp.status_code != 200:
            log.warning("HTTP %s em %s", resp.status_code, url)
            if resp.status_code == 404:
                self.indice[url] = {"url": url, "status_http": 404, "caminho_local": ""}
                self._indice_arq.write_text(json.dumps(self.indice, ensure_ascii=False, indent=1), encoding="utf-8")
            return None
        try:
            estado = extrair_estado(resp.text)
        except PaginaInvalida as e:
            log.warning("%s: %s", url, e)
            return None
        conteudo = json.dumps(estado, ensure_ascii=False, sort_keys=True)
        sha = hashlib.sha256(conteudo.encode("utf-8")).hexdigest()
        caminho = self.raw / f"{sha}.json"
        caminho.write_text(conteudo, encoding="utf-8")
        cap = Captura(id=sha, url=url, recuperado_em=datetime.now(timezone.utc), caminho_local=str(caminho), status_http=resp.status_code)
        self.indice[url] = json.loads(cap.model_dump_json())
        self._indice_arq.write_text(json.dumps(self.indice, ensure_ascii=False, indent=1), encoding="utf-8")
        return conteudo, cap

    # ---------------------------------------------------------------- semente: cronologia oficial
    def obras_da_cronologia(self) -> list[str]:
        """Links de filmes e séries citados na cronologia oficial do MCU, na ordem da página."""
        resp = self._get(CRONOLOGIA)
        links = re.findall(r'href="((?:https://www\.marvel\.com)?/(?:movies|tv-shows)/[a-z0-9\-]+(?:/\d+)?)"', resp.text)
        vistos, saida = set(), []
        for l in links:
            url = l if l.startswith("http") else BASE + l
            if url not in vistos:
                vistos.add(url)
                saida.append(url)
        return saida

    # ---------------------------------------------------------------- coleta completa
    def coletar(self, sementes: list[str], limite: int = 400, recoletar: bool = False) -> tuple[Corpus, dict]:
        """Percorre filmes, séries e perfis on-screen a partir das sementes (busca em largura)."""
        self.carregar_robots()
        corpus, fila, vistos = Corpus(), deque(sementes), set()
        relatorio = {"paginas": 0, "falhas": [], "quadrinhos_descartados": 0, "bloqueadas_robots": 0}
        while fila and relatorio["paginas"] < limite:
            url = fila.popleft()
            if url in vistos or not chave_por_link(url):
                continue
            vistos.add(url)
            if not self.permitido(url):
                relatorio["bloqueadas_robots"] += 1
                continue
            res = self.capturar(url, recoletar=recoletar)
            if res is None:
                relatorio["falhas"].append(url)
                continue
            conteudo, cap = res
            try:
                html = conteudo if conteudo.lstrip().startswith("<") else _como_html(conteudo)
                pagina = ler_pagina(html, url, captura_id=cap.id)
            except PaginaInvalida as e:
                relatorio["falhas"].append(f"{url}: {e}")
                continue
            relatorio["paginas"] += 1
            relatorio["quadrinhos_descartados"] += pagina.descartados_quadrinhos
            for d in pagina.documentos:
                corpus.adicionar_documento(d)
            for e in pagina.entidades:
                corpus.adicionar_entidade(e)
            for f in pagina.fatos:
                corpus.adicionar_fato(f)
            for l in pagina.links:
                if l not in vistos:
                    fila.append(l)
            log.info("[%d] %s (+%d fatos)", relatorio["paginas"], url, len(pagina.fatos))
        relatorio["restantes_na_fila"] = len(fila)
        relatorio["obras_da_cronologia_oficial"] = [chave_por_link(u)[1] for u in sementes if chave_por_link(u)]
        return corpus, relatorio


def _como_html(estado_json: str) -> str:
    """O disco guarda só o estado; o parser espera o script embutido."""
    return f"<script>window['__marvel-fitt__']={{\"page\":{{\"content\":{estado_json}}}}}</script>"
