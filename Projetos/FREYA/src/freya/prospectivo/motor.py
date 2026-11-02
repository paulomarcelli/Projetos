"""Motor prospectivo da F.R.E.Y.A.

Etapas:
1. Enquadramento: entidades focais, ambiguidades e horizonte.
2. Recuperação: Hybrid RAG (trechos) + GraphRAG (relações, caminhos, trajetórias) -> registro de evidências.
3. Leitura sistêmica (determinística, sobre o grafo):
   - pontes: entidades que ligam as focais nos caminhos;
   - tensões: pares com relações opostas (aliado e inimigo ao mesmo tempo, em fontes diferentes);
   - centralidade: quem concentra relações no subgrafo da investigação;
   - trajetórias: a ordem dos momentos e das aparições (tendências);
   - lacunas: pares de focais sem caminho no grafo (incertezas, não "conexões").
4. Síntese: o modelo de linguagem escreve contexto, atores, relações, variáveis, tendências, incertezas,
   desdobramentos e cenários, citando só ids do registro. Sem modelo, o modo determinístico monta as seções
   que as evidências sustentam e declara que os cenários exigem o modelo.
5. Validação (prospectivo/validador.py).
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone

from freya.evidencias.registro import RegistroDeEvidencias
from freya.graph.modelos import Aresta
from freya.graph.recuperador import ResultadoGrafo
from freya.hybrid.recuperador import ResultadoHibrido
from freya.llm.cliente import ModeloDeLinguagem
from freya.prospectivo.modelos import (
    Afirmacao, AnaliseProspectiva, Ator, CorpoDaAnalise, Incerteza, RelacaoSistemica, TipoEpistemico, Variavel,
)
from freya.prospectivo.validador import validar

ROTULO = {"ALLY_OF": "aliado de", "ENEMY_OF": "inimigo de", "RELATIVE_OF": "parente de", "MEMBER_OF": "membro de", "LEADS": "lidera",
          "POSSESSES": "possui", "USES": "usa", "HAS_ABILITY": "tem a capacidade", "CREATED": "criou", "LOCATED_IN": "em",
          "EXPERIENCES": "vivencia", "THREATENS": "ameaça", "SEEKS": "busca", "RULES": "governa", "SHARES_BODY_WITH": "compartilha o corpo com",
          "APPEARS_IN": "aparece em", "RELATED_TO": "relacionado a", "FOLLOWS": "continua", "PARTICIPATES_IN": "participa de"}
OPOSTOS = {("ALLY_OF", "ENEMY_OF")}


@dataclass
class Dossie:
    questao: str
    horizonte: str | None
    focais: list[str]
    nomes: dict[str, str]
    registro: RegistroDeEvidencias
    ambiguidades: list[dict]
    caminhos: list[list[tuple[str, str, str, str]]] = field(default_factory=list)  # [(origem, predicado, destino, eid)]
    sem_caminho: list[tuple[str, str]] = field(default_factory=list)
    pontes: list[tuple[str, int]] = field(default_factory=list)
    tensoes: list[tuple[str, str, list[str]]] = field(default_factory=list)
    centrais: list[tuple[str, int]] = field(default_factory=list)
    trajetorias: dict[str, list[tuple[str, str]]] = field(default_factory=dict)  # personagem -> [(texto, eid)]
    relacoes_focais: list[tuple[str, str, str, str]] = field(default_factory=list)
    trechos: list[str] = field(default_factory=list)  # eids

    def nome(self, ch: str) -> str:
        return self.nomes.get(ch, ch)


def montar_dossie(questao: str, horizonte: str | None, hib: list[ResultadoHibrido], gr: ResultadoGrafo) -> Dossie:
    reg = RegistroDeEvidencias()
    nomes = {k: n.nome for k, n in gr.subgrafo.nos.items()}
    focais = [n.chave for n in gr.entidades]
    d = Dossie(questao=questao, horizonte=horizonte, focais=focais, nomes=nomes, registro=reg, ambiguidades=gr.ambiguidades,
               sem_caminho=gr.sem_caminho)
    d.trechos = [reg.de_trecho(r) for r in hib]

    for c in gr.caminhos:
        passos = []
        for a in c.arestas:
            passos.append((a.origem, a.predicado, a.destino, reg.de_aresta(a)))
        d.caminhos.append(passos)
    pontes = Counter(ch for c in gr.caminhos for ch in c.nos[1:-1])
    d.pontes = pontes.most_common(8)

    relacoes: list[Aresta] = [a for a in gr.subgrafo.arestas.values() if a.predicado not in ("EXPERIENCES", "APPEARS_IN")]
    focais_set = set(focais)
    for a in sorted(relacoes, key=lambda a: (a.origem not in focais_set, a.predicado, a.destino))[:60]:
        if a.origem in focais_set or a.destino in focais_set:
            d.relacoes_focais.append((a.origem, a.predicado, a.destino, reg.de_aresta(a)))

    por_par: dict[frozenset, dict[str, list[Aresta]]] = {}
    for a in relacoes:
        por_par.setdefault(frozenset((a.origem, a.destino)), {}).setdefault(a.predicado, []).append(a)
    for par, preds in por_par.items():
        for p1, p2 in OPOSTOS:
            if p1 in preds and p2 in preds and len(par) == 2:
                x, y = sorted(par)
                d.tensoes.append((x, y, [reg.de_aresta(a) for a in preds[p1] + preds[p2]]))

    # vizinhos compartilhados: quem se liga a duas ou mais focais (aliados ou inimigos em comum)
    ligados: dict[str, set[str]] = {}
    for a in relacoes:
        for x, y in ((a.origem, a.destino), (a.destino, a.origem)):
            if y in focais_set and x not in focais_set:
                ligados.setdefault(x, set()).add(y)
    compartilhados = sorted(((k, len(v)) for k, v in ligados.items() if len(v) >= 2), key=lambda x: (-x[1], x[0]))
    if compartilhados:
        d.centrais = compartilhados[:6]
    else:
        grau = Counter()
        for a in relacoes:
            grau[a.origem] += 1
            grau[a.destino] += 1
        d.centrais = [(k, n) for k, n in grau.most_common(10) if k not in focais_set][:6]

    for t in gr.trajetorias:
        itens = [(f"momento {a.ordem}: {nomes.get(a.destino, a.destino).split(': ', 1)[-1]} — {a.evidencia.citacao}", reg.de_aresta(a, "momento"))
                 for a in t.momentos]
        itens += [(f"aparece em {nomes.get(a.destino, a.destino)}" + (f" ({a.ano})" if a.ano else ""), reg.de_aresta(a, "aparicao"))
                  for a in t.aparicoes]
        d.trajetorias[t.personagem] = itens
    return d


def dossie_em_texto(d: Dossie) -> str:
    n = d.nome
    linhas = [f"QUESTÃO DE INVESTIGAÇÃO: {d.questao}", f"HORIZONTE: {d.horizonte or 'não definido (use a continuidade MCU conhecida)'}",
              "CONTINUIDADE: somente MCU (live action). Quadrinhos não fazem parte da base.", "",
              "ENTIDADES FOCAIS: " + (", ".join(f"{n(f)} [{f}]" for f in d.focais) or "nenhuma reconhecida")]
    if d.ambiguidades:
        linhas.append("AMBIGUIDADES DE NOME: " + "; ".join(f"'{a['trecho']}' → {a['escolhida']} (também: {', '.join(a['alternativas'])})" for a in d.ambiguidades))
    linhas += ["", "EVIDÊNCIAS (cite somente estes ids):"]
    for e in d.registro.itens.values():
        linhas.append(f"[{e.id}] ({e.tipo}; {e.fonte.titulo or e.fonte.doc_id}; {e.fonte.url}) {e.texto[:600]}")
    linhas += ["", "RELAÇÕES DO GRAFO EM TORNO DAS FOCAIS:"]
    linhas += [f"- {n(o)} {ROTULO.get(p, p)} {n(t)} [{eid}]" for o, p, t, eid in d.relacoes_focais] or ["- nenhuma"]
    linhas += ["", "CAMINHOS ENTRE ENTIDADES FOCAIS:"]
    for c in d.caminhos:
        linhas.append("- " + " ; ".join(f"{n(o)} {ROTULO.get(p, p)} {n(t)} [{eid}]" for o, p, t, eid in c))
    for a, b in d.sem_caminho:
        linhas.append(f"- SEM CAMINHO no grafo entre {n(a)} e {n(b)} (não afirme conexão direta entre eles)")
    if d.pontes:
        linhas.append("PONTES (entidades que ligam as focais): " + ", ".join(f"{n(k)} ({c}x)" for k, c in d.pontes))
    if d.tensoes:
        linhas.append("TENSÕES (relações opostas no mesmo par): " + "; ".join(f"{n(x)} × {n(y)} [{', '.join(e)}]" for x, y, e in d.tensoes))
    if d.centrais:
        linhas.append("ENTIDADES LIGADAS A VÁRIAS FOCAIS (ou mais conectadas): " + ", ".join(f"{n(k)} ({g})" for k, g in d.centrais))
    for p, itens in d.trajetorias.items():
        linhas.append(f"TRAJETÓRIA DE {n(p)}: " + " | ".join(f"{t} [{eid}]" for t, eid in itens))
    return "\n".join(linhas)


SISTEMA = """Você é o motor prospectivo da F.R.E.Y.A., uma inteligência de análise prospectiva sobre o Universo \
Cinematográfico Marvel (MCU). Seu único produto é uma análise prospectiva estruturada, em português.

