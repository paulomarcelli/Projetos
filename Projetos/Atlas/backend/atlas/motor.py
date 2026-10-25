"""Motor de simulação determinístico.

O que fica em código (testável, reproduzível): validação e normalização das variáveis,
índices de pressão por dimensão, propensão de escalada, faixas qualitativas e a comparação
entre simulações. A IA interpreta e constrói cenários; ela NÃO produz estes números.

Os índices são construções do modelo (0–100), não previsões nem probabilidades.
"""
from __future__ import annotations

from .modelos import Caso, Comparacao, IndiceDimensao, MudancaConclusao, MudancaVariavel, Nivel, Resultado, SaidaMotor, SimulacaoEntrada

DIMENSOES = ("economico", "diplomatico", "estrategico")
FAIXAS = ((34.0, "baixo"), (67.0, "moderado"), (101.0, "alto"))

FORMULA = (
    "n_i = (valor_i − mín_i) / (máx_i − mín_i). "
    "g_i = n_i se a variável empurra para escalada (efeito ≥ 0); g_i = 1 − n_i se ela contém a crise (efeito < 0). "
    "Índice da dimensão d = 100 · Σ(w_i,d · g_i) / Σ w_i,d · f_h, limitado a 100. "
    "Propensão de escalada = 100 · Σ(|e_i| · g_i) / Σ|e_i|. "
    "Fator de horizonte f_h = 0,85 + 0,30 · min(h, 24)/24 (efeitos se acumulam com o tempo). "
    "Faixas: < 34 baixo, < 67 moderado, ≥ 67 alto."
)

LIMITACOES = [
    "Os pesos das variáveis são escolhas de modelagem explícitas no catálogo de casos, não estimativas calibradas com dados históricos.",
    "Os índices medem a pressão relativa dentro do modelo; não são probabilidades nem previsões.",
    "Interações não lineares entre variáveis e choques externos não estão modelados.",
    "Comparar índices só faz sentido entre simulações do mesmo caso.",
]


class ErroValidacao(ValueError):
    pass


def nivel(valor: float) -> Nivel:
    for limite, nome in FAIXAS:
        if valor < limite:
            return nome  # type: ignore[return-value]
    return "alto"


def validar_valores(caso: Caso, valores: dict[str, float]) -> dict[str, float]:
    """Completa com padrões, rejeita variáveis desconhecidas e valores fora da faixa."""
    conhecidas = {v.id: v for v in caso.variaveis}
    desconhecidas = sorted(set(valores) - set(conhecidas))
    if desconhecidas:
        raise ErroValidacao(f"Variáveis que não pertencem a este caso: {', '.join(desconhecidas)}")
    finais: dict[str, float] = {}
    for v in caso.variaveis:
        x = float(valores.get(v.id, v.padrao))
        if x != x:  # NaN
            raise ErroValidacao(f"Valor inválido para {v.nome}")
        if not (v.minimo <= x <= v.maximo):
            raise ErroValidacao(f"{v.nome} deve estar entre {v.minimo:g} e {v.maximo:g}")
        finais[v.id] = x
    return finais


def fator_horizonte(meses: int) -> float:
    return 0.85 + 0.30 * min(meses, 24) / 24


def executar(caso: Caso, entrada: SimulacaoEntrada) -> SaidaMotor:
    valores = validar_valores(caso, entrada.valores)
    norm: dict[str, float] = {}
    g: dict[str, float] = {}
    for v in caso.variaveis:
        n = (valores[v.id] - v.minimo) / (v.maximo - v.minimo) if v.maximo > v.minimo else 0.0
        norm[v.id] = round(n, 4)
        g[v.id] = n if v.efeito_escalada >= 0 else 1 - n
    fh = fator_horizonte(entrada.horizonte_meses)

    indices: dict[str, IndiceDimensao] = {}
    for d in DIMENSOES:
        soma_w = sum(v.pesos.get(d, 0) for v in caso.variaveis) or 1.0
        contrib = {v.id: 100 * v.pesos.get(d, 0) * g[v.id] / soma_w for v in caso.variaveis}
        bruto = sum(contrib.values()) * fh
        valor = round(min(100.0, bruto), 1)
        indices[d] = IndiceDimensao(valor=valor, nivel=nivel(valor), contribuicoes={k: round(c * fh, 2) for k, c in contrib.items()})

    soma_e = sum(abs(v.efeito_escalada) for v in caso.variaveis) or 1.0
    contrib_e = {v.id: 100 * abs(v.efeito_escalada) * g[v.id] / soma_e for v in caso.variaveis}
    prop = round(min(100.0, sum(contrib_e.values())), 1)

    return SaidaMotor(
        valores_normalizados=norm,
        indices=indices,  # type: ignore[arg-type]
        propensao_escalada=IndiceDimensao(valor=prop, nivel=nivel(prop), contribuicoes={k: round(c, 2) for k, c in contrib_e.items()}),
        fator_horizonte=round(fh, 3),
        formula=FORMULA,
        limitacoes=LIMITACOES,
    )


