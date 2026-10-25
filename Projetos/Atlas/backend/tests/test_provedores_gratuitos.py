"""Provedores gratuitos: Ollama / APIs compatíveis com OpenAI e GDELT (HTTP simulado)."""
import json
from dataclasses import replace

import httpx
import pytest

from atlas.config import Config
from atlas.orquestrador import Orquestrador, preparar, provedores
from atlas.provedores.busca import DemoBusca, GdeltBusca, TavilyBusca
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import CompatLLM, DemoLLM, GeminiLLM

from .conftest import analise_valida


def cliente(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def chat(conteudo: str) -> dict:
    return {"choices": [{"message": {"role": "assistant", "content": conteudo}}], "usage": {"prompt_tokens": 80, "completion_tokens": 20}}


# ------------------------------------------------------------ seleção por configuração
@pytest.mark.parametrize("env,ia,busca", [
    ({}, "demo", "demo"),
    ({"gemini_api_key": "k", "tavily_api_key": "t"}, "gemini", "tavily"),
    ({"provedor_ia": "ollama", "provedor_busca": "gdelt"}, "ollama", "gdelt"),
    ({"provedor_ia": "openai"}, "demo", "demo"),  # sem URL/modelo, não finge ter IA
    ({"provedor_ia": "openai", "openai_base_url": "https://api.groq.com/openai/v1", "openai_model": "m"}, "openai", "demo"),
    ({"provedor_ia": "ollama", "provedor_busca": "gdelt", "modo": "demo"}, "demo", "demo"),
])
def test_escolha_de_provedores(env, ia, busca):
    base = replace(Config(), gemini_api_key=None, tavily_api_key=None, provedor_ia="auto", provedor_busca="auto", modo="auto")
    cfg = replace(base, **env)
    llm, b = provedores(cfg)
    assert (llm.nome, b.nome) == (ia, busca)
    tipos = {"gemini": GeminiLLM, "ollama": CompatLLM, "openai": CompatLLM, "demo": DemoLLM}
    assert isinstance(llm, tipos[ia])
    assert isinstance(b, {"tavily": TavilyBusca, "gdelt": GdeltBusca, "demo": DemoBusca}[busca])


# ------------------------------------------------------------ Ollama / compatível com OpenAI
async def test_ollama_monta_pedido_sem_chave_e_le_json():
    visto = {}

    def h(req):
        visto["url"], visto["auth"], visto["corpo"] = str(req.url), req.headers.get("authorization"), json.loads(req.content)
        return httpx.Response(200, json=chat('{"ok": true}'))

    llm = CompatLLM("ollama", "http://localhost:11434", "qwen2.5:7b", tentativas=1, cliente=cliente(h))
    r = await llm.gerar_json("t", "sistema", "usuario", {})
    assert r.dados == {"ok": True} and (r.tokens_entrada, r.tokens_saida) == (80, 20)
    assert visto["url"] == "http://localhost:11434/v1/chat/completions"
    assert visto["auth"] is None
    assert visto["corpo"]["model"] == "qwen2.5:7b" and visto["corpo"]["response_format"] == {"type": "json_object"}
    assert [m["role"] for m in visto["corpo"]["messages"]] == ["system", "user"]


async def test_compat_com_chave_e_url_terminada_em_v1():
    visto = {}

    def h(req):
        visto["url"], visto["auth"] = str(req.url), req.headers.get("authorization")
        return httpx.Response(200, json=chat('```json\n{"a": 1}\n```'))

    llm = CompatLLM("openai", "https://api.groq.com/openai/v1/", "m", chave="gsk", tentativas=1, cliente=cliente(h))
    assert (await llm.gerar_json("t", "s", "u", {})).dados == {"a": 1}
    assert visto["url"] == "https://api.groq.com/openai/v1/chat/completions" and visto["auth"] == "Bearer gsk"


@pytest.mark.parametrize("status,texto,motivo", [
    (429, "rate limit reached for requests per minute", "cota"),
    (429, "tokens per day limit", "cota_diaria"),
    # mensagem real da Groq para limite POR MINUTO: contém "today", não pode virar cota diária
    (429, "Rate limit reached on tokens per minute (TPM): Limit 8000. Please try again in 11s. Need more tokens? Upgrade to Dev Tier today", "cota"),
    (429, "Rate limit reached on requests per day (RPD): Limit 1000", "cota_diaria"),
    (401, "invalid api key", "chave"),
    (404, "model not found", "resposta_invalida"),
    (500, "boom", "indisponivel"),
])
async def test_compat_classifica_erros(status, texto, motivo):
    llm = CompatLLM("openai", "https://x/v1", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(status, text=texto)))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == motivo


