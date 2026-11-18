## graphify

A skill `graphify` (`.claude/skills/graphify/`) monta um grafo de conhecimento do projeto em `graphify-out/`. Para
usar, o comando `graphify` precisa estar instalado no computador: `uv tool install graphifyy` (ou
`pipx install graphifyy`). O grafo ainda não foi montado; o Paulo decide quando e em que parte do repositório.

Regras, quando `graphify-out/graph.json` existir:
- Para uma pergunta sobre o código, rode `graphify query "<pergunta>"` antes da primeira busca ou leitura de arquivo, e
  ponha esta regra no pedido de todo subagente que explore código. Leia o arquivo só nas linhas que o grafo ou uma
  leitura anterior já localizou. Use `graphify path "<A>" "<B>"` para a relação entre duas coisas e
  `graphify explain "<conceito>"` para um conceito. Quando a resposta está sob um título de Markdown,
  `graphify section "<título>"` mostra o texto da seção sem abrir o arquivo.
- Se `graphify-out/wiki/index.md` existir, use-o para navegar, em vez de abrir arquivo por arquivo.
- Leia `graphify-out/GRAPH_REPORT.md` só para uma visão geral da arquitetura, ou quando query, path e explain não
  bastarem.
- Depois de mudar código, rode `graphify update .` para atualizar o grafo (só AST, sem custo de IA).
- O `graphify-out/graph.json` é reescrito inteiro a cada montagem; diferença grande nele num PR é esperada.
