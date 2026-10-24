# Governança e atualização do corpus

**Data de consulta:** 2026-10-22  
**Escopo:** governança, proveniência, qualidade, atualização temporal, versionamento, segurança e monitoramento de corpus para sistemas de Geração Aumentada por Recuperação (RAG).  
**Forma:** comparação textual técnica e acionável, sem código.

> Governar um corpus RAG não é apenas adicionar documentos ao índice. É decidir quais fontes podem entrar, em que versão, com que finalidade, sob quais direitos, por quanto tempo, com que testes e com qual responsável. A resposta gerada continua sendo uma inferência de um modelo; o corpus não é automaticamente verdadeiro, completo ou autorizado.

## Delimitação e orientação dos documentos-base

Os documentos-base localizados no diretório de pesquisa foram **12_Especificacao_Tecnica_RAG.md** e **14_Avaliacao_e_Metricas_RAG.md**. Eles orientaram, respectivamente, os requisitos de arquitetura/ciclo de vida e a separação entre avaliação da recuperação, da geração e do sistema. O documento-base 15 não estava disponível no diretório consultado; portanto, não atribuo a ele conteúdo, requisitos ou conclusões que não pude verificar. A comparação de 12/14/15, ao final, explicita esse limite em vez de inventar um terceiro caso.

As recomendações de engenharia abaixo são uma síntese aplicada da literatura e das diretrizes. Quando uma fonte descreve um experimento, seus números são apresentados como resultados daquele corpus e não como limiares universais. Quando uma fonte é normativa ou orientativa, isso é indicado como tal.

## Achados

### 1. Atualizar a memória externa é uma vantagem do RAG, não uma garantia de atualidade

O RAG combina memória paramétrica do modelo com memória não paramétrica recuperada de uma coleção externa. O trabalho fundador mostrou ganhos em tarefas intensivas em conhecimento e apontou como problemas abertos a proveniência das decisões e a atualização do conhecimento do mundo. A arquitetura separa, em princípio, a atualização do índice do retreinamento do gerador. [1] A revisão de Gao et al. organiza a evolução em RAG ingênuo, avançado e modular, e descreve indexação, recuperação, geração e aumento de contexto como partes distintas. [2]

Essa separação reduz o custo de incorporar uma nova versão documental, mas não responde sozinha a quatro perguntas de governança: **a fonte é autorizada? a informação é vigente? a mudança foi processada de modo completo? a nova versão piorou alguma pergunta importante?** Uma base pode ser tecnicamente “fresca” e juridicamente inadequada, ou conter a versão mais recente sem preservar a versão histórica necessária para auditoria.

### 2. O principal risco de atualização é a perda de identidade e de temporalidade

Atualização correta não significa apagar o documento antigo e indexar o novo. Normas, protocolos, políticas institucionais e páginas web podem ser corrigidos, substituídos, revogados ou parcialmente alterados. É necessário distinguir pelo menos **data de publicação**, **data de vigência**, **data de revisão**, **data de coleta** e **data em que o sistema passou a usar a versão**. A resposta precisa saber se a pergunta pede o estado atual ou o estado em uma data passada.

O modelo W3C PROV-DM oferece uma linguagem geral para registrar entidades, atividades, agentes, derivações e tempos de criação/uso/finalização. Uma atualização de documento pode ser representada como uma nova entidade derivada da anterior por uma atividade de ingestão, validação e publicação, com agentes responsáveis. [10] Isso é mais auditável do que guardar somente o vetor final.

O benchmark DRAGOn demonstra por que atualização e avaliação devem ser versionadas juntas. O trabalho mantém fontes de notícias, detecta diferenças entre revisões, extrai segmentos alterados, gera conjuntos de perguntas sobre o incremento e vincula cada resultado a uma revisão específica do dataset. Os autores argumentam que uma base em mudança torna resultados não reprodutíveis se a versão usada na avaliação não for registrada. [4] É uma demonstração de método, não evidência de que toda atualização automática seja segura.

### 3. No contexto brasileiro, a recuperação e o recorte documental podem ser o gargalo

No assistente institucional da USP, foram coletados 866 documentos normativos universitários referentes a janeiro de 2023 a maio de 2024. O melhor recuperador obteve acurácia Top-5 de 30% e o melhor gerador chegou a 22,04% contra as respostas de referência; quando os trechos corretos foram fornecidos, a acurácia subiu para 54,02%, enquanto sem contexto caiu para 13,68%. [5] O resultado sustenta uma prioridade de governança: antes de trocar o gerador, verificar seleção de fontes, vigência, chunking, metadados, consulta e avaliação.

O estudo hospitalar brasileiro em português de Cunha et al. usou 107 documentos normativos internos de cinco departamentos, com 90 pares sintéticos e 118 interações de uso validadas por especialistas, totalizando 192 pares. O embedding multilingual-e5-small teve taxa de falha de recuperação de 1,4% no cenário reportado; o RRF ofereceu uma alternativa de reranqueamento com equilíbrio entre custo e desempenho. [6] Esses números não são um padrão clínico ou nacional. O corpus é institucional, a amostra é pequena e BERTScore não demonstra, sozinho, correção de exceções, segurança ou benefício clínico.

Um estudo brasileiro de extração em 40 documentos legais encontrou 90% de acurácia média no melhor arranjo RAG, contra 58,75% de uma estratégia por expressões regulares, mas observou que cada variável extraída exigia combinação própria de parâmetros. [8] A implicação para governança é que qualidade deve ser definida por tarefa: atualizar uma lista, localizar uma cláusula, resumir uma norma e comparar versões não são a mesma operação.

### 4. Proveniência e documentação são controles de qualidade, não apenas transparência

Os princípios FAIR recomendam identificadores persistentes, metadados ricos, acesso controlado, interoperabilidade, licença e proveniência detalhada. Eles podem ser aplicados a dados sensíveis mesmo quando o conteúdo não é aberto: metadados e regras de acesso ainda podem ser publicados e auditados. [11]

