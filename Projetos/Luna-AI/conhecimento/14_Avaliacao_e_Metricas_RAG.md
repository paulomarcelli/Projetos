# Avaliação e métricas RAG

**Domínio:** avaliação e métricas de sistemas de Geração Aumentada por Recuperação (RAG)  
**Data de consulta:** 2026-10-22  
**Escopo:** métricas de recuperação, geração e sistema completo; benchmarks; avaliação humana e por LLM; educação; português/Brasil; contexto social e clínico.

Em RAG, uma única nota final é insuficiente. O sistema combina uma etapa que seleciona evidências e outra que redige uma resposta; portanto, é preciso medir separadamente **recuperação**, **uso fiel do contexto**, **correção/completude da resposta** e **efeitos de uso**. A revisão Auepora organiza o problema justamente por “o que avaliar”, “como avaliar” e “como medir” e conclui que os benchmarks existentes ainda não cobrem de modo holístico a interação entre os módulos, bases dinâmicas, tarefas abertas e requisitos operacionais. [1]

## O que conta como evidência de qualidade

### 1. Recuperação: encontrar e ordenar evidências úteis

A unidade deve ser definida antes da métrica: documento, trecho (*chunk*), afirmação ou fonte. Para um conjunto de consultas com relevância anotada, as métricas clássicas são úteis, mas não equivalentes:

- **Precision@k:** proporção dos itens retornados no topo-k que são relevantes. Penaliza contexto irrelevante, mas pode não mostrar se uma evidência necessária ficou fora do topo.
- **Recall@k:** proporção das evidências relevantes que aparecem no topo-k. É importante quando omitir um único documento pode tornar a resposta incompleta. A fórmula depende do conjunto de relevantes conhecido; não deve ser interpretada como “verdade” quando a anotação é incompleta. [1]
- **MRR@k (Mean Reciprocal Rank):** média de `1/rank` do primeiro item relevante. É adequada quando a primeira evidência correta é decisiva, mas ignora o restante da lista. [1]
- **MAP@k:** média da precisão nas posições relevantes. É mais informativa quando várias evidências devem aparecer, porém pressupõe julgamentos de relevância confiáveis. [1]
- **nDCG@k:** dá mais peso às posições iniciais e admite graus de relevância. É preferível quando uma fonte pode ser parcialmente útil ou quando a qualidade da ordem importa.
- **Cobertura/recall de afirmações:** mede quantas afirmações necessárias à resposta de referência estão cobertas pelos trechos. A versão em nível de afirmação do RAGChecker é mais diagnóstica que tratar um trecho inteiro como simplesmente “relevante”. [6]

As métricas de ranking não medem, sozinhas, se o gerador realmente usou a evidência, se a fonte é confiável ou se a resposta está correta. O mesmo MRR pode resultar de um trecho relevante, porém desatualizado, ou de um trecho que contém a palavra certa e induz uma interpretação errada. Para dados temporais, a data de corte da base, a janela de validade da evidência e a política para documentos contraditórios precisam fazer parte do conjunto de teste. [1]

### 2. Geração: responder corretamente e com base no contexto

As dimensões não devem ser colapsadas:

- **Fidelidade/aterramento (*faithfulness/groundedness*):** cada afirmação da resposta é implicada pelo contexto recuperado? Uma resposta pode ser correta por conhecimento prévio e, ainda assim, infiel ao contexto que deveria fundamentá-la.
- **Correção factual (*correctness*):** a resposta coincide com a resposta de referência ou com a verdade validada? Requer referência, verificador ou anotação especialista.
- **Relevância da resposta:** a resposta atende à intenção da consulta, sem evasão, conteúdo redundante ou digressão. Não é sinônimo de correção: uma resposta pode ser pertinente e falsa.
- **Completude:** cobre todas as partes da pergunta e as exceções necessárias? A pergunta “quais são os prazos e as exceções?” não é bem avaliada por uma única similaridade média.
- **Utilização de contexto:** entre as evidências relevantes recuperadas, quantas foram efetivamente refletidas na resposta? **Sensibilidade a ruído** separa o dano de contexto irrelevante ou enganoso.
- **Abstenção/recusa apropriada:** diante de contexto insuficiente, o sistema deve dizer que não é possível responder, em vez de preencher a lacuna com plausibilidade. RGB mostrou que essa capacidade é mensurável e difícil. [4]
- **Citações e atribuição:** presença da fonte não basta. Avaliar se cada afirmação está ligada à fonte correta, se a fonte realmente a sustenta, se a citação está no lugar certo e se a cobertura é completa. O CRUD-RAG resume essa evolução como avaliação de citações em nível de cláusula, localização e precisão/recall de citações. [5]

### 3. Métricas de texto: úteis, mas parciais

**ROUGE** mede sobreposição lexical ou de subsequências com referências humanas. ROUGE-N é baseado em n-gramas e ROUGE-L em subsequência comum mais longa; o trabalho original avaliou correlação com julgamentos humanos em DUC. [9] É útil para sumarização com referência, mas não demonstra fidelidade ao documento, validade de citações, correção numérica ou segurança.

