"""Contas, sessões, turmas e permissões do ATLAS SaaS."""
import asyncio
import sqlite3
from dataclasses import replace

import httpx
import pytest

from atlas.contas import conferir_senha, gerar_hash
from atlas.main import criar_app
from atlas.persistencia import Banco
from atlas.provedores.busca import DemoBusca
from atlas.provedores.llm import DemoLLM

CORPO = {"caso_id": "eua-china-tarifas", "valores": {}, "horizonte_meses": 12}


@pytest.fixture
def demo(cfg):
    return replace(cfg, gemini_api_key="", tavily_api_key="", modo="demo", admin_emails=("admin@atlas.edu",), limite_usuario_dia=10)


def nova_app(cfg, banco=None):
    return criar_app(cfg, banco or Banco(cfg.db_path), fabrica_provedores=lambda c: (DemoLLM(), DemoBusca()))


def http(app):
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t", headers={"X-ATLAS": "1"})


async def cadastrar(c, email, papel="aluno", nome="Pessoa", senha="senha-segura-1", **extra):
    r = await c.post("/api/auth/cadastro", json={"nome": nome, "email": email, "senha": senha, "papel": papel, "aceite_termos": True, **extra})
    assert r.status_code == 201, r.text
    return r.json()


async def esperar(c, sim_id):
    for _ in range(200):
        r = (await c.get(f"/api/simulacoes/{sim_id}")).json()
        if r["status"] not in ("pendente", "executando"):
            return r
        await asyncio.sleep(0.01)
    raise AssertionError("não terminou")


def test_hash_de_senha():
    h = gerar_hash("minha-senha-123")
    assert h.startswith("scrypt$") and "minha-senha-123" not in h
    assert conferir_senha("minha-senha-123", h) and not conferir_senha("outra", h)
    assert not conferir_senha("x", "lixo") and gerar_hash("a") != gerar_hash("a")  # sal aleatório


async def test_cadastro_login_sessao_e_logout(demo):
    app = nova_app(demo)
    async with http(app) as c:
        r = await c.post("/api/auth/cadastro", json={"nome": "Ana", "email": "  Ana@Exemplo.EDU ", "senha": "senha-segura-1", "papel": "aluno", "aceite_termos": True})
        assert r.status_code == 201 and r.json()["usuario"]["email"] == "ana@exemplo.edu"
        cookie = r.headers["set-cookie"].lower()
        assert "httponly" in cookie and "samesite=lax" in cookie
        eu = (await c.get("/api/auth/eu")).json()
        assert eu["papel"] == "aluno" and eu["limite_dia"] == 10 and "senha" not in str(eu)
        assert (await c.post("/api/auth/sair")).status_code == 204
        assert (await c.get("/api/auth/eu")).status_code == 401
    # o banco guarda só o hash do token de sessão, nunca o token
    async with http(app) as c:
        r = await c.post("/api/auth/entrar", json={"email": "ana@exemplo.edu", "senha": "senha-segura-1"})
        token = c.cookies.get("atlas_sessao")
        assert r.status_code == 200 and token
    linhas = sqlite3.connect(demo.db_path).execute("SELECT token_hash FROM sessoes").fetchall()
    assert linhas and all(token not in l[0] for l in linhas)


async def test_validacoes_de_cadastro(demo):
    async with http(nova_app(demo)) as c:
        base = {"nome": "Ana", "email": "ana@exemplo.edu", "senha": "senha-segura-1", "papel": "aluno"}
        assert (await c.post("/api/auth/cadastro", json={**base, "aceite_termos": False})).status_code == 422
        assert (await c.post("/api/auth/cadastro", json={**base, "senha": "curta", "aceite_termos": True})).status_code == 422
        assert (await c.post("/api/auth/cadastro", json={**base, "email": "sem-arroba", "aceite_termos": True})).status_code == 422
        assert (await c.post("/api/auth/cadastro", json={**base, "papel": "admin", "aceite_termos": True})).status_code == 422  # ninguém se cadastra como admin
        assert (await c.post("/api/auth/cadastro", json={**base, "aceite_termos": True})).status_code == 201
        assert (await c.post("/api/auth/cadastro", json={**base, "aceite_termos": True})).status_code == 409


