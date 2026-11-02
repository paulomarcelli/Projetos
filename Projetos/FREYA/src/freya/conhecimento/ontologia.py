"""Ontologia da F.R.E.Y.A.: tipos de entidade e predicados com direção fixa.

Uma entidade é identificada por `tipo:slug` (ex.: `character:thor`, `film:thor`). Assim o personagem
Thor e o filme Thor nunca viram o mesmo nó, que era o defeito central do grafo anterior.

Dois mundos convivem e não se misturam:
- o universo narrativo do MCU (personagens, organizações, acontecimentos, locais, artefatos);
- a produção (filmes, séries, pessoas reais do elenco e da equipe).
"""
from __future__ import annotations

from enum import Enum


class TipoEntidade(str, Enum):
    PERSONAGEM = "character"
    ORGANIZACAO = "organization"
    FILME = "film"
    SERIE = "series"
    ESPECIAL = "special"  # curtas, especiais e one-shots
    ACONTECIMENTO = "event"
    LOCAL = "location"
    ARTEFATO = "artifact"
    TECNOLOGIA = "technology"  # tecnologias e capacidades (armadura, voo, IA)
    PESSOA = "person"  # pessoa real: elenco e equipe
    EMPRESA = "company"  # empresa real: estúdio, plataforma
    CONCEITO = "concept"  # ex.: Multiverso, Joias do Infinito como conjunto

    @property
    def rotulo_neo4j(self) -> str:
        return {
            "character": "Character", "organization": "Organization", "film": "Film", "series": "Series",
            "special": "Special", "event": "Event", "location": "Location", "artifact": "Artifact",
            "technology": "Technology", "person": "Person", "company": "Company", "concept": "Concept",
        }[self.value]

    @property
    def narrativo(self) -> bool:
        """Pertence ao universo da história (e não à produção)."""
        return self not in OBRAS | {TipoEntidade.PESSOA, TipoEntidade.EMPRESA}

    @property
    def obra(self) -> bool:
        return self in OBRAS


class Predicado(str, Enum):
    # universo narrativo
    ALIADO_DE = "ALLY_OF"
    INIMIGO_DE = "ENEMY_OF"
    PARENTE_DE = "RELATIVE_OF"
    MEMBRO_DE = "MEMBER_OF"
    LIDERA = "LEADS"
    POSSUI = "POSSESSES"  # artefato
    USA = "USES"
    TEM_CAPACIDADE = "HAS_ABILITY"
    CRIOU = "CREATED"
    LOCALIZADO_EM = "LOCATED_IN"
    VIVENCIA = "EXPERIENCES"  # personagem -> acontecimento (momento da trajetória)
    PARTICIPA_DE = "PARTICIPATES_IN"
    AMEACA = "THREATENS"
    BUSCA = "SEEKS"
    GOVERNA = "RULES"
    TAMBEM_CONHECIDO_COMO = "ALSO_KNOWN_AS"
    COMPARTILHA_CORPO_COM = "SHARES_BODY_WITH"
    # produção
    APARECE_EM = "APPEARS_IN"  # personagem -> obra
    INTERPRETADO_POR = "PORTRAYED_BY"  # personagem -> pessoa
    ELENCO_DE = "CAST_IN"  # pessoa -> obra
    DIRIGIDO_POR = "DIRECTED_BY"  # obra -> pessoa
    ESCRITO_POR = "WRITTEN_BY"  # obra -> pessoa
    PRODUZIDO_POR = "PRODUCED_BY"  # obra -> pessoa ou estúdio
    SEQUENCIA_DE = "FOLLOWS"  # obra -> obra anterior
    NA_CRONOLOGIA_OFICIAL = "IN_OFFICIAL_TIMELINE"  # obra -> cronologia (com posição)
    # relação explícita no texto que não cabe na ontologia: guarda o verbo original
    RELACIONADO_A = "RELATED_TO"


OBRAS = {TipoEntidade.FILME, TipoEntidade.SERIE, TipoEntidade.ESPECIAL}

SIMETRICOS = {Predicado.ALIADO_DE, Predicado.INIMIGO_DE, Predicado.PARENTE_DE, Predicado.COMPARTILHA_CORPO_COM}

ROTULOS_PT: dict[Predicado, str] = {
    Predicado.ALIADO_DE: "aliado de", Predicado.INIMIGO_DE: "inimigo de", Predicado.PARENTE_DE: "parente de",
    Predicado.MEMBRO_DE: "membro de", Predicado.LIDERA: "lidera", Predicado.POSSUI: "possui",
    Predicado.USA: "usa", Predicado.TEM_CAPACIDADE: "tem a capacidade", Predicado.CRIOU: "criou",
    Predicado.LOCALIZADO_EM: "localizado em", Predicado.VIVENCIA: "vivencia",
    Predicado.PARTICIPA_DE: "participa de", Predicado.AMEACA: "ameaça", Predicado.BUSCA: "busca",
    Predicado.GOVERNA: "governa", Predicado.TAMBEM_CONHECIDO_COMO: "também conhecido como",
    Predicado.COMPARTILHA_CORPO_COM: "compartilha o corpo com", Predicado.APARECE_EM: "aparece em",
    Predicado.INTERPRETADO_POR: "interpretado por", Predicado.ELENCO_DE: "no elenco de", Predicado.DIRIGIDO_POR: "dirigido por",
    Predicado.ESCRITO_POR: "escrito por", Predicado.PRODUZIDO_POR: "produzido por",
    Predicado.SEQUENCIA_DE: "continua", Predicado.NA_CRONOLOGIA_OFICIAL: "na cronologia oficial",
    Predicado.RELACIONADO_A: "relacionado a",
}

