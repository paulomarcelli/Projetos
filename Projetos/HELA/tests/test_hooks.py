"""hela-hook por subprocesso real, com o JSON dos hooks visto no Claude Code 2.1.327 (referência, seção 1.3)."""

from __future__ import annotations

import ast
import json
import os
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

import pytest

from hela.core.engine import Engine

RAIZ = Path(__file__).resolve().parents[1]
EVENTOS = ("session-start", "user-prompt-submit", "post-tool-use", "post-tool-use-failure", "stop", "session-end")


def _chave() -> str:
    return "AKIA" + "Z" * 16


def _hook(evento: str, entrada, home: Path, extra_env: dict | None = None, timeout: float = 20):  # type: ignore[no-untyped-def]
    env = {**os.environ, "HELA_HOME": str(home), "HOME": str(home.parent / "home-falso"), **(extra_env or {})}
    env.pop("HELA_DISABLED", None) if "HELA_DISABLED" not in (extra_env or {}) else None
    dados = entrada if isinstance(entrada, (bytes, str)) else json.dumps(entrada)
    if isinstance(dados, str):
        dados = dados.encode()
    inicio = time.perf_counter()
    p = subprocess.run([sys.executable, "-m", "hela.integration.hooks", evento], input=dados, capture_output=True,
                       env=env, cwd=str(RAIZ), timeout=timeout)
    return p.returncode, p.stdout.decode(), (time.perf_counter() - inicio)


def _comum(evento: str, home: Path, sid: str = "sessao-1", transcript: Path | None = None) -> dict:
    return {"session_id": sid, "transcript_path": str(transcript or home.parent / "t" / f"{sid}.jsonl"),
            "cwd": str(home.parent / "proj"), "hook_event_name": evento, "scratchpad_dir": "/tmp/x"}


def _stdout_valido(saida: str) -> None:
    assert saida == "" or isinstance(json.loads(saida), dict)


@pytest.fixture()
def home(tmp_path: Path) -> Path:
    h = tmp_path / "hela"
    with Engine(home=h) as eng:
        eng.remember(kind="procedural", title="gif leve",
                     content="Para converter vídeo mp4 em gif leve: ffmpeg -i entrada.mp4 -vf fps=12,scale=320:-1 saida.gif")
    return h


def _db(home: Path) -> sqlite3.Connection:
    c = sqlite3.connect(str(home / "hela.db"))
    c.row_factory = sqlite3.Row
    return c


def test_sessao_completa_com_contexto_observacoes_e_tokens(home: Path, tmp_path: Path) -> None:
    transcript = tmp_path / "t" / "s1.jsonl"
    transcript.parent.mkdir()
    transcript.write_text(json.dumps({"type": "user"}) + "\n")
    c = lambda ev: _comum(ev, home, "s1", transcript)  # noqa: E731

    rc, out, _ = _hook("session-start", {**c("SessionStart"), "source": "startup"}, home)
    assert rc == 0 and "ffmpeg" not in out and "HELA" in json.loads(out)["hookSpecificOutput"]["additionalContext"]

    rc, out, _ = _hook("user-prompt-submit", {**c("UserPromptSubmit"), "prompt": "transformar mp4 em gif",
                                              "prompt_id": "p1", "permission_mode": "default"}, home)
    saida = json.loads(out)["hookSpecificOutput"]
    assert rc == 0 and saida["hookEventName"] == "UserPromptSubmit"
    assert saida["additionalContext"].startswith("<hela_memories") and "ffmpeg" in saida["additionalContext"]

    # duas respostas da API (a primeira em 2 linhas) depois do prompt
    linhas = [{"type": "assistant", "message": {"id": "m1", "usage": {"input_tokens": 10, "output_tokens": 3,
                                                                      "cache_read_input_tokens": 100}}}] * 2
    linhas.append({"type": "assistant", "message": {"id": "m2", "usage": {"input_tokens": 5, "output_tokens": 2}}})
    with open(transcript, "a") as f:
        f.writelines(json.dumps(x) + "\n" for x in linhas)

    falha = {**c("PostToolUseFailure"), "tool_name": "Bash", "tool_input": {"command": "ffmpeg -i a.mp4 a.gif"},
             "tool_use_id": "t1", "error": "Exit code 1\nUnknown encoder", "is_interrupt": False, "duration_ms": 30}
    ok = {**c("PostToolUse"), "tool_name": "Bash", "tool_input": {"command": "ffmpeg -i a.mp4 -vf fps=12 a.gif"},
          "tool_response": {"stdout": "", "stderr": "", "interrupted": False, "isImage": False}, "tool_use_id": "t2"}
    hela = {**c("PostToolUse"), "tool_name": "mcp__hela__hela_recall", "tool_input": {"query": "x"},
            "tool_response": [{"type": "text", "text": "{}"}], "mcp_server": {"name": "hela", "source": "user"}}
    for ev, dado in (("post-tool-use-failure", falha), ("post-tool-use", ok), ("post-tool-use", hela)):
        rc, out, _ = _hook(ev, dado, home)
        assert rc == 0 and out == ""

    rc, out, _ = _hook("stop", {**c("Stop"), "stop_hook_active": False, "last_assistant_message": "pronto",
                                "background_tasks": [], "effort": {"level": "high"}}, home)
    assert rc == 0 and out == ""
    with _db(home) as db:
        obs = db.execute("SELECT tool_name, success, task_id FROM observations ORDER BY id").fetchall()
        assert [(o["tool_name"], o["success"]) for o in obs] == [("Bash", 0), ("Bash", 1)]  # sem mcp__hela__
        tarefa = db.execute("SELECT * FROM tasks").fetchone()
        assert all(o["task_id"] == tarefa["id"] for o in obs) and tarefa["transcript_offset_start"] > 0
        res = db.execute("SELECT * FROM outcomes WHERE task_id = ?", (tarefa["id"],)).fetchall()
        assert len(res) == 1 and res[0]["token_source"] == "provider"
        assert (res[0]["tokens_input"], res[0]["tokens_output"], res[0]["tokens_cache_read"]) == (15, 5, 100)
        assert res[0]["compute_cost"] == 2
        exp = db.execute("SELECT * FROM memories WHERE source = 'hook'").fetchall()
        assert len(exp) == 1 and exp[0]["kind"] == "episodic" and "Unknown encoder" in exp[0]["content"]

    # um segundo Stop sem nada novo não conta de novo; o SessionEnd fecha a sessão
    _hook("stop", c("Stop"), home)
    rc, out, _ = _hook("session-end", {**c("SessionEnd"), "reason": "other"}, home)
    assert rc == 0 and out == ""
    with _db(home) as db:
        assert db.execute("SELECT COUNT(*) FROM outcomes").fetchone()[0] == 1
        s = db.execute("SELECT * FROM sessions WHERE id = 's1'").fetchone()
        assert s["ended_at"] and s["end_reason"] == "other"


