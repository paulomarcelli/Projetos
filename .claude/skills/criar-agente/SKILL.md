---
name: criar-agente
description: "Cria um agente de IA para o Claude Code em 7 passos: escreve o documento do agente (o que faz, o que precisa saber, o que acessa, o que define o sucesso, como pensa e as proteções), gera o arquivo .md em .claude/agents/, monta a memória dele em agentes/memoria/ e deixa o jeito de acionar e de monitorar (tarefas feitas, tempo, custo, o que melhorar). Use quando o usuário pedir para criar, montar ou configurar um agente, subagente, assistente especializado ou um membro do time de agentes (designer, SEO, revisor, pesquisador…), ou para revisar um agente que já existe."
---

# Criar um agente

Um agente é uma IA que recebe um objetivo, decide os passos, usa ferramentas e entrega um resultado sem a pessoa ter de
fazer nada no meio. Esta skill monta um agente do Claude Code em **7 passos**. Escreva tudo em português (pt-BR) e
pergunte só o que não dá para descobrir no repositório; o que faltar fica marcado como `[preencher]` e entra na lista do
fim.

Agentes que já existem neste repositório: veja `agentes/README.md` (o time) e `agentes/PROTOCOLO.md` antes de criar
um novo, para não repetir papel. Novo agente segue o protocolo da equipe (plano, execução, revisão, bloco ENTREGA).

## Passo 1 · O documento do agente

Responda, por escrito, a estas perguntas. Elas viram as seções do arquivo do agente.

1. **O que ele faz?** O papel em uma frase e as tarefas típicas (de 3 a 8).
2. **O que ele precisa saber de técnico?** As skills que deve ler (caminho do `SKILL.md`), as regras do projeto, os
   erros que já aconteceram e não podem voltar.
3. **O que ele precisa acessar, e como?** Arquivos do repositório (quais pastas), internet (para quê), navegador para
   capturas de tela, conectores (Figma, Notion, GitHub…). Dê só o necessário.
4. **O que define o sucesso?** A entrega: um relatório `.md`? Com que seções, de quantas páginas, em que pasta? E um
   **critério de qualidade** em lista: o relatório só está completo se…
5. **Como ele pensa?** O jeito de trabalhar: o que vem primeiro, o que ele recusa, o tom. Peça sempre que ele
   **planeje em tarefas antes de agir, depois execute e depois revise**.
6. **Proteções e limites.** Os pontos de **aprovação humana** (antes de publicar, apagar, gastar créditos, mexer em
   coisa de fora do repositório), o que ele **nunca** faz (pagamento, assinatura, compra, segredo em commit, inventar
   fato sobre pessoa real) e o que fazer quando estiver em dúvida (parar e perguntar).

## Passo 2 · Gerar o arquivo do agente

Transforme o documento em `.claude/agents/<nome>.md` (nome em minúsculas, sem acento). Formato do Claude Code:

```markdown
---
name: <nome>
description: <quando usar este agente, em uma ou duas frases com as palavras que a pessoa usaria ao pedir>
model: inherit
---

<o prompt do agente: quem ele é, as seções do Passo 1 e o fluxo de trabalho>
```

- A `description` decide quando o Claude chama o agente: escreva os gatilhos ("use para…").
- Sem o campo `tools`, ele herda todas as ferramentas da sessão (inclusive Figma e Notion). Para restringir, liste só
  as que ele usa, por exemplo `tools: Read, Grep, Glob, Bash, Edit, Write`.
- O prompt fala **com** o agente, em segunda pessoa ("Você é…"), e manda ele ler a memória antes de qualquer coisa.

## Passo 3 · Onde ele vai atuar

Neste repositório, o agente roda no **Claude Code** (terminal, VS Code, app ou web), a partir da pasta raiz. No VS Code:
instale a extensão do Claude Code, abra a pasta do repositório e o agente aparece sozinho na próxima sessão. Diga isso à
pessoa: o agente novo só é carregado **numa sessão nova**.

## Passo 4 · A pasta do projeto

Confira que existem:

- `.claude/agents/`: os arquivos dos agentes (um por agente);
- `agentes/memoria/`: a memória de cada agente;
- `agentes/relatorios/<nome>/`: as entregas;
- `agentes/README.md`: o time, como acionar cada um e o painel de monitoramento.

## Passo 5 · A página do agente

Salve o arquivo do Passo 2 e acrescente o agente à tabela do time em `agentes/README.md` (nome, papel, como acionar).

**No Escritório do Paulo** (`Projetos/Escritorio-do-Paulo/`), o agente novo aparece sozinho numa mesa livre. Para ele
ganhar identidade, acrescente a entrada dele em `equipe.json` (nome, papel, inspiração, cor, `avatar`, `tela` do
monitor, personalidade e ferramentas) e o desenho da figurinha em `web/js/avatares.js`, no mesmo estilo dos outros.
Se ele implementa interface, marque `"exigeDesignSystem": true`: o escritório prende as tarefas dele no Design System
da Sofia. Leia `agentes/PROTOCOLO.md` e ponha o novo papel na tabela "Quem faz o quê".

## Passo 6 · A memória

Crie `agentes/memoria/<nome>.md` com:

- **O projeto:** o que é o repositório, onde fica cada coisa, como se publica.
- **A pessoa:** como ela gosta de trabalhar, o idioma, o que ela já pediu para não fazer. Sem e-mail, telefone ou
  outro dado pessoal: o repositório pode ser público.
- **Regras aprendidas:** erros que já aconteceram e como evitar (com a data).
- **Registro de tarefas:** uma tabela que o agente preenche ao fim de cada tarefa (veja o Passo 7).

O agente lê a memória no começo de cada tarefa e acrescenta o que aprendeu no fim. Pode crescer depois (um banco de
dados, por exemplo), mas comece com um `.md`.

## Passo 7 · Acionar e monitorar

- **Acionar:** "Sofia, …", "use o agente <nome> para…", ou `@<nome>` no Claude Code.
- **No Escritório do Paulo:** dê uma tarefa ao agente pelo painel e confira que a figurinha dele muda de estado; a
  gaveta mostra concluídas, erros, tempo médio e custo de cada um.
- **Monitorar:** a cada tarefa o agente registra na memória uma linha com a data, o pedido, o resultado (**perfeito**,
  **com ajustes** ou **falhou**), o tempo, o custo aproximado quando souber e o que melhorar. De tempos em tempos, leia
  o registro e pergunte:
  - quantas tarefas ele concluiu com perfeição;
  - qual é o tempo de resposta dele;
  - qual é o custo dele;
  - o que mudar no arquivo do agente ou na memória para melhorar.

## Ao terminar

Mostre à pessoa os arquivos criados, um exemplo de pedido para acionar o agente, o que ficou `[preencher]` e o lembrete
de abrir uma sessão nova para o agente aparecer.
