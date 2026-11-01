"""Cliente de LLM isolado: o resto do sistema só conhece `LLMClient`, nunca o SDK da OpenAI.

Por que assim:
- `LLMClient` é um Protocol: testes (e, no futuro, outro provedor) podem substituí-lo sem mexer em
  quem o consome.
- Os erros do SDK são traduzidos para poucas exceções próprias, com mensagens que NUNCA incluem
  a chave de API.
- Timeout e número de tentativas vêm da configuração; não há chamada feita ao importar o módulo.

Teste manual da integração (faz UMA chamada paga e curta, só quando você executa):
    uv run python -m shared.llm.client "Responda apenas: ok"
"""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass
from typing import Any, Protocol

import openai
from openai import OpenAI

from shared.config import Settings, load_settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Erro genérico do provedor de IA."""


class LLMNotConfiguredError(LLMError):
    """A chave de API não foi configurada."""


class LLMAuthenticationError(LLMError):
    """Chave recusada ou sem permissão."""


class LLMRateLimitError(LLMError):
    """Limite de requisições ou de cota atingido."""


class LLMUnavailableError(LLMError):
    """Serviço fora do ar, sem resposta a tempo ou com falha de rede."""


class LLMRequestError(LLMError):
    """Pedido recusado (por exemplo, nome de modelo inexistente)."""


@dataclass(frozen=True)
class LLMResult:
    text: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class LLMClient(Protocol):
    def complete(
        self, prompt: str, *, system: str | None = None, max_output_tokens: int | None = None
    ) -> LLMResult: ...


class OpenAIClient:
    """Implementação de `LLMClient` com o cliente oficial da OpenAI (Chat Completions).

    Usa Chat Completions por ser a interface aceita também por serviços compatíveis (via
    OPENAI_BASE_URL). `sdk` permite injetar um objeto falso nos testes.
    """

    def __init__(self, settings: Settings, *, sdk: Any | None = None) -> None:
        self._model = settings.openai_model
        if sdk is not None:
            self._sdk = sdk
            return
        if settings.openai_api_key is None:
            raise LLMNotConfiguredError("OPENAI_API_KEY não está configurada.")
        self._sdk = OpenAI(
            api_key=settings.openai_api_key.get_secret_value(),
            base_url=settings.openai_base_url,
            timeout=settings.openai_timeout_seconds,
            max_retries=settings.openai_max_retries,
        )

    @property
    def model(self) -> str:
        return self._model

    def complete(
        self, prompt: str, *, system: str | None = None, max_output_tokens: int | None = None
    ) -> LLMResult:
        mensagens: list[dict[str, str]] = []
        if system:
            mensagens.append({"role": "system", "content": system})
        mensagens.append({"role": "user", "content": prompt})

        pedido: dict[str, Any] = {"model": self._model, "messages": mensagens}
        if max_output_tokens is not None:
            pedido["max_completion_tokens"] = max_output_tokens

        try:
            resposta = self._sdk.chat.completions.create(**pedido)
        except openai.AuthenticationError as erro:
            raise LLMAuthenticationError("A OpenAI recusou a chave de API.") from erro
        except openai.PermissionDeniedError as erro:
            raise LLMAuthenticationError(
                "A chave de API não tem permissão para este recurso."
            ) from erro
        except openai.RateLimitError as erro:
            raise LLMRateLimitError(
                "Limite de requisições ou de cota da OpenAI atingido."
            ) from erro
        except (
            openai.APITimeoutError,
            openai.APIConnectionError,
            openai.InternalServerError,
        ) as erro:
            raise LLMUnavailableError(
                "A OpenAI está indisponível ou não respondeu a tempo."
            ) from erro
        except (
            openai.BadRequestError,
            openai.NotFoundError,
            openai.UnprocessableEntityError,
        ) as erro:
            raise LLMRequestError(
                "A OpenAI recusou o pedido (confira o nome do modelo em OPENAI_MODEL)."
            ) from erro
        except openai.APIError as erro:
            raise LLMError("Erro inesperado na API da OpenAI.") from erro

        escolha = resposta.choices[0] if resposta.choices else None
        texto = (escolha.message.content or "") if escolha is not None else ""
        uso = getattr(resposta, "usage", None)
        logger.info("Resposta do LLM recebida (modelo=%s)", self._model)  # sem texto, sem chave
        return LLMResult(
            text=texto,
            model=getattr(resposta, "model", None) or self._model,
            input_tokens=getattr(uso, "prompt_tokens", None),
            output_tokens=getattr(uso, "completion_tokens", None),
        )


def build_llm_client(settings: Settings) -> LLMClient:
    return OpenAIClient(settings)


def _main(argv: list[str]) -> int:
    """Teste manual: envia um prompt curto ao modelo configurado e imprime a resposta."""
    prompt = " ".join(argv) or "Responda apenas: ok"
    try:
        cliente = build_llm_client(load_settings())
        resultado = cliente.complete(prompt, max_output_tokens=50)
    except LLMError as erro:
        print(f"Falhou ({type(erro).__name__}): {erro}", file=sys.stderr)
        return 1
    print(f"[{resultado.model}] {resultado.text}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
