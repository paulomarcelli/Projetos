"""Reconhecimento das entidades citadas numa questão de investigação.

- compara nomes normalizados (acentos, apóstrofos, caixa) por palavra inteira;
- usa os apelidos da base e uma tabela de nomes em português (dados/apelidos_pt.json), fora do código;
- prefere o trecho mais longo ("Avengers: Endgame" antes de "Avengers");
- quando um trecho corresponde a mais de uma entidade, decide só se houver um critério explícito
  (ex.: "filme"/"série" na questão escolhe a obra; senão, o personagem) e registra a ambiguidade.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from freya.conhecimento.normalizacao import normalizar
from freya.conhecimento.ontologia import OBRAS, TipoEntidade
from freya.graph.modelos import No

_APELIDOS_PT = Path(__file__).with_name("dados") / "apelidos_pt.json"
_PALAVRAS_DE_OBRA = ("filme", "serie", "série", "movie", "film", "series", "temporada", "season")
_PRIORIDADE = [TipoEntidade.PERSONAGEM, TipoEntidade.ORGANIZACAO, TipoEntidade.ARTEFATO, TipoEntidade.LOCAL, TipoEntidade.ACONTECIMENTO,
               TipoEntidade.CONCEITO, TipoEntidade.TECNOLOGIA, TipoEntidade.FILME, TipoEntidade.SERIE, TipoEntidade.ESPECIAL,
               TipoEntidade.PESSOA, TipoEntidade.EMPRESA]


@dataclass
class Reconhecimento:
    entidades: list[No] = field(default_factory=list)
    ambiguidades: list[dict] = field(default_factory=list)  # {"trecho", "escolhida", "alternativas"}


class ResolvedorDeEntidades:
    def __init__(self, nos: list[No], apelidos_pt: dict[str, list[str]] | None = None):
        if apelidos_pt is None:
            apelidos_pt = json.loads(_APELIDOS_PT.read_text(encoding="utf-8")) if _APELIDOS_PT.exists() else {}
            apelidos_pt.pop("_sobre", None)
        self.nos = {n.chave: n for n in nos}
        self.termos: dict[str, set[str]] = {}
        for n in nos:
            if n.tipo == TipoEntidade.ACONTECIMENTO.value and ":" in n.nome:
                continue  # momentos de trajetória ("Iron Man: Suit Up") não são citados pelo nome
            for t in [n.nome, *n.apelidos, *apelidos_pt.get(n.chave, [])]:
                tn = normalizar(t)
                if len(tn) >= 3:
                    self.termos.setdefault(tn, set()).add(n.chave)

    def reconhecer(self, questao: str) -> Reconhecimento:
        q = normalizar(questao)
        quer_obra = any(p in q for p in _PALAVRAS_DE_OBRA)
        ocupado = [False] * len(q)
        r = Reconhecimento()
        escolhidas: dict[str, int] = {}
        for termo in sorted(self.termos, key=len, reverse=True):
            inicio = 0
            while (i := q.find(termo, inicio)) != -1:
                fim = i + len(termo)
                inicio = fim
                antes_ok = i == 0 or not q[i - 1].isalnum()
                depois_ok = fim == len(q) or not q[fim].isalnum()
                if not (antes_ok and depois_ok) or any(ocupado[i:fim]):
                    continue
                for j in range(i, fim):
                    ocupado[j] = True
                candidatos = [self.nos[k] for k in self.termos[termo]]
                escolha = self._escolher(candidatos, quer_obra)
                if len(candidatos) > 1:
                    r.ambiguidades.append({"trecho": questao[i:fim] if len(questao) == len(q) else termo, "escolhida": escolha.chave,
                                           "alternativas": sorted(c.chave for c in candidatos if c.chave != escolha.chave)})
                if escolha.chave not in escolhidas:
                    escolhidas[escolha.chave] = i
                    r.entidades.append(escolha)
        r.entidades.sort(key=lambda n: escolhidas[n.chave])  # na ordem em que aparecem na questão
        return r

    @staticmethod
    def _escolher(candidatos: list[No], quer_obra: bool) -> No:
        def nota(n: No):
            t = TipoEntidade(n.tipo)
            base = _PRIORIDADE.index(t) if t in _PRIORIDADE else 99
            if quer_obra and t in OBRAS:
                base -= 100
            return (base, n.chave)

        return sorted(candidatos, key=nota)[0]
