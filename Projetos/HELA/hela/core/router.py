"""Cognitive Router: da tarefa ao contexto compacto, em 9 passos (prompt mestre, seção 6).

1. receber      valida e redige a consulta; cria a tarefa (ou usa a informada)
2. classificar  Task Classifier (regras ou Naive Bayes); não sobrescreve rótulo explicit/feedback
3. conhecimentos memórias semânticas e executivas relacionadas
4. experiencias  memórias episódicas (erros, correções, resultados)
5. procedimentos memórias procedurais, com a classe de execução de cada procedimento
6. estrategias   Strategy Ranker na categoria da tarefa
7. selecionar    só entra o que passa no limiar de relevância e de confiança; nada passou →
                 "experiência insuficiente" e nenhuma memória
8. compactar     Context Optimizer dentro do orçamento de tokens
9. registrar     uma linha em retrievals, ligada à tarefa (e à sessão), com tokens brutos e otimizados

Relevância absoluta de uma memória = max(cosseno, cobertura). Cobertura é a fração dos termos da
consulta (sem palavras vazias) que aparecem no texto da memória; termos de 5 letras ou mais casam
pelo prefixo de 5 letras (pega plural e flexão: "testes" ~ "teste"). O RRF da busca só ordena;
quem decide se algo entra é esse limiar (router.min_relevance), medido com o conjunto-ouro dos testes.
"""

from __future__ import annotations

import hashlib
import json
import math
import time
import uuid
from typing import Any, Optional

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.core.optimizer import ContextItem, optimize_context
from hela.execution.procedures import ProcedureService
from hela.learning.classifier import TaskClassifier
from hela.learning.ranker import StrategyRanker
from hela.learning.taxonomy import STOPWORDS, normalize, words
from hela.memory.models import KINDS
from hela.memory.search import MAX_CONSULTA, HybridSearch, SearchHit
from hela.memory.service import MemoryService
from hela.security.redaction import redact
from hela.storage.repositories.memories import MemoryFilter
from hela.storage.repositories.tasks import TaskRepository

PASSOS = ("receber", "classificar", "conhecimentos", "experiencias", "procedimentos", "estrategias", "selecionar",
          "compactar", "registrar")
GRUPOS = {"conhecimentos": ("semantic", "executive"), "experiencias": ("episodic",), "procedimentos": ("procedural",)}
INSUFICIENTE = ("experiência insuficiente: nenhuma memória relevante e confiável para esta tarefa. "
                "O Claude pode criar uma solução nova; o resultado pode ser registrado depois com hela_learn "
                "e hela_feedback.")


def query_terms(texto: str) -> list[str]:
    return list(dict.fromkeys(p for p in words(texto) if len(p) >= 2 and p not in STOPWORDS))


def coverage(consulta: list[str], texto: str) -> float:
    """Fração dos termos da consulta presentes no texto (prefixo de 5 letras para termos longos)."""
    if not consulta:
        return 0.0
    palavras = set(normalize(texto).split())
    prefixos = {p[:5] for p in palavras if len(p) >= 5}
    achados = sum(1 for t in consulta if t in palavras or (len(t) >= 5 and t[:5] in prefixos))
    return achados / len(consulta)


