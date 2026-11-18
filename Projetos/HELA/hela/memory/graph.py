"""Grafo de memórias em NetworkX, montado a partir da tabela relationships.

Montar o grafo a cada consulta seria desperdício; guardá-lo para sempre deixaria o
grafo velho quando outro processo (MCP, hooks, API) mudasse uma relação. A solução é
o contador meta.graph_version, que os triggers do banco sobem a cada mudança em
relationships (inclusive em cascata). Cada get() lê esse número (uma consulta
barata) e só remonta o grafo quando ele mudou.

O grafo é um MultiDiGraph: entre duas memórias pode haver mais de um tipo de relação
(a chave da aresta é o tipo).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from hela.storage.db import Database
from hela.storage.repositories import MetaRepository, RelationshipRepository

if TYPE_CHECKING:  # o networkx custa ~190 ms para importar: só entra quando o grafo é usado
    import networkx as nx


class MemoryGraph:
    def __init__(self, db: Database) -> None:
        self.db = db
        self._meta = MetaRepository(db.conn)
        self._rels = RelationshipRepository(db.conn)
        self._grafo: Optional["nx.MultiDiGraph"] = None
        self._versao: Optional[int] = None
        self.builds = 0  # quantas vezes o grafo foi montado (útil para testes e métricas)

    def version(self) -> int:
        return self._meta.graph_version()

    def get(self) -> "nx.MultiDiGraph":
        versao = self.version()
        if self._grafo is None or versao != self._versao:
            self._grafo = self._montar()
            self._versao = versao
        return self._grafo

    def _montar(self) -> "nx.MultiDiGraph":
        import networkx as nx

        g = nx.MultiDiGraph()
        rows = self._rels.all()
        ids = {r["source_id"] for r in rows} | {r["target_id"] for r in rows}
        if ids:
            marcas = ",".join("?" * len(ids))
            for m in self.db.conn.execute(
                    f"SELECT id, kind, status, importance FROM memories WHERE id IN ({marcas})", list(ids)):
                g.add_node(m["id"], kind=m["kind"], status=m["status"], importance=m["importance"])
        for r in rows:
            g.add_edge(r["source_id"], r["target_id"], key=r["type"], type=r["type"], weight=r["weight"])
        self.builds += 1
        return g

    def neighbors(self, memory_id: str, depth: int = 1) -> set[str]:
        """Memórias a até `depth` passos, em qualquer direção (sem incluir a própria)."""
        import networkx as nx

        g = self.get()
        if memory_id not in g:
            return set()
        alcance = nx.single_source_shortest_path_length(g.to_undirected(as_view=True), memory_id, cutoff=depth)
        return {n for n in alcance if n != memory_id}
