"""Linha de comando da F.R.E.Y.A.

    freya coletar [--limite 450]          coleta páginas oficiais de marvel.com (lenta; respeita robots.txt)
    freya ingerir [--modo servicos]       unifica fontes, valida e indexa (Qdrant, Elasticsearch, Neo4j)
    freya preparar                        servidor: coleta marvel.com se faltar e indexa só se a base mudou
    freya investigar "questão" [--horizonte ...] [--modo memoria]
    freya servir [--modo servicos] [--host 127.0.0.1] [--porta 8000] [--preparar]
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
    c.add_argument("--limite", type=int, default=600)
    c.add_argument("--recoletar", action="store_true")
    ap = sub.add_parser("aprofundar", help="wiki do MCU (personagens e obras) e extração de relações dos enredos")
    ap.add_argument("--sem-extracao", action="store_true", help="não chama o modelo para extrair relações dos enredos")
    pr = sub.add_parser("preparar", help="servidor: deixa o Hybrid RAG e o GraphRAG prontos (idempotente)")
    pr.add_argument("--sem-coleta", action="store_true", help="falha em vez de coletar marvel.com quando faltar")
    i = sub.add_parser("ingerir")
    i.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    q = sub.add_parser("investigar")
    q.add_argument("questao")
    q.add_argument("--horizonte")
    q.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    s = sub.add_parser("servir")
    s.add_argument("--modo", choices=["servicos", "memoria"], default="servicos")
    s.add_argument("--host", default=None, help="padrão: FREYA_HOST ou 127.0.0.1 (no contêiner, 0.0.0.0)")
    s.add_argument("--porta", type=int, default=8000)
    s.add_argument("--preparar", action="store_true", help="roda `preparar` antes de abrir a API")
    a = p.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    for ruidoso in ("neo4j", "httpx", "elastic_transport", "sentence_transformers"):
        logging.getLogger(ruidoso).setLevel(logging.WARNING)
    cfg = config()

    if a.cmd == "coletar":
        from pathlib import Path

        from freya.implantacao import coletar_marvel

        rel = coletar_marvel(cfg, Path("data/corpus"), limite=a.limite, recoletar=a.recoletar)
        print(json.dumps(rel, ensure_ascii=False, indent=1)[:4000])
        return 0

    if a.cmd == "aprofundar":
        from freya.conhecimento.coleta.aprofundar_wiki import aprofundar, aprofundar_obras, mapa_de_titulos
        from freya.conhecimento.coleta.wiki_mcu import ClienteWiki
        from freya.conhecimento.corpus import Corpus
        from freya.conhecimento.extracao import extrair
        from freya.conhecimento.ingestao import salvar_relatorio
        from freya.fabrica import modelo_de

        oficial = Corpus.carregar("data/corpus/coletado")
        rel_coleta = json.loads(open("data/corpus/coletado/relatorio.json", encoding="utf-8").read())
        cliente = ClienteWiki()
        wiki, rel = aprofundar(oficial, cliente)
        obras, rel["obras"] = aprofundar_obras(oficial, cliente, rel_coleta.get("obras_da_cronologia_oficial", []), mapa_de_titulos(oficial, wiki))
        wiki.unir(obras)
        wiki.salvar("data/corpus/wiki")
        modelo = modelo_de(cfg)
        if not a.sem_extracao and modelo is not None:
            base = Corpus().unir(oficial).unir(wiki)
            enredos = [d for d in wiki.documentos.values() if d.secao == "plot"]
            fatos, rel["extracao"] = extrair(base, enredos, modelo)
            extraido = Corpus()
            for d in enredos:
                extraido.adicionar_documento(d)
            for f in fatos:
                extraido.adicionar_fato(f)
            for ch in {x for f in fatos for x in (f.sujeito, f.objeto)}:
                extraido.adicionar_entidade(base.entidades[ch])
            extraido.salvar("data/corpus/extraido")
        salvar_relatorio(rel, "data/corpus/wiki/relatorio.json")
        print(json.dumps({k: v for k, v in rel.items() if k not in ("nao_encontradas",)}, ensure_ascii=False, indent=1, default=str)[:3000])
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

    if a.cmd == "preparar":
        from freya.implantacao import preparar_base

        print(json.dumps(preparar_base(cfg, montar(cfg, "servicos"), coletar_se_faltar=not a.sem_coleta), ensure_ascii=False, indent=1))
        return 0
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

        if a.preparar and a.modo == "servicos":
            from freya.implantacao import preparar_base

            comp = montar(cfg, "servicos")
            preparar_base(cfg, comp)
        else:
            comp = preparar(a.modo, sempre_indexar=False)
        uvicorn.run(criar_app(comp, origens=cfg.cors_origens_lista), host=a.host or cfg.freya_host, port=a.porta)
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
