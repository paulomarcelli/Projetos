"""GraphRAG: da questão às entidades, relações, caminhos e trajetórias que a sustentam."""
from __future__ import annotations

from itertools import combinations

from pydantic import BaseModel, Field

from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.graph.modelos import Aresta, Caminho, No, Subgrafo
from freya.graph.resolucao import ResolvedorDeEntidades


class Trajetoria(BaseModel):
    """Evolução de um personagem: momentos (na ordem do perfil oficial) e aparições por ano."""

    personagem: str
    momentos: list[Aresta] = Field(default_factory=list)
    aparicoes: list[Aresta] = Field(default_factory=list)


class ResultadoGrafo(BaseModel):
    entidades: list[No]
    ambiguidades: list[dict] = Field(default_factory=list)
    subgrafo: Subgrafo
    caminhos: list[Caminho] = Field(default_factory=list)
    sem_caminho: list[tuple[str, str]] = Field(default_factory=list)  # pares focais sem ligação no grafo
    trajetorias: list[Trajetoria] = Field(default_factory=list)


class RecuperadorGrafo:
    def __init__(self, grafo: ArmazenamentoGrafo):
        self.grafo = grafo
        self._resolvedor: ResolvedorDeEntidades | None = None

    def resolvedor(self) -> ResolvedorDeEntidades:
        if self._resolvedor is None:
            self._resolvedor = ResolvedorDeEntidades(self.grafo.nos())
        return self._resolvedor

    def recarregar(self) -> None:
        self._resolvedor = None

    _PRIORIDADE = {"RELATIVE_OF": 0, "MEMBER_OF": 1, "LEADS": 1, "ENEMY_OF": 2, "SEEKS": 2, "POSSESSES": 2, "USES": 2, "CREATED": 2,
                   "THREATENS": 2, "RULES": 2, "SHARES_BODY_WITH": 1, "ALLY_OF": 3, "LOCATED_IN": 4, "RELATED_TO": 4, "HAS_ABILITY": 5}
    _FONTE = {"oficial": 0, "enciclopedia": 1, "wiki_fas": 2}

    def _vizinhanca_priorizada(self, focais: list[str], limite: int) -> Subgrafo:
        """Vizinhança ampla, depois cortada pelo que mais importa à análise (laços, filiações, inimizades, nuance, fonte oficial)."""
        amplo = self.grafo.vizinhanca(focais, profundidade=1, limite=max(limite * 6, 400))
        rel = [a for a in amplo.arestas.values() if a.predicado not in ("EXPERIENCES", "APPEARS_IN")]
        rel.sort(key=lambda a: (self._PRIORIDADE.get(a.predicado, 4), a.qualificador is None, self._FONTE.get(a.evidencia.confiabilidade, 3)))
        sg = Subgrafo(nos={c: amplo.nos[c] for c in focais if c in amplo.nos})
        for a in rel[:limite]:
            sg.arestas[a.id] = a
            for x in (a.origem, a.destino):
                if x in amplo.nos:
                    sg.nos[x] = amplo.nos[x]
        return sg

    def buscar(self, questao: str, extras: list[str] | None = None, limite_vizinhanca: int = 80, max_saltos: int = 3) -> ResultadoGrafo:
        rec = self.resolvedor().reconhecer(questao)
        focais = [n.chave for n in rec.entidades]
        if not focais:  # a questão não nomeia ninguém: usa as entidades dos documentos mais relevantes da busca híbrida
            for ch in extras or []:
                no = self.grafo.no(ch)
                if no and ch not in focais and no.tipo in ("character", "organization", "artifact", "location", "event"):
                    focais.append(ch)
        if not focais:
            return ResultadoGrafo(entidades=[], ambiguidades=rec.ambiguidades, subgrafo=Subgrafo())

        sg = self._vizinhanca_priorizada(focais, limite_vizinhanca)
        caminhos, sem = [], []
        principais = [n.chave for n in rec.entidades][:5] or focais[:5]
        for a, b in combinations(principais, 2):
            cs = self.grafo.caminhos(a, b, max_saltos=max_saltos, limite=3)
            if cs:
                caminhos += cs
                for c in cs:
                    for ar in c.arestas:
                        sg.arestas[ar.id] = ar
                    for ch in c.nos:
                        if ch not in sg.nos and (no := self.grafo.no(ch)):
                            sg.nos[ch] = no
            else:
                sem.append((a, b))

        trajetorias = []
        for ch in focais:
            no = sg.nos.get(ch)
            if not no or no.tipo != "character":
                continue
            viz = self.grafo.vizinhanca([ch], profundidade=1, limite=1500)
            # momentos oficiais e capítulos da wiki, na ordem do tempo (ano; depois a ordem dentro da fonte)
            mom = sorted((a for a in viz.arestas.values() if a.predicado == "EXPERIENCES" and a.origem == ch),
                         key=lambda a: (a.ano or 9999, a.evidencia.confiabilidade != "oficial", a.ordem or 0))
            apa = sorted((a for a in viz.arestas.values() if a.predicado == "APPEARS_IN" and a.origem == ch),
                         key=lambda a: (a.ano or 9999, a.destino))
            if mom or apa:
                trajetorias.append(Trajetoria(personagem=ch, momentos=mom, aparicoes=apa))
                for a in mom + apa:
                    sg.arestas[a.id] = a
                    for x in (a.origem, a.destino):
                        if x not in sg.nos and (n := viz.nos.get(x)):
                            sg.nos[x] = n
        entidades = [sg.nos[c] for c in focais if c in sg.nos]
        return ResultadoGrafo(entidades=entidades, ambiguidades=rec.ambiguidades, subgrafo=sg, caminhos=caminhos, sem_caminho=sem,
                              trajetorias=trajetorias)
