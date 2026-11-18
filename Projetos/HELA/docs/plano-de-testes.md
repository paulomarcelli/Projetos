# HELA · Plano de testes da Fase 7 (validação)

Escrito em 18/11/2026 pela Sabrina. Base: prompt mestre (seções 11, 14 e 16), `docs/plano.md` (seções 3 e 6),
`docs/referencia-claude-code.md` e `docs/seguranca.md`. Este plano diz **o que testar, como, onde e o que conta como
aprovado**. A Karol pode (e deve) escrever boa parte destes testes durante as Fases 2 a 6; a Fase 7 confere que
existem, roda tudo e faz o ponta a ponta.

## 1. Regras

1. **Evidência ou não aconteceu.** Todo "passou" tem a saída do `pytest`, o log do `claude -p` ou a captura de tela
   anexada no relatório.
2. **Nunca o `~/.hela` nem o `~/.claude` reais.** Todo teste usa `HELA_HOME` e `HOME` temporários. Um teste-guarda
   (`test_guarda_home_real`) compara o hash de `~/.claude/settings.json`, `~/.claude.json` e `~/.hela/` antes e depois
   da suíte.
3. **Nenhum teste é desligado, pulado ou afrouxado para passar.** Teste que depende de algo ausente (o `claude`, um
   navegador) é marcado com `skipif` **com o motivo**, e o relatório lista o que foi pulado.
4. **Dados de teste sintéticos.** Nada de conversa real, e-mail ou segredo real em fixture (o repositório é público).
   Chaves falsas montadas em tempo de execução.
5. **Oráculo para tokens:** o `usage` do `claude -p --output-format json` (ver a referência, seção 4.4).

## 2. Onde cada teste roda

| Ambiente | O que tem | O que roda |
|---|---|---|
| **Este ambiente (nuvem)** | Python 3.13, Node 22, `claude` 2.1.327 **autenticado**, rede para PyPI e npm | unidade, integração, MCP pelo SDK, API, instalador com `HOME` temporário, **ponta a ponta com `claude -p`**, latência, economia de tokens (com aprovação do gasto) |
| **PC do Paulo** | uso interativo de verdade, o sistema dele | sessão interativa (confiança da pasta, `/hooks`, `/mcp`), dashboard no navegador dele, instalador no `HOME` real (com backup), uma semana de uso real para a métrica com `holdout_rate` |

A conferência de 18/11 (ver a referência, seção 5) mostrou que o `claude -p` funciona aqui com `HOME` isolado: os 6
hooks dispararam, o contexto do `SessionStart` chegou ao Claude e um servidor MCP registrado com `--scope user`
respondeu. **Dá para fazer o ponta a ponta aqui.** O que não dá é o modo interativo.

## 3. Testes de unidade

Rodam com `pytest` puro, sem rede, em segundos. Um arquivo por módulo.

| Módulo | O que provar (resumo) |
|---|---|
| `storage` | esquema completo, `schema_version`, migração que falha volta atrás, WAL, `busy_timeout`, `foreign_keys`, triggers do FTS5, contador `graph_version` (já no plano da Karol) |
| `security` | redação, injeção, invólucro (ver `docs/seguranca.md`, A1 e A2) |
| `memory` | CRUD; deduplicação por `content_hash`; quase-duplicata; expiração some da busca; consolidação junta e preserva a origem; export/import |
| `memory.search` | consulta com `"`, `*`, `-`, `:`, `(`, `NEAR`, `OR` não estoura; RRF dá a mesma ordem para entradas iguais; embedder é determinístico (mesmo texto, mesmo vetor, norma 1) |
| `memory.graph` | cache invalida quando `graph_version` muda; ativação espalha só até o limite de passos |
| `learning.classifier` | regras cobrem as categorias; o Naive Bayes **só treina com `label_source` ∈ `explicit`, `feedback`** (um rótulo vindo das regras no treino faz o teste falhar); N mínimo por classe; validação cruzada registrada |
| `learning.ranker` | limite inferior de Wilson correto (valores conhecidos); com 0 observações a estratégia não passa à frente de uma com 10 sucessos; pesos versionados |
| `learning.feedback` | resultado positivo e negativo mudam as métricas da estratégia certa |
| `learning.evolution` | proposta só é recomendada se o Brier do *replay* melhora; aplicar gera *snapshot*; *rollback* devolve os pesos **byte a byte** |
| `router` | os 9 passos registram em `retrievals`; abaixo do limiar devolve "experiência insuficiente" e nenhuma memória |
| `optimizer` | saída cabe no orçamento; blocos de código, comandos, caminhos e linhas de erro da entrada aparecem **iguais** na saída; quase-duplicatas (Jaccard de *shingles*) viram uma |
| `execution` | 4 classes; validador estático (ver `docs/seguranca.md`, A3); aprovação por sha256 |
| `integration.transcript` | soma deduplicada por `message.id`; offset para no fim da última linha completa; linha cortada no fim não é contada; arquivo menor que o offset recomeça; linhas `isApiErrorMessage` ignoradas; `subagents/*.jsonl` somados à parte |
| `integration.hooks` (parser) | cada evento com as chaves reais (referência, seção 1.3), com campos faltando e com campos a mais |
| `api` | contrato do `docs/api.md`; segurança (ver `docs/seguranca.md`, A4) |

