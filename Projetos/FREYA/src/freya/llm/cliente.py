"""Interface única com o modelo de linguagem.

O motor prospectivo só conhece `ModeloDeLinguagem.gerar(sistema, usuario, esquema)`, que devolve um objeto
Pydantic validado. Implementações:
- `ModeloOpenAI`: saída estruturada (JSON Schema estrito) da API da OpenAI; compatível com endpoints OpenAI;
- `ModeloSimulado`: devolve respostas prontas, para testes sem custo e sem rede.
"""
from __future__ import annotations

import json
import logging
from typing import Protocol, TypeVar

from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class ErroDoModelo(RuntimeError):
    pass


class ModeloDeLinguagem(Protocol):
    nome: str

    def gerar(self, sistema: str, usuario: str, esquema: type[T]) -> T: ...


class ModeloOpenAI:
    def __init__(self, chave: str, modelo: str = "gpt-4o-mini", base_url: str | None = None, temperatura: float = 0.2, tentativas: int = 2):
        from openai import OpenAI

        self._cliente = OpenAI(api_key=chave, base_url=base_url)
        self.nome = modelo
        self.temperatura = temperatura
        self.tentativas = tentativas
        self._so_json = False  # alguns endpoints compatíveis (revendedores) não aceitam saída estruturada

    def _gerar_json(self, mensagens: list[dict], esquema: type[T]) -> T:
        resp = self._cliente.chat.completions.create(
            model=self.nome, temperature=self.temperatura, response_format={"type": "json_object"},
            messages=mensagens + [{"role": "user", "content": "Responda só com JSON válido neste esquema:\n" +
                                   json.dumps(esquema.model_json_schema(), ensure_ascii=False)}])
        texto = (resp.choices[0].message.content or "{}").strip()
        texto = texto.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return esquema.model_validate_json(texto)

    def gerar(self, sistema: str, usuario: str, esquema: type[T]) -> T:
        mensagens = [{"role": "system", "content": sistema}, {"role": "user", "content": usuario}]
        ultimo_erro: Exception | None = None
        for tentativa in range(1, self.tentativas + 1):
            if not self._so_json:
                try:
                    resp = self._cliente.beta.chat.completions.parse(model=self.nome, messages=mensagens, response_format=esquema,
                                                                     temperature=self.temperatura)
                    msg = resp.choices[0].message
                    if msg.refusal:
                        raise ErroDoModelo(f"o modelo recusou: {msg.refusal}")
                    if msg.parsed is not None:
                        return msg.parsed
                except ErroDoModelo:
                    raise
                except Exception as e:
                    ultimo_erro = e
                    self._so_json = True  # não insiste na saída estruturada com este endpoint
                    log.warning("modelo: saída estruturada indisponível (%s); usando modo JSON", type(e).__name__)
            try:
                return self._gerar_json(mensagens, esquema)
            except Exception as e:
                ultimo_erro = e
                log.warning("modelo: tentativa %d em modo JSON falhou (%s)", tentativa, str(e)[:200])
        raise ErroDoModelo(f"o modelo não devolveu uma análise válida: {ultimo_erro}")


class ModeloSimulado:
    """Para testes: devolve a resposta fornecida (objeto, dict ou função do prompt) e guarda os prompts."""

    nome = "simulado"

    def __init__(self, resposta):
        self.resposta = resposta
        self.chamadas: list[tuple[str, str]] = []

    def gerar(self, sistema: str, usuario: str, esquema: type[T]) -> T:
        self.chamadas.append((sistema, usuario))
        r = self.resposta(usuario) if callable(self.resposta) else self.resposta
        if isinstance(r, Exception):
            raise r
        return r if isinstance(r, esquema) else esquema.model_validate(r)
