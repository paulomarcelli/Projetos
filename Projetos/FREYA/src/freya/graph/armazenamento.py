"""Armazenamento do Knowledge Graph: Neo4j (produção) e NetworkX (testes e uso sem serviços).

Os dois implementam a mesma interface:
- `carregar(corpus)`: reconstrói o grafo a partir do corpus (nós tipados, arestas com evidência);
- `nos()`: todos os nós (para o reconhecimento de entidades);
- `vizinhanca(chaves, profundidade, limite)`: subgrafo em volta das entidades;
- `caminhos(a, b, max_saltos, limite)`: caminhos reais entre duas entidades (lista vazia se não houver).

Diferença da Manus: o tipo da relação é o tipo da aresta no Neo4j (`:ALLY_OF`, `:MEMBER_OF`…), e não uma
aresta genérica `:RELATED` com o predicado em propriedade; a chave do nó é tipada (`character:thor`).
"""
from __future__ import annotations

from typing import Protocol

import networkx as nx

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Fato
from freya.conhecimento.ontologia import Predicado
from freya.graph.modelos import Aresta, Caminho, EvidenciaAresta, No, Subgrafo

# arestas de produção e catálogo não entram na exploração narrativa por padrão
PREDICADOS_DE_CATALOGO = {"IN_OFFICIAL_TIMELINE", "DIRECTED_BY", "WRITTEN_BY", "PRODUCED_BY", "CAST_IN", "PORTRAYED_BY"}


def _no(e) -> No:
    return No(chave=e.chave, nome=e.nome, tipo=e.tipo.value, apelidos=e.apelidos, descricao=e.descricao,
              atributos={k: v for k, v in e.atributos.items() if v is not None})


def _aresta(f: Fato) -> Aresta:
    return Aresta(id=f.id, origem=f.sujeito, destino=f.objeto, predicado=f.predicado.value, predicado_original=f.predicado_original,
                  ordem=f.ordem, ano=f.ano, evidencia=EvidenciaAresta(citacao=f.evidencia, tipo=f.tipo_evidencia.value, campo=f.campo,
                                                                      doc_id=f.doc_id, url=f.url, captura_id=f.captura_id))


class ArmazenamentoGrafo(Protocol):
    def carregar(self, corpus: Corpus) -> dict: ...
    def nos(self) -> list[No]: ...
    def no(self, chave: str) -> No | None: ...
    def vizinhanca(self, chaves: list[str], profundidade: int = 1, limite: int = 60, incluir_catalogo: bool = False) -> Subgrafo: ...
    def caminhos(self, origem: str, destino: str, max_saltos: int = 3, limite: int = 5, incluir_catalogo: bool = False) -> list[Caminho]: ...


# ------------------------------------------------------------------ NetworkX

class GrafoMemoria:
    def __init__(self):
        self.g = nx.MultiDiGraph()

    def carregar(self, corpus: Corpus) -> dict:
        self.g.clear()
        for e in corpus.entidades.values():
            self.g.add_node(e.chave, no=_no(e))
        for f in corpus.fatos.values():
            if f.sujeito in self.g and f.objeto in self.g:
                self.g.add_edge(f.sujeito, f.objeto, key=f.id, aresta=_aresta(f))
        return {"nos": self.g.number_of_nodes(), "arestas": self.g.number_of_edges()}

    def nos(self) -> list[No]:
        return [d["no"] for _, d in self.g.nodes(data=True)]

    def no(self, chave: str) -> No | None:
        return self.g.nodes[chave]["no"] if chave in self.g else None

    def _arestas_de(self, chave: str, incluir_catalogo: bool):
        for u, v, d in list(self.g.out_edges(chave, data=True)) + list(self.g.in_edges(chave, data=True)):
            a: Aresta = d["aresta"]
            if incluir_catalogo or a.predicado not in PREDICADOS_DE_CATALOGO:
                yield a

    def vizinhanca(self, chaves, profundidade=1, limite=60, incluir_catalogo=False) -> Subgrafo:
        sg = Subgrafo()
        fronteira = [c for c in chaves if c in self.g]
        for c in fronteira:
            sg.nos[c] = self.no(c)
        for _ in range(profundidade):
            proxima = []
            for c in fronteira:
                for a in self._arestas_de(c, incluir_catalogo):
                    if len(sg.arestas) >= limite:
                        break
                    sg.arestas[a.id] = a
                    for x in (a.origem, a.destino):
                        if x not in sg.nos:
                            sg.nos[x] = self.no(x)
                            proxima.append(x)
            fronteira = proxima
        return sg

    def caminhos(self, origem, destino, max_saltos=3, limite=5, incluir_catalogo=False) -> list[Caminho]:
        if origem not in self.g or destino not in self.g or origem == destino:
            return []
        und = nx.Graph()
        for u, v, d in self.g.edges(data=True):
            a: Aresta = d["aresta"]
            if not incluir_catalogo and a.predicado in PREDICADOS_DE_CATALOGO:
                continue
            und.add_edge(u, v)
            und[u][v].setdefault("arestas", []).append(a)
        if origem not in und or destino not in und:
            return []
        saida = []
        try:
            for nos in nx.shortest_simple_paths(und, origem, destino):
                if len(nos) - 1 > max_saltos or len(saida) >= limite:
                    break
                arestas = [und[nos[i]][nos[i + 1]]["arestas"][0] for i in range(len(nos) - 1)]
                saida.append(Caminho(nos=nos, arestas=arestas))
        except nx.NetworkXNoPath:
            return []
        return saida


