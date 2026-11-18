"""Ativação espalhada no grafo de relações (o ActivationProvider da busca híbrida).

As sementes (os candidatos da busca, com a força de cada um) espalham energia pelas arestas da
tabela relationships, nos dois sentidos, por até `steps` passos. A cada passo a energia é
multiplicada pelo decaimento e pelo peso da aresta (limitado a 1). O resultado (id → energia
recebida) entra na busca como o sinal "graph".

Por que sem NetworkX: as arestas são lidas do SQLite por fronteira (uma consulta por passo, só com
os nós da vez). Assim a ativação não paga os ~190 ms de importar o networkx e serve também aos hooks
da Fase 4. O MemoryGraph (NetworkX) continua para a exploração do grafo inteiro.

Módulo puro: sem numpy, networkx ou pydantic.
"""

from __future__ import annotations

import sqlite3
from typing import Union


class GraphActivation:
    def __init__(self, conn: Union[sqlite3.Connection, object], steps: int = 2, decay: float = 0.5,
                 max_frontier: int = 500) -> None:
        self.conn: sqlite3.Connection = getattr(conn, "conn", conn)  # aceita Database ou conexão
        if not 1 <= steps <= 4:
            raise ValueError("steps precisa estar entre 1 e 4")
        if not 0 < decay < 1:
            raise ValueError("decay precisa estar entre 0 e 1")
        self.steps = steps
        self.decay = decay
        self.max_frontier = max_frontier

    def _arestas(self, nos: list[str]) -> list[tuple[str, str, float]]:
        marcas = ",".join("?" * len(nos))
        sql = (f"SELECT source_id, target_id, weight FROM relationships"
               f" WHERE source_id IN ({marcas}) OR target_id IN ({marcas})")
        return [(r[0], r[1], float(r[2])) for r in self.conn.execute(sql, [*nos, *nos])]

    def activation(self, seeds: dict[str, float]) -> dict[str, float]:
        positivas = {k: float(v) for k, v in seeds.items() if v and v > 0}
        if not positivas:
            return {}
        maximo = max(positivas.values())
        fronteira = {k: v / maximo for k, v in positivas.items()}  # a semente mais forte vale 1
        ativacao: dict[str, float] = {}
        for _ in range(self.steps):
            nos = sorted(fronteira, key=lambda k: -fronteira[k])[: self.max_frontier]
            proxima: dict[str, float] = {}
            for origem, destino, peso in self._arestas(nos):
                fator = self.decay * min(1.0, max(0.0, peso))
                for de, para in ((origem, destino), (destino, origem)):
                    if de in fronteira:
                        proxima[para] = proxima.get(para, 0.0) + fronteira[de] * fator
            if not proxima:
                break
            for k, v in proxima.items():
                ativacao[k] = ativacao.get(k, 0.0) + v
            fronteira = proxima
        return {k: round(v, 6) for k, v in ativacao.items() if v > 0}
