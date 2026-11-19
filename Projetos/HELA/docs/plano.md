# HELA · Fase 1: auditoria e plano

Data: 18/11/2026. Este documento fecha a Fase 1 do prompt mestre: a auditoria do ambiente, a conferência da
documentação oficial, a arquitetura, a divisão do trabalho entre os agentes e as skills, e o plano das Fases 2 a 7. A
Parte C do handoff (sessão anterior) foi o ponto de partida. Abaixo, o que foi confirmado, o que mudou e o que foi
decidido.

## 1. Auditoria deste ambiente

| Item | Resultado |
|---|---|
| Python | 3.13.17 |
| Node / npm | 22.22 / 10.9.4 |
| Claude Code | 2.1.327 |
| SQLite (Python) | 3.45.1, **FTS5 disponível** (testado criando uma tabela `fts5`) |
| uv | 0.11.32 (o instalador usa o `uv` se existir, senão `python -m venv`) |
| Já instalados | numpy 2.5.3, networkx 3.7, uvicorn 0.54, pydantic 2.13, scikit-learn 1.9.1 (fica de fora: ver 3.5) |
| No PyPI | fastapi 0.164, pydantic 2.14, pytest 9.2, httpx 0.28, **mcp 2.3.0** |
| No npm | three 0.187, vite 8.3, react 19.3 |
| `~/.claude/settings.json` | sem hooks hoje. O instalador **mescla**, com backup, e nunca sobrescreve |

## 2. Documentação oficial conferida (code.claude.com/docs, 18/11/2026)

Confirmado o que está na Parte C.3, com dois acréscimos:

- **Eventos usados:**
  - `SessionStart`, com `source` ∈ startup | resume | clear | compact | fork;
  - `UserPromptSubmit`, com `prompt`;
  - `PostToolUse` e `PostToolUseFailure`, com `tool_name`, `tool_input`, `tool_response` e `tool_use_id`;
  - `Stop`, com `last_assistant_message`;
  - `SessionEnd`, com `reason`.

  Existem mais 27 eventos (`PostToolBatch`, `SubagentStop`, `PreCompact`…) que a HELA não usa na v1.
- **Campos comuns:** `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir` (novo), `permission_mode`,
  `effort`, `hook_event_name`, e `agent_id`/`agent_type` em subagentes.
- **Saída:** `{"hookSpecificOutput": {"hookEventName": "...", "additionalContext": "..."}}`. O limite é de **10.000
  caracteres**; acima disso, o texto vai para um arquivo e o Claude vê só 2.000. O texto chega como system reminder, por
  isso deve ser **factual, não imperativo**.
- **Timeouts:**
  - `command` tem 600 s de padrão, mas **30 s em `UserPromptSubmit`**;
  - os hooks de `SessionEnd` **dividem 1,5 s**;
  - hooks `async: true` não têm timeout.
- **Exit codes:**
  - **0** é sucesso. JSON é aplicado; texto puro vira contexto em `SessionStart` e `UserPromptSubmit`.
  - **2** bloqueia. **A HELA nunca usa.**
  - Outros são erro não bloqueante.
- **Stop:** `additionalContext` ou `decision: "block"` fazem o Claude continuar o turno. **O hook `Stop` da HELA não
  imprime nada.**
- **Skills:**
  - `~/.claude/skills/<nome>/SKILL.md`, com o frontmatter na primeira linha;
  - `description` + `when_to_use` até 1.536 caracteres;
  - o corpo com menos de ~500 linhas.
- **MCP:** `claude mcp add --scope user hela -- <comando>`. As ferramentas aparecem como `mcp__hela__hela_recall` etc.
- **Tokens do provedor:** `message.usage` nas linhas `type: "assistant"` do transcript JSONL. Uma mesma mensagem se
  repete com o mesmo `message.id`, por isso **deduplicar por `message.id`** antes de somar.

## 3. Arquitetura (validação da Parte C.4)

As 17 decisões da Parte C.4 ficam valendo, com estes ajustes:

### 3.1 Pacote e processos
- **Um pacote Python, `hela`, com quatro entrypoints:**
  - `hela`: CLI para `dashboard`, `status`, `export`, `import`, `procedure` e `doctor`;
  - `hela-mcp`: o servidor MCP, em stdio;
  - `hela-hook <evento>`: um só executável para todos os hooks;
  - `hela-api`: FastAPI + uvicorn, que também serve o build do dashboard na mesma origem.
- **Todos usam o mesmo `hela.core.Engine`,** sobre o mesmo `~/.hela/hela.db` (SQLite em modo WAL, `busy_timeout` de 3
  s). Não há serviço obrigatório rodando: o MCP e os hooks abrem o banco direto. A API só é necessária para o dashboard.
  Isso mantém a integração **fail-open** e simples.
- **Hooks rápidos:** o `hela-hook` importa só `sqlite3`, `json` e o módulo do evento. Numpy e NetworkX são carregados
  só quando o roteador precisa, e o grafo é cacheado em disco. A meta é menos de 300 ms em `UserPromptSubmit`.

### 3.2 Dados
- `~/.hela/`, que pode ser trocado por `HELA_HOME`: `hela.db`, `config.json`, `graph.cache` e `logs/` (com redação).
- O esquema é o da Parte C.4.2, com migrações versionadas (`schema_version`).

### 3.3 Busca
- **Vetores por feature hashing:** 512 dimensões, n-gramas de palavras (1 a 2) e de caracteres (3 a 5), em numpy
  float32.
- **Busca híbrida:**
  - BM25 do FTS5;
  - cosseno dos vetores;
  - ativação no grafo;
  - recência;
  - qualidade.

  Os sinais são combinados por **Reciprocal Rank Fusion**.
- **Interface `Embedder` plugável:** se o `sentence-transformers` estiver instalado, ele entra no lugar.
- **Documentação honesta:** é similaridade léxico-semântica, não embedding neural.

### 3.4 Grafo
- NetworkX montado a partir de `relationships`, com o cache invalidado por um contador de versão no banco.

### 3.5 Aprendizado
- **Task Classifier:** começa por regras. Passa para **Naive Bayes multinomial em numpy** só com rótulos que **não
  vieram das regras** (`label_source` ∈ `explicit` | `feedback`), com N mínimo por classe e validação cruzada. O
  scikit-learn existe neste ambiente, mas não entra como dependência, porque não é garantido em outras máquinas e o NB
  em numpy é pequeno e auditável.
- **Strategy Ranker:** limite inferior de Wilson mais custos normalizados, com os pesos versionados. É **rotulado como
  heurística estatística**.
- **Evolution Engine:** cada proposta é testada por replay (Brier score), e só a que melhora é recomendada. Toda proposta
  aplicada gera um snapshot, com rollback.

### 3.6 Segurança
- Igual à Parte C.4.12:
  - redação na entrada;
  - quarentena por prompt injection;
  - invólucro "dados, não instruções";
  - API em 127.0.0.1 com checagem do `Host` e `X-HELA-Token` nas escritas, sem CORS.
- **A HELA nunca executa scripts sozinha.**

### 3.7 Métricas
- **Provedor:** os tokens do transcript.
- **Estimado:** chars/4.
- **Potencial:** procedimentos reutilizáveis disponíveis.
- **Comprovado:** assistido contra não assistido, em tarefas equivalentes, com IC por bootstrap. Se o IC não excluir
  zero, o resultado aparece como "inconclusivo".

### 3.8 Dashboard
- React 19 + TypeScript + Vite + `three` puro.
- **Paleta Hela (Parte B):**
  - preto profundo;
  - verde-esmeralda;
  - verde neon "tóxico";
  - prata fria e grafite.

  **Sem azul e sem roxo.**
- A identidade visual é original, sem nada da Marvel e sem elmo de chifres.
- Gráficos em SVG próprio, seguindo a skill `dataviz`.

## 4. Agentes e skills: quem faz o quê

Agentes disponíveis em `.claude/agents/`: **Karol** (desenvolvimento), **Sofia** (design), **Sabrina** (coordenação,
pesquisa e QA) e **Gabriela** (conteúdo, que fica fora deste projeto). Skills relevantes: `superpowers`,
`design-skills`, `dataviz`, `skill-creator`, `security-review`, `code-review`, `simplify` e `logo-design`.