Datasheets for Datasets propõem documentar motivação, composição, processo de coleta, usos recomendados e manutenção de cada dataset. [12] Data Statements para NLP acrescentam contexto linguístico e social, como população representada, variedade de idioma, anotadores, curadores, limitações e riscos de generalização. [13] Para um corpus RAG em português brasileiro, isso exige registrar, por exemplo, se os documentos são institucionais, legislativos, clínicos, educacionais ou jornalísticos; quais regiões e variedades aparecem; quais públicos ficam ausentes; e quem decidiu incluir ou excluir cada fonte.

A documentação não prova que uma fonte seja verdadeira. Ela torna possível descobrir quem coletou, de qual endereço, sob qual licença, por qual transformação, com quais filtros e em qual versão. Essa diferença é central: **rastreabilidade permite contestar e corrigir; não transforma um registro rastreável em autoridade factual**.

### 5. Governança e privacidade acompanham o documento até o vetor

A LGPD trata como tratamento operações como coleta, uso, acesso, armazenamento e eliminação, e exige finalidade, adequação, necessidade, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização. A lei também exige medidas técnicas e administrativas desde a concepção do produto ou serviço. [15] Em um RAG, isso alcança o documento original, OCR, texto normalizado, chunks, embeddings, caches, logs, conjuntos de avaliação, transcrições e respostas derivadas. Um embedding não deve ser presumido anônimo apenas porque não é legível como texto.

O radar da ANPD alerta que a eliminação em sistemas generativos é complexa porque prompts, conteúdo sintético e refinamento contínuo podem prolongar o tratamento de dados pessoais. A ANPD também aponta documentação técnica de fontes e filtros como meio de transparência, monitoramento e exercício de direitos. [14] A exclusão de uma fonte, quando devida, deve ser propagada aos artefatos derivados e acompanhada por teste que confirme que o conteúdo não continua recuperável em cache, índice ou resposta armazenada.

O NIST AI 600-1 organiza gestão de risco generativo nas funções Govern, Map, Measure e Manage e destaca governança, proveniência, testes pré-implantação e gestão de incidentes. [9] É uma orientação voluntária, não uma certificação nem um limiar legal brasileiro.

### 6. Atualidade é uma propriedade mensurável e multidimensional

“Corpus atualizado” pode significar coisas diferentes:

- **frescura de ingestão:** quanto tempo entre a publicação na fonte e a entrada no índice;
- **vigência:** se a fonte retornada ainda vale para a jurisdição e o período da pergunta;
- **cobertura de mudança:** se a alteração material foi detectada e indexada;
- **correção temporal:** se o sistema escolhe a versão correta para a data pedida;
- **consistência operacional:** se todos os componentes consultam a mesma revisão;
- **reprodutibilidade:** se é possível reconstruir uma resposta antiga com a versão que existia naquele momento.

A revisão AUEPORA observa que a recuperação em bases dinâmicas enfrenta mudança temporal, fontes heterogêneas e informação enganosa; também conclui que benchmarks frequentemente avaliam apenas partes do sistema e não capturam a interação recuperação–geração de forma holística. [3] Portanto, uma média de Recall@k ou uma nota de similaridade não é um indicador suficiente de governança de atualização.

## Conceitos e modelo de governança

### Corpus, coleção e índice não são sinônimos

O **corpus governado** é a coleção de documentos e metadados autorizados, com histórico e política. A **representação processada** é o texto extraído, normalizado, segmentado e anotado. O **índice** é uma visão de busca derivada de uma determinada revisão do corpus. Embeddings e caches são derivados adicionais. A distinção permite reprocessar a representação ou trocar o índice sem perder o documento original e permite provar qual versão sustentou uma resposta.

O registro mínimo de uma unidade documental deve conter, em linguagem de projeto:

1. identificador persistente do documento, da versão e do trecho;
2. título, autor ou entidade emissora, jurisdição, tipo de fonte e nível de autoridade;
3. datas de publicação, coleta, vigência, revisão, revogação ou substituição;
4. idioma e variedade linguística, incluindo português brasileiro quando pertinente;
5. URL original, licença, hash ou outro mecanismo de integridade e método de extração;
6. relações com documentos anteriores, posteriores, corrigidos e incompatíveis;
7. classificação de acesso, finalidade, base legal, prazo de retenção e responsável;
8. versão do parser/OCR, particionamento, embedding, reranqueador e índice que derivaram os chunks;
9. decisões de inclusão, exclusão, correção, quarentena e aprovação, com data e responsável;
10. testes associados e incidentes conhecidos.

### Papéis e prestação de contas

Uma governança mínima separa responsabilidades, ainda que uma mesma organização acumule papéis:

- **proprietário do domínio:** define autoridade, vigência e finalidade;
- **curador:** seleciona, descreve e revisa documentos;
- **responsável pela privacidade e acesso:** classifica dados, direitos, retenção e exclusão;
- **responsável técnico:** garante extração, indexação, observabilidade e rollback;
- **avaliador de domínio:** mantém consultas críticas e verifica respostas;
- **usuário revisor:** reporta erro, desatualização ou conflito.

A fonte mais parecida semanticamente não é necessariamente a competente. Uma norma oficial pode prevalecer sobre um resumo de blog; um protocolo local pode prevalecer sobre uma recomendação geral quando a pergunta é sobre aquele serviço; uma versão vigente pode prevalecer sobre uma versão histórica quando não há pedido de retrospectiva. Essas regras devem estar declaradas antes de a resposta ser gerada.

### Política de atualização por risco

A cadência deve ser proporcional à velocidade de mudança e ao dano da desatualização. Uma proposta operacional, a ser validada no domínio, é:

- **alta consequência ou alta volatilidade:** monitoramento frequente da fonte, aprovação humana antes da publicação e teste de regressão por mudança;
- **normas e políticas institucionais:** ingestão por evento de publicação/correção, preservação de versões e marcação explícita de vigência;
- **material educacional estável:** revisão em calendário acadêmico e por evento de alteração curricular;
- **literatura e material exploratório:** atualização periódica com identificação de preprint, revisão por pares e nível de evidência;
- **conteúdo social ou histórico:** congelar snapshots com data, não substituir o passado pelo presente.