**BERTScore** compara tokens por embeddings contextualizados e foi avaliado em 363 sistemas de tradução automática e descrição de imagens, com melhor correlação humana e maior robustez a paráfrases que métricas anteriores. [8] Em RAG, pode captar equivalência semântica melhor que n-gramas, mas continua sendo uma comparação com referência; um texto semanticamente parecido pode omitir uma exceção crítica, apoiar-se em evidência errada ou conter uma afirmação clínica perigosa.

**Exact match, F1 de tokens, BLEU e acurácia** são adequados para respostas curtas e bem especificadas. Para respostas longas, a coincidência exata é excessivamente rígida. O próprio RAGChecker mostra que acurácia de resposta completa pode ser baixa mesmo quando várias afirmações são corretas, razão pela qual propõe precisão, recall e F1 no nível de afirmações. [6]

### 4. Métricas de sistema completo

A avaliação end-to-end deve incluir pelo menos:

1. **Qualidade:** correção, completude, fidelidade, relevância, atribuição e abstenção.
2. **Robustez:** ruído, documentos conflitantes, informação contrafactual, perguntas multi-hop, variação de paráfrase e consultas sem resposta.
3. **Atualidade:** desempenho em documentos posteriores ao treinamento, validade temporal e comportamento quando a base muda.
4. **Operação:** latência, custo por consulta, tamanho de contexto, taxa de erro, disponibilidade e reprodutibilidade.
5. **Efeito humano:** utilidade percebida, esforço de verificação, confiança calibrada e impacto na tarefa real.

A vantagem de uma nota agregada é ordenar configurações; o risco é mascarar o mecanismo da falha. Deve-se publicar o vetor de métricas e intervalos de incerteza, não apenas uma média. A não determinismo do gerador e do juiz também recomenda repetir consultas, reportar distribuição/intervalo e fixar modelo, versão, temperatura, *prompt*, corpus, *chunking*, top-k e data de indexação. [1] [16]

## O que os trabalhos primários mostram

### RAGAs: avaliação sem referência humana

RAGAs propõe três dimensões sem referência de resposta humana: **context relevance**, **faithfulness** e **answer relevance**. Para fidelidade, decompõe a resposta em afirmações e pede a um LLM que verifique se cada uma pode ser inferida do contexto; para relevância da resposta, gera perguntas potenciais a partir da resposta e compara embeddings com a pergunta; para relevância de contexto, identifica sentenças do contexto necessárias à pergunta. O conjunto WikiEval contém 50 páginas da Wikipédia com eventos posteriores ao corte do modelo, e dois anotadores tiveram concordância aproximada de 95% para fidelidade/relevância de contexto e 90% para relevância de resposta. [2]

A virtude operacional é permitir ciclos rápidos quando não há resposta-ouro. A limitação estrutural é que o juiz avalia consistência com o contexto, não a verdade do contexto. Um contexto incorreto ou tendencioso pode gerar alta fidelidade. A métrica de relevância também não mede factualidade. O conjunto inicial é pequeno e predominantemente em inglês; o resultado é sensível ao LLM, ao *prompt*, ao modelo de embedding e à decomposição de afirmações. RAGAs é melhor tratado como triagem e diagnóstico comparativo, não como certificação de correção.

### ARES: juiz adaptado ao domínio com incerteza

ARES treina juízes leves para **context relevance**, **answer faithfulness** e **answer relevance**, usando dados sintéticos gerados do corpus e um conjunto humano de validação. Usa *prediction-powered inference* (PPI) para corrigir predições e produzir intervalos de confiança. Foi avaliado em oito tarefas de KILT, SuperGLUE e AIS; os autores reportaram desempenho superior ao RAGAs em ranking de configurações, ganho médio de Kendall-tau de 0,065 em relevância de contexto e 0,132 em relevância de resposta, além de 78% menos anotações que a linha de base anotada. [3]

O ganho não é “automatização sem humanos”: depende de exemplos de domínio, dados sintéticos, juízes treinados e uma amostra humana para calibração. ARES não avaliou fidelidade em todos os conjuntos por falta de respostas alucinadas anotadas. A transferência entre domínios foi demonstrada em contextos selecionados, não em todos os idiomas, instituições ou riscos. Intervalos são preferíveis a uma nota pontual, mas não eliminam erro de especificação do critério.

### RAGChecker: diagnóstico em nível de afirmação

RAGChecker separa duas pessoas usuárias da avaliação: quem quer comparar sistemas e quem quer descobrir a causa da falha. Extrai afirmações da resposta e da referência, verifica implicação nos trechos e calcula precisão/recall/F1 geral. Para o recuperador, calcula *claim recall* e precisão de contexto; para o gerador, separa fidelidade, sensibilidade a ruído relevante/irrelevante, alucinação, conhecimento próprio e utilização de contexto. [6]

O estudo usa 4.162 consultas em dez domínios e compara oito sistemas formados por dois recuperadores e quatro geradores. Em meta-avaliação com 280 pares e dois anotadores, afirma correlação superior com preferências humanas; a concordância humana reportada foi 90,95%. O desenho é acionável porque mostra, por exemplo, o trade-off entre melhorar o recall e introduzir ruído. [6]

