"""Tokens do provedor lidos do transcript do Claude Code (docs/referencia-claude-code.md, seção 4).

- Só as linhas `type: "assistant"` contam, e uma resposta da API com N blocos vira N linhas com o mesmo
  message.id e o mesmo usage: soma uma vez por message.id (requestId falta em parte das linhas).
- O transcript é escrito de forma assíncrona: a última linha pode estar pela metade; o cursor para no
  fim da última linha completa.
- Um cursor por arquivo (tabela transcript_cursors), com os ids mais recentes: a mesma resposta pode ter
  linhas antes e depois do cursor.
- Arquivo menor que o cursor = transcript trocado: recomeça do zero, com os ids já vistos.
- Subagentes ficam em <sessão>/subagents/agent-*.jsonl, cada um com seus message.id.

Só lê números: o conteúdo das mensagens nunca é guardado.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

CAMPOS = {"input_tokens": "input", "output_tokens": "output", "cache_read_input_tokens": "cache_read",
          "cache_creation_input_tokens": "cache_creation"}
IDS_GUARDADOS = 200


def _zeros() -> dict[str, int]:
    return {"input": 0, "output": 0, "cache_read": 0, "cache_creation": 0, "thinking": 0}


def _inteiro(valor: object) -> int:
    return valor if isinstance(valor, int) and not isinstance(valor, bool) and valor > 0 else 0


def sum_usage(caminho: Path, offset: int, recent_ids: list[str]) -> tuple[dict[str, int], int, int, list[str]]:
    """(totais, respostas contadas, novo offset, ids recentes) a partir de offset.

    `thinking` é informativo (output_tokens_details.thinking_tokens): não se sabe se já está dentro de
    output, então nunca é somado a ele.
    """
    total = _zeros()
    vistos = list(recent_ids)
    conjunto = set(vistos)
    contadas = 0
    try:
        tamanho = caminho.stat().st_size
    except OSError:
        return total, 0, offset, vistos
    if offset > tamanho:
        offset = 0  # arquivo trocado
    pos = offset
    with open(caminho, "rb") as f:
        f.seek(offset)
        for linha in f:
            if not linha.endswith(b"\n"):
                break  # linha incompleta: fica para a próxima leitura
            pos += len(linha)
            if b'"assistant"' not in linha:
                continue
            try:
                o = json.loads(linha)
            except ValueError:
                continue
            if not isinstance(o, dict) or o.get("type") != "assistant" or o.get("isApiErrorMessage"):
                continue
            m = o.get("message")
            if not isinstance(m, dict):
                continue
            mid, uso = m.get("id"), m.get("usage")
            if not isinstance(mid, str) or not mid or not isinstance(uso, dict) or mid in conjunto:
                continue
            conjunto.add(mid)
            vistos.append(mid)
            contadas += 1
            for campo, chave in CAMPOS.items():
                total[chave] += _inteiro(uso.get(campo))
            detalhes = uso.get("output_tokens_details")
            if isinstance(detalhes, dict):
                total["thinking"] += _inteiro(detalhes.get("thinking_tokens"))
    return total, contadas, pos, vistos[-IDS_GUARDADOS:]


def transcript_files(transcript_path: Optional[str]) -> list[Path]:
    """O transcript da sessão e os dos subagentes (só arquivos .jsonl que existem)."""
    if not isinstance(transcript_path, str) or not transcript_path.endswith(".jsonl"):
        return []
    principal = Path(transcript_path)
    if not principal.is_file():
        return []
    pasta = principal.with_suffix("") / "subagents"
    subagentes = sorted(p for p in pasta.glob("agent-*.jsonl") if p.is_file()) if pasta.is_dir() else []
    return [principal, *subagentes]


@dataclass
class Cursor:
    path: str
    session_id: Optional[str]
    offset: int
    recent_ids: list[str] = field(default_factory=list)

    def save(self, conn: sqlite3.Connection, agora: Optional[str] = None) -> None:
        conn.execute(
            "INSERT INTO transcript_cursors (path, session_id, offset, recent_ids, updated_at) VALUES (?, ?, ?, ?, ?)"
            " ON CONFLICT(path) DO UPDATE SET session_id = excluded.session_id, offset = excluded.offset,"
            " recent_ids = excluded.recent_ids, updated_at = excluded.updated_at",
            (self.path, self.session_id, self.offset, json.dumps(self.recent_ids), agora))


def collect_usage(conn: sqlite3.Connection, transcript_path: Optional[str],
                  session_id: Optional[str]) -> tuple[dict[str, int], int, list[Cursor]]:
    """Soma o que é novo em todos os arquivos da sessão. Os cursores só valem depois de save()."""
    total = _zeros()
    contadas = 0
    cursores = []
    for caminho in transcript_files(transcript_path):
        linha = conn.execute("SELECT offset, recent_ids FROM transcript_cursors WHERE path = ?",
                             (str(caminho),)).fetchone()
        offset = int(linha[0]) if linha else 0
        recentes = json.loads(linha[1]) if linha and linha[1] else []
        parcial, n, novo, ids = sum_usage(caminho, offset, recentes if isinstance(recentes, list) else [])
        for k, v in parcial.items():
            total[k] += v
        contadas += n
        cursores.append(Cursor(str(caminho), session_id, novo, ids))
    return total, contadas, cursores