A literatura não fornece uma frequência universal. A cadência acima é uma regra de governança proposta, não um resultado experimental.

### Ciclo de atualização recomendado, sem código

1. **Registrar a fonte:** aprovar domínio, entidade, finalidade, licença e nível de autoridade.
2. **Capturar em quarentena:** conservar o original, o horário, o endereço, o hash e o método de extração.
3. **Validar estrutura e conteúdo:** conferir OCR, tabelas, páginas, idioma, duplicatas, malware, instruções ocultas e documentos incompletos.
4. **Comparar versões:** detectar inclusão, alteração, correção, revogação e mudança de vigência; não tratar toda diferença textual como mudança material.
5. **Decidir e documentar:** aprovar, rejeitar, substituir, manter como histórico ou pedir revisão de domínio.
6. **Derivar com rastreabilidade:** gerar texto pesquisável, chunks e embeddings ligados ao documento-pai e à revisão.
7. **Aplicar autorização antes da recuperação:** filtragem por usuário, jurisdição, classificação, idioma, vigência e finalidade deve ocorrer antes do gerador.
8. **Testar a revisão candidata:** consultas críticas, perguntas sem resposta, conflitos, datas, negações, números, citações e idiomas afetados.
9. **Publicar atomicamente:** associar resposta e índice a um identificador de revisão; manter rollback e snapshot anterior.
10. **Monitorar e corrigir:** observar erro de ingestão, taxa de documento obsoleto, abstenção, citação não verificável, incidentes e feedback.
11. **Propagar exclusão:** remover ou bloquear todos os derivados quando a retenção, a autorização ou a decisão de privacidade exigir.

### Integridade, prompt injection e conteúdo não confiável

O texto recuperado deve ser tratado como **dados**, não como instruções para o modelo. Documentos públicos podem conter instruções maliciosas, Unicode invisível, conteúdo adulterado ou texto que tenta alterar a política do sistema. A atualização automática aumenta a superfície de ataque porque adiciona novos caminhos de ingestão. O controle deve combinar proveniência, validação, separação de papéis, menor privilégio, isolamento de locatários, filtros de autorização, testes de injeção indireta e revisão humana para ações externas. A resposta nunca deve ganhar permissão apenas porque uma instrução apareceu em um documento recuperado.

## Avaliação da governança e da atualização

### O que medir antes da liberação

A avaliação deve usar um conjunto congelado e versionado, sem misturar perguntas de ajuste e teste. Estratifique por intenção, fonte, idioma, variedade, dificuldade, temporalidade, risco e grupo de usuário.

**Recuperação e corpus:**

- Recall@k, MRR e nDCG para a posição e cobertura das evidências;
- cobertura de documentos obrigatórios e taxa de recuperação da versão vigente;
- taxa de resultados duplicados, obsoletos, de outra jurisdição ou de outro usuário;
- precisão da detecção de alterações e taxa de chunks órfãos;
- frescura de ingestão e atraso de indexação;
- recuperação correta em português brasileiro, consultas com sinônimos, siglas, negações e números.

**Resposta e proveniência:**

- correção factual e completude, preferencialmente por anotação humana especializada;
- fidelidade ao contexto, sem acrescentar detalhes ausentes;
- citação por afirmação, com fonte acessível, versão e localização;
- distinção entre resposta atual, histórica, conflito e ausência de evidência;
- abstenção apropriada quando o corpus é insuficiente;
- ausência de vazamento e respeito à autorização.

**Mudança e operação:**

- regressão após trocar fonte, parser, chunking, embedding, reranqueador, prompt ou gerador;
- diferença de desempenho entre a revisão anterior e a candidata;
- taxa de respostas sustentadas por versões revogadas;
- custo e latência de atualização, recuperação e rollback;
- tempo para detectar e corrigir incidente;
- distribuição de erros por idioma, região, acessibilidade e grupo afetado.

Benchmarks como DRAGOn mostram a utilidade de snapshots e revisões, mas seu corpus de notícias russas não representa uma norma brasileira, uma sala de aula ou uma decisão clínica. [4] A revisão AUEPORA recomenda avaliar recuperação, geração e sistema completo, além de temporalidade, ambiguidade e operação. [3]

### Contradições que a avaliação deve preservar

- **Atualização versus reprodutibilidade:** uma indexação contínua melhora frescura, mas pode impedir reproduzir a resposta de ontem; snapshots e identificadores de revisão resolvem a tensão.
- **Fonte aberta versus autorização:** disponibilidade pública não elimina direitos autorais, dados pessoais ou restrições de uso.
- **Mais contexto versus mais evidência:** adicionar documentos pode aumentar cobertura e também introduzir conflito, ruído ou fonte de menor autoridade.
- **Automação versus validação:** gerar perguntas e juízos por LLM reduz custo, mas pode produzir rótulos correlacionados com o próprio modelo e não verificar a verdade da fonte.
- **Exclusão versus auditoria:** eliminar dados pessoais pode ser obrigatório, mas logs e versões precisam ser desenhados para não reter indevidamente o conteúdo excluído.
- **Localidade versus generalização:** desempenho em um corpus USP ou hospitalar não prova adequação para outros órgãos, regiões ou variedades do português.

## Aplicações educativas

A revisão sistemática de Li et al. sintetizou 51 estudos de RAG em educação e agrupou aplicações em aprendizagem interativa, produção/avaliação de conteúdo e ecossistemas educacionais. Identificou como desafios alucinação, integração de conhecimento atualizado, custo e suporte multimodal limitado. [18] Isso mostra um espaço de aplicação, não uma prova de que RAG melhore aprendizagem de longo prazo.

