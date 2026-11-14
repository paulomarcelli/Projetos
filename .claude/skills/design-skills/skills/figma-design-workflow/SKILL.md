---
name: figma-design-workflow
description: Design e iteração de interfaces diretamente no Figma usando Claude Code e o Figma MCP. Use quando criar, explorar, revisar ou refinar telas e protótipos no canvas do Figma, aproveitar bibliotecas, variáveis e componentes existentes, transformar requisitos em frames editáveis ou preparar handoff para desenvolvimento.
---

# Fluxo de design com Claude e Figma

Use o Figma como espaço editável de trabalho e fonte de verdade visual, não apenas como referência para gerar código. Conduza o processo em etapas curtas: compreender, inspecionar, propor, criar, revisar e documentar. Prefira o servidor remoto oficial do Figma MCP e as skills do plugin oficial, pois a disponibilidade de ferramentas varia por cliente e servidor.

## 1. Verificar conexão e contexto

- Use esta skill principalmente com Claude Code conectado ao Figma MCP. Se a conexão não estiver disponível, explique o que falta e continue apenas com uma alternativa que o usuário possa fornecer (por exemplo, link, screenshot ou descrição); não alegue ter lido ou editado o arquivo.
- Para a configuração, consulte a [página oficial de configuração do Figma MCP no Claude Code](https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server). A configuração recomendada é instalar o plugin oficial `figma@claude-plugins-official`, autenticar a conta e confirmar a conexão no Claude Code. Se o plugin não puder ser instalado, adicione o servidor remoto oficial `https://mcp.figma.com/mcp` e autentique. A configuração manual do servidor não instala automaticamente as skills do Figma.
- Peça ou use o link do arquivo, frame ou camada relevante. No servidor remoto, inclua o link de seleção no pedido; a seleção atual do canvas só é suficiente no servidor desktop.
- Confirme o objetivo, público, plataforma, telas necessárias, estados e restrições. Faça perguntas apenas sobre lacunas que alterem substancialmente o resultado. Declare hipóteses menores.

## 2. Inspecionar antes de desenhar

- Comece pelo frame ou seleção indicada. Use a ferramenta MCP mais adequada para obter estrutura, contexto visual, variáveis, componentes e screenshot. Para arquivos grandes, explore primeiro metadados e aprofunde somente nas páginas ou camadas pertinentes.
- Identifique o sistema já existente: bibliotecas, tokens/variáveis, estilos, componentes, convenções de nomenclatura, grid, tipografia e padrões de interação. Reutilize componentes e variáveis encontrados antes de criar substitutos.
- Diferencie fatos lidos do arquivo de inferências. Se não houver sistema de design ou referência suficiente, proponha uma direção visual coerente e explicite as decisões principais antes de expandir para muitas telas.
- Não solicite nem imprima credenciais. Use a autorização OAuth do cliente MCP.

## 3. Transformar o pedido em plano de design

Antes de escrever no canvas, sintetize um plano breve com:

1. problema e tarefa principal do usuário;
2. arquitetura de informação e caminho principal;
3. telas, estados e breakpoints incluídos;
4. componentes e variáveis existentes a reutilizar;
5. direção visual e escolhas novas necessárias;
6. critérios de qualidade, incluindo acessibilidade e conteúdo realista.

Quando houver conceitos realmente diferentes, apresente no máximo algumas direções distintas para escolha, em vez de produzir muitas variações cosméticas. Para pedidos objetivos e pequenos, avance sem uma etapa de aprovação intermediária, preservando o original.

## 4. Criar no Figma em incrementos

- Use as ferramentas de escrita do MCP disponíveis no cliente para criar ou atualizar conteúdo no Figma. O conjunto pode incluir `use_figma`, `create_new_file`, `generate_diagram`, `generate_image` ou outras ferramentas; não pressuponha que toda ferramenta está habilitada. Siga a skill `/figma-use` se o plugin a disponibilizar.
- Crie o trabalho em uma página, seção ou arquivo claramente identificado como rascunho/proposta. Preserve telas de referência e componentes publicados. Não sobrescreva nem reorganize conteúdo existente sem pedido explícito.
- Construa primeiro a estrutura e o caminho crítico; depois refine componentes, conteúdo e acabamento visual. Use Auto Layout, constraints, nomes de camadas claros, variáveis e componentes quando o arquivo e as ferramentas permitirem.
- Desenhe estados necessários ao fluxo, não apenas a tela ideal: carregamento, vazio, erro, sucesso, desabilitado e foco/seleção, conforme o produto. Considere conteúdo longo, responsividade, acessibilidade, contraste e redução de movimento quando pertinentes.
- Use imagens e ícones com intenção. Prefira assets já presentes na biblioteca ou fornecidos pelo usuário. Não invente dados de marca, textos legais ou funcionalidades; marque premissas quando necessário.
- Faça mudanças em lotes pequenos o bastante para inspecionar e corrigir. Se uma operação de escrita falhar ou a ferramenta estiver indisponível, não diga que o canvas foi atualizado; reporte a limitação e ofereça um artefato alternativo claramente identificado.

## 5. Revisar visualmente e iterar

- Após cada etapa significativa, recupere um screenshot/contexto atualizado do frame e confira o resultado real, em vez de confiar somente no código ou na descrição textual retornada pelo MCP.
- Verifique hierarquia, alinhamento, espaçamento, legibilidade, contraste, consistência com o sistema, comportamento responsivo, estados e relação entre telas. Para interfaces existentes, combine com `critique-visual-hierarchy`, `critique-composition`, `critique-color`, `critique-typography` ou `critique-affordance`, conforme o problema.
- Compare com o pedido e com o plano. Corrija primeiro falhas de fluxo e hierarquia; em seguida, inconsistências e polimento. Faça uma nova inspeção visual depois das correções.
- Se o resultado exigir decisão subjetiva importante, mostre a direção no canvas e peça feedback específico (por exemplo, hierarquia, densidade ou tom visual), em vez de pedir aprovação genérica.

## 6. Fechar e entregar

- Organize as telas finais e os estados com nomes que identifiquem plataforma, tela e variante. Marque claramente rascunhos e direções rejeitadas; não os apresente como aprovados.
- Registre decisões, hipóteses, estados, regras responsivas, componentes/tokens novos e questões ainda abertas. Para handoff de implementação, combine com `handoff-spec`; para validação posterior do build, use `design-qa-checklist`.
- Se houver implementação de código, use o Figma como especificação e compare o resultado no browser com screenshots do design. Reutilize Code Connect quando estiver configurado e disponível.
- Na resposta final, informe o que foi efetivamente criado ou alterado, inclua o link do arquivo/frame se disponível, aponte decisões ou limitações pendentes e nunca afirme que salvou/publicou conteúdo sem confirmação da ferramenta.

## Escolha de ferramentas MCP

Consulte a documentação oficial [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) para capacidades e diferenças entre servidor remoto e desktop. Em geral:

- Use metadados para localizar páginas/camadas com baixo custo; contexto de design para entender propriedades e gerar código; screenshot para inspecionar aparência; variáveis e busca de biblioteca para manter fidelidade ao sistema; download de assets quando precisar exportar arquivos, não apenas visualizá-los.
- Use ferramentas de escrita no canvas para criar ou editar artefatos Figma quando disponíveis. Descreva o resultado desejado e o contexto; não force nomes de ferramentas na solicitação ao Claude, a menos que seja necessário diagnosticar uma integração.
- Respeite o escopo de acesso da conta, a autorização do usuário e as limitações indicadas pelo servidor. Antes de qualquer alteração ampla em arquivos compartilhados, prefira duplicar ou criar um espaço de rascunho.