| Fase | Quem | Skills |
|---|---|---|
| 1. Auditoria e plano | eu (sessão principal) | `superpowers` (writing-plans) |
| 2. Cognitive Core | **Karol** | `superpowers` (TDD, plans, verification) |
| 3. Intelligence | **Karol** | `superpowers` (TDD, systematic-debugging) |
| 4. Integração (Skill, MCP, Hooks) | **Karol** | `skill-creator` (SKILL.md), `superpowers` |
| 5a. Identidade e Design System do dashboard | **Sofia**, no Figma, em paralelo com as Fases 2 a 4 | `design-skills`, `logo-design` |
| 5b. Dashboard (React + Three.js) | **Karol**, a partir do DS da Sofia e do contrato da API | `dataviz` (Performance Center), `design-skills` |
| 6. Instalador | **Karol** | `superpowers` |
| 7. Validação | **Sabrina** (testes, revisão, segurança) e **Sofia** (revisão visual) | `security-review`, `code-review`, `superpowers` (verification) |

O **contrato da API** (`docs/api.md`) é escrito pela Karol no fim da Fase 3, antes da Fase 5b, para o dashboard e o MCP
seguirem o mesmo formato.

## 5. Estrutura do repositório

O projeto fica em `Projetos/HELA/` (repositório público `paulomarcelli/Projetos`). **Nenhum dado de memória vai para o
git:** tudo fica em `~/.hela/`.

```
Projetos/HELA/
├── .claude/skills/hela/SKILL.md   # a skill instalada pelo instalador
├── hela/
│   ├── core/          # Engine, config, eventos
│   ├── memory/        # Memory Engine, busca híbrida, embedder, grafo
│   ├── learning/      # classificador, ranker, feedback, evolução
│   ├── integration/   # MCP server, hooks, leitura do transcript
│   ├── execution/     # Execution Intelligence, validador de scripts
│   ├── storage/       # SQLite, migrações, repositórios
│   ├── security/      # redação, injeção, invólucro
│   └── api/           # FastAPI
├── dashboard/         # React + TS + Vite + three
├── installer/         # install.sh, install.py, uninstall
├── tests/
├── scripts/
├── config/            # config padrão e pesos do ranker
├── docs/              # plano, arquitetura, api, segurança, métricas
├── pyproject.toml
└── README.md
```

A pasta `security/` foi acrescentada à estrutura do prompt, para isolar a redação, a detecção de injeção e o
invólucro, que o MCP, os hooks e a API usam.

## 6. Plano por fase (critério de pronto)

1. **Fase 2, Core.** Pronto quando:
   - o `pyproject` estiver configurado;
   - o banco tiver esquema, migrações e WAL;
   - os repositórios estiverem prontos;
   - o Memory Engine fizer CRUD, deduplicação por `content_hash`, FTS5, embedder por hashing, busca híbrida, consolidação,
     expiração e export/import;
   - a redação de segredos estiver na entrada;
   - houver testes de tudo isso.
2. **Fase 3, Intelligence.** Pronto quando:
   - existirem o classificador (regras e NB com rótulos legítimos), o ranker (Wilson e custos), o Feedback Learner, o
     Evolution Engine (propostas, replay, snapshot e rollback), o Cognitive Router (os 9 passos, o limiar "experiência
     insuficiente" e o log em `retrievals`), o Context Optimizer (orçamento de tokens, sem cortar código, comandos,
     caminhos ou erros) e o Execution Intelligence (as 4 classes e o validador estático);
   - o `docs/api.md` estiver escrito;
   - houver testes.
3. **Fase 4, Integração.** Pronto quando:
   - o `SKILL.md` estiver escrito;
   - o MCP tiver as 8 ferramentas, com validação e erros, e import compatível com mcp v1 e v2;
   - o `hela-hook` atender os 6 eventos, fail-open, com Stop silencioso;
   - a contabilidade de tokens vier do transcript, deduplicada;
   - os testes cobrirem o JSON real dos hooks;
   - houver um teste com o `claude` de verdade, num HOME isolado.