Há limites importantes: o extrator e verificador principal são o Llama-3-70B, caro e potencialmente correlacionado com o sistema avaliado; o benchmark reutiliza bases públicas, transforma respostas curtas em longas com GPT-4 e usa apenas dois anotadores na meta-avaliação. A própria revisão do artigo questiona a comparabilidade entre métricas de aspectos diferentes e a transparência da extração/implicação. Logo, a granularidade melhora o diagnóstico, mas adiciona uma camada de julgamento que também precisa de validação.

### RGB: ruído, recusa, integração e contrafactuais

RGB constrói um benchmark em inglês e chinês a partir de notícias recentes, para reduzir sobreposição com o conhecimento interno dos modelos. Tem 600 perguntas-base, mais 200 perguntas de integração de informação e 200 de robustez contrafactual; metade das instâncias é em inglês e metade em chinês. Os quatro *testbeds* medem: (i) robustez a ruído, (ii) rejeição negativa quando nenhum documento responde, (iii) integração de múltiplos documentos e (iv) detecção/correção de informação falsa. Usa acurácia, taxa de rejeição, detecção e correção de erro. [4]

O achado central é que os modelos ainda são facilmente confundidos por documentos semelhantes, falham em integrar subperguntas, respondem quando deveriam recusar e confiam em informação contrafactual mesmo quando advertidos. Na rejeição negativa, as maiores taxas reportadas foram apenas 45% em inglês e 43,33% em chinês em uma das formas de avaliação. [4]

RGB é forte como teste de estresse, mas não representa automaticamente uma aplicação brasileira: os dados são notícias, as perguntas e respostas são geradas com ChatGPT e verificadas manualmente, e a métrica de acurácia por correspondência exata depende de formatos de resposta. É necessário acrescentar avaliação de explicação, citação, calibração e equidade.

### CRUD-RAG: sair do QA estreito

CRUD-RAG classifica interações com a base de conhecimento em **Create**, **Read**, **Update** e **Delete**. O benchmark chinês inclui continuação de texto, QA de um, dois e três documentos, correção de alucinação e sumarização multi-documento. A base de recuperação tem 86.834 itens; os conjuntos têm 10.728 continuações, 3.199 QA de um documento, 3.192 de dois, 3.189 de três, 5.130 casos de modificação de alucinação e 10.728 casos de sumarização. [5]

O benchmark é útil para testar se uma otimização para QA generaliza para correção, criação e sumarização. Também avalia tamanho de *chunk*, estratégia de recuperação, top-k, sobreposição, reranking, modelo de embedding, base e LLM. Contudo, a construção usa notícias chinesas e GPT-4; continuações e sumarizações foram construídas de modo reverso, portanto a correspondência do contexto-ouro pode ser vaga. Os resultados não devem ser transportados diretamente para português, domínio regulatório ou saúde.

### Auepora: síntese das lacunas

A revisão de Yu et al. compila 12 frameworks e benchmarks e separa pares entre saída avaliável e verdade-ouro. Ela ressalta que recuperação e geração devem ser medidas em níveis diferentes, que bases dinâmicas podem trazer fatos contraditórios e que latência, ambiguidade, diversidade, ruído e rejeição são requisitos adicionais. Sua conclusão é que benchmarks frequentemente cobrem apenas um subconjunto do problema e que falta um teste holístico com dados representativos de uso real. [1]

## Juízes LLM e validade da medição

Um LLM como avaliador reduz custo de anotação, mas pode transformar o viés do modelo avaliador em “métrica”. G-Eval usa critérios explícitos, cadeia de raciocínio gerada e formulário de pontuação; em sumarização, GPT-4 alcançou correlação de Spearman de 0,514 com humanos e superou baselines no estudo. O trabalho também observou preferência sistemática por textos gerados por LLM, inclusive quando humanos preferiam textos humanos. [7]

Um estudo sistemático de viés de posição avaliou 15 juízes em MT-Bench e DevBench, com mais de 150 mil instâncias. Introduziu estabilidade de repetição, consistência de posição e justiça de preferência, e encontrou viés de posição não atribuível apenas ao acaso, variável por juiz e tarefa; a diferença de qualidade entre respostas influenciou a consistência. [10] Ao usar um juiz em RAG, é recomendável embaralhar a ordem dos candidatos, repetir a mesma comparação, medir acordo de posição, comparar com anotações cegas e não reutilizar automaticamente o mesmo modelo para gerar e avaliar.

A validação mínima de um juiz inclui: amostra estratificada por idioma, tamanho e risco; rótulos independentes de especialistas; métricas de acordo e correlação; análise de falso positivo/falso negativo; teste de ordem, verbosidade, estilo e marca; e intervalo de incerteza. “Alta correlação” em um conjunto de sumarização não prova validade em perguntas clínicas, documentos legais ou português brasileiro.

## Comparação técnica e acionável, sem código

**Se há documentos e respostas-ouro confiáveis**, comece com Recall@k/MRR/nDCG para recuperação e precisão/recall/F1 de afirmações para geração. Use BERTScore ou ROUGE apenas como sinais complementares de similaridade. Para uma resposta de alta consequência, acrescente validação humana da correção, completude e citação.

