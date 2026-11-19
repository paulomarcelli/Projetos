"""Fim de tarefa (hook Stop) e fim de sessão (hook SessionEnd). Fora do caminho leve: usa o Engine.

No Stop:
1. tokens do provedor desde o último cursor (transcript principal e subagentes, por message.id) e
   compute_cost (chamadas de ferramenta da tarefa ainda não contadas) viram um resultado da tarefa,
   com token_source = "provider". O resultado e os cursores são gravados na mesma transação: uma queda
   no meio não conta duas vezes;
2. consolidação: se a tarefa teve uma falha de ferramenta seguida de um sucesso da mesma ferramenta,
   grava uma experiência (episódica) "erro e correção", com a origem decidida pela porta (web quando a
   sessão usou WebFetch/WebSearch). Só os resumos redigidos das observações entram, nunca a conversa.

No SessionEnd: a mesma varredura de tokens (sem consolidar) e a sessão é fechada.
Os tokens que chegam ao transcript depois do Stop entram no próximo Stop ou no SessionEnd.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from hela.integration.transcript import collect_usage
from hela.integration.web_taint import session_had_web


def _texto(d: dict, chave: str, limite: int = 4096) -> Optional[str]:
    v = d.get(chave)
    return v[:limite] if isinstance(v, str) and v else None


def _registrar_resultado(eng: Any, d: dict, sid: str, task_id: Optional[str]) -> Optional[dict]:
    conn = eng.db.conn
    transcript = _texto(d, "transcript_path") or (conn.execute(
        "SELECT transcript_path FROM sessions WHERE id = ?", (sid,)).fetchone() or [None])[0]
    agora = eng.memories.now()
    with eng.db.transaction():
        total, n, cursores = collect_usage(conn, transcript, sid)
        if task_id is None:
            return None  # sem tarefa (o hook do prompt falhou): os tokens ficam para a próxima
        obs = conn.execute("SELECT COUNT(*) FROM observations WHERE task_id = ?", (task_id,)).fetchone()[0]
        anteriores, ja_contado = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(compute_cost), 0) FROM outcomes WHERE task_id = ?", (task_id,)).fetchone()
        novo_custo = max(0, int(obs) - int(ja_contado))
        resultado = None
        if n or novo_custo:
            campos: dict[str, Any] = {"task_id": task_id, "compute_cost": float(novo_custo), "notes": "hook"}
            if n:
                campos.update(tokens=total, token_source="provider")
            if not anteriores:
                criada = conn.execute("SELECT created_at FROM tasks WHERE id = ?", (task_id,)).fetchone()[0]
                from hela.core.clock import parse_iso

                ms = (parse_iso(agora) - parse_iso(criada)).total_seconds() * 1000
                if ms >= 0:
                    campos["duration_ms"] = round(ms, 1)
            resultado = eng.feedback(door="hook", **campos)["outcome"]
        for c in cursores:
            c.save(conn, agora)
    return resultado


def _consolidar(eng: Any, sid: str, task_id: str, cfg: dict) -> Optional[str]:
    conn = eng.db.conn
    if conn.execute("SELECT 1 FROM memories WHERE task_id = ? AND source = 'hook' LIMIT 1", (task_id,)).fetchone():
        return None  # uma experiência por tarefa
    linhas = conn.execute("SELECT tool_name, success, summary, payload FROM observations WHERE task_id = ? ORDER BY id",
                          (task_id,)).fetchall()
    falha = correcao = None
    for i, o in enumerate(linhas):
        if o["success"] == 0 and o["summary"]:
            depois = next((x for x in linhas[i + 1:] if x["success"] == 1 and x["tool_name"] == o["tool_name"]), None)
            if depois is not None:
                falha, correcao = o, depois
    if falha is None:
        return None
    tarefa = conn.execute("SELECT prompt, project FROM tasks WHERE id = ?", (task_id,)).fetchone()
    import json

    try:
        detalhe = str(json.loads(falha["payload"] or "{}").get("error_head") or "")
    except ValueError:
        detalhe = ""
    web = session_had_web(conn, sid, cfg["integration"]["web_taint_hours"])
    conteudo = (f"Tarefa: {(tarefa['prompt'] or '')[:300]}\n"
                f"Erro: {falha['summary']}\n"
                + (f"Mensagem: {detalhe}\n" if detalhe else "") +
                f"Correção que funcionou: {correcao['summary']}")
    r = eng.learn(door="hook", door_origin="web:sessão com WebFetch/WebSearch" if web else "hook",
                  kind="episodic", title=f"Erro e correção em {falha['tool_name']}"[:300], content=conteudo,
                  project=tarefa["project"], session_id=sid, task_id=task_id, tags=["erro-e-correcao"])
    return r["memory"]["id"]


def finish_task(home: Path, d: dict, cfg: dict, consolidate: bool = True) -> dict[str, Any]:
    sid = _texto(d, "session_id", 200)
    if not sid:
        return {}
    from hela.core.engine import Engine

    with Engine(home=home) as eng:
        if eng.db.conn.execute("SELECT 1 FROM sessions WHERE id = ?", (sid,)).fetchone() is None:
            return {}
        linha = eng.db.conn.execute("SELECT id FROM tasks WHERE session_id = ? ORDER BY rowid DESC LIMIT 1",
                                    (sid,)).fetchone()
        task_id = linha[0] if linha else None
        saida: dict[str, Any] = {"outcome": _registrar_resultado(eng, d, sid, task_id)}
        if consolidate and task_id:
            saida["memory_id"] = _consolidar(eng, sid, task_id, cfg)
        return saida


def end_session(home: Path, d: dict, cfg: dict) -> None:
    sid = _texto(d, "session_id", 200)
    if not sid:
        return
    finish_task(home, d, cfg, consolidate=False)
    from hela.storage.db import Database
    from hela.core.clock import to_iso, utcnow

    db = Database(Path(home) / "hela.db", busy_timeout_ms=cfg["integration"]["hook_busy_timeout_ms"] * 4)
    try:
        db.try_write(lambda c: c.execute("UPDATE sessions SET ended_at = ?, end_reason = ? WHERE id = ?",
                                         (to_iso(utcnow()), _texto(d, "reason", 40), sid)), busy_timeout_ms=500)
    finally:
        db.close()
