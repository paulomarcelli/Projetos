# Arquitetura · Escritório do Paulo

Um servidor Node local, sem dependências, guarda as tarefas e acompanha as execuções reais dos agentes do Claude Code.
A página, servida pelo mesmo processo, recebe o estado por SSE e desenha o escritório. O estado de cada agente nunca é
inventado pela interface: ele vem de uma execução viva, das dependências entre tarefas ou do último resultado.

```mermaid
flowchart LR
  P[Paulo no navegador] -- pedidos, tarefas --> S[Servidor local<br>127.0.0.1:4310]
  S -- SSE: retrato do escritório --> P
  S -- claude -p --agent nome<br>stream-json --> C[Claude Code]
  C -- eventos de cada ferramenta,<br>resultado, tempo, custo --> S
  V[Conversa no Claude Code<br>VS Code, terminal, app] -- ganchos --> G[ganchos/enviar.mjs] -- POST /api/ganchos --> S
  S -- arquivos JSON --> D[(dados/)]
  A[.claude/agents/*.md] -- equipe --> S
  E[equipe.json] -- identidade no escritório --> S
  S -- resumo a cada mudança importante --> N[(ntfy.sh<br>tópico secreto)]
  N -- histórico + SSE --> O[Página online<br>qualquer aparelho]
```

Numa sessão do Claude na nuvem, o mesmo servidor roda dentro da sessão (o gancho de início o abre quando a variável
`ESCRITORIO_NUVEM` existe) e publica no mesmo tópico; a página online mostra o escritório que tem alguém em atividade.

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `bin/escritorio.mjs` | comando: `iniciar`, `tarefas`, `tarefa`, `pedido`, `plano`, `ganchos instalar/remover` |
| `servidor/index.mjs` | HTTP em 127.0.0.1, rotas da API, SSE, arquivos da interface, proteções |
| `servidor/motor.mjs` | o coração: tarefas, execuções vivas, estado de cada agente, histórico, agendamento |
| `servidor/tarefas.mjs` | regras puras: criar, editar, dependências, ciclos, planos (com a regra do Design System) |
| `servidor/executor.mjs` | roda `claude -p --agent` e traduz o fluxo `stream-json` em eventos |
| `servidor/ganchos.mjs` | traduz os ganchos do Claude Code (conversas normais) nos mesmos eventos |
| `servidor/atividade.mjs` | ferramenta usada → estado e frase ("Lendo app.js" → pesquisando) |
| `servidor/equipe.mjs` | lê `.claude/agents/*.md` e junta com `equipe.json` |
| `servidor/loja.mjs` | arquivos JSON gravados com troca atômica; histórico em JSONL |
| `servidor/fluxos.mjs` | planos prontos (interface nova, projeto de IA, pesquisa) |
| `servidor/nuvem.mjs` | espelho na nuvem: resume o retrato e publica no ntfy.sh, com intervalo e respeito ao limite diário |
| `web/js/nuvem.js` | lado da página: guarda o tópico do link, ouve o ntfy e remonta o retrato (só leitura) |
| `ganchos/enviar.mjs` | gancho do Claude Code: repassa o evento ao servidor e sai em menos de meio segundo |
| `web/` | a interface (HTML, CSS e JS sem build): mapa, figurinhas, tarefas, gaveta, diálogos |

## De onde vem cada estado

| Estado | Fonte |
|---|---|
| trabalhando, pensando, pesquisando | execução viva: a última ferramenta usada (`Edit`, `Write`, `Bash`, Figma → trabalhando; `Read`, `Grep`, `WebSearch`, `Skill` → pesquisando; entre passos → pensando) |
| em revisão | o mesmo, numa tarefa do tipo revisão |
| aguardando | execução viva que chamou outro agente, **ou** tarefa na fila presa numa dependência que está rodando (ou num projeto em execução automática) |
| concluído | a última execução terminou bem (até ser vista ou passar 10 min) |
| com erro | a última execução falhou (até ser vista ou repetida) |
| disponível | nada disso |

## Contratos

- **Plano** (resposta da Sabrina, a agente com `"coordena": true` no `equipe.json`; `POST /api/planos`, `escritorio.mjs plano`):
  `{ "projeto": "…", "tarefas": [{ "chave", "agente", "titulo", "descricao", "dependeDe": [chaves], "tipo": "entrega" | "revisao" }] }`.
  Se alguma tarefa é de quem exige Design System (Karol) e não depende de uma tarefa da Sofia, o servidor acrescenta
  ou liga a tarefa da Sofia e registra o aviso no histórico.