**Se não há respostas-ouro**, RAGAs pode iniciar uma triagem de fidelidade, relevância e contexto; ARES é preferível quando existe corpus do domínio e orçamento para uma pequena amostra humana de calibração. Em ambos, audite o contexto quanto à verdade e à atualidade, pois consistência interna não equivale a factualidade.

**Se a resposta é longa ou contém várias afirmações**, RAGChecker ou uma avaliação equivalente em nível de afirmação é mais informativa que uma similaridade global. Exija uma amostra humana para conferir se a extração de afirmações e a decisão de implicação são válidas no idioma e no domínio.

**Se o risco principal é desinformação**, use testes RGB: injete ruído, deixe a pergunta sem evidência, divida a resposta entre documentos e introduza um documento falso sinalizado. Meça acurácia, rejeição, detecção, correção e citação, não apenas relevância do contexto.

**Se o produto faz mais que QA**, use a cobertura CRUD como matriz de tarefas. Não conclua que um ganho em Read (QA) melhora Create, Update ou Delete. Sumarização, correção normativa e geração criativa exigem critérios distintos.

**Se o alvo é implantação**, publique um painel: qualidade por estrato, intervalo, latência, custo, taxa de abstenção, taxa de citação verificável, sensibilidade a ruído, desempenho temporal e falhas graves. Faça comparação com “sem recuperação” e com configurações de recuperação alternativas para estimar o valor incremental do RAG.

## Aplicações educativas

A revisão sistemática de Li et al. sintetiza 51 estudos de RAG em educação. Ela agrupa aplicações em aprendizagem interativa, desenvolvimento/avaliação de conteúdo e ecossistemas educacionais, incluindo geração de questões e planos de aula, correção estruturada, feedback personalizado e ligação do feedback a materiais de aula. Alguns estudos combinam métricas automáticas com avaliação de professores e estudantes; a revisão destaca alucinação, atualização incompleta, custo e multimodalidade como desafios. [11]

Para educação, **qualidade da resposta não é sinônimo de aprendizagem**. Uma avaliação responsável deve separar:

- precisão e rastreabilidade do conteúdo curricular;
- adequação etária, linguagem, acessibilidade e carga cognitiva;
- completude e correção do feedback;
- justiça entre dialetos, perfis socioeconômicos e necessidades educacionais;
- aprendizagem observada em tarefa independente, sem tratar a própria nota do LLM como evidência de aprendizagem;
- privacidade, consentimento e retenção de dados de estudantes.

A orientação da UNESCO recomenda abordagem centrada no humano, validação ética e pedagógica, proteção de privacidade e uso apropriado à idade; a versão em português está disponível no catálogo oficial. [15] Assim, um RAG educacional deve apoiar professor e estudante, deixar fontes e incerteza visíveis e evitar que uma pontuação automática substitua avaliação pedagógica profissional.

## Português, Brasil e América Latina

O estudo de Cunha et al. é uma referência brasileira diretamente pertinente. Avalia RAG end-to-end para documentos hospitalares regulatórios em português, com 107 documentos de cinco departamentos, 90 pares pergunta-resposta sintéticos, 139 interações de uso e 118 aprovadas por especialistas; o conjunto híbrido final tem 192 pares. Com o mesmo contexto recuperado, compara cinco geradores usando BERTScore F1. O embedding `intfloat/multilingual-e5-small` teve falha de recuperação de 1,4%, MRR médio 0,6662 e nDCG@10 0,6782; no reranking, Gemini 1.5 Flash alcançou MRR 0,8612/nDCG@10 0,8826 e RRF foi uma alternativa de menor custo com MRR 0,7857/nDCG@10 0,8157; Gemini 2.5 Flash obteve BERTScore F1 médio 0,8185. [12]

Esses números são úteis como exemplo de desenho controlado, não como referência universal. O estudo é de uma instituição, com corpus normativo específico, conjunto ainda pequeno para generalização e BERTScore como avaliação principal da geração. “Resposta semanticamente semelhante” não garante que todos os prazos, listas, unidades e exceções estejam corretos. A literatura em português é menos extensa que a anglófona; por isso, resultados de RGB, ARES ou RAGChecker precisam ser revalidados em português brasileiro, com anotadores e documentos latino-americanos.

## Contexto social, governança e fronteira clínica

O perfil NIST AI 600-1 recomenda incorporar confiabilidade, validade, segurança, transparência, explicabilidade, privacidade e equidade ao ciclo de vida de IA generativa. [13] Em avaliação RAG, isso implica medir não só média global, mas também desempenho por idioma, região, gênero, faixa etária, tipo documental e nível de alfabetização; registrar proveniência, versão da fonte e data; e monitorar degradação após mudanças de corpus ou modelo.

A OMS trata IA em saúde como questão de ética, direitos humanos, responsabilização e governança, com princípios de benefício público e supervisão. [14] Um RAG de saúde pode ser avaliado quanto à recuperação de protocolo, fidelidade, completude, citação e abstenção, mas métricas automáticas não substituem validação clínica, aprovação institucional, segurança e supervisão humana.

