# HELA · Referência do Claude Code para a integração (Fase 4)

Conferido em 18/11/2026 pela Sabrina, no Claude Code **2.1.327**, com a documentação oficial em
`code.claude.com/docs` e testes reais neste ambiente. A Karol segue este arquivo na Fase 4.

**Legenda de certeza**

- **[doc]** lido na documentação oficial (link na seção).
- **[testado]** visto funcionando aqui: hook real com `claude -p`, cliente MCP do SDK ou transcript real.
- **[não confirmado]** não deu para provar; não tratar como fato.

Páginas lidas (todas em 18/11/2026):

- Hooks: <https://code.claude.com/docs/en/hooks>
- Skills: <https://code.claude.com/docs/en/skills>
- MCP: <https://code.claude.com/docs/en/mcp>
- Settings: <https://code.claude.com/docs/en/settings>
- Permissões: <https://code.claude.com/docs/en/permissions>
- Diretório `~/.claude`: <https://code.claude.com/docs/en/claude-directory>
- CLI: <https://code.claude.com/docs/en/cli-reference>

As páginas existem em Markdown puro trocando o final do endereço por `.md` (por exemplo `.../docs/en/hooks.md`). É o
jeito mais rápido de reconferir.

## 0. O que mudou em relação à Parte C (leia primeiro)

| # | Parte C dizia | O que vale | Certeza |
|---|---|---|---|
| 1 | `from mcp.server.fastmcp import FastMCP` funciona como alternativa | No mcp 2.3.0 o módulo **existe só para dar erro**: importar levanta `ModuleNotFoundError` com a mensagem de migração. O import compatível tem de tentar **primeiro** o v2 e cair no v1 | [testado] |
| 2 | Exceções são `ToolError` | No v2, **exceção que não é `ToolError` vira só `Error executing tool <nome>`**: a mensagem some. No v1 ela passava inteira. Erro previsto tem de ser `ToolError` | [testado] |
| 3 | Deduplicar por `message.id` **ou `requestId`** | `requestId` faltou em 5% e em 22% das linhas `assistant` dos dois transcripts. Use **só `message.id`** | [testado] |
| 4 | Tokens estão no transcript da sessão | Os de **subagentes** ficam em outro arquivo: `<sessão>/subagents/agent-*.jsonl` | [testado] [doc] |
| 5 | Erro de ferramenta chega no `PostToolUseFailure` | Vale também para **Bash com saída diferente de 0**: não há `tool_response`, só `error` (texto que começa com `Exit code N`) | [testado] |
| 6 | `suppressOutput` | A documentação atual diz: **"Has no effect"**. Não conte com ele | [doc] |
| 7 | Hooks em `settings.json` sempre rodam | Em sessão **interativa**, os hooks (até os do `~/.claude/settings.json`) **só rodam depois de aceitar a confiança da pasta**. No `-p` a pasta conta como confiável | [doc] |
| 8 | Hooks `async: true` para tarefas longas | No `-p`, hook async ainda rodando no fim é **cancelado**. E, se imprimir `additionalContext`, ele **é entregue** no turno seguinte | [doc] |
| 9 | As ferramentas MCP aparecem como `mcp__hela__hela_recall` | Certo, mas elas são **adiadas** (tool search): o Claude chama `ToolSearch` antes de usar. E os hooks `PostToolUse` **disparam também para as ferramentas da própria HELA** | [testado] |
| 10 | `SessionStart` traz `model` | No `-p` o `SessionStart` veio **sem `model` e sem `permission_mode`** | [testado] |

As armadilhas completas estão na seção 7.

## 1. Hooks

### 1.1 Onde ficam e como se mesclam [doc]

| Local | Alcance |
|---|---|
| `~/.claude/settings.json` | todos os projetos do usuário |
| `.claude/settings.json` | um projeto (vai para o git) |
| `.claude/settings.local.json` | um projeto (fora do git) |
| frontmatter de skill | **só depois que a skill é invocada**, e dali até o fim da sessão |

- Hooks de níveis diferentes **se somam**, não se substituem.
- O **mesmo handler** definido em mais de um arquivo **roda uma vez só**. Isso ajuda a idempotência do instalador, mas
  ele ainda deve evitar entrada duplicada no mesmo arquivo.
- `--settings <arquivo-ou-json>` na linha de comando entra acima do projeto e do usuário, só naquela sessão. É o jeito
  de testar sem mexer no `~/.claude` real.
- Edição direta no `settings.json` costuma ser lida sozinha (o Claude Code observa o arquivo).
- `"disableAllHooks": true` desliga tudo. Não existe desligar um hook só.
- `--bare` **pula os hooks**: não use nos testes da HELA.

A captura contínua da HELA vai no `~/.claude/settings.json` (o instalador mescla com backup). Hook declarado na skill
não serve, porque só passa a valer quando a skill é chamada.

