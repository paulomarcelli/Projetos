"""Servidor MCP por stdio, com o cliente do SDK (processo real do hela-mcp)."""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

import pytest

pytest.importorskip("mcp")
from mcp.client.session import ClientSession  # noqa: E402
from mcp.client.stdio import StdioServerParameters, stdio_client  # noqa: E402

from hela.core.engine import Engine  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
FERRAMENTAS = {"hela_recall", "hela_classify", "hela_recommend", "hela_learn", "hela_feedback", "hela_procedure",
               "hela_relationships", "hela_stats"}


def _erro(r: Any) -> bool:
    return bool(getattr(r, "is_error", getattr(r, "isError", False)))


def _texto(r: Any) -> str:
    return r.content[0].text


def _sessao(home: Path, chamadas, env_extra: dict | None = None):  # type: ignore[no-untyped-def]
    """Abre o servidor, roda `chamadas(sessao)` (async) e devolve o resultado."""
    env = {**os.environ, "HELA_HOME": str(home), "HOME": str(home.parent / "home-falso"), **(env_extra or {})}
    params = StdioServerParameters(command=sys.executable, args=["-m", "hela.integration.mcp_server"], env=env,
                                   cwd=str(RAIZ))

    async def rodar():  # type: ignore[no-untyped-def]
        async with stdio_client(params) as (leitura, escrita):
            async with ClientSession(leitura, escrita) as s:
                await s.initialize()
                return await chamadas(s)

    return asyncio.run(rodar())


@pytest.fixture()
def home(tmp_path: Path) -> Path:
    h = tmp_path / "hela"
    with Engine(home=h) as eng:
        eng.remember(kind="procedural", title="gif leve",
                     content="Para converter vídeo mp4 em gif leve: ffmpeg -i entrada.mp4 -vf fps=12 saida.gif")
    return h


def test_oito_ferramentas_sem_aprovar_apagar_importar(home: Path) -> None:
    async def c(s):  # type: ignore[no-untyped-def]
        return (await s.list_tools()).tools

    tools = _sessao(home, c)
    nomes = {t.name for t in tools}
    assert nomes == FERRAMENTAS
    proibidas = ("approve", "aprovar", "delete", "apagar", "import", "apply", "trusted", "revoke")
    for t in tools:
        assert not any(p in t.name for p in proibidas)
        esquema = json.dumps(t.inputSchema if hasattr(t, "inputSchema") else t.input_schema)
        assert "trusted" not in esquema and "approve" not in esquema, t.name
        assert t.description and len(t.description) < 4000
    recall = next(t for t in tools if t.name == "hela_recall")
    assert "memória" in recall.description.lower() or "experiência" in recall.description.lower()


def test_recall_learn_feedback_stats_ponta_a_ponta(home: Path) -> None:
    async def c(s):  # type: ignore[no-untyped-def]
        r = json.loads(_texto(await s.call_tool("hela_recall", {"query": "transformar mp4 em gif"})))
        a = json.loads(_texto(await s.call_tool("hela_learn", {
            "kind": "semantic", "content": "O build do vite precisa de base './' para o Pages em subpasta."})))
        f = json.loads(_texto(await s.call_tool("hela_feedback", {"task_id": r["task_id"], "success": True})))
        st = json.loads(_texto(await s.call_tool("hela_stats", {})))
        cl = json.loads(_texto(await s.call_tool("hela_classify", {"text": "converta o vídeo para gif"})))
        return r, a, f, st, cl

    r, a, f, st, cl = _sessao(home, c)
    assert not r["insufficient"] and "ffmpeg" in r["context"] and r["context"].startswith("<hela_memories")
    assert a["created"] and a["memory"]["source"] == "mcp"
    assert f["outcome"]["memories_adjusted"] and f["outcome"]["memories_adjusted"][0]["quality"] <= 0.8
    assert st["memories"]["total"] == 2 and cl["category"] == "media"


def test_erros_previstos_viram_toolerror_sem_repetir_o_valor(home: Path) -> None:
    sentinela = "valor-sentinela-" + "x" * 5000

    async def c(s):  # type: ignore[no-untyped-def]
        return [await s.call_tool("hela_recall", {"query": sentinela}),
                await s.call_tool("hela_procedure", {"action": "approve", "id": "x"}),
                await s.call_tool("hela_procedure", {"action": "get", "id": "nao-existe"}),
                await s.call_tool("hela_feedback", {"memory_id": "x", "rating": 1}),
                await s.call_tool("hela_relationships", {"memory_id": "nao-existe"})]

    rs = _sessao(home, c)
    assert all(_erro(r) for r in rs)
    assert "invalid_input" in _texto(rs[0]) and "sentinela" not in _texto(rs[0])
    assert "not_found" in _texto(rs[2]) and "not_found" in _texto(rs[4])
    assert "invalid_input" in _texto(rs[3])


def test_procedimento_pelo_mcp_nunca_sai_executavel_e_web_marca_origem(home: Path) -> None:
    from hela.storage.db import Database

    db = Database(home / "hela.db")
    db.conn.execute("INSERT INTO sessions (id, started_at, cwd) VALUES ('s', '2026-11-19T00:00:00+00:00', '/proj')")
    db.conn.execute("INSERT INTO observations (session_id, event, tool_name, success, payload, created_at)"
                    " VALUES ('s', 'PostToolUse', 'WebFetch', 1, '{\"web\": true}', strftime('%Y-%m-%dT%H:%M:%f+00:00'))")
    db.close()

    async def c(s):  # type: ignore[no-untyped-def]
        r = await s.call_tool("hela_learn", {"kind": "procedural", "content": "limpar o build",
                                             "procedure": {"name": "limpa build", "script": "rm -rf dist"}})
        return json.loads(_texto(r))

    r = _sessao(home, c, {"CLAUDE_PROJECT_DIR": "/proj"})
    p = r["procedure"]
    assert p["exec_class"] == "human_approval" and p["trusted_origin"] is False and "web" in p["door_origin"]


def test_erro_inesperado_nao_vaza_detalhe(home: Path) -> None:
    (home / "config.json").write_text(json.dumps({"router": {"min_relevance": 9}}))  # Engine não abre

    async def c(s):  # type: ignore[no-untyped-def]
        return await s.call_tool("hela_stats", {})

    r = _sessao(home, c)
    assert _erro(r) and "min_relevance" not in _texto(r) and "config.json" not in _texto(r)


def test_stdout_limpo_com_log_debug(home: Path) -> None:
    async def c(s):  # type: ignore[no-untyped-def]
        return await s.call_tool("hela_stats", {})

    r = _sessao(home, c, {"HELA_LOG_LEVEL": "DEBUG"})
    assert not _erro(r)


def test_import_compativel_v1_e_v2() -> None:
    from hela.integration import mcp_server

    assert mcp_server.ToolError is not None and mcp_server.Servidor is not None
    fonte = (RAIZ / "hela" / "integration" / "mcp_server.py").read_text(encoding="utf-8")
    assert fonte.index("from mcp.server.mcpserver import") < fonte.index("from mcp.server.fastmcp import")