- **Pedido ao agente**: o prompt leva o número da tarefa (`T-0000`), o que fazer e as entregas completas das tarefas
  de que ela depende. A resposta termina com o bloco `ENTREGA` do `agentes/PROTOCOLO.md`; o texto inteiro fica em
  `dados/entregas/T-0000.md`.
- **Ganchos**: `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `SubagentStart`, `SubagentStop`, `Stop`. Eventos de
  execuções iniciadas pelo próprio escritório chegam marcados (`ESCRITORIO_EXEC_ID`) e são ignorados, para não contar
  duas vezes.

## Decisões

- **Node sem dependências** em vez de Vite/React: sobe com um comando, sem `npm install`, e não quebra com versões.
  Alternativa descartada: Vite + servidor separado (dois processos, build).
- **Arquivos JSON** em vez de SQLite: o volume é pequeno (dezenas de tarefas por dia) e o arquivo é legível. A gravação
  é atômica (temporário + renomear). Trocar por SQLite é simples se o histórico crescer.
- **`claude -p --agent`** para executar: usa os agentes de verdade, com as mesmas permissões e ferramentas; o fluxo
  `stream-json` traz cada ferramenta, o resultado, o tempo e o custo. Alternativa descartada: Agent SDK (exigiria chave
  de API própria e dependência).
- **Ganchos** para as conversas comuns: o escritório acompanha os agentes mesmo quando o Paulo não usa o painel.
- **Só 127.0.0.1**, recusa `Host` de fora, exige JSON e origem local para mudar estado: um site aberto em outra aba não
  consegue criar nem iniciar tarefas.
- **Endereço online** (GitHub Pages, só a pasta `web/`): a página detecta que não está em 127.0.0.1 e conversa com
  `http://127.0.0.1:4310` (ou `?porta=`). O servidor libera essa origem, e só ela (`origensPermitidas` no
  `escritorio.config.json`), com CORS e o pré-voo de acesso à rede local (`Access-Control-Allow-Private-Network`). O
  Chrome pede a permissão "acessar dispositivos da rede local" na primeira vez. Sem o escritório aberto, a página mostra
  que está fechado; ela nunca mostra dados de exemplo.

## Como rodar

```bash
node Projetos/Escritorio-do-Paulo/bin/escritorio.mjs iniciar --abrir
```

Testes: `npm test` dentro da pasta (23 testes; usam um Claude de simulação, `testes/claude-falso.mjs`).

## Início automático

- `bin/escritorio.mjs autoiniciar instalar` registra o escritório no sistema: LaunchAgent no macOS
  (`~/Library/LaunchAgents/com.paulomarcelli.escritorio.plist`, reinicia se cair), atalho na pasta Inicializar do
  Windows (`Escritorio do Paulo.vbs`, sem janela) ou serviço do usuário no systemd (Linux, `Restart=on-failure`). Grava
  o caminho do Node e o `PATH` da hora da instalação, para o escritório achar o comando `claude`. Registro em
  `dados/escritorio.log`.
- O gancho `SessionStart` (`ganchos/iniciar.mjs`) abre o escritório em segundo plano quando uma sessão do Claude Code
  começa neste computador e ele está fechado. Não escreve nada na conversa e não faz nada em sessões na nuvem
  (`CLAUDE_CODE_REMOTE=true`).
- `iniciar` com o escritório já aberto sai sem erro; as variáveis da sessão que o abriu (`CLAUDECODE`…) não passam para
  ele nem para as execuções dos agentes.

## Riscos e limites

- Execuções pelo painel rodam com `--permission-mode acceptEdits` e uma lista curta de comandos liberados
  (`escritorio.config.json`). Comando fora da lista é negado pelo Claude Code e aparece na entrega.
- Figma e outros conectores dependem da autorização na máquina; a gaveta mostra a situação de cada um na última
  execução, e a Sofia avisa quando o Figma não está disponível.
- Uma conversa fechada no meio não manda o fim: depois de 15 min sem sinal, a execução vira erro.
- O custo vem do próprio Claude Code (`total_cost_usd`); nas conversas acompanhadas por ganchos ele não é informado.