Usos compatíveis com uma governança cuidadosa incluem localizar regulamentos e materiais de curso, explicar uma leitura indicada com trechos abertos, organizar revisão, sugerir perguntas, apoiar feedback formativo e auxiliar o professor a encontrar adaptações pedagógicas. O conteúdo deve aparecer como **rascunho verificável**, com fonte, data, nível de evidência e possibilidade de correção.

Para um corpus curricular ou institucional, a atualização deve seguir calendário acadêmico e eventos de mudança de ementa, norma, livro adotado ou política de acessibilidade. Uma resposta deve distinguir o que está no material vigente do que é síntese do modelo. Estudantes não devem ser automaticamente transformados em fonte de treinamento ou memória persistente. Conversas com dados pessoais, desempenho, saúde ou necessidades educacionais exigem finalidade, minimização, retenção e autorização claras. [15] [16]

A UNESCO recomenda abordagem centrada no ser humano, proteção de privacidade, validação ética e pedagógica e adequação etária para IA generativa em educação e pesquisa. [16] O Guia brasileiro de IA generativa para o setor público reforça revisão crítica humana, confidencialidade e cuidado com ferramentas externas; por analogia operacional, esses controles são relevantes para corpora educacionais institucionais, sem transformar a página em evidência experimental. [19]

A governança também é uma questão de equidade: um corpus que só contém português formal, grandes centros, instituições centrais ou material de alta conectividade pode produzir respostas menos úteis para estudantes rurais, pessoas com deficiência, falantes de variedades regionais e usuários em conexão limitada. Documentar ausências é tão importante quanto listar documentos presentes. [13]

## Contexto social, brasileiro e latino-americano

A curadoria distribui visibilidade. Decidir quais fontes entram, qual versão é “oficial”, quais textos são removidos e quais variedades linguísticas são consideradas relevantes afeta quem consegue obter uma resposta e qual interpretação aparece como padrão. Data Statements recomendam explicitar população, finalidade, curadoria e limites de generalização justamente porque grupos indireta ou diretamente afetados podem não ser os usuários que fizeram a coleta. [13]

No Brasil, a LGPD torna a atualização uma questão jurídica e sociotécnica: qualidade inclui atualização, mas necessidade limita o tratamento ao mínimo pertinente; transparência exige informação acessível; segurança e prevenção se estendem ao ciclo de vida. [15] A ANPD destaca que documentação das fontes e filtros pode facilitar monitoramento e exercício de direitos e que o tratamento pode continuar por meio de prompts, conteúdo sintético e refinamento. [14]

Para órgãos públicos, a orientação federal recomenda escolher ferramentas considerando confidencialidade e auditabilidade, evitar inserir dados pessoais, sensíveis, restritos ou sigilosos em serviços externos não aprovados e revisar criticamente qualquer conteúdo gerado. [19] Isso não substitui análise jurídica, política de segurança, avaliação de impacto ou decisão da instituição.

Uma política socialmente responsável deve publicar, quando possível, o catálogo de fontes, critérios de inclusão, datas de atualização, versões e canal de contestação. Quando o conteúdo não puder ser aberto, deve ao menos informar a existência da fonte, sua autoridade, finalidade e regras para acesso. A FAIRness de metadados não autoriza a abertura de conteúdo protegido. [11]

## Fronteira clínica: limite explícito

Este documento **não diagnostica, não prescreve, não seleciona tratamento e não valida um sistema para uso clínico**. Um RAG pode localizar um protocolo, mas uma resposta aparentemente fiel pode estar desatualizada, omitir contraindicação, misturar versões ou ser inadequada para a pessoa concreta. BERTScore, Recall@k, citação ou alta concordância com um contexto não são equivalentes a segurança clínica.

A OMS recomenda que IA em saúde seja governada por ética, direitos humanos, responsabilização, segurança e supervisão, com benefício público e proteção das pessoas afetadas. [17] Em caso de sintomas, dose, urgência, contraindicação ou conduta, a pessoa deve procurar profissional de saúde qualificado ou serviço de urgência local; não deve usar este relatório ou um sistema RAG como única base de decisão.

O estudo brasileiro hospitalar citado é útil para engenharia de corpus e avaliação em português, mas seus resultados são de documentos regulatórios internos, não demonstram benefício clínico, não substituem aprovação institucional e não autorizam uso autônomo. [6]

## Comparação textual técnica e acionável dos casos 12/14/15

**Caso 12 — Especificação técnica RAG.** O documento trata o corpus como parte de uma arquitetura modular: identidade documental, metadados, filtros de autorização, recuperação, geração, citação, abstenção, segurança, observabilidade e ciclo de vida. É a referência mais adequada para decidir **o que precisa existir antes da atualização**. Sua limitação é de natureza epistemológica: muitos itens são requisitos de projeto derivados de literatura e de diretrizes, não resultados de um único experimento. Ação: transformar seus campos de proveniência, vigência, autorização, versão e rollback em critérios de entrada e liberação.

**Caso 14 — Avaliação e métricas RAG.** O documento separa recuperação, geração e sistema completo e acrescenta temporalidade, ruído, conflito, abstenção, citação e impacto humano. É a referência mais adequada para decidir **como saber se uma atualização melhorou ou piorou o sistema**. Sua limitação é que uma métrica positiva não corrige a escolha de uma fonte inadequada nem substitui revisão humana em alto risco. Ação: manter conjunto de regressão versionado, comparar revisão anterior e candidata, medir documento vigente e citação por afirmação, e publicar resultados por estrato.

**Caso 15 — não localizado.** Não foi encontrado arquivo 15 no diretório compartilhado nem uma referência verificável que permitisse identificar título, escopo ou critérios. Não é tecnicamente defensável preencher essa ausência com uma suposição. Ação: antes de integrar seus requisitos, obter o arquivo ou a referência original; depois repetir a comparação contra os mesmos eixos: finalidade, unidade documental, proveniência, atualização, autorização, métricas, riscos, usuários e evidência.

