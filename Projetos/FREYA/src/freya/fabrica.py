"""Montagem dos componentes a partir da configuração.

- `servicos`: Qdrant + Elasticsearch + Neo4j (produção; docker compose up -d);
- `memoria`: Qdrant em memória + BM25 em memória + NetworkX (sem serviços; reindexa ao iniciar).
O motor usa a OpenAI se houver OPENAI_API_KEY; senão, o modo determinístico.
"""
from __future__ import annotations

from dataclasses import dataclass

from freya.config import Config
from freya.graph.armazenamento import ArmazenamentoGrafo, GrafoMemoria, GrafoNeo4j
from freya.hybrid.indices import EmbedderSentenceTransformers, IndiceElasticsearch, IndiceLexicalMemoria, IndiceQdrant
from freya.hybrid.recuperador import RecuperadorHibrido
from freya.estudo import EstudoDePersonagens
from freya.intelligence_day import IntelligenceDay
from freya.investigacao.orquestrador import Orquestrador, Repositorio
from freya.llm.cliente import ModeloDeLinguagem, ModeloOpenAI
from freya.prospectivo.motor import MotorProspectivo


@dataclass
class Componentes:
    hibrido: RecuperadorHibrido
    grafo: ArmazenamentoGrafo
    modelo: ModeloDeLinguagem | None
    orquestrador: Orquestrador
    intelligence_day: IntelligenceDay | None = None
    estudo: EstudoDePersonagens | None = None


def modelo_de(cfg: Config) -> ModeloDeLinguagem | None:
    chave = cfg.openai_api_key.get_secret_value() if cfg.openai_api_key else ""
    return ModeloOpenAI(chave, cfg.openai_model, cfg.openai_base_url) if chave else None


def montar(cfg: Config, modo: str = "servicos", embedder=None, modelo: ModeloDeLinguagem | None = None, repo: Repositorio | None = None,
           intelligence_day: bool = False) -> Componentes:
    """`intelligence_day`: liga a leitura das notícias novas durante a análise (só a API liga; os testes, não)."""
    embedder = embedder or EmbedderSentenceTransformers(cfg.embedding_model, cache="data/cache/embeddings.db")
    if modo == "servicos":
        if not cfg.neo4j_password:
            raise RuntimeError("NEO4J_PASSWORD não definida (veja .env.example).")
        hib = RecuperadorHibrido(embedder, IndiceQdrant(cfg.qdrant_url, cfg.colecao_vetorial), IndiceElasticsearch(cfg.elasticsearch_url, cfg.indice_lexical))
        grafo: ArmazenamentoGrafo = GrafoNeo4j(cfg.neo4j_uri, cfg.neo4j_user, cfg.neo4j_password.get_secret_value())
    elif modo == "memoria":
        hib = RecuperadorHibrido(embedder, IndiceQdrant(":memory:", cfg.colecao_vetorial), IndiceLexicalMemoria())
        grafo = GrafoMemoria()
    else:
        raise ValueError(f"modo desconhecido: {modo}")
    modelo = modelo if modelo is not None else modelo_de(cfg)
    intel, estudo = None, None
    if intelligence_day:  # leitura de fontes na web durante a análise (notícias e estudo de personagens)
        estudo = EstudoDePersonagens(hib, grafo)
    if intelligence_day and cfg.intelligence_day:
        intel = IntelligenceDay(hib, grafo, modelo, intervalo=cfg.coleta_intervalo, validade_horas=cfg.intelligence_day_horas,
                                maximo=cfg.intelligence_day_maximo, trechos=cfg.intelligence_day_trechos)
    orq = Orquestrador(hib, grafo, MotorProspectivo(modelo), repo or Repositorio(cfg.freya_db_path), intelligence_day=intel, estudo=estudo)
    return Componentes(hibrido=hib, grafo=grafo, modelo=modelo, orquestrador=orq, intelligence_day=intel, estudo=estudo)
