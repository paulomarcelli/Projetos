"""Cliente de LLM, sempre com o SDK simulado: nenhum teste chama a OpenAI de verdade."""

from __future__ import annotations

from types import SimpleNamespace

import httpx
import openai
import pytest

import app.llm.client as modulo
from app.core.config import Settings
from app.llm.client import (
    LLMAuthenticationError,
    LLMClient,
    LLMError,
    LLMNotConfiguredError,
    LLMRateLimitError,
    LLMRequestError,
    LLMResult,
    LLMUnavailableError,
    OpenAIClient,
)

REQ = httpx.Request("POST", "https://api.openai.test/v1/chat/completions")


def resposta_http(status: int) -> httpx.Response:
    return httpx.Response(status, request=REQ)


def sdk_falso(resultado=None, erro: Exception | None = None):
    """Imita `OpenAI().chat.completions.create` e guarda o último pedido recebido."""
    chamadas: list[dict] = []

    def create(**pedido):
        chamadas.append(pedido)
        if erro is not None:
            raise erro
        return resultado

    sdk = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    sdk.chamadas = chamadas
    return sdk


def resultado_ok(texto="olá", modelo="gpt-teste", entrada=7, saida=3):
    return SimpleNamespace(
        model=modelo,
        choices=[SimpleNamespace(message=SimpleNamespace(content=texto))],
        usage=SimpleNamespace(prompt_tokens=entrada, completion_tokens=saida),
    )


def test_completa_com_sucesso_e_monta_o_pedido(make_settings):
    sdk = sdk_falso(resultado_ok("resposta"))
    cliente = OpenAIClient(make_settings(openai_model="modelo-config"), sdk=sdk)
    r = cliente.complete("pergunta", system="seja breve", max_output_tokens=50)
    assert r == LLMResult(text="resposta", model="gpt-teste", input_tokens=7, output_tokens=3)
    pedido = sdk.chamadas[0]
    assert pedido["model"] == "modelo-config"
    assert pedido["max_completion_tokens"] == 50
    assert pedido["messages"] == [
        {"role": "system", "content": "seja breve"},
        {"role": "user", "content": "pergunta"},
    ]


def test_sem_system_e_sem_limite_de_tokens(make_settings):
    sdk = sdk_falso(resultado_ok())
    OpenAIClient(make_settings(), sdk=sdk).complete("oi")
    assert sdk.chamadas[0]["messages"] == [{"role": "user", "content": "oi"}]
    assert "max_completion_tokens" not in sdk.chamadas[0]


def test_resposta_sem_escolhas_devolve_texto_vazio(make_settings):
    vazio = SimpleNamespace(model=None, choices=[], usage=None)
    r = OpenAIClient(make_settings(), sdk=sdk_falso(vazio)).complete("oi")
    assert r.text == ""
    assert r.input_tokens is None


@pytest.mark.parametrize(
    ("erro", "esperado"),
    [
        (
            openai.AuthenticationError("x", response=resposta_http(401), body=None),
            LLMAuthenticationError,
        ),
        (
            openai.PermissionDeniedError("x", response=resposta_http(403), body=None),
            LLMAuthenticationError,
        ),
        (openai.RateLimitError("x", response=resposta_http(429), body=None), LLMRateLimitError),
        (
            openai.InternalServerError("x", response=resposta_http(503), body=None),
            LLMUnavailableError,
        ),
        (openai.APITimeoutError(request=REQ), LLMUnavailableError),
        (openai.APIConnectionError(request=REQ), LLMUnavailableError),
        (openai.BadRequestError("x", response=resposta_http(400), body=None), LLMRequestError),
        (openai.NotFoundError("x", response=resposta_http(404), body=None), LLMRequestError),
        (openai.APIError("x", request=REQ, body=None), LLMError),
    ],
)
def test_erros_do_sdk_viram_erros_proprios(make_settings, erro, esperado):
    cliente = OpenAIClient(make_settings(), sdk=sdk_falso(erro=erro))
    with pytest.raises(esperado) as capturado:
        cliente.complete("oi")
    assert type(capturado.value) is esperado


def test_mensagem_de_erro_nao_contem_a_chave(make_settings):
    erro = openai.AuthenticationError(
        "Incorrect API key provided: sk-CHAVE-SECRETA", response=resposta_http(401), body=None
    )
    with pytest.raises(LLMAuthenticationError) as capturado:
        OpenAIClient(make_settings(), sdk=sdk_falso(erro=erro)).complete("oi")
    assert "sk-CHAVE-SECRETA" not in str(capturado.value)


def test_sem_chave_configurada_levanta_erro_claro(make_settings):
    with pytest.raises(LLMNotConfiguredError):
        OpenAIClient(make_settings())


def test_inicializa_o_sdk_com_a_configuracao(monkeypatch, make_settings):
    recebido = {}

    class SdkCapturado:
        def __init__(self, **kwargs):
            recebido.update(kwargs)

    monkeypatch.setattr(modulo, "OpenAI", SdkCapturado)
    OpenAIClient(
        make_settings(
            openai_api_key="chave-x",
            openai_base_url="https://servico.test/v1",
            openai_timeout_seconds=12,
            openai_max_retries=4,
        )
    )
    assert recebido == {
        "api_key": "chave-x",
        "base_url": "https://servico.test/v1",
        "timeout": 12,
        "max_retries": 4,
    }


def test_qualquer_cliente_compativel_pode_substituir_o_da_openai():
    """O resto do sistema depende de `LLMClient`, não do SDK: um dublê cumpre o contrato."""

    class Dubles:
        def complete(self, prompt, *, system=None, max_output_tokens=None):
            return LLMResult(text=f"eco: {prompt}", model="dubles")

    def consumidor(llm: LLMClient) -> str:
        return llm.complete("teste").text

    assert consumidor(Dubles()) == "eco: teste"


def test_teste_manual_imprime_a_resposta(monkeypatch, capsys):
    class Falso:
        def complete(self, prompt, *, system=None, max_output_tokens=None):
            return LLMResult(text="ok", model="m")

    monkeypatch.setattr(modulo, "build_llm_client", lambda _s: Falso())
    assert modulo._main(["Responda", "ok"]) == 0
    assert "[m] ok" in capsys.readouterr().out


def test_teste_manual_sem_chave_falha_com_mensagem_clara(monkeypatch, capsys):
    monkeypatch.setattr(modulo, "load_settings", lambda: Settings(_env_file=None))
    assert modulo._main([]) == 1
    assert "LLMNotConfiguredError" in capsys.readouterr().err