**Limite clínico explícito:** este documento não diagnostica, não prescreve, não seleciona tratamento e não valida um sistema para uso clínico. Uma resposta de RAG sobre sintomas, dose, urgência, contraindicação ou conduta pode estar errada mesmo com alta pontuação de fidelidade, BERTScore ou relevância. Em situação real, a pessoa deve procurar profissional de saúde qualificado ou serviço de urgência local; o sistema não deve ser a única base para decisão clínica.

## Contradições, incertezas e lacunas

1. **Referência livre versus verdade externa.** RAGAs e ARES reduzem dependência de respostas-ouro, mas podem atribuir alta nota a uma resposta fiel a um documento falso. Benchmarks de referência detectam correção melhor, mas custam anotação e podem ficar desatualizados. [2] [3] [5]
2. **Ranking clássico versus diagnóstico semântico.** MRR/nDCG são eficientes para ordenar trechos e funcionam bem no estudo hospitalar, mas não informam se o gerador cobriu todas as afirmações. RAGChecker adiciona granularidade, ao custo de um juiz LLM complexo. [6] [12]
3. **Métrica textual versus utilidade.** ROUGE/BERTScore podem correlacionar com qualidade em alguns conjuntos, mas não medem automaticamente verdade, citação, risco ou aprendizagem. [7] [8] [9]
4. **Juiz LLM versus anotação humana.** G-Eval e ARES mostram ganhos práticos, mas G-Eval detecta viés a favor de texto de LLM e estudos de viés de posição mostram que a ordem pode alterar o julgamento. [3] [7] [10]
5. **Generalização linguística e social.** RGB é inglês/chinês, CRUD-RAG é chinês e muitos conjuntos clássicos são anglófonos. Há lacuna de benchmarks abertos, temporalmente atualizados e anotados para português brasileiro e variedades latino-americanas.
6. **Tarefas subavaliadas.** Há mais evidência para QA do que para criação, correção, sumarização multi-documento, citações completas, multimodalidade, diálogos prolongados e usuários com deficiência. A revisão educacional também encontra pouca ligação entre métricas de sistema e resultados de aprendizagem. [1] [5] [11]
7. **Lacuna clínica.** Mesmo o estudo brasileiro hospitalar mede principalmente recuperação e similaridade textual. Faltam estudos prospectivos, multicêntricos, com especialistas, análise de dano, calibração de incerteza, privacidade e comparação com decisões clínicas seguras. [12] [14]

## Protocolo mínimo recomendado

1. **Especificar a tarefa e o risco:** pergunta factual, sumarização, correção, apoio educacional ou consulta regulatória; definir quando o sistema deve recusar.
2. **Construir conjunto de teste versionado:** consultas reais e sintéticas revisadas, documentos com data, respostas-ouro quando possível, evidências relevantes, afirmações necessárias e casos sem resposta.
3. **Avaliar recuperação isoladamente:** Recall@k/MRR/nDCG, cobertura de afirmações, duplicação, diversidade, atualização temporal e qualidade da fonte.
4. **Avaliar geração em camadas:** correção/completude humana ou especialista; fidelidade e utilização de contexto; relevância; citação por afirmação; similaridade semântica apenas como complemento.
5. **Testar estresse:** ruído, conflito, documento falso, contexto longo, multi-hop, consulta ambígua, paráfrase, idioma e mudança de corpus.
6. **Auditar o avaliador:** dupla anotação, guia operacional, amostra de desacordo, ordem permutada, repetição, viés de comprimento/estilo e intervalo de confiança.
7. **Monitorar após implantação:** taxa de abstenção, falhas graves, cliques/verificação de fontes, latência, custo, drift, feedback de usuários e reavaliação quando mudar modelo, prompt ou base.

## Fichas críticas das fontes

### [1] Yu et al. — revisão Auepora

**Autores/ano:** Hao Yu, Aoran Gan, Kai Zhang, Shiwei Tong, Qi Liu e Zhaofeng Liu, 2024. **Identificador:** arXiv:2405.07437v2; DOI não localizado. **Tipo:** revisão técnica/levantamento de benchmarks. **Contexto:** 12 frameworks e benchmarks de RAG, separando recuperação, geração e sistema completo. **Achados:** propõe a matriz Target–Dataset–Metric e identifica lacunas de cobertura, dinamismo, métricas específicas e avaliação holística. **Limitações:** revisão de pré-publicação, corte em junho de 2024 e dependência das definições dos trabalhos incluídos. **Verificação:** página arXiv original e PDF verificados; texto integral PDF obtido e lido.

### [2] Es et al. — RAGAs

**Autores/ano:** Shahul Es, Jithin James, Luis Espinosa-Anke e Steven Schockaert, 2024. **Identificador:** DOI 10.18653/v1/2024.eacl-demo.16. **Tipo:** artigo de demonstração em conferência ACL/EACL. **Contexto:** WikiEval com 50 páginas da Wikipédia e dois anotadores; avaliação sem resposta-ouro humana. **Achados:** métricas de relevância de contexto, fidelidade e relevância da resposta, com concordância humana aproximada de 90–95% nas dimensões estudadas. **Limitações:** depende de LLM/prompts/embeddings, mede consistência com o contexto e não a verdade do contexto; contexto inicial limitado e majoritariamente inglês. **Verificação:** ACL Anthology e PDF original verificados; texto integral PDF obtido e lido.