### 1.2 Formato da configuração [doc] [testado]

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/home/<usuário>/.hela/venv/bin/hela-hook",
            "args": ["user-prompt-submit"],
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "/home/<usuário>/.hela/venv/bin/hela-hook", "args": ["post-tool-use"], "timeout": 5 }
        ]
      }
    ]
  }
}
```

- **`args` presente = forma exec**: sem shell, cada item é um argumento. É a forma recomendada para a HELA: caminho
  com espaço não quebra e não há interpretação de `$` ou crase. Sem `args`, o `command` roda em `sh -c`.
- Use **caminho absoluto** para o `hela-hook`. Na forma exec, um nome solto é procurado no `PATH` do Claude Code, que
  pode não ter `~/.local/bin`.
- `timeout` é em **segundos**.
- Campos do handler `command`: `type`, `command`, `args`, `timeout`, `async`, `asyncRewake`, `shell`, `onFailure`,
  `if`, `statusMessage`, `once` (este só vale em skill).
- `onFailure: "block"` faz a falha do hook bloquear a ação. **A HELA nunca usa** (fail-open).
- O processo do hook recebe `CLAUDE_PROJECT_DIR` no ambiente.

**Matcher** [doc]:

- `"*"`, `""` ou ausente: casa com tudo.
- Só letras, dígitos, `_`, `-`, espaço, `,` e `|`: lista de nomes exatos (`Edit|Write`).
- Qualquer outro caractere: expressão regular JavaScript **sem âncora** (`Edit.*` casa com `NotebookEdit`; use `^Edit$`).
- `mcp__hela` sem `.*` é nome exato e **não casa com nada**. Para as ferramentas da HELA: `mcp__hela__.*`.
- `UserPromptSubmit` e `Stop` não aceitam matcher (é ignorado). `SessionStart` casa com `source`; `SessionEnd`, com
  `reason`; os eventos de ferramenta, com `tool_name`.

### 1.3 Campos comuns de entrada [doc] [testado]

Todo evento recebe pelo stdin um objeto JSON com:

| Campo | Observação |
|---|---|
| `session_id` | id da sessão |
| `transcript_path` | caminho do `.jsonl`. **Escrito de forma assíncrona: pode estar atrasado** em relação à conversa |
| `cwd` | diretório atual |
| `hook_event_name` | nome do evento |
| `prompt_id` | UUID do prompt atual; **ausente antes do primeiro prompt** (não veio no `SessionStart`) |
| `scratchpad_dir` | pode faltar (v2.1.257+) |
| `permission_mode` | **nem todo evento recebe** (não veio no `SessionStart` nem no `SessionEnd`) |
| `effort` | objeto `{"level": ...}` nos eventos com contexto de ferramenta e no `Stop` |
| `agent_id`, `agent_type` | só dentro de subagente ou com `--agent` |

Regra para o parser: **todos os campos são opcionais**. Use `.get()` e nunca falhe por campo ausente.

Chaves vistas de verdade aqui, por evento [testado]:

| Evento | Chaves recebidas |
|---|---|
| `SessionStart` | `cwd`, `hook_event_name`, `scratchpad_dir`, `session_id`, `source`, `transcript_path` |
| `UserPromptSubmit` | `cwd`, `hook_event_name`, `permission_mode`, `prompt`, `prompt_id`, `scratchpad_dir`, `session_id`, `transcript_path` |
| `PostToolUse` | as comuns + `duration_ms`, `effort`, `tool_input`, `tool_name`, `tool_response`, `tool_use_id` (+ `mcp_server` em ferramenta MCP) |
| `PostToolUseFailure` | as comuns + `duration_ms`, `effort`, `error`, `is_interrupt`, `tool_input`, `tool_name`, `tool_use_id` (+ `mcp_server`) |
| `Stop` | as comuns + `background_tasks`, `effort`, `last_assistant_message`, `session_crons`, `stop_hook_active` |
| `SessionEnd` | `cwd`, `hook_event_name`, `prompt_id`, `reason`, `scratchpad_dir`, `session_id`, `transcript_path` |

### 1.4 Entrada específica de cada evento

**`SessionStart`** [doc] [testado]

- `source` ∈ `startup` | `resume` | `clear` | `compact` | `fork`.
- `model`: **opcional** (não veio no `-p`).
- `agent_type`, `session_title`: opcionais.
- Em `resume`/`fork` com resposta anterior: `seconds_since_last_response`, `context_tokens`,
  `prompt_cache_likely_expired`, `estimated_cache_write_usd`.
- Só aceita `type: "command"` e `"mcp_tool"`. Roda em segundo plano no início interativo, mas a primeira resposta do
  Claude espera por ele.

**`UserPromptSubmit`** [doc] [testado]

- `prompt`: texto enviado. Texto colado vem expandido, às vezes entre linhas `<pasted_content id="…">` e
  `</pasted_content id="…">`.
- Comando de skill (`/deploy x`) chega como foi digitado, não expandido.
- **Também dispara** em tarefa agendada, `/loop`, retorno de subagente em segundo plano e mensagem de outra sessão.
  A HELA não deve tratar todo `UserPromptSubmit` como "o usuário pediu uma tarefa nova".
- Timeout padrão: **30 s** (não 600). Estourou: a saída é descartada e o prompt segue sem contexto.

**`PostToolUse`** [doc] [testado]

- `tool_name`, `tool_input`, `tool_response`, `tool_use_id`, `duration_ms` (opcional).
- Só dispara em **sucesso**. Bash com saída diferente de 0 é falha (vai para `PostToolUseFailure`).
- Caminhos de `Write`, `Edit` e `Read` em `tool_input.file_path` chegam **sempre absolutos**, com o separador do
  sistema (barra invertida no Windows).
- Em ferramenta MCP: `mcp_server: {"name": ..., "source": ...}` (v2.1.274+). Decidir confiança por `source`, não por
  nome.

**`PostToolUseFailure`** [doc] [testado]

- `tool_name`, `tool_input`, `tool_use_id`, `error` (texto), `is_interrupt` (opcional), `duration_ms` (opcional).
- **Não há `tool_response`.**
- Bash: a primeira linha de `error` é `Exit code N`; depois vem stdout e stderr misturados. Texto longo é cortado no
  meio com `... [N characters truncated] ...`. Use só `tool_name`, `is_interrupt` e a linha `Exit code N` como dado
  estável; o resto é texto de exibição.
- Ferramenta MCP com `isError: true`: dispara aqui, com `error` = o texto do erro
  (`Error executing tool hela_eco: vezes precisa ser >= 1`).
- **Não dispara** para chamada recusada antes de rodar (ferramenta desconhecida, entrada inválida, permissão negada).

**`Stop`** [doc] [testado]

- `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`.
- Use `last_assistant_message` em vez de ler o transcript: no `Stop` o transcript pode não ter a última mensagem.
- Não dispara quando o usuário interrompe. Erro de API dispara `StopFailure`, não `Stop`.

**`SessionEnd`** [doc] [testado]

- `reason` ∈ `clear` | `resume` | `logout` | `prompt_input_exit` | `other` (no `-p` veio `other`).
- Saída descartada; não bloqueia nada.

### 1.5 Formato de `tool_response` por ferramenta [testado]

A documentação não publica o esquema completo; os formatos abaixo foram vistos no hook real (`claude -p` 2.1.327) e
batem com o campo `toolUseResult` dos transcripts desta máquina (milhares de chamadas). Tratar como **estável na
forma, não garantido**: o parser aceita campo a mais ou a menos.

| Ferramenta | `tool_response` |
|---|---|
| **Bash** | `{"stdout": str, "stderr": str, "interrupted": bool, "isImage": bool, "noOutputExpected": bool}` e às vezes `returnCodeInterpretation`, `staleReadFileStateHint`, `backgroundTaskId`, `backgroundCwdHint`, `timedOutAfterMs`, `bashEditDiff` (v2.1.269+, beta). **Não traz o código de saída**: sucesso é o próprio evento |
| **Read** (texto) | `{"type": "text", "file": {"filePath", "content", "numLines", "startLine", "totalLines"}}`, às vezes com `truncatedByTokenCap` |
| **Read** (imagem) | `{"type": "image", "file": {"base64", "type", "originalSize", "dimensions": {...}}}`. **Não guardar o base64** |
| **Read** (PDF em páginas) | `{"type": ..., "firstPage": int, "file": {"count", "filePath", "originalSize", "outputDir"}}` |
| **Write** | `{"type": "create" ou "update", "filePath", "content", "originalFile": str ou null, "structuredPatch": [...], "userModified": bool}`, às vezes `gitDiff` |
| **Edit** | `{"filePath", "oldString", "newString", "originalFile": str ou null, "structuredPatch": [...], "userModified": bool, "replaceAll": bool}`, às vezes `contentNotInModelContext` |
| **MCP** | **uma lista** de blocos de conteúdo: `[{"type": "text", "text": "..."}]` |

`structuredPatch` é uma lista de `{"oldStart", "oldLines", "newStart", "newLines", "lines": [str]}`.

`originalFile` traz **o arquivo inteiro antes da mudança** e `content` traz o arquivo inteiro depois. A HELA guarda o
caminho, o tipo e um resumo do patch, nunca o arquivo inteiro (custo e risco de segredo).

### 1.6 Saída do hook [doc]

- **Exit 0** = sucesso. Se o stdout for **um único objeto JSON** (com nada em volta além de espaço), os campos valem.
  Texto puro no stdout vira contexto em `SessionStart` e `UserPromptSubmit`; nos outros eventos é ignorado.
- **Exit 2** = bloquear. **A HELA nunca usa.** No `PostToolUse` mostra o stderr ao Claude; no `Stop` faz o Claude
  continuar.
- **Outro código** = erro não bloqueante (aparece um aviso `hook error` na transcrição).
- JSON inválido com exit 0 = erro não bloqueante. Linha extra no stdout (um `print` de depuração, um aviso do
  `.bashrc`) **estraga o JSON**. O `hela-hook` só escreve no stdout no final, uma vez.
- stderr de hook com exit 0 o Claude nunca vê.

Formato para dar contexto ao Claude:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "texto factual"
  }
}
```

