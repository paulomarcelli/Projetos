# HELA Fase 3 (Intelligence) · plano de implementação

> **Para quem executa:** use `superpowers` (executing-plans + test-driven-development). Cada tarefa: teste que falha →
> código mínimo → teste passa → commit. Passos com caixa (`- [ ]`) para acompanhar.

**Objetivo:** dar à HELA classificação de tarefas, ranking de estratégias, aprendizado por resultado, evolução com
replay e rollback, roteamento com limiar de "experiência insuficiente", otimização de contexto e inteligência de
execução, tudo exposto pelo `Engine` nas 8 operações que o MCP (Fase 4) e a API (Fase 5) vão usar.

**Arquitetura:** módulos pequenos sobre o mesmo banco. O que os hooks da Fase 4 podem precisar (regras do
classificador, validador de scripts, otimizador, ativação no grafo) fica em Python puro, sem numpy, networkx nem
pydantic. O Naive Bayes importa numpy só ao treinar ou prever. O `Engine` valida a entrada com pydantic e devolve
dicionários JSON, que são o contrato do `docs/api.md`.

**Tecnologia:** Python ≥ 3.11, SQLite (WAL, FTS5), numpy (só o NB e a busca), pydantic (só a fronteira).

**Especificação:** `docs/prompt-mestre.md` (Parte A, seções 5 a 8; Parte C.4 itens 5 a 11), `docs/plano.md` (3.5 e
6.2), `docs/seguranca.md` (A1, A3), `docs/plano-de-testes.md` (seção 3: learning, router, optimizer, execution).

## Restrições globais

- Os 153 testes da Fase 2 continuam passando: `.venv/bin/pytest -W error`.
- Nenhum `import numpy`, `networkx` ou `pydantic` no topo de `hela/learning/taxonomy.py`, `hela/learning/rules.py`,
  `hela/execution/validator.py`, `hela/execution/planner.py`, `hela/core/optimizer.py` e `hela/memory/activation.py`
  (teste por subprocesso).
- A HELA nunca executa nada: o teste `test_pacote_nao_executa_nada` continua valendo para tudo o que entra.
- Rótulos `rules` (e previsões do modelo) nunca treinam o classificador.
- Chaves falsas dos testes montadas em tempo de execução.
- Mudança de esquema só por `Migration(2, ...)`; a 1 não muda.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `hela/storage/schema_v2.py` | migração 2: `outcomes.compute_cost`, `strategy_metrics.sum_compute`, `retrievals.tokens_raw/tokens_optimized`, índices |
| `hela/core/config.py` (+ `config/config.json`) | seções `learning`, `router`, `optimizer`, `execution`; `search.graph_activation` |
| `config/ranker_weights.json` | pesos padrão do ranker, versão 1 (cópia dos padrões do código; teste de igualdade) |
| `hela/learning/taxonomy.py` | categorias, palavras-chave, sinais de complexidade, ferramentas prováveis |
| `hela/learning/rules.py` | `classify_by_rules(texto) -> RuleResult` (puro) |
| `hela/learning/naive_bayes.py` | `MultinomialNB` em numpy, `tokenize`, `cross_validate` |
| `hela/learning/classifier.py` | `TaskClassifier`: modo ativo, treino só com `explicit`/`feedback`, `classifier_models` |
| `hela/learning/ranker.py` | `wilson_interval`, `StrategyStats`, `score_strategies`, `WeightStore` (tabela `versions`), `StrategyRanker`, Thompson opcional |
| `hela/learning/feedback.py` | `FeedbackLearner`: resultado de tarefa, nota de memória, correção de categoria |
| `hela/learning/evolution.py` | `EvolutionEngine`: propostas, replay (Brier), aplicar com snapshot, rollback |
| `hela/memory/activation.py` | `GraphActivation`: ativação espalhada lendo `relationships` por fronteira (sem networkx) |
| `hela/core/optimizer.py` | `optimize_context(itens, orçamento) -> OptimizedContext` (puro) |
| `hela/core/router.py` | `CognitiveRouter.route(...)`: os 9 passos e o log em `retrievals` |
| `hela/execution/validator.py` | `validate_script(script, language) -> ValidationReport` (shell, PowerShell, Python por AST) |
| `hela/execution/planner.py` | `split_task` + `classify_parts` nas 4 classes |
| `hela/execution/procedures.py` | `ProcedureService`: criar, avaliar classe, aprovar por sha256, revogar |
| `hela/core/contract.py` | modelos pydantic de entrada das 8 operações |
| `hela/core/engine.py` | `recall`, `classify`, `recommend`, `learn`, `feedback`, `procedure`, `relationships`, `stats` |
| `hela/cli.py` | `hela procedure list|show|approve|revoke`, `hela classifier status|train`, `hela evolution list|propose|apply|rollback` |
| `docs/api.md` | contrato das 8 operações e dos endpoints REST |