# Predicados do corpus da Manus -> (predicado da ontologia, inverter sujeito/objeto?)
MAPA_MANUS: dict[str, tuple[Predicado, bool]] = {
    "DIRECTED_BY": (Predicado.DIRIGIDO_POR, False),
    "DIRECTOR_OF": (Predicado.DIRIGIDO_POR, True),
    "DIRECTED": (Predicado.DIRIGIDO_POR, True),
    "DIRECTS": (Predicado.DIRIGIDO_POR, True),
    "WRITTEN_BY": (Predicado.ESCRITO_POR, False),
    "WROTE": (Predicado.ESCRITO_POR, True),
    "SCREENPLAY_WRITER_OF": (Predicado.ESCRITO_POR, True),
    "HEAD_WRITER": (Predicado.ESCRITO_POR, True),
    "PRODUCED_BY": (Predicado.PRODUZIDO_POR, False),
    "PRODUCER_OF": (Predicado.PRODUZIDO_POR, True),
    "PRODUCED_FILM": (Predicado.PRODUZIDO_POR, True),
    "PRODUCED": (Predicado.PRODUZIDO_POR, True),
    "PORTRAYED_BY": (Predicado.INTERPRETADO_POR, False),
    "PLAYS": (Predicado.INTERPRETADO_POR, True),
    "CAST_IN": (Predicado.ELENCO_DE, False),
    "STARS": (Predicado.ELENCO_DE, True),
    "FEATURES": (Predicado.APARECE_EM, True),
    "FEATURES_CHARACTER": (Predicado.APARECE_EM, True),
    "STARRING_CHARACTER": (Predicado.APARECE_EM, True),
    "TELLS_STORY_OF": (Predicado.APARECE_EM, True),
    "FOLLOWS_JOURNEY_OF": (Predicado.APARECE_EM, True),
    "HAS_STORY_OF": (Predicado.APARECE_EM, True),
    "ORIGIN_STORY_OF": (Predicado.APARECE_EM, True),
    "CENTERS_ON_PARENTAGE_MYSTERY": (Predicado.APARECE_EM, True),
    "TAKES_PLACE_AFTER": (Predicado.SEQUENCIA_DE, False),
    "FOLLOWS_EVENTS_OF": (Predicado.SEQUENCIA_DE, False),
    "SET_ON": (Predicado.LOCALIZADO_EM, False),
    "SET_IN": (Predicado.LOCALIZADO_EM, False),
    "TAKES_PLACE_THROUGH": (Predicado.LOCALIZADO_EM, False),
    "INHERITS_THRONE_FROM": (Predicado.PARENTE_DE, False),
    "SUCCEEDS_TO_THRONE": (Predicado.GOVERNA, False),
    "RETURNS_TO": (Predicado.LOCALIZADO_EM, False),
    "BANISHED_TO": (Predicado.LOCALIZADO_EM, False),
    "ALSO_KNOWN_AS": (Predicado.TAMBEM_CONHECIDO_COMO, False),
    "SHARES_BODY_WITH": (Predicado.COMPARTILHA_CORPO_COM, False),
    "SON_OF": (Predicado.PARENTE_DE, False),
    "HAS_ALLY": (Predicado.ALIADO_DE, False),
    "JOINS_FORCES_WITH": (Predicado.ALIADO_DE, False),
    "LEADS": (Predicado.LIDERA, False),
    "THREATENS": (Predicado.AMEACA, False),
    "SEEKS_TO_COLLECT": (Predicado.BUSCA, False),
    "COVETS": (Predicado.BUSCA, False),
    "GAINS_ACCESS_TO": (Predicado.USA, False),
    "BUILDS": (Predicado.CRIOU, False),
    "ESCAPES_USING": (Predicado.USA, False),
    "LIVES_IN": (Predicado.LOCALIZADO_EM, False),
    "LISTED_IN_OFFICIAL_MCU_TIMELINE": (Predicado.NA_CRONOLOGIA_OFICIAL, False),
    "FOLLOWS": (Predicado.SEQUENCIA_DE, False),  # obra -> obra; obra -> personagem vira APARECE_EM (ver migração)
    "ASTRONAUT_OF": (Predicado.MEMBRO_DE, False),
    "OPPOSES": (Predicado.INIMIGO_DE, False),
    "MUST_STOP": (Predicado.INIMIGO_DE, False),
    "STEALS": (Predicado.POSSUI, False),
    "INCLUDES": (Predicado.MEMBRO_DE, True),
}

