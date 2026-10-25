"""Provedores de IA. GeminiLLM fala com a API REST do Gemini; DemoLLM gera saídas
determinísticas a partir dos dados estruturados (modo demonstrativo, sem rede)."""
from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from typing import Any, Protocol

import httpx

from .erros import ErroProvedor


@dataclass
class RespostaLLM:
    dados: dict[str, Any]
    tokens_entrada: int = 0
    tokens_saida: int = 0


class ProvedorLLM(Protocol):
    nome: str

    async def gerar_json(self, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any]) -> RespostaLLM: ...


def extrair_json(texto: str) -> dict[str, Any]:
    """Lê JSON mesmo se vier embrulhado em ```json ... ``` ou com texto ao redor."""
    t = texto.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    try:
        dados = json.loads(t)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", t, re.S)
        if not m:
            raise ErroProvedor("resposta_invalida", "Resposta sem JSON.")
        try:
            dados = json.loads(m.group(0))
        except json.JSONDecodeError as e:
            raise ErroProvedor("resposta_invalida", f"JSON inválido: {e.msg}") from e
    if not isinstance(dados, dict):
        raise ErroProvedor("resposta_invalida", "O JSON deve ser um objeto.")
    return dados


class GeminiLLM:
    nome = "gemini"
    URL = "https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"

    def __init__(self, chave: str, modelo: str, timeout_s: float = 45.0, tentativas: int = 2, cliente: httpx.AsyncClient | None = None):
        self._chave = chave
        self.modelo = modelo
        self.timeout_s = timeout_s
        self.tentativas = max(1, tentativas)
        self._cliente = cliente

    async def gerar_json(self, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any]) -> RespostaLLM:
        corpo = {
            "system_instruction": {"parts": [{"text": sistema}]},
            "contents": [{"role": "user", "parts": [{"text": usuario}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3, "maxOutputTokens": 8192},
        }
        ultimo: ErroProvedor | None = None
        for tentativa in range(self.tentativas):
            try:
                return await self._chamar(corpo)
            except ErroProvedor as e:
                ultimo = e
                if not e.temporario or tentativa == self.tentativas - 1:
                    raise
                await asyncio.sleep(2 * (tentativa + 1))
        raise ultimo or ErroProvedor("indisponivel", "Falha desconhecida")

    async def _chamar(self, corpo: dict) -> RespostaLLM:
        cliente = self._cliente or httpx.AsyncClient(timeout=self.timeout_s)
        try:
            r = await cliente.post(self.URL.format(modelo=self.modelo), json=corpo, headers={"x-goog-api-key": self._chave})
        except httpx.TimeoutException as e:
            raise ErroProvedor("timeout", "O Gemini não respondeu a tempo.", temporario=True) from e
        except httpx.HTTPError as e:
            raise ErroProvedor("indisponivel", f"Falha de rede ao chamar o Gemini ({e.__class__.__name__}).", temporario=True) from e
        finally:
            if self._cliente is None:
                await cliente.aclose()
        if r.status_code == 429:
            diaria = "per day" in r.text.lower() or "perday" in r.text.lower()
            raise ErroProvedor("cota_diaria" if diaria else "cota", "Limite do Gemini atingido.", temporario=not diaria)
        if r.status_code in (401, 403):
            raise ErroProvedor("chave", "Chave do Gemini recusada.")
        if r.status_code >= 500:
            raise ErroProvedor("indisponivel", f"Gemini indisponível (HTTP {r.status_code}).", temporario=True)
        if r.status_code >= 400:
            raise ErroProvedor("resposta_invalida", f"Requisição recusada pelo Gemini (HTTP {r.status_code}).")
        dados = r.json()
        try:
            partes = dados["candidates"][0]["content"]["parts"]
            texto = "".join(p.get("text", "") for p in partes if not p.get("thought"))
        except (KeyError, IndexError, TypeError) as e:
            raise ErroProvedor("resposta_invalida", "Resposta do Gemini sem conteúdo (possível bloqueio).") from e
        uso = dados.get("usageMetadata", {})
        return RespostaLLM(extrair_json(texto), int(uso.get("promptTokenCount", 0)), int(uso.get("candidatesTokenCount", 0)))


class DemoLLM:
    """Modo demonstrativo: monta as saídas a partir dos dados estruturados, sem rede.
    Tudo que ele produz é marcado como demonstração pelo orquestrador e pela interface."""

    nome = "demo"

    async def gerar_json(self, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any]) -> RespostaLLM:
        from .. import demo

        construtor = demo.CONSTRUTORES.get(tarefa)
        if construtor is None:
            raise ErroProvedor("resposta_invalida", f"Tarefa desconhecida no modo demonstrativo: {tarefa}")
        return RespostaLLM(construtor(contexto))
