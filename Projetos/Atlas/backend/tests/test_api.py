"""Rotas HTTP, validações, limites e persistência do histórico."""
import asyncio
from dataclasses import replace

import httpx
import pytest

from atlas.main import criar_app
from atlas.persistencia import Banco
from atlas.provedores.busca import DemoBusca
from atlas.provedores.llm import DemoLLM

from .conftest import FakeBusca, FakeLLM


def app_com(cfg, banco, fabrica):
    return criar_app(cfg, banco, fabrica_provedores=fabrica)


@pytest.fixture
def demo(cfg):
    return replace(cfg, gemini_api_key="", tavily_api_key="", modo="demo")


class _Cliente:
    """Cliente HTTP com o cabeçalho de proteção e, por padrão, já com uma conta de aluno logada."""

    def __init__(self, app, email="aluna@exemplo.edu", senha="senha-segura-1", papel="aluno", login="cadastro"):
        self.c = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t", headers={"X-ATLAS": "1"})
        self.email, self.senha, self.papel, self.login = email, senha, papel, login

    async def __aenter__(self):
        await self.c.__aenter__()
        if self.login == "cadastro":
            r = await self.c.post("/api/auth/cadastro", json={"nome": "Ana", "email": self.email, "senha": self.senha, "papel": self.papel, "aceite_termos": True})
            assert r.status_code == 201, r.text
        elif self.login == "entrar":
            r = await self.c.post("/api/auth/entrar", json={"email": self.email, "senha": self.senha})
            assert r.status_code == 200, r.text
        return self.c

    async def __aexit__(self, *a):
        await self.c.__aexit__(*a)


async def cliente(app, **kw):
    return _Cliente(app, **kw)


async def esperar(c, sim_id, limite=100):
    for _ in range(limite):
        r = (await c.get(f"/api/simulacoes/{sim_id}")).json()
        if r["status"] not in ("pendente", "executando"):
            return r
        await asyncio.sleep(0.01)
    raise AssertionError("simulação não terminou")


CORPO = {"caso_id": "eua-china-tarifas", "valores": {"tarifa": 90, "retaliacao": 80}, "horizonte_meses": 18, "premissas_extra": ["Sem recessão global"]}


