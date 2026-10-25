"""Roteador de modelos: rotas por agente, fallback por cota/erro e contabilidade."""
from dataclasses import replace

import pytest

from atlas.config import Config
from atlas.orquestrador import Orquestrador, preparar, provedores
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import RoteadorLLM

from .conftest import FakeBusca, FakeLLM


def base_cfg(**kw):
    c = replace(Config(), gemini_api_key=None, tavily_api_key=None, openai_base_url=None, openai_model=None, provedor_ia="roteado", provedor_busca="auto", modo="auto", rotas_txt="")
    return replace(c, **kw)


def test_rotas_padrao_e_personalizadas():
    c = base_cfg(gemini_api_key="g", openai_base_url="https://api.groq.com/openai/v1", openai_model="m")
    assert c.ia == "roteado"
    assert c.rotas == {"researcher": ["openai", "gemini"], "analyst": ["gemini", "openai"], "verifier": ["openai", "gemini"]}
    c2 = replace(c, rotas_txt="analyst=openai,gemini; verifier=gemini; researcher=inexistente")
    assert c2.rotas["analyst"] == ["openai", "gemini"] and c2.rotas["verifier"] == ["gemini"]
    assert c2.rotas["researcher"] == ["openai", "gemini"]  # provedor inválido é ignorado
    assert base_cfg().ia == "demo"  # sem provedores configurados, não finge ter IA


def test_fabrica_monta_roteador_com_provedores_configurados():
    c = base_cfg(gemini_api_key="g", openai_base_url="https://api.groq.com/openai/v1", openai_model="m")
    llm, _ = provedores(c)
    assert isinstance(llm, RoteadorLLM) and set(llm.provedores) == {f"gemini:{c.gemini_model}", "openai"}
    assert llm.provedores[f"gemini:{c.gemini_model}"].tentativas == 1  # no roteamento, falha rápido e passa adiante


async def test_cada_agente_usa_sua_rota():
    g, o = FakeLLM("gemini"), FakeLLM("openai")
    r = RoteadorLLM({"gemini": g, "openai": o}, {"researcher": ["openai", "gemini"], "analyst": ["gemini", "openai"], "verifier": ["openai"]})
    assert (await r.gerar_json("analisar", "s", "u", {})).provedor == "gemini"
    assert (await r.gerar_json("extrair_evidencias", "s", "u", {})).provedor == "openai"
    assert (await r.gerar_json("verificar", "s", "u", {})).provedor == "openai"
    assert g.contar("analisar") == 1 and o.contar("analisar") == 0


async def test_fallback_quando_provedor_estoura_cota():
    g = FakeLLM("gemini", respostas={"analisar": ErroProvedor("cota", "Limite do Gemini atingido.", temporario=True)})
    o = FakeLLM("openai")
    r = RoteadorLLM({"gemini": g, "openai": o}, {"analyst": ["gemini", "openai"]})
    resp = await r.gerar_json("analisar", "s", "u", {})
    assert resp.provedor == "openai" and resp.chamadas == 2
    assert resp.avisos and "Gemini falhou" in resp.avisos[0]


async def test_cota_diaria_tira_provedor_da_rotacao():
    g = FakeLLM("gemini", respostas={"analisar": ErroProvedor("cota_diaria", "cota diária")})
    o = FakeLLM("openai")
    r = RoteadorLLM({"gemini": g, "openai": o}, {"analyst": ["gemini", "openai"]})
    await r.gerar_json("analisar", "s", "u", {})
    await r.gerar_json("analisar", "s", "u2", {})
    assert g.contar("analisar") == 1 and o.contar("analisar") == 2


async def test_todos_falham_gera_erro_claro(monkeypatch):
    async def dormir(s):
        return None

    monkeypatch.setattr("atlas.provedores.llm.asyncio.sleep", dormir)
    g = FakeLLM("gemini", respostas={"analisar": ErroProvedor("timeout", "lento", temporario=True)})
    o = FakeLLM("openai", respostas={"analisar": ErroProvedor("cota", "TPM", temporario=True)})
    r = RoteadorLLM({"gemini": g, "openai": o}, {"analyst": ["gemini", "openai"]})
    with pytest.raises(ErroProvedor) as e:
        await r.gerar_json("analisar", "s", "u", {})
    assert e.value.motivo == "cota" and "Todos os provedores falharam" in e.value.mensagem


