"""Resumo de uma chamada de ferramenta para a tabela observations (hooks PostToolUse e PostToolUseFailure).

Regras (docs/seguranca.md, A2; docs/referencia-claude-code.md, 1.5):
- nunca guarda `content`, `originalFile`, `base64`, `oldString`/`newString` nem a saída de Read, Write
  e Edit: só o caminho, o tipo e o tamanho da mudança;
- arquivo sensível (.env, chaves, credenciais): só registra que foi lido;
- Bash: o comando (redigido e curto) e quantas linhas saíram; nunca o stdout/stderr;
- falha: o código de saída da linha "Exit code N" e o começo do erro, redigido e curto;
- web: só o host (sem usuário e senha) e a marca web;
- todo campo é opcional e de tipo incerto: nada aqui levanta exceção por entrada estranha.
"""

from __future__ import annotations

import re
from typing import Any, Optional
from urllib.parse import urlsplit

from hela.integration.web_taint import is_web_tool
from hela.security.redaction import redact

_SENSIVEIS = re.compile(
    r"(?i)(^|[\\/])(\.env(\.[\w.-]*)?|[^\\/]*\.(pem|key|p12|pfx|keystore)|id_(rsa|dsa|ecdsa|ed25519)[^\\/]*|"
    r"credentials[^\\/]*|\.netrc|\.npmrc|\.pypirc|\.claude\.json|\.git-credentials)$"
    r"|(^|[\\/])\.(ssh|aws|gnupg)([\\/]|$)")
_EXIT = re.compile(r"^\s*Exit code (-?\d+)")


def _texto(valor: Any) -> Optional[str]:
    return valor if isinstance(valor, str) else None


def _dict(valor: Any) -> dict:
    return valor if isinstance(valor, dict) else {}


def _curto(texto: str, limite: int) -> str:
    texto = " ".join(texto.split())
    return texto if len(texto) <= limite else texto[: max(0, limite - 1)] + "…"


def _redigir(texto: str, limite: int) -> str:
    # corta antes (custo linear) e depois de redigir (o marcador pode aumentar o texto)
    return _curto(redact(texto[: limite * 4]).text, limite)


def is_sensitive_path(caminho: Optional[str]) -> bool:
    return bool(caminho) and _SENSIVEIS.search(caminho) is not None  # type: ignore[arg-type]


def _host(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        return urlsplit(url).hostname
    except ValueError:
        return None


def summarize_success(tool: Any, tool_input: Any, tool_response: Any, max_chars: int = 300) -> tuple[str, dict]:
    nome = tool if isinstance(tool, str) else "?"
    entrada = _dict(tool_input)
    resposta = _dict(tool_response)
    payload: dict[str, Any] = {"origin": f"tool:{nome}"}
    if is_web_tool(nome):
        payload["web"] = True
    caminho = _texto(entrada.get("file_path")) or _texto(entrada.get("notebook_path"))
    if nome in ("Read", "Write", "Edit", "MultiEdit", "NotebookEdit") and caminho:
        payload["path"] = _redigir(caminho, max_chars)
        payload["sensitive"] = is_sensitive_path(caminho)
        if nome == "Read":
            arquivo = _dict(resposta.get("file"))
            payload["read_type"] = _texto(resposta.get("type"))
            if not payload["sensitive"]:
                for k in ("numLines", "totalLines", "startLine"):
                    if isinstance(arquivo.get(k), int):
                        payload[k] = arquivo[k]
            return _curto(f"Read {payload['path']}", max_chars), payload
        patch = resposta.get("structuredPatch")
        adicionadas = removidas = 0
        if isinstance(patch, list):
            for bloco in patch:
                b = _dict(bloco)
                adicionadas += b.get("newLines") if isinstance(b.get("newLines"), int) else 0
                removidas += b.get("oldLines") if isinstance(b.get("oldLines"), int) else 0
        payload.update(change=_texto(resposta.get("type")) or ("edit" if nome != "Write" else None),
                       lines_added=adicionadas, lines_removed=removidas)
        return _curto(f"{nome} {payload['path']} (+{adicionadas} -{removidas})", max_chars), payload
    if nome == "Bash":
        comando = _texto(entrada.get("command")) or ""
        payload["command"] = _redigir(comando, max_chars)
        saida = _texto(resposta.get("stdout")) or ""
        payload["stdout_lines"] = saida.count("\n") + (1 if saida and not saida.endswith("\n") else 0)
        payload["interrupted"] = bool(resposta.get("interrupted"))
        return _curto(f"Bash: {payload['command']}", max_chars), payload
    if nome in ("WebFetch", "WebSearch"):
        host = _host(_texto(entrada.get("url")))
        if host:
            payload["host"] = host
        if nome == "WebSearch" and _texto(entrada.get("query")):
            payload["query"] = _redigir(entrada["query"], 120)
        return _curto(f"{nome} {host or payload.get('query') or ''}".strip(), max_chars), payload
    if nome in ("Grep", "Glob"):
        padrao = _texto(entrada.get("pattern"))
        if padrao:
            payload["pattern"] = _redigir(padrao, 120)
        return _curto(f"{nome} {payload.get('pattern', '')}".strip(), max_chars), payload
    return _curto(nome, max_chars), payload


def summarize_failure(tool: Any, tool_input: Any, error: Any, is_interrupt: Any = None,
                      max_chars: int = 300) -> tuple[str, dict]:
    nome = tool if isinstance(tool, str) else "?"
    resumo, payload = summarize_success(nome, tool_input, None, max_chars=max_chars)
    texto = _texto(error) or ""
    m = _EXIT.match(texto)
    payload["exit_code"] = int(m.group(1)) if m else None
    payload["is_interrupt"] = is_interrupt if isinstance(is_interrupt, bool) else None
    payload["error_head"] = _redigir(texto, max_chars) if texto else ""
    payload.pop("stdout_lines", None)
    codigo = f" (exit {payload['exit_code']})" if payload["exit_code"] is not None else ""
    return _curto(f"falhou{codigo}: {resumo}", max_chars), payload
