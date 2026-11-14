# 🤝 O time de agentes

Agentes do Claude Code que trabalham neste repositório. Cada um tem um arquivo em `.claude/agents/`, uma memória em
`memoria/` e entrega relatórios em `relatorios/<nome>/`. Para criar outro, peça "crie um agente…": a skill
`criar-agente` (`.claude/skills/criar-agente/`) faz os 7 passos.

| Agente | Papel | Arquivo | Memória |
|---|---|---|---|
| 🎨 **Sofia** | Designer: direção de arte, Figma, design systems, revisão visual, responsivo, acessibilidade, motion e SEO on-page | [`.claude/agents/sofia.md`](../.claude/agents/sofia.md) | [`memoria/sofia.md`](memoria/sofia.md) |

## Como acionar

Abra o Claude Code na pasta do repositório (terminal, VS Code, app ou web) e peça pelo nome:

```text
Sofia, revise o responsivo do fã-site da Sofia Carson e me traga os prints.
```

```text
@sofia monte no Figma o design system da landing da Karol × Samsung.
```

Um agente novo só aparece numa **sessão nova** do Claude Code.

## Como a Sofia trabalha

0. **Sempre a `design-skills`:** toda tarefa começa por ela (a skill é carregada junto com a Sofia).
1. **Plano** em tarefas antes de agir (em tarefa grande, ela espera o seu "ok").
2. **Execução**, uma tarefa por vez, conferindo cada uma.
3. **Revisão** com capturas de tela em vários tamanhos.
4. **Relatório** em `relatorios/sofia/AAAA-MM-DD-<tema>.md`, e a memória atualizada.

Ela pede aprovação antes de publicar, apagar, gastar créditos de IA, mexer no Notion ou em qualquer coisa fora do
repositório, e nunca faz pagamento, compra ou assinatura.

## Monitoramento

No fim de cada tarefa, o agente registra uma linha no **Registro de tarefas** da memória dele. De tempos em tempos,
leia o registro e veja:

- **Qualidade:** quantas tarefas saíram **perfeitas**, **com ajustes** ou **falharam**;
- **Tempo:** quanto cada tarefa levou;
- **Custo:** o gasto aproximado, quando houver;
- **Melhoria:** o que mudar no arquivo do agente ou na memória para a próxima vez.