async def test_login_errado_nao_revela_se_email_existe(demo):
    app = nova_app(demo)
    async with http(app) as c:
        await cadastrar(c, "ana@exemplo.edu")
    async with http(app) as c:
        a = await c.post("/api/auth/entrar", json={"email": "ana@exemplo.edu", "senha": "errada"})
        b = await c.post("/api/auth/entrar", json={"email": "ninguem@exemplo.edu", "senha": "errada"})
        assert a.status_code == b.status_code == 401 and a.json() == b.json()


async def test_forca_bruta_limitada(demo):
    async with http(nova_app(demo)) as c:
        codigos = [(await c.post("/api/auth/entrar", json={"email": "x@exemplo.edu", "senha": "errada"})).status_code for _ in range(11)]
        assert codigos[:10] == [401] * 10 and codigos[10] == 429


async def test_protecao_contra_requisicao_forjada_e_rotas_privadas(demo):
    app = nova_app(demo)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        r = await c.post("/api/auth/cadastro", json={"nome": "A", "email": "a@exemplo.edu", "senha": "senha-segura-1", "papel": "aluno", "aceite_termos": True})
        assert r.status_code == 403  # sem o cabeçalho X-ATLAS
        assert (await c.get("/api/simulacoes")).status_code == 401
        assert (await c.get("/api/turmas")).status_code == 401
        assert (await c.get("/api/casos")).status_code == 200  # catálogo é público
        assert (await c.get("/api/saude")).headers["x-frame-options"] == "DENY"


async def test_admin_definido_por_variavel_de_ambiente(demo):
    async with http(nova_app(demo)) as c:
        d = await cadastrar(c, "admin@atlas.edu", papel="professor")
        assert d["usuario"]["papel"] == "admin" and d["usuario"]["limite_dia"] is None
        assert (await c.get("/api/admin/resumo")).status_code == 200
    async with http(nova_app(replace(demo, db_path=demo.db_path.with_name("b.db")))) as c:
        await cadastrar(c, "prof@exemplo.edu", papel="professor")
        assert (await c.get("/api/admin/resumo")).status_code == 403


async def test_fluxo_de_turma_e_visibilidade(demo):
    app = nova_app(demo)
    async with http(app) as prof, http(app) as ana, http(app) as beto:
        await cadastrar(prof, "prof@exemplo.edu", papel="professor", nome="Profa. Lima")
        await cadastrar(ana, "ana@exemplo.edu", nome="Ana")
        await cadastrar(beto, "beto@exemplo.edu", nome="Beto")

        assert (await ana.post("/api/turmas", json={"nome": "RI 2026"})).status_code == 403
        turma = (await prof.post("/api/turmas", json={"nome": "RI 2026"})).json()
        assert len(turma["codigo"]) == 8 and turma["sou_professor"]

        assert (await ana.post("/api/turmas/entrar", json={"codigo": "XXXXXXXX"})).status_code == 404
        vista = (await ana.post("/api/turmas/entrar", json={"codigo": turma["codigo"].lower()})).json()
        assert vista["id"] == turma["id"] and vista["codigo"] is None and not vista["sou_professor"]
        assert (await beto.get(f"/api/turmas/{turma['id']}")).status_code == 404  # quem não é membro nem sabe que existe
        assert (await ana.get(f"/api/turmas/{turma['id']}/membros")).status_code == 403
        membros = (await prof.get(f"/api/turmas/{turma['id']}/membros")).json()
        assert [m["nome"] for m in membros] == ["Ana"]

        # cenário proposto pelo professor
        assert (await prof.put(f"/api/turmas/{turma['id']}/cenario", json={"caso_id": "inexistente"})).status_code == 422
        await prof.put(f"/api/turmas/{turma['id']}/cenario", json={"caso_id": "estreito-taiwan", "orientacao": "Compare duas premissas."})
        assert (await ana.get(f"/api/turmas/{turma['id']}")).json()["cenario_caso_id"] == "estreito-taiwan"

        # simulação da aluna na turma
        assert (await beto.post("/api/simulacoes", json={**CORPO, "turma_id": turma["id"]})).status_code == 422
        sid = (await ana.post("/api/simulacoes", json={**CORPO, "turma_id": turma["id"]})).json()["id"]
        await esperar(ana, sid)
        assert (await prof.get(f"/api/simulacoes/{sid}")).status_code == 200
        assert (await beto.get(f"/api/simulacoes/{sid}")).status_code == 404
        da_turma = (await prof.get("/api/simulacoes", params={"turma_id": turma["id"]})).json()
        assert [(s["id"], s["autor"]) for s in da_turma] == [(sid, "Ana")]
        assert (await prof.delete(f"/api/simulacoes/{sid}")).status_code == 403  # professor vê, mas não apaga o trabalho da aluna
        assert (await beto.get("/api/simulacoes")).json() == []

        # remover aluna: ela deixa de ver a turma
        assert (await prof.delete(f"/api/turmas/{turma['id']}/membros/{membros[0]['id']}")).status_code == 204
        assert (await ana.get(f"/api/turmas/{turma['id']}")).status_code == 404