- `hookEventName` é obrigatório dentro de `hookSpecificOutput`.
- `additionalContext` vira um *system reminder* ao lado do prompt (ou no início da conversa no `SessionStart`).
- Limite: **10.000 caracteres por campo**. Acima disso o texto vai para um arquivo e o Claude vê o caminho e só os
  primeiros 2.000. Não há como aumentar. A HELA corta antes, no Context Optimizer.
- `<system-reminder>` dentro do texto tem o `<` trocado por `&lt;`.
- **Escreva fatos, não ordens.** Texto com cara de instrução de sistema aciona a defesa contra injeção e o Claude
  mostra o texto ao usuário em vez de usá-lo.
- Contexto injetado fica salvo no transcript; no `--resume` ele é **reaproveitado, não recalculado**.

Campos universais: `continue` (padrão `true`), `stopReason`, `suppressOutput` (**sem efeito**), `systemMessage`
(aviso ao usuário), `terminalSequence`.

**Decisões que a HELA não usa**: `decision: "block"` (em `UserPromptSubmit` bloqueia o prompt; em `Stop` faz o Claude
continuar), `updatedToolOutput`, `continue: false`.

**O que cada hook da HELA imprime**

| Evento | Imprime |
|---|---|
| `SessionStart` | JSON com `additionalContext` curto (ou nada) |
| `UserPromptSubmit` | JSON com `additionalContext` só quando há memória relevante; senão, nada |
| `PostToolUse`, `PostToolUseFailure` | **nada** |
| `Stop` | **nada** (qualquer `additionalContext` ou `decision` faz o Claude continuar o turno) |
| `SessionEnd` | nada (é descartado) |