**Fixtures dos hooks.** Criar `tests/fixtures/hooks/<evento>[_<ferramenta>].json` com a **estrutura real** vista em
18/11 (referência, seções 1.3 e 1.5) e conteúdo sintético: `SessionStart`, `UserPromptSubmit`, `PostToolUse` de
`Bash`, `Read` (texto e imagem), `Write`, `Edit` e de uma ferramenta MCP, `PostToolUseFailure` de `Bash` e de MCP,
`Stop` e `SessionEnd`. Para regenerar com uma versão nova do Claude Code, o hook de captura do teste de 18/11 grava só
chaves e tipos; ele pode ser adaptado para gravar o JSON inteiro de uma sessão de teste com conteúdo sintético.

**Meta de cobertura:** 85% de linhas em `hela/` (menos `api` e `cli`, que entram pela integração), medida com
`pytest --cov`. Cobertura é indicador, não critério: o critério são os testes nomeados neste plano.

## 4. Testes de integração

Usam processos reais e o banco real (em `HELA_HOME` temporário), sem o `claude`.

### 4.1 Hooks como subprocesso

Para cada fixture: roda `hela-hook <evento>` com a fixture no stdin e confere:

- código de saída **0**;
- stdout vazio ou **exatamente um** objeto JSON com `hookSpecificOutput.hookEventName` igual ao evento;
- `Stop`, `PostToolUse`, `PostToolUseFailure` e `SessionEnd`: stdout **vazio**;
- `additionalContext` (quando houver) dentro do invólucro e com menos de 10.000 caracteres;
- efeito no banco: `PostToolUse` de Bash com sucesso grava uma observação; `PostToolUseFailure` grava o erro com o
  `Exit code`; `Stop` consolida; `SessionEnd` fecha a sessão e salva o offset do transcript.

Mais os testes de falha do `docs/seguranca.md`, A7 (entrada inválida, banco travado, banco corrompido, `HOME` só
leitura, desligado).

### 4.2 Fluxo completo sem o Claude

Um teste que encena uma sessão inteira só com as fixtures, na ordem:
`SessionStart` → `UserPromptSubmit` ("converter vídeo para gif") → `PostToolUseFailure` (ffmpeg com erro) →
`PostToolUse` (ffmpeg certo) → `Stop` → `SessionEnd`. Depois, numa **segunda sessão** (outro `session_id`):
`UserPromptSubmit` ("transformar mp4 em gif") devolve um `additionalContext` com o procedimento que funcionou e o
erro a evitar.

### 4.3 MCP pelo cliente do SDK

Com o cliente stdio do próprio SDK (o mesmo da referência, seção 3.6), contra o `hela-mcp` real:

- `list_tools` tem as 8 ferramentas, cada uma com esquema de entrada e descrição que começa pelas palavras de busca;
- cada ferramenta: um caso de sucesso, um de entrada inválida (`is_error` e mensagem útil) e um de limite (texto
  enorme, `k` acima do máximo);
- exceção inesperada não vaza detalhe (`Error executing tool <nome>`);
- os dois SDKs: o teste roda com o `mcp` instalado; um job opcional repete com `mcp<2` para provar o import
  compatível;
- concorrência: o MCP lê enquanto um hook grava (WAL) sem `database is locked`.

### 4.4 API

Com `TestClient` e com o `hela-api` real em porta livre: o contrato do `docs/api.md` e todos os testes de A4 do
`docs/seguranca.md`.

## 5. Ponta a ponta com o `claude` de verdade

Roda **aqui**, com `claude -p`, `HOME` temporário e a HELA instalada pelo próprio instalador nesse `HOME`. Cada
sessão é um processo `claude -p` novo (não `--resume`), com `--output-format json` e `--debug-file`.

