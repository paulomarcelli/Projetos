"""Construtores do modo demonstrativo.

Produzem saídas no MESMO contrato dos agentes reais, derivadas de forma determinística do
catálogo do caso e dos índices do motor. Não há pesquisa nem fatos: nenhuma afirmação sai
como "fato" e nenhuma fonte é inventada. A interface identifica tudo como demonstração.
"""
from __future__ import annotations

from typing import Any, Callable

NIV = ["baixo", "moderado", "alto"]


def _sobe(n: str, passos: int = 1) -> str:
    return NIV[max(0, min(2, NIV.index(n) + passos))]


def evidencias_demo(ctx: dict[str, Any]) -> dict[str, Any]:
    caso = ctx["caso"]
    ev = [
        {"afirmacao": f"[Demonstração] Hipótese a testar com pesquisa real: {h}", "fonte_ids": [], "status": "incerto", "relacao": "contexto", "hipotese": h}
        for h in caso["hipoteses"]
    ]
    return {"evidencias": ev, "lacunas": []}


def _top_variaveis(caso: dict, motor: dict, dim: str, n: int = 2) -> list[str]:
    contrib = motor["indices"][dim]["contribuicoes"]
    nomes = {v["id"]: v["nome"] for v in caso["variaveis"]}
    return [nomes[k] for k, _ in sorted(contrib.items(), key=lambda kv: -kv[1])[:n] if k in nomes]