### [3] Saad-Falcon et al. — ARES

**Autores/ano:** Jon Saad-Falcon, Omar Khattab, Christopher Potts e Matei Zaharia, 2024. **Identificador:** DOI 10.18653/v1/2024.naacl-long.20. **Tipo:** artigo de pesquisa em conferência NAACL. **Contexto:** oito tarefas de KILT, SuperGLUE e AIS; juízes DeBERTa-v3-Large treinados com exemplos sintéticos e validação humana. **Achados:** melhor ranking que RAGAs em vários cenários, intervalos via PPI e 78% menos anotações que a linha de base anotada. **Limitações:** exige corpus de domínio, dados sintéticos e amostra humana; nem todas as dimensões foram avaliadas em todos os conjuntos; desempenho e custo dependem do treinamento. **Verificação:** ACL Anthology e PDF original verificados; texto integral PDF obtido e lido.

### [4] Chen et al. — RGB

**Autores/ano:** Jiawei Chen, Hongyu Lin, Xianpei Han e Le Sun, 2024. **Identificador:** DOI 10.1609/aaai.v38i16.29728. **Tipo:** benchmark/artigo AAAI. **Contexto:** 600 perguntas-base, 200 de integração e 200 contrafactuais, metade em inglês e metade em chinês; seis LLMs. **Achados:** dificuldade importante em rejeição negativa, integração multi-documento e informação falsa; ruído reduz acurácia. **Limitações:** notícias e perguntas geradas com ChatGPT, correspondência exata, inglês/chinês e cenário de teste que não cobre citação, justiça ou uso clínico. **Verificação:** página AAAI e PDF original verificados; texto integral PDF obtido e lido.

### [5] Lyu et al. — CRUD-RAG

**Autores/ano:** Yuanjie Lyu, Zhiyu Li, Simin Niu, Feiyu Xiong, Bo Tang, Wenjin Wang, Hao Wu, Huanyong Liu, Tong Xu e Enhong Chen, 2025. **Identificador:** DOI 10.1145/3701228. **Tipo:** artigo de pesquisa/benchmark em ACM Transactions on Information Systems. **Contexto:** notícias chinesas, base de recuperação de 86.834 itens e tarefas Create/Read/Update/Delete. **Achados:** amplia QA para continuação, QA multi-documento, correção de alucinação e sumarização, avaliando componentes e hiperparâmetros de RAG. **Limitações:** chinês, construção automática com GPT-4, tarefas reversamente construídas e correspondência de contexto vaga em parte dos dados. **Verificação:** ACM, arXiv e PDF original verificados; texto integral PDF obtido e lido.

### [6] Ru et al. — RAGChecker

**Autores/ano:** Dongyu Ru, Lin Qiu, Xiangkun Hu, Tianhang Zhang e coautores, 2024. **Identificador:** arXiv:2408.08067v2; DOI não confirmado. **Tipo:** preprint de framework diagnóstico; o PDF consultado o descreve como “under review”. **Contexto:** 4.162 consultas em dez domínios, oito sistemas RAG e meta-avaliação com 280 pares e dois anotadores. **Achados:** métricas de afirmação para separar recuperação, fidelidade, ruído, alucinação e utilização; melhor correlação humana reportada que baselines. **Limitações:** extrator/verificador Llama-3-70B caro, benchmark reutilizado e respostas longas geradas com GPT-4; a decomposição de afirmações e a implicação também podem falhar. **Verificação:** arXiv/OpenReview e PDF original verificados; texto integral PDF obtido e lido.

### [7] Liu et al. — G-Eval

**Autores/ano:** Yang Liu, Dan Iter, Yichong Xu, Shuohang Wang, Ruochen Xu e Chenguang Zhu, 2023. **Identificador:** DOI 10.18653/v1/2023.emnlp-main.153. **Tipo:** artigo de avaliação de geração em EMNLP. **Contexto:** SummEval, Topical-Chat e QAGS, em sumarização e diálogo. **Achados:** GPT-4 com critérios e formulário alcançou Spearman 0,514 em sumarização; observou preferência por textos gerados por LLM. **Limitações:** não é benchmark RAG específico, depende de GPT fechado, idioma/contextos majoritariamente ingleses e correlação varia por tarefa. **Verificação:** ACL Anthology e PDF original verificados; texto integral PDF obtido e lido.

### [8] Zhang et al. — BERTScore