4. **Fase 5, Dashboard.** Pronto quando:
   - a Sofia tiver entregue o DS da Hela no Figma;
   - o FastAPI estiver pronto;
   - as telas Brain Overview (cérebro 3D com memórias reais), Neural Explorer, Performance Center, Memory Management e
     Engine Monitor estiverem funcionando, com dados reais e polling ou SSE;
   - o build for servido pela API.
5. **Fase 6, Instalador.** Pronto quando:
   - existirem o `install.sh` e o `install.py`, com venv, build e banco;
   - a skill estiver copiada para `~/.claude/skills/hela`;
   - o `claude mcp add` estiver feito;
   - os hooks estiverem mesclados com backup e de forma idempotente;
   - o comando `hela` existir;
   - o `uninstall` estiver pronto, com `--purge` confirmado;
   - tudo tiver sido testado com HOME temporário.
6. **Fase 7, Validação.** Pronto quando:
   - houver um ponta a ponta com tarefas reais simuladas;
   - a persistência entre sessões estiver conferida;
   - a latência dos hooks estiver medida;
   - a revisão de segurança e de código estiver feita;
   - as correções estiverem aplicadas;
   - o README estiver escrito.

## 7. Riscos e limites conhecidos

- **Limite de uso da conta:** as sessões da equipe já pararam duas vezes pelo limite de 5 horas. Cada fase termina com
  commit e push, e com o estado registrado em `docs/plano.md` (seção 8), para outra sessão continuar.
- **Teste real com o `claude`:** depende do CLI autenticado neste ambiente. Se não estiver, o teste ponta a ponta usa
  o JSON real dos hooks e o cliente MCP do SDK, e o teste no `claude` fica para o PC do Paulo.
- **Vetores por hashing:** pegam bem sinônimos de forma, mas não de sentido. Isso fica documentado, com o `Embedder`
  plugável como saída.

## 8. Estado

- [x] Fase 1: auditoria e plano (este documento)
- [x] Fase 2: Core (Karol, 18/11/2026). Decisões em `docs/arquitetura.md` (ADR-01 a ADR-11); plano de execução em
  `docs/planos/2026-11-18-fase2-core.md`.
  - **Pronto:** pacote `hela` (`pyproject.toml`, Python ≥ 3.11, numpy, networkx e pydantic); SQLite em WAL com o esquema
    completo da Parte C.4.2 na migração 1; repositórios; redação de segredos, quarentena por injeção e invólucro;
    Memory Engine (CRUD, deduplicação por hash, quase-duplicata, embedder por hashing plugável, busca híbrida por RRF,
    grafo com cache por versão, consolidação, expiração, qualidade, acesso, export/import, eventos); `Engine`; CLI
    `hela status | export | import`; reforços do `docs/seguranca.md` que cabem no Core (A1, A2, A3 e A5).
  - **Testes:** 153 passando (`cd Projetos/HELA && .venv/bin/pytest -W error`).
  - **Medido (10.000 memórias):** busca p50 81 ms e p95 104 ms; criar p50 9,6 ms; import do `Engine` ~149 ms, sem o
    NetworkX.
  - **Mudanças em relação a este plano:** (1) o grafo tem cache só em memória, não em disco (ADR-06); (2) o import trata
    o arquivo como não confiável e ignora status, qualidade, confiança, contadores e origem, como pede o
    `seguranca.md`; `hela import --trusted` mantém esses campos só para backup próprio (ADR-09, a revisar com a
    Sabrina); (3) exclusão e edição de texto rodam `purge` (FTS5 `optimize` + checkpoint do WAL) para o texto sumir do
    disco (ADR-08).
  - **Para a Fase 3:** `ActivationProvider` (ativação no grafo) já tem o encaixe na busca; tabelas `tasks`, `outcomes`,
    `strategies`, `strategy_metrics`, `retrievals`, `feedback`, `versions`, `evolution_proposals`, `classifier_models`
    e `procedures` já existem; `MemoryService.adjust_quality()` está pronto para o Feedback Learner.
  - **Para a Fase 4:** hooks com `busy_timeout` curto; não montar o grafo no `UserPromptSubmit`; se faltar folga nos
    300 ms, cachear a matriz de vetores (ADR-05).
