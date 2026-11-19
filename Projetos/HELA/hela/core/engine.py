"""Engine: a fachada única da HELA.

CLI, servidor MCP, hooks e API falam só com esta classe. Ela abre o banco, lê a
configuração, escolhe o embedder e expõe as operações com entrada validada: qualquer
erro de validação vira InvalidInput, com mensagem legível.

Uso:
    with Engine() as eng:
        eng.remember(kind="procedural", content="Rodar testes: pytest -q")
        hits = eng.search("como rodar os testes")
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Iterable, Optional, TypeVar, Union

from pydantic import BaseModel, ValidationError

from hela.core.clock import Clock, utcnow
from hela.core.config import HelaConfig, load_config
from hela.core.errors import InvalidInput, describe_validation_error
from hela.core.paths import db_path, hela_home
from hela.core.contract import (
    ClassifyRequest, FeedbackRequest, LearnRequest, ProcedureRequest, RecallRequest, RecommendRequest,
    RelationshipsRequest,
)
from hela.core.router import CognitiveRouter, coverage, query_terms
from hela.execution.planner import classify_parts, split_task
from hela.execution.validator import validate_script
from hela.security.backup_signature import load_key, load_or_create_key
from hela.security.redaction import redact
from hela.execution.procedures import ProcedureService
from hela.learning.classifier import TaskClassifier
from hela.learning.evolution import EvolutionEngine
from hela.learning.feedback import FeedbackLearner
from hela.learning.ranker import StrategyRanker
from hela.memory.activation import GraphActivation
from hela.memory.consolidation import ConsolidationReport, consolidate
from hela.memory.embedder import Embedder, make_embedder
from hela.memory.graph import MemoryGraph
from hela.memory.models import CreateResult, Memory, MemoryCreate, MemoryInput, MemoryUpdate
from hela.memory.search import ActivationProvider, HybridSearch, SearchHit
from hela.memory.service import MemoryService
from hela.memory.transfer import ImportReport, check_import_size, export_data, export_to_file, import_data
from hela.security.envelope import wrap_as_data
from hela.storage.db import Database
from hela.storage.migrations import current_version
from hela.storage.repositories.memories import MemoryFilter

M = TypeVar("M", bound=BaseModel)

# Portas que chamam o Engine. A porta é do código (servidor MCP, API, hook, CLI), nunca do corpo da requisição.
DOORS = ("mcp", "api", "hook", "cli", "manual")
MACHINE_DOORS = ("mcp", "hook")          # máquina: teto de qualidade, sem rótulo explícito, peso de relação ≤ 1
SOURCE_OF_DOOR = {"mcp": "claude", "hook": "hook", "api": "user", "cli": "user", "manual": "user"}


def _porta(door: str) -> str:
    if door not in DOORS:
        raise InvalidInput(f"door precisa ser uma de {', '.join(DOORS)}")
    return door


# As 8 operações do contrato (docs/api.md), na ordem das ferramentas MCP hela_<nome>.
OPERATIONS = ("recall", "classify", "recommend", "learn", "feedback", "procedure", "relationships", "stats")


def _validar(modelo: type[M], dados: dict[str, Any]) -> M:
    try:
        return modelo.model_validate(dados)
    except ValidationError as erro:
        raise InvalidInput(f"entrada inválida ({describe_validation_error(erro)})") from None


def _privado(caminho: Path, modo: int) -> None:
    """Restringe permissões (dados pessoais): pasta 700, banco 600. Ignorado fora do POSIX."""
    if os.name == "posix" and caminho.exists():
        os.chmod(caminho, modo)


class Engine:
    def __init__(self, home: Optional[Path] = None, config: Optional[HelaConfig] = None,
                 clock: Clock = utcnow, embedder: Optional[Embedder] = None,
                 activation: Optional[ActivationProvider] = None) -> None:
        self.home = Path(home) if home is not None else hela_home()
        self.home.mkdir(parents=True, exist_ok=True)
        _privado(self.home, 0o700)
        self.config = config or load_config(self.home)
        self.db = Database(db_path(self.home), busy_timeout_ms=self.config.storage.busy_timeout_ms)
        _privado(self.db.path, 0o600)
        ecfg = self.config.embedder
        try:
            self.embedder = embedder or make_embedder(ecfg.backend, ecfg.dim, ecfg.model)
        except BaseException:
            self.db.close()
            raise
        self.memories = MemoryService(self.db, self.embedder, self.config, clock=clock)
        self.graph = MemoryGraph(self.db)
        # Ativação espalhada no grafo (Fase 3), lendo as arestas do SQLite sem networkx.
        scfg = self.config.search
        if activation is None and scfg.graph_activation:
            activation = GraphActivation(self.db.conn, steps=scfg.activation_steps, decay=scfg.activation_decay)
        self.searcher = HybridSearch(self.memories, activation=activation)
        # Fase 3: aprendizado, execução e roteador, todos sobre o mesmo banco.
        self.classifier = TaskClassifier(self.db, self.config, clock=clock)
        self.ranker = StrategyRanker(self.db, self.config, clock=clock)
        self.learner = FeedbackLearner(self.memories, self.ranker, self.config, clock=clock)
        self.procedures = ProcedureService(self.memories, self.config, searcher=self.searcher)
        self.evolution = EvolutionEngine(self.memories, self.ranker, self.procedures, self.config, clock=clock)
        self.router = CognitiveRouter(self.memories, self.searcher, self.classifier, self.ranker, self.procedures,
                                      self.config, clock=clock)

    # --- ciclo de vida -------------------------------------------------------------------
    def close(self) -> None:
        self.db.close()

    def __enter__(self) -> "Engine":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    # --- memórias ------------------------------------------------------------------------
    def remember(self, data: Optional[MemoryCreate] = None, **campos: Any) -> CreateResult:
        """Grava uma memória (redação, deduplicação e quarentena incluídas).

        Por argumentos nomeados vale a entrada pública (MemoryInput, sem quality/confidence/source);
        um MemoryCreate pronto é o caminho interno.
        """
        if data is not None:
            return self.memories.create(data)
        return self.memories.create(_validar(MemoryInput, campos).to_create("manual"))

    def get(self, memory_id: str, record_access: bool = True) -> Memory:
        return self.memories.get(memory_id, record_access=record_access)

    def update(self, memory_id: str, **campos: Any) -> Memory:
        return self.memories.update(memory_id, _validar(MemoryUpdate, campos))

    def archive(self, memory_id: str) -> Memory:
        return self.memories.archive(memory_id)

    def restore(self, memory_id: str, force: bool = False) -> Memory:
        return self.memories.restore(memory_id, force=force)

    def delete(self, memory_id: str) -> None:
        self.memories.delete(memory_id)

    def adjust_quality(self, memory_id: str, quality_delta: float = 0.0, confidence_delta: float = 0.0) -> Memory:
        return self.memories.adjust_quality(memory_id, quality_delta, confidence_delta)

    @staticmethod
    def _filtro(kinds: Optional[Iterable[str]] = None, project: Optional[str] = None, include_global: bool = False,
                tags: Optional[Iterable[str]] = None, statuses: Optional[Iterable[str]] = ("active",),
                min_quality: Optional[float] = None) -> MemoryFilter:
        from hela.memory.models import KINDS, STATUSES

        kinds_l = list(kinds) if kinds else None
        statuses_l = list(statuses) if statuses else None
        if kinds_l and set(kinds_l) - set(KINDS):
            raise InvalidInput(f"kind inválido: {sorted(set(kinds_l) - set(KINDS))} (use {', '.join(KINDS)})")
        if statuses_l and set(statuses_l) - set(STATUSES):
            raise InvalidInput(f"status inválido: {sorted(set(statuses_l) - set(STATUSES))}")
        if min_quality is not None and not 0 <= min_quality <= 1:
            raise InvalidInput("min_quality precisa estar entre 0 e 1")
        return MemoryFilter(kinds=kinds_l, project=project, include_global=include_global,
                            tags=list(tags) if tags else None, statuses=statuses_l, min_quality=min_quality)

    def list(self, kinds: Optional[Iterable[str]] = None, project: Optional[str] = None,
             tags: Optional[Iterable[str]] = None, statuses: Optional[Iterable[str]] = ("active",),
             limit: int = 100, offset: int = 0, order: str = "created_at DESC") -> list[Memory]:
        if not 1 <= limit <= 10_000 or offset < 0:
            raise InvalidInput("limit precisa estar entre 1 e 10000 e offset >= 0")
        try:
            return self.memories.list(self._filtro(kinds, project, False, tags, statuses),
                                      limit=limit, offset=offset, order=order)
        except ValueError as erro:
            raise InvalidInput(str(erro)) from erro

    def search(self, query: str, kinds: Optional[Iterable[str]] = None, project: Optional[str] = None,
               include_global: bool = False, tags: Optional[Iterable[str]] = None,
               statuses: Optional[Iterable[str]] = ("active",), min_quality: Optional[float] = None,
               limit: Optional[int] = None, record_access: bool = True, record: bool = True) -> list[SearchHit]:
        filtro = self._filtro(kinds, project, include_global, tags, statuses, min_quality)
        return self.searcher.search(query, filtro, limit=limit, record_access=record_access, record=record)

    @staticmethod
    def as_context(hits: Iterable[Union[SearchHit, Memory]]) -> str:
        """Bloco "dados, não instruções" para entregar ao Claude."""
        itens = []
        for h in hits:
            m = h.memory if isinstance(h, SearchHit) else h
            itens.append({"id": m.id, "kind": m.kind, "project": m.project, "title": m.title,
                          "score": round(h.score, 4) if isinstance(h, SearchHit) else None, "content": m.content})
        return wrap_as_data(itens)

    # --- as 8 operações (docs/api.md): o MCP (Fase 4) e a API (Fase 5) chamam só estas -----
    def recall(self, **entrada: Any) -> dict[str, Any]:
        """Cognitive Router: contexto compacto para uma tarefa, ou "experiência insuficiente"."""
        r = _validar(RecallRequest, entrada)
        return self.router.route(r.query, project=r.project, session_id=r.session_id, task_id=r.task_id,
                                 budget_tokens=r.budget_tokens, kinds=r.kinds, include_global=r.include_global,
                                 limit_per_step=r.limit)

    def _procedimentos_relevantes(self, texto: str, project: Optional[str], limite: int) -> list[dict[str, Any]]:
        """Procedimentos que passam no mesmo limiar de relevância do roteador."""
        termos = query_terms(texto)
        saida = []
        for p in self.procedures.list(query=texto, project=project, limit=limite):
            m = self.memories.memories.get(p["memory_id"])
            corpo = " ".join(x for x in (m["title"], m["content"], m["summary"]) if x) if m is not None else ""
            rel = coverage(termos, corpo)
            if rel >= self.config.router.min_relevance:
                saida.append({k: p[k] for k in ("id", "memory_id", "name", "exec_class", "approved", "script_sha256",
                                                "success_count", "failure_count")} | {"relevance": round(rel, 4)})
        return saida

    def classify(self, **entrada: Any) -> dict[str, Any]:
        """Categoria, complexidade, ferramentas, procedimentos reutilizáveis e o plano de execução por partes."""
        r = _validar(ClassifyRequest, entrada)
        texto = self._redigir(r.text)
        saida = self.classifier.classify(texto)
        reutilizaveis = self._procedimentos_relevantes(texto, r.project, 5)

        def procura(parte: str) -> Optional[dict[str, Any]]:
            achados = self._procedimentos_relevantes(parte, r.project, 3)
            return {"id": achados[0]["id"], "name": achados[0]["name"]} if achados else None

        plano = classify_parts(split_task(texto), procedure_lookup=procura)
        return {**saida, "classifier": self.classifier.status(), "reusable_procedures": reutilizaveis, "plan": plano}

    def recommend(self, **entrada: Any) -> dict[str, Any]:
        """Estratégias ranqueadas (heurística estatística) e procedimentos para a categoria da tarefa."""
        r = _validar(RecommendRequest, entrada)
        if not r.query and not r.category:
            raise InvalidInput("informe query (a tarefa) ou category")
        texto = self._redigir(r.query) if r.query else None
        categoria = r.category or self.classifier.classify(texto or "")["category"]
        rank = self.ranker.rank(categoria, limit=r.limit, persist=False)
        procs = self._procedimentos_relevantes(texto, r.project, r.limit) if texto else []
        return {**rank, "category": categoria, "procedures": procs}

    def learn(self, door: str = "mcp", **entrada: Any) -> dict[str, Any]:
        """Guarda uma experiência, um conhecimento ou um procedimento (redação, deduplicação e quarentena).

        door: a porta que chamou (mcp, api, hook, cli). É do código, nunca do corpo da requisição (A-7).
        """
        _porta(door)
        r = _validar(LearnRequest, entrada)
        procedimento = None
        if r.procedure is not None:
            if r.kind != "procedural":
                raise InvalidInput("procedure só vale com kind='procedural'")
            p = r.procedure
            procedimento = self.procedures.create(
                name=p.name, description=p.description or r.content, steps=p.steps, script=p.script,
                language=p.language, project=r.project, tags=r.tags, source=door, origin=r.origin,
                session_id=r.session_id, task_id=r.task_id)
            memoria = self.memories.get(procedimento["memory_id"], record_access=False)
            res = {"created": procedimento.pop("created"), "duplicate_of": None, "quarantined":
                   memoria.status == "quarantined", "redactions": memoria.redactions, "near_duplicates": []}
        else:
            meta = {"origin": r.origin} if r.origin else {}
            cr = self.memories.create(_validar(MemoryCreate, {
                "kind": r.kind, "content": r.content, "title": r.title, "summary": r.summary, "project": r.project,
                "tags": r.tags, "importance": r.importance, "expires_at": r.expires_at, "session_id": r.session_id,
                "task_id": r.task_id, "source": door, "metadata": meta}))
            memoria = cr.memory
            res = {"created": cr.created, "duplicate_of": cr.duplicate_of, "quarantined": cr.quarantined,
                   "redactions": len(cr.redactions), "near_duplicates": [n.model_dump() for n in cr.near_duplicates]}
        rotulo = None
        if r.category is not None:
            if not r.task_id:
                raise InvalidInput("category (rótulo explícito) precisa de task_id")
            # Pelo MCP ou hook, a categoria é correção da máquina ('feedback'), nunca 'explicit' (revisão F3-A3).
            rotulo = self.learner.correct_category(r.task_id, r.category,
                                                   source="feedback" if door in MACHINE_DOORS else "explicit")
        return {"memory": memoria.model_dump(), **res, "procedure": procedimento, "label": rotulo}

    def feedback(self, door: str = "mcp", **entrada: Any) -> dict[str, Any]:
        """Resultado de tarefa, nota de memória e/ou correção de categoria (pelo menos um).

        door: a porta que chamou. Pelo MCP e pelos hooks, o reforço tem teto
        (learning.feedback.machine_quality_cap), a nota exige task_id e o rótulo não pode ser 'explicit'.
        """
        _porta(door)
        r = _validar(FeedbackRequest, entrada)
        maquina = door in MACHINE_DOORS
        fonte = SOURCE_OF_DOOR[door]
        teto = self.config.learning.feedback.machine_quality_cap if maquina else None
        if maquina and r.category is not None and r.label_source == "explicit":
            raise InvalidInput("label_source='explicit' é só para pessoas (CLI ou dashboard); pelo MCP vale 'feedback'")
        if maquina and r.rating is not None and not r.task_id:
            raise InvalidInput("pelo MCP, a nota de uma memória precisa de task_id (uma nota por memória por tarefa)")
        resultado_pedido = any(v is not None for v in (r.success, r.quality, r.duration_ms, r.attempts, r.tokens,
                                                       r.compute_cost, r.strategy, r.notes, r.used_memory_ids))
        if not (resultado_pedido or r.rating is not None or r.category is not None):
            raise InvalidInput("feedback vazio: informe o resultado da tarefa (success...), "
                               "uma nota de memória (memory_id + rating) ou a categoria certa (category)")
        if (resultado_pedido or r.category is not None) and not r.task_id:
            raise InvalidInput("task_id é obrigatório para resultado de tarefa ou correção de categoria")
        if (r.rating is None) != (r.memory_id is None):
            raise InvalidInput("memory_id e rating vão juntos")
        saida: dict[str, Any] = {"outcome": None, "rating": None, "label": None}
        if r.category is not None:
            saida["label"] = self.learner.correct_category(r.task_id, r.category, source=r.label_source)
        if resultado_pedido:
            tokens = r.tokens.model_dump(exclude_none=True) if r.tokens else None
            saida["outcome"] = self.learner.record_outcome(
                r.task_id, success=r.success, quality=r.quality, duration_ms=r.duration_ms, attempts=r.attempts,
                tokens=tokens, token_source=r.token_source, compute_cost=r.compute_cost, strategy=r.strategy,
                notes=r.notes, used_memory_ids=r.used_memory_ids, source=fonte, quality_cap=teto)
        if r.rating is not None:
            saida["rating"] = self.learner.rate_memory(r.memory_id, r.rating, comment=r.comment, task_id=r.task_id,
                                                       source=fonte, quality_cap=teto)
        return saida

    def procedure(self, **entrada: Any) -> dict[str, Any]:
        """Consulta procedimentos, valida um script ou separa uma tarefa nas 4 classes. Nunca aprova nem executa."""
        r = _validar(ProcedureRequest, entrada)
        if r.action == "approve":
            raise InvalidInput("aprovar um script é decisão humana: use 'hela procedure approve' na CLI ou o "
                               "dashboard; por aqui a HELA só consulta")
        if r.action == "get":
            if not r.id:
                raise InvalidInput("action='get' precisa de id")
            return self.procedures.get(r.id)
        if r.action == "list":
            return {"procedures": self.procedures.list(query=r.query, project=r.project, limit=r.limit)}
        if r.action == "validate":
            if not r.script:
                raise InvalidInput("action='validate' precisa de script")
            roteiro = self._redigir(r.script)
            return {"validation": validate_script(roteiro, r.language,
                                                  allowed_hosts=self.config.execution.allowed_hosts).as_dict(),
                    "executes": False}
        if not r.text:
            raise InvalidInput("action='plan' precisa de text")
        return {"plan": self.classify(text=r.text, project=r.project)["plan"]}

    def relationships(self, door: str = "mcp", **entrada: Any) -> dict[str, Any]:
        """Lista, cria ou remove relações de uma memória; devolve as relações e os vizinhos."""
        _porta(door)
        r = _validar(RelationshipsRequest, entrada)
        if door in MACHINE_DOORS and r.action == "link" and r.weight > 1:
            raise InvalidInput("pelo MCP, o peso de uma relação vai até 1 (pesos maiores só pela CLI ou dashboard)")
        self.memories.get(r.memory_id, record_access=False)  # NotFound se não existe
        if r.action in ("link", "unlink") and not r.target_id:
            raise InvalidInput(f"action='{r.action}' precisa de target_id")
        if r.action == "link":
            self.relate(r.memory_id, r.target_id, r.type or "related", r.weight, r.evidence)
        elif r.action == "unlink":
            self.unrelate(r.memory_id, r.target_id, r.type)
        return {"memory_id": r.memory_id, "relations": self.relations(r.memory_id),
                "neighbors": sorted(self.neighbors(r.memory_id, r.depth)), "depth": r.depth}

    def _redigir(self, texto: str) -> str:
        sec = self.config.security
        return redact(texto, entropy_threshold=sec.entropy_threshold, entropy_min_length=sec.entropy_min_length).text

    # --- grafo ---------------------------------------------------------------------------
    def relate(self, source_id: str, target_id: str, type_: str = "related", weight: float = 1.0,
               evidence: Optional[str] = None) -> int:
        return self.memories.relate(source_id, target_id, type_, weight, evidence)

    def unrelate(self, source_id: str, target_id: str, type_: Optional[str] = None) -> int:
        return self.memories.unrelate(source_id, target_id, type_)

    def relations(self, memory_id: str) -> list[dict[str, Any]]:
        return self.memories.relations(memory_id)

    def neighbors(self, memory_id: str, depth: int = 1) -> set[str]:
        if not 1 <= depth <= 5:
            raise InvalidInput("depth precisa estar entre 1 e 5")
        return self.graph.neighbors(memory_id, depth)

    # --- manutenção ----------------------------------------------------------------------
    def expire(self) -> list[str]:
        return self.memories.expire()

    def consolidate(self, threshold: Optional[float] = None, dry_run: bool = False) -> ConsolidationReport:
        if threshold is not None and not 0 < threshold <= 1:
            raise InvalidInput("threshold precisa estar em (0, 1]")
        return consolidate(self.memories, threshold=threshold, dry_run=dry_run)

    def reembed(self) -> int:
        return self.memories.reembed()

    def maintenance(self) -> dict[str, int]:
        """Rotina de limpeza: expira as vencidas e consolida as quase-duplicatas."""
        expiradas = self.expire()
        rel = self.consolidate()
        return {"expired": len(expiradas), "merged": rel.merged, "clusters": len(rel.clusters)}

    # --- transferência -------------------------------------------------------------------
    # Export e import NÃO fazem parte das 8 operações: só a CLI chama (o MCP e a API não expõem).
    def export_data(self, include_quarantined: bool = False) -> dict[str, Any]:
        """Documento assinado com a chave desta instalação (criada no primeiro uso)."""
        return export_data(self.memories, include_quarantined=include_quarantined,
                           key=load_or_create_key(self.home))

    def export_to_file(self, path: Path, include_quarantined: bool = False) -> int:
        return export_to_file(self.memories, path, include_quarantined=include_quarantined,
                              key=load_or_create_key(self.home))

    def import_data(self, data: Union[str, bytes, dict[str, Any]], trusted: bool = False,
                    dry_run: bool = False) -> ImportReport:
        """trusted exige a assinatura desta instalação; a confirmação no terminal é da CLI."""
        return import_data(self.memories, data, trusted=trusted, dry_run=dry_run,
                           key=load_key(self.home) if trusted else None)

    def import_file(self, path: Path, trusted: bool = False, dry_run: bool = False) -> ImportReport:
        caminho = Path(path)
        if not caminho.is_file():
            raise InvalidInput(f"arquivo não encontrado (ou não é um arquivo comum): {caminho}")
        check_import_size(caminho.stat().st_size)  # recusa antes de ler o arquivo
        return self.import_data(caminho.read_bytes(), trusted=trusted, dry_run=dry_run)

    # --- observação ----------------------------------------------------------------------
    def events(self, limit: int = 50, after_id: Optional[int] = None,
               types: Optional[list[str]] = None) -> list[dict[str, Any]]:
        return self.memories.events.recent(limit=limit, after_id=after_id, types=types)

    def stats(self) -> dict[str, Any]:
        conn = self.db.conn
        repo = self.memories.memories
        tamanho = sum(p.stat().st_size for p in self.db.path.parent.glob(self.db.path.name + "*") if p.is_file())
        modelos = {str(r[0]): int(r[1]) for r in conn.execute(
            "SELECT embedding_model, COUNT(*) FROM memories WHERE embedding IS NOT NULL GROUP BY embedding_model")}
        por_status = repo.counts_by("status")
        return {
            "home": str(self.home),
            "db_path": str(self.db.path),
            "db_bytes": tamanho,
            "schema_version": current_version(conn),
            "journal_mode": str(conn.execute("PRAGMA journal_mode").fetchone()[0]),
            "embedder": self.embedder.name,
            "config_file": (self.home / "config.json").exists(),
            "memories": {"total": sum(por_status.values()), "by_kind": repo.counts_by("kind"), "by_status": por_status},
            "embedding_models": modelos,
            "relationships": self.memories.relationships.count(),
            "graph_version": self.graph.version(),
            "events": self.memories.events.count(),
            **self._stats_fase3(),
        }

    def _stats_fase3(self) -> dict[str, Any]:
        """Aprendizado, roteador e procedimentos. Tokens aqui são estimados (caracteres/4), nunca do provedor."""
        c = self.db.conn

        def um(sql: str) -> Any:
            return c.execute(sql).fetchone()[0]

        n_out = um("SELECT COUNT(*) FROM outcomes WHERE success IS NOT NULL")
        sucessos = um("SELECT COALESCE(SUM(success), 0) FROM outcomes WHERE success IS NOT NULL")
        n_ret = um("SELECT COUNT(*) FROM retrievals")
        classes = {str(r[0]): int(r[1]) for r in c.execute(
            "SELECT COALESCE(exec_class, 'none'), COUNT(*) FROM procedures GROUP BY 1")}
        return {
            "learning": {
                "classifier": self.classifier.status(),
                "tasks": {str(r[0]): int(r[1]) for r in c.execute("SELECT status, COUNT(*) FROM tasks GROUP BY 1")},
                "outcomes": n_out,
                "success_rate": round(sucessos / n_out, 4) if n_out else None,
                "strategies": {str(r[0]): int(r[1]) for r in c.execute(
                    "SELECT status, COUNT(*) FROM strategies GROUP BY 1")},
                "ranker_weights_version": self.ranker.weights.active()["version"],
                "proposals": {str(r[0]): int(r[1]) for r in c.execute(
                    "SELECT status, COUNT(*) FROM evolution_proposals GROUP BY 1")},
            },
            "router": {
                "retrievals": n_ret,
                "insufficient_rate": round(um("SELECT COALESCE(SUM(insufficient), 0) FROM retrievals") / n_ret, 4)
                if n_ret else None,
                "mean_latency_ms": um("SELECT ROUND(AVG(latency_ms), 2) FROM retrievals"),
                "tokens_raw": um("SELECT COALESCE(SUM(tokens_raw), 0) FROM retrievals"),
                "tokens_optimized": um("SELECT COALESCE(SUM(tokens_optimized), 0) FROM retrievals"),
                "token_source": "estimated",
            },
            "procedures": {
                "total": um("SELECT COUNT(*) FROM procedures"),
                "approved": um("SELECT COUNT(*) FROM procedures WHERE approved = 1 AND approved_sha256 = script_sha256"),
                "by_exec_class": classes,
            },
        }