**Decisão prática enquanto o caso 15 não está disponível:** usar 12 como contrato de governança do corpus, 14 como contrato de medição e manter qualquer terceiro conjunto de requisitos em estado “não confirmado”. Nenhum dos três deve ser interpretado como autorização para diagnóstico, tratamento, decisão disciplinar, classificação de estudante ou ação externa autônoma.

## Recomendações de prioridade

1. **Bloquear a publicação de documento sem identidade, fonte, versão, vigência, licença, classificação e responsável.**
2. **Manter snapshots imutáveis do corpus, representação, embeddings e índice, com relação de derivação.**
3. **Aplicar autorização e temporalidade antes de enviar candidatos ao gerador.**
4. **Separar ingestão automática de aprovação de conteúdo em fontes de alta consequência.**
5. **Testar alteração, revogação, conflito, documento sem resposta, versão histórica, negação, número e citação.**
6. **Medir atraso de atualização, taxa de fonte obsoleta, cobertura de mudança e resposta sustentada pela versão correta.**
7. **Propagar exclusão a chunks, vetores, caches, logs e respostas armazenadas, com teste de não recuperação.**
8. **Publicar limitações linguísticas, sociais e de cobertura, incluindo o que o corpus não contém.**
9. **Usar revisão humana especialista para saúde, direitos, benefícios, avaliação educacional e qualquer ação com efeito material.**
10. **Reavaliar quando mudar corpus, parser, OCR, chunking, embedding, reranqueador, prompt ou gerador; uma mudança “só no índice” também muda a evidência.**

## Fichas críticas das fontes

### [1] Lewis et al. — artigo fundador de RAG

- **Autores/ano:** Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel e Douwe Kiela, 2020; versão arXiv revisada em 2021.
- **Identificador:** arXiv:2005.11401; DOI de registro arXiv 10.48550/arXiv.2005.11401; PMID não aplicável.
- **Tipo:** artigo de pesquisa, aceito na NeurIPS 2020.
- **População/contexto:** tarefas de NLP intensivas em conhecimento, com índice denso baseado em Wikipedia; não é população clínica ou educacional.
- **Achados:** memória paramétrica e não paramétrica podem ser combinadas; variantes RAG superaram baselines paramétricos em tarefas avaliadas e produziram linguagem mais específica, diversa e factual no cenário experimental.
- **Limitações:** domínio e benchmarks específicos; não resolve autoridade da fonte, atualização operacional, privacidade ou segurança; não prova desempenho em português brasileiro.
- **Verificação:** página arXiv original e resumo verificados; texto integral acessível em PDF/HTML, mas não contado na leitura integral local das cinco fontes baixadas.

### [2] Gao et al. — revisão de RAG

- **Autores/ano:** Yunfan Gao, Yun Xiong, Xinyu Gao, Kangxiang Jia, Jinliu Pan, Yuxi Bi, Yi Dai, Jiawei Sun, Meng Wang e Haofen Wang, 2024.
- **Identificador:** arXiv:2312.10997v5; DOI/PMID formal não confirmado no registro consultado; DOI de registro arXiv não usado como DOI editorial.
- **Tipo:** revisão técnica.
- **População/contexto:** métodos de RAG, componentes de recuperação, geração, aumento e benchmarks.
- **Achados:** propõe a distinção entre RAG ingênuo, avançado e modular; descreve indexação, recuperação e geração e aponta conhecimento desatualizado, ruído, contradição e rastreabilidade como problemas.
- **Limitações:** revisão técnica, não meta-análise causal; mistura métodos e benchmarks heterogêneos, majoritariamente anglófonos.
- **Verificação:** HTML original do arXiv verificado e seções relevantes lidas; texto integral acessível.

### [3] Yu et al. — AUEPORA

- **Autores/ano:** Hao Yu, Aoran Gan, Kai Zhang, Shiwei Tong, Qi Liu e Zhaofeng Liu, 2024.
- **Identificador:** arXiv:2405.07437v2; DOI/PMID editorial não confirmado.
- **Tipo:** revisão técnica e análise de frameworks/benchmarks.
- **População/contexto:** 12 frameworks e benchmarks de avaliação RAG, separados em recuperação, geração e sistema completo.
- **Achados:** bases dinâmicas acrescentam temporalidade e contradição; métricas isoladas não cobrem a interação dos módulos; latência, ambiguidade e consultas complexas são relevantes.
- **Limitações:** preprint; corte de literatura e critérios dependem da revisão; não oferece benchmark brasileiro nem limiar universal.
- **Verificação:** HTML original e PDF acessíveis; trechos centrais lidos, não contado como leitura integral local.

### [4] Chernogorskii et al. — DRAGOn

- **Autores/ano:** Fedor Chernogorskii, Sergei Averkiev, Liliya Kudraleeva, Zaven Martirosian, Maria Tikhonova, Valentin Malykh e Alena Fenogenova, 2026.
- **Identificador:** DOI 10.18653/v1/2026.eacl-srw.48; ACL Anthology 2026.eacl-srw.48; PMID não aplicável.
- **Tipo:** artigo de conferência e metodologia/benchmark.
- **População/contexto:** notícias russas coletadas periodicamente; datasets públicos, privados e sandbox; leaderboard dinâmico.
- **Achados:** detecta diferenças entre revisões, atualiza segmentos, versiona datasets e vincula resultados a uma revisão; novas versões reduzem vazamento e melhoram reprodutibilidade.
- **Limitações:** estudante/workshop; russo e notícias não representam português brasileiro, norma, educação ou saúde; geração automática de perguntas e juízes LLM ainda exigem validação.
- **Verificação:** página ACL e PDF original verificados; PDF baixado e texto integral percorrido para esta pesquisa.

### [5] Kuratomi et al. — assistente institucional da USP