## Decisões fixadas antes do código

1. **Rótulo × previsão.** `tasks.label_source`: `explicit` (quem pediu disse a categoria), `feedback` (correção),
   `rules` (as regras classificaram). Previsão do Naive Bayes grava `label_source = NULL` e
   `metadata.classified_by = "naive_bayes:v<n>"`. O treino lê só `label_source IN ('explicit','feedback')` e o
   treinador recusa qualquer exemplo de outra origem (`ValueError`).
2. **Quando o NB assume.** Treino com classes de pelo menos `min_per_class` (5) exemplos e pelo menos 2 classes;
   validação cruzada estratificada (até 5 dobras, semente fixa). O modelo só fica ativo se a acurácia da validação
   cruzada for ≥ `min_cv_accuracy` (0,6) **e** maior que a acurácia das regras nos mesmos rótulos. Senão, o modelo é
   guardado inativo e o modo continua `rules`. Complexidade e ferramentas sempre vêm das regras.
3. **Ranker (heurística estatística).** `score = Σ peso_i · componente_i`, pesos somando 1, componentes em [0, 1]:
   `success` = limite inferior de Wilson (z = 1,96); `quality` = média com encolhimento para 0,5 (2 observações
   fictícias); custos (`tokens`, `duration`, `attempts`, `compute`) = `1 − x/(x + ref)`, com `ref` = mediana das médias
   dos candidatos (custo desconhecido = 0,5). Pesos padrão: success 0,45, quality 0,2, tokens 0,1, duration 0,1,
   attempts 0,1, compute 0,05.
4. **Brier do replay.** Resultados em ordem de tempo; para cada um, o score da estratégia usada, calculado só com o
   passado, é lido como probabilidade de sucesso; Brier = média de (p − y)². É prequencial: cada previsão é fora da
   amostra.
5. **Insuficiente.** Relevância absoluta de um acerto = `max(cosseno, cobertura)`, onde cobertura é a fração dos termos
   da consulta (sem palavras vazias) presentes no texto da memória. Entra no contexto quem tem relevância ≥
   `router.min_relevance` (0,35, a medir com o conjunto-ouro) e `quality × confidence ≥ router.min_trust` (0,1). Nada
   passou → `insufficient = true`, nenhuma memória, mensagem "experiência insuficiente".
6. **Ativação sem networkx.** A ativação espalha energia pelas arestas lidas do SQLite, por fronteira, até
   `search.activation_steps` (2) passos, com decaimento 0,5 e peso da aresta limitado a 1.
7. **Otimizador.** Tokens estimados = ⌈caracteres/4⌉ (rótulo "estimado"). Quase-duplicata: Jaccard de shingles de 3
   palavras ≥ 0,8. Trechos protegidos: blocos cercados por crases, linhas de comando, linhas com caminho, linhas de
   erro, frases com código entre crases. Eles nunca são alterados; um bloco de código de memória secundária ou entra
   inteiro ou sai inteiro, com o marcador `[código omitido: N linhas; íntegra na memória <id>]`.
8. **Execução.** Classe de um procedimento: sem script → `reuse`; com script aprovado (sha256 aprovado = sha256 atual),
   validador sem achados e origem confiável → `script`; qualquer outro caso → `human_approval`. Origem não confiável:
   `source = import` ou `metadata.origin` começando por `tool:WebFetch`/`tool:WebSearch`/`web`. Aprovar só pela CLI ou
   pela API (nunca pelo MCP), passando o sha256 revisado.

## Tarefas

### Tarefa 1 · Migração 2 e configuração
- [ ] Teste: banco v1 com dados recebe a migração 2 sem perder linhas; colunas novas existem; `schema_version == 2`.
- [ ] Teste: `config/config.json` igual aos padrões (já existe) e `config/ranker_weights.json` igual a `DEFAULT_WEIGHTS`.
- [ ] Implementar `schema_v2.py`, `Migration(2, ...)`, seções novas do `HelaConfig`.
- [ ] Commit.

### Tarefa 2 · Classificador por regras e Naive Bayes
- [ ] Testes (`tests/test_classifier.py`): cada categoria da taxonomia tem um exemplo pt e um en que as regras acertam;
  complexidade low/medium/high; ferramentas prováveis; sem palavra-chave → `general`; NB aprende um conjunto separável;
  validação cruzada com semente fixa dá o mesmo número; `test_rotulos_das_regras_nao_treinam` (100 tarefas `rules`
  com uma categoria exclusiva: o modelo não conhece a categoria e `n_samples` conta só as legítimas; passar um exemplo
  `rules` direto ao treinador levanta `ValueError`); N mínimo por classe; modo visível (`rules` → `naive_bayes` só
  quando bate as regras); importar `rules`/`taxonomy` não carrega numpy.
