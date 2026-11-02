"""Preparação da base num servidor: a F.R.E.Y.A. sobe já com o Hybrid RAG e o GraphRAG carregados.

O repositório traz os corpora da wiki do MCU (CC BY-SA). Os dados de marvel.com não podem ser
redistribuídos, então o próprio servidor os coleta na primeira vez (respeitando o robots.txt). Depois disso:

1. se a pasta `coletado/` não existe, coleta marvel.com;
2. calcula uma assinatura dos corpora de entrada;
3. se a assinatura é a mesma da última indexação e os três serviços têm dados, não faz nada;
4. senão, unifica, valida e indexa no Qdrant, no Elasticsearch e no Neo4j, e grava a assinatura.

Reiniciar o servidor não reindexa; atualizar um corpus no repositório reindexa sozinho.
"""
from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

from freya.config import Config

log = logging.getLogger(__name__)

_ENTRADAS = ("coletado", "wiki", "extraido", "wikipedia", "manus_corpus.jsonl")


def coletar_marvel(cfg: Config, pasta: Path, limite: int = 600, recoletar: bool = False) -> dict:
    from freya.conhecimento.coleta.coletor import Coletor

    col = Coletor(intervalo=cfg.coleta_intervalo)
    col.carregar_robots()
    corpus, rel = col.coletar(col.obras_da_cronologia() + col.perfis_do_sitemap(), limite=limite, recoletar=recoletar)
    if not corpus.documentos:  # bloqueio ou falha de rede: não grava nada, e a próxima subida tenta de novo
        raise RuntimeError("marvel.com não devolveu nenhuma página; a base não foi indexada. Veja os avisos HTTP acima.")
    corpus.salvar(pasta / "coletado")
    rel["resumo"] = corpus.resumo()
    return rel


def assinatura(pasta: Path) -> str:
    h = hashlib.sha256()
    for nome in _ENTRADAS:
        alvo = pasta / nome
        arquivos = sorted(alvo.rglob("*")) if alvo.is_dir() else [alvo]
        for f in arquivos:
            if f.is_file() and f.name != "relatorio.json":
                h.update(str(f.relative_to(pasta)).encode())
                h.update(f.read_bytes())
    return h.hexdigest()


def contagens(comp) -> dict:
    """Quantos itens cada serviço tem. Componentes sem `contar` (modo memória) valem 0."""
    def n(obj) -> int:
        return obj.contar() if hasattr(obj, "contar") else 0

    return {"vetorial": n(comp.hibrido.vetorial), "lexical": n(comp.hibrido.lexical), "grafo": n(comp.grafo)}


def preparar_base(cfg: Config, comp, pasta: str | Path = "data/corpus", coletar_se_faltar: bool = True) -> dict:
    from freya.conhecimento.ingestao import ingerir, salvar_relatorio, unificar

    pasta = Path(pasta)
    marca = _marca(cfg)
    if not (pasta / "coletado" / "documentos.jsonl").exists():
        if not coletar_se_faltar:
            raise RuntimeError("faltam os dados de marvel.com (data/corpus/coletado); rode `freya coletar`.")
        log.info("primeira execução: coletando marvel.com (alguns minutos; 2 s entre páginas)")
        coletar_marvel(cfg, pasta)
    atual = assinatura(pasta)
    antes = json.loads(marca.read_text(encoding="utf-8")) if marca.exists() else {}
    tem = contagens(comp)
    if antes.get("assinatura") == atual and all(tem.values()):
        log.info("base já indexada: %s", tem)
        return {"acao": "nenhuma", "contagens": tem}
    log.info("indexando a base (corpora mudaram ou serviços vazios)")
    corpus, rel = unificar(pasta)
    corpus.salvar(pasta / "unificado")
    rel["indexacao"] = ingerir(corpus, comp.hibrido, comp.grafo)
    salvar_relatorio(rel, pasta / "unificado" / "relatorio.json")
    marca.parent.mkdir(parents=True, exist_ok=True)
    marca.write_text(json.dumps({"assinatura": atual, "indexacao": rel["indexacao"]}, ensure_ascii=False, indent=1), encoding="utf-8")
    return {"acao": "indexada", "indexacao": rel["indexacao"]}


def _marca(cfg: Config) -> Path:
    """Fica ao lado do banco das investigações, que no contêiner é um volume persistente."""
    return Path(cfg.freya_db_path).parent / "base_indexada.json"


def estado_da_base(cfg: Config) -> dict | None:
    marca = _marca(cfg)
    return json.loads(marca.read_text(encoding="utf-8")).get("indexacao") if marca.exists() else None
