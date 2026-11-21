# Graphify — origem e uso compartilhado

Esta pasta contém a skill oficial Graphify em `.claude/skills/graphify/`, incluindo suas referências sob demanda. Ela foi copiada de [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify), pacote `graphifyy`, que declara licença Apache 2.0. A licença e o aviso de atribuição originais estão em `docs/skills/GRAPHIFY-LICENSE` e `docs/skills/GRAPHIFY-NOTICE`.

Todos os agentes devem seguir a seção Graphify de `agentes/PROTOCOLO.md` em tarefas que envolvam compreender ou alterar este repositório. A skill é orientação; o CLI `graphify` precisa estar instalado para consultar ou gerar o grafo. O nome do pacote Python oficial é `graphifyy`. A integração não instala o CLI, não cria `graphify-out/graph.json` e não configura um servidor MCP.

A geração de grafos pode envolver extração semântica de documentos e consumir créditos. Respeite a regra de aprovação do protocolo antes de iniciar qualquer operação que possa consumir créditos. A saída `graphify-out/` deve permanecer fora do commit, salvo pedido explícito.

Origem: https://github.com/Graphify-Labs/graphify