async def test_saude_e_catalogo(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        s = (await c.get("/api/saude")).json()
        assert s["modo"]["demonstrativo"] and not any(s["credenciais"].values())
        assert "x" not in str(s["credenciais"])  # nunca expõe chaves
        casos = (await c.get("/api/casos")).json()
        assert len(casos) >= 5 and all(len(k["variaveis"]) >= 4 for k in casos)
        assert (await c.get("/api/casos/inexistente")).status_code == 404
        modelo = (await c.get("/api/casos/personalizado")).json()
        assert modelo["personalizado"] and {v["id"] for v in modelo["variaveis"]} >= {"intensidade", "diplomacia"}


async def test_fluxo_demo_ponta_a_ponta(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        r = await c.post("/api/simulacoes", json=CORPO)
        assert r.status_code == 202 and r.json()["modo"]["ia"] == "demo"
        res = await esperar(c, r.json()["id"])
        assert res["status"] == "concluida"
        assert {x["tipo"] for x in res["analise"]["cenarios"]} == {"continuidade", "escalada", "desescalada"}
        assert "Sem recessão global" in res["registro"]["premissas"]
        assert res["motor"]["formula"]
        ev = (await c.get(f"/api/simulacoes/{res['id']}/eventos")).json()
        assert ev[0]["seq"] == 1 and ev[-1]["tipo"] == "fim"
        assert {e["agente"] for e in ev} >= {"orquestrador", "researcher", "analyst", "verifier"}
        depois = (await c.get(f"/api/simulacoes/{res['id']}/eventos", params={"desde": ev[-2]["seq"]})).json()
        assert len(depois) == 1
        hist = (await c.get("/api/simulacoes")).json()
        assert hist[0]["id"] == res["id"]


async def test_fluxo_com_provedores_reais_simulados(cfg, banco):
    async with await cliente(app_com(cfg, banco, lambda c: (FakeLLM(), FakeBusca()))) as c:
        r = await c.post("/api/simulacoes", json=CORPO)
        res = await esperar(c, r.json()["id"])
        assert res["status"] == "concluida" and not res["modo"]["demonstrativo"]
        assert res["evidencias"]["fontes"][0]["url"].startswith("https://")


@pytest.mark.parametrize("corpo,trecho", [
    ({**CORPO, "valores": {"inventada": 1}}, "não pertencem"),
    ({**CORPO, "valores": {"tarifa": 999}}, "deve estar entre"),
    ({**CORPO, "caso_id": "nao-existe"}, "Caso desconhecido"),
    ({"caso_id": "personalizado", "descricao_personalizada": "curta", "horizonte_meses": 6}, "20 caracteres"),
    ({**CORPO, "base_id": "nao-existe"}, "base não encontrada"),
])
async def test_validacoes_422(demo, banco, corpo, trecho):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        r = await c.post("/api/simulacoes", json=corpo)
        assert r.status_code == 422 and trecho in r.text


async def test_horizonte_fora_da_faixa(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        assert (await c.post("/api/simulacoes", json={**CORPO, "horizonte_meses": 120})).status_code == 422


async def test_caso_personalizado(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        r = await c.post("/api/simulacoes", json={"caso_id": "personalizado", "titulo_personalizado": "Disputa no Ártico", "descricao_personalizada": "Tensão entre países árticos por rotas marítimas e recursos.", "horizonte_meses": 12})
        assert r.status_code == 202
        res = await esperar(c, r.json()["id"])
        assert res["caso"]["titulo"] == "Disputa no Ártico" and res["status"] in ("concluida", "parcial")


async def test_corpo_grande_413(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        r = await c.post("/api/simulacoes", content=b"x" * (70 * 1024), headers={"content-type": "application/json"})
        assert r.status_code == 413


async def test_limite_por_minuto_429(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        codigos = [(await c.post("/api/simulacoes", json=CORPO)).status_code for _ in range(7)]
        assert codigos[:6] == [202] * 6 and codigos[6] == 429
        await asyncio.sleep(0.2)


async def test_limite_diario_com_ia(cfg, banco):
    banco.somar_uso(simulacoes=cfg.max_simulacoes_dia)
    async with await cliente(app_com(cfg, banco, lambda c: (FakeLLM(), FakeBusca()))) as c:
        r = await c.post("/api/simulacoes", json=CORPO)
        assert r.status_code == 429 and "Limite diário" in r.text


async def test_comparacao_e_apagar(demo, banco):
    async with await cliente(app_com(demo, banco, lambda c: (DemoLLM(), DemoBusca()))) as c:
        a = await esperar(c, (await c.post("/api/simulacoes", json=CORPO)).json()["id"])
        b = await esperar(c, (await c.post("/api/simulacoes", json={**CORPO, "valores": {"tarifa": 10, "retaliacao": 10, "diplomacia": 90}, "base_id": a["id"]})).json()["id"])
        cmp = (await c.get("/api/comparar", params={"a": a["id"], "b": b["id"]})).json()
        assert cmp["mesmo_caso"] and {v["id"] for v in cmp["variaveis"]} == {"tarifa", "retaliacao", "diplomacia"}
        assert cmp["indices"]["propensao_escalada"][0] > cmp["indices"]["propensao_escalada"][1]
        assert cmp["mudancas"] and "não demonstra" in cmp["aviso"]
        assert (await c.get("/api/comparar", params={"a": a["id"], "b": "zzz"})).status_code == 404
        assert (await c.delete(f"/api/simulacoes/{a['id']}")).status_code == 204
        assert (await c.get(f"/api/simulacoes/{a['id']}")).status_code == 404
        assert (await c.delete(f"/api/simulacoes/{a['id']}")).status_code == 404


async def test_historico_persiste_entre_reinicios(demo):
    async with await cliente(app_com(demo, Banco(demo.db_path), lambda c: (DemoLLM(), DemoBusca()))) as c:
        sim = await esperar(c, (await c.post("/api/simulacoes", json=CORPO)).json()["id"])
    async with await cliente(app_com(demo, Banco(demo.db_path), lambda c: (DemoLLM(), DemoBusca())), login="entrar") as c:
        hist = (await c.get("/api/simulacoes")).json()
        assert [h["id"] for h in hist] == [sim["id"]]
        assert (await c.get(f"/api/simulacoes/{sim['id']}")).json()["status"] == "concluida"
