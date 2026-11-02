# Arquitetura consolidada da F.R.E.Y.A.

F.R.E.Y.A. recebe uma questão de investigação sobre o MCU e devolve **uma análise prospectiva
estruturada** e o **grafo** das entidades e relações que a sustentam. Não há outro produto.

## Visão geral

```
                    questão de investigação
                              │
                     ┌────────▼────────┐
                     │  Orquestrador   │  investigacao/  (fluxo, estados, erros, persistência)
                     └──┬──────────┬───┘
          ┌─────────────▼──┐   ┌───▼──────────────┐
          │  A. Hybrid RAG │   │   B. GraphRAG    │
          │ Qdrant + BM25  │   │ Neo4j: entidades,│
          │ + RRF          │   │ relações, caminhos│
          └─────────────┬──┘   └───┬──────────────┘
                        └────┬─────┘
                  ┌──────────▼───────────┐
                  │ Registro de evidências│  cada trecho e cada aresta com id, fonte, data
                  └──────────┬───────────┘
                  ┌──────────▼───────────┐
                  │ C. Motor prospectivo │  variáveis → relações sistêmicas → sinais →
                  │                      │  incertezas → desdobramentos → cenários
                  └──────────┬───────────┘
                  ┌──────────▼───────────┐
                  │  Validador           │  rejeita afirmação sem evidência; marca
                  │                      │  confirmado / inferência / hipótese
                  └──────────┬───────────┘
               análise prospectiva  +  grafo da investigação (nós, arestas, evidências, sequência)
```

## Módulos (Python 3.11+)

```
freya/
  conhecimento/   corpus, esquema, ontologia de tipos e predicados, apelidos, captura de fontes
  hybrid/         chunking, embeddings, Qdrant, Elasticsearch BM25, fusão RRF   (código da Manus, corrigido)
  graph/          ingestão no Neo4j, resolução de entidades, consultas de vizinhança e caminhos
  evidencias/     registro de evidências (o elo comum entre os três mecanismos)
  prospectivo/    etapas do motor, tipos epistêmicos, cenários, validador
  grafo_visual/   montagem do grafo da investigação para o frontend futuro
  investigacao/   orquestrador, estados, persistência
  api/            FastAPI: criar investigação, ler resultado, ler/expandir grafo, caminho entre nós
  llm/            interface única de modelo (OpenAI-compatível) + dublê determinístico para testes
tests/            unidade (dublês) e integração (serviços reais via Docker Compose)
```

Cada mecanismo é um pacote com interface própria (`HybridRetriever`, `GraphRetriever`,
`ProspectiveEngine`), trocável sem tocar nos outros. O orquestrador só conhece as interfaces.

## A. Hybrid RAG

Mantém Qdrant + Elasticsearch + RRF da Manus, com estas mudanças:
- chunking por sentenças com sobreposição, tamanho em tokens explícito;
- BM25 com dois campos (analisador `english` e `portuguese`) e consulta nos dois;
- reserva de candidatos `k × 8` em cada lista antes da fusão; dedupe por documento;
- filtro obrigatório `continuity = MCU`;
- upsert em lote; reindexação incremental por hash do documento.

## B. GraphRAG

- **Identidade:** chave = `tipo:slug` (`character:thor`, `film:thor`). Nós com rótulos por tipo
  (`Character`, `Organization`, `Film`, `Series`, `Event`, `Location`, `Artifact`, `Technology`,
  `Person` para elenco e equipe) e o rótulo comum `Entity`.
- **Identidades de personagem:** `(:Character {Steve Rogers})-[:HAS_ALIAS]->` apelidos; um personagem
  com vários codinomes é um nó só.
- **Ontologia de predicados** com direção fixa (ex.: `MEMBER_OF`, `LEADS`, `ALLY_OF`, `OPPOSES`,
  `FAMILY_OF`, `POSSESSES`, `USES`, `CREATED`, `LOCATED_IN`, `PARTICIPATES_IN`, `APPEARS_IN`,
  `PORTRAYED_BY`, `DIRECTED_BY`). Os predicados atuais são mapeados para ela; o que não mapeia fica
  registrado como `RELATED_TO` com o predicado original.
- **Tempo:** filmes e séries com ano de lançamento e posição na cronologia oficial; arestas herdam a
  obra de origem, o que permite ordenar a trajetória de um personagem.
- **Consultas:** vizinhança ponderada, caminhos mais curtos entre entidades (até 4 saltos), subgrafo
  de uma investigação. Sem caminho, a resposta diz que não há.
- **Rastreabilidade:** toda aresta guarda citação, URL, `doc_id`, `chunk_id` e o id da captura.

## C. Motor prospectivo

Etapas, cada uma com entrada e saída tipadas:
1. **Enquadramento:** tema, entidades focais e horizonte (dentro da continuidade MCU).
2. **Recuperação:** hybrid + grafo em paralelo; resultados entram no registro de evidências.
3. **Variáveis:** fatores que podem mudar o desfecho, cada um ligado a evidências.
4. **Relações sistêmicas:** como as variáveis se influenciam, apoiadas em caminhos do grafo.
5. **Tendências e sinais:** o que as evidências mostram em movimento (usando a ordem temporal).
6. **Incertezas críticas:** variáveis de alto impacto e baixa determinação.
7. **Desdobramentos e consequências** diretas e indiretas.
8. **Cenários:** construídos a partir das incertezas críticas, cada um com lógica, premissas,
   consequências, sinais de confirmação e evidências.

Cada afirmação carrega `tipo` (`confirmado`, `inferencia`, `hipotese`) e `evidencias` (ids do
registro). O **validador** recusa afirmação "confirmada" sem evidência e rebaixa ou descarta o resto.
O LLM escreve e organiza; ele nunca cria entidade ou relação que não esteja no registro.

## Grafo dinâmico (contrato para o frontend)

`GET /investigacoes/{id}/grafo` devolve:
- `nodes`: id, rótulo, tipo, relevância (0–1), papel na análise (focal, contexto), evidências;
- `edges`: id, origem, destino, predicado, direção, tipo epistêmico, peso, evidências;
- `evidence`: citação, URL, documento, chunk, data da captura;
- `sequence`: ordem de revelação (passos) para animar a propagação a partir das entidades focais;
- `paths`: caminhos destacados que sustentam cada cenário;
- `legend`: tipos de nó e de relação presentes.

Também: `POST .../grafo/expandir` (vizinhos de um nó, paginados) e `GET .../grafo/caminho?de=&para=`.

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| Manter Qdrant, Elasticsearch e Neo4j | Funcionam, são a escolha da Manus e servem à escala; trocar não traz ganho |
| FastAPI | Contrato tipado (Pydantic) que o frontend consome; documentação automática |
| Investigação assíncrona (criar → acompanhar → ler) | A análise leva segundos; o frontend acompanha o andamento |
| SQLite para investigações (PostgreSQL configurável) | Persistência simples sem novo serviço; a análise é um documento JSON |
| LLM atrás de interface única e dublê determinístico nos testes | Testes sem custo; troca de provedor sem tocar no motor |
| Registro de evidências como peça central | É o que liga recuperação, motor e grafo e garante a rastreabilidade |