- **Autores/ano:** Gustavo Kuratomi, Paulo Pirozelli, Fabio G. Cozman e Sarajane M. Peres, 2024; preprint relacionado em 2025.
- **Identificador:** DOI 10.5753/eniac.2024.245243; arXiv relacionado 2501.13880; PMID não aplicável.
- **Tipo:** artigo de aplicação/avaliação RAG em conferência brasileira.
- **População/contexto:** 866 documentos normativos da Universidade de São Paulo, coletados para janeiro de 2023 a maio de 2024; 592 perguntas geradas e revisadas, com versão parafraseada.
- **Achados:** Top-5 de recuperação de 30%, geração de 22,04%, 54,02% com chunks corretos e 13,68% sem contexto; o acesso à base foi gargalo importante.
- **Limitações:** perguntas derivadas do próprio corpus, parte artificial; uma instituição; banco vetorial descrito como estático apesar de corpus dinâmico; não mede impacto educacional ou justiça.
- **Verificação:** página SBC, arXiv e PDF original verificados; PDF baixado e texto integral percorrido.

### [6] Cunha et al. — RAG hospitalar em português

- **Autores/ano:** Murilo Vargas da Cunha, Marília Rosa Silveira, César Brasil Sperb, Brenda Salenave Santana, Larissa Astrogildo Freitas e Ulisses Brisolara Corrêa, 2026.
- **Identificador:** ACL Anthology 2026.propor-1.74; DOI não informado no registro consultado; PMID não aplicável.
- **Tipo:** artigo de conferência PROPOR, avaliação end-to-end.
- **População/contexto:** 107 documentos normativos internos de cinco departamentos hospitalares; dataset híbrido, com 90 pares sintéticos, 118 interações validadas e 192 pares.
- **Achados:** multilingual-e5-small teve falha de recuperação de 1,4% no cenário; RRF foi alternativa de custo/desempenho; o estudo compara componentes mantendo contexto recuperado em parte da análise.
- **Limitações:** uma instituição e corpus pequeno; BERTScore não mede plenamente exceções e segurança; não é validação clínica, prospectiva ou multicêntrica.
- **Verificação:** ACL e PDF original verificados; PDF baixado e texto integral percorrido.

### [7] Costa e Souza-Filho — adaptação em QA português

- **Autores/ano:** Leandro Yamachita da Costa e João Baptista de Oliveira e Souza Filho, 2024.
- **Identificador:** ACL Anthology 2024.stil-1.22; DOI não localizado no registro; PMID não aplicável.
- **Tipo:** artigo de conferência brasileira comparando fine-tuning e RAG.
- **População/contexto:** QA em português, datasets Pirá 2.0 e uma tradução de Dolly; modelos PTT5 e Llama 3, com BM25, DPR e ColBERT.
- **Achados:** fontes externas melhoraram respostas em cenários avaliados; combinação de fine-tuning supervisionado e RAG foi a mais eficaz no estudo, sob recursos limitados.
- **Limitações:** não é estudo de governança de corpus nem de atualização contínua; datasets e métricas têm escopo específico; avaliação inclui métricas textuais e juiz GPT.
- **Verificação:** página ACL e PDF original verificados; PDF baixado e texto integral percorrido.

### [8] de Aquino et al. — extração em documentos legais brasileiros

- **Autores/ano:** Isabella V. de Aquino, Matheus M. dos Santos, Carina F. Dorneles e Jônata T. Carvalho, 2024.
- **Identificador:** DOI 10.5753/sbbd_estendido.2024.244241; PMID não aplicável.
- **Tipo:** artigo de workshop/SBBD sobre workflow de extração com RAG.
- **População/contexto:** 40 documentos legais brasileiros e duas variáveis-alvo.
- **Achados:** melhor workflow obteve acurácia média de 90%, contra 58,75% de expressões regulares; cada variável exigiu combinação própria de parâmetros.
- **Limitações:** amostra pequena, tarefa de extração e não diálogo; resultados não definem política de atualização, autoridade ou generalização para legislação nacional.
- **Verificação:** página SBC original e PDF acessível; resumo, método e resultados lidos; texto integral localizado.

### [9] NIST AI 600-1

- **Entidade/autores/ano:** National Institute of Standards and Technology; Chloe Autio, Reva Schwartz, Jesse Dunietz, Shomik Jain, Martin Stanley, Elham Tabassi, Patrick Hall e Kamie Roberts, 2024.
- **Identificador:** DOI 10.6028/NIST.AI.600-1; PMID não aplicável.
- **Tipo:** perfil oficial voluntário de gestão de risco de IA generativa.
- **População/contexto:** uso transversal de sistemas generativos, sem população experimental.
- **Achados:** estrutura Govern, Map, Measure e Manage; inclui proveniência de conteúdo, testes pré-implantação, transparência, privacidade, segurança, equidade e incidentes.
- **Limitações:** orientação voluntária; não especifica RAG, corpus brasileiro ou limiar de liberação.
- **Verificação:** página oficial NIST, DOI e link PDF verificados; página integral lida e PDF acessível; PDF não contado como leitura integral local.

### [10] W3C PROV-DM

- **Entidade/autores/ano:** World Wide Web Consortium; Luc Moreau e Paolo Missier, editores, com colaboradores, 2013.
- **Identificador:** W3C Recommendation; DOI/PMID não aplicável/localizado.
- **Tipo:** especificação técnica normativa de modelo de proveniência.
- **População/contexto:** modelo agnóstico de domínio para entidades, atividades, agentes, derivações, coleções e tempo.
- **Achados:** permite representar como uma entidade foi criada, usada, transformada e derivada, e apoiar análise de qualidade, confiabilidade e reprodutibilidade.
- **Limitações:** não define política de autoridade, segurança, privacidade ou métrica de RAG; precisa de um perfil operacional para o corpus.
- **Verificação:** documento original W3C e seções normativas/relevantes lidas; texto integral HTML acessível.

### [11] Wilkinson et al. — princípios FAIR