```bash
T=$(mktemp -d); export HOME_TESTE="$T/home"; mkdir -p "$HOME_TESTE" "$T/proj"
HOME="$HOME_TESTE" ./installer/install.sh --yes          # a HELA no HOME de teste
cd "$T/proj"
env -u CLAUDECODE HOME="$HOME_TESTE" claude -p "<tarefa>" \
  --allowedTools "Bash Read Write Edit mcp__hela__*" \
  --output-format json --max-turns 15 --debug-file "$T/debug-1.txt" > "$T/saida-1.json"
```

Nunca `--bare` (desliga hooks e MCP) nem `--no-session-persistence` (sem transcript não há tokens).

### 5.1 Cenários

| # | Cenário | Como conferir |
|---|---|---|
| E1 | **Instalação** | `claude mcp list` mostra `hela … √ Connected`; `~/.claude/settings.json` do teste tem os 6 hooks; `hela doctor` sem erro |
| E2 | **Captura** | uma tarefa com um erro e uma correção (por exemplo, um script que falha e depois funciona). No banco: sessão, tarefa, observação do erro, resultado positivo |
| E3 | **Persistência entre sessões** | ver 5.2 |
| E4 | **Uso pelo MCP** | prompt pedindo explicitamente "consulte a memória da HELA sobre X": o transcript tem `tool_use` de `mcp__hela__hela_recall` e o `retrievals` registra a chamada |
| E5 | **Skill** | com a skill instalada, `/hela` (ou um prompt que a aciona) carrega a skill: `skill_listing` no transcript cita `hela` |
| E6 | **Fail-open** | settings de teste com o `hela-hook` apontando para um caminho inexistente: `claude -p` responde normalmente, só com aviso de hook |
| E7 | **Desinstalação** | `uninstall` tira hooks e MCP; `claude -p` roda sem aviso de hook; `~/.hela` continua; `--purge` sem confirmação recusa |
| E8 | **Tokens** | para cada sessão, o total que a HELA gravou é **igual** ao `usage` do `--output-format json` |

### 5.2 Persistência entre sessões (E3)

