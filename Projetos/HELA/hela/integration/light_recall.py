"""Recall leve para o hook UserPromptSubmit (revisão F3-A2: p95 < 300 ms em processo novo).

Faz os passos do Cognitive Router que produzem o contexto, sem o Engine, sem pydantic e sem
networkx, e com as mesmas regras (um teste confere que as memórias e o contexto são iguais aos do
Engine.recall):

1. receber      redige a consulta (até 4.000 caracteres);
2. classificar  só pelas regras (o Naive Bayes fica para o Engine);
3 a 5.          busca híbrida: FTS5 (BM25) + cosseno pelo cache de vetores em mmap + ativação no grafo,
                fundidos por RRF com recência, qualidade e importância; divide por tipo de memória;
6. estratégias  fora do caminho leve (o Claude pede com hela_recommend);
7. selecionar   relevância = max(cosseno, cobertura) ≥ router.min_relevance e confiança ≥ min_trust;
8. compactar    Context Optimizer dentro do orçamento, no invólucro "dados, não instruções";
9. registrar    tarefa, classificação e retrievals numa transação de melhor esforço.

Prazo: `deadline` (perf_counter absoluto). Estourou em qualquer ponto, devolve None: o hook não
imprime nada e o prompt segue sem contexto (fail-open).
"""

from __future__ import annotations

import hashlib
import json
import math
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from hela.core.clock import to_iso, utcnow
from hela.core.optimizer import ContextItem, optimize_context
from hela.core.relevance import coverage, query_terms
from hela.execution.assessment import approval_valid, assess_procedure
from hela.learning.rules import classify_by_rules
from hela.learning.taxonomy import normalize
from hela.memory.fusion import _ordem_recencia, _ordenar, rrf_fuse
from hela.memory.vector_cache import VectorCache
from hela.security.redaction import redact
from hela.storage.db import Database
from hela.storage.repositories.memories import MemoryFilter, MemoryRepository
from hela.storage.repositories.tasks import TaskRepository

MAX_CONSULTA = 4000
KINDS = ("episodic", "semantic", "procedural", "executive")
GRUPOS = {"conhecimentos": ("semantic", "executive"), "experiencias": ("episodic",), "procedimentos": ("procedural",)}
REGISTRO_BUSY_MS = 50
MARGEM_DO_PRAZO_MS = 40  # o que sobra para fechar o banco, montar o JSON e sair


class PrazoEstourado(Exception):
    """O prazo interno passou: o hook sai sem contexto."""


def _conferir_prazo(deadline: Optional[float]) -> None:
    if deadline is not None and time.perf_counter() > deadline:
        raise PrazoEstourado()


def _embedder(cfg: dict[str, Any]):  # type: ignore[no-untyped-def]
    """Só o hashing cabe no hook; com embedder neural, o caminho leve usa só FTS5 e grafo."""
    if cfg["embedder"]["backend"] != "hashing":
        return None
    from hela.memory.embedder import HashingEmbedder

    return HashingEmbedder(cfg["embedder"]["dim"])


def _cosseno(conn: Any, home: Path, cfg: dict[str, Any], consulta: str, filtro: MemoryFilter,
             candidatos: int, deadline: Optional[float]) -> dict[str, float]:
    """Mesmo resultado do repo.embeddings(filtro) + matriz @ vetor, mas lendo o cache em mmap."""
    emb = _embedder(cfg)
    if emb is None:
        return {}
    vetor = emb.embed([consulta])[0]
    if not vetor.any():
        return {}
    ids, valores = VectorCache(home, emb.name, emb.dim).scores(conn, vetor)
    _conferir_prazo(deadline)
    if not ids:
        return {}
    import numpy as np

    minimo = cfg["search"]["min_cosine"]
    ordem = [int(i) for i in np.argsort(-valores) if valores[i] >= minimo]
    sims: dict[str, float] = {}
    repo = MemoryRepository(conn)
    passo = max(4 * candidatos, 64)
    for ini in range(0, len(ordem), passo):  # filtra no SQLite por blocos, na ordem do cosseno
        bloco = [ids[i] for i in ordem[ini:ini + passo]]
        validos = {r["id"] for r in repo.list(_com_ids(filtro, bloco), limit=len(bloco))}
        for i in ordem[ini:ini + passo]:
            if ids[i] in validos:
                sims[ids[i]] = float(valores[i])
                if len(sims) >= candidatos:
                    return sims
    return sims