- **Autores/ano:** Mark D. Wilkinson, Michel Dumontier, IJsbrand Jan Aalbersberg e coautores, 2016.
- **Identificador:** DOI 10.1038/sdata.2016.18; PMID não usado/localizado.
- **Tipo:** artigo de princípios para gestão e stewardship de dados.
- **População/contexto:** dados e metadados científicos, com aplicação geral a objetos digitais.
- **Achados:** Findable, Accessible, Interoperable e Reusable; requer identificadores, metadados ricos, autenticação quando necessária, licença e proveniência detalhada.
- **Limitações:** princípios não são uma especificação de RAG nem uma autorização para abrir dados sensíveis; não definem periodicidade de atualização.
- **Verificação:** artigo original Nature e quadro FAIR lidos; HTML integral acessível por seções.

### [12] Gebru et al. — Datasheets for Datasets

- **Autores/ano:** Timnit Gebru, Jamie Morgenstern, Briana Vecchione, Jennifer Wortman Vaughan, Hanna Wallach, Hal Daumé III e Kate Crawford, 2018; publicação CACM em 2021.
- **Identificador:** arXiv:1803.09010; DOI de registro 10.48550/arXiv.1803.09010; DOI editorial não confirmado.
- **Tipo:** proposta metodológica de documentação de datasets.
- **População/contexto:** datasets de aprendizado de máquina, especialmente em domínios de alto impacto.
- **Achados:** datasheet deve documentar motivação, composição, coleta, usos recomendados, distribuição e manutenção para melhorar comunicação, transparência e responsabilização.
- **Limitações:** estrutura proposta, não prova causal de redução de dano; perguntas precisam ser adaptadas a documentos vivos, direitos e bases pessoais.
- **Verificação:** página arXiv original e PDF baixado/convertido; texto integral do artigo foi percorrido para esta pesquisa.

### [13] Bender e Friedman — Data Statements para NLP

- **Autores/ano:** Emily M. Bender e Batya Friedman, 2018.
- **Identificador:** DOI 10.1162/tacl_a_00041; ACL Anthology Q18-1041; PMID não aplicável.
- **Tipo:** artigo metodológico em TACL.
- **População/contexto:** datasets e sistemas de processamento de linguagem natural, com foco em população, idioma, falantes, anotadores e curadores.
- **Achados:** documentar contexto do dataset melhora precisão sobre generalização, ajuda a revelar exclusão e vieses e informa implantação adequada; distingue partes interessadas diretas e indiretas.
- **Limitações:** proposta profissional, não avaliação de um pipeline RAG; não elimina vieses por si só e não substitui participação das comunidades afetadas.
- **Verificação:** ACL Anthology e PDF original verificados; PDF baixado e texto integral percorrido.

### [14] ANPD — Radar Tecnológico: IA Generativa

- **Entidade/ano:** Autoridade Nacional de Proteção de Dados, volume 3, 2024.
- **Identificador:** ISBN/DOI/PMID não confirmado na versão brasileira consultada; URL oficial do PDF verificada.
- **Tipo:** estudo técnico orientativo oficial brasileiro.
- **População/contexto:** IA generativa, tratamento de dados pessoais e contexto brasileiro, com exemplos de instituições públicas, saúde e setor bancário.
- **Achados:** chama atenção para eliminação, prompts, conteúdo sintético, refinamento contínuo, transparência da documentação de fontes e princípio da necessidade; descreve riscos sociais e de proteção de dados.
- **Limitações:** radar orientativo, não decisão regulatória específica para todo RAG; não fornece benchmark nem limiar técnico.
- **Verificação:** PDF original ANPD e seções de eliminação, princípios, casos e considerações finais lidos; texto integral acessível, mas não contado como leitura integral local.

### [15] Lei Geral de Proteção de Dados — LGPD

- **Entidade/ano:** Presidência da República, Brasil, Lei nº 13.709, de 14 de agosto de 2018, com alterações posteriores.
- **Identificador:** Lei 13.709/2018; DOI/PMID não aplicável.
- **Tipo:** legislação oficial.
- **População/contexto:** tratamento de dados pessoais no Brasil.
- **Achados:** princípios de finalidade, adequação, necessidade, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização; medidas de segurança desde a concepção; tutela de direitos e eliminação conforme o caso.
- **Limitações:** interpretação e aplicação dependem do caso concreto, base legal, setor, regulamentação e autoridade competente; a lei não especifica arquitetura RAG.
- **Verificação:** texto oficial do Planalto consultado e artigos relevantes lidos; texto integral acessível.

### [16] UNESCO — Guia para IA generativa na educação e na pesquisa

- **Entidade/autores/ano:** UNESCO; Fengchun Miao e Wayne Holmes, 2023; página atualizada em 2026.
- **Identificador:** ISBN da edição portuguesa 978-92-3-700028-1, conforme registro-base; DOI/PMID não localizado.
- **Tipo:** guia oficial de política e uso responsável.
- **População/contexto:** escolas, universidades, pesquisa, governos, estudantes e proteção de dados em educação.
- **Achados:** propõe abordagem centrada no ser humano, proteção de privacidade, validação ética e pedagógica, adequação etária, equidade e preparação institucional.
- **Limitações:** não é revisão sistemática de eficácia nem protocolo específico de atualização de corpus; recomendações exigem adaptação nacional e institucional.
- **Verificação:** página oficial UNESCO e registro/links de texto em português verificados; página integral lida; PDF português identificado, mas não contado como leitura integral local.

### [17] OMS — Ethics and governance of artificial intelligence for health

- **Entidade/ano:** Organização Mundial da Saúde, 2021.
- **Identificador:** ISBN 9789240029200; DOI/PMID não localizado.
- **Tipo:** diretriz oficial.
- **População/contexto:** sistemas de IA em saúde, trabalhadores, comunidades, pacientes e instituições.
- **Achados:** seis princípios de consenso e recomendações para benefício público, supervisão, responsabilização, segurança, direitos humanos e proteção das pessoas afetadas.
- **Limitações:** não define métricas RAG, aprovação clínica ou protocolo de implantação local; exige complementação por governança institucional e regulação.
- **Verificação:** página oficial WHO e download integral identificado; página e resumo lidos, PDF não contado como leitura integral local.

### [18] Li et al. — revisão sistemática de RAG na educação