- [ ] Implementar `taxonomy.py`, `rules.py`, `naive_bayes.py`, `classifier.py`.
- [ ] Commit.

### Tarefa 3 · Ranker e Feedback Learner
- [ ] Testes (`tests/test_ranker.py`, `tests/test_feedback.py`): Wilson com valores conhecidos (0/0 → 0; 10/10 →
  0,7225; 5/10 → 0,2366); 0 observações não passa de 10 sucessos; A falha 5 e B acerta 5 → B na frente; custos menores
  ganham com sucesso igual; pesos versionados (versão 1 criada na primeira leitura, igual ao arquivo); resultado
  positivo e negativo mudam `strategy_metrics` da estratégia certa; memórias usadas sobem/descem qualidade e confiança;
  correção de categoria vira rótulo `feedback`; Thompson marcado como exploração e reprodutível com semente.
- [ ] Implementar `ranker.py`, `feedback.py`.
- [ ] Commit.

### Tarefa 4 · Execution Intelligence
- [ ] Testes (`tests/test_execution.py`): `test_validador_sinaliza_perigosos` (shell, PowerShell e Python, cada um com
  o motivo); `test_validador_nao_sinaliza_benignos`; `test_aprovacao_por_hash` (um espaço no fim desfaz a aprovação);
  aprovar exige o sha256 atual; procedimento sem aprovação sai `human_approval` com o script dentro do invólucro;
  `test_web_nao_vira_procedimento_executavel`; `split_task`/`classify_parts` nas 4 classes; o pacote continua sem
  `subprocess`/`eval`.
- [ ] Implementar `validator.py`, `planner.py`, `procedures.py`.
- [ ] Commit.

### Tarefa 5 · Context Optimizer e ativação no grafo
- [ ] Testes (`tests/test_optimizer.py`, `tests/test_activation.py`): saída cabe no orçamento; quase-duplicatas viram
  uma; frase repetida entre memórias sai da segunda; código/comando/caminho/erro idênticos na saída ou omitidos
  inteiros; principais inteiras, secundárias resumidas; tokens brutos ≥ otimizados; ativação respeita o limite de
  passos e decai.
- [ ] Implementar `optimizer.py`, `activation.py`.
- [ ] Commit.

### Tarefa 6 · Cognitive Router
- [ ] Testes (`tests/test_router.py`): os 9 passos gravam uma linha em `retrievals` ligada à tarefa (criada se não
  vier); consulta sem relação → `insufficient` e nenhuma memória; quarentena nunca volta; conjunto-ouro (memórias
  sintéticas, consultas relacionadas e sem relação): recall@5 ≥ 0,8 e "insuficiente" em ≥ 90% das sem relação;
  rótulo explícito da tarefa não é sobrescrito pelas regras.
- [ ] Implementar `router.py`.
- [ ] Commit.

### Tarefa 7 · Evolution Engine
- [ ] Testes (`tests/test_evolution.py`): Brier do replay com valores conhecidos; proposta de pesos só é recomendada
  se o Brier melhora; com poucos resultados nenhuma proposta; aplicar cria versão nova ativa; rollback devolve os
  pesos byte a byte; depreciar estratégia estatisticamente pior; promover procedimento com Wilson alto; mesclar
  duplicatas e desfazer.
- [ ] Implementar `evolution.py`.
- [ ] Commit.

### Tarefa 8 · Engine (8 operações), CLI e contrato
- [ ] Testes (`tests/test_engine_ops.py`, `tests/test_cli.py`): cada operação com sucesso, entrada inválida e limite;
  saída serializável em JSON; `procedure` não aprova; `hela procedure approve` exige o sha256.
- [ ] Implementar `contract.py`, métodos do `Engine`, subcomandos da CLI.
- [ ] Escrever `docs/api.md`.
- [ ] Commit.

### Tarefa 9 · Documentação e fechamento
- [ ] ADRs da Fase 3 em `docs/arquitetura.md`, seção 8 do `docs/plano.md`, README, memória da Karol.
- [ ] Suíte inteira com `-W error`, medições (tempo do router, import dos módulos leves).
- [ ] Commit e push.

## Foco da revisão

1. Consulta curta ou só com palavras vazias ("como faço isso?") não pode trazer memória por acaso: cobertura e
   cosseno baixos → insuficiente (teste no router).
2. Orçamento menor que uma memória inteira: a principal desce para o resumo, e nada sai cortado (teste no otimizador).
3. Script com CRLF, espaço no fim ou BOM muda o sha256: a aprovação cai (teste de aprovação por hash).
4. Banco sem nenhum resultado: ranker, evolução e classificador respondem com "dados insuficientes", sem erro.
5. Texto com segredo na consulta do router: `retrievals.query` e `tasks.prompt` gravados redigidos (teste no router).
