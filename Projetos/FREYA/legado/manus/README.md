# MCU Knowledge Engine — Hybrid RAG + GraphRAG

Dois mecanismos independentes de recuperação documental para continuidade cinematográfica MCU. Não inclui interface, chatbot, API REST, autenticação ou funcionalidades fora do escopo. O corpus inicial contém exclusivamente páginas oficiais Marvel; quadrinhos não são ingeridos.

## Componentes

- **Hybrid RAG:** chunking com sobreposição, embeddings multilíngues, Qdrant (cosseno), Elasticsearch BM25 e fusão Reciprocal Rank Fusion (`1/(k + rank)`). Cada resultado mantém `doc_id`, `chunk_id`, título, URL, tipo da fonte e continuidade.
- **GraphRAG:** relações estruturadas com LLM a partir das fontes e citações literais verificadas no Neo4j; fatos sem evidência no texto/chunk são descartados. Resolução por menção exata e aliases definidos; expansão de caminhos até dois saltos; cada aresta leva URL, ID do documento e chunk.

A LLM não é autorizada a criar elos sem evidência rastreável. Pergunta sem entidade reconhecida retorna grafo vazio. O modelo de embedding padrão é `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, para consultas em português e inglês. O LLM selecionado por `LLM_MODEL` deve suportar JSON mode; chave e endpoint só são necessários quando o corpus inclui documentos sem triplas curadas. Embeddings são baixados localmente.

## Executar

Requer Python 3.11+ e Docker Compose v2. Na pasta do projeto:

```bash
sudo docker compose up -d
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# O corpus fornecido já tem relações extraídas e evidências verificáveis; não exige chave LLM para reindexar.
# Para ingerir registros novos sem source_facts, configure OPENAI_API_KEY,
# OPENAI_BASE_URL (ou OPENAI_API_BASE) e LLM_MODEL compatível com JSON mode.
export PYTHONPATH=src
python -m marvel_rag.cli ingest --corpus data/corpus.jsonl
```

Configuração padrão dos serviços: Qdrant `localhost:6333`, Elasticsearch `localhost:9200`, Neo4j `bolt://localhost:7687` (usuário `neo4j`, senha de desenvolvimento `REMOVIDA-DA-COPIA`). O Compose usa rede host para funcionar também em ambientes que bloqueiam iptables/Docker bridge; os processos nos containers escutam nas portas locais padrão. Configure em ambientes reais via `QDRANT_URL`, `ELASTICSEARCH_URL`, `NEO4J_URI`, `NEO4J_USER` e `NEO4J_PASSWORD`. Senhas declaradas no Compose são apenas para desenvolvimento e devem ser substituídas antes de qualquer implantação.

Consultas independentes:

```bash
python -m marvel_rag.cli hybrid "O que Thanos fez antes de Avengers: Endgame?"
python -m marvel_rag.cli graph "Qual conexão explícita existe entre Loki e o Tesseract em The Avengers?"
```

## Cobertura e rastreabilidade

`data/corpus.jsonl` contém 36 páginas oficiais individuais de filmes e séries, com resumos em português e trechos curtos da página de origem, mais a cronologia oficial Marvel que lista 81 títulos/temporadas em ordem. As relações curadas incluem citações curtas, entidades e URL da fonte. A continuidade é MCU; quadrinhos e wikis não foram usados como corpus.

Isso amplia a cobertura, mas **não é tudo sobre o MCU**: não inclui todas as páginas de personagens, cada temporada/episódio, roteiros integrais, diálogos nem todas as relações do universo. Títulos presentes somente no índice oficial de cronologia estão identificados como títulos listados, sem sinopse detalhada própria. Essa distinção evita apresentar cobertura parcial como enciclopédia completa.

## Demonstração executada

Ingestão real concluída: 37 registros produziram 39 chunks em Qdrant e Elasticsearch; Neo4j contém 236 entidades e 269 relações únicas. Auditoria confirmou URL e evidência no chunk de origem em todas as arestas (`0` erros). Testes automatizados: `6 passed`.

1. Hybrid: `python -m marvel_rag.cli hybrid "O que Tony Stark constrói e como ele escapa?"` colocou `marvel-iron-man:0` em primeiro lugar, com a evidência curta “Tony builds a high-tech suit of armor and escapes captivity”, URL `https://www.marvel.com/movies/iron-man` e score RRF. O segundo resultado foi a página de *Iron Man 2*.
2. Graph: `python -m marvel_rag.cli graph "Qual relação explícita existe entre Loki e o Tesseract em The Avengers?"` identificou Loki (PERSON), Tesseract (ARTIFACT) e o filme *The Avengers*, e retornou `Loki — GAINS_ACCESS_TO → Tesseract`. Evidência: “Loki, gains access to the unlimited power of the energy cube called the Tesseract”. Fonte: `https://www.marvel.com/movies/the-avengers`.
3. Graph relacional: `python -m marvel_rag.cli graph "Quem compartilha o corpo com Marc Spector?"` retornou `Steven Grant — SHARES_BODY_WITH → Marc Spector`, com evidência “shares a body with mercenary Marc Spector” e referência `https://www.marvel.com/tv-shows/moon-knight/1`.

## Reindexação

Cada ingestão reconstrói Qdrant, Elasticsearch e os nós MCU do Neo4j a partir de `data/corpus.jsonl`; isso remove chunks e arestas obsoletos. Não misture dados de outras continuidades no mesmo grafo sem a devida identificação de continuidade.
