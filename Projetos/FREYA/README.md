# F.R.E.Y.A. — Marvel Knowledge Engine

Inteligência prospectiva sobre o Universo Cinematográfico Marvel (MCU). Recebe um tema, acontecimento ou
questão de investigação e devolve **uma análise prospectiva estruturada** e o **grafo** das entidades e
relações que a sustentam. Não é um chatbot: não conversa, não guarda histórico de mensagens, não responde
perguntas livres.

```
questão ─► Hybrid RAG (Qdrant + BM25 + RRF) ─┐
        └► GraphRAG (Neo4j)  ────────────────┼─► registro de evidências ─► motor prospectivo ─► validador
                                             │                                     │
                                             └──────────────── grafo da investigação (nós, arestas, evidências, animação)
```

- **Hybrid RAG:** busca vetorial (embedding multilíngue, Qdrant) + BM25 (Elasticsearch, analisadores pt/en),
  fundidas por Reciprocal Rank Fusion. Cada trecho mantém documento, URL e captura da fonte.
- **GraphRAG:** grafo tipado no Neo4j (personagens, organizações, acontecimentos, locais, artefatos,
  tecnologias, obras, pessoas reais). Toda aresta guarda a evidência literal e a fonte. Recupera vizinhança,
  caminhos reais entre entidades e a trajetória de cada personagem (momentos e aparições por ano).
- **Motor prospectivo:** monta um dossiê (pontes, tensões, centralidade, trajetórias, lacunas) e sintetiza
  contexto, atores, relações sistêmicas, variáveis, tendências, incertezas críticas, desdobramentos e cenários.
  Cada afirmação é `confirmado`, `inferencia` ou `hipotese` e cita evidências; o validador recusa o que não
  se sustenta.

A arquitetura completa está em [docs/ARQUITETURA.md](docs/ARQUITETURA.md) e a auditoria da versão anterior
(Manus) em [docs/AUDITORIA.md](docs/AUDITORIA.md). O relatório desta entrega está em
[docs/RELATORIO.md](docs/RELATORIO.md).

## Requisitos

- Python 3.11+
- Docker Compose v2 (Qdrant, Elasticsearch, Neo4j)
- Opcional: chave da OpenAI para o motor prospectivo (sem ela, o motor roda no modo determinístico)

## Instalação

```bash
cp .env.example .env            # defina NEO4J_PASSWORD (e OPENAI_API_KEY, se tiver)
docker compose up -d
python -m venv .venv && source .venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu   # opcional: torch só para CPU, mais leve
pip install -e '.[dev]'
```

O modelo de embedding (`paraphrase-multilingual-MiniLM-L12-v2`, ~470 MB) é baixado na primeira indexação.

## Base de conhecimento

Duas fontes, ambas da continuidade cinematográfica:

1. **Coleta oficial de marvel.com** (`freya coletar`): páginas de filmes, séries e perfis *on-screen* de
   personagens, partindo da cronologia oficial do MCU. Lê só os blocos `live_action` (os de quadrinhos são
   descartados e contados). Respeita o `robots.txt`, espera 2 s entre requisições, identifica-se como
   F.R.E.Y.A. e guarda uma cópia de cada página em `data/raw/` (com data e hash) para conferir as evidências.
   **O conteúdo coletado fica só na sua máquina** (`data/raw/` e `data/corpus/coletado/` estão no `.gitignore`):
   os Termos de Uso da Marvel não permitem redistribuí-lo.
2. **Corpus da Manus** (`data/corpus/manus_corpus.jsonl`): 37 páginas oficiais resumidas, migradas para o
   modelo novo (identidades tipadas, predicados normalizados, direção corrigida).

```bash
freya coletar --limite 450      # ~45 min; retoma de onde parou
freya ingerir                   # unifica, resolve entidades, valida e indexa nos três serviços
```

`freya ingerir` grava `data/corpus/unificado/` e `relatorio.json` (entidades fundidas, nomes ambíguos,
fatos descartados e por quê).

## Uso

```bash
freya investigar "Qual o futuro dos Vingadores depois de Thanos?" --horizonte "após Avengers: Endgame"
freya servir                     # API em http://127.0.0.1:8000 (documentação em /docs)
```

Sem os serviços, use `--modo memoria` (indexa em memória a cada execução).

### API

| Método | Rota | O que faz |
|---|---|---|
| POST | `/investigacoes` | cria uma investigação `{questao, horizonte?}` e a executa em segundo plano |
| GET | `/investigacoes/{id}` | estado, etapas, análise prospectiva e evidências |
| GET | `/investigacoes/{id}/grafo` | grafo da investigação (contrato abaixo) |
| GET | `/investigacoes/{id}/grafo/expandir?no=` | vizinhos de um nó, com evidências |
| GET | `/investigacoes/{id}/grafo/caminho?de=&para=` | caminhos entre dois nós (`existe: false` se não houver) |
| GET | `/investigacoes/{id}/evidencias/{eid}` | uma evidência e sua fonte |
| GET | `/saude` | modo do motor e armazenamento do grafo |

### Grafo para o frontend

`GET /investigacoes/{id}/grafo` devolve a estrutura que um frontend desenha e anima (não é imagem):

- `nos`: `id`, `rotulo`, `tipo`, `papel` (`focal`, `ponte`, `trajetoria`, `contexto`), `relevancia` (0–1), `grau`, `cenarios`
- `arestas`: `origem`, `destino`, `predicado`, `rotulo` (pt), `dirigida`, `tipo_epistemico`, `peso`, `evidencias`, `ordem`, `ano`, `em_caminhos`, `cenarios`
- `evidencias`: texto literal ou campo da página, URL, documento, captura
- `sequencia`: passos de revelação (focais → caminhos → relações diretas → trajetórias → contexto)
- `caminhos`: caminhos entre as entidades focais, para destacar
- `cenarios`: nós e arestas que cada cenário mobiliza
- `legenda`: tipos de nó e de relação presentes, com rótulos em português

## Testes

```bash
pytest                          # unidade: sem serviços e sem chamadas pagas (modelo simulado)
pytest -m integracao            # integração: precisa de docker compose up -d e NEO4J_PASSWORD
```

Os testes do motor, do grafo e da API usam um corpus sintético (entidades fictícias Alfa, Beta, Gama):
nenhum fato do MCU é inventado nos testes. Os testes do leitor de marvel.com usam trechos reais capturados.

## Estrutura

```
src/freya/
  conhecimento/   ontologia, modelos, corpus, migração da Manus, resolução de entidades, ingestão
    coleta/       coletor de marvel.com e leitor das páginas (só live_action)
  hybrid/         chunking, índices (Qdrant, Elasticsearch, memória), recuperador com RRF
  graph/          armazenamento (Neo4j, NetworkX), reconhecimento de entidades, recuperador
  evidencias/     registro de evidências (ids E1, E2… compartilhados pelos três mecanismos)
  llm/            interface com o modelo (OpenAI) e modelo simulado
  prospectivo/    modelos da análise, motor, validador epistêmico
  grafo_visual/   grafo da investigação para o frontend
  investigacao/   orquestrador e persistência (SQLite)
  api/            FastAPI
legado/manus/     entrega original da Manus, preservada para referência
```

## Segurança e procedência

- Nenhum segredo no código: tudo vem do `.env` (fora do git). `NEO4J_PASSWORD` é obrigatória.
- Só continuidade MCU: o corpus recusa documentos de outra continuidade e o leitor descarta blocos de quadrinhos.
- Toda relação no grafo tem evidência literal e fonte; o motor só cita evidências do registro.