async def test_ollama_desligado_explica_o_que_fazer():
    def h(req):
        raise httpx.ConnectError("recusada", request=req)

    llm = CompatLLM("ollama", "http://localhost:11434", "qwen2.5:7b", tentativas=1, cliente=cliente(h))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == "indisponivel" and "ollama serve" in e.value.mensagem


async def test_modelo_ausente_sugere_pull():
    llm = CompatLLM("ollama", "http://localhost:11434", "qwen2.5:7b", tentativas=1, cliente=cliente(lambda req: httpx.Response(404, text="not found")))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert "ollama pull qwen2.5:7b" in e.value.mensagem


async def test_compat_resposta_sem_conteudo():
    llm = CompatLLM("openai", "https://x/v1", "m", tentativas=1, cliente=cliente(lambda req: httpx.Response(200, json={"choices": []})))
    with pytest.raises(ErroProvedor) as e:
        await llm.gerar_json("t", "s", "u", {})
    assert e.value.motivo == "resposta_invalida"


# ------------------------------------------------------------ GDELT
ARTIGOS = {"articles": [
    {"url": "https://www.reuters.com/world/x", "title": "US raises tariffs on Chinese goods", "seendate": "20261020T143000Z", "domain": "reuters.com", "language": "English", "sourcecountry": "United States"},
    {"url": "", "title": "sem url"},
    {"url": "ftp://x", "title": "protocolo inválido"},
    {"url": "https://example.cn/y", "title": "China responds", "seendate": "invalida", "domain": "example.cn"},
]}


async def test_gdelt_mapeia_artigos_sem_inventar_texto():
    visto = {}

    def h(req):
        visto["params"] = dict(req.url.params)
        return httpx.Response(200, text=json.dumps(ARTIGOS))

    res = await GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(h)).buscar("US China tariffs: o que vem?", 4)
    assert [r.url for r in res] == ["https://www.reuters.com/world/x", "https://example.cn/y"]
    assert res[0].data_publicacao == "2026-10-20" and res[0].publicador == "reuters.com"
    assert res[1].data_publicacao is None
    assert "não fornece o texto da matéria" in res[0].trecho
    assert visto["params"]["query"] == "China tariffs que vem"  # palavras com menos de 3 letras e símbolos removidos
    assert visto["params"]["mode"] == "artlist" and visto["params"]["format"] == "json"


async def test_gdelt_limite_de_frequencia_vira_cota_temporaria():
    aviso = "Please limit requests to one every 5 seconds or contact ..."
    b = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(429, text=aviso)))
    with pytest.raises(ErroProvedor) as e:
        await b.buscar("tariffs china", 3)
    assert e.value.motivo == "cota" and e.value.temporario
    b = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(200, text=aviso)))
    with pytest.raises(ErroProvedor):
        await b.buscar("tariffs china", 3)


async def test_gdelt_erro_de_consulta_em_texto_e_resposta_vazia():
    b = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(200, text="Your search contained a keyword that was too short.")))
    with pytest.raises(ErroProvedor) as e:
        await b.buscar("tariffs china", 3)
    assert e.value.motivo == "resposta_invalida" and "too short" in e.value.mensagem
    vazio = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(200, text="{}")))
    assert await vazio.buscar("tariffs china", 3) == []
    assert await vazio.buscar("a b", 3) == []  # nada pesquisável: não chama a API


async def test_gdelt_respeita_intervalo_entre_consultas():
    import time

    momentos = []

    def h(req):
        momentos.append(time.monotonic())
        return httpx.Response(200, text="{}")

    b = GdeltBusca(intervalo_s=0.3, tentativas=1, cliente=cliente(h))
    await b.buscar("tariffs china", 3)
    await b.buscar("sanctions russia", 3)
    assert momentos[1] - momentos[0] >= 0.29


async def test_gdelt_repete_apos_limite_temporario():
    respostas = [httpx.Response(429, text="Please limit requests"), httpx.Response(200, text=json.dumps(ARTIGOS))]
    b = GdeltBusca(intervalo_s=0, tentativas=2, cliente=cliente(lambda req: respostas.pop(0)))
    assert len(await b.buscar("tariffs china", 3)) == 2


