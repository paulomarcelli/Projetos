"""Pesquisa na web. TavilyBusca é o provedor real; a interface permite trocar de provedor.
DemoBusca não inventa fontes: devolve lista vazia e o Researcher registra a lacuna."""
from __future__ import annotations

import asyncio
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


class DemoBusca:
    nome = "demo"

    async def buscar(self, consulta: str, maximo: int) -> list[ResultadoBusca]:
        return []
