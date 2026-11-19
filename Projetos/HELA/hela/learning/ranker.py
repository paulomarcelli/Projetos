"""Strategy Ranker: ordena estratégias pela evidência acumulada.

**É uma heurística estatística, não um modelo treinado.** O score é uma soma ponderada de
componentes em [0, 1], com pesos que somam 1:

- success:  limite inferior do intervalo de Wilson (z = 1,96) da taxa de sucesso. Com poucas
            observações ele fica baixo de propósito: 1 acerto em 1 vale menos que 10 em 10;
- quality:  média da qualidade com encolhimento para 0,5 (2 observações fictícias);
- tokens, duration, attempts, compute: custos, cada um como 1 − x/(x + ref), onde x é a média da
            estratégia e ref é a mediana das médias dos candidatos. Na mediana vale 0,5; mais barato
            que a mediana passa de 0,5. Custo desconhecido vale 0,5 (neutro).

Os pesos são versionados: o padrão está em config/ranker_weights.json (cópia de DEFAULT_WEIGHTS) e a
versão ativa fica na tabela versions (componente 'ranker.weights'). O Evolution Engine cria versões
novas e faz rollback. Thompson sampling existe como opção de **exploração** (desligado por padrão).

Este módulo não importa numpy no topo (thompson_pick usa random da biblioteca padrão).
"""

from __future__ import annotations

import json
import math
import random
import uuid
from dataclasses import dataclass, fields
from statistics import median
from typing import Any, Iterable, Optional

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.storage.db import Database

COMPONENTS: tuple[str, ...] = ("success", "quality", "tokens", "duration", "attempts", "compute")
DEFAULT_WEIGHTS: dict[str, float] = {
    "success": 0.45, "quality": 0.2, "tokens": 0.1, "duration": 0.1, "attempts": 0.1, "compute": 0.05,
}
WEIGHTS_COMPONENT = "ranker.weights"
METHOD = "heurística estatística: limite inferior de Wilson + qualidade + custos normalizados (pesos versionados)"


