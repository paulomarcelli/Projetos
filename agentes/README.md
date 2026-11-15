# 🤝 O time de agentes

A equipe do **Escritório do Paulo**. Cada agente tem um arquivo em `.claude/agents/` (instruções, ferramentas,
critério de qualidade e colaboração), uma memória em `memoria/` e entrega relatórios em `relatorios/<nome>/`. As regras
comuns estão no [protocolo da equipe](PROTOCOLO.md). Para criar outro, peça "crie um agente…": a skill `criar-agente`
(`.claude/skills/criar-agente/`) faz os 7 passos.

| Agente | Papel | Inspiração | Arquivo | Memória |
|---|---|---|---|---|
| 🛡️ **Steve** | Coordenação: plano em tarefas, ordem e dependências | Capitão América | [`steve.md`](../.claude/agents/steve.md) | [`steve.md`](memoria/steve.md) |
| 🎨 **Sofia** | Design: Design System no Figma, layouts, revisão visual | identidade própria | [`sofia.md`](../.claude/agents/sofia.md) | [`sofia.md`](memoria/sofia.md) |
| ⚙️ **Tony** | Arquitetura: estrutura, tecnologias, publicação | Homem de Ferro | [`tony.md`](../.claude/agents/tony.md) | [`tony.md`](memoria/tony.md) |
| 🔮 **Stephen** | Pesquisa e análise com fontes | Doutor Estranho | [`stephen.md`](../.claude/agents/stephen.md) | [`stephen.md`](memoria/stephen.md) |
| 🕸️ **Peter** | Front-end a partir do Design System | Homem-Aranha | [`peter.md`](../.claude/agents/peter.md) | [`peter.md`](memoria/peter.md) |
| 🧪 **Bruce** | Back-end e dados | Hulk | [`bruce.md`](../.claude/agents/bruce.md) | [`bruce.md`](memoria/bruce.md) |
| ✨ **Wanda** | Engenharia de IA | Feiticeira Escarlate | [`wanda.md`](../.claude/agents/wanda.md) | [`wanda.md`](memoria/wanda.md) |
| 🕵️ **Natasha** | QA e segurança | Viúva Negra | [`natasha.md`](../.claude/agents/natasha.md) | [`natasha.md`](memoria/natasha.md) |

Por que essas oito e não mais: back-end e dados ficaram juntos com o Bruce (neste repositório o servidor e os dados de
um projeto quase sempre são a mesma peça), e QA e segurança ficaram juntos com a Natasha (as duas revisões olham as
mesmas coisas: entradas, erros, o que vai para o ar).

## Como acionar

Pelo **Escritório do Paulo** (`Projetos/Escritorio-do-Paulo/`): "Novo pedido" manda para o Steve planejar; "Nova
tarefa" dá um trabalho direto a um agente. Ou numa conversa do Claude Code, pelo nome:

```text
Sofia, revise o responsivo do fã-site da Sofia Carson e me traga os prints.
```

```text
@steve monte o plano para uma página de inscrição do meu curso.
```

Um agente novo só aparece numa **sessão nova** do Claude Code.

## Como a equipe trabalha

1. **Plano** em tarefas antes de agir (em tarefa grande, o agente espera o seu "ok").
2. **Execução**, uma tarefa por vez, conferindo cada uma.
3. **Revisão** do próprio trabalho.
4. **Entrega** com o bloco `ENTREGA` do protocolo, e a memória atualizada.

Regra permanente: todo projeto de interface começa com o **Design System da Sofia, no Figma**. Todos pedem aprovação
antes de publicar, apagar, gastar créditos de IA, mexer no Notion ou em qualquer coisa fora do repositório, e nunca
fazem pagamento, compra ou assinatura.

## Monitoramento

O Escritório mostra, na gaveta de cada agente, quantas tarefas ele concluiu, quantas deram erro, o tempo médio e o
custo. Cada agente também registra uma linha no **Registro de tarefas** da memória dele (resultado **perfeito**,
**com ajustes** ou **falhou**, tempo, custo e o que melhorar). De tempos em tempos, leia e ajuste o arquivo do agente.