**Autores/ano:** Tianyi Zhang, Varsha Kishore, Felix Wu, Kilian Q. Weinberger e Yoav Artzi, 2019/2020. **Identificador:** arXiv:1904.09675; DOI de preprint 10.48550/arXiv.1904.09675. **Tipo:** artigo de métrica, publicado no ICLR 2020. **Contexto:** 363 sistemas de tradução automática e descrição de imagens, além de paráfrases adversariais. **Achados:** similaridade por embeddings contextualizados e melhor correlação humana/seleção de modelos que métricas existentes no estudo. **Limitações:** depende de referência, modelo de representação e idioma; não mede fundamentação, verdade factual ou risco. **Verificação:** OpenReview original e resumo verificados; texto integral HTML acessível, mas o PDF retornou 403 e não foi contado entre os PDFs integrais lidos.

### [9] Lin — ROUGE

**Autor/ano:** Chin-Yew Lin, 2004. **Identificador:** ACL Anthology W04-1013; DOI não informado. **Tipo:** artigo de métrica em workshop. **Contexto:** sumarização automática e dados DUC 2001–2003. **Achados:** ROUGE-N, ROUGE-L, ROUGE-W e ROUGE-S medem sobreposição com resumos de referência. **Limitações:** sobreposição lexical/subsequência não equivale a semântica, verdade ou fidelidade; requer referências e pode premiar cópia. **Verificação:** ACL Anthology e PDF original verificados; texto integral PDF obtido e lido.

### [10] Shi et al. — viés de posição em LLM-as-a-Judge

**Autores/ano:** Lin Shi, Chiyu Ma, Wenhua Liang, Xingjian Diao, Weicheng Ma e Soroush Vosoughi, 2025. **Identificador:** ACL PDF 2025.ijcnlp-long.18; DOI não confirmado. **Tipo:** estudo sistemático de validade de juízes LLM. **Contexto:** 15 juízes, MT-Bench e DevBench, 22 tarefas e mais de 150 mil instâncias. **Achados:** viés de posição sistemático, dependente de juiz/tarefa, com métricas de estabilidade, consistência e justiça de preferência. **Limitações:** não é específico de RAG; resultados dependem dos conjuntos e do desenho de comparação. **Verificação:** PDF original e texto extraído verificados; texto integral acessível no PDF, com leitura das seções centrais.

### [11] Li et al. — revisão sistemática de RAG na educação

**Autores/ano:** Zongxi Li, Zijian Wang, Weiming Wang, Kevin Hung, Haoran Xie e Fu Lee Wang, 2025. **Identificador:** DOI 10.1016/j.caeai.2025.100417. **Tipo:** revisão sistemática em *Computers and Education: Artificial Intelligence*. **Contexto:** síntese de 51 estudos educacionais localizados na Web of Science e busca de citações. **Achados:** mapeia aprendizagem interativa, conteúdo/avaliação e ecossistemas; relata uso de métricas automáticas e avaliações de professores/estudantes e destaca alucinação, atualização, custo e multimodalidade. **Limitações:** literatura recente e heterogênea, sem meta-análise quantitativa de aprendizagem; exclui revisões e estudos sem implementação. **Verificação:** página ScienceDirect original, DOI e texto integral aberto verificados; seções de método, resultados e conclusão lidas.

### [12] Cunha et al. — RAG hospitalar em português

**Autores/ano:** Murilo Vargas da Cunha, Marília Rosa Silveira, César Brasil Sperb, Brenda Salenave Santana, Larissa Astrogildo Freitas e Ulisses Brisolara Corrêa, 2026. **Identificador:** ACL Anthology 2026.propor-1.74; DOI não informado. **Tipo:** artigo de conferência PROPOR 2026. **Contexto:** documentos hospitalares regulatórios em português, 107 documentos, 192 pares híbridos e validação por especialistas. **Achados:** resultados de MRR, nDCG@10 e BERTScore; multilingual-e5-small, RRF e Gemini 2.5 Flash foram os destaques no cenário testado. **Limitações:** uma instituição, conjunto pequeno e específico, métrica de geração centrada em similaridade; não demonstra segurança clínica nem generalização nacional. **Verificação:** ACL Anthology e PDF original verificados; texto integral PDF obtido e lido.

### [13] NIST AI 600-1

**Entidade/ano:** National Institute of Standards and Technology; autores Chloe Autio, Reva Schwartz, Jesse Dunietz, Shomik Jain, Martin Stanley, Elham Tabassi, Patrick Hall e Kamie Roberts, 2024. **Identificador:** DOI 10.6028/NIST.AI.600-1. **Tipo:** perfil oficial de gestão de risco de IA generativa. **Contexto:** uso transversal, não uma população experimental. **Achados:** recomenda avaliar e gerenciar validade, confiabilidade, segurança, transparência, explicabilidade, privacidade e equidade ao longo do ciclo de vida. **Limitações:** é orientação voluntária e não especifica um benchmark RAG ou limiar de aceitação. **Verificação:** página oficial NIST e PDF de download verificados; página integral lida, PDF não contado entre os nove artigos científicos integrais.

### [14] OMS — ética e governança de IA em saúde

**Entidade/ano:** Organização Mundial da Saúde, 2021. **Identificador:** ISBN 9789240029200; PMID/DOI não localizado. **Tipo:** diretriz oficial. **Contexto:** saúde, direitos humanos, trabalhadores, comunidades e governança de IA. **Achados:** seis princípios de consenso e recomendações para responsabilização, benefício público, supervisão e proteção de pessoas afetadas. **Limitações:** não prescreve métricas RAG específicas nem substitui regulação ou validação local. **Verificação:** página oficial e link do texto integral verificados; a página foi lida e o PDF integral foi identificado como acessível, mas não contado como leitura integral neste levantamento.

