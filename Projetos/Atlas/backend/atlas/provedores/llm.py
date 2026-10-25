"""Provedores de IA. GeminiLLM fala com a API REST do Gemini; DemoLLM gera saídas
determinísticas a partir dos dados estruturados (modo demonstrativo, sem rede)."""
from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

from .erros import ErroProvedor, limite_diario


@dataclass
class RespostaLLM:
    dados: dict[str, Any]
    tokens_entrada: int = 0
    tokens_saida: int = 0
    provedor: str | None = None  # quem respondeu (útil no roteamento)
    chamadas: int = 1  # requisições feitas, contando as que falharam antes do fallback
    avisos: list[str] = field(default_factory=list)


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

    def __init__(self, chave: str, modelo: str, timeout_s: float = 45.0, tentativas: int = 2, cliente: httpx.AsyncClient | None = None, nivel_raciocinio: str | None = None):
        self.nivel_raciocinio = nivel_raciocinio
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
        if self.nivel_raciocinio:
            corpo["generationConfig"]["thinkingConfig"] = {"thinkingLevel": self.nivel_raciocinio}
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
            diaria = limite_diario(r.text)
            raise ErroProvedor("cota_diaria" if diaria else "cota", f"{'Cota diária' if diaria else 'Limite por minuto'} do {self.modelo} atingido.", temporario=not diaria)
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


class CompatLLM:
    """API no formato da OpenAI (`/v1/chat/completions`): Ollama local, Groq, OpenRouter, Mistral…

    Com Ollama, tudo roda na própria máquina: sem chave, sem cota e sem enviar dados para fora.
    """

    def __init__(self, nome: str, base_url: str, modelo: str, chave: str | None = None, timeout_s: float = 300.0, tentativas: int = 2, cliente: httpx.AsyncClient | None = None, esforco_raciocinio: str | None = None):
        self.nome = nome
        self.esforco_raciocinio = esforco_raciocinio  # "low" economiza tokens em modelos de raciocínio (gpt-oss, qwen3)
        self.url = base_url.rstrip("/") + ("/chat/completions" if base_url.rstrip("/").endswith("/v1") else "/v1/chat/completions")
        self.modelo = modelo
        self._chave = chave
        self.timeout_s = timeout_s
        self.tentativas = max(1, tentativas)
        self._cliente = cliente

    async def gerar_json(self, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any]) -> RespostaLLM:
        corpo = {
            "model": self.modelo,
            "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": usuario}],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }
        if self.esforco_raciocinio:
            corpo["reasoning_effort"] = self.esforco_raciocinio
        for tentativa in range(self.tentativas):
            try:
                return await self._chamar(corpo)
            except ErroProvedor as e:
                if not e.temporario or tentativa == self.tentativas - 1:
                    raise
                # respeita o Retry-After do provedor (limite por minuto), até 65 s
                await asyncio.sleep(min(65.0, max(2.0 * (tentativa + 1), e.espera_s)))
        raise ErroProvedor("indisponivel", "Falha desconhecida")

    async def _chamar(self, corpo: dict) -> RespostaLLM:
        rotulo = "Ollama" if self.nome == "ollama" else "provedor de IA"
        cliente = self._cliente or httpx.AsyncClient(timeout=self.timeout_s)
        headers = {"Authorization": f"Bearer {self._chave}"} if self._chave else {}
        try:
            r = await cliente.post(self.url, json=corpo, headers=headers)
        except httpx.TimeoutException as e:
            raise ErroProvedor("timeout", f"O {rotulo} não respondeu a tempo.", temporario=True) from e
        except httpx.ConnectError as e:
            dica = " Verifique se o Ollama está aberto (ollama serve)." if self.nome == "ollama" else ""
            raise ErroProvedor("indisponivel", f"Não foi possível conectar ao {rotulo}.{dica}") from e
        except httpx.HTTPError as e:
            raise ErroProvedor("indisponivel", f"Falha de rede ao chamar o {rotulo} ({e.__class__.__name__}).", temporario=True) from e
        finally:
            if self._cliente is None:
                await cliente.aclose()
        if r.status_code == 429:
            diaria = limite_diario(r.text)
            try:
                espera = float(r.headers.get("retry-after", "0"))
            except ValueError:
                espera = 0.0
            raise ErroProvedor("cota_diaria" if diaria else "cota", f"Limite do {rotulo} atingido.", temporario=not diaria, espera_s=espera)
        if r.status_code in (401, 403):
            raise ErroProvedor("chave", f"Chave do {rotulo} recusada.")
        if r.status_code == 404:
            raise ErroProvedor("resposta_invalida", f"Modelo “{self.modelo}” não encontrado. Com Ollama, rode: ollama pull {self.modelo}")
        if r.status_code >= 500:
            raise ErroProvedor("indisponivel", f"{rotulo} indisponível (HTTP {r.status_code}).", temporario=True)
        if r.status_code >= 400:
            raise ErroProvedor("resposta_invalida", f"Requisição recusada pelo {rotulo} (HTTP {r.status_code}).")
        try:
            dados = r.json()
            texto = dados["choices"][0]["message"]["content"] or ""
        except (ValueError, KeyError, IndexError, TypeError) as e:
            raise ErroProvedor("resposta_invalida", f"Resposta do {rotulo} sem conteúdo.") from e
        uso = dados.get("usage") or {}
        return RespostaLLM(extrair_json(texto), int(uso.get("prompt_tokens", 0)), int(uso.get("completion_tokens", 0)))



