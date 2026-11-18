"""Consolidação: junta memórias quase iguais numa só.

Com o uso, a mesma lição aparece mais de uma vez com palavras quase iguais. A
consolidação agrupa as memórias ativas do mesmo tipo e do mesmo projeto cujo cosseno
passa do limiar (union-find: se A≈B e B≈C, as três ficam no mesmo grupo) e, em cada grupo:
- a vencedora é a de maior qualidade × confiança (empate: importância, depois acessos);
- ela fica com a soma dos acessos, o último acesso mais recente, a união das tags e a
  maior importância e confiança do grupo;
- as outras ficam com status 'merged' e merged_into = vencedora (nada é apagado);
- as relações das outras passam para a vencedora.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Optional

import numpy as np
from pydantic import BaseModel

from hela.memory.service import MemoryService
from hela.storage.repositories.memories import MemoryFilter, row_to_dict


class ClusterReport(BaseModel):
    winner: str
    merged: list[str]
    min_similarity: float


class ConsolidationReport(BaseModel):
    clusters: list[ClusterReport]
    merged: int
    dry_run: bool


class _UniaoBusca:
    def __init__(self, n: int) -> None:
        self.pai = list(range(n))

    def achar(self, i: int) -> int:
        while self.pai[i] != i:
            self.pai[i] = self.pai[self.pai[i]]
            i = self.pai[i]
        return i

    def unir(self, a: int, b: int) -> None:
        self.pai[self.achar(a)] = self.achar(b)


def _chave_vencedora(m: dict[str, Any]) -> tuple:
    return (float(m["quality"]) * float(m["confidence"]), float(m["importance"]), int(m["access_count"]),
            len(m["content"]), m["created_at"])


def consolidate(service: MemoryService, threshold: Optional[float] = None, dry_run: bool = False) -> ConsolidationReport:
    limiar = service.config.consolidation.threshold if threshold is None else threshold
    repo = service.memories
    rows = repo.list(MemoryFilter(), limit=1_000_000, order="created_at ASC")
    grupos: dict[tuple, list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        if r["embedding"] is not None and r["embedding_model"] == service.embedder.name:
            d = row_to_dict(r)
            d["_vetor"] = np.frombuffer(r["embedding"], dtype=np.float32)
            grupos[(d["kind"], d["project"])].append(d)

    clusters: list[tuple[dict[str, Any], list[dict[str, Any]], float]] = []
    for membros in grupos.values():
        if len(membros) < 2:
            continue
        matriz = np.vstack([m["_vetor"] for m in membros])
        sims = matriz @ matriz.T
        ub = _UniaoBusca(len(membros))
        pares = np.argwhere(np.triu(sims, k=1) >= limiar)
        for i, j in pares:
            ub.unir(int(i), int(j))
        por_raiz: dict[int, list[int]] = defaultdict(list)
        for i in range(len(membros)):
            por_raiz[ub.achar(i)].append(i)
        for indices in por_raiz.values():
            if len(indices) < 2:
                continue
            sub = sims[np.ix_(indices, indices)]
            grupo = [membros[i] for i in indices]
            vencedora = max(grupo, key=_chave_vencedora)
            outras = [m for m in grupo if m["id"] != vencedora["id"]]
            clusters.append((vencedora, outras, float(sub.min())))

    relatorio = ConsolidationReport(
        clusters=[ClusterReport(winner=v["id"], merged=[o["id"] for o in os_], min_similarity=round(s, 4))
                  for v, os_, s in clusters],
        merged=sum(len(os_) for _, os_, _ in clusters),
        dry_run=dry_run,
    )
    if dry_run:
        return relatorio

    with service.db.transaction():
        agora = service.now()
        for vencedora, outras, _ in clusters:
            grupo = [vencedora, *outras]
            acessos = [m["last_accessed"] for m in grupo if m["last_accessed"]]
            repo.update(vencedora["id"], {
                "access_count": sum(int(m["access_count"]) for m in grupo),
                "last_accessed": max(acessos) if acessos else None,
                "tags": sorted({t for m in grupo for t in m["tags"]}),
                "importance": max(float(m["importance"]) for m in grupo),
                "confidence": max(float(m["confidence"]) for m in grupo),
                "updated_at": agora,
            })
            for outra in outras:
                repo.update(outra["id"], {"status": "merged", "merged_into": vencedora["id"], "updated_at": agora})
                service.relationships.repoint(outra["id"], vencedora["id"], agora)
                service.events.log(agora, "memory.merged", "memory", outra["id"], {"into": vencedora["id"]})
        service.events.log(agora, "consolidation.run", None, None,
                           {"clusters": len(clusters), "merged": relatorio.merged, "threshold": limiar})
    return relatorio
