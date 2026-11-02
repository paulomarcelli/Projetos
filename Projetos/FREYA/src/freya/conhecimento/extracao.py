"""Extração de relações narrativas de textos (enredos), pelo modelo de linguagem, com verificação literal.

Para cada trecho:
1. reconhece as entidades do grafo citadas no trecho (sem criar nenhuma nova);
2. se houver menos de duas, não chama o modelo;
3. pede ao modelo só relações entre essas entidades, com predicados da ontologia e citação literal;
4. aceita a relação só se: as duas chaves estão na lista, o predicado é permitido e cabe nos tipos, e a
   citação aparece no trecho (comparação normalizada). Tudo o que não passa é contado no relatório.

Cada fato aceito leva a obra e o ano do enredo, a confiabilidade da fonte e a citação.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel, Field

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Documento, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import normalizar
from freya.conhecimento.ontologia import Predicado, TipoEntidade, dominio_valido
from freya.graph.modelos import No
from freya.graph.resolucao import ResolvedorDeEntidades
from freya.hybrid.chunking import dividir
from freya.llm.cliente import ModeloDeLinguagem

log = logging.getLogger(__name__)

PERMITIDOS = {
    Predicado.ALIADO_DE: "aliados, cooperam ou lutam juntos",
    Predicado.INIMIGO_DE: "opõem-se, lutam um contra o outro, um tenta matar ou deter o outro",
    Predicado.PARENTE_DE: "laço de família explícito",
    Predicado.MEMBRO_DE: "pertence ou entra numa organização ou grupo",
    Predicado.LIDERA: "lidera uma organização ou grupo",
    Predicado.POSSUI: "tem um artefato em seu poder",
    Predicado.USA: "usa um artefato ou tecnologia",
    Predicado.BUSCA: "procura obter algo (artefato, poder, lugar)",
    Predicado.CRIOU: "criou alguém ou algo",
    Predicado.AMEACA: "ameaça alguém ou um lugar",
    Predicado.GOVERNA: "governa um lugar ou povo",
    Predicado.LOCALIZADO_EM: "está ou vive num lugar",
}
_TIPOS_NARRATIVOS = {"character", "organization", "artifact", "location", "concept", "technology"}


def _termos(e) -> set[str]:
    termos = set()
    for n in [e.nome, *e.apelidos]:
        t = normalizar(n)
        if len(t) >= 3:
            termos.add(t)
            partes = [p for p in t.replace("-", " ").split() if len(p) >= 4 and p not in ("the", "doctor", "captain", "king", "queen")]
            if len(partes) > 1:
                termos.add(partes[-1])  # sobrenome ("hill" para Maria Hill)
    return termos


def menciona(evidencia: str, entidade) -> bool:
    """A citação nomeia a entidade (nome, apelido ou sobrenome), como palavra inteira?"""
    from freya.conhecimento.normalizacao import contem_termo

    ev = normalizar(evidencia)
    return any(contem_termo(ev, t) for t in _termos(entidade))


def sustenta(f: Fato, entidades: dict) -> bool:
    """Regra de suporte: a citação precisa nomear as duas pontas da relação."""
    return f.sujeito in entidades and f.objeto in entidades and menciona(f.evidencia, entidades[f.sujeito]) and menciona(f.evidencia, entidades[f.objeto])


class RelacaoExtraida(BaseModel):
    sujeito: str = Field(description="chave da entidade, exatamente como na lista")
    predicado: str
    objeto: str = Field(description="chave da entidade, exatamente como na lista")
    evidencia: str = Field(description="trecho copiado literalmente do texto que afirma a relação")


class Extracao(BaseModel):
    relacoes: list[RelacaoExtraida] = Field(default_factory=list)


SISTEMA = """Você extrai relações explícitas de enredos do Universo Cinematográfico Marvel (MCU).
Regras: use só as entidades da lista, pelas chaves exatas; só os predicados permitidos; só o que o texto afirma \
explicitamente (nada de inferência ou conhecimento externo); a evidência deve ser copiada literalmente do texto, \
curta (uma frase ou parte dela), e precisa nomear as duas entidades da relação. Se não houver relação explícita, devolva uma lista vazia. Responda só com JSON."""


def _prompt(texto: str, entidades: list[No]) -> str:
    lista = "\n".join(f"- {n.chave}: {n.nome}" + (f" (também: {', '.join(n.apelidos[:3])})" if n.apelidos else "") for n in entidades)
    preds = "\n".join(f"- {p.value}: {d}" for p, d in PERMITIDOS.items())
    return f"ENTIDADES:\n{lista}\n\nPREDICADOS PERMITIDOS:\n{preds}\n\nTEXTO:\n{texto}"


def extrair(corpus: Corpus, docs: list[Documento], modelo: ModeloDeLinguagem, paralelo: int = 4) -> tuple[list[Fato], dict]:
    nos = [No(chave=e.chave, nome=e.nome, tipo=e.tipo.value, apelidos=e.apelidos) for e in corpus.entidades.values()
           if e.tipo.value in _TIPOS_NARRATIVOS]
    resolvedor = ResolvedorDeEntidades(nos)
    tipos = {e.chave: e.tipo for e in corpus.entidades.values()}
    rel = {"trechos": 0, "trechos_sem_par": 0, "chamadas": 0, "falhas": 0, "propostas": 0, "aceitas": 0,
           "recusadas": {"entidade_fora_da_lista": 0, "predicado": 0, "dominio": 0, "citacao_nao_literal": 0, "laço": 0}}
    tarefas = []
    for d in docs:
        for ch in dividir(d, max_palavras=220, sobreposicao=1):
            rel["trechos"] += 1
            ents = resolvedor.reconhecer(ch.texto).entidades
            if len(ents) < 2:
                rel["trechos_sem_par"] += 1
                continue
            tarefas.append((d, ch, ents))

    def rodar(t):
        d, ch, ents = t
        try:
            return d, ch, ents, modelo.gerar(SISTEMA, _prompt(ch.texto, ents), Extracao)
        except Exception as e:  # uma falha não derruba a extração inteira
            log.warning("extração falhou em %s: %s", ch.chunk_id, str(e)[:150])
            return d, ch, ents, None

    fatos: list[Fato] = []
    with ThreadPoolExecutor(max_workers=paralelo) as ex:
        for d, ch, ents, res in ex.map(rodar, tarefas):
            rel["chamadas"] += 1
            if res is None:
                rel["falhas"] += 1
                continue
            permitidas = {n.chave for n in ents}
            texto_n = normalizar(ch.texto)
            for r in res.relacoes:
                rel["propostas"] += 1
                s, o = r.sujeito.strip().strip("[]"), r.objeto.strip().strip("[]")
                if s not in permitidas or o not in permitidas:
                    rel["recusadas"]["entidade_fora_da_lista"] += 1
                    continue
                if s == o:
                    rel["recusadas"]["laço"] += 1
                    continue
                try:
                    pred = Predicado(r.predicado.strip().upper())
                except ValueError:
                    rel["recusadas"]["predicado"] += 1
                    continue
                if pred not in PERMITIDOS:
                    rel["recusadas"]["predicado"] += 1
                    continue
                if not dominio_valido(pred, tipos.get(s, TipoEntidade.CONCEITO), tipos.get(o, TipoEntidade.CONCEITO)):
                    rel["recusadas"]["dominio"] += 1
                    continue
                ev = r.evidencia.strip().strip('"“”')
                if len(ev) < 12 or normalizar(ev) not in texto_n:
                    rel["recusadas"]["citacao_nao_literal"] += 1
                    continue
                candidato = Fato(sujeito=s, predicado=pred, objeto=o, evidencia=ev, doc_id=d.doc_id, url=d.url)
                if not sustenta(candidato, corpus.entidades):
                    rel["recusadas"]["citacao_nao_nomeia_as_duas_entidades"] = rel["recusadas"].get("citacao_nao_nomeia_as_duas_entidades", 0) + 1
                    continue
                rel["aceitas"] += 1
                fatos.append(Fato(sujeito=s, predicado=pred, objeto=o, evidencia=ev, tipo_evidencia=TipoEvidencia.TEXTO, doc_id=d.doc_id,
                                  url=d.url, obra=d.obras[0] if d.obras else None, ano=d.ano, confiabilidade=d.confiabilidade,
                                  predicado_original="extraido_por_modelo"))
    return fatos, rel