async def test_erro_nao_recuperavel_nao_passa_adiante():
    g = FakeLLM("gemini", respostas={"analisar": ErroProvedor("limite_local", "teto")})
    o = FakeLLM("openai")
    r = RoteadorLLM({"gemini": g, "openai": o}, {"analyst": ["gemini", "openai"]})
    with pytest.raises(ErroProvedor):
        await r.gerar_json("analisar", "s", "u", {})
    assert o.contar("analisar") == 0


async def test_fluxo_completo_roteado_registra_provedores_e_avisos(cfg, banco, entrada):
    g = FakeLLM("gemini", respostas={"analisar": [ErroProvedor("cota", "Limite do Gemini atingido.", temporario=True), None]})
    o = FakeLLM("openai")
    llm = RoteadorLLM({"gemini": g, "openai": o}, {"researcher": ["openai", "gemini"], "analyst": ["gemini", "openai"], "verifier": ["openai", "gemini"]})
    r = await Orquestrador(cfg, banco, llm, FakeBusca()).executar(preparar(entrada, cfg, banco, llm, FakeBusca()))
    assert r.status == "concluida" and r.modo.ia == "roteado" and not r.modo.demonstrativo
    assert r.uso.por_provedor == {"openai": 3}  # extração, análise (fallback) e verificação
    assert r.uso.chamadas_llm == 4  # a tentativa que falhou no Gemini também conta no teto
    eventos = banco.eventos(r.id, 0)
    assert any(e.agente == "analyst" and e.tipo == "aviso" and "Gemini falhou" in e.mensagem for e in eventos)


async def test_falhas_temporarias_esperam_e_tentam_outra_volta(monkeypatch):
    esperas = []

    async def dormir(s):
        esperas.append(s)

    monkeypatch.setattr("atlas.provedores.llm.asyncio.sleep", dormir)
    g = FakeLLM("gemini", respostas={"analisar": [ErroProvedor("indisponivel", "HTTP 503", temporario=True), None]})
    o = FakeLLM("openai", respostas={"analisar": ErroProvedor("cota", "TPM", temporario=True, espera_s=12)})
    r = RoteadorLLM({"gemini": g, "openai": o}, {"analyst": ["gemini", "openai"]})
    resp = await r.gerar_json("analisar", "s", "u", {})
    assert resp.provedor == "gemini" and resp.chamadas == 3 and esperas == [12]
    assert any("nova tentativa em 12 s" in a for a in resp.avisos)


async def test_falha_definitiva_nao_espera(monkeypatch):
    esperas = []

    async def dormir(s):
        esperas.append(s)

    monkeypatch.setattr("atlas.provedores.llm.asyncio.sleep", dormir)
    g = FakeLLM("gemini", respostas={"analisar": ErroProvedor("chave", "recusada")})
    r = RoteadorLLM({"gemini": g}, {"analyst": ["gemini"]})
    with pytest.raises(ErroProvedor):
        await r.gerar_json("analisar", "s", "u", {})
    assert esperas == [] and g.contar("analisar") == 1


def test_varios_modelos_gemini_viram_provedores_separados():
    c = base_cfg(gemini_api_key="g", gemini_modelos_txt="gemini-3.7-flash, gemini-3.6-flash", openai_base_url="https://api.groq.com/openai/v1", openai_model="m")
    llm, _ = provedores(c)
    assert list(llm.provedores) == ["gemini:gemini-3.7-flash", "gemini:gemini-3.6-flash", "openai"]
    assert llm.rotas["analyst"] == ["gemini:gemini-3.7-flash", "gemini:gemini-3.6-flash", "openai"]
    assert llm.rotas["researcher"] == ["openai", "gemini:gemini-3.7-flash", "gemini:gemini-3.6-flash"]
    assert llm.provedores["gemini:gemini-3.6-flash"].modelo == "gemini-3.6-flash"


async def test_cota_diaria_de_um_modelo_passa_para_o_proximo_modelo():
    a = FakeLLM("gemini", respostas={"analisar": ErroProvedor("cota_diaria", "Cota diária do gemini-3.6-flash atingido.")})
    b = FakeLLM("gemini")
    r = RoteadorLLM({"gemini:gemini-3.6-flash": a, "gemini:gemini-3.7-flash": b}, {"analyst": ["gemini:gemini-3.6-flash", "gemini:gemini-3.7-flash"]})
    resp = await r.gerar_json("analisar", "s", "u", {})
    assert resp.provedor == "gemini:gemini-3.7-flash"
    assert "Gemini (gemini-3.6-flash) falhou" in resp.avisos[0]
