# Memória da Karol

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

### Do que era arquitetura
- **Padrão do repositório.** Vite sem framework, `base: './'` (o Pages publica em subpasta), dependências com versão
  travada.
- **14/11/2026 · Escritório do Paulo.** Servidor Node sem dependências, dados em arquivos JSON, eventos por SSE e
  execução dos agentes pelo `claude -p --agent`. Foi a escolha por rodar com um comando e sem instalar nada.
- **Workflow do Pages.** Já aconteceu de uma pasta que o site carrega ficar fora da lista de cópia (a `fases/` da
  Aurora). Confira a lista a cada pasta nova.

### Do que era front-end
- **14/11/2026 · Furo e camadas (modelo Lusco).** Contêiner que guarda o furo não pode ter `z-index`: a sombra do furo
  cobre o texto que vem antes. Deixou dois títulos invisíveis no fã-site da Sofia Carson.
- **14/11/2026 · Entradas por marco.** Para conferir com captura, role em passos (≈ 40 px) e espere ~2,5 s; pular com
  `scrollTo` engana o `IntersectionObserver`.
- **Responsivo.** Teste 320, 375, 390, 768, 1024, 1280, 1920 e 2560 px e o celular deitado.
- **Sem Design System, sem tela.** Interface nova só começa com o `design-system.md` da Sofia.

### Do que era back-end e dados
- **14/11/2026 · Gravação segura.** No Escritório, cada arquivo de dados é gravado em um temporário e renomeado, para
  não corromper se o processo cair no meio.
- **Servidores do repositório.** A Luna usa Flask e roda fora do Pages (o Pages só serve arquivo estático); o endereço
  do servidor chega por variável.
- **Segredos.** Só em variável de ambiente. Nunca em arquivo versionado.

### Do que era IA
- **14/11/2026 · Agentes do Claude Code.** O arquivo fica em `.claude/agents/<nome>.md`; a `description` decide quando
  ele é chamado; um agente novo só carrega em sessão nova. Use a skill `criar-agente`.
- **14/11/2026 · Eventos de execução.** `claude -p --agent <nome> --output-format stream-json --verbose` devolve cada
  ferramenta usada, o resultado, o tempo e o custo; os ganchos (`SubagentStart`, `PreToolUse`…) trazem `agent_type`.
- **Modelos e preços mudam.** Consulte a skill `claude-api` em vez de responder de memória.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 15/11/2026 | (criação da agente; nenhuma tarefa ainda) | — | — | — | — |
