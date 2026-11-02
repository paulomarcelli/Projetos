"""Migração do corpus da Manus (data/corpus/manus_corpus.jsonl) para o modelo da F.R.E.Y.A.

O que muda:
- identidade tipada: "Thor" personagem e "Thor" filme viram `character:thor` e `film:thor`;
- "PERSON" da Manus é separado em personagem ou pessoa real (elenco e equipe) pelo papel no fato;
- organizações em fatos de produção (ex.: Marvel Studios) viram empresa;
- predicados mapeados para a ontologia, com a direção corrigida;
- relações de distribuição ("streams on Disney+") e as que violam o domínio são descartadas, com motivo;
- a cronologia oficial vira posição (`posicao_cronologia`) em cada obra.

Nada é acrescentado: cada fato mantém a citação da Manus, o documento e a URL. Esses fatos não têm
captura de fonte (a Manus não guardou cópia), o que fica marcado em `captura_id = None`.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Documento, Entidade, Fato
from freya.conhecimento.normalizacao import chave, normalizar
from freya.conhecimento.ontologia import (
    DESCARTADOS_MANUS, MAPA_MANUS, MAPA_TIPOS_MANUS, PREDICADOS_DE_EQUIPE, Predicado, TipoEntidade, dominio_valido,
)

CRONOLOGIA = "concept:mcu-official-timeline"
_PAPEL_PESSOA_REAL = {"DIRECTED_BY": "o", "DIRECTOR_OF": "s", "DIRECTED": "s", "DIRECTS": "s", "WRITTEN_BY": "o", "WROTE": "s",
                      "SCREENPLAY_WRITER_OF": "s", "HEAD_WRITER": "s", "PRODUCED_BY": "o", "PRODUCER_OF": "s", "PORTRAYED_BY": "o",
                      "PLAYS": "s", "CAST_IN": "s", "STARS": "o", "INCLUDES": "o"}


def _tipo_da_url(url: str) -> TipoEntidade | None:
    if "/movies/" in url:
        return TipoEntidade.FILME
    if "/tv-shows/" in url:
        return TipoEntidade.SERIE
    return None


def _tipo(nome: str, tipo_manus: str, papeis_reais: set[str], em_producao: set[str]) -> TipoEntidade:
    if tipo_manus == "PERSON":
        return TipoEntidade.PESSOA if nome in papeis_reais else TipoEntidade.PERSONAGEM
    if tipo_manus == "ORG" and nome in em_producao:
        return TipoEntidade.EMPRESA
    return MAPA_TIPOS_MANUS.get(tipo_manus, TipoEntidade.CONCEITO)


def migrar(caminho: str | Path) -> tuple[Corpus, dict]:
    c, rel = Corpus(), {"apelidos": [], "descartados": Counter(), "dominio_invalido": [], "mapeados": Counter(), "relacionado_a": Counter()}
    registros = [json.loads(l) for l in Path(caminho).read_text(encoding="utf-8").splitlines() if l.strip()]
    c.adicionar_entidade(Entidade(chave=CRONOLOGIA, nome="Cronologia oficial do MCU (marvel.com)", tipo=TipoEntidade.CONCEITO))

    for r in registros:
        doc = Documento(doc_id=f"manus:{r['doc_id']}", titulo=r["title"], url=r["url"], tipo_fonte=r["source_type"],
                        lingua=r.get("language", "en"), texto=r["text"], captura_id=None, secao="corpus Manus")
        c.adicionar_documento(doc)
        tipos_manus = {e["name"]: e["type"] for e in r["entities"]}
        papeis_reais = {f[{"s": "subject", "o": "object"}[_PAPEL_PESSOA_REAL[f["predicate"]]]] for f in r["source_facts"] if f["predicate"] in _PAPEL_PESSOA_REAL}
        em_producao = {f["object"] for f in r["source_facts"] if f["predicate"] in ("PRODUCED_BY",)} | {f["subject"] for f in r["source_facts"] if f["predicate"] in ("PRODUCED", "PRODUCED_FILM")}
        eh_cronologia = r["doc_id"] == "marvel-mcu-complete-timeline-index"

        def ent(nome: str, forcar: TipoEntidade | None = None) -> str:
            t = forcar or _tipo(nome, tipos_manus.get(nome, "CONCEPT"), papeis_reais, em_producao)
            k = chave(t, nome)
            c.adicionar_entidade(Entidade(chave=k, nome=nome, tipo=t, fontes=[doc.doc_id]))
            return k

        for i, f in enumerate(r["source_facts"], 1):
            p = f["predicate"]
            if p in DESCARTADOS_MANUS:
                rel["descartados"][p] += 1
                continue
            if eh_cronologia and p == "LISTED_IN_OFFICIAL_MCU_TIMELINE":
                tipo_obra = MAPA_TIPOS_MANUS.get(tipos_manus.get(f["subject"], "FILM"), TipoEntidade.FILME)
                k = ent(f["subject"], tipo_obra if tipo_obra.obra else TipoEntidade.FILME)
                c.entidades[k].atributos["posicao_cronologia"] = i
                c.adicionar_fato(Fato(sujeito=k, predicado=Predicado.NA_CRONOLOGIA_OFICIAL, objeto=CRONOLOGIA, evidencia=f["evidence"],
                                      doc_id=doc.doc_id, url=doc.url, predicado_original=p, ordem=i))
                continue
            pred, inverter = MAPA_MANUS.get(p, (Predicado.RELACIONADO_A, False))
            # "também conhecido como" é um apelido do personagem, não uma relação com outra entidade
            if pred == Predicado.TAMBEM_CONHECIDO_COMO:
                kp = ent(f["subject"], TipoEntidade.PERSONAGEM)
                c.adicionar_entidade(Entidade(chave=kp, nome=f["subject"], tipo=TipoEntidade.PERSONAGEM, apelidos=[f["object"]], fontes=[doc.doc_id]))
                rel["apelidos"].append(f'{f["subject"]} = {f["object"]}')
                continue
            # "Nick Fury, Director of ... S.H.I.E.L.D.": cargo dentro da história, não direção de filme
            if p == "DIRECTOR_OF" and "ORG" in (tipos_manus.get(f["subject"]), tipos_manus.get(f["object"])):
                org = f["subject"] if tipos_manus.get(f["subject"]) == "ORG" else f["object"]
                lider = f["object"] if org == f["subject"] else f["subject"]
                ks, ko = ent(lider, TipoEntidade.PERSONAGEM), ent(org, TipoEntidade.ORGANIZACAO)
                c.adicionar_fato(Fato(sujeito=ks, predicado=Predicado.LIDERA, objeto=ko, evidencia=f["evidence"], doc_id=doc.doc_id, url=doc.url,
                                      predicado_original=p))
                rel["mapeados"][p] += 1
                continue
            # produção: a direção do predicado na Manus varia de fato para fato; orientamos pelo tipo (a obra é o sujeito)
            if pred in PREDICADOS_DE_EQUIPE or pred == Predicado.ELENCO_DE:
                a, b = f["subject"], f["object"]
                # os créditos de uma página são sempre da obra daquela página
                if _tipo_da_url(r["url"]) and a != r["title"] and b != r["title"]:
                    pessoa_nome = a if tipos_manus.get(a) == "PERSON" and tipos_manus.get(b) != "PERSON" else b
                    obra_nome = r["title"]
                else:
                    obra_nome = a if (a == r["title"] or tipos_manus.get(a) in ("FILM", "SERIES", "SPECIAL")) else b
                    pessoa_nome = b if obra_nome == a else a
                if tipos_manus.get(pessoa_nome) == "ORG":
                    kp_tipo = TipoEntidade.EMPRESA
                else:
                    kp_tipo = TipoEntidade.PESSOA
                ko_obra = ent(obra_nome, tipo_doc if (tipo_doc := _tipo_da_url(r["url"])) else None)
                kp = ent(pessoa_nome, kp_tipo)
                if pred == Predicado.ELENCO_DE:
                    ks, ko = kp, ko_obra
                else:
                    ks, ko = ko_obra, kp
                ts, to = c.entidades[ks].tipo, c.entidades[ko].tipo
            else:
                s_nome, o_nome = (f["object"], f["subject"]) if inverter else (f["subject"], f["object"])
                ks, ko = ent(s_nome), ent(o_nome)
                ts, to = c.entidades[ks].tipo, c.entidades[ko].tipo
                # "obra FOLLOWS personagem" (Moon Knight acompanha Steven Grant) é aparição, não sequência
                if pred == Predicado.SEQUENCIA_DE and ts.obra and not to.obra:
                    pred, ks, ko, ts, to = Predicado.APARECE_EM, ko, ks, to, ts
                # personagem marcado como obra pela Manus num fato narrativo (ex.: "Thor SON_OF Odin" no doc do filme)
                if pred not in (Predicado.SEQUENCIA_DE, Predicado.NA_CRONOLOGIA_OFICIAL, Predicado.LOCALIZADO_EM, Predicado.APARECE_EM) and ts.obra:
                    ks, ts = ent(s_nome, TipoEntidade.PERSONAGEM), TipoEntidade.PERSONAGEM
                if pred == Predicado.APARECE_EM and not to.obra and ts.obra:
                    ks, ko, ts, to = ko, ks, to, ts
            if not dominio_valido(pred, ts, to):
                rel["dominio_invalido"].append(f'{f["subject"]} -{p}-> {f["object"]} ({ts.value} → {to.value})')
                continue
            if ks == ko:
                continue
            if pred == Predicado.RELACIONADO_A:
                rel["relacionado_a"][p] += 1
            else:
                rel["mapeados"][p] += 1
            c.adicionar_fato(Fato(sujeito=ks, predicado=pred, objeto=ko, evidencia=f["evidence"], doc_id=doc.doc_id, url=doc.url,
                                  predicado_original=p))

    # entidades citadas só na lista de entidades (sem fato) entram também: são menções reais do documento
    rel = {k: (dict(v) if isinstance(v, Counter) else v) for k, v in rel.items()}
    rel["resumo"] = c.resumo()
    rel["problemas"] = c.problemas()
    return c, rel


def nomes_equivalentes(nome: str) -> set[str]:
    """Variações seguras de um nome para casar com a coleta oficial (honoríficos e artigos)."""
    n = normalizar(nome)
    formas = {n}
    for prefixo in ("dr. ", "doctor ", "the ", "marvel's ", "marvel studios' "):
        if n.startswith(prefixo):
            formas.add(n[len(prefixo):])
    return formas