class CognitiveRouter:
    def __init__(self, memories: MemoryService, searcher: HybridSearch, classifier: TaskClassifier,
                 ranker: StrategyRanker, procedures: ProcedureService, config: HelaConfig,
                 clock: Clock = utcnow) -> None:
        self.memories = memories
        self.db = memories.db
        self.searcher = searcher
        self.classifier = classifier
        self.ranker = ranker
        self.procedures = procedures
        self.config = config
        self.clock = clock
        self.tasks = TaskRepository(self.db.conn)

    def _redigir(self, texto: str) -> str:
        sec = self.config.security
        return redact(texto, entropy_threshold=sec.entropy_threshold, entropy_min_length=sec.entropy_min_length).text

    def route(self, query: str, project: Optional[str] = None, session_id: Optional[str] = None,
              task_id: Optional[str] = None, budget_tokens: Optional[int] = None,
              kinds: Optional[list[str]] = None, include_global: bool = True,
              limit_per_step: Optional[int] = None) -> dict[str, Any]:
        inicio = time.perf_counter()
        passos: list[dict[str, Any]] = []
        marca = time.perf_counter()

        def passo(nome: str, **info: Any) -> None:
            nonlocal marca
            agora_ = time.perf_counter()
            passos.append({"n": len(passos) + 1, "name": nome, "ms": round((agora_ - marca) * 1000, 2), **info})
            marca = agora_

        cfg = self.config.router
        # 1. receber
        if not isinstance(query, str) or not query.strip():
            raise InvalidInput("a tarefa (query) está vazia")
        if len(query) > MAX_CONSULTA:
            raise InvalidInput(f"a tarefa passa de {MAX_CONSULTA} caracteres")
        orcamento = cfg.budget_tokens if budget_tokens is None else budget_tokens
        if not isinstance(orcamento, int) or not 50 <= orcamento <= cfg.max_budget_tokens:
            raise InvalidInput(f"budget_tokens precisa estar entre 50 e {cfg.max_budget_tokens}")
        limite = limit_per_step or cfg.limit_per_step
        if not 1 <= limite <= 50:
            raise InvalidInput("limit_per_step precisa estar entre 1 e 50")
        tipos = list(kinds) if kinds else list(KINDS)
        if set(tipos) - set(KINDS):
            raise InvalidInput(f"kind inválido: use {', '.join(KINDS)}")
        consulta = self._redigir(query.strip())
        agora = to_iso(self.clock())
        gravou_tarefa = True
        if task_id is not None:
            tarefa = self.tasks.get(task_id)
            if tarefa is None:
                raise NotFound(f"tarefa não encontrada: {task_id}")
        else:
            task_id = uuid.uuid4().hex

            def criar(_conn: Any) -> None:
                if session_id:
                    self.tasks.ensure_session(session_id, agora, project=project)
                self.tasks.create(task_id, prompt=consulta, created_at=agora, session_id=session_id, project=project,
                                  prompt_hash=hashlib.sha256(normalize(consulta).encode()).hexdigest())

            # Melhor esforço (revisão F3-A1): com o banco ocupado, o contexto sai mesmo assim, sem registro.
            gravou_tarefa, _ = self.db.try_write(criar)
            tarefa = self.tasks.get(task_id) if gravou_tarefa else {
                "category": None, "label_source": None, "metadata": {}}
        passo("receber", task_id=task_id, new_task=tarefa["category"] is None)

        # 2. classificar (rótulo humano manda; regras e modelo só preenchem o que não tem rótulo)
        cls = self.classifier.classify(consulta)
        if tarefa["label_source"] in ("explicit", "feedback"):
            cls = {**cls, "category": tarefa["category"], "label_source": tarefa["label_source"]}
        else:
            origem = "rules" if cls["mode"] == "rules" else None
            meta = {**tarefa["metadata"], "classified_by": cls["mode"] if origem else
                    f"naive_bayes:v{cls['model_version']}"}
            if gravou_tarefa:
                self.db.try_write(lambda _c: self.tasks.update(
                    task_id, category=cls["category"], complexity=cls["complexity"], tools=cls["tools"],
                    label_source=origem, metadata=meta))
            cls = {**cls, "label_source": origem}
        categoria = cls["category"]
        passo("classificar", category=categoria, mode=cls["mode"])

        # 3 a 5. uma busca só (um custo de leitura dos vetores), dividida pelos tipos de memória
        filtro = MemoryFilter(kinds=tipos, project=project, include_global=include_global and project is not None)
        hits = self.searcher.search(consulta, filtro, limit=limite * 4, record_access=False)
        termos = query_terms(consulta)
        avaliados: list[dict[str, Any]] = []
        for h in hits:
            m = h.memory
            texto = " ".join(p for p in (m.title, m.content, m.summary, " ".join(m.tags)) if p)
            cos = h.signals.get("cosine_sim") or 0.0
            rel = round(max(float(cos), coverage(termos, texto)), 4)
            confianca = round(m.quality * m.confidence, 4)
            avaliados.append({"hit": h, "relevance": rel, "trust": confianca})
        por_grupo: dict[str, list[dict[str, Any]]] = {}
        for nome, grupo in GRUPOS.items():
            por_grupo[nome] = [a for a in avaliados if a["hit"].memory.kind in grupo][:limite]
            passo(nome, candidates=len(por_grupo[nome]))

        # 6. estratégias da categoria
        estrategias = self.ranker.rank(categoria, limit=cfg.max_strategies, persist=False)
        passo("estrategias", n=len(estrategias["strategies"]), insufficient=estrategias["insufficient"])

        # 7. selecionar
        selecionados = []
        for grupo in por_grupo.values():
            for a in grupo:
                ok_rel = a["relevance"] >= cfg.min_relevance
                ok_conf = a["trust"] >= cfg.min_trust
                a["included"] = ok_rel and ok_conf
                a["reason"] = "selected" if a["included"] else ("low_relevance" if not ok_rel else "low_trust")
                if a["included"]:
                    selecionados.append(a)
        insuficiente = not selecionados
        passo("selecionar", selected=len(selecionados), insufficient=insuficiente)

        # 8. compactar
        procedimentos = []
        itens: list[ContextItem] = []
        for a in selecionados:
            m = a["hit"].memory
            titulo = m.title or m.content[:80]
            if m.kind == "procedural":
                p = self.procedures.by_memory(m.id)
                if p is not None:
                    procedimentos.append({k: p[k] for k in ("id", "memory_id", "name", "exec_class", "exec_reasons",
                                                            "approved", "script_sha256", "success_count",
                                                            "failure_count")})
                    titulo = f"{titulo} [execução: {p['exec_class']}]"
            valor = a["relevance"] * (0.5 + 0.5 * math.sqrt(a["trust"]))
            a["value"] = round(valor, 4)
            itens.append(ContextItem(id=m.id, kind=m.kind, title=titulo, content=m.content, summary=m.summary,
                                     value=valor, project=m.project))
        if not insuficiente:
            for s in estrategias["strategies"]:
                if s["n_obs"] >= 1:
                    itens.append(ContextItem(
                        id=f"strategy:{s['id']}", kind="executive", title=f"estratégia: {s['name']}",
                        value=0.3 * s["score"],
                        content=(f"Estratégia '{s['name']}' na categoria {categoria}: {s['successes']} sucessos em "
                                 f"{s['n_obs']} (limite inferior de Wilson {s['wilson_lower']:.2f}, score "
                                 f"{s['score']:.2f}; heurística estatística).")))
        oc = optimize_context(itens, orcamento, primary_count=self.config.optimizer.primary_count,
                              jaccard_threshold=self.config.optimizer.jaccard_threshold,
                              shingle_size=self.config.optimizer.shingle_size,
                              chars_per_token=self.config.optimizer.chars_per_token) if itens else None
        no_contexto = {i["id"]: i for i in (oc.items if oc else [])}
        passo("compactar", tokens_raw=oc.tokens_raw if oc else 0, tokens_optimized=oc.tokens_optimized if oc else 0)

        # 9. registrar
        resultados = []
        for a in avaliados:
            m = a["hit"].memory
            entrou = m.id in no_contexto
            motivo = a.get("reason", "over_limit")  # sem motivo: passou do limite por grupo
            if a.get("included") and not entrou:
                motivo = "dropped_by_optimizer"
            resultados.append({"id": m.id, "kind": m.kind, "score": a["hit"].score, "relevance": a["relevance"],
                               "trust": a["trust"], "included": entrou,
                               "mode": no_contexto[m.id]["mode"] if entrou else None, "reason": motivo})
        incluidos = [r["id"] for r in resultados if r["included"]]
        latencia = round((time.perf_counter() - inicio) * 1000, 2)
        filtros = {"category": categoria, "mode": cls["mode"], "project": project, "kinds": tipos,
                   "budget_tokens": orcamento, "min_relevance": cfg.min_relevance, "min_trust": cfg.min_trust}
        def registrar(_conn: Any) -> int:
            if session_id:
                self.tasks.ensure_session(session_id, agora, project=project)
            cur = self.db.conn.execute(
                "INSERT INTO retrievals (task_id, session_id, query, filters, results, n_results, insufficient,"
                " latency_ms, tokens_estimated, tokens_raw, tokens_optimized, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, session_id, consulta, json.dumps(filtros, ensure_ascii=False), json.dumps(resultados),
                 len(incluidos), int(insuficiente), latencia, oc.tokens_optimized if oc else 0,
                 oc.tokens_raw if oc else 0, oc.tokens_optimized if oc else 0, agora))
            rid = int(cur.lastrowid)
            if incluidos:
                self.memories.memories.touch(incluidos, agora)
            self.memories.events.log(agora, "router.routed", "task", task_id, {
                "retrieval_id": rid, "category": categoria, "included": len(incluidos),
                "insufficient": insuficiente, "latency_ms": latencia})
            return rid

        gravou, retrieval_id = self.db.try_write(registrar) if gravou_tarefa else (False, None)
        passo("registrar", retrieval_id=retrieval_id)

        memorias = []
        for r in resultados:
            if r["included"]:
                m = next(a["hit"].memory for a in avaliados if a["hit"].memory.id == r["id"])
                memorias.append({"id": m.id, "kind": m.kind, "title": m.title, "project": m.project,
                                 "relevance": r["relevance"], "trust": r["trust"], "score": r["score"],
                                 "mode": r["mode"], "value": no_contexto[m.id]["value"]})
        memorias.sort(key=lambda x: (-x["value"], x["id"]))
        return {
            "task_id": task_id, "retrieval_id": retrieval_id, "recorded": bool(gravou and gravou_tarefa),
            "insufficient": insuficiente,
            "message": INSUFICIENTE if insuficiente else (f"{len(memorias)} memória relevante no contexto" if len(memorias) == 1
                                               else f"{len(memorias)} memórias relevantes no contexto"),
            "classification": cls, "context": oc.text if (oc and not insuficiente) else "",
            "memories": memorias if not insuficiente else [], "procedures": procedimentos,
            "strategies": estrategias,
            "tokens": {"raw": oc.tokens_raw if oc else 0, "optimized": oc.tokens_optimized if oc else 0,
                       "budget": orcamento, "source": "estimated"},
            "dropped": oc.dropped if oc else [], "latency_ms": latencia, "steps": passos,
        }
