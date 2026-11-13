"""Validador epistêmico: nenhuma afirmação sai sem o tipo certo e sem citação válida.

Regras:
1. citações a ids que não existem no registro são removidas (e anotadas);
2. `confirmado` ou `inferencia` sem nenhuma evidência válida é rebaixado a `hipotese`;
3. o contexto só aceita `confirmado` com evidência (o resto é removido do contexto);
4. relações sistêmicas `confirmado` precisam citar ao menos uma evidência de relação do grafo
   (relação entre personagens não pode ser afirmada só a partir de texto solto); senão viram `inferencia`;
5. chaves de entidades que não existem no grafo são removidas: o motor não cria entidades.
"""
from __future__ import annotations

from freya.evidencias.registro import RegistroDeEvidencias
from freya.prospectivo.modelos import Afirmacao, CorpoDaAnalise, RegistroDeValidacao, TipoEpistemico


def normalizar_chave(bruta: str, conhecidas: set[str], nomes: dict[str, str] | None = None) -> str | None:
    """Aceita a chave como o modelo a escreveu ("[character:m'baku]", "Shuri") e devolve a chave real, ou None."""
    from freya.conhecimento.normalizacao import normalizar, slug

    c = bruta.strip().strip("[]()`'\" ").strip()
    if c in conhecidas:
        return c
    if ":" in c:
        tipo, resto = c.split(":", 1)
        candidata = f"{tipo.strip().lower()}:{slug(resto)}"
        if candidata in conhecidas:
            return candidata
        c = resto
    if nomes:
        alvo = normalizar(c)
        achadas = [k for k, n in nomes.items() if normalizar(n) == alvo and k in conhecidas]
        if len(achadas) == 1:
            return achadas[0]
    return None


def validar(corpo: CorpoDaAnalise, registro: RegistroDeEvidencias, entidades_conhecidas: set[str],
            nomes: dict[str, str] | None = None) -> tuple[CorpoDaAnalise, RegistroDeValidacao]:
    rv = RegistroDeValidacao()

    def afirm(a: Afirmacao, onde: str) -> Afirmacao:
        evs = [e.strip().strip("[]") for e in a.evidencias]
        validas = [e for e in dict.fromkeys(evs) if registro.existe(e)]
        for e in evs:
            if not registro.existe(e):
                rv.citacoes_invalidas.append(f"{onde}: {e}")
        tipo = a.tipo
        if tipo in (TipoEpistemico.CONFIRMADO, TipoEpistemico.INFERENCIA) and not validas:
            rv.rebaixadas.append(f"{onde}: '{a.texto[:80]}' ({tipo.value} → hipotese, sem evidência)")
            tipo = TipoEpistemico.HIPOTESE
        return Afirmacao(texto=a.texto.strip(), tipo=tipo, evidencias=validas)

    def lista(xs: list[Afirmacao], onde: str) -> list[Afirmacao]:
        return [afirm(a, f"{onde}[{i}]") for i, a in enumerate(xs) if a.texto.strip()]

    def ents(chaves: list[str], onde: str) -> list[str]:
        ok = []
        for c in chaves:
            real = normalizar_chave(c, entidades_conhecidas, nomes)
            if real:
                ok.append(real)
            else:
                rv.entidades_desconhecidas.append(f"{onde}: {c}")
        return list(dict.fromkeys(ok))

    c = corpo.model_copy(deep=True)
    c.resposta = lista(c.resposta, "resposta")
    contexto = []
    for i, a in enumerate(lista(c.contexto, "contexto")):
        if a.tipo == TipoEpistemico.CONFIRMADO:
            contexto.append(a)
        else:
            rv.removidas.append(f"contexto[{i}]: '{a.texto[:80]}' (contexto aceita só fatos confirmados)")
    c.contexto = contexto

    atores = []
    for i, at in enumerate(c.atores):
        real = normalizar_chave(at.entidade, entidades_conhecidas, nomes)
        if not real:
            rv.entidades_desconhecidas.append(f"atores[{i}]: {at.entidade}")
            continue
        at.entidade = real
        at.fundamentos = lista(at.fundamentos, f"atores[{i}]")
        atores.append(at)
    c.atores = atores

    for i, r in enumerate(c.relacoes_sistemicas):
        r.entidades = ents(r.entidades, f"relacoes_sistemicas[{i}]")
        r.descricao = afirm(r.descricao, f"relacoes_sistemicas[{i}]")
        if r.descricao.tipo == TipoEpistemico.CONFIRMADO and not any(registro.itens[e].tipo != "trecho" for e in r.descricao.evidencias):
            rv.rebaixadas.append(f"relacoes_sistemicas[{i}]: confirmado sem relação do grafo → inferencia")
            r.descricao.tipo = TipoEpistemico.INFERENCIA
    c.relacoes_sistemicas = [r for r in c.relacoes_sistemicas if len(r.entidades) >= 1]

    for i, v in enumerate(c.variaveis):
        v.descricao = afirm(v.descricao, f"variaveis[{i}]")
        v.entidades = ents(v.entidades, f"variaveis[{i}]")
    c.tendencias_e_sinais = lista(c.tendencias_e_sinais, "tendencias_e_sinais")
    for i, x in enumerate(c.incertezas_criticas):
        x.por_que_importa = afirm(x.por_que_importa, f"incertezas_criticas[{i}]")
    for i, d in enumerate(c.desdobramentos):
        d.descricao = afirm(d.descricao, f"desdobramentos[{i}]")
        d.consequencias_diretas = lista(d.consequencias_diretas, f"desdobramentos[{i}].diretas")
        d.consequencias_indiretas = lista(d.consequencias_indiretas, f"desdobramentos[{i}].indiretas")
    for i, s in enumerate(c.cenarios):
        onde = f"cenarios[{s.id or i}]"
        s.logica = afirm(s.logica, onde + ".logica")
        s.premissas = lista(s.premissas, onde + ".premissas")
        s.desenvolvimento = lista(s.desenvolvimento, onde + ".desenvolvimento")
        s.consequencias = lista(s.consequencias, onde + ".consequencias")
        s.sinais = lista(s.sinais, onde + ".sinais")
        s.entidades = ents(s.entidades, onde)
    return c, rv