- [x] Fase 3: Intelligence (Karol, 18 e 19/11/2026). Decisões em `docs/arquitetura.md` (ADR-12 a ADR-20); plano de
  execução em `docs/planos/2026-11-18-fase3-intelligence.md`; contrato em `docs/api.md`.
  - **Pronto:** migração 2; Task Classifier (regras da taxonomia + Naive Bayes multinomial em numpy, treinado só com
    `explicit`/`feedback`, N mínimo por classe, validação cruzada, ativo só se bater as regras, modo visível);
    Strategy Ranker (Wilson + qualidade + custos, heurística estatística, pesos versionados em
    `config/ranker_weights.json` e na tabela `versions`, Thompson opcional como exploração); Feedback Learner;
    Evolution Engine (pesos por replay com Brier, depreciar estratégia, promover procedimento, mesclar duplicatas,
    snapshot e rollback); Cognitive Router (9 passos, "experiência insuficiente", log em `retrievals`, ativação no
    grafo); Context Optimizer; Execution Intelligence (validador estático, 4 classes, aprovação por sha256, nunca
    executa); `Engine` com as 8 operações; CLI `hela procedure | classifier | evolution`.
  - **Testes:** 343 passando (`cd Projetos/HELA && .venv/bin/pytest -W error`).
  - **Medido:** conjunto-ouro recall@5 1,00, MRR 1,00, insuficiente em 100% das sem relação e das iscas; paráfrase sem
    palavra comum só 2 de 10 (limite do hashing). `recall` p50 23 ms com 1.000 memórias e 114 ms (p95 151 ms) com
    10.000. Import do `Engine` ~156 ms; dos módulos leves (regras, otimizador, validador, ativação) 3 a 21 ms.
  - **Mudanças em relação a este plano:** (1) a ativação no grafo lê o SQLite e não usa NetworkX (ADR-20); (2)
    previsões do NB gravam `label_source = NULL` (ADR-12); (3) router e otimizador ficaram em `hela/core/`.
  - **Para a Fase 4:** os hooks podem usar `rules`, `optimizer`, `validator` e `activation` sem numpy; o
    `UserPromptSubmit` completo (`Engine.recall`) passa dos 300 ms só no import (~156 ms) mais a busca: medir e, se
    preciso, um caminho leve só com FTS5 + regras + otimizador; gravar `compute_cost` (chamadas de ferramenta) e
    tokens do provedor com `token_source = "provider"`; MCP com as 8 ferramentas sobre `Engine.<operação>`, sem
    ferramenta de aprovar ou aplicar.
- [x] Revisão da Fase 2 (Sabrina, `docs/revisoes/2026-11-18-fase2.md`): os 7 achados altos (A-1 a A-7) corrigidos pela
  Karol em 19/11/2026, com testes em `tests/test_revisao_fase2.py` (396 testes no total). Resumo em
  `docs/arquitetura.md`, seção "Correções da revisão da Fase 2". **Pendente:** os achados médios (15 testes de ataque
  da Sabrina ainda vermelhos, nenhum alto).
- **Decisões do Paulo (19/11/2026):**
  - **Assinatura do backup aprovada:** `hela import --trusted` só com HMAC-SHA256 desta instalação, só no terminal
    com confirmação e só na CLI (ADR-21, feito pela Karol, com testes).
  - **Ponta a ponta da Fase 7 aprovado** (cerca de US$ 1 a 3 com `claude -p`).
  - **Experimento de economia não aprovado** (US$ 6 a 30): a Fase 7 entrega o cálculo testado com dados sintéticos e
    diz que a economia comprovada ainda não foi medida.
  - **Logo:** fica para decidir depois.
- [ ] Fase 4: Integração
- [ ] Fase 5: Dashboard (5a DS da Sofia; 5b app)
- [ ] Fase 6: Instalador
- [ ] Fase 7: Validação
