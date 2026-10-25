"""Adaptadores reais testados com transporte HTTP simulado (sem rede, sem créditos)."""
import json

import httpx
import pytest

from atlas.provedores.busca import DemoBusca, TavilyBusca
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import GeminiLLM, extrair_json


def cliente(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def resposta_gemini(texto: str) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": texto}]}}], "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 30}}


async def test_gemini_le_json_e_uso_e_envia_chave_no_header():
    vistos = {}

    def h(req: httpx.Request):
        vistos["header"] = req.headers.get("x-goog-api-key")
        vistos["url"] = str(req.url)
        vistos["corpo"] = json.loads(req.content)
        return httpx.Response(200, json=resposta_gemini('{"ok": true}'))

    llm = GeminiLLM("segredo", "gemini-teste", tentativas=1, cliente=cliente(h))
    r = await llm.gerar_json("t", "sistema", "usuario", {})
    assert r.dados == {"ok": True} and (r.tokens_entrada, r.tokens_saida) == (120, 30)
    assert vistos["header"] == "segredo" and "segredo" not in vistos["url"]
    assert vistos["corpo"]["generationConfig"]["responseMimeType"] == "application/json"


def test_extrair_json_com_cerca_e_texto():
    assert extrair_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert extrair_json('Aqui está: {"a": 2} fim') == {"a": 2}
    with pytest.raises(ErroProvedor) as e:
        extrair_json("sem json")
    assert e.value.motivo == "resposta_invalida"
    with pytest.raises(ErroProvedor):
        extrair_json("[1, 2]")


@pytest.mark.parametrize(
    "status,texto,motivo,temporario",
    [
        (429, "Quota exceeded for metric generate_content_free_tier_requests, limit per minute", "cota", True),
        (429, "Quota exceeded ... GenerateRequestsPerDayPerProjectPerModel-FreeTier", "cota_diaria", False),
        (401, "API key not valid", "chave", False),
        (403, "forbidden", "chave", False),
        (503, "overloaded", "indisponivel", True),
        (400, "bad", "resposta_invalida", False),
    ],
)
async def test_gemini_classifica_erros(status, texto, motivo, temporario):
    llm = GeminiLLM("k", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(status, text=texto)))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == motivo and e.value.temporario is temporario


async def test_gemini_resposta_bloqueada_e_json_invalido():
    llm = GeminiLLM("k", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(200, json={"candidates": []})))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == "resposta_invalida"
    llm = GeminiLLM("k", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(200, json=resposta_gemini("{quebrado"))))
    with pytest.raises(ErroProvedor):
        await llm.gerar_json("t", "s", "u", {})


async def test_gemini_ignora_partes_de_raciocinio():
    corpo = {"candidates": [{"content": {"parts": [{"text": "pensando...", "thought": True}, {"text": '{"x": 1}'}]}}]}
    llm = GeminiLLM("k", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(200, json=corpo)))
    assert (await llm.gerar_json("t", "s", "u", {})).dados == {"x": 1}


async def test_gemini_timeout_vira_erro_temporario():
    def h(req):
        raise httpx.ReadTimeout("lento", request=req)

    llm = GeminiLLM("k", "m", tentativas=1, cliente=cliente(h))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == "timeout" and e.value.temporario


async def test_gemini_nao_repete_erro_definitivo():
    n = {"c": 0}

    def h(req):
        n["c"] += 1
        return httpx.Response(401, text="no")

    llm = GeminiLLM("k", "m", tentativas=3, cliente=cliente(h))
    with pytest.raises(ErroProvedor):
        await llm.gerar_json("t", "s", "u", {})
    assert n["c"] == 1


async def test_tavily_mapeia_e_descarta_resultados_sem_url():
    vistos = {}

    def h(req):
        vistos["auth"] = req.headers.get("authorization")
        vistos["corpo"] = json.loads(req.content)
        return httpx.Response(200, json={"results": [
            {"title": "USTR", "url": "https://www.ustr.gov/x", "content": "texto", "published_date": "2026-09-01"},
            {"title": "sem url", "content": "x"},
            {"title": "url ruim", "url": "javascript:alert(1)", "content": "x"},
        ]})

    b = TavilyBusca("tv-k", tentativas=1, cliente=cliente(h))
    res = await b.buscar("tarifas " * 100, 25)
    assert len(res) == 1 and res[0].publicador == "ustr.gov" and res[0].data_publicacao == "2026-09-01"
    assert vistos["auth"] == "Bearer tv-k"
    assert vistos["corpo"]["max_results"] == 10 and len(vistos["corpo"]["query"]) <= 400


@pytest.mark.parametrize("status,motivo", [(432, "cota_diaria"), (433, "cota_diaria"), (429, "cota"), (401, "chave"), (500, "indisponivel")])
async def test_tavily_classifica_erros(status, motivo):
    b = TavilyBusca("k", tentativas=1, cliente=cliente(lambda req: httpx.Response(status, json={})))
    with pytest.raises(ErroProvedor) as e:
        await b.buscar("q", 3)
    assert e.value.motivo == motivo


async def test_tavily_timeout():
    def h(req):
        raise httpx.ConnectTimeout("x", request=req)

    with pytest.raises(ErroProvedor) as e:
        await TavilyBusca("k", tentativas=1, cliente=cliente(h)).buscar("q", 3)
    assert e.value.motivo == "timeout"


async def test_demo_busca_nao_inventa_fontes():
    assert await DemoBusca().buscar("qualquer", 5) == []


async def test_gemini_envia_nivel_de_raciocinio_so_se_configurado():
    corpos = []

    def h(req):
        corpos.append(json.loads(req.content))
        return httpx.Response(200, json=resposta_gemini("{}"))

    await GeminiLLM("k", "m", tentativas=1, cliente=cliente(h), nivel_raciocinio="low").gerar_json("t", "s", "u", {})
    await GeminiLLM("k", "m", tentativas=1, cliente=cliente(h)).gerar_json("t", "s", "u", {})
    assert corpos[0]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "low"}
    assert "thinkingConfig" not in corpos[1]["generationConfig"]