# Distribuição e metadados de catálogo: não descrevem o universo nem a autoria; a migração descarta.
DESCARTADOS_MANUS = {
    "STREAMS_EXCLUSIVELY_ON", "STREAMING_ON", "AVAILABLE_ON", "STREAMS_ON", "DEBUTED_ON", "NETWORK",
    "PRESENTED_BY", "IN_ASSOCIATION_WITH", "SPANS", "BLENDS", "FEATURES_SOUNDTRACK_BACKDROP",
}

# Tipos da Manus -> tipos da ontologia. "PERSON" da Manus mistura personagem e ator: decidido caso a caso.
MAPA_TIPOS_MANUS: dict[str, TipoEntidade] = {
    "FILM": TipoEntidade.FILME, "SERIES": TipoEntidade.SERIE, "SPECIAL": TipoEntidade.ESPECIAL,
    "ORG": TipoEntidade.ORGANIZACAO, "PLACE": TipoEntidade.LOCAL, "ARTIFACT": TipoEntidade.ARTEFATO,
    "EVENT": TipoEntidade.ACONTECIMENTO,
}

# Predicados cujo sujeito/objeto "PERSON" é uma pessoa real (equipe) e não um personagem.
PREDICADOS_DE_EQUIPE = {Predicado.DIRIGIDO_POR, Predicado.ESCRITO_POR, Predicado.PRODUZIDO_POR}

_PRODUCAO = {
    Predicado.DIRIGIDO_POR: (OBRAS, {TipoEntidade.PESSOA}),
    Predicado.ESCRITO_POR: (OBRAS, {TipoEntidade.PESSOA}),
    Predicado.PRODUZIDO_POR: (OBRAS, {TipoEntidade.PESSOA, TipoEntidade.EMPRESA}),
    Predicado.INTERPRETADO_POR: ({TipoEntidade.PERSONAGEM}, {TipoEntidade.PESSOA}),
    Predicado.ELENCO_DE: ({TipoEntidade.PESSOA}, OBRAS),
    Predicado.SEQUENCIA_DE: (OBRAS, OBRAS),
    Predicado.NA_CRONOLOGIA_OFICIAL: (OBRAS, {TipoEntidade.CONCEITO}),
}


def dominio_valido(predicado: Predicado, tipo_sujeito: TipoEntidade, tipo_objeto: TipoEntidade) -> bool:
    """Confere se o predicado pode ligar esses dois tipos (impede, por ex., uma atriz 'membro' de uma organização)."""
    if predicado in _PRODUCAO:
        sujeitos, objetos = _PRODUCAO[predicado]
        return tipo_sujeito in sujeitos and tipo_objeto in objetos
    if predicado == Predicado.APARECE_EM:
        return tipo_sujeito.narrativo and tipo_objeto.obra
    if predicado == Predicado.LOCALIZADO_EM:
        return (tipo_sujeito.narrativo or tipo_sujeito.obra) and tipo_objeto in (TipoEntidade.LOCAL, TipoEntidade.CONCEITO)
    if predicado == Predicado.RELACIONADO_A:
        return True
    if predicado in _NARRATIVO:
        sujeitos, objetos = _NARRATIVO[predicado]
        return tipo_sujeito in sujeitos and tipo_objeto in objetos
    return tipo_sujeito.narrativo and tipo_objeto.narrativo


_AGENTES = {TipoEntidade.PERSONAGEM, TipoEntidade.ORGANIZACAO}
_COISAS = {TipoEntidade.ARTEFATO, TipoEntidade.TECNOLOGIA, TipoEntidade.CONCEITO}
_NARRATIVO = {
    Predicado.ALIADO_DE: (_AGENTES, _AGENTES),
    Predicado.INIMIGO_DE: (_AGENTES, _AGENTES),
    Predicado.PARENTE_DE: ({TipoEntidade.PERSONAGEM}, {TipoEntidade.PERSONAGEM}),
    Predicado.COMPARTILHA_CORPO_COM: ({TipoEntidade.PERSONAGEM}, {TipoEntidade.PERSONAGEM}),
    Predicado.MEMBRO_DE: (_AGENTES, {TipoEntidade.ORGANIZACAO}),
    Predicado.LIDERA: (_AGENTES, {TipoEntidade.ORGANIZACAO}),
    Predicado.POSSUI: (_AGENTES, _COISAS),
    Predicado.USA: (_AGENTES, _COISAS),
    Predicado.TEM_CAPACIDADE: ({TipoEntidade.PERSONAGEM}, _COISAS),
    Predicado.BUSCA: (_AGENTES, _COISAS | {TipoEntidade.LOCAL} | _AGENTES),
    Predicado.CRIOU: (_AGENTES, _COISAS | _AGENTES),
    Predicado.AMEACA: (_AGENTES | _COISAS, _AGENTES | {TipoEntidade.LOCAL}),
    Predicado.GOVERNA: (_AGENTES, {TipoEntidade.LOCAL, TipoEntidade.ORGANIZACAO}),
    Predicado.VIVENCIA: ({TipoEntidade.PERSONAGEM}, {TipoEntidade.ACONTECIMENTO}),
    Predicado.PARTICIPA_DE: (_AGENTES, {TipoEntidade.ACONTECIMENTO}),
}