1. **Sessão A** (`claude -p`, `session_id` A): tarefa que gera um procedimento (por exemplo "crie
   `converter.py` que transforma CSV em JSON com cabeçalho; rode com `dados.csv`"), com uma falha no meio.
2. Conferir no banco: memória procedural e episódica com `session_id` A, sem segredo, com a origem certa.
3. **Fechar tudo**: nenhum processo da HELA vivo; `PRAGMA wal_checkpoint` feito; abrir o banco de novo com outro
   processo e ler.
4. **Sessão B** (processo novo, `session_id` B, mesma pasta): tarefa parecida ("crie um conversor de CSV para JSON
   para `vendas.csv`").
5. Conferir:
   - no transcript de B, uma linha `attachment` com `type: "hook_additional_context"` e `hookEvent:
     "UserPromptSubmit"` que cita o id da memória de A (referência, seção 4.6);
   - em `retrievals`, a recuperação ligada à sessão B;
   - o arquivo gerado em B funciona (teste determinístico do resultado).
6. **Sessão C** em **outra pasta** de projeto, tarefa sem relação ("explique o que é um closure"): a HELA devolve
   "experiência insuficiente" ou nada; nenhuma memória de A no contexto.
7. `--resume` da sessão B: o `SessionStart` chega com `source: "resume"` e **não duplica** as capturas.

### 5.3 Custo

Cada `claude -p` curto custou de US$ 0,09 a 0,13 no teste de 18/11. O ponta a ponta completo (cerca de 10 sessões) deve
ficar em torno de US$ 1 a 3. **Aguarda aprovação do Paulo** antes de rodar (regra de gasto de créditos).

## 6. Latência dos hooks

**Meta:** `UserPromptSubmit` com p95 **abaixo de 300 ms**. Metas de apoio: `PostToolUse` e `PostToolUseFailure` p95 <
100 ms; `SessionStart` p95 < 500 ms; `Stop` p95 < 2 s; `SessionEnd` p95 < 1 s (o orçamento total é 1,5 s).

**Linha de base medida em 18/11 neste ambiente** (mediana de 7 execuções, processo novo):

| Import | Tempo |
|---|---|
| Python vazio | 13 ms |
| `json` + `sqlite3` | 23 ms |
| `pydantic` | 70 ms |
| `numpy` | 104 ms |
| `networkx` | 187 ms |

E um hook Python simples dentro do Claude Code levou de 24 a 32 ms (linhas `Hooks:` do `--debug-file`). Conclusão:
numpy e networkx juntos já estouram o orçamento; o caminho do `UserPromptSubmit` não pode importar networkx e só
pode importar numpy se a medição mostrar folga.

**Como medir.**

1. **Banco de carga:** gerar com dados sintéticos bancos de 100, 1.000 e 10.000 memórias (com relações e vetores).
2. **Micro (subprocesso):** para cada tamanho, 50 execuções de `hela-hook user-prompt-submit` com prompts variados;
   registrar p50, p95 e máximo. Separar **fria** (primeira execução depois de limpar o cache do Python e do banco)
   e **quente**.
3. **Dentro do Claude Code:** nas sessões do ponta a ponta, ler as linhas
   `Hooks: UserPromptSubmit [...] finished with status 0 (NNms)` do `--debug-file`.
4. **Imports:** `python -X importtime -m hela.integration.hook user-prompt-submit < fixture` e um teste que falha se
   `networkx` aparecer em `sys.modules` depois de atender um `UserPromptSubmit`.
5. **Prazo interno:** com um banco artificialmente lento (sleep injetado no teste), o hook sai em silêncio dentro
   do prazo e o prompt segue sem contexto.

**Aprovado se:** p95 quente < 300 ms com 10.000 memórias, p95 frio < 300 ms com 1.000 memórias, e nenhum
`UserPromptSubmit` acima de 1 s no ponta a ponta. O relatório traz a tabela completa.

## 7. Instalador com `HOME` temporário

Todo teste cria `HOME=$(mktemp -d)` (e `HELA_HOME` dentro dele) e roda o instalador de verdade. Onde o teste precisa
do `claude` (`claude mcp add`), usa o `claude` real com o `HOME` temporário, que funciona aqui.

| Teste | Preparação | Esperado |
|---|---|---|
| `test_instala_em_home_vazio` | `HOME` sem `.claude` | venv em `~/.hela/venv`, banco criado, skill em `~/.claude/skills/hela/SKILL.md`, 6 hooks no `settings.json`, MCP `hela` no `~/.claude.json` (`claude mcp get hela` responde), comando `hela` funciona |
| `test_instalador_preserva_settings` | `settings.json` com outros hooks (inclusive no mesmo evento), `permissions`, `env` e chaves desconhecidas | backup com data criado; tudo o que existia continua igual (comparação do JSON sem a chave da HELA); hooks da HELA acrescentados |
| `test_instalador_idempotente` | instalar duas vezes | segundo `settings.json` idêntico ao primeiro (hash); nenhum hook duplicado; um MCP `hela` só |
| `test_instalador_settings_invalido` | `settings.json` com JSON quebrado | instalador para com mensagem clara e **não mexe** em nada |
| `test_instalador_caminho_com_espaco` | `HOME` com espaço no nome | hooks na forma exec (`command` + `args`) funcionam |
| `test_instalador_atualiza` | instalar, gravar memórias, instalar versão nova | banco preservado, migração aplicada |
| `test_desinstala_sem_purge` | instalar, desinstalar | hooks e MCP da HELA removidos, os outros hooks intactos, skill removida, `~/.hela` preservado |
| `test_desinstala_purge_pede_confirmacao` | `uninstall --purge` sem `--yes` em modo não interativo | recusa; nada apagado |
| `test_desinstala_ordem` | desinstalar | hooks saem do `settings.json` antes do venv ser apagado |
| `test_guarda_home_real` | antes e depois da suíte | hash dos arquivos reais de `~/.claude` e `~/.hela` igual |

No PC do Paulo, a instalação real é feita uma vez, com ele olhando, depois de conferir o backup.

## 8. Comprovação da economia de tokens

A Parte A pede para separar **provedor**, **estimado**, **potencial** e **comprovado**, e nunca mostrar estimativa
como resultado. Este é o teste do "comprovado".

### 8.1 Desenho do experimento (assistido contra não assistido)

1. **Conjunto de tarefas:** 10 famílias de tarefas repetitivas, cada uma com 3 variações equivalentes (mesmo tipo,
   dados diferentes). Exemplos: conversor CSV→JSON; script de renderização em lote no Blender (simulado com Python);
   configurar `pytest` num projeto pequeno; corrigir um erro de import conhecido. Cada variação tem um **verificador
   determinístico** (um teste que diz se a tarefa ficou certa).
2. **Semeadura:** uma sessão por família, com a HELA ligada, para ela aprender (não entra na medição).
3. **Medição:** cada variação roda duas vezes, em sessões novas e independentes:
   - **assistida:** HELA ligada (hooks e MCP);
   - **não assistida:** mesmo `HOME`, mesmo modelo, mesmo prompt, com a HELA desligada (`HELA_DISABLED=1`, ou
     `--settings '{"disableAllHooks": true}'` mais `--strict-mcp-config` sem o `hela`).

   A ordem dos dois braços é sorteada em cada par.
4. **Métricas por sessão:** soma deduplicada do transcript (os 4 campos), conferida com o oráculo; `total_cost_usd`
   do `claude -p`; número de turnos; sucesso pelo verificador.
5. **Métrica principal:** diferença pareada de **tokens não cacheados** (`input` + `cache_creation` + `output`) e,
   em paralelo, de **custo em US$**. Os tokens lidos do cache entram no relatório, mas não na métrica principal
   (custam bem menos e distorcem a soma).

### 8.2 Análise

- Diferença por par: `d_i = não_assistida_i − assistida_i`.
- **Bootstrap** da média de `d_i`: 10.000 reamostras com semente fixa, intervalo de 95% por percentis.
- **Regra de qualidade (não inferioridade):** a economia só conta se a taxa de sucesso assistida for **maior ou igual**
  à não assistida. Par em que a assistida falhou e a outra não conta contra.
- **Veredito:**
  - IC inteiro acima de zero e qualidade mantida → **"comprovado"**, com o valor e o IC;
  - IC que inclui zero → **"inconclusivo"** (nunca "economia de X%");
  - IC inteiro abaixo de zero → **"a HELA gastou mais"**, publicado do mesmo jeito.

### 8.3 Testes do próprio cálculo (unidade, sem gasto)

| Teste | O que verifica |
|---|---|
| `test_bootstrap_semente_fixa` | mesma entrada e semente → mesmo IC |
| `test_bootstrap_sem_efeito_fica_inconclusivo` | 200 simulações com diferença real zero → "comprovado" em no máximo ~5% (taxa de falso positivo do IC de 95%) |
| `test_bootstrap_com_efeito_comprova` | diferença real grande e n = 30 → "comprovado" na grande maioria |
| `test_qualidade_pior_anula_economia` | assistida com menos sucesso → nunca "comprovado" |
| `test_rotulos_nunca_misturam` | a API e o dashboard devolvem os 4 rótulos separados; "estimado" (chars/4) nunca aparece no campo "comprovado" |
| `test_holdout_rate` | com `holdout_rate = 0,1` e semente fixa, cerca de 10% dos prompts elegíveis ficam sem contexto e são marcados como grupo de controle |

### 8.4 Custo e aprovação

30 pares (60 sessões) a US$ 0,10–0,50 cada: cerca de **US$ 6 a 30**. **Aguarda aprovação do Paulo.** Sem aprovação,
o relatório da Fase 7 entrega o cálculo testado com dados sintéticos e diz que a economia comprovada **ainda não foi
medida**. Com a HELA instalada no PC do Paulo, o `holdout_rate` junta dados reais com o tempo, sem custo extra.

### 8.5 Limites honestos

- Resposta de modelo varia muito: n pequeno tende a dar "inconclusivo". Isso é o resultado certo, não uma falha.
- Tarefas escolhidas por nós favorecem a HELA (são repetitivas de propósito). O relatório diz isso.
- O cache do provedor muda o custo entre sessões próximas; os braços são intercalados para diluir o efeito.

## 9. Critérios da seção 16 do prompt mestre, cada um com o teste que o comprova

| # | Critério | Teste que comprova | Onde |
|---|---|---|---|
| 1 | Core funcional | suíte de unidade de `storage`, `memory`, `security` verde; `Engine` sobe num `HELA_HOME` novo e responde `status` | seção 3 |
| 2 | Memórias persistentes | E3 passos 3 a 5 (fechar tudo, reabrir, sessão nova recupera); `test_instalador_atualiza` (banco sobrevive à atualização) | 5.2, 7 |
| 3 | Experiências registradas e recuperadas | 4.2 (fluxo completo sem o Claude) e E2 + E3 (com o Claude) | 4.2, 5 |
| 4 | Tarefas classificadas | unidade do `classifier` + no E2 a tarefa gravada tem categoria e complexidade; NB só com rótulos legítimos | 3, 5 |
| 5 | Aprendizado com resultados reais | ranker: estratégia A falha 5 vezes e B acerta 5 → B passa à frente; `evolution` só recomenda com Brier melhor; *rollback* exato; no E2/E3 o resultado da sessão A muda a recomendação da B | 3, 5.2 |
| 6 | Router seleciona contexto relevante | **conjunto-ouro** de 30 consultas com as memórias relevantes marcadas: recall@5 ≥ 0,8 e MRR ≥ 0,6; 20 consultas sem relação: "experiência insuficiente" em ≥ 90%; E3 passo 6 | 3, 5.2 |
| 7 | Optimizer reduz redundância sem perder qualidade | unidade (orçamento, código/comandos/caminhos/erros preservados, duplicatas fundidas) + regra de não inferioridade do 8.2 | 3, 8 |
| 8 | Procedimentos recomendados | `hela_procedure` devolve o procedimento da sessão A na sessão B com classe e status de aprovação; script não aprovado sai como "exige autorização humana" | 4.3, 5.2, seguranca A3 |
| 9 | Claude Code usa a HELA por Skill, MCP e Hooks | E1 (instalado), E4 (MCP chamado pelo Claude), E5 (skill carregada), E3 (contexto do hook no transcript) | 5 |
| 10 | Dashboard 3D funcional e conectado | Playwright: Brain Overview carrega, o canvas do three.js existe, número de neurônios = contagem da API = contagem do banco; console sem erro; capturas em 390 × 844, 1280 e 1920 | 10 |
| 11 | Dados reais na interface | grava uma memória com título-sentinela pelo `Engine`; ela aparece no Memory Management e no Neural Explorer dentro do intervalo de atualização; busca no build: nenhum `mock`/`faker`/dado de exemplo no código de produção | 10 |
| 12 | Administração de memórias | Playwright: buscar, editar (o banco muda e a redação vale), excluir (some do banco e da busca), organizar; cada escrita manda `X-HELA-Token` | 10, seguranca A4 |
| 13 | Instalador configura tudo | tabela da seção 7 inteira verde + E1 + E7 | 5, 7 |
| 14 | Uso reproduzível | instalação do zero num `HOME` limpo seguindo só o README; versões travadas por faixa; a suíte roda com um comando (`pytest`, `npm test`) | 7, 11 |
| 15 | Testes e documentação disponíveis | relatório da Fase 7 com a saída das suítes; README com instalação, uso, atualização, remoção, limites e segurança; `docs/api.md`, `docs/seguranca.md` e esta referência atualizados | 11 |

## 10. Dashboard (Fase 5b, revisão na Fase 7)

- Playwright (instalar no venv de teste: `pip install playwright` e `playwright install chromium`), com a API real
  sobre um banco sintético de 500 memórias.
- Caminho principal: abrir → Brain Overview → clicar num neurônio → detalhe no Neural Explorer → Memory Management →
  buscar → editar → excluir → Performance Center mostra os 4 rótulos separados → Engine Monitor.
- Casos de borda: banco vazio (estado vazio, sem erro); 10.000 memórias (a página continua usável; medir quadros por
  segundo); API fora do ar (mensagem clara); memória com HTML/script no texto (aparece como texto).
- Capturas em **390 × 844, 1280 e 1920**, depois de rolar devagar até o fim (regra de memória da Sabrina: conferir
  pela captura, não só pelo DOM). Console sem erro.
- Conferência com o Design System da Sofia: paleta verde sobre preto, **sem azul e sem roxo**, identidade original
  (nada da Marvel, nada de elmo de chifres). A Sofia faz a revisão visual.
- Acessibilidade básica: contraste, foco visível, navegação por teclado nas telas de administração, `prefers-reduced-
  motion` reduz as animações do cérebro.
- `npm run build` sem erro e o build servido pela API.

## 11. Relatório da Fase 7

Em `agentes/relatorios/sabrina/AAAA-MM-DD-hela-fase7.md`:

1. Veredito na primeira linha: aprovado, aprovado com ressalvas ou reprovado.
2. Saída das suítes (unidade, integração, ponta a ponta) e cobertura.
3. Tabela da seção 9 com cada critério e a evidência.
4. Tabela de latência (seção 6).
5. Resultado da economia: "comprovado" com IC, "inconclusivo" ou "não medido" (seção 8).
6. Revisão de segurança (`docs/seguranca.md`, seção 5) e achados por gravidade, cada um com a dona.
7. Capturas do dashboard.
8. O que não foi testado e por quê (o interativo, Windows/macOS, o que dependeu de aprovação).
