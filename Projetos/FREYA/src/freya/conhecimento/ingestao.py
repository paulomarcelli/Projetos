"""Ingestão: reúne as fontes, resolve entidades, valida e indexa nos dois mecanismos.

1. carrega a coleta oficial (data/corpus/coletado) e migra o corpus da Manus;
2. funde entidades equivalentes (resolucao.py) e descarta fatos inválidos;
3. grava o corpus unificado (data/corpus/unificado) e um relatório;
4. indexa trechos no Hybrid RAG e fatos no grafo.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from freya.conhecimento.corpus import Corpus
from freya.conhecimento.migracao_manus import migrar
from freya.conhecimento.resolucao import resolver
from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.hybrid.recuperador import RecuperadorHibrido


def unificar(pasta_dados: str | Path = "data/corpus") -> tuple[Corpus, dict]:
    p = Path(pasta_dados)
    oficial = Corpus.carregar(p / "coletado") if (p / "coletado").exists() else Corpus()
    rel: dict = {"coletado": oficial.resumo()}
    if (p / "manus_corpus.jsonl").exists():
        manus, rel_m = migrar(p / "manus_corpus.jsonl")
        rel["manus"] = {k: v for k, v in rel_m.items() if k != "problemas"}
        corpus, rel["resolucao"] = resolver(oficial, manus)
    else:
        corpus = oficial
    corpus, rel["fora_da_continuidade"] = filtrar_continuidade(corpus, p / "coletado" / "relatorio.json")
    problemas = corpus.problemas()
    for prob in problemas:  # fato com entidade ou documento ausente não entra no grafo
        fid = prob.split(": ", 1)[0]
        corpus.fatos.pop(fid, None)
    rel["fatos_descartados_na_validacao"] = problemas
    rel["unificado"] = corpus.resumo()
    return corpus, rel


def filtrar_continuidade(corpus: Corpus, relatorio_coleta: Path) -> tuple[Corpus, list[str]]:
    """Mantém só obras da cronologia oficial do MCU (a atual de marvel.com e a lista da Manus).

    marvel.com marca como "live action" também filmes da Fox (Logan, X-Men) e as séries da Netflix, que não
    estão na cronologia oficial do MCU. Essas obras saem, junto com os fatos e documentos que dependem delas.
    """
    from freya.conhecimento.ontologia import OBRAS, Predicado
    from freya.conhecimento.resolucao import variantes

    oficiais = set()
    if relatorio_coleta.exists():
        oficiais |= set(json.loads(relatorio_coleta.read_text(encoding="utf-8")).get("obras_da_cronologia_oficial", []))
    oficiais |= {f.sujeito for f in corpus.fatos.values() if f.predicado == Predicado.NA_CRONOLOGIA_OFICIAL}
    nomes_oficiais = set()
    for ch in oficiais:
        if ch in corpus.entidades:
            nomes_oficiais |= variantes(corpus.entidades[ch].nome)
    # uma temporada entra se a série está na cronologia (a página oficial costuma listar só algumas temporadas)
    series_oficiais = {re.sub(r"-\d+$", "", ch) for ch in oficiais if ch.startswith("series:")}
    fora = sorted(e.chave for e in corpus.entidades.values()
                  if e.tipo in OBRAS and e.chave not in oficiais and not (variantes(e.nome) & nomes_oficiais)
                  and re.sub(r"-\d+$", "", e.chave) not in series_oficiais)
    if not oficiais:  # sem lista oficial não há como decidir: não filtra
        return corpus, []
    excluir = set(fora)
    for ch in excluir:
        corpus.entidades.pop(ch, None)
    for fid in [fid for fid, f in corpus.fatos.items() if f.sujeito in excluir or f.objeto in excluir]:
        corpus.fatos.pop(fid)
    for did in [did for did, d in corpus.documentos.items() if d.entidade in excluir]:
        corpus.documentos.pop(did)
    return corpus, [f"{ch}" for ch in fora]


def ingerir(corpus: Corpus, hibrido: RecuperadorHibrido, grafo: ArmazenamentoGrafo) -> dict:
    return {"hybrid": hibrido.indexar(corpus), "grafo": grafo.carregar(corpus)}


def salvar_relatorio(rel: dict, caminho: str | Path) -> None:
    Path(caminho).write_text(json.dumps(rel, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