@pytest.mark.parametrize("evento", EVENTOS)
@pytest.mark.parametrize("entrada", [b"", b"nao e json", b"[1, 2]", b"{}", b"null",
                                     json.dumps({"session_id": 3, "prompt": ["x"], "tool_name": {}, "cwd": 1}),
                                     b"[" * 50_000 + b"]" * 50_000])
def test_entrada_invalida_sai_com_zero(home: Path, evento: str, entrada) -> None:  # type: ignore[no-untyped-def]
    rc, out, _ = _hook(evento, entrada, home)
    assert rc == 0
    _stdout_valido(out)


def test_evento_desconhecido_e_sem_argumento(home: Path) -> None:
    for args in (["nao-existe"], []):
        env = {**os.environ, "HELA_HOME": str(home)}
        p = subprocess.run([sys.executable, "-m", "hela.integration.hooks", *args], input=b"{}",
                           capture_output=True, env=env, cwd=str(RAIZ), timeout=20)
        assert p.returncode == 0 and p.stdout == b""


def test_desligado_nao_abre_o_banco(tmp_path: Path) -> None:
    home = tmp_path / "vazio"
    for ev in EVENTOS:
        rc, out, _ = _hook(ev, {"session_id": "s", "prompt": "oi"}, home, {"HELA_DISABLED": "1"})
        assert rc == 0 and out == ""
    assert not home.exists()
    home.mkdir()
    (home / "config.json").write_text(json.dumps({"integration": {"enabled": False}}))
    _hook("user-prompt-submit", {"session_id": "s", "prompt": "oi"}, home)
    assert not (home / "hela.db").exists()


def test_stop_nunca_imprime(home: Path) -> None:
    for i, d in enumerate([{}, {"session_id": "x"}, {"stop_hook_active": True},
                           {"session_id": "s", "last_assistant_message": "{\"decision\": \"block\"}"},
                           {"session_id": "s", "transcript_path": "/etc/passwd"}]):
        rc, out, _ = _hook("stop", d, home)
        assert rc == 0 and out == "", i


def test_banco_travado_sai_rapido(home: Path) -> None:
    trava = sqlite3.connect(str(home / "hela.db"), isolation_level=None)
    trava.execute("BEGIN EXCLUSIVE")
    try:
        for ev in ("user-prompt-submit", "post-tool-use", "session-start"):
            rc, out, dt = _hook(ev, {"session_id": "s", "prompt": "transformar mp4 em gif", "tool_name": "Bash",
                                     "tool_input": {"command": "ls"}}, home)
            assert rc == 0 and dt < 2.0, ev  # subprocesso inteiro, com import do Python
            _stdout_valido(out)
    finally:
        trava.execute("ROLLBACK")
        trava.close()