### 1.7 Timeouts [doc]

| Caso | Valor |
|---|---|
| `command` padrão | 600 s |
| `UserPromptSubmit` | **30 s** (também `PreModelSwitch`, `PostModelSwitch`) |
| `SessionEnd` | **1,5 s divididos entre todos os hooks**. Um `timeout` maior por hook sobe o orçamento até 60 s; `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` também |
| `PostToolUse` depois de interrupção com `Ctrl+Enter` | 10 s, depois o hook é morto |
| Hook com `async: true` | sem timeout |

Hook que estoura o tempo é cancelado e a saída é descartada; a ação segue (fail-open natural).

### 1.8 `async: true` [doc]

- Só em `type: "command"`. O Claude segue sem esperar.
- Não pode bloquear nem decidir nada.
- Se o processo imprimir JSON com `additionalContext` ou `systemMessage`, isso **chega ao Claude no turno seguinte**.
  Hook async da HELA não imprime nada.
- No `claude -p`, hook async ainda rodando no fim da sessão é **cancelado**. Trabalho que precisa terminar deve
  disparar um processo totalmente destacado, ou ser síncrono e rápido.
- Recomendação: `PostToolUse` e `PostToolUseFailure` **síncronos com `timeout: 5`** (um INSERT leva poucos ms). Assim a
  captura não se perde no `-p` dos testes.

### 1.9 Depuração e medição de latência [doc] [testado]

`claude --debug-file <arquivo>` grava linhas assim (vistas aqui):

```text
Hooks: UserPromptSubmit [command hook] finished with status 0 (25ms)
Hooks: PostToolUse:Bash [command hook] finished with status 0 (24ms)
```

É a fonte para medir a latência real de cada hook dentro do Claude Code (v2.1.296+).

## 2. Skills

Fonte: <https://code.claude.com/docs/en/skills> [doc]

- Local: `~/.claude/skills/<nome>/SKILL.md` (pessoal) ou `.claude/skills/<nome>/SKILL.md` (projeto).
- O frontmatter só é lido se o `---` de abertura for **a primeira linha**. YAML inválido: a skill carrega **sem
  nenhum campo**.
- Campo desconhecido é ignorado sem erro. Booleanos aceitam `true/false/yes/no/on/off/1/0`.
- Corpo: manter **abaixo de 500 linhas**; material longo em arquivos de apoio na mesma pasta.

| Campo | Para que serve | Limite / padrão |
|---|---|---|
| `name` | nome do comando; padrão é o nome da pasta | sem `<`, `>`, caractere invisível ou de controle, espaço duplo |
| `description` | o que faz e quando usar; o Claude decide por ele | `description` + `when_to_use` **cortados em 1.536 caracteres** na listagem |
| `when_to_use` | gatilhos e exemplos; somado à descrição | conta nos 1.536 |
| `argument-hint` | dica no autocompletar | |
| `arguments` | nomes para `$nome` | |
| `disable-model-invocation` | só o usuário invoca | padrão `false` |
| `user-invocable` | `false` esconde do menu `/` | padrão `true` |
| `allowed-tools` | ferramentas sem pedir permissão **no turno** da invocação | some na mensagem seguinte |
| `disallowed-tools` | tira ferramentas enquanto a skill está ativa | |
| `model` | modelo no resto do turno | |
| `effort` | `low`…`max` no resto do turno | |
| `context` | `fork` roda num subagente | |
| `agent` | tipo de subagente com `context: fork` | |
| `background` | com `fork`; `false` espera o resultado | padrão `true` |
| `hooks` | hooks registrados ao invocar (até o fim da sessão) | 1.024 hooks por fonte |
| `paths` | globs que limitam quando a skill ativa sozinha | |
| `shell` | `bash` ou `powershell` para `` !`cmd` `` | |
| `metadata` | mapa livre | |
| `license` | | aceito, sem efeito |
| `compatibility` | | até 500 caracteres, sem efeito |

Outros pontos:

- Substituições no corpo: `$ARGUMENTS`, `$0`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`.
- O conteúdo da skill entra uma vez na conversa e fica. Depois de uma compactação, só os primeiros **5.000 tokens** de
  cada skill voltam (orçamento total de 25.000). As regras essenciais vão no começo do `SKILL.md`.
- Para a skill da HELA servir também em claude.ai, use só `name`, `description`, `license`, `compatibility`,
  `metadata` e `allowed-tools`. Os outros campos dão erro no upload.
- Para pré-aprovar as ferramentas MCP da HELA: `allowed-tools: mcp__hela__*` (regra de permissão aceita glob depois
  de `mcp__<servidor>__`). [doc, não testado na skill]

## 3. MCP

Fonte: <https://code.claude.com/docs/en/mcp> [doc] e `claude mcp --help` [testado]

### 3.1 Comandos

```bash
claude mcp add --scope user hela -- /home/<usuário>/.hela/venv/bin/hela-mcp   # [testado com o servidor de exemplo]
claude mcp list                     # lista e faz health check   [testado: "√ Connected"]
claude mcp get hela
claude mcp remove --scope user hela # sem --scope, remove de qualquer escopo que tenha
claude mcp add-json --scope user hela '{"type":"stdio","command":"...","args":[]}'
```

- Tudo depois de `--` vai para o servidor sem ser lido pelo `claude` (inclusive `-I`).
- `-e/--env CHAVE=valor` define variável do servidor. Depois de `--env`, coloque outra opção antes do nome.
- `-t/--transport`: `stdio` (padrão), `sse`, `http`.

### 3.2 Escopos

| Escopo | Onde fica | Alcance |
|---|---|---|
| `local` (padrão) | `~/.claude.json`, em `projects["<caminho>"].mcpServers` | só o projeto atual, só o usuário |
| `project` | `.mcp.json` na raiz do projeto | o projeto, para todos (git) |
| `user` | `~/.claude.json`, em `mcpServers` | todos os projetos do usuário |

O que o `--scope user` gravou no `~/.claude.json` do HOME de teste [testado]:

```json
{
  "mcpServers": {
    "hela": { "type": "stdio", "command": "/caminho/venv/bin/python", "args": ["-I", "/caminho/servidor.py"], "env": {} }
  }
}
```

`.mcp.json` tem o mesmo formato (`{"mcpServers": {...}}`), aceita `${VAR}` e `${VAR:-padrão}` em `command`, `args`,
`env`, `url` e `headers`, e pede aprovação no modo interativo.

Precedência por nome: local > project > user > plugin > conectores do claude.ai. A entrada vencedora é usada inteira,
sem mesclar campos.

O servidor stdio recebe `CLAUDE_PROJECT_DIR` no ambiente. Ao desligar, recebe `SIGINT`, depois `SIGTERM` 100 ms depois,
depois `SIGKILL` 400 ms depois: gravar estado ao sair tem de ser rápido.

### 3.3 Como o Claude vê as ferramentas [doc] [testado]

- Nome: `mcp__<servidor>__<ferramenta>`, isto é, `mcp__hela__hela_recall`.
- **Tool search está ligado por padrão**: as ferramentas MCP são adiadas e o Claude chama `ToolSearch` antes de usar
  (visto no teste). Consequências:
  - as `instructions` do servidor e o começo da descrição de cada ferramenta precisam ter as palavras que o Claude vai
    buscar ("memória", "experiência", "procedimento");
  - para carregar uma ferramenta já no início: `_meta: {"anthropic/alwaysLoad": true}` (candidata: `hela_recall`).
- Limites de texto: `instructions` do servidor e descrição de ferramenta carregada no início, **4.096 caracteres**;
  descrição de ferramenta carregada por busca, 16.384.

### 3.4 Tamanho da saída [doc]

- Padrão: **25.000 tokens** (`MAX_MCP_OUTPUT_TOKENS`). Aviso no visualizador a partir de 10.000 tokens.
- Resultado de texto com mais de **50.000 caracteres** vai para um arquivo e o Claude recebe só o caminho, seja qual
  for o número de tokens. Uma ferramenta pode subir isso com `_meta: {"anthropic/maxResultSizeChars": N}` (até
  500.000).
- A HELA devolve resultados compactos (orçamento do Context Optimizer), bem abaixo disso.

### 3.5 Como os erros aparecem para o Claude [doc] [testado]

- Resultado com `isError: true`: o Claude recebe o texto como mensagem de erro da ferramenta. Erro com mais de cerca
  de 11.000 caracteres fica só com os primeiros e os últimos 5.000.
- O que o Claude recebeu de fato no teste com `claude -p` e o servidor de exemplo:

| Caso | Texto recebido pelo Claude |
|---|---|
| sucesso | `{"texto": "abab", "tamanho": 4}` |
| `raise ToolError("vezes precisa ser >= 1")` | `Error executing tool hela_eco: vezes precisa ser >= 1` |
| `raise RuntimeError("detalhe interno")` (v2) | `Error executing tool hela_quebra` (mensagem escondida) |
| o mesmo no mcp v1 | `Error executing tool hela_quebra: detalhe interno` (**vaza**) |
| argumento de tipo errado | `Error executing tool hela_eco: 1 validation error for hela_ecoArguments ...` (mostra o valor enviado) |
| ferramenta inexistente | `Unknown tool: nao_existe` |

- No transcript, o erro MCP aparece como texto `Error: ...` no `toolUseResult`; o sucesso, como lista de blocos.

### 3.6 SDK Python `mcp` 2.3.0 [testado]

Instalado num venv temporário; `mcp<2` resolveu para 1.30.0 e foi usado para a comparação.

| Item | mcp 2.3.0 | mcp 1.30.0 |
|---|---|---|
| Classe do servidor | `from mcp.server.mcpserver import MCPServer` | `from mcp.server.fastmcp import FastMCP` |
| `mcp.server.fastmcp` | **levanta `ModuleNotFoundError`** com mensagem de migração | funciona |
| `ToolError` | `mcp.server.mcpserver.exceptions.ToolError` | `mcp.server.fastmcp.exceptions.ToolError` |
| Exceção não prevista | vira `UnexpectedToolError("Error executing tool <nome>")`, sem a mensagem | a mensagem passa |
| `@server.tool()` | igual; aceita `name`, `title`, `description`, `annotations`, `icons`, `meta`, `structured_output` | igual no 1.30.0 (mesma assinatura) |
| `instructions=` no construtor | igual | igual |
| `server.run("stdio")` | igual (`"stdio"`, `"sse"`, `"streamable-http"`) | igual |
| Tipos | pacote separado `mcp_types`; atributos em snake_case (`is_error`, `structured_content`) | `mcp.types`; camelCase (`isError`) |

**Servidor de exemplo (27 linhas com a docstring), testado com o cliente do SDK por stdio nos dois SDKs:**
`docs/exemplos/servidor_mcp_minimo.py`. O núcleo do import compatível:

```python
try:  # mcp 2.x
    from mcp.server.mcpserver import MCPServer as Servidor
    from mcp.server.mcpserver.exceptions import ToolError