- **Autores/ano:** Zongxi Li, Zijian Wang, Weiming Wang, Kevin Hung, Haoran Xie e Fu Lee Wang, 2025.
- **Identificador:** DOI 10.1016/j.caeai.2025.100417; PMID não localizado.
- **Tipo:** revisão sistemática/levantamento em *Computers and Education: Artificial Intelligence*.
- **População/contexto:** 51 estudos de RAG em contextos educacionais, organizados por aprendizagem interativa, conteúdo/avaliação e ecossistemas.
- **Achados:** aplicações em feedback, conteúdo, avaliação e apoio educacional; desafios de alucinação, completude, atualidade, custo e multimodalidade.
- **Limitações:** literatura heterogênea e recente; não é meta-análise quantitativa de aprendizagem; aplicações não provam ganho educacional de longo prazo.
- **Verificação:** página original ScienceDirect, DOI e seções de método/conclusão verificados; texto integral HTML acessível por seções, não contado como leitura integral local.

### [19] Governo Digital — Guia de IA Generativa

- **Entidade/ano:** Governo Federal do Brasil, Secretaria de Governo Digital; ano de publicação não informado explicitamente na página consultada.
- **Identificador:** não aplicável; DOI/PMID não aplicável.
- **Tipo:** guia prático oficial para uso de IA generativa no setor público.
- **População/contexto:** servidores e órgãos públicos, escolha de ferramentas, confidencialidade, governança de dados e revisão humana.
- **Achados:** recomenda considerar confidencialidade e auditabilidade, evitar dados pessoais/sensíveis e informações restritas em ferramentas externas não aprovadas e revisar criticamente todo conteúdo gerado.
- **Limitações:** guia operacional, não estudo de eficácia nem norma única para todos os órgãos; ano não confirmado e orientações devem ser lidas com políticas internas, LGPD e atos aplicáveis.
- **Verificação:** página oficial e seções de critérios, compartilhamento, governança e revisão crítica lidas; texto completo HTML acessível; não contado como leitura integral local.

## Estatísticas honestas de busca e leitura

- **Fontes encontradas e selecionadas/citadas neste relatório:** 19 registros originais ou oficiais.
- **Fontes verificadas em página original, repositório institucional, editora ou órgão oficial:** 19/19.
- **Textos integrais efetivamente obtidos e percorridos para leitura textual local:** 5/19 PDFs científicos — DRAGOn, assistente USP, estudo hospitalar PROPOR, estudo STIL sobre português e Data Statements. Os demais tiveram a página original e os trechos diretamente relevantes lidos; quando a página oferecia PDF integral, isso foi marcado na ficha sem converter essa acessibilidade em “leitura integral”.
- **Textos integrais acessíveis em fonte original:** 19/19, em PDF, HTML ou legislação; o identificador editorial do estudo Costa e Souza-Filho não foi confirmado, embora seu PDF ACL esteja acessível.
- **Revisões sistemáticas/levantamentos incluídos:** 3 — AUEPORA, revisão geral de RAG e revisão educacional; nenhuma meta-análise quantitativa específica de governança/atualização de corpus foi localizada.
- **Estudos diretamente brasileiros ou em português:** 4 — USP, Cunha et al., Costa e Souza-Filho e de Aquino et al.; a evidência local continua pequena e heterogênea.
- **Fontes com DOI identificado:** 9/19, contando DOI de artigo, registro arXiv explicitamente indicado e o DOI do NIST; para arXiv/W3C, quando DOI editorial não foi confirmado, isso foi explicitamente sinalizado.
- **Fontes com PMID confirmado:** 0/19.
- **Data de consulta:** 2026-10-22.

## References

[1]: https://arxiv.org/abs/2005.11401 "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
[2]: https://arxiv.org/html/2312.10997 "Retrieval-Augmented Generation for Large Language Models: A Survey"
[3]: https://arxiv.org/html/2405.07437v2 "Evaluation of Retrieval-Augmented Generation: A Survey"
[4]: https://aclanthology.org/2026.eacl-srw.48/ "DRAGOn: Designing RAG On Periodically Updated Corpus"
[5]: https://doi.org/10.5753/eniac.2024.245243 "A RAG-Based Institutional Assistant"
[6]: https://aclanthology.org/2026.propor-1.74/ "Avaliação End-to-End de um Sistema RAG para Documentos Hospitalares em Português"
[7]: https://aclanthology.org/2024.stil-1.22/ "Adapting LLMs to New Domains: A Comparative Study of Fine-Tuning and RAG strategies for Portuguese QA Tasks"
[8]: https://doi.org/10.5753/sbbd_estendido.2024.244241 "Extracting Information from Brazilian Legal Documents with Retrieval Augmented Generation"
[9]: https://doi.org/10.6028/NIST.AI.600-1 "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile"
[10]: https://www.w3.org/TR/prov-dm/ "PROV-DM: The PROV Data Model"
[11]: https://doi.org/10.1038/sdata.2016.18 "The FAIR Guiding Principles for scientific data management and stewardship"
[12]: https://arxiv.org/abs/1803.09010 "Datasheets for Datasets"
[13]: https://doi.org/10.1162/tacl_a_00041 "Data Statements for Natural Language Processing: Toward Mitigating System Bias and Enabling Better Science"
[14]: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/documentos-tecnicos-orientativos/radar_tecnologico_ia_generativa_anpd.pdf/@@display-file/file "Radar Tecnológico: Inteligência Artificial Generativa"
[15]: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm "Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018"
[16]: https://unesdoc.unesco.org/ark:/48223/pf0000390241_por "Guia para a IA generativa na educação e na pesquisa"
[17]: https://www.who.int/publications/i/item/9789240029200 "Ethics and governance of artificial intelligence for health"
[18]: https://doi.org/10.1016/j.caeai.2025.100417 "Retrieval-augmented generation for educational application: A systematic survey"
[19]: https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/inteligencia-artificial-1/publicacoes/guia-ia-generativa "Guia de IA Generativa — Governo Digital"