async def test_cadastro_com_codigo_de_turma(demo):
    app = nova_app(demo)
    async with http(app) as prof, http(app) as ana, http(app) as beto:
        await cadastrar(prof, "prof@exemplo.edu", papel="professor")
        turma = (await prof.post("/api/turmas", json={"nome": "Economia"})).json()
        d = await cadastrar(ana, "ana@exemplo.edu", codigo_turma=turma["codigo"])
        assert d["turma"]["id"] == turma["id"] and not d["codigo_invalido"]
        d2 = await cadastrar(beto, "beto@exemplo.edu", codigo_turma="ERRADO99")
        assert d2["turma"] is None and d2["codigo_invalido"]


async def test_limite_diario_por_usuario(demo):
    app = nova_app(replace(demo, limite_usuario_dia=2))
    async with http(app) as c:
        await cadastrar(c, "ana@exemplo.edu")
        codigos = [(await c.post("/api/simulacoes", json=CORPO)).status_code for _ in range(3)]
        assert codigos == [202, 202, 429]
        assert (await c.get("/api/auth/eu")).json()["simulacoes_hoje"] == 2
        await asyncio.sleep(0.2)


async def test_exportar_e_excluir_conta(demo):
    app = nova_app(demo)
    async with http(app) as prof, http(app) as ana:
        await cadastrar(prof, "prof@exemplo.edu", papel="professor")
        turma = (await prof.post("/api/turmas", json={"nome": "RI"})).json()
        await cadastrar(ana, "ana@exemplo.edu", codigo_turma=turma["codigo"])
        sid = (await ana.post("/api/simulacoes", json=CORPO)).json()["id"]
        await esperar(ana, sid)
        dados = (await ana.get("/api/conta/exportar")).json()
        assert dados["usuario"]["email"] == "ana@exemplo.edu" and [s["id"] for s in dados["simulacoes"]] == [sid]
        assert "senha" not in str(dados["usuario"]) and "scrypt" not in str(dados)
        r = (await ana.delete("/api/conta")).json()
        assert r["excluido"] and r["simulacoes"] == 1
        assert (await ana.get("/api/auth/eu")).status_code == 401
        assert (await prof.get(f"/api/turmas/{turma['id']}/membros")).json() == []
        # professor excluído leva junto as turmas que criou
        r = (await prof.delete("/api/conta")).json()
        assert r["turmas"] == 1
    con = sqlite3.connect(demo.db_path)
    assert con.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0] == 0
    assert con.execute("SELECT COUNT(*) FROM simulacoes").fetchone()[0] == 0
    assert con.execute("SELECT COUNT(*) FROM turmas").fetchone()[0] == 0


async def test_banco_antigo_e_migrado(tmp_path):
    caminho = tmp_path / "antigo.db"
    con = sqlite3.connect(caminho)
    con.execute("CREATE TABLE simulacoes (id TEXT PRIMARY KEY, criada_em TEXT NOT NULL, status TEXT NOT NULL, caso_id TEXT NOT NULL, titulo TEXT NOT NULL, base_id TEXT, dados TEXT NOT NULL)")
    con.commit(); con.close()
    Banco(caminho)
    colunas = {l[1] for l in sqlite3.connect(caminho).execute("PRAGMA table_info(simulacoes)")}
    assert {"usuario_id", "turma_id"} <= colunas
