"""Feedback Learner: o que a HELA aprende com um resultado.

Três entradas:
1. record_outcome: o resultado de uma tarefa (sucesso, qualidade, custos, estratégia usada).
   - grava em outcomes e fecha a tarefa (done/failed);
   - recalcula strategy_metrics da estratégia (na categoria da tarefa e na visão geral);
   - reforça ou decai qualidade e confiança das memórias usadas (as que entraram no contexto da
     tarefa, lidas de retrievals, ou as informadas) e grava uma linha de feedback para cada uma;
   - conta sucesso/falha nos procedimentos dessas memórias.
2. rate_memory: uma nota direta (−1, 0, +1) numa memória.
3. correct_category: a categoria certa de uma tarefa. Vira rótulo 'feedback', que o classificador
   pode usar no treino (é um rótulo humano, não das regras).

Os passos de reforço e decaimento são regras fixas (learning.feedback no config), não aprendidos.
"""

from __future__ import annotations

import json
import math
import re
from typing import Any, Iterable, Optional

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.learning.ranker import StrategyRanker
from hela.memory.service import MemoryService
from hela.security.redaction import redact
from hela.storage.repositories.tasks import TaskRepository

CATEGORIA = re.compile(r"^[a-z][a-z0-9_]{0,39}$")
TOKEN_KEYS = ("input", "output", "cache_read", "cache_creation", "thinking")
FONTES = ("user", "claude", "hook", "auto")


def _faixa(nome: str, valor: Optional[float], minimo: float = 0.0, maximo: Optional[float] = None) -> None:
    if valor is None:
        return
    if isinstance(valor, bool) or not isinstance(valor, (int, float)) or not math.isfinite(valor):
        raise InvalidInput(f"{nome} precisa ser um número")
    if valor < minimo or (maximo is not None and valor > maximo):
        faixa = f"entre {minimo} e {maximo}" if maximo is not None else f">= {minimo}"
        raise InvalidInput(f"{nome} precisa estar {faixa}")