# ------------------------------------------------------------------ Neo4j

class GrafoNeo4j:
    def __init__(self, uri: str, usuario: str, senha: str, driver=None, base: str = "freya"):
        """`base` isola conjuntos de dados no mesmo Neo4j (ex.: "freya" e "freya_teste"): recarregar um não apaga o outro."""
        from neo4j import GraphDatabase

        self.driver = driver or GraphDatabase.driver(uri, auth=(usuario, senha))
        self.base = base

    def fechar(self) -> None:
        self.driver.close()

    def carregar(self, corpus: Corpus) -> dict:
        nos = [{"chave": e.chave, "nome": e.nome, "tipo": e.tipo.value, "rotulo": e.tipo.rotulo_neo4j, "apelidos": e.apelidos,
                "descricao": e.descricao, **{f"a_{k}": v for k, v in e.atributos.items() if v is not None}} for e in corpus.entidades.values()]
        with self.driver.session() as s:
            s.run("CREATE CONSTRAINT freya_uid IF NOT EXISTS FOR (e:Entity) REQUIRE e.uid IS UNIQUE")
            s.run("CREATE INDEX freya_base_chave IF NOT EXISTS FOR (e:Entity) ON (e.base, e.chave)")
            s.run("MATCH (e:Entity {base:$b}) DETACH DELETE e", b=self.base)
            for rotulo in sorted({n["rotulo"] for n in nos}):
                lote = [n for n in nos if n["rotulo"] == rotulo]
                s.run(f"UNWIND $nos AS n MERGE (e:Entity {{uid:$b + '|' + n.chave}}) SET e:{rotulo}, e += n, e.base=$b, e.continuidade='MCU'",
                      nos=lote, b=self.base)
            fatos = [f for f in corpus.fatos.values() if f.sujeito in corpus.entidades and f.objeto in corpus.entidades]
            for pred in sorted({f.predicado.value for f in fatos}):
                lote = [{"s": f.sujeito, "o": f.objeto, "id": f.id, "citacao": f.evidencia, "tipo": f.tipo_evidencia.value, "campo": f.campo,
                         "doc_id": f.doc_id, "url": f.url, "captura_id": f.captura_id, "predicado_original": f.predicado_original,
                         "ordem": f.ordem, "ano": f.ano} for f in fatos if f.predicado.value == pred]
                s.run(f"UNWIND $fs AS f MATCH (a:Entity {{uid:$b + '|' + f.s}}), (b:Entity {{uid:$b + '|' + f.o}}) "
                      f"MERGE (a)-[r:{pred} {{id:f.id}}]->(b) SET r += f", fs=lote, b=self.base)
            n = s.run("MATCH (e:Entity {base:$b}) RETURN count(e) AS n", b=self.base).single()["n"]
            m = s.run("MATCH (:Entity {base:$b})-[r]->(:Entity {base:$b}) RETURN count(r) AS n", b=self.base).single()["n"]
        return {"nos": n, "arestas": m}

    @staticmethod
    def _no_de(props) -> No:
        p = dict(props)
        return No(chave=p["chave"], nome=p["nome"], tipo=p["tipo"], apelidos=p.get("apelidos") or [], descricao=p.get("descricao"),
                  atributos={k[2:]: v for k, v in p.items() if k.startswith("a_")})

    @staticmethod
    def _aresta_de(tipo: str, props, origem: str, destino: str) -> Aresta:
        p = dict(props)
        return Aresta(id=p["id"], origem=origem, destino=destino, predicado=tipo, predicado_original=p.get("predicado_original"),
                      ordem=p.get("ordem"), ano=p.get("ano"),
                      evidencia=EvidenciaAresta(citacao=p["citacao"], tipo=p["tipo"], campo=p.get("campo"), doc_id=p["doc_id"], url=p["url"],
                                                captura_id=p.get("captura_id")))

    def nos(self) -> list[No]:
        with self.driver.session() as s:
            return [self._no_de(r["e"]) for r in s.run("MATCH (e:Entity {base:$b}) RETURN e", b=self.base)]

    def no(self, chave: str) -> No | None:
        with self.driver.session() as s:
            r = s.run("MATCH (e:Entity {uid:$u}) RETURN e", u=f"{self.base}|{chave}").single()
            return self._no_de(r["e"]) if r else None

    def _filtro(self, incluir_catalogo: bool) -> str:
        return "" if incluir_catalogo else f"AND NOT type(r) IN {sorted(PREDICADOS_DE_CATALOGO)}"

    def vizinhanca(self, chaves, profundidade=1, limite=60, incluir_catalogo=False) -> Subgrafo:
        sg = Subgrafo()
        with self.driver.session() as s:
            for r in s.run("MATCH (e:Entity) WHERE e.uid IN $u RETURN e", u=[f"{self.base}|{c}" for c in chaves]):
                sg.nos[r["e"]["chave"]] = self._no_de(r["e"])
            fronteira = list(sg.nos)
            for _ in range(profundidade):
                if not fronteira or len(sg.arestas) >= limite:
                    break
                rows = s.run("MATCH (a:Entity)-[r]-(b:Entity) WHERE a.uid IN $f " + self._filtro(incluir_catalogo) +
                             " RETURN startNode(r) AS o, endNode(r) AS d, type(r) AS t, r LIMIT $lim",
                             f=[f"{self.base}|{c}" for c in fronteira], lim=limite - len(sg.arestas))
                proxima = []
                for row in rows:
                    a = self._aresta_de(row["t"], row["r"], row["o"]["chave"], row["d"]["chave"])
                    sg.arestas[a.id] = a
                    for x in (row["o"], row["d"]):
                        if x["chave"] not in sg.nos:
                            sg.nos[x["chave"]] = self._no_de(x)
                            proxima.append(x["chave"])
                fronteira = proxima
        return sg

    def caminhos(self, origem, destino, max_saltos=3, limite=5, incluir_catalogo=False) -> list[Caminho]:
        if origem == destino:
            return []
        # os tipos permitidos entram no próprio padrão: assim o caminho mais curto já ignora as arestas de catálogo
        tipos = "" if incluir_catalogo else ":" + "|".join(p.value for p in Predicado if p.value not in PREDICADOS_DE_CATALOGO)
        consulta = (f"MATCH (a:Entity {{uid:$o}}), (b:Entity {{uid:$d}}) "
                    f"MATCH p = allShortestPaths((a)-[{tipos}*..{int(max_saltos)}]-(b)) RETURN p LIMIT $lim")
        saida = []
        with self.driver.session() as s:
            for row in s.run(consulta, o=f"{self.base}|{origem}", d=f"{self.base}|{destino}", lim=limite):
                p = row["p"]
                nos = [n["chave"] for n in p.nodes]
                arestas = [self._aresta_de(rel.type, rel, rel.start_node["chave"], rel.end_node["chave"]) for rel in p.relationships]
                saida.append(Caminho(nos=nos, arestas=arestas))
        return saida