except ImportError:  # mcp 1.x (ModuleNotFoundError é subclasse de ImportError)
    from mcp.server.fastmcp import FastMCP as Servidor
    from mcp.server.fastmcp.exceptions import ToolError
```

A ordem importa: tentar o v1 primeiro também funcionaria (o `ModuleNotFoundError` cai no `except`), mas o v2 primeiro
evita carregar o módulo de erro e deixa claro qual é o caminho principal.

**Cliente de teste (o mesmo nos dois SDKs):**

```python
import asyncio, sys
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

async def main():
    params = StdioServerParameters(command=sys.executable, args=["servidor_mcp_minimo.py"])
    async with stdio_client(params) as streams:
        async with ClientSession(streams[0], streams[1]) as s:
            await s.initialize()
            print([t.name for t in (await s.list_tools()).tools])
            r = await s.call_tool("hela_eco", {"texto": "ab", "vezes": 0})
            print(r.is_error if hasattr(r, "is_error") else r.isError, r.content[0].text)

asyncio.run(main())
```

No v2 também existe `from mcp import Client` (aceita `StdioServerParameters` ou, em teste, a própria instância do
`MCPServer` em processo).

**Saída estruturada** [testado no v2]:

- retorno `-> dict` gera só texto (JSON formatado), sem `structured_content`;
- retorno tipado (`TypedDict`, modelo pydantic, `dict[str, str]`) gera `output_schema` e `structured_content`;
- `@server.tool(structured_output=True)` com `-> dict` puro **falha ao iniciar** (`InvalidSignature`);
- `meta={"anthropic/maxResultSizeChars": 200000}` aparece como `_meta` no `tools/list`.

**Cuidados**:

- O servidor stdio **não pode escrever nada no stdout** além do protocolo. Log vai para stderr ou arquivo.
- Rodar Python com `-I` e com os scripts fora da pasta de trabalho: aqui um arquivo de teste chamado `attrs.py`
  na mesma pasta do script **sombreou o pacote `attrs`** e derrubou o servidor v1 na inicialização.

## 4. Transcript JSONL e tokens

Fontes: <https://code.claude.com/docs/en/claude-directory> [doc] e a estrutura de chaves de dois transcripts reais
desta máquina (10 mil e 50 mil linhas) mais os do HOME de teste [testado]. Nenhum conteúdo de conversa foi copiado.

### 4.1 Onde ficam [doc]

- `~/.claude/projects/<projeto>/<sessão>.jsonl`: a conversa (o `<projeto>` é o caminho com `/` trocado por `-`).
- `~/.claude/projects/<projeto>/<sessão>/subagents/agent-<id>.jsonl`: **cada subagente**, mesmo formato.
- Podem surgir `<sessão>.orphaned-<data>-<sufixo>.jsonl` e `<sessão>.jsonl.superseded-<data>`: transcript anterior
  posto de lado.
- Texto em claro, sem criptografia. Tudo o que passa por uma ferramenta vai para lá.
- `claude -p --no-session-persistence` (ou `CLAUDE_CODE_SKIP_PROMPT_HISTORY`) **não grava transcript**: sem
  transcript, sem contabilidade de tokens do provedor.

### 4.2 Linhas `type: "assistant"` [testado]

Cada linha é um objeto JSON. Tipos de linha vistos: `user`, `assistant`, `attachment`, `system`, `queue-operation`,
`last-prompt`, `mode`, `custom-title`, `agent-name`, `cost-state`, `tools-used` e outros internos. **Ignore tudo
que não for `assistant`** para tokens.

Chaves de topo de uma linha `assistant` (sempre): `type`, `uuid`, `parentUuid`, `sessionId`, `timestamp`,
`isSidechain`, `message`, `cwd`, `gitBranch`, `entrypoint`. Frequentes: `requestId`, `version`, `effort`,
`requestedModel`, `apiBlockIndex`, `slug`, `userType`. Em subagente: `agentId` e `isSidechain: true`. Em erro de API:
`isApiErrorMessage`, `apiError`, `apiErrorStatus`, `error`.

Chaves de `message`: `id`, `type`, `role`, `model`, `content`, `stop_reason`, `stop_sequence`, `usage` e algumas
internas (`container`, `context_management`, `diagnostics`, `stop_details`).

`message.content` é uma lista de blocos `thinking`, `text` ou `tool_use`. **Uma resposta da API com N blocos vira
N linhas, todas com o mesmo `message.id` e o mesmo `usage`.** Nos dois transcripts, 5.183 ids repetidos tinham
`usage` idêntico em todas as linhas e nenhum tinha valores diferentes.

### 4.3 `message.usage` [testado]

```json
{
  "input_tokens": 12,
  "cache_creation_input_tokens": 9793,
  "cache_read_input_tokens": 212354,
  "output_tokens": 603,
  "cache_creation": { "ephemeral_5m_input_tokens": 0, "ephemeral_1h_input_tokens": 0 },
  "output_tokens_details": { "thinking_tokens": 0 },
  "server_tool_use": { "web_search_requests": 0, "web_fetch_requests": 0 },
  "iterations": [ { "...": "mesmas chaves de tokens por iteração" } ],
  "service_tier": "standard",
  "inference_geo": "...",
  "speed": "...",
  "fallback_credit": null
}
```

(Os números acima são do teste com HOME isolado, não de uma conversa do Paulo.)

- Os quatro campos de soma são `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` e
  `output_tokens`. Os outros podem ser `null` ou faltar (linhas sintéticas e versões antigas).
- `output_tokens_details.thinking_tokens`: **[não confirmado]** se já está dentro de `output_tokens`. Não somar os dois.

### 4.4 Deduplicar por `message.id` [testado]

```python
import json

