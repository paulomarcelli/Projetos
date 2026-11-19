"""Resumo das observações dos hooks: só metadados, nunca conteúdo de arquivo (seguranca.md, A2)."""

from __future__ import annotations

import json

from hela.integration.observe import summarize_failure, summarize_success
from hela.integration.web_taint import is_web_tool


def _chave() -> str:
    return "AKIA" + "Q" * 16


def _tudo(resumo: str, payload: dict) -> str:
    return resumo + json.dumps(payload, ensure_ascii=False)


def test_read_write_edit_guardam_caminho_e_tamanho_nunca_o_conteudo():
    segredo = "conteudo-sentinela-" + _chave()
    casos = [
        ("Read", {"file_path": "/p/a.py"}, {"type": "text", "file": {"filePath": "/p/a.py", "content": segredo,
                                                                       "numLines": 3, "totalLines": 3}}),
        ("Read", {"file_path": "/p/f.png"}, {"type": "image", "file": {"base64": segredo, "type": "image/png"}}),
        ("Write", {"file_path": "/p/b.py", "content": segredo},
         {"type": "create", "filePath": "/p/b.py", "content": segredo, "originalFile": None, "structuredPatch": []}),
        ("Edit", {"file_path": "/p/c.py", "old_string": segredo, "new_string": segredo},
         {"filePath": "/p/c.py", "oldString": segredo, "newString": segredo, "originalFile": segredo,
          "structuredPatch": [{"oldStart": 1, "oldLines": 2, "newStart": 1, "newLines": 3, "lines": [segredo]}]}),
    ]
    for ferramenta, entrada, resposta in casos:
        resumo, payload = summarize_success(ferramenta, entrada, resposta)
        assert "sentinela" not in _tudo(resumo, payload) and _chave() not in _tudo(resumo, payload)
        assert payload["path"].startswith("/p/")
    _, p = summarize_success("Edit", casos[3][1], casos[3][2])
    assert p["lines_added"] == 3 and p["lines_removed"] == 2


def test_arquivo_sensivel_so_registra_que_foi_lido():
    for caminho in ("/p/.env", "/p/.env.local", "/home/x/.ssh/id_rsa", "/p/cert.pem", "/home/x/.aws/credentials",
                    "/home/x/.claude.json", "/p/.npmrc"):
        resumo, payload = summarize_success("Read", {"file_path": caminho},
                                            {"type": "text", "file": {"content": "x", "filePath": caminho}})
        assert payload["sensitive"] is True and "x" not in json.dumps(payload.get("lines"))


def test_bash_guarda_comando_redigido_e_curto_sem_stdout():
    cmd = f"curl -H 'Authorization: Bearer {'z' * 40}' https://api.exemplo.com/v1 && echo {_chave()}"
    resumo, payload = summarize_success("Bash", {"command": cmd, "description": "chama a api"},
                                        {"stdout": "saida-sentinela " + _chave(), "stderr": "", "interrupted": False})
    tudo = _tudo(resumo, payload)
    assert "z" * 40 not in tudo and _chave() not in tudo and "saida-sentinela" not in tudo
    assert payload["stdout_lines"] == 1 and "curl" in payload["command"]
    longo, _ = summarize_success("Bash", {"command": "echo " + "a" * 5000}, {"stdout": ""}, max_chars=300)
    assert len(longo) <= 300


def test_falha_guarda_codigo_de_saida_e_inicio_redigido():
    erro = f"Exit code 2\nTraceback ...\nKeyError: token={_chave()}\n" + "x" * 5000
    resumo, payload = summarize_failure("Bash", {"command": "pytest -q"}, erro, is_interrupt=False)
    assert payload["exit_code"] == 2 and payload["is_interrupt"] is False
    assert _chave() not in _tudo(resumo, payload) and len(payload["error_head"]) <= 300
    resumo, payload = summarize_failure("mcp__outro__x", {}, None, is_interrupt=None)
    assert payload["exit_code"] is None


def test_entradas_de_tipo_errado_nao_quebram():
    for entrada, resposta in ((None, None), ("texto", 3), ([], []), ({"file_path": 3}, {"file": "x"})):
        for ferramenta in ("Read", "Write", "Edit", "Bash", "WebFetch", "Grep", "mcp__x__y", 7):
            resumo, payload = summarize_success(ferramenta, entrada, resposta)  # type: ignore[arg-type]
            assert isinstance(resumo, str) and isinstance(payload, dict)


def test_webfetch_guarda_o_host_e_marca_web():
    resumo, payload = summarize_success("WebFetch", {"url": "https://user:senha@exemplo.com/a?b=1", "prompt": "x"},
                                        {"result": "conteudo-sentinela"})
    assert payload["web"] is True and payload["host"] == "exemplo.com" and "senha" not in _tudo(resumo, payload)
    assert "sentinela" not in _tudo(resumo, payload)
    assert is_web_tool("WebFetch") and is_web_tool("WebSearch") and is_web_tool("mcp__fetch__fetch_url")
    assert not is_web_tool("Bash") and not is_web_tool("mcp__hela__hela_recall") and not is_web_tool(None)
