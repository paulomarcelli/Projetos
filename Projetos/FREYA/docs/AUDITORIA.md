# Auditoria técnica do Marvel Knowledge Engine (entrega da Manus)

Data: 2 nov. 2026. Material auditado: `marvel-knowledge-engine.zip` (11 arquivos, ~500 linhas).

Método: leitura integral do código, do corpus e das evidências; simulação da ingestão sem serviços;
execução real da pilha entregue (Qdrant 1.13.2, Elasticsearch 8.17.2, Neo4j 5.26 via Docker Compose),
ingestão do corpus, testes automatizados e consultas de prova; conferência de citações em marvel.com.

## 1. Resumo

A Manus entregou dois mecanismos de recuperação **funcionais e honestos em escopo**: a busca híbrida
(Qdrant + BM25 + RRF) roda e devolve fontes; o grafo só persiste relações cuja citação aparece no
texto de origem. O README não exagera a cobertura e reproduzi os números declarados (37 registros,
39 chunks, 236 entidades, 269 relações, 6 testes passando).

Mas o que existe é uma **prova de conceito**, não a base de uma inteligência prospectiva:

- a base de conhecimento tem 36 resumos de ~100 palavras e cobre só a superfície do MCU;
- o grafo tem um defeito estrutural de identidade (personagem e filme com o mesmo nome viram um nó só);
- 70% das relações são catálogo (lista da cronologia, direção, roteiro, elenco), não o universo narrativo;
- não há dimensão temporal, ontologia de relações, captura das fontes, nem motor prospectivo,
  orquestração, API ou dados para o grafo visual.

## 2. Base de conhecimento

| Item | Situação | Evidência |
|---|---|---|
| Fontes oficiais, continuidade MCU separada dos quadrinhos | **Completo** | 37/37 registros `continuity: MCU`, URLs `marvel.com`; nenhum quadrinho ou wiki |
| Títulos (filmes e séries) | **Parcial** | 36 de 81 títulos têm página própria; os outros 45 aparecem só como nome na lista da cronologia |
| Conteúdo de cada título | **Insuficiente** | 450–930 caracteres por título: um parágrafo parafraseado + 3 a 9 trechos curtos |
| Personagens e identidades | **Parcial / com erro** | Nenhuma página de personagem. Identidades aparecem só de passagem (4 `ALSO_KNOWN_AS`). Ausentes: Peter Parker/Spider-Man, Hydra, Kang, TVA, Joias individuais |
| Organizações | **Insuficiente** | 61 menções de tipo ORG, sem filiação: nenhuma relação "membro de" além de "Steve Rogers lidera Avengers" |
| Acontecimentos | **Ausente** | 3 entidades EVENT. Não há Blip, Acordos de Sokovia, Batalha de Nova York, Estalo |
| Locais | **Parcial** | 28 (Wakanda, Asgard, Kamar-Taj…), com poucas relações |
| Artefatos e tecnologias | **Insuficiente** | 9 ARTIFACT; Joias do Infinito como grupo, sem as seis; armadura como "high-tech suit of armor" |
| Relações entre entidades | **Insuficiente** | 269 relações: 81 "listado na cronologia", ~100 de equipe técnica e elenco, ~75 narrativas |
| Evolução temporal | **Ausente** | Sem ano de lançamento, sem época na história, sem fase. A ordem da cronologia existe só como texto numerado |
| Continuidade e consistência | **Com problemas** | Ver seção 4 (colisões de nomes, predicados duplicados, direção inconsistente) |

**Conclusão:** a base não representa o MCU de forma suficiente para análise prospectiva. Ela sabe que
"Thanos quer as Joias" e que "Loki obtém o Tesseract", mas não sabe quem pertence a quê, o que veio
antes do quê, nem como as trajetórias se cruzam.

## 3. Hybrid RAG

| Item | Situação | Observação |
|---|---|---|
| Processamento e indexação | **Completo** | Reconstrói Qdrant e Elasticsearch a cada ingestão; metadados de fonte em cada chunk |
| Chunking | **Funciona, com cálculo confuso** | `CHUNK_SIZE=850` é tratado como caracteres ÷ 5 = 170 palavras. Com textos de ~100 palavras, 35 de 37 documentos viram um chunk só |
| Embeddings | **Completo** | `paraphrase-multilingual-MiniLM-L12-v2` normalizado, cosseno no Qdrant. Upsert ponto a ponto (lento em escala) |
| Busca vetorial | **Completo** | `query_points`, top-k |
| BM25 | **Parcial** | Analisador padrão do Elasticsearch num texto misto pt/en: sem stemming nem stopwords em nenhuma das duas línguas |
| Fusão RRF | **Correta, com recall limitado** | Fórmula `1/(k+rank)` certa, mas cada lista traz só `k=5` candidatos antes da fusão. O usual é buscar 4–10× mais e então cortar |
| Relevância | **Boa no corpus atual** | As consultas de prova trouxeram o documento certo em 1º lugar, em português e em inglês |
| Rastreabilidade | **Completo** | `doc_id`, `chunk_id`, URL, tipo de fonte e continuidade em cada resultado |
| Captura das fontes | **Ausente** | Não guarda data da coleta, HTML nem hash. Na conferência, a citação Loki/Tesseract e a de *Thor* não aparecem no HTML atual de marvel.com (o conteúdo pode ser carregado por JavaScript), e não há cópia para provar |
| Filtros (continuidade, tipo, título) | **Ausente** | O campo existe, mas a busca não filtra por ele |

