"""Linha de comando da F.R.E.Y.A.

    freya coletar [--limite 450]          coleta páginas oficiais de marvel.com (lenta; respeita robots.txt)
    freya ingerir [--modo servicos]       unifica fontes, valida e indexa (Qdrant, Elasticsearch, Neo4j)
    freya investigar "questão" [--horizonte ...] [--modo memoria]
    freya servir [--modo servicos] [--porta 8000]
"""
from __future__ import annotations

import argparse
import json
import logging
import sys

from freya.config import config


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="freya", description="F.R.E.Y.A. — inteligência prospectiva sobre o MCU")
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("coletar")
    c.add_argument("--limite", type=int, default=450)
    c.add_argument("--recoletar", action="store_true")
    i = sub.add_parser("ingerir")
    i.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    q = sub.add_parser("investigar")
    q.add_argument("questao")
    q.add_argument("--horizonte")
    q.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    s = sub.add_parser("servir")
    s.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    s.add_argument("--porta", type=int, default=8000)
    a = p.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    for ruidoso in ("neo4j", "httpx", "elastic_transport", "sentence_transformers"):
        logging.getLogger(ruidoso).setLevel(logging.WARNING)
    cfg = config()

    if a.cmd == "coletar":
        from freya.conhecimento.coleta.coletor import Coletor

        col = Coletor(intervalo=cfg.coleta_intervalo)
        col.carregar_robots()
        corpus, rel = col.coletar(col.obras_da_cronologia(), limite=a.limite, recoletar=a.recoletar)
        corpus.salvar("data/corpus/coletado")
        rel["resumo"] = corpus.resumo()
        print(json.dumps(rel, ensure_ascii=False, indent=1)[:4000])
        return 0

    from freya.conhecimento.ingestao import ingerir, salvar_relatorio, unificar
    from freya.fabrica import montar

    def preparar(modo: str, sempre_indexar: bool):
        comp = montar(cfg, modo)
        if modo == "memoria" or sempre_indexar:
            corpus, rel = unificar()
            corpus.salvar("data/corpus/unificado")
            rel["indexacao"] = ingerir(corpus, comp.hibrido, comp.grafo)
            salvar_relatorio(rel, "data/corpus/unificado/relatorio.json")
            logging.info("indexado: %s", rel["indexacao"])
        return comp

    if a.cmd == "ingerir":
        preparar(a.modo, sempre_indexar=True)
        return 0
    if a.cmd == "investigar":
        comp = preparar(a.modo, sempre_indexar=False)
        orq = comp.orquestrador
        inv = orq.executar(orq.criar(a.questao, a.horizonte).id)
        print(json.dumps(inv.model_dump(mode="json", exclude={"grafo", "registro"}), ensure_ascii=False, indent=1))
        return 0 if inv.estado.value == "concluida" else 1
    if a.cmd == "servir":
        import uvicorn

        from freya.api.app import criar_app

        uvicorn.run(criar_app(preparar(a.modo, sempre_indexar=False)), host="127.0.0.1", port=a.porta)
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