CAMPOS = ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens")

def somar_tokens(caminho: str, offset: int = 0) -> tuple[dict[str, int], int, int]:
    """Soma o usage das linhas assistant a partir de `offset`, uma vez por message.id.

    Devolve (totais, mensagens contadas, novo offset). O novo offset para no fim da última linha
    completa: o transcript é escrito de forma assíncrona e a última linha pode estar pela metade.
    """
    vistos: set[str] = set()
    total = dict.fromkeys(CAMPOS, 0)
    with open(caminho, "rb") as f:
        f.seek(offset)
        pos = offset
        for linha in f:
            if not linha.endswith(b"\n"):
                break  # linha incompleta: fica para a próxima leitura
            pos += len(linha)
            try:
                o = json.loads(linha)
            except ValueError:
                continue
            if o.get("type") != "assistant" or o.get("isApiErrorMessage"):
                continue
            m = o.get("message") or {}
            mid, u = m.get("id"), m.get("usage")
            if not mid or not u or mid in vistos:
                continue
            vistos.add(mid)
            for c in CAMPOS:
                total[c] += u.get(c) or 0
    return total, len(vistos), pos
```

Prova: esta função (copiada daqui e executada) deu, nas 3 sessões de teste com `claude -p`, exatamente o mesmo
`usage` que o `claude -p --output-format json` informou no fim. Exemplo: 6 chamadas à API em 7 linhas `assistant`,
`input` 12, `cache_creation` 9.793, `cache_read` 212.354, `output` 603. Sem deduplicar, a linha repetida contaria
duas vezes. Esse `usage` do `--output-format json` é o **oráculo** dos testes da Fase 7.

Cuidados:

- O `vistos` precisa valer **por sessão**, não por chamada: uma resposta pode ter linhas antes e depois do offset.
  Guarde os ids já contados da sessão (ou o último `message.id` contado) junto com o offset.
- Se o tamanho do arquivo ficar **menor** que o offset salvo, o transcript foi trocado: recomece do zero com os ids
  já vistos.
- Para incluir subagentes, some também `<sessão>/subagents/*.jsonl` (cada arquivo tem os seus `message.id`).
- `requestId` falta em parte das linhas: não use como chave.
- Ler um transcript de 500 MB inteiro levou cerca de 2 s aqui. Com offset, o custo por turno é pequeno, mas não faça
  essa leitura dentro do `UserPromptSubmit` (meta de 300 ms): faça no `Stop` ou no `SessionEnd`, ou em processo
  destacado.

### 4.5 `toolUseResult` nas linhas `user` [testado]

Linhas `user` que respondem a uma ferramenta trazem `toolUseResult` com o mesmo formato do `tool_response` do hook
(seção 1.5). Em erro, `toolUseResult` é um texto que começa com `Error:`.

### 4.6 Como provar que o contexto da HELA chegou ao Claude [testado]

O transcript guarda linhas `type: "attachment"` para cada hook:

- `attachment.type == "hook_additional_context"`, com `hookEvent`, `hookName` e `content` (o texto injetado);
- `attachment.type == "hook_success"`, com `hookEvent`, `exitCode`, `durationMs`, `stdout` e `stderr`.

No teste do `SessionStart`, o texto injetado apareceu nas duas. É a evidência objetiva para o ponta a ponta: "a
sessão B recebeu a memória criada na sessão A". Lembrete de segurança: esse texto fica em claro no transcript.

## 5. Teste real com o `claude` neste ambiente [testado]

- O `claude` 2.1.327 **está autenticado aqui** e funciona com `HOME` isolado. A autenticação vem do ambiente da sessão
  na nuvem (variáveis de ambiente e proxy), não de arquivo no `~/.claude`, por isso um `HOME` vazio funciona.
- O que rodou, sem tocar no `~/.claude` real:

```bash
T=$(mktemp -d); mkdir -p "$T/home" "$T/proj"; cd "$T/proj"
env -u CLAUDECODE HOME="$T/home" claude -p "..." \
  --settings "$T/settings-teste.json" \
  --allowedTools "Bash Read Write Edit mcp__hela__*" \
  --output-format json --max-turns 10 --debug-file "$T/debug.txt"
env -u CLAUDECODE HOME="$T/home" claude mcp add --scope user hela -- <comando do servidor>
```

- Resultados:
  - `SessionStart` com `additionalContext` "O código de teste da sessão é VERDE-42" → o Claude respondeu `VERDE-42`;
  - os 6 eventos dispararam com os formatos da seção 1;
  - o servidor MCP de exemplo foi registrado com `--scope user`, apareceu como `√ Connected` e as três chamadas
    devolveram os textos da seção 3.5;
  - custo dos três testes: cerca de US$ 0,34.
- `-p` conta a pasta como confiável, então os hooks rodam. No uso interativo, no PC do Paulo, a primeira abertura de
  uma pasta pede confiança antes de qualquer hook rodar.
- O HOME isolado recebe arquivos do ambiente da nuvem (`remote-settings.json`, skills sincronizadas). No PC do Paulo
  isso não acontece; o teste do instalador deve conferir só os arquivos que a HELA cria.

## 6. Não confirmado

- Se `thinking_tokens` está contido em `output_tokens` (seção 4.3).
- O valor exato de `mcp_server.source` para um servidor de escopo `user` (a documentação lista `user`, `project`,
  `plugin`, `sdk`; o teste registrou só que o campo existe).
- Hooks em modo **interativo** (não há terminal interativo aqui): fica para o PC do Paulo.
- Comportamento no Windows e no macOS.
- `allowed-tools: mcp__hela__*` dentro da skill.

## 7. Armadilhas (lista para a Karol)

1. `mcp.server.fastmcp` no SDK 2.x existe e **quebra ao importar**: tente o v2 primeiro.
2. No v2, só `ToolError` passa a mensagem ao Claude. Valide a entrada e levante `ToolError` com texto útil e sem
   segredo; deixe as exceções inesperadas caírem no genérico.
3. O erro de validação do pydantic **repete o valor enviado** (`input_value=...`). Não registre esse texto em log sem
   passar pela redação.
4. `PostToolUse` dispara também para `mcp__hela__*`: o `hela-hook` deve **ignorar as ferramentas da própria HELA**,
   senão cada recall vira uma "experiência" e o banco se alimenta dele mesmo. Filtre no código (mais simples de
   testar) ou use o matcher `^(?!mcp__hela__)` (regex JavaScript com *lookahead* negativo; [não testado]).
5. Bash que falha não tem `tool_response` nem código de saída estruturado: leia `Exit code N` da primeira linha de
   `error`.
6. `tool_response` de `Read`, `Write` e `Edit` traz arquivos inteiros (`content`, `originalFile`, `base64`): não
   guardar.
7. Qualquer texto extra no stdout do hook (inclusive warning de biblioteca) invalida o JSON. Redirecione `warnings` e
   logs para stderr ou arquivo.
8. `Stop` que imprime algo faz o Claude continuar o turno; com 8 continuações seguidas o Claude Code força o fim.
9. `SessionEnd` tem 1,5 s para todos os hooks juntos. Faça só o mínimo (fechar a sessão no banco, salvar o offset) ou
   peça `timeout` explícito (até 60 s).
10. `UserPromptSubmit` dispara em `/loop`, tarefa agendada e retorno de subagente: não conte cada um como tarefa nova
    do usuário.
11. Contexto injetado fica gravado e é **reaproveitado no `--resume`**: não ponha nele dado que muda (hora, contador).
12. `numpy` sozinho leva cerca de 100 ms para importar aqui, `networkx` cerca de 190 ms, `pydantic` cerca de 70 ms;
    `json` + `sqlite3`, cerca de 23 ms; Python vazio, 13 ms. Com os dois primeiros, o `UserPromptSubmit` passa de
    300 ms só de import.
13. Hook async no `-p` é cancelado no fim: captura em async some nos testes ponta a ponta.
14. Em sessão interativa, nenhum hook roda antes de aceitar a confiança da pasta.
15. `--bare` desliga hooks, skills e MCP: não serve para testar a HELA.
