"""Pesquisa na web. TavilyBusca é o provedor real; a interface permite trocar de provedor.
DemoBusca não inventa fontes: devolve lista vazia e o Researcher registra a lacuna."""
from __future__ import annotations

import asyncio
import json
import re
import time
from dataclasses import dataclass
from typing import Protocol
from urllib.parse import urlparse

import httpx

from .erros import ErroProvedor


@dataclass
class ResultadoBusca:
    titulo: str
    url: str
    trecho: str
    publicador: str | None = None
    data_publicacao: str | None = None


class ProvedorBusca(Protocol):
    nome: str

    async def buscar(self, consulta: str, maximo: int) -> list[ResultadoBusca]: ...


def publicador_de(url: str) -> str | None:
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return None
    return host.removeprefix("www.") or None


class TavilyBusca:
    nome = "tavily"
    URL = "https://api.tavily.com/search"

    def __init__(self, chave: str, timeout_s: float = 30.0, tentativas: int = 2, cliente: httpx.AsyncClient | None = None):
        self._chave = chave
        self.timeout_s = timeout_s
        self.tentativas = max(1, tentativas)
        self._cliente = cliente

    async def buscar(self, consulta: str, maximo: int) -> list[ResultadoBusca]:
        corpo = {"query": consulta[:400], "max_results": max(1, min(maximo, 10)), "search_depth": "basic", "include_answer": False, "include_raw_content": False}
        for tentativa in range(self.tentativas):
            try:
                return await self._chamar(corpo)
            except ErroProvedor as e:
                if not e.temporario or tentativa == self.tentativas - 1:
                    raise
                await asyncio.sleep(2 * (tentativa + 1))
        return []

    async def _chamar(self, corpo: dict) -> list[ResultadoBusca]:
        cliente = self._cliente or httpx.AsyncClient(timeout=self.timeout_s)
        try:
            r = await cliente.post(self.URL, json=corpo, headers={"Authorization": f"Bearer {self._chave}"})
        except httpx.TimeoutException as e:
            raise ErroProvedor("timeout", "A Tavily não respondeu a tempo.", temporario=True) from e
        except httpx.HTTPError as e:
            raise ErroProvedor("indisponivel", f"Falha de rede ao chamar a Tavily ({e.__class__.__name__}).", temporario=True) from e
        finally:
            if self._cliente is None:
                await cliente.aclose()
        if r.status_code == 429:
            raise ErroProvedor("cota", "Limite da Tavily atingido.")
        if r.status_code in (401, 403):
            raise ErroProvedor("chave", "Chave da Tavily recusada.")
        if r.status_code == 432 or r.status_code == 433:
            raise ErroProvedor("cota_diaria", "Créditos do plano da Tavily esgotados.")
        if r.status_code >= 500:
            raise ErroProvedor("indisponivel", f"Tavily indisponível (HTTP {r.status_code}).", temporario=True)
        if r.status_code >= 400:
            raise ErroProvedor("resposta_invalida", f"Consulta recusada pela Tavily (HTTP {r.status_code}).")
        saida = []
        for item in r.json().get("results", []):
            url = item.get("url")
            if not url or not str(url).startswith(("http://", "https://")):
                continue  # nunca aceita resultado sem URL de origem
            saida.append(ResultadoBusca(titulo=str(item.get("title") or url)[:300], url=url, trecho=str(item.get("content") or "")[:1200], publicador=publicador_de(url), data_publicacao=item.get("published_date")))
        return saida


