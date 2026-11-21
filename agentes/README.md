# 🤝 O time de agentes

A equipe do **Escritório do Paulo**. Cada agente tem um arquivo em `.claude/agents/` (instruções, ferramentas,
critério de qualidade e colaboração), uma memória em `memoria/` e entrega relatórios em `relatorios/<nome>/`. As regras
comuns estão no [protocolo da equipe](PROTOCOLO.md). Para criar outro, peça "crie um agente…": a skill `criar-agente`
(`.claude/skills/criar-agente/`) faz os 7 passos.

| Agente | Papel | Arquivo | Memória |
|---|---|---|---|
| 🎤 **Sabrina** | Coordenação (plano em tarefas, ordem e dependências), pesquisa com fontes, QA e segurança | [`sabrina.md`](../.claude/agents/sabrina.md) | [`sabrina.md`](memoria/sabrina.md) |
| 🎨 **Sofia** | Design e direção de arte: Design System no Figma, layouts, revisão visual e produção 3D no Blender (skills Blender) | [`sofia.md`](../.claude/agents/sofia.md) | [`sofia.md`](memoria/sofia.md) |
| 💻 **Karol** | Desenvolvimento: arquitetura, front-end, back-end e dados, IA, publicação | [`karol.md`](../.claude/agents/karol.md) | [`karol.md`](memoria/karol.md) |
| 📈 **Gabriela** | Marketing, conteúdo e performance: escolhe e escreve os posts e roteiros da semana (TikTok E Se, Hein?, LinkedIn e Substack), analisa os números e recomenda o que mudar (Marketing Skills), cuida do calendário no Notion e pede as artes à Sofia | [`gabriela.md`](../.claude/agents/gabriela.md) | [`gabriela.md`](memoria/gabriela.md) |

Por que quatro: o Paulo quis uma equipe pequena, só com elas. Quem desenha (Sofia) fica separada de quem constrói (Karol)
e de quem planeja e confere (Sabrina): assim ninguém revisa o próprio trabalho. A Gabriela (17/11/2026) cuida do que
vai ao ar nas redes: escolhe e escreve, mas a arte é da Sofia e os fatos científicos passam pela Sabrina.

## Como acionar

Pelo **Escritório do Paulo** (`Projetos/Escritorio-do-Paulo/`): "Novo pedido" manda para a Sabrina planejar; "Nova
tarefa" dá um trabalho direto a uma agente. Ou numa conversa do Claude Code, pelo nome:

```text
Sofia, revise o responsivo do fã-site da Sofia Carson e me traga os prints.
```

```text
@sabrina monte o plano para uma página de inscrição do meu curso.
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