class FeedbackLearner:
    def __init__(self, memories: MemoryService, ranker: StrategyRanker, config: HelaConfig,
                 clock: Clock = utcnow) -> None:
        self.memories = memories
        self.db = memories.db
        self.ranker = ranker
        self.config = config
        self.clock = clock
        self.tasks = TaskRepository(self.db.conn)

    def _redigir(self, texto: Optional[str]) -> Optional[str]:
        if texto is None:
            return None
        sec = self.config.security
        return redact(texto[:2000], entropy_threshold=sec.entropy_threshold,
                      entropy_min_length=sec.entropy_min_length).text

    def _tarefa(self, task_id: str) -> dict[str, Any]:
        t = self.tasks.get(task_id)
        if t is None:
            raise NotFound(f"tarefa não encontrada: {task_id}")
        return t

    def _ajustar(self, memory_id: str, dq: float, dc: float, cap: Optional[float]) -> Any:
        """adjust_quality com teto opcional para reforço (o decaimento nunca é limitado)."""
        if cap is not None and (dq > 0 or dc > 0):
            atual = self.memories.get(memory_id, record_access=False)
            if dq > 0:
                dq = max(0.0, min(dq, cap - atual.quality))
            if dc > 0:
                dc = max(0.0, min(dc, cap - atual.confidence))
        return self.memories.adjust_quality(memory_id, dq, dc)

    def _ja_avaliada(self, memory_id: str, task_id: str) -> bool:
        return self.db.conn.execute("SELECT 1 FROM feedback WHERE memory_id = ? AND task_id = ? LIMIT 1",
                                    (memory_id, task_id)).fetchone() is not None

    def used_memories(self, task_id: str) -> list[str]:
        """Memórias que entraram no contexto da tarefa (included=True nas recuperações dela)."""
        ids: list[str] = []
        for r in self.db.conn.execute("SELECT results FROM retrievals WHERE task_id = ? ORDER BY id", (task_id,)):
            for item in json.loads(r["results"] or "[]"):
                if isinstance(item, dict) and item.get("included") and item.get("id") not in ids:
                    ids.append(item["id"])
        return ids

    # --- resultado de tarefa --------------------------------------------------------------
    def record_outcome(self, task_id: str, success: Optional[bool] = None, quality: Optional[float] = None,
                       duration_ms: Optional[float] = None, attempts: Optional[int] = None,
                       tokens: Optional[dict[str, int]] = None, token_source: Optional[str] = None,
                       compute_cost: Optional[float] = None, strategy: Optional[str] = None,
                       notes: Optional[str] = None, used_memory_ids: Optional[Iterable[str]] = None,
                       source: str = "claude", quality_cap: Optional[float] = None) -> dict[str, Any]:
        _faixa("quality", quality, 0, 1)
        _faixa("duration_ms", duration_ms)
        _faixa("attempts", attempts)
        _faixa("compute_cost", compute_cost)
        tokens = dict(tokens or {})
        if set(tokens) - set(TOKEN_KEYS):
            raise InvalidInput(f"tokens aceita só as chaves {', '.join(TOKEN_KEYS)}")
        for k, v in tokens.items():
            _faixa(f"tokens.{k}", v)
        if token_source not in (None, "provider", "estimated"):
            raise InvalidInput("token_source precisa ser 'provider' ou 'estimated'")
        if tokens and token_source is None:
            token_source = "estimated"  # sem dizer a origem, nunca conta como dado do provedor
        if source not in FONTES:
            raise InvalidInput(f"source precisa ser um de {', '.join(FONTES)}")
        tarefa = self._tarefa(task_id)
        categoria = tarefa["category"]
        sid = self.ranker.resolve(strategy, category=categoria) if strategy else None
        # Só contam as memórias que o Router devolveu para esta tarefa (revisão F3-A3); o resto é ignorado.
        devolvidas = self.used_memories(task_id)
        pedidas = list(dict.fromkeys(used_memory_ids)) if used_memory_ids is not None else devolvidas
        usadas = [m for m in pedidas if m in devolvidas]
        ignoradas = [m for m in pedidas if m not in devolvidas]
        agora = to_iso(self.clock())
        sucesso = None if success is None else int(bool(success))

        with self.db.transaction():
            cur = self.db.conn.execute(
                "INSERT INTO outcomes (task_id, strategy_id, success, quality, duration_ms, attempts, tokens_input,"
                " tokens_output, tokens_cache_read, tokens_cache_creation, tokens_thinking, token_source,"
                " compute_cost, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, sid, sucesso, quality, duration_ms, attempts, tokens.get("input"), tokens.get("output"),
                 tokens.get("cache_read"), tokens.get("cache_creation"), tokens.get("thinking"), token_source,
                 compute_cost, self._redigir(notes), agora))
            outcome_id = int(cur.lastrowid)
            if sucesso is not None:
                self.tasks.update(task_id, status="done" if sucesso else "failed", completed_at=agora)
            self.memories.events.log(agora, "learning.outcome", "task", task_id,
                                     {"outcome_id": outcome_id, "success": sucesso, "strategy_id": sid,
                                      "memories": len(usadas)})

        ajustadas, procedimentos = [], []
        if sucesso is not None:
            fb = self.config.learning.feedback
            for mid in usadas:
                linha = self.memories.memories.get(mid)
                if linha is None or linha["status"] != "active" or self._ja_avaliada(mid, task_id):
                    continue  # apagada, fora de 'active' ou já reforçada por esta tarefa
                if sucesso:
                    peso = 1.0 if quality is None else quality
                    dq, dc, nota = fb.reinforce_quality * peso, fb.reinforce_confidence, 1
                else:
                    dq, dc, nota = -fb.decay_quality, -fb.decay_confidence, -1
                m = self._ajustar(mid, dq, dc, quality_cap)
                with self.db.transaction():
                    self.db.conn.execute(
                        "INSERT INTO feedback (memory_id, task_id, rating, score, source, created_at)"
                        " VALUES (?, ?, ?, ?, ?, ?)", (mid, task_id, nota, quality, source, agora))
                    coluna = "success_count" if sucesso else "failure_count"
                    n = self.db.conn.execute(
                        f"UPDATE procedures SET {coluna} = {coluna} + 1, last_used = ?, updated_at = ?"
                        " WHERE memory_id = ?", (agora, agora, mid)).rowcount
                if n:
                    procedimentos.append(mid)
                ajustadas.append({"id": mid, "quality": m.quality, "confidence": m.confidence})
        metricas = None
        if sid:
            self.ranker.refresh_metrics(sid, categoria)
            linha = self.db.conn.execute("SELECT * FROM strategy_metrics WHERE strategy_id = ? AND category = ?",
                                         (sid, categoria or "")).fetchone()
            metricas = dict(linha) if linha else None
        return {"outcome_id": outcome_id, "task_id": task_id,
                "task_status": self._tarefa(task_id)["status"], "strategy_id": sid, "strategy_metrics": metricas,
                "memories_adjusted": ajustadas, "ignored_memory_ids": ignoradas, "procedures_updated": procedimentos,
                "token_source": token_source}

    # --- nota direta ----------------------------------------------------------------------
    def rate_memory(self, memory_id: str, rating: int, comment: Optional[str] = None,
                    task_id: Optional[str] = None, source: str = "user",
                    quality_cap: Optional[float] = None) -> dict[str, Any]:
        if rating not in (-1, 0, 1) or isinstance(rating, bool):
            raise InvalidInput("rating precisa ser -1, 0 ou 1")
        if source not in FONTES:
            raise InvalidInput(f"source precisa ser um de {', '.join(FONTES)}")
        linha = self.memories.memories.get(memory_id)
        if linha is None:
            raise NotFound(f"memória não encontrada: {memory_id}")
        if linha["status"] != "active":
            raise InvalidInput(f"só memória 'active' recebe nota (esta está '{linha['status']}')")
        if task_id is not None:
            self._tarefa(task_id)
            if self._ja_avaliada(memory_id, task_id):
                raise InvalidInput("esta memória já recebeu nota (ou reforço) nesta tarefa: uma por tarefa")
        fb = self.config.learning.feedback
        if rating > 0:
            m = self._ajustar(memory_id, fb.reinforce_quality, fb.reinforce_confidence, quality_cap)
        elif rating < 0:
            m = self.memories.adjust_quality(memory_id, -fb.decay_quality, -fb.decay_confidence)
        else:
            m = self.memories.get(memory_id, record_access=False)
        agora = to_iso(self.clock())
        with self.db.transaction():
            cur = self.db.conn.execute(
                "INSERT INTO feedback (memory_id, task_id, rating, comment, source, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?)", (memory_id, task_id, rating, self._redigir(comment), source, agora))
        return {"feedback_id": int(cur.lastrowid), "memory": {"id": m.id, "quality": m.quality,
                                                              "confidence": m.confidence}}

    # --- rótulo de categoria --------------------------------------------------------------
    def correct_category(self, task_id: str, category: str, source: str = "feedback") -> dict[str, Any]:
        if source not in ("feedback", "explicit"):
            raise InvalidInput("a origem de um rótulo precisa ser 'feedback' ou 'explicit'")
        if not isinstance(category, str) or not CATEGORIA.match(category):
            raise InvalidInput("categoria inválida: use minúsculas, números e _ (até 40), ex.: media")
        anterior = self._tarefa(task_id)
        agora = to_iso(self.clock())
        meta = {**anterior["metadata"], "previous_category": anterior["category"]}
        with self.db.transaction():
            self.tasks.update(task_id, category=category, label_source=source, metadata=meta)
            self.memories.events.log(agora, "learning.label", "task", task_id,
                                     {"from": anterior["category"], "to": category, "source": source})
        return {"task_id": task_id, "category": category, "label_source": source,
                "previous_category": anterior["category"]}