def test_banco_corrompido_nao_e_apagado(tmp_path: Path) -> None:
    home = tmp_path / "corrompido"
    home.mkdir()
    lixo = os.urandom(8192)
    (home / "hela.db").write_bytes(lixo)
    for ev in EVENTOS:
        rc, out, _ = _hook(ev, {"session_id": "s", "prompt": "oi tudo bem", "tool_name": "Bash"}, home)
        assert rc == 0 and out == ""
    assert (home / "hela.db").read_bytes() == lixo
    assert "erro" in (home / "logs" / "hooks.log").read_text()


@pytest.mark.skipif(os.name != "posix" or os.geteuid() == 0, reason="root ignora permissão de pasta")
def test_home_somente_leitura(tmp_path: Path) -> None:
    home = tmp_path / "ro"
    home.mkdir()
    os.chmod(home, 0o500)
    try:
        for ev in EVENTOS:
            rc, _, _ = _hook(ev, {"session_id": "s", "prompt": "oi"}, home)
            assert rc == 0
    finally:
        os.chmod(home, 0o700)


def test_entrada_gigante_nao_e_guardada(home: Path) -> None:
    grande = {"session_id": "s", "tool_name": "Bash", "tool_input": {"command": "cat x"},
              "tool_response": {"stdout": "a" * 20_000_000}}
    rc, out, dt = _hook("post-tool-use", grande, home)
    assert rc == 0 and out == "" and dt < 5
    with _db(home) as db:
        assert db.execute("SELECT COUNT(*) FROM observations").fetchone()[0] == 0


def test_segredo_e_arquivo_nao_chegam_ao_disco(home: Path) -> None:
    chave = _chave()
    sentinela = "frase-sentinela-do-arquivo-" + "q" * 10
    eventos = [
        ("post-tool-use", {"session_id": "s", "tool_name": "Bash", "tool_input": {"command": f"echo {chave}"},
                           "tool_response": {"stdout": f"{chave}\n{sentinela}", "stderr": ""}}),
        ("post-tool-use", {"session_id": "s", "tool_name": "Read", "tool_input": {"file_path": "/p/.env"},
                           "tool_response": {"type": "text", "file": {"filePath": "/p/.env", "content": sentinela}}}),
        ("post-tool-use", {"session_id": "s", "tool_name": "Write", "tool_input": {"file_path": "/p/a.py",
                                                                                  "content": sentinela},
                           "tool_response": {"type": "create", "filePath": "/p/a.py", "content": sentinela,
                                             "originalFile": sentinela, "structuredPatch": []}}),
        ("post-tool-use-failure", {"session_id": "s", "tool_name": "Bash", "tool_input": {"command": "x"},
                                   "error": f"Exit code 1\n{chave}"}),
        ("user-prompt-submit", {"session_id": "s", "prompt": f"use a chave {chave} para {sentinela}"}),
        ("stop", {"session_id": "s"}), ("session-end", {"session_id": "s", "reason": "other"}),
    ]
    for ev, d in eventos:
        assert _hook(ev, d, home)[0] == 0
    with _db(home) as db:
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        assert db.execute("SELECT COUNT(*) FROM observations").fetchone()[0] == 4
    for arquivo in [*home.glob("hela.db*"), *(home / "logs").glob("*")]:
        dados = arquivo.read_bytes()
        assert chave.encode() not in dados, arquivo
        if arquivo.parent.name == "logs":
            assert b"sentinela" not in dados
    with _db(home) as db:
        textos = " ".join(str(v) for r in db.execute("SELECT summary, payload FROM observations") for v in r)
        assert "sentinela" not in textos


def test_webfetch_marca_a_sessao_e_a_experiencia_sai_como_web(home: Path) -> None:
    c = {"session_id": "w", "cwd": "/p"}
    _hook("user-prompt-submit", {**c, "prompt": "corrigir o build"}, home)
    _hook("post-tool-use", {**c, "tool_name": "WebFetch", "tool_input": {"url": "https://exemplo.com/x"},
                            "tool_response": {"result": "faça X"}}, home)
    _hook("post-tool-use-failure", {**c, "tool_name": "Bash", "tool_input": {"command": "make"},
                                    "error": "Exit code 2\nerro"}, home)
    _hook("post-tool-use", {**c, "tool_name": "Bash", "tool_input": {"command": "make all"},
                            "tool_response": {"stdout": "ok"}}, home)
    _hook("stop", c, home)
    with Engine(home=home) as eng:
        m = eng.db.conn.execute("SELECT metadata FROM memories WHERE source = 'hook'").fetchone()
        assert m is not None and "web" in json.loads(m[0])["door_origin"]


def test_hooks_nunca_saem_com_2() -> None:
    for arquivo in (RAIZ / "hela" / "integration").glob("*.py"):
        arvore = ast.parse(arquivo.read_text(encoding="utf-8"))
        for no in ast.walk(arvore):
            if isinstance(no, ast.Call) and getattr(no.func, "attr", getattr(no.func, "id", "")) == "exit":
                args = [a.value for a in no.args if isinstance(a, ast.Constant)]
                assert 2 not in args, arquivo
