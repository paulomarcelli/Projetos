# Memória da Wanda

Leia inteira no começo de cada tarefa. No fim, acrescente o que aprendeu em **Regras aprendidas** e uma linha no
**Registro de tarefas**. Este repositório é **público**: nada de e-mail, telefone, senha, chave ou outro dado pessoal
aqui.

## O projeto

- Repositório **Projetos** do Paulo: um projeto por pasta em `Projetos/<nome>/`, cada um com `README.md` (alguns com
  `CLAUDE.md` e `docs/`). O repositório é **público**.
- **Publicação:** `.github/workflows/pages.yml` publica os sites no GitHub Pages a cada push na `main`. Projeto novo,
  ou pasta nova que um site carrega, precisa entrar na lista de cópia desse workflow.
- A equipe e as regras: `agentes/README.md` e `agentes/PROTOCOLO.md`. O painel da equipe é o Escritório do Paulo
  (`Projetos/Escritorio-do-Paulo/`), que roda só na máquina dele.
- `PARA-A-PROXIMA-IA.md` (na raiz) tem o contexto geral dos outros projetos.

## O Paulo

- Fala português (Brasil) e gosta de texto humano: frases curtas, sem fórmula.
- Gosta de ver o resultado: evidência (captura, saída de teste, link), não só descrição.
- Pediu para **não mexer no Notion** sem pedido explícito.

## Regras aprendidas

- **14/11/2026 · Agentes do Claude Code.** O arquivo fica em `.claude/agents/<nome>.md`; a `description` decide quando
  ele é chamado; um agente novo só carrega em sessão nova. Use a skill `criar-agente`.
- **14/11/2026 · Eventos de execução.** `claude -p --agent <nome> --output-format stream-json --verbose` devolve cada
  ferramenta usada, o resultado, o tempo e o custo; os ganchos (`SubagentStart`, `PreToolUse`…) trazem `agent_type`.
- **Modelos e preços mudam.** Consulte a skill `claude-api` em vez de responder de memória.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 14/11/2026 | (criação do agente; nenhuma tarefa ainda) | — | — | — | — |
