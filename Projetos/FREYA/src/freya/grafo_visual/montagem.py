"""Grafo da investigação para o frontend (dinâmico e reativo).

Não é uma imagem: é a estrutura que o frontend desenha, anima e explora.
- `nos`: entidade, tipo, papel (focal, ponte, contexto, trajetória), relevância 0–1 e grau;
- `arestas`: predicado (com rótulo em português), direção, tipo epistêmico, peso e as evidências (ids);
- `evidencias`: o subconjunto do registro citado pelas arestas e pela análise;
- `sequencia`: passos para animar a propagação (focais → caminhos → vizinhos → trajetórias);
- `caminhos`: caminhos destacáveis entre as entidades focais;
- `cenarios`: para cada cenário, as entidades e arestas que ele mobiliza (destaque ao selecionar);
- `legenda`: tipos de nó e de relação presentes.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from freya.conhecimento.ontologia import ROTULOS_PT, SIMETRICOS, Predicado
from freya.evidencias.registro import Evidencia
from freya.graph.recuperador import ResultadoGrafo
from freya.prospectivo.modelos import AnaliseProspectiva
from freya.prospectivo.motor import Dossie

ROTULOS_TIPO = {"character": "Personagem", "organization": "Organização", "film": "Filme", "series": "Série", "special": "Especial",
                "event": "Acontecimento", "location": "Local", "artifact": "Artefato", "technology": "Tecnologia ou capacidade",
                "person": "Pessoa real", "company": "Empresa", "concept": "Conceito"}


class NoVisual(BaseModel):
    id: str
    rotulo: str
    tipo: str
    papel: str  # focal | ponte | contexto | trajetoria
    relevancia: float
    grau: int
    descricao: str | None = None
    atributos: dict = Field(default_factory=dict)
    cenarios: list[str] = Field(default_factory=list)


class ArestaVisual(BaseModel):
    id: str
    origem: str
    destino: str
    predicado: str
    rotulo: str
    dirigida: bool
    tipo_epistemico: str = "confirmado"  # toda aresta do grafo vem de fonte oficial
    peso: float
    evidencias: list[str]
    ordem: int | None = None
    ano: int | None = None
    em_caminhos: list[str] = Field(default_factory=list)
    cenarios: list[str] = Field(default_factory=list)


class PassoDaSequencia(BaseModel):
    passo: int
    motivo: str
    nos: list[str]
    arestas: list[str]


class CaminhoVisual(BaseModel):
    id: str
    nos: list[str]
    arestas: list[str]
    descricao: str


class CenarioNoGrafo(BaseModel):
    id: str
    nome: str
    nos: list[str]
    arestas: list[str]


class GrafoDaInvestigacao(BaseModel):
    nos: list[NoVisual]
    arestas: list[ArestaVisual]
    evidencias: dict[str, Evidencia]
    sequencia: list[PassoDaSequencia]
    caminhos: list[CaminhoVisual]
    cenarios: list[CenarioNoGrafo]
    legenda: dict
    focais: list[str]


def eh_variante(a) -> bool:
    """Aresta do estudo de personagens que liga uma variante ao personagem (RELATED_TO, "variante de …")."""
    return a.predicado == "RELATED_TO" and (a.qualificador or "").startswith("variante")


def entidades_da_analise(a: AnaliseProspectiva) -> set[str]:
    """As entidades que a análise mobiliza (atores, relações, variáveis e o cenário)."""
    return ({at.entidade for at in a.atores} | {e for r in a.relacoes_sistemicas for e in r.entidades}
            | {e for v in a.variaveis for e in v.entidades} | {e for s in a.cenarios for e in s.entidades})


def montar_grafo(gr: ResultadoGrafo, dossie: Dossie, analise: AnaliseProspectiva | None = None) -> GrafoDaInvestigacao:
    reg = dossie.registro
    focais = [n.chave for n in gr.entidades]
    # só as entidades da prospectiva: as focais e as que a análise usa (sem análise, as focais e as pontes dos caminhos)
    manter = set(focais) | (entidades_da_analise(analise) if analise else {x for c in gr.caminhos for x in c.nos})
    # as variantes estudadas de um personagem focal entram sempre: são outra pessoa, e a análise depende de qual é qual
    manter |= {a.origem for a in gr.subgrafo.arestas.values() if eh_variante(a) and a.destino in focais}
    nos_sub = {k: v for k, v in gr.subgrafo.nos.items() if k in manter}
    arestas = {k: a for k, a in gr.subgrafo.arestas.items() if a.origem in nos_sub and a.destino in nos_sub}
    grau: dict[str, int] = {}
    for a in arestas.values():
        grau[a.origem] = grau.get(a.origem, 0) + 1
        grau[a.destino] = grau.get(a.destino, 0) + 1

    caminhos: list[CaminhoVisual] = []
    em_caminho_nos: set[str] = set()
    aresta_caminhos: dict[str, list[str]] = {}
    for i, c in enumerate((c for c in gr.caminhos if all(a.id in arestas for a in c.arestas)), 1):
        cid = f"P{i}"
        caminhos.append(CaminhoVisual(id=cid, nos=c.nos, arestas=[a.id for a in c.arestas],
                                      descricao=" → ".join(dossie.nome(x) for x in c.nos)))
        em_caminho_nos.update(c.nos[1:-1])
        for a in c.arestas:
            aresta_caminhos.setdefault(a.id, []).append(cid)

    trajetoria_nos = {a.destino for t in gr.trajetorias for a in t.momentos + t.aparicoes if a.id in arestas}
    maior = max(grau.values(), default=1)

    def papel(ch: str) -> str:
        if ch in focais:
            return "focal"
        if ch in em_caminho_nos:
            return "ponte"
        if ch in trajetoria_nos:
            return "trajetoria"
        return "contexto"

    peso_papel = {"focal": 1.0, "ponte": 0.8, "trajetoria": 0.45, "contexto": 0.35}

    cenarios_por_no: dict[str, list[str]] = {}
    cenarios: list[CenarioNoGrafo] = []
    if analise:
        for s in analise.cenarios:
            nos_s = [x for x in s.entidades if x in nos_sub]
            ar_s = [a.id for a in arestas.values() if a.origem in nos_s and a.destino in nos_s]
            for x in nos_s:
                cenarios_por_no.setdefault(x, []).append(s.id)
            cenarios.append(CenarioNoGrafo(id=s.id, nome=s.nome, nos=nos_s, arestas=ar_s))
    cenarios_por_aresta: dict[str, list[str]] = {}
    for s in cenarios:
        for aid in s.arestas:
            cenarios_por_aresta.setdefault(aid, []).append(s.id)

    nos = []
    for ch, n in nos_sub.items():
        p = papel(ch)
        rel = round(min(1.0, peso_papel[p] + 0.25 * grau.get(ch, 0) / maior), 3)
        nos.append(NoVisual(id=ch, rotulo=n.nome, tipo=n.tipo, papel=p, relevancia=rel, grau=grau.get(ch, 0), descricao=n.descricao,
                            atributos=n.atributos, cenarios=cenarios_por_no.get(ch, [])))

    lista_arestas = []
    for a in arestas.values():
        eid = reg.id_da_aresta(a.id) or reg.de_aresta(a)
        pred = Predicado(a.predicado) if a.predicado in Predicado._value2member_map_ else None
        peso = 1.0 if a.id in aresta_caminhos else (0.7 if a.origem in focais or a.destino in focais else 0.4)
        lista_arestas.append(ArestaVisual(id=a.id, origem=a.origem, destino=a.destino, predicado=a.predicado,
                                          rotulo="variante de" if eh_variante(a) else (ROTULOS_PT.get(pred, a.predicado.lower()) if pred else a.predicado.lower()),
                                          dirigida=pred not in SIMETRICOS if pred else True, peso=peso, evidencias=[eid], ordem=a.ordem, ano=a.ano,
                                          em_caminhos=aresta_caminhos.get(a.id, []), cenarios=cenarios_por_aresta.get(a.id, [])))

    # sequência de revelação: focais; caminhos; vizinhos diretos; trajetórias
    seq, mostrados_n, mostrados_a = [], set(), set()

    def passo(motivo, ns, ars):
        ns = [x for x in dict.fromkeys(ns) if x not in mostrados_n and x in nos_sub]
        ars = [x for x in dict.fromkeys(ars) if x not in mostrados_a and x in arestas]
        if ns or ars:
            seq.append(PassoDaSequencia(passo=len(seq), motivo=motivo, nos=ns, arestas=ars))
            mostrados_n.update(ns)
            mostrados_a.update(ars)

    passo("entidades focais", focais, [])
    for c in caminhos:
        passo(f"caminho {c.id}", c.nos, c.arestas)
    diretas = [a for a in lista_arestas if (a.origem in focais or a.destino in focais) and a.predicado not in ("EXPERIENCES", "APPEARS_IN")]
    passo("relações diretas das focais", [x for a in diretas for x in (a.origem, a.destino)], [a.id for a in diretas])
    for t in gr.trajetorias:
        ids = [a.id for a in t.momentos + t.aparicoes]
        passo(f"trajetória de {dossie.nome(t.personagem)}", [a.destino for a in t.momentos + t.aparicoes], ids)
    passo("contexto", list(nos_sub), list(arestas))

    usadas = {e for a in lista_arestas for e in a.evidencias}
    if analise:
        for campo in ("resposta", "contexto", "tendencias_e_sinais"):
            for af in getattr(analise, campo):
                usadas.update(af.evidencias)
    tipos_no: dict[str, int] = {}
    for n in nos:
        tipos_no[n.tipo] = tipos_no.get(n.tipo, 0) + 1
    tipos_ar: dict[str, int] = {}
    for a in lista_arestas:
        tipos_ar[a.predicado] = tipos_ar.get(a.predicado, 0) + 1
    legenda = {
        "tipos_de_no": {t: {"rotulo": ROTULOS_TIPO.get(t, t), "quantidade": q} for t, q in sorted(tipos_no.items())},
        "tipos_de_relacao": {p: {"rotulo": next((a.rotulo for a in lista_arestas if a.predicado == p), p), "quantidade": q}
                             for p, q in sorted(tipos_ar.items())},
        "papeis": {"focal": "citada na questão", "ponte": "liga entidades focais", "trajetoria": "momento ou obra da trajetória",
                   "contexto": "vizinhança relevante"},
    }
    return GrafoDaInvestigacao(nos=sorted(nos, key=lambda n: -n.relevancia), arestas=lista_arestas,
                               evidencias={e: reg.itens[e] for e in sorted(usadas, key=lambda x: int(x[1:])) if e in reg.itens},
                               sequencia=seq, caminhos=caminhos, cenarios=cenarios, legenda=legenda, focais=focais)