def _com_ids(filtro: MemoryFilter, ids: list[str]) -> MemoryFilter:
    return MemoryFilter(kinds=filtro.kinds, project=filtro.project, include_global=filtro.include_global,
                        tags=filtro.tags, statuses=filtro.statuses, not_expired_at=filtro.not_expired_at,
                        min_quality=filtro.min_quality, ids=ids)


def _buscar(conn: Any, home: Path, cfg: dict[str, Any], consulta: str, filtro: MemoryFilter, limite: int,
            deadline: Optional[float]) -> list[dict[str, Any]]:
    """A busca híbrida do HybridSearch.search, devolvendo dicionários (sem pydantic)."""
    scfg = cfg["search"]
    repo = MemoryRepository(conn)
    bm25 = repo.fts(consulta, filtro, scfg["candidates"])
    rank_bm25 = [mid for mid, _ in bm25]
    sims = _cosseno(conn, home, cfg, consulta, filtro, scfg["candidates"], deadline)
    rank_cos = _ordenar(sims)
    rankings: dict[str, list[str]] = {"bm25": rank_bm25, "cosine": rank_cos}
    candidatos = set(rank_bm25) | set(rank_cos)
    pesos = scfg["weights"]
    if scfg["graph_activation"] and candidatos:
        from hela.memory.activation import GraphActivation

        sementes = rrf_fuse(rankings, pesos, scfg["rrf_k"])
        ativ = GraphActivation(conn, steps=scfg["activation_steps"], decay=scfg["activation_decay"])
        ativacao = {m: v for m, v in ativ.activation(sementes).items() if v > 0}
        if ativacao:
            validos = {r["id"] for r in repo.list(_com_ids(filtro, list(ativacao)), limit=len(ativacao))}
            ativacao = {m: v for m, v in ativacao.items() if m in validos}
            rankings["graph"] = _ordenar(ativacao)
            candidatos |= set(ativacao)
    if not candidatos:
        return []
    linhas = {r["id"]: r for r in repo.list(_com_ids(filtro, list(candidatos)), limit=len(candidatos))}
    rankings["recency"] = _ordenar({m: _ordem_recencia(r) for m, r in linhas.items()})
    rankings["quality"] = _ordenar({m: float(r["quality"]) * float(r["confidence"]) for m, r in linhas.items()})
    rankings["importance"] = _ordenar({m: float(r["importance"]) for m, r in linhas.items()})
    fundido = rrf_fuse(rankings, pesos, scfg["rrf_k"])
    escolhidos = [m for m in fundido if m in linhas][:limite]
    saida = []
    for mid in escolhidos:
        r = linhas[mid]
        saida.append({"id": mid, "kind": r["kind"], "title": r["title"], "content": r["content"],
                      "summary": r["summary"], "project": r["project"], "tags": json.loads(r["tags"] or "[]"),
                      "quality": float(r["quality"]), "confidence": float(r["confidence"]),
                      "score": round(fundido[mid], 6), "cosine": round(sims[mid], 4) if mid in sims else None})
    return saida


def _procedimento(conn: Any, memory_id: str, allowed_hosts: list[str]) -> Optional[dict[str, Any]]:
    row = conn.execute("SELECT * FROM procedures WHERE memory_id = ?", (memory_id,)).fetchone()
    if row is None:
        return None
    m = conn.execute("SELECT status, source, metadata FROM memories WHERE id = ?", (memory_id,)).fetchone()
    memoria = None if m is None else {"status": m["status"], "source": m["source"],
                                      "metadata": json.loads(m["metadata"] or "{}")}
    classe, motivos, _ = assess_procedure(row, memoria, allowed_hosts)
    aprovado = approval_valid(row)
    return {"id": row["id"], "memory_id": memory_id, "name": row["name"], "exec_class": classe,
            "exec_reasons": motivos, "approved": aprovado, "script_sha256": row["script_sha256"],
            "success_count": row["success_count"], "failure_count": row["failure_count"]}