class GdeltBusca:
    """GDELT DOC 2.0: base aberta de notícias do mundo todo, sem chave e sem custo.

    Devolve título, link, veículo, país e data (não traz o texto da matéria). O GDELT pede
    no máximo uma consulta a cada 5 segundos; o intervalo é respeitado entre todas as instâncias.
    """

    nome = "gdelt"
    URL = "https://api.gdeltproject.org/api/v2/doc/doc"
    _travas: dict[int, asyncio.Lock] = {}
    _ultima = 0.0

    def __init__(self, timeout_s: float = 30.0, tentativas: int = 2, intervalo_s: float = 5.5, periodo: str = "3m", cliente: httpx.AsyncClient | None = None):
        self.timeout_s = timeout_s
        self.tentativas = max(1, tentativas)
        self.intervalo_s = intervalo_s
        self.periodo = periodo
        self._cliente = cliente

    @staticmethod
    def preparar_consulta(consulta: str) -> str:
        """O GDELT recusa palavras com menos de 3 letras e a maioria dos símbolos."""
        palavras = re.findall(r"[\w\-]+", consulta[:300])
        return " ".join(p for p in palavras if len(p) >= 3)[:250]

    async def buscar(self, consulta: str, maximo: int) -> list[ResultadoBusca]:
        termos = self.preparar_consulta(consulta)
        if not termos:
            return []
        params = {"query": termos, "mode": "artlist", "format": "json", "maxrecords": str(max(1, min(maximo, 25))), "sort": "hybridrel", "timespan": self.periodo}
        for tentativa in range(self.tentativas):
            try:
                return await self._chamar(params)
            except ErroProvedor as e:
                if not e.temporario or tentativa == self.tentativas - 1:
                    raise
        return []

    async def _chamar(self, params: dict) -> list[ResultadoBusca]:
        cls = type(self)
        trava = cls._travas.setdefault(id(asyncio.get_running_loop()), asyncio.Lock())
        async with trava:
            espera = cls._ultima + self.intervalo_s - time.monotonic()
            if espera > 0:
                await asyncio.sleep(espera)
            cliente = self._cliente or httpx.AsyncClient(timeout=self.timeout_s)
            try:
                r = await cliente.get(self.URL, params=params, headers={"User-Agent": "ATLAS-academic-demo"})
            except httpx.TimeoutException as e:
                raise ErroProvedor("timeout", "O GDELT não respondeu a tempo.", temporario=True) from e
            except httpx.HTTPError as e:
                raise ErroProvedor("indisponivel", f"Falha de rede ao chamar o GDELT ({e.__class__.__name__}).", temporario=True) from e
            finally:
                cls._ultima = time.monotonic()
                if self._cliente is None:
                    await cliente.aclose()
        texto = r.text.strip()
        if r.status_code == 429 or "limit requests" in texto.lower():
            raise ErroProvedor("cota", "O GDELT pediu um intervalo maior entre consultas.", temporario=True)
        if r.status_code >= 500:
            raise ErroProvedor("indisponivel", f"GDELT indisponível (HTTP {r.status_code}).", temporario=True)
        if r.status_code >= 400:
            raise ErroProvedor("resposta_invalida", f"Consulta recusada pelo GDELT (HTTP {r.status_code}).")
        if not texto or texto == "{}":
            return []
        try:
            dados = json.loads(texto, strict=False)
        except json.JSONDecodeError as e:
            # o GDELT responde erros de consulta em texto puro, com HTTP 200
            raise ErroProvedor("resposta_invalida", f"GDELT recusou a consulta: {texto[:160]}") from e
        saida = []
        for item in dados.get("articles", []) if isinstance(dados, dict) else []:
            url = item.get("url")
            if not url or not str(url).startswith(("http://", "https://")):
                continue
            titulo = str(item.get("title") or url)[:300]
            detalhes = ", ".join(x for x in (item.get("domain"), item.get("sourcecountry"), item.get("language")) if x)
            saida.append(ResultadoBusca(titulo=titulo, url=url, trecho=f"{titulo} ({detalhes}). Apenas título e metadados: o GDELT não fornece o texto da matéria.", publicador=item.get("domain") or publicador_de(url), data_publicacao=_data_gdelt(item.get("seendate"))))
        return saida


def _data_gdelt(valor: str | None) -> str | None:
    """'20261024T120000Z' → '2026-10-24'."""
    if not valor or len(valor) < 8 or not valor[:8].isdigit():
        return None
    return f"{valor[:4]}-{valor[4:6]}-{valor[6:8]}"


class DemoBusca:
    nome = "demo"

    async def buscar(self, consulta: str, maximo: int) -> list[ResultadoBusca]:
        return []