# Tarefa → agente (o roteamento é definido por agente)
TAREFA_AGENTE = {"extrair_evidencias": "researcher", "analisar": "analyst", "verificar": "verifier"}
NOMES_PROVEDOR = {"gemini": "Gemini", "openai": "API compatível (ex.: Groq)", "ollama": "Ollama"}


def nome_legivel(chave: str) -> str:
    """'gemini:gemini-3.7-flash' → 'Gemini (gemini-3.7-flash)'."""
    familia, _, modelo = chave.partition(":")
    base = NOMES_PROVEDOR.get(familia, familia)
    return f"{base} ({modelo})" if modelo else base


class RoteadorLLM:
    """Reúne vários provedores: cada agente tem uma ordem de preferência e, se um provedor
    falhar por cota, chave, rede ou formato, o próximo assume (fallback).

    Distribui o consumo entre as cotas gratuitas e deixa o modelo mais forte para o Analyst.
    """

    nome = "roteado"
    PASSA_ADIANTE = {"cota", "cota_diaria", "chave", "indisponivel", "timeout", "resposta_invalida"}

    def __init__(self, provedores: dict[str, Any], rotas: dict[str, list[str]], rodadas: int = 2):
        self.rodadas = max(1, rodadas)
        if not provedores:
            raise ValueError("Roteador sem provedores")
        self.provedores = provedores
        padrao = list(provedores)
        self.rotas = {ag: [p for p in rotas.get(ag, padrao) if p in provedores] or padrao for ag in ("researcher", "analyst", "verifier")}
        self.esgotados: set[str] = set()  # cota diária atingida: não tenta de novo nesta execução

    def descrever(self) -> dict[str, list[str]]:
        return dict(self.rotas)

    async def gerar_json(self, tarefa: str, sistema: str, usuario: str, contexto: dict[str, Any]) -> RespostaLLM:
        avisos: list[str] = []
        chamadas = 0
        ultimo: ErroProvedor | None = None
        for rodada in range(self.rodadas):
            ordem = [p for p in self.rotas.get(TAREFA_AGENTE.get(tarefa, "analyst"), list(self.provedores)) if p not in self.esgotados]
            temporarios: list[ErroProvedor] = []
            for nome in ordem:
                chamadas += 1
                try:
                    r = await self.provedores[nome].gerar_json(tarefa, sistema, usuario, contexto)
                except ErroProvedor as e:
                    if e.motivo not in self.PASSA_ADIANTE:
                        raise
                    if e.motivo == "cota_diaria":
                        self.esgotados.add(nome)
                    if e.temporario:
                        temporarios.append(e)
                    ultimo = e
                    avisos.append(f"{nome_legivel(nome)} falhou ({e.mensagem}); tentando o próximo provedor.")
                    continue
                r.provedor, r.chamadas, r.avisos = nome, chamadas, avisos
                return r
            # todos falharam: se alguma falha era temporária (sobrecarga, limite por minuto), espera e tenta mais uma volta
            if not temporarios or rodada == self.rodadas - 1:
                break
            espera = min(65.0, max([5.0] + [e.espera_s for e in temporarios]))
            avisos.append(f"Todos os provedores estão temporariamente ocupados; nova tentativa em {espera:.0f} s.")
            await asyncio.sleep(espera)
        if ultimo is None:
            raise ErroProvedor("cota_diaria", "Todos os provedores de IA atingiram a cota diária.")
        raise ErroProvedor(ultimo.motivo, f"Todos os provedores falharam. Último: {ultimo.mensagem}", temporario=ultimo.temporario)