def light_recall(db: Database, home: Path, cfg: dict[str, Any], query: str, *, project: Optional[str] = None,
                 session_id: Optional[str] = None, deadline: Optional[float] = None, record: bool = True,
                 transcript_offset: Optional[int] = None, cwd: Optional[str] = None) -> Optional[dict[str, Any]]:
    """Contexto compacto para o prompt, ou None se o prazo estourar. Nunca levanta por banco ocupado."""
    inicio = time.perf_counter()
    try:
        return _recall(db, Path(home), cfg, query, project, session_id, deadline, record, transcript_offset, cwd,
                       inicio)
    except PrazoEstourado:
        return None


def _recall(db: Database, home: Path, cfg: dict[str, Any], query: str, project: Optional[str],
            session_id: Optional[str], deadline: Optional[float], record: bool, transcript_offset: Optional[int],
            cwd: Optional[str], inicio: float) -> dict[str, Any]:
    _conferir_prazo(deadline)
    rcfg = cfg["router"]
    sec = cfg["security"]
    texto = (query or "").strip()[:MAX_CONSULTA]
    consulta = redact(texto, entropy_threshold=sec["entropy_threshold"],
                      entropy_min_length=sec["entropy_min_length"]).text.strip()
    agora = to_iso(utcnow())
    regras = classify_by_rules(consulta) if consulta else None
    limite = rcfg["limit_per_step"]
    filtro = MemoryFilter(kinds=list(KINDS), project=project, include_global=project is not None,
                          not_expired_at=agora)
    conn = db.conn
    avaliados: list[dict[str, Any]] = []
    if consulta:
        conn.execute("BEGIN")  # uma leitura só, num instantâneo consistente do WAL
        try:
            hits = _buscar(conn, home, cfg, consulta, filtro, limite * 4, deadline)
        finally:
            conn.execute("COMMIT")
        termos = query_terms(consulta)
        for h in hits:
            corpo = " ".join(p for p in (h["title"], h["content"], h["summary"], " ".join(h["tags"])) if p)
            rel = round(max(float(h["cosine"] or 0.0), coverage(termos, corpo)), 4)
            avaliados.append({"hit": h, "relevance": rel, "trust": round(h["quality"] * h["confidence"], 4)})
    _conferir_prazo(deadline)

    selecionados = []
    for grupo in GRUPOS.values():
        for a in [x for x in avaliados if x["hit"]["kind"] in grupo][:limite]:
            ok_rel, ok_conf = a["relevance"] >= rcfg["min_relevance"], a["trust"] >= rcfg["min_trust"]
            a["included"] = ok_rel and ok_conf
            a["reason"] = "selected" if a["included"] else ("low_relevance" if not ok_rel else "low_trust")
            if a["included"]:
                selecionados.append(a)
    insuficiente = not selecionados

    procedimentos, itens = [], []
    hosts = cfg.get("execution", {}).get("allowed_hosts", ["localhost", "127.0.0.1", "::1"])
    for a in selecionados:
        h = a["hit"]
        titulo = h["title"] or h["content"][:80]
        if h["kind"] == "procedural":
            p = _procedimento(conn, h["id"], hosts)
            if p is not None:
                procedimentos.append(p)
                titulo = f"{titulo} [execução: {p['exec_class']}]"
        valor = a["relevance"] * (0.5 + 0.5 * math.sqrt(a["trust"]))
        itens.append(ContextItem(id=h["id"], kind=h["kind"], title=titulo, content=h["content"],
                                 summary=h["summary"], value=valor, project=h["project"]))
    ocfg = cfg["optimizer"]
    oc = optimize_context(itens, rcfg["budget_tokens"], primary_count=ocfg["primary_count"],
                          jaccard_threshold=ocfg["jaccard_threshold"], shingle_size=ocfg["shingle_size"],
                          chars_per_token=ocfg["chars_per_token"]) if itens else None
    no_contexto = {i["id"]: i for i in (oc.items if oc else [])}
    _conferir_prazo(deadline)

    resultados = []
    for a in avaliados:
        h = a["hit"]
        entrou = h["id"] in no_contexto
        motivo = a.get("reason", "over_limit")
        if a.get("included") and not entrou:
            motivo = "dropped_by_optimizer"
        resultados.append({"id": h["id"], "kind": h["kind"], "score": h["score"], "relevance": a["relevance"],
                           "trust": a["trust"], "included": entrou,
                           "mode": no_contexto[h["id"]]["mode"] if entrou else None, "reason": motivo})
    memorias = []
    for r in resultados:
        if r["included"]:
            h = next(a["hit"] for a in avaliados if a["hit"]["id"] == r["id"])
            memorias.append({"id": h["id"], "kind": h["kind"], "title": h["title"], "project": h["project"],
                             "relevance": r["relevance"], "trust": r["trust"], "score": r["score"],
                             "mode": r["mode"], "value": no_contexto[h["id"]]["value"]})
    memorias.sort(key=lambda x: (-x["value"], x["id"]))
    tokens = {"raw": oc.tokens_raw if oc else 0, "optimized": oc.tokens_optimized if oc else 0,
              "budget": rcfg["budget_tokens"], "source": "estimated"}
    latencia = round((time.perf_counter() - inicio) * 1000, 2)

    task_id: Optional[str] = None
    gravou = False
    if record and consulta:
        _conferir_prazo(deadline)
        novo_id = uuid.uuid4().hex
        incluidos = [m["id"] for m in memorias]

        def registrar(_c: Any) -> None:
            tarefas = TaskRepository(conn)
            if session_id:
                tarefas.ensure_session(session_id, agora, project=project, cwd=cwd)
            tarefas.create(novo_id, prompt=consulta, created_at=agora, session_id=session_id, project=project,
                           prompt_hash=hashlib.sha256(normalize(consulta).encode()).hexdigest(),
                           category=regras.category if regras else None,
                           complexity=regras.complexity if regras else None, tools=regras.tools if regras else [],
                           label_source="rules" if regras else None, transcript_offset_start=transcript_offset,
                           metadata={"classified_by": "rules", "door": "hook"})
            filtros = {"category": regras.category if regras else None, "mode": "rules", "project": project,
                       "kinds": list(KINDS), "budget_tokens": rcfg["budget_tokens"],
                       "min_relevance": rcfg["min_relevance"], "min_trust": rcfg["min_trust"], "door": "hook"}
            cur = conn.execute(
                "INSERT INTO retrievals (task_id, session_id, query, filters, results, n_results, insufficient,"
                " latency_ms, tokens_estimated, tokens_raw, tokens_optimized, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (novo_id, session_id, consulta, json.dumps(filtros, ensure_ascii=False), json.dumps(resultados),
                 len(incluidos), int(insuficiente), latencia, tokens["optimized"], tokens["raw"],
                 tokens["optimized"], agora))
            if incluidos:
                MemoryRepository(conn).touch(incluidos, agora)
            conn.execute("INSERT INTO events (ts, type, entity, entity_id, data) VALUES (?, ?, ?, ?, ?)",
                         (agora, "router.routed", "task", novo_id, json.dumps({
                             "retrieval_id": int(cur.lastrowid), "category": filtros["category"],
                             "included": len(incluidos), "insufficient": insuficiente, "latency_ms": latencia,
                             "door": "hook"})))

        # A espera pela trava respeita o prazo: sem folga, o contexto sai sem registro (medição da F3-A2:
        # com outro processo gravando, esperar 50 ms fixos levava o p95 para perto de 300 ms).
        espera = REGISTRO_BUSY_MS
        if deadline is not None:
            espera = int(min(REGISTRO_BUSY_MS, (deadline - time.perf_counter()) * 1000 - MARGEM_DO_PRAZO_MS))
        if espera >= 1:
            gravou, _ = db.try_write(registrar, busy_timeout_ms=espera)
        task_id = novo_id if gravou else None

    return {"task_id": task_id, "recorded": gravou, "insufficient": insuficiente,
            "category": regras.category if regras else None,
            "context": oc.text if (oc and not insuficiente) else "", "memories": memorias if not insuficiente else [],
            "procedures": procedimentos, "tokens": tokens, "latency_ms": latencia}