def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Intervalo de Wilson para a proporção successes/n. Com n = 0 devolve (0, 1): não se sabe nada."""
    if n <= 0:
        return 0.0, 1.0
    p = successes / n
    z2 = z * z
    den = 1 + z2 / n
    centro = (p + z2 / (2 * n)) / den
    margem = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den
    return max(0.0, centro - margem), min(1.0, centro + margem)


def normalize_weights(pesos: dict[str, float]) -> dict[str, float]:
    """Confere os componentes e divide pela soma (os pesos passam a somar 1)."""
    if set(pesos) != set(COMPONENTS):
        raise ValueError(f"os pesos precisam ter exatamente os componentes {', '.join(COMPONENTS)}")
    if any(not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0 for v in pesos.values()):
        raise ValueError("cada peso precisa ser um número >= 0")
    total = sum(pesos.values())
    if total <= 0:
        raise ValueError("a soma dos pesos precisa ser > 0")
    return {c: pesos[c] / total for c in COMPONENTS}


@dataclass
class StrategyStats:
    """Agregado dos resultados de uma estratégia. Médias ignoram valores ausentes (como o AVG do SQL)."""

    n: int = 0
    successes: int = 0
    quality_sum: float = 0.0
    quality_n: int = 0
    tokens_sum: float = 0.0
    tokens_n: int = 0
    duration_sum: float = 0.0
    duration_n: int = 0
    attempts_sum: float = 0.0
    attempts_n: int = 0
    compute_sum: float = 0.0
    compute_n: int = 0

    def add(self, r: dict[str, Any]) -> None:
        """r: success (0/1), quality, tokens, duration_ms, attempts, compute_cost (qualquer um pode ser None)."""
        if r.get("success") is None:
            return
        self.n += 1
        self.successes += int(bool(r["success"]))
        for campo, chave in (("quality", "quality"), ("tokens", "tokens"), ("duration", "duration_ms"),
                             ("attempts", "attempts"), ("compute", "compute_cost")):
            v = r.get(chave)
            if v is not None:
                setattr(self, f"{campo}_sum", getattr(self, f"{campo}_sum") + float(v))
                setattr(self, f"{campo}_n", getattr(self, f"{campo}_n") + 1)

    @property
    def failures(self) -> int:
        return self.n - self.successes

    def mean(self, campo: str) -> Optional[float]:
        n = getattr(self, f"{campo}_n")
        return getattr(self, f"{campo}_sum") / n if n else None

    def copy(self) -> "StrategyStats":
        return StrategyStats(**{f.name: getattr(self, f.name) for f in fields(self)})


def _custo(x: Optional[float], ref: Optional[float]) -> float:
    if x is None:
        return 0.5
    if not ref:
        return 1.0 if x <= 0 else 0.0  # todos os outros custam zero
    return 1.0 - x / (x + ref)


def score_strategies(stats: dict[str, StrategyStats], weights: dict[str, float], z: float = 1.96,
                     quality_prior: float = 0.5, quality_prior_weight: float = 2.0) -> dict[str, dict[str, Any]]:
    """Score de cada estratégia entre os candidatos dados (os custos são relativos aos candidatos)."""
    pesos = normalize_weights(weights)
    refs: dict[str, Optional[float]] = {}
    for campo in ("tokens", "duration", "attempts", "compute"):
        medias = [m for m in (s.mean(campo) for s in stats.values()) if m is not None]
        refs[campo] = median(medias) if medias else None
    saida: dict[str, dict[str, Any]] = {}
    for sid, s in stats.items():
        lo, hi = wilson_interval(s.successes, s.n, z)
        q = (s.quality_sum + quality_prior * quality_prior_weight) / (s.quality_n + quality_prior_weight) \
            if (s.quality_n + quality_prior_weight) > 0 else quality_prior
        comp = {"success": lo, "quality": min(1.0, max(0.0, q))}
        for campo in ("tokens", "duration", "attempts", "compute"):
            comp[campo] = _custo(s.mean(campo), refs[campo])
        score = sum(pesos[c] * comp[c] for c in COMPONENTS)
        saida[sid] = {
            "score": round(score, 6), "components": {c: round(v, 6) for c, v in comp.items()},
            "n_obs": s.n, "successes": s.successes, "failures": s.failures,
            "success_rate": round(s.successes / s.n, 6) if s.n else None,
            "wilson_lower": round(lo, 6), "wilson_upper": round(hi, 6),
            "mean_quality": s.mean("quality"), "mean_tokens": s.mean("tokens"),
            "mean_duration_ms": s.mean("duration"), "mean_attempts": s.mean("attempts"),
            "mean_compute": s.mean("compute"),
            # confiança da heurística: cresce com o número de observações (n / (n + 5))
            "confidence": round(s.n / (s.n + 5), 4),
        }
    return saida


def thompson_pick(stats: dict[str, StrategyStats], seed: Optional[int] = None) -> dict[str, Any]:
    """Exploração (Thompson sampling): sorteia de Beta(1 + sucessos, 1 + falhas) e escolhe o maior.

    Não é o ranking recomendado: serve para testar estratégias pouco observadas. Por isso sai marcado
    com exploration=True.
    """
    if not stats:
        raise ValueError("sem estratégias para sortear")
    rng = random.Random(seed)
    sorteios = {sid: rng.betavariate(1 + s.successes, 1 + s.failures) for sid, s in sorted(stats.items())}
    escolhida = max(sorteios, key=lambda k: (sorteios[k], k))
    return {"strategy_id": escolhida, "samples": {k: round(v, 6) for k, v in sorteios.items()},
            "exploration": True, "method": "Thompson sampling (exploração, não recomendação)"}


def outcome_row(r: Any) -> dict[str, Any]:
    """Linha de outcomes (sqlite3.Row ou dict) no formato de StrategyStats.add."""
    partes = [r["tokens_input"], r["tokens_output"], r["tokens_cache_creation"]]
    tokens = None if all(p is None for p in partes) else sum(p or 0 for p in partes)
    return {"success": r["success"], "quality": r["quality"], "tokens": tokens, "duration_ms": r["duration_ms"],
            "attempts": r["attempts"], "compute_cost": r["compute_cost"]}


class WeightStore:
    """Versões dos pesos do ranker na tabela versions. A versão 1 é DEFAULT_WEIGHTS."""

    def __init__(self, db: Database, clock: Clock = utcnow) -> None:
        self.db = db
        self.clock = clock

    @staticmethod
    def _linha(row: Any) -> dict[str, Any]:
        dados = json.loads(row["data"])
        return {"id": row["id"], "version": row["version"], "weights": dados["weights"], "data": row["data"],
                "parent_id": row["parent_id"], "active": bool(row["active"]), "note": row["note"],
                "created_at": row["created_at"]}

    def _ler_ativa(self) -> Any:
        return self.db.conn.execute("SELECT * FROM versions WHERE component = ? AND active = 1"
                                    " ORDER BY version DESC LIMIT 1", (WEIGHTS_COMPONENT,)).fetchone()

    def active(self) -> dict[str, Any]:
        """Versão ativa. Na primeira leitura grava a versão 1 (padrão); com o banco ocupado, devolve o
        padrão em memória (id None) e grava numa próxima vez (revisão F3-A1)."""
        row = self._ler_ativa()
        if row is not None:
            return self._linha(row)

        def criar(conn: Any) -> None:
            if self._ler_ativa() is not None:
                return
            if conn.execute("SELECT 1 FROM versions WHERE component = ? AND version = 1",
                            (WEIGHTS_COMPONENT,)).fetchone() is None:
                conn.execute("INSERT INTO versions (component, version, data, active, note, created_at)"
                             " VALUES (?, 1, ?, 1, 'pesos padrão (config/ranker_weights.json)', ?)",
                             (WEIGHTS_COMPONENT, json.dumps({"weights": DEFAULT_WEIGHTS}), to_iso(self.clock())))
            else:
                conn.execute("UPDATE versions SET active = 1 WHERE component = ? AND version = 1",
                             (WEIGHTS_COMPONENT,))

        ok, _ = self.db.try_write(criar)
        row = self._ler_ativa() if ok else None
        if row is None:
            dados = json.dumps({"weights": DEFAULT_WEIGHTS})
            return {"id": None, "version": 1, "weights": dict(DEFAULT_WEIGHTS), "data": dados, "parent_id": None,
                    "active": True, "note": "padrão em memória (banco ocupado)", "created_at": None}
        return self._linha(row)

    def get(self, version_id: int) -> dict[str, Any]:
        row = self.db.conn.execute("SELECT * FROM versions WHERE id = ? AND component = ?",
                                   (version_id, WEIGHTS_COMPONENT)).fetchone()
        if row is None:
            raise NotFound(f"versão de pesos não encontrada: {version_id}")
        return self._linha(row)

    def create(self, weights: dict[str, float], note: str = "", activate: bool = False) -> dict[str, Any]:
        pesos = normalize_weights(weights)
        atual = self.active()
        with self.db.transaction():
            versao = int(self.db.conn.execute("SELECT MAX(version) FROM versions WHERE component = ?",
                                              (WEIGHTS_COMPONENT,)).fetchone()[0]) + 1
            if activate:
                self.db.conn.execute("UPDATE versions SET active = 0 WHERE component = ?", (WEIGHTS_COMPONENT,))
            cur = self.db.conn.execute(
                "INSERT INTO versions (component, version, data, parent_id, active, note, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
                (WEIGHTS_COMPONENT, versao, json.dumps({"weights": {c: round(pesos[c], 6) for c in COMPONENTS}}),
                 atual["id"], int(activate), note, to_iso(self.clock())))
        return self.get(int(cur.lastrowid))

    def activate(self, version_id: int) -> dict[str, Any]:
        self.get(version_id)
        with self.db.transaction():
            self.db.conn.execute("UPDATE versions SET active = 0 WHERE component = ?", (WEIGHTS_COMPONENT,))
            self.db.conn.execute("UPDATE versions SET active = 1 WHERE id = ?", (version_id,))
        return self.get(version_id)


class StrategyRanker:
    def __init__(self, db: Database, config: HelaConfig, clock: Clock = utcnow) -> None:
        self.db = db
        self.config = config
        self.clock = clock
        self.weights = WeightStore(db, clock)

    def ensure_strategy(self, name: str, category: Optional[str] = None, description: Optional[str] = None) -> str:
        nome = (name or "").strip()
        if not nome or len(nome) > 120:
            raise InvalidInput("o nome da estratégia precisa ter de 1 a 120 caracteres")
        row = self.db.conn.execute("SELECT id FROM strategies WHERE name = ?", (nome,)).fetchone()
        if row is not None:
            return str(row["id"])
        sid = uuid.uuid4().hex
        with self.db.transaction():
            self.db.conn.execute("INSERT INTO strategies (id, name, category, description, created_at)"
                                 " VALUES (?, ?, ?, ?, ?)", (sid, nome, category, description, to_iso(self.clock())))
        return sid

    def resolve(self, ref: str, category: Optional[str] = None) -> str:
        """Id de uma estratégia pelo id ou pelo nome (cria pelo nome se não existir)."""
        row = self.db.conn.execute("SELECT id FROM strategies WHERE id = ?", (ref,)).fetchone()
        return str(row["id"]) if row is not None else self.ensure_strategy(ref, category=category)

    def stats(self, category: Optional[str], strategy_ids: Optional[Iterable[str]] = None) -> dict[str, StrategyStats]:
        sql = ("SELECT o.* FROM outcomes o JOIN tasks t ON t.id = o.task_id"
               " WHERE o.strategy_id IS NOT NULL AND o.success IS NOT NULL")
        args: list[Any] = []
        if category:
            sql += " AND t.category = ?"
            args.append(category)
        if strategy_ids is not None:
            ids = list(strategy_ids)
            sql += f" AND o.strategy_id IN ({','.join('?' * len(ids)) or 'NULL'})"
            args.extend(ids)
        saida: dict[str, StrategyStats] = {}
        for r in self.db.conn.execute(sql + " ORDER BY o.created_at, o.id", args):
            saida.setdefault(r["strategy_id"], StrategyStats()).add(outcome_row(r))
        return saida

    def candidates(self, category: Optional[str], include_retired: bool = False) -> list[dict[str, Any]]:
        status = "" if include_retired else " AND s.status = 'active'"
        if category:
            sql = (f"SELECT s.* FROM strategies s WHERE (s.category = ? OR s.category IS NULL"
                   f" OR EXISTS (SELECT 1 FROM outcomes o JOIN tasks t ON t.id = o.task_id"
                   f" WHERE o.strategy_id = s.id AND t.category = ?)){status} ORDER BY s.name")
            rows = self.db.conn.execute(sql, (category, category))
        else:
            rows = self.db.conn.execute(f"SELECT s.* FROM strategies s WHERE 1{status} ORDER BY s.name")
        return [dict(r) for r in rows]

    def rank(self, category: Optional[str] = None, limit: Optional[int] = None,
             include_retired: bool = False, persist: bool = True) -> dict[str, Any]:
        cfg = self.config.learning.ranker
        versao = self.weights.active()
        cands = self.candidates(category, include_retired)
        todas = self.stats(category, [c["id"] for c in cands])
        stats = {c["id"]: todas.get(c["id"], StrategyStats()) for c in cands}
        scores = score_strategies(stats, versao["weights"], cfg.z, cfg.quality_prior, cfg.quality_prior_weight)
        lista = []
        for c in cands:
            s = scores[c["id"]]
            lista.append({"id": c["id"], "name": c["name"], "category": c["category"], "status": c["status"],
                          "description": c["description"], **s, "low_evidence": s["n_obs"] < cfg.min_obs})
        lista.sort(key=lambda x: (-x["score"], -x["n_obs"], x["name"]))
        if persist and cands:
            self._persistir(category or "", stats, scores, versao["version"])
        saida: dict[str, Any] = {
            "category": category, "method": METHOD, "weights_version": versao["version"], "weights": versao["weights"],
            "strategies": lista[:limit] if limit else lista,
            "insufficient": not any(x["n_obs"] >= cfg.min_obs for x in lista),
        }
        if cfg.thompson and stats:
            saida["exploration"] = thompson_pick(stats)
        return saida

    def _persistir(self, categoria: str, stats: dict[str, StrategyStats], scores: dict[str, dict[str, Any]],
                   versao: int) -> None:
        agora = to_iso(self.clock())
        with self.db.transaction():
            for sid, s in stats.items():
                self.db.conn.execute(
                    "INSERT INTO strategy_metrics (strategy_id, category, n_obs, successes, failures, sum_quality,"
                    " sum_duration_ms, sum_tokens, sum_attempts, sum_compute, wilson_lower, score, weights_version,"
                    " updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    " ON CONFLICT(strategy_id, category) DO UPDATE SET n_obs = excluded.n_obs,"
                    " successes = excluded.successes, failures = excluded.failures, sum_quality = excluded.sum_quality,"
                    " sum_duration_ms = excluded.sum_duration_ms, sum_tokens = excluded.sum_tokens,"
                    " sum_attempts = excluded.sum_attempts, sum_compute = excluded.sum_compute,"
                    " wilson_lower = excluded.wilson_lower, score = excluded.score,"
                    " weights_version = excluded.weights_version, updated_at = excluded.updated_at",
                    (sid, categoria, s.n, s.successes, s.failures, s.quality_sum, s.duration_sum, s.tokens_sum,
                     s.attempts_sum, s.compute_sum, scores[sid]["wilson_lower"], scores[sid]["score"], versao, agora))

    def refresh_metrics(self, strategy_id: str, category: Optional[str]) -> None:
        """Recalcula strategy_metrics da estratégia na categoria e na visão geral ('')."""
        for cat in {category or "", ""}:
            self.rank(cat or None)