def analisar(ctx: dict[str, Any]) -> dict[str, Any]:
    caso, motor, entrada = ctx["caso"], ctx["motor"], ctx["entrada"]
    prop = motor["propensao_escalada"]["nivel"]
    h = entrada["horizonte_meses"]
    atores = caso["atores"] or [{"id": "parte_a", "nome": "Parte A", "papel": "inicia a medida"}, {"id": "parte_b", "nome": "Parte B", "papel": "parte afetada"}]
    a0, a1 = atores[0], atores[1] if len(atores) > 1 else atores[0]

    plaus = {
        "alto": {"continuidade": "moderado", "escalada": "alto", "desescalada": "baixo"},
        "moderado": {"continuidade": "alto", "escalada": "moderado", "desescalada": "moderado"},
        "baixo": {"continuidade": "moderado", "escalada": "baixo", "desescalada": "alto"},
    }[prop]

    def af(texto: str, natureza: str) -> dict:
        return {"texto": texto, "natureza": natureza, "evidencia_ids": []}

    dims = {"economico": "econômica", "diplomatico": "diplomática", "estrategico": "estratégica"}
    resumo = [
        af(f"Configuração simulada para {h} meses com propensão de escalada {prop} no modelo (índice {motor['propensao_escalada']['valor']:.0f}/100).", "premissa"),
        af(f"A pressão {max(dims, key=lambda d: motor['indices'][d]['valor']) and dims[max(dims, key=lambda d: motor['indices'][d]['valor'])]} é a mais alta nesta configuração, puxada por {', '.join(_top_variaveis(caso, motor, max(dims, key=lambda d: motor['indices'][d]['valor'])))}.", "interpretacao"),
        af(f"O cenário de {max(plaus, key=lambda k: NIV.index(plaus[k]))} é o mais plausível sob estas premissas — análise condicional, não previsão.", "hipotese"),
        af("Modo demonstrativo: sem pesquisa real, nenhuma afirmação deste resultado é um fato verificado.", "premissa"),
    ]

    cenarios = []
    for tipo, titulo, verbo in (("continuidade", "Tendências atuais se mantêm", "se mantém"), ("escalada", "Escalada da disputa", "se intensifica"), ("desescalada", "Desescalada negociada", "perde força")):
        cenarios.append({
            "tipo": tipo,
            "titulo": titulo,
            "narrativa": [
                af(f"A situação entre {a0['nome']} e {a1['nome']} {verbo} ao longo de {h} meses.", "hipotese"),
                af(f"Variáveis mais influentes nesta configuração: {', '.join(_top_variaveis(caso, motor, 'diplomatico'))}.", "interpretacao"),
            ],
            "gatilhos": [f"Mudança em “{v['nome']}”" for v in caso["variaveis"][:2]],
            "indicadores": [f"Declarações oficiais de {a0['nome']} e {a1['nome']}", "Novas medidas anunciadas ou suspensas"],
            "plausibilidade": plaus[tipo],
            "justificativa": f"Derivada da propensão de escalada {prop} calculada pelo motor a partir das variáveis escolhidas.",
        })

    impactos = []
    for d, nome in dims.items():
        base = motor["indices"][d]["nivel"]
        impactos.append({
            "dimensao": d,
            "titulo": f"Pressão {nome}",
            "mecanismo": f"As variáveis {', '.join(_top_variaveis(caso, motor, d))} elevam a pressão {nome} no modelo; efeitos indiretos dependem da reação de terceiros.",
            "por_cenario": {"continuidade": base, "escalada": _sobe(base), "desescalada": _sobe(base, -1)},
            "natureza": "interpretacao",
            "evidencia_ids": [],
        })

    top_e = _top_variaveis(caso, motor, "economico", 1)[0]
    top_d = _top_variaveis(caso, motor, "diplomatico", 1)[0]
    matriz = [
        {"tipo": "risco", "titulo": f"Efeitos de “{top_e}” sobre cadeias e preços", "probabilidade": motor["indices"]["economico"]["nivel"], "impacto": _sobe(motor["indices"]["economico"]["nivel"]), "justificativa": "Classificação qualitativa derivada do índice econômico do modelo.", "cenarios": ["continuidade", "escalada"]},
        {"tipo": "risco", "titulo": f"Deterioração diplomática ligada a “{top_d}”", "probabilidade": motor["indices"]["diplomatico"]["nivel"], "impacto": "moderado", "justificativa": "Classificação qualitativa derivada do índice diplomático do modelo.", "cenarios": ["escalada"]},
        {"tipo": "oportunidade", "titulo": "Janela de negociação e redução de custos", "probabilidade": plaus["desescalada"], "impacto": "moderado", "justificativa": "Plausibilidade do cenário de desescalada nesta configuração.", "cenarios": ["desescalada"]},
    ]

    analise_atores = []
    for i, a in enumerate(atores):
        postura = "confrontacional" if i < 2 and prop == "alto" else ("cooperativa" if prop == "baixo" else "neutra")
        analise_atores.append({"ator_id": a["id"], "interesses": [f"Proteger sua posição como {a['papel']}"], "incentivos": ["Reduzir custos domésticos da disputa"], "capacidades": ["A detalhar com pesquisa real"], "restricoes": ["A detalhar com pesquisa real"], "postura": postura})

    relacoes = [{"origem": a0["id"], "destino": a1["id"], "tipo": "tensao" if prop != "baixo" else "neutra", "intensidade": prop, "descricao": "Relação central do caso."}]
    for a in atores[2:]:
        relacoes.append({"origem": a0["id"], "destino": a["id"], "tipo": "dependencia", "intensidade": "moderado", "descricao": f"{a['nome']}: {a['papel']}."})

    return {
        "resumo_executivo": resumo,
        "atores": analise_atores,
        "cenarios": cenarios,
        "impactos": impactos,
        "matriz": matriz,
        "relacoes": relacoes,
        "confianca": "baixo",
        "justificativa_confianca": "Modo demonstrativo: sem pesquisa real nem análise por IA. O resultado ilustra o funcionamento do sistema.",
        "incertezas": ["Não há evidências atuais coletadas.", "Pesos das variáveis são escolhas de modelagem, não calibrados."],
    }


CONSTRUTORES: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {
    "evidencias_demo": evidencias_demo,
    "analisar": analisar,
    "extrair_evidencias": lambda ctx: {"evidencias": [], "lacunas": ["Modo demonstrativo: extração por IA desativada."]},
    "verificar": lambda ctx: {"problemas": [], "observacoes": []},
}