def descrever_variaveis(caso: Caso, valores: dict[str, float]) -> list[str]:
    """Condições iniciais legíveis (para o registro de premissas e para os prompts)."""
    linhas = []
    for v in caso.variaveis:
        x = valores.get(v.id, v.padrao)
        rot = ""
        if v.rotulos:
            i = min(len(v.rotulos) - 1, int((x - v.minimo) / ((v.maximo - v.minimo) or 1) * len(v.rotulos)))
            rot = f" ({v.rotulos[i]})"
        linhas.append(f"{v.nome}: {x:g}{(' ' + v.unidade) if v.unidade else ''}{rot}")
    return linhas


# ------------------------------------------------------------------ comparação
def _mapa_conclusoes(r: Resultado) -> dict[str, str]:
    """Achata o resultado em itens comparáveis (classificações qualitativas e índices)."""
    m: dict[str, str] = {}
    if r.motor:
        for d, ind in r.motor.indices.items():
            m[f"Índice {d}"] = ind.nivel
        m["Propensão de escalada (modelo)"] = r.motor.propensao_escalada.nivel
    if r.analise:
        m["Confiança da análise"] = r.analise.confianca
        for c in r.analise.cenarios:
            m[f"Plausibilidade do cenário de {c.tipo}"] = c.plausibilidade
        for imp in r.analise.impactos:
            for tipo, niv in imp.por_cenario.items():
                m[f"Impacto “{imp.titulo}” ({tipo})"] = niv
        for it in r.analise.matriz:
            m[f"{it.tipo.capitalize()} “{it.titulo}”"] = f"probabilidade {it.probabilidade}, impacto {it.impacto}"
    return m


def comparar(a: Resultado, b: Resultado) -> Comparacao:
    mesmo = a.caso.id == b.caso.id
    nomes = {v.id: v.nome for v in (b.caso.variaveis + a.caso.variaveis)}
    va = validar_valores(a.caso, a.entrada.valores) if a.motor else a.entrada.valores
    vb = validar_valores(b.caso, b.entrada.valores) if b.motor else b.entrada.valores
    variaveis = [
        MudancaVariavel(id=k, nome=nomes.get(k, k), antes=va.get(k), depois=vb.get(k))
        for k in sorted(set(va) | set(vb))
        if va.get(k) != vb.get(k)
    ]
    pa, pb = set(a.entrada.premissas_extra), set(b.entrada.premissas_extra)
    indices: dict[str, tuple[float, float]] = {}
    if mesmo and a.motor and b.motor:
        for d in DIMENSOES:
            indices[d] = (a.motor.indices[d].valor, b.motor.indices[d].valor)  # type: ignore[index]
        indices["propensao_escalada"] = (a.motor.propensao_escalada.valor, b.motor.propensao_escalada.valor)
    ca, cb = _mapa_conclusoes(a), _mapa_conclusoes(b)
    mudancas = [MudancaConclusao(item=k, antes=ca.get(k, "—"), depois=cb.get(k, "—")) for k in sorted(set(ca) | set(cb)) if ca.get(k) != cb.get(k)]
    inalteradas = sorted(k for k in set(ca) & set(cb) if ca[k] == cb[k])
    return Comparacao(
        a_id=a.id,
        b_id=b.id,
        mesmo_caso=mesmo,
        variaveis=variaveis,
        horizonte=(a.entrada.horizonte_meses, b.entrada.horizonte_meses),
        premissas_adicionadas=sorted(pb - pa),
        premissas_removidas=sorted(pa - pb),
        indices=indices,
        mudancas=mudancas,
        inalteradas=inalteradas,
    )
