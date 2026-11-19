"""Busca híbrida: vários sinais, uma lista final, por Reciprocal Rank Fusion (RRF).

Sinais:
- bm25:       relevância textual do FTS5 (termos exatos, sem acento);
- cosine:     similaridade dos vetores do embedder (pega flexões e termos parecidos);
- recency:    o que foi usado ou editado por último;
- quality:    quality × confidence;
- importance: importância declarada;
- graph:      ativação no grafo (encaixe para a Fase 3, via ActivationProvider).

Só bm25 e cosine (e o grafo, quando houver) trazem candidatos. Recência, qualidade e
importância apenas reordenam esses candidatos: uma memória recente mas sem relação com a
consulta nunca entra no resultado só por ser recente.

RRF: score(d) = Σ peso_s / (k + posição_s(d)). Trabalha com posições, não com valores,
então não precisa calibrar a escala do BM25 contra a do cosseno.
"""

from __future__ import annotations

import sqlite3
import time
from dataclasses import replace
from typing import Optional, Protocol

import numpy as np
from pydantic import BaseModel

from hela.core.errors import InvalidInput
from hela.memory.fusion import _ordem_recencia, _ordenar, rrf_fuse  # noqa: F401 (reexportados)
from hela.memory.models import Memory
from hela.memory.service import MemoryService
from hela.storage.repositories.memories import MemoryFilter, row_to_dict

MAX_CONSULTA = 4000
REGISTRO_BUSY_MS = 50  # espera máxima para gravar o registro de uma busca


class ActivationProvider(Protocol):
    """Recebe as sementes (id → força) e devolve a ativação espalhada pelo grafo (id → valor)."""

    def activation(self, seeds: dict[str, float]) -> dict[str, float]:
        ...


class SearchHit(BaseModel):
    memory: Memory
    score: float
    signals: dict[str, Optional[float]]


class HybridSearch:
    def __init__(self, service: MemoryService, activation: Optional[ActivationProvider] = None) -> None:
        self.svc = service
        self.activation = activation

    def search(self, query: str, filtro: Optional[MemoryFilter] = None, limit: Optional[int] = None,
               record_access: bool = True, record: bool = True) -> list[SearchHit]:
        """record=False: só lê, não grava evento nem acesso (caminho do hook, revisão A-2)."""
        inicio = time.perf_counter()
        consulta = (query or "").strip()[:MAX_CONSULTA]
        if not consulta:
            raise InvalidInput("a consulta está vazia")
        cfg = self.svc.config.search
        limite = limit or cfg.limit
        if limite < 1:
            raise InvalidInput("limit precisa ser >= 1")
        agora = self.svc.now()
        filtro = replace(filtro or MemoryFilter())
        if filtro.not_expired_at is None:
            filtro.not_expired_at = agora  # vencida não volta, mesmo antes da limpeza marcar 'expired'
        repo = self.svc.memories

        # 1. Sinais que trazem candidatos.
        bm25 = repo.fts(consulta, filtro, cfg.candidates)
        rank_bm25 = [mid for mid, _ in bm25]
        bm25_bruto = dict(bm25)

        sims: dict[str, float] = {}
        vetor = self.svc.embedder.embed([consulta])[0]
        ids, matriz = repo.embeddings(filtro, self.svc.embedder.name)
        if ids and vetor.any():
            valores = matriz @ vetor
            for i in np.argsort(-valores)[: cfg.candidates]:
                if valores[i] >= cfg.min_cosine:
                    sims[ids[i]] = float(valores[i])
        rank_cos = _ordenar(sims)

        rankings: dict[str, list[str]] = {"bm25": rank_bm25, "cosine": rank_cos}
        candidatos = set(rank_bm25) | set(rank_cos)

        # 2. Encaixe do grafo: as sementes são os candidatos já fundidos pelos sinais textuais.
        if self.activation is not None and candidatos:
            sementes = rrf_fuse(rankings, cfg.weights.model_dump(), cfg.rrf_k)
            ativacao = {m: v for m, v in self.activation.activation(sementes).items() if v > 0}
            if ativacao:
                validos = {r["id"] for r in repo.list(replace(filtro, ids=list(ativacao)), limit=len(ativacao))}
                ativacao = {m: v for m, v in ativacao.items() if m in validos}
                rankings["graph"] = _ordenar(ativacao)
                candidatos |= set(ativacao)

        if not candidatos:
            self._registrar([], inicio, record_access, record)
            return []

        # 3. Sinais que só reordenam os candidatos.
        linhas = {r["id"]: r for r in repo.list(replace(filtro, ids=list(candidatos)), limit=len(candidatos))}
        rankings["recency"] = _ordenar({m: _ordem_recencia(r) for m, r in linhas.items()})
        rankings["quality"] = _ordenar({m: float(r["quality"]) * float(r["confidence"]) for m, r in linhas.items()})
        rankings["importance"] = _ordenar({m: float(r["importance"]) for m, r in linhas.items()})

        fundido = rrf_fuse(rankings, cfg.weights.model_dump(), cfg.rrf_k)
        escolhidos = [m for m in fundido if m in linhas][:limite]
        self._registrar(escolhidos, inicio, record_access, record)

        posicoes = {s: {m: i for i, m in enumerate(lista, start=1)} for s, lista in rankings.items()}
        atual = {r["id"]: r for r in repo.list(MemoryFilter(statuses=None, ids=escolhidos), limit=len(escolhidos))}
        hits = []
        for mid in escolhidos:
            sinais: dict[str, Optional[float]] = {
                s: posicoes.get(s, {}).get(mid) for s in ("bm25", "cosine", "recency", "quality", "importance", "graph")
            }
            sinais["bm25_score"] = bm25_bruto.get(mid)
            sinais["cosine_sim"] = round(sims[mid], 4) if mid in sims else None
            hits.append(SearchHit(memory=Memory.model_validate(row_to_dict(atual[mid])),
                                  score=round(fundido[mid], 6), signals=sinais))
        return hits

    def _registrar(self, ids: list[str], inicio: float, record_access: bool, record: bool = True) -> None:
        """Atualiza o acesso dos resultados e grava o evento (sem o texto da consulta).

        Melhor esforço (revisão A-2): a busca já está calculada; se outro processo segura a escrita,
        o registro espera no máximo REGISTRO_BUSY_MS e é descartado, em vez de derrubar a busca.
        """
        if not record:
            return
        conn = self.svc.db.conn
        anterior = int(conn.execute("PRAGMA busy_timeout").fetchone()[0])
        conn.execute(f"PRAGMA busy_timeout = {REGISTRO_BUSY_MS}")
        try:
            with self.svc.db.transaction():
                agora = self.svc.now()
                if record_access:
                    self.svc.memories.touch(ids, agora)
                self.svc.events.log(agora, "memory.searched", "search", None, {
                    "n_results": len(ids), "ids": ids, "latency_ms": round((time.perf_counter() - inicio) * 1000, 2),
                })
        except sqlite3.OperationalError:
            pass  # banco ocupado: o resultado vale mais que o registro
        finally:
            conn.execute(f"PRAGMA busy_timeout = {anterior}")