### [15] UNESCO — guia de IA generativa na educação e pesquisa

**Entidade/autores/ano:** UNESCO; Fengchun Miao e Wayne Holmes, edição portuguesa 2024. **Identificador:** ISBN 978-92-3-700028-1. **Tipo:** guia oficial de política e uso educacional. **Contexto:** escolas, universidades, pesquisa, políticas públicas e proteção de estudantes. **Achados:** recomenda visão centrada no humano, validação ética/pedagógica, privacidade, equidade e adequação etária. **Limitações:** não é estudo de eficácia nem protocolo de métricas de RAG. **Verificação:** registro oficial UNESCO/UNESDOC em português verificado; texto integral aberto identificado, mas não contado como leitura integral neste levantamento.

### [16] Microsoft — fase de avaliação end-to-end de RAG

**Entidade/ano:** Microsoft Learn; ano não informado na página consultada. **Identificador:** não aplicável. **Tipo:** orientação técnica oficial de produto. **Contexto:** avaliação operacional de soluções RAG, incluindo fundamentação, completude, utilização e relevância; alerta para não determinismo e, no RAG agêntico, latência e seleção de ferramentas. **Achados:** recomenda escolher métricas conforme o caso de uso e usar intervalos/variação, não um único alvo, para respostas não determinísticas. **Limitações:** orientação de fornecedor, não revisão sistemática nem evidência independente; definições e implementações podem variar. **Verificação:** página oficial em português verificada e lida; ano não confirmado explicitamente.

## Estatísticas de busca e leitura

- **Fontes efetivamente encontradas e selecionadas para este relatório:** 16 registros originais (artigos, benchmark, revisão ou diretriz).
- **Fontes verificadas em página original, repositório institucional ou editora:** 16/16.
- **PDFs científicos descarregados, convertidos e lidos integralmente:** 9/16 (RAGAs, ARES, RGB, CRUD-RAG, Auepora, RAGChecker, G-Eval, ROUGE e estudo hospitalar). BERTScore foi verificado na página OpenReview, mas o PDF retornou 403; NIST, OMS e UNESCO foram verificados nas páginas oficiais e links de texto integral, sem contar como PDF integral lido.
- **DOI confirmado:** 8 fontes; **PMID confirmado:** nenhum; quando inexistente ou não localizado, isso foi sinalizado em cada ficha.
- **Revisões sistemáticas/meta-análises:** duas revisões/levantamentos foram incluídos ([1] e [11]); não foi localizada meta-análise quantitativa específica de métricas RAG na busca realizada.
- **Estudos diretamente brasileiros/português:** um estudo PROPOR/UFPEL–IFRS ([12]); a evidência em português ainda é pequena diante da literatura anglófona/chinesa.

## References

[1]: https://arxiv.org/html/2405.07437v2 "Evaluation of Retrieval-Augmented Generation: A Survey"
[2]: https://aclanthology.org/2024.eacl-demo.16/ "RAGAs: Automated Evaluation of Retrieval Augmented Generation"
[3]: https://aclanthology.org/2024.naacl-long.20/ "ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems"
[4]: https://ojs.aaai.org/index.php/AAAI/article/view/29728 "Benchmarking Large Language Models in Retrieval-Augmented Generation"
[5]: https://dl.acm.org/doi/10.1145/3701228 "CRUD-RAG: A Comprehensive Chinese Benchmark for Retrieval-Augmented Generation of Large Language Models"
[6]: https://arxiv.org/html/2408.08067 "RAGChecker: A Fine-grained Framework for Diagnosing Retrieval-Augmented Generation"
[7]: https://aclanthology.org/2023.emnlp-main.153/ "G-Eval: NLG Evaluation using Gpt-4 with Better Human Alignment"
[8]: https://openreview.net/forum?id=SkeHuCVFDr "BERTScore: Evaluating Text Generation with BERT"
[9]: https://aclanthology.org/W04-1013/ "ROUGE: A Package for Automatic Evaluation of Summaries"
[10]: https://aclanthology.org/2025.ijcnlp-long.18.pdf "Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge"
[11]: https://www.sciencedirect.com/science/article/pii/S2666920X25000578 "Retrieval-augmented generation for educational application: A systematic survey"
[12]: https://aclanthology.org/2026.propor-1.74/ "Avaliação End-to-End de um Sistema RAG para Documentos Hospitalares em Português"
[13]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile"
[14]: https://www.who.int/publications/i/item/9789240029200 "Ethics and governance of artificial intelligence for health"
[15]: https://unesdoc.unesco.org/ark:/48223/pf0000390241_por "Guia para a IA generativa na educação e na pesquisa"
[16]: https://learn.microsoft.com/pt-br/azure/architecture/ai-ml/guide/rag/rag-llm-evaluation-phase "Avaliação de ponta a ponta do grande modelo de linguagem"