# ------------------------------------------------------------ fluxo completo grátis
async def test_fluxo_completo_com_ollama_e_gdelt(cfg, banco, entrada):
    def ia(req):
        sistema = json.loads(req.content)["messages"][0]["content"]
        if sistema.startswith("Você é o Researcher"):
            corpo = {"evidencias": [{"afirmacao": "Reuters relata aumento de tarifas.", "fonte_ids": ["F1"], "status": "confirmado", "relacao": "favorece"}], "lacunas": ["Sem texto completo das matérias."]}
        elif sistema.startswith("Você é o Analyst"):
            corpo = analise_valida()
        else:
            corpo = {"problemas": [], "observacoes": ["ok"]}
        return httpx.Response(200, json=chat(json.dumps(corpo)))

    llm = CompatLLM("ollama", "http://localhost:11434", "qwen2.5:7b", tentativas=1, cliente=cliente(ia))
    busca = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(200, text=json.dumps(ARTIGOS))))
    r = await Orquestrador(cfg, banco, llm, busca).executar(preparar(entrada, cfg, banco, llm, busca))
    assert r.status == "concluida", r.erro
    assert not r.modo.demonstrativo and (r.modo.ia, r.modo.busca) == ("ollama", "gdelt")
    assert r.evidencias.fontes[0].url == "https://www.reuters.com/world/x"
    assert r.analise.resumo_executivo[0].natureza == "fato" and r.analise.resumo_executivo[0].evidencia_ids == ["E1"]
    assert banco.uso_hoje()["simulacoes"] == 0  # Ollama é local: não conta no teto diário


async def test_ollama_fechado_chega_ao_usuario_com_a_dica(cfg, banco, entrada):
    def recusa(req):
        raise httpx.ConnectError("recusada", request=req)

    llm = CompatLLM("ollama", "http://localhost:11434", "qwen2.5:7b", tentativas=1, cliente=cliente(recusa))
    busca = GdeltBusca(intervalo_s=0, tentativas=1, cliente=cliente(lambda req: httpx.Response(429, text="Please limit requests")))
    r = await Orquestrador(cfg, banco, llm, busca).executar(preparar(entrada, cfg, banco, llm, busca))
    assert r.status == "falhou" and r.evidencias.fontes == []
    assert "ollama serve" in r.erro
    assert any("intervalo maior" in a for a in r.avisos)  # GDELT: mensagem própria, sem falar em "plano"
    assert not any("plano gratuito" in a for a in r.avisos)


def test_descrever_nao_repete_texto():
    from atlas.provedores.erros import descrever

    assert descrever(ErroProvedor("timeout", "")) == "O serviço externo não respondeu a tempo."
    assert descrever(ErroProvedor("chave", "Chave da Tavily recusada")).endswith("Chave da Tavily recusada.")


async def test_ia_real_sem_busca_nao_inventa_evidencias(cfg, banco, entrada):
    """Com IA real e sem busca, a IA nunca é chamada para produzir evidências."""
    from atlas.provedores.busca import DemoBusca

    from .conftest import FakeLLM

    llm = FakeLLM(respostas={"evidencias_demo": {"evidencias": [{"afirmacao": "FATO INVENTADO", "fonte_ids": [], "status": "confirmado"}]}})
    r = await Orquestrador(cfg, banco, llm, DemoBusca()).executar(preparar(entrada, cfg, banco, llm, DemoBusca()))
    assert llm.contar("evidencias_demo") == 0 and llm.contar("extrair_evidencias") == 0
    assert all(e.status == "incerto" and not e.fonte_ids for e in r.evidencias.evidencias)
    assert not any("INVENTADO" in e.afirmacao for e in r.evidencias.evidencias)
    assert r.modo.demonstrativo


async def test_compat_respeita_retry_after(monkeypatch):
    esperas = []

    async def dormir(s):
        esperas.append(s)

    monkeypatch.setattr("atlas.provedores.llm.asyncio.sleep", dormir)
    respostas = [httpx.Response(429, text="tokens per minute", headers={"retry-after": "7"}), httpx.Response(200, json=chat('{"ok": 1}'))]
    llm = CompatLLM("openai", "https://x/v1", "m", tentativas=2, cliente=cliente(lambda req: respostas.pop(0)))
    assert (await llm.gerar_json("t", "s", "u", {})).dados == {"ok": 1}
    assert esperas == [7.0]


async def test_compat_envia_esforco_de_raciocinio_so_quando_configurado():
    corpos = []

    def h(req):
        corpos.append(json.loads(req.content))
        return httpx.Response(200, json=chat("{}"))

    await CompatLLM("openai", "https://x/v1", "m", tentativas=1, cliente=cliente(h), esforco_raciocinio="low").gerar_json("t", "s", "u", {})
    await CompatLLM("ollama", "http://localhost:11434", "m", tentativas=1, cliente=cliente(h)).gerar_json("t", "s", "u", {})
    assert corpos[0]["reasoning_effort"] == "low" and "reasoning_effort" not in corpos[1]
