"""Evolution Engine: propõe melhorias, testa cada uma offline, versiona o que for aplicado e desfaz.

Tipos de proposta e o teste de cada uma:

| tipo               | o que muda                                 | teste (métrica)                                     |
|--------------------|--------------------------------------------|-----------------------------------------------------|
| adjust_weights     | pesos do Strategy Ranker                   | replay prequencial dos resultados: Brier do score   |
| deprecate_strategy | estratégia vira 'retired'                  | Wilson: o teto dela fica abaixo do piso da melhor   |
| promote_procedure  | memória do procedimento: importância 0,9 e | limite inferior de Wilson dos usos do procedimento  |
|                    | tag 'promovido' (nunca aprova script)      |                                                     |
| merge_duplicates   | quase-duplicatas viram uma (consolidação)  | menor cosseno do grupo ≥ evolution.duplicate_threshold |

Replay (adjust_weights): os resultados são percorridos em ordem de tempo. Para cada um, o score da
estratégia usada é calculado só com os resultados anteriores e lido como probabilidade de sucesso;
Brier = média de (p − y)². Cada previsão é fora da amostra (prequencial). A proposta só é
recomendada (status 'tested') se o Brier do candidato for menor que o atual por pelo menos
evolution.min_improvement; senão fica 'rejected', com os números, para auditoria.

Aplicar exige status 'tested' e grava um snapshot em versions (os pesos novos são a própria versão
nova, com parent_id na anterior; os outros tipos gravam o estado anterior em 'snapshot:<tipo>').
Rollback restaura o snapshot: para os pesos, reativa a versão anterior, que é a mesma linha (os
mesmos bytes).

Isto é uma heurística de evolução com teste offline, não aprendizado por reforço. Thompson sampling
(exploração) existe no ranker como opção, desligado por padrão.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.execution.procedures import ProcedureService
from hela.learning.ranker import COMPONENTS, StrategyRanker, StrategyStats, outcome_row, score_strategies, wilson_interval
from hela.memory.consolidation import consolidate, merge_group
from hela.memory.service import MemoryService
from hela.storage.repositories.memories import row_to_dict

TAG_PROMOVIDO = "promovido"
ABERTOS = ("proposed", "tested", "applied")


class EvolutionEngine:
    def __init__(self, memories: MemoryService, ranker: StrategyRanker, procedures: ProcedureService,
                 config: HelaConfig, clock: Clock = utcnow) -> None:
        self.memories = memories
        self.db = memories.db
        self.ranker = ranker
        self.procedures = procedures
        self.config = config
        self.clock = clock

    # --- replay ----------------------------------------------------------------------------
    def history(self) -> list[dict[str, Any]]:
        rows = self.db.conn.execute(
            "SELECT o.*, t.category FROM outcomes o JOIN tasks t ON t.id = o.task_id"
            " WHERE o.strategy_id IS NOT NULL AND o.success IS NOT NULL ORDER BY o.created_at, o.id").fetchall()
        return [{"strategy_id": r["strategy_id"], "category": r["category"] or "", **outcome_row(r)} for r in rows]

    def replay_brier(self, weights: dict[str, float], rows: Optional[list[dict[str, Any]]] = None) -> dict[str, Any]:
        cfg = self.config.learning.ranker
        historico = self.history() if rows is None else rows
        estado: dict[str, dict[str, StrategyStats]] = {}
        erro, n = 0.0, 0
        for r in historico:
            stats = estado.setdefault(r["category"], {})
            candidatos = {sid: s for sid, s in stats.items()}
            candidatos.setdefault(r["strategy_id"], StrategyStats())
            p = score_strategies(candidatos, weights, cfg.z, cfg.quality_prior,
                                 cfg.quality_prior_weight)[r["strategy_id"]]["score"]
            y = 1.0 if r["success"] else 0.0
            erro += (p - y) ** 2
            n += 1
            stats.setdefault(r["strategy_id"], StrategyStats()).add(r)
        return {"brier": round(erro / n, 6) if n else None, "n": n}

    # --- propostas -------------------------------------------------------------------------
    def _pendente(self, tipo: str, alvo: str) -> bool:
        for r in self.db.conn.execute("SELECT proposal FROM evolution_proposals WHERE status IN ('proposed','tested')"):
            p = json.loads(r["proposal"])
            if p.get("type") == tipo and p.get("target") == alvo:
                return True
        return False

    def _gravar(self, component: str, tipo: str, alvo: str, descricao: str, dados: dict[str, Any],
                metrica: str, base: Optional[float], candidato: Optional[float], recomendada: bool) -> dict[str, Any]:
        agora = to_iso(self.clock())
        proposta = {"type": tipo, "target": alvo, **dados}
        with self.db.transaction():
            cur = self.db.conn.execute(
                "INSERT INTO evolution_proposals (component, description, proposal, metric_name, baseline_metric,"
                " candidate_metric, status, created_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (component, descricao, json.dumps(proposta, ensure_ascii=False), metrica, base, candidato,
                 "tested" if recomendada else "rejected", agora, None if recomendada else agora))
            self.memories.events.log(agora, "evolution.proposed", "proposal", str(cur.lastrowid),
                                     {"type": tipo, "recommended": recomendada, "metric": metrica})
        return self.get(int(cur.lastrowid))

    def _propor_pesos(self) -> tuple[list[dict[str, Any]], Optional[dict[str, str]]]:
        ev = self.config.learning.evolution
        historico = self.history()
        if len(historico) < ev.min_outcomes:
            return [], {"type": "adjust_weights",
                        "reason": f"replay precisa do mínimo de {ev.min_outcomes} resultados (há {len(historico)})"}
        if self._pendente("adjust_weights", "ranker.weights"):
            return [], {"type": "adjust_weights", "reason": "já existe uma proposta de pesos aguardando decisão"}
        atual = self.ranker.weights.active()
        base = self.replay_brier(atual["weights"], historico)["brier"]
        melhor: Optional[tuple[float, dict[str, float], str]] = None
        for de in COMPONENTS:  # busca por coordenadas: passa `weight_step` de um componente para outro
            if atual["weights"][de] < ev.weight_step - 1e-9:
                continue
            for para in COMPONENTS:
                if para == de:
                    continue
                cand = dict(atual["weights"])
                cand[de] = round(cand[de] - ev.weight_step, 6)
                cand[para] = round(cand[para] + ev.weight_step, 6)
                b = self.replay_brier(cand, historico)["brier"]
                if b is not None and (melhor is None or b < melhor[0]):
                    melhor = (b, cand, f"{de} → {para}")
        if melhor is None or base is None:
            return [], {"type": "adjust_weights", "reason": "nenhum candidato válido"}
        recomendada = base - melhor[0] >= ev.min_improvement
        desc = (f"Pesos do ranker: mover {ev.weight_step} de {melhor[2]}. Brier do replay {base:.4f} → "
                f"{melhor[0]:.4f} em {len(historico)} resultados")
        return [self._gravar("ranker.weights", "adjust_weights", "ranker.weights", desc,
                             {"weights": melhor[1], "from_version": atual["version"], "n_outcomes": len(historico),
                              "move": melhor[2]}, "brier_replay", base, melhor[0], recomendada)], None

    def _propor_depreciacoes(self) -> list[dict[str, Any]]:
        ev, z = self.config.learning.evolution, self.config.learning.ranker.z
        saida = []
        categorias = [r[0] for r in self.db.conn.execute(
            "SELECT DISTINCT t.category FROM outcomes o JOIN tasks t ON t.id = o.task_id"
            " WHERE o.strategy_id IS NOT NULL AND t.category IS NOT NULL ORDER BY 1")]
        for cat in categorias:
            ativas = {c["id"]: c for c in self.ranker.candidates(cat)}
            stats = {sid: s for sid, s in self.ranker.stats(cat, list(ativas)).items() if s.n >= ev.deprecate_min_obs}
            if len(stats) < 2:
                continue
            limites = {sid: wilson_interval(s.successes, s.n, z) for sid, s in stats.items()}
            melhor = max(limites, key=lambda k: (limites[k][0], k))
            for sid, (_lo, hi) in limites.items():
                if sid == melhor or hi >= limites[melhor][0] or self._pendente("deprecate_strategy", sid):
                    continue
                nome = ativas[sid]["name"]
                desc = (f"Depreciar a estratégia '{nome}' em {cat}: teto de Wilson {hi:.2f} abaixo do piso "
                        f"{limites[melhor][0]:.2f} de '{ativas[melhor]['name']}'")
                saida.append(self._gravar("strategy", "deprecate_strategy", sid, desc,
                                          {"target_name": nome, "category": cat, "better": melhor,
                                           "n_obs": stats[sid].n}, "wilson_gap", round(hi, 6),
                                          round(limites[melhor][0], 6), True))
        return saida

    def _propor_promocoes(self) -> list[dict[str, Any]]:
        ev, z = self.config.learning.evolution, self.config.learning.ranker.z
        saida = []
        for r in self.db.conn.execute(
                "SELECT p.id, p.name, p.memory_id, p.success_count, p.failure_count, m.tags, m.source, m.metadata"
                " FROM procedures p JOIN memories m ON m.id = p.memory_id WHERE m.status = 'active'"
                " ORDER BY p.id").fetchall():
            n = r["success_count"] + r["failure_count"]
            if n < ev.promote_min_obs or TAG_PROMOVIDO in json.loads(r["tags"]):
                continue
            if not ProcedureService.trusted({"source": r["source"], "metadata": json.loads(r["metadata"] or "{}")}):
                continue
            lo, _hi = wilson_interval(r["success_count"], n, z)
            if lo < ev.promote_min_wilson or self._pendente("promote_procedure", r["id"]):
                continue
            desc = (f"Promover o procedimento '{r['name']}': {r['success_count']} sucessos em {n} usos "
                    f"(limite inferior de Wilson {lo:.2f})")
            saida.append(self._gravar("procedure", "promote_procedure", r["id"], desc,
                                      {"target_name": r["name"], "memory_id": r["memory_id"], "n_obs": n},
                                      "wilson_lower", ev.promote_min_wilson, round(lo, 6), True))
        return saida

    def _propor_mesclas(self) -> list[dict[str, Any]]:
        ev = self.config.learning.evolution
        saida = []
        rel = consolidate(self.memories, threshold=ev.duplicate_threshold, dry_run=True)
        for c in rel.clusters:
            ids = sorted([c.winner, *c.merged])
            alvo = ",".join(ids)
            if self._pendente("merge_duplicates", alvo):
                continue
            desc = f"Mesclar {len(ids)} memórias quase iguais (menor cosseno {c.min_similarity:.2f}) em {c.winner}"
            saida.append(self._gravar("memory", "merge_duplicates", alvo, desc,
                                      {"winner": c.winner, "merged": c.merged, "memory_ids": ids},
                                      "min_cosine", ev.duplicate_threshold, c.min_similarity, True))
        return saida

    def propose(self) -> dict[str, Any]:
        """Gera e testa as propostas. Só as 'tested' são recomendadas; nada é aplicado sozinho."""
        propostas, pulados = [], []
        pesos, pulo = self._propor_pesos()
        propostas += pesos
        if pulo:
            pulados.append(pulo)
        propostas += self._propor_depreciacoes() + self._propor_promocoes() + self._propor_mesclas()
        return {"proposals": propostas, "skipped": pulados,
                "recommended": [p["id"] for p in propostas if p["recommended"]]}

    # --- leitura ---------------------------------------------------------------------------
    @staticmethod
    def _ver(row: Any) -> dict[str, Any]:
        p = json.loads(row["proposal"])
        return {"id": row["id"], "type": p.get("type"), "component": row["component"],
                "description": row["description"], "proposal": p, "target_name": p.get("target_name"),
                "metric_name": row["metric_name"], "baseline_metric": row["baseline_metric"],
                "candidate_metric": row["candidate_metric"], "status": row["status"],
                "recommended": row["status"] in ("tested", "applied"), "version_id": row["version_id"],
                "created_at": row["created_at"], "decided_at": row["decided_at"]}

    def get(self, proposal_id: int) -> dict[str, Any]:
        row = self.db.conn.execute("SELECT * FROM evolution_proposals WHERE id = ?", (proposal_id,)).fetchone()
        if row is None:
            raise NotFound(f"proposta não encontrada: {proposal_id}")
        return self._ver(row)

    def list(self, status: Optional[str] = None, limit: int = 100) -> list[dict[str, Any]]:
        if status is not None and status not in ("proposed", "tested", "applied", "rejected", "rolled_back"):
            raise InvalidInput("status inválido")
        sql = "SELECT * FROM evolution_proposals" + (" WHERE status = ?" if status else "") + " ORDER BY id DESC LIMIT ?"
        return [self._ver(r) for r in self.db.conn.execute(sql, ([status] if status else []) + [limit])]

    # --- aplicar e desfazer ----------------------------------------------------------------
    def _snapshot(self, tipo: str, proposal_id: int, dados: dict[str, Any]) -> int:
        cur = self.db.conn.execute(
            "INSERT INTO versions (component, version, data, active, note, created_at) VALUES (?, ?, ?, 0, ?, ?)",
            (f"snapshot:{tipo}", proposal_id, json.dumps(dados, ensure_ascii=False),
             f"estado anterior à proposta {proposal_id}", to_iso(self.clock())))
        return int(cur.lastrowid)

    def _decidir(self, proposal_id: int, status: str, version_id: Optional[int] = None) -> None:
        agora = to_iso(self.clock())
        if version_id is None:
            self.db.conn.execute("UPDATE evolution_proposals SET status = ?, decided_at = ? WHERE id = ?",
                                 (status, agora, proposal_id))
        else:
            self.db.conn.execute("UPDATE evolution_proposals SET status = ?, decided_at = ?, version_id = ?"
                                 " WHERE id = ?", (status, agora, version_id, proposal_id))
        self.memories.events.log(agora, f"evolution.{status}", "proposal", str(proposal_id), {})

    def apply(self, proposal_id: int) -> dict[str, Any]:
        p = self.get(proposal_id)
        if p["status"] != "tested":
            raise InvalidInput(f"só uma proposta testada e recomendada pode ser aplicada (esta está '{p['status']}')")
        dados, tipo = p["proposal"], p["type"]
        if tipo == "adjust_weights":
            nova = self.ranker.weights.create(dados["weights"], note=f"proposta {proposal_id}: {p['description']}",
                                              activate=True)
            with self.db.transaction():
                self._decidir(proposal_id, "applied", nova["id"])
            return self.get(proposal_id)
        with self.db.transaction():
            if tipo == "deprecate_strategy":
                anterior = self.db.conn.execute("SELECT status FROM strategies WHERE id = ?",
                                                (dados["target"],)).fetchone()
                if anterior is None:
                    raise NotFound("a estratégia da proposta não existe mais")
                vid = self._snapshot(tipo, proposal_id, {"strategy_id": dados["target"], "status": anterior["status"]})
                self.db.conn.execute("UPDATE strategies SET status = 'retired' WHERE id = ?", (dados["target"],))
            elif tipo == "promote_procedure":
                m = self.memories.get(dados["memory_id"], record_access=False)
                vid = self._snapshot(tipo, proposal_id, {"memory_id": m.id, "importance": m.importance, "tags": m.tags})
                self.memories.memories.update(m.id, {"importance": max(m.importance, 0.9),
                                                     "tags": sorted(set(m.tags) | {TAG_PROMOVIDO}),
                                                     "updated_at": self.memories.now()})
            elif tipo == "merge_duplicates":
                ids = dados["memory_ids"]
                linhas = [row_to_dict(r) for r in (self.memories.memories.get(i) for i in ids) if r is not None]
                if len(linhas) != len(ids) or any(m["status"] != "active" for m in linhas):
                    raise InvalidInput("as memórias da proposta mudaram desde o teste; gere a proposta de novo")
                campos = ("status", "merged_into", "access_count", "last_accessed", "tags", "importance",
                          "confidence", "updated_at")
                marcas = ",".join("?" * len(ids))
                arestas = [dict(r) for r in self.db.conn.execute(
                    f"SELECT * FROM relationships WHERE source_id IN ({marcas}) OR target_id IN ({marcas})",
                    [*ids, *ids])]
                vid = self._snapshot(tipo, proposal_id, {"memories": [{c: m[c] for c in ("id", *campos)}
                                                                      for m in linhas], "relationships": arestas})
                vencedora = next(m for m in linhas if m["id"] == dados["winner"])
                merge_group(self.memories, vencedora, [m for m in linhas if m["id"] != dados["winner"]],
                            self.memories.now())
            else:  # pragma: no cover - tipos são fechados
                raise InvalidInput(f"tipo de proposta desconhecido: {tipo}")
            self._decidir(proposal_id, "applied", vid)
        return self.get(proposal_id)

    def rollback(self, proposal_id: int) -> dict[str, Any]:
        p = self.get(proposal_id)
        if p["status"] != "applied":
            raise InvalidInput(f"só uma proposta aplicada pode ser desfeita (esta está '{p['status']}')")
        tipo = p["type"]
        if tipo == "adjust_weights":
            ativa = self.ranker.weights.active()
            if ativa["id"] != p["version_id"]:
                raise InvalidInput("outra versão dos pesos foi ativada depois desta; desfaça a mais recente primeiro")
            self.ranker.weights.activate(ativa["parent_id"])
            with self.db.transaction():
                self._decidir(proposal_id, "rolled_back")
            return self.get(proposal_id)
        snap = self.db.conn.execute("SELECT data FROM versions WHERE id = ?", (p["version_id"],)).fetchone()
        if snap is None:
            raise NotFound("o snapshot desta proposta não existe mais")
        dados = json.loads(snap["data"])
        with self.db.transaction():
            if tipo == "deprecate_strategy":
                self.db.conn.execute("UPDATE strategies SET status = ? WHERE id = ?",
                                     (dados["status"], dados["strategy_id"]))
            elif tipo == "promote_procedure":
                self.memories.memories.update(dados["memory_id"], {"importance": dados["importance"],
                                                                   "tags": dados["tags"],
                                                                   "updated_at": self.memories.now()})
            elif tipo == "merge_duplicates":
                ids = [m["id"] for m in dados["memories"]]
                marcas = ",".join("?" * len(ids))
                self.db.conn.execute(
                    f"DELETE FROM relationships WHERE source_id IN ({marcas}) OR target_id IN ({marcas})",
                    [*ids, *ids])
                for m in dados["memories"]:
                    self.memories.memories.update(m["id"], {k: v for k, v in m.items() if k != "id"})
                for a in dados["relationships"]:
                    cols = list(a)
                    self.db.conn.execute(f"INSERT INTO relationships ({','.join(cols)}) VALUES "
                                         f"({','.join('?' * len(cols))})", [a[c] for c in cols])
            self._decidir(proposal_id, "rolled_back")
        return self.get(proposal_id)