Regras invioláveis:
1. Use somente as evidências do dossiê. Cite os ids (E1, E2…) em cada afirmação.
2. Classifique cada afirmação: "confirmado" (dito explicitamente numa evidência), "inferencia" (decorre das \
evidências citadas) ou "hipotese" (possibilidade levantada pela análise). Nunca apresente hipótese como fato.
3. Não invente personagens, relações, acontecimentos ou datas. Use as chaves de entidade exatamente como \
aparecem no dossiê ([character:...], [organization:...]).
4. Onde o dossiê diz SEM CAMINHO, não afirme ligação entre essas entidades; trate como incerteza.
5. Só a continuidade cinematográfica (MCU). Não use conhecimento de quadrinhos.
6. O contexto contém apenas fatos confirmados. Cenários são condicionais: lógica, premissas, desenvolvimento, \
consequências e sinais de confirmação, cada parte com seu tipo e suas evidências.
7. Construa de 2 a 4 cenários contrastantes a partir das incertezas críticas. Registre em "limitacoes" o que a \
base não cobre."""


def _deterministico(d: Dossie) -> CorpoDaAnalise:
    """Sem modelo: só o que as evidências sustentam diretamente, sem redação criativa nem cenários."""
    n = d.nome
    c = CorpoDaAnalise()
    for eid in d.trechos[:4]:
        e = d.registro.itens[eid]
        c.contexto.append(Afirmacao(texto=f"{e.fonte.titulo}: {e.texto.splitlines()[0][:300]}", tipo=TipoEpistemico.CONFIRMADO, evidencias=[eid]))
    por_focal: dict[str, list[tuple[str, str, str, str]]] = {}
    for rel in d.relacoes_focais:
        for f in (rel[0], rel[2]):
            if f in d.focais:
                por_focal.setdefault(f, []).append(rel)
    for f in d.focais:
        rels = por_focal.get(f, [])
        c.atores.append(Ator(entidade=f, papel="entidade focal da investigação",
                             fundamentos=[Afirmacao(texto=f"{n(o)} {ROTULO.get(p, p)} {n(t)}", tipo=TipoEpistemico.CONFIRMADO, evidencias=[eid])
                                          for o, p, t, eid in rels[:6]]))
    for cam in d.caminhos:
        texto = " → ".join(f"{n(o)} {ROTULO.get(p, p)} {n(t)}" for o, p, t, _ in cam)
        c.relacoes_sistemicas.append(RelacaoSistemica(entidades=list(dict.fromkeys([cam[0][0], cam[-1][2]] + [x[2] for x in cam])),
                                                      natureza="ligação no grafo",
                                                      descricao=Afirmacao(texto=texto, tipo=TipoEpistemico.CONFIRMADO, evidencias=[x[3] for x in cam])))
    for k, g in d.pontes[:4] + d.centrais[:3]:
        evs = [eid for o, p, t, eid in d.relacoes_focais if k in (o, t)][:4]
        c.variaveis.append(Variavel(nome=f"Papel de {n(k)}", entidades=[k],
                                    descricao=Afirmacao(texto=f"{n(k)} se liga a {g} das entidades em análise no grafo.",
                                                        tipo=TipoEpistemico.INFERENCIA, evidencias=evs)))
    for p, itens in d.trajetorias.items():
        for texto, eid in itens[:8]:
            c.tendencias_e_sinais.append(Afirmacao(texto=f"{n(p)}: {texto}", tipo=TipoEpistemico.CONFIRMADO, evidencias=[eid]))
    for x, y, evs in d.tensoes:
        c.incertezas_criticas.append(Incerteza(nome=f"Relação entre {n(x)} e {n(y)}", polos=["aliança", "confronto"],
                                               por_que_importa=Afirmacao(texto=f"As fontes registram {n(x)} e {n(y)} ora como aliados, ora como inimigos.",
                                                                         tipo=TipoEpistemico.INFERENCIA, evidencias=evs)))
    for a, b in d.sem_caminho:
        c.incertezas_criticas.append(Incerteza(nome=f"Ligação entre {n(a)} e {n(b)}", polos=["há ligação ainda não registrada", "não há ligação"],
                                               por_que_importa=Afirmacao(texto=f"A base não registra caminho entre {n(a)} e {n(b)}.",
                                                                         tipo=TipoEpistemico.HIPOTESE)))
    c.limitacoes.append("Modo determinístico (sem OPENAI_API_KEY): a análise lista só o que as evidências sustentam diretamente. "
                        "Desdobramentos e cenários exigem o modelo de linguagem e não foram gerados.")
    return c


class MotorProspectivo:
    def __init__(self, modelo: ModeloDeLinguagem | None = None):
        self.modelo = modelo

    def analisar(self, questao: str, horizonte: str | None, hib: list[ResultadoHibrido], gr: ResultadoGrafo) -> tuple[AnaliseProspectiva, Dossie]:
        d = montar_dossie(questao, horizonte, hib, gr)
        if self.modelo is not None and d.registro.itens:
            corpo = self.modelo.gerar(SISTEMA, dossie_em_texto(d), CorpoDaAnalise)
            modo, nome = "modelo", self.modelo.nome
        else:
            corpo, modo, nome = _deterministico(d), "deterministico", None
        if not d.registro.itens:
            corpo.limitacoes.append("Nenhuma evidência foi recuperada para esta questão; a base não cobre o tema.")
        conhecidas = set(d.nomes)
        corpo, rv = validar(corpo, d.registro, conhecidas)
        if d.ambiguidades:
            corpo.limitacoes.append("Nomes ambíguos na questão: " + "; ".join(f"'{a['trecho']}' foi lido como {a['escolhida']}" for a in d.ambiguidades))
        analise = AnaliseProspectiva(**corpo.model_dump(), questao=questao, horizonte=horizonte, modo=modo, modelo=nome,
                                     gerada_em=datetime.now(timezone.utc), validacao=rv)
        return analise, d
