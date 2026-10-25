"""Integração com o OmniRoute (gateway local compatível com a API da OpenAI). HTTP simulado."""
import json
from dataclasses import replace

import httpx
import pytest

from atlas.config import Config
from atlas.orquestrador import provedores
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import CompatLLM, RoteadorLLM


def base_cfg(**kw):
    c = replace(Config(), gemini_api_key=None, tavily_api_key=None, openai_base_url=None, openai_model=None, provedor_busca="auto", modo="auto", rotas_txt="")
    return replace(c, **kw)


def test_preset_omniroute_usa_padroes_locais_e_gratuitos():
    c = base_cfg(provedor_ia="omniroute")
    llm, _ = provedores(c)
    assert isinstance(llm, CompatLLM) and llm.nome == "omniroute"
    assert llm.url == "http://localhost:20128/v1/chat/completions"
    assert llm.modelo == "auto/best-free" and llm.timeout_s >= 120
    assert c.modelo_ia == "auto/best-free"


def test_omniroute_entra_no_roteador_quando_citado_nas_rotas():
    c = base_cfg(provedor_ia="roteado", gemini_api_key="g", rotas_txt="analyst=omniroute,gemini;researcher=gemini,omniroute")
    llm, _ = provedores(c)
    assert isinstance(llm, RoteadorLLM)
    assert llm.rotas["analyst"][0] == "omniroute" and "omniroute" in llm.provedores


async def test_omniroute_envia_combo_e_chave_opcional():
    visto = {}

    def h(req):
        visto["url"], visto["auth"], visto["corpo"] = str(req.url), req.headers.get("authorization"), json.loads(req.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": '{"ok": true}'}}], "usage": {"prompt_tokens": 1, "completion_tokens": 1}})

    llm = CompatLLM("omniroute", "http://localhost:20128/v1", "meu-combo", chave="or-key", tentativas=1, cliente=httpx.AsyncClient(transport=httpx.MockTransport(h)))
    assert (await llm.gerar_json("t", "s", "u", {})).dados == {"ok": True}
    assert visto["url"] == "http://localhost:20128/v1/chat/completions"
    assert visto["auth"] == "Bearer or-key" and visto["corpo"]["model"] == "meu-combo"


async def test_omniroute_desligado_explica_o_que_fazer():
    def h(req):
        raise httpx.ConnectError("recusada", request=req)

    llm = CompatLLM("omniroute", "http://localhost:20128/v1", "auto/best-free", tentativas=1, cliente=httpx.AsyncClient(transport=httpx.MockTransport(h)))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert "OmniRoute está rodando" in e.value.mensagem


async def test_pedido_desliga_streaming_explicitamente():
    corpos = []

    def h(req):
        corpos.append(json.loads(req.content))
        return httpx.Response(200, json={"choices": [{"message": {"content": "{}"}}]})

    llm = CompatLLM("omniroute", "http://localhost:20128/v1", "atlas", tentativas=1, cliente=httpx.AsyncClient(transport=httpx.MockTransport(h)))
    await llm.gerar_json("t", "s", "u", {})
    assert corpos[0]["stream"] is False