## 4. GraphRAG

| Item | Situação | Observação |
|---|---|---|
| Extração de entidades | **Parcial** | Curada à mão no corpus; o caminho por LLM existe, mas não foi exercitado (o corpus já vem com triplas) |
| Resolução e desambiguação | **Com erro grave** | Chave do nó = nome em minúsculas. *Iron Man*, *Thor*, *Black Widow*, *Captain Marvel*, *Doctor Strange*, *Hawkeye*, *Ms. Marvel*, *The Incredible Hulk*, *The Avengers* fundem personagem/organização com filme/série. Confirmado no Neo4j: o nó `thor` é FILM e carrega `SON_OF Odin` |
| Apelidos | **Parcial** | Dicionário fixo de 17 apelidos em português dentro do código. Não liga identidades (Steve Rogers ↔ Captain America só via `ALSO_KNOWN_AS` quando o texto diz) |
| Normalização de texto | **Com erro** | "T'Challa" (apóstrofo reto) não encontra "T’Challa" (curvo) |
| Extração de relações | **Parcial** | Predicados livres, sem ontologia: `DIRECTED_BY` / `DIRECTED` / `DIRECTOR_OF`; `WRITTEN_BY` / `WROTE`; `PLAYS` / `PORTRAYED_BY` / `CAST_IN`, com direções opostas |
| Construção do grafo | **Completo como mecanismo** | Restrição de unicidade, reconstrução limpa, cada aresta com citação, URL, documento e chunk |
| Recuperação por entidades e relações | **Parcial** | Para duas entidades busca caminhos de até 2 saltos entre elas. Quando não há caminho, devolve relações soltas de cada uma, o que parece uma conexão (ex.: "Thanos ↔ Tony Stark") |
| Exploração de caminhos | **Parcial** | Até 2 saltos, sem ranqueamento nem caminho como objeto (nós + arestas ordenados) |
| Rastreabilidade | **Completo** | Toda aresta leva citação literal + URL + `chunk_id` |
| Guarda contra invenção | **Completo, com uma exceção** | A LLM não grava relação sem citação literal. Exceção: um `re.search` fixo grava "Loki → Tesseract" (o caso da demonstração) |

## 5. Engenharia

| Item | Situação |
|---|---|
| Testes | 6 testes, todos sobre o corpus estático. Nenhum testa `hybrid_search`, `graph_search`, a resolução de entidades ou a ingestão; o teste de RRF só confere aritmética |
| Configuração e segredos | Sem `.env.example` nem `.gitignore`. A senha de desenvolvimento do Neo4j está fixa no código como valor padrão |
| Dependência de LLM | Modelo padrão `gemini-3.8-flash` com `extra_body.reasoning`, específico de um provedor |
| Docker Compose | `network_mode: host` (só Linux); Elasticsearch sem limite de disco configurado |
| Estrutura | Um arquivo (`engine.py`) acumula ingestão, índices, grafo e consulta |
| Elementos ausentes | Motor prospectivo, orquestração, API, persistência das investigações e dados para o grafo visual |

## 6. O que manter, corrigir, acrescentar

**Manter (funciona, sem motivo para trocar):** Qdrant, Elasticsearch BM25, RRF, Neo4j, o formato do
corpus com `source_facts`, a regra "sem citação literal não entra", a separação MCU por campo
`continuity`, o modelo de embedding multilíngue.

**Corrigir:**
1. Identidade de entidade: chave = `tipo:id canônico`; personagem, filme e organização em nós distintos.
2. Tabela de apelidos e normalização Unicode (apóstrofos, acentos), fora do código.
3. Ontologia de predicados com direção fixa e mapeamento dos predicados atuais.
4. Busca no grafo: devolver caminhos reais entre as entidades; quando não houver, dizer que não há.
5. RRF com reserva de candidatos maior, filtros por continuidade e analisadores pt/en no BM25.
6. Remover o `re.search` fixo do Loki; senha fora do código; `.env.example` e `.gitignore`.

**Acrescentar:**
1. Captura de fonte (data, hash e trecho guardados) para que cada evidência possa ser conferida depois.
2. Dimensão temporal (ordem de lançamento, posição na cronologia oficial, fase).
3. Ampliação da base: personagens, organizações, artefatos e acontecimentos, só de fontes legítimas.
4. Motor prospectivo, orquestração, API e o contrato de dados do grafo dinâmico.
5. Testes de unidade (com dublês dos serviços) e de integração (com os serviços reais).
