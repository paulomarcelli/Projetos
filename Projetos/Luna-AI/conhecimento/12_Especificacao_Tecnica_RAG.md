# Especificação técnica de RAG (sem código)

**Data de consulta:** 2026-10-22  
**Escopo:** Retrieval-Augmented Generation (RAG) para sistemas de perguntas e respostas, síntese e apoio à decisão informacional.  
**Forma:** comparação textual técnica e acionável, sem código.

> Esta especificação distingue **achados da literatura**, **conceitos técnicos**, **requisitos de projeto**, **aplicações educativas** e **contexto social**. Uma recomendação de engenharia não é apresentada como resultado experimental quando a fonte não a testou.

## 1. Delimitação e conclusão técnica

RAG é uma arquitetura que combina memória paramétrica de um modelo gerador com memória não paramétrica consultada externamente. No trabalho que introduziu o termo, um recuperador neural consulta um índice denso de passagens, e um modelo seq2seq gera a resposta condicionada nas passagens recuperadas; o estudo mostrou ganhos em tarefas intensivas em conhecimento, mas também deixou claro que a recuperação pode ser atualizada separadamente do modelo. [1]

Na forma operacional mais comum, o sistema tem três fases: **indexação** dos documentos, **recuperação** dos trechos relevantes e **geração** da resposta condicionada à pergunta e ao contexto recuperado. [2] A separação é útil porque permite atualizar o corpus, controlar permissões e auditar fontes sem retreinar necessariamente o modelo gerador. Ela não transforma o RAG em uma base de verdade: se a fonte estiver errada, desatualizada, incompleta ou contaminada, o sistema pode produzir uma resposta convincente e errada.

A especificação recomendada é, portanto, um **RAG com recuperação híbrida, filtros de autorização anteriores à busca, reranqueamento, atribuição de fontes por afirmação, abstenção explícita, avaliação separada de recuperação e geração, e governança de ciclo de vida**. O padrão mínimo não deve ser “recuperar os *top-k* e escrever”; deve ser “recuperar sob política, verificar suficiência e conflito, gerar somente o que a evidência sustenta e registrar como a resposta foi produzida”.

## 2. Achados da literatura

### 2.1 O que há de evidência robusta

* O artigo original RAG comparou variantes que condicionam a sequência inteira nos mesmos documentos e variantes que podem usar documentos diferentes por token. Em tarefas abertas de perguntas e respostas, as variantes superaram modelos seq2seq puramente paramétricos em seus experimentos; em geração, produziram linguagem mais específica, diversa e factual que o baseline paramétrico. [1] Isso é evidência de benefício em tarefas e conjuntos específicos, não uma garantia de desempenho em qualquer domínio.
* A revisão de Gao et al. organiza a evolução em **Naive RAG**, **Advanced RAG** e **Modular RAG**, cobrindo recuperação, geração, aumento de contexto e avaliação. Ela descreve problemas recorrentes do RAG ingênuo, como recuperação de trechos irrelevantes, contexto excessivo e dificuldade de avaliação representativa. [2]
* O benchmark BEIR, com 18 conjuntos de recuperação em nove tarefas e domínios, encontrou que nenhum método vence consistentemente em todos os conjuntos; BM25 permaneceu um baseline robusto, enquanto reranqueadores e modelos de interação tardia tiveram, em média, melhor desempenho zero-shot com maior custo computacional. [4] Isso sustenta uma especificação que compare pelo menos recuperação lexical, densa e híbrida no próprio corpus, em vez de escolher um índice por conveniência.
* A revisão de Yu et al. separa a avaliação em recuperação, geração e sistema completo. Ela destaca que precisão, recall e relevância não capturam sozinhos as nuances da recuperação para RAG, que a geração requer fidelidade ao contexto e correção factual, e que a avaliação ponta a ponta deve medir também latência e consultas ambíguas ou complexas. [3]
* RAGAs propôs avaliação sem referência humana para dimensões como relevância do contexto, fidelidade e relevância da resposta. Isso pode acelerar ciclos de teste, mas é uma ferramenta de avaliação e não prova de verdade: métricas baseadas em outro LLM podem herdar vieses, sensibilidade ao prompt e erros do avaliador. [5]
* Self-RAG mostrou, em experimentos próprios, que recuperar sempre uma quantidade fixa pode inserir passagens desnecessárias; seu método aprende a recuperar sob demanda, criticar a própria geração e produzir atribuições. Os autores também registram que ainda podem existir respostas não plenamente apoiadas pelas citações. [6]
* CRAG propôs avaliar a qualidade dos documentos antes da geração, classificar a recuperação como correta, incorreta ou ambígua e, conforme o caso, refinar o conhecimento recuperado, descartá-lo ou combinar busca interna e fonte externa. A proposta é útil como padrão de contingência, mas seus resultados dependem do avaliador de recuperação, dos limiares e das fontes externas; não é uma prova de que busca na web seja sempre segura ou correta. [7]

### 2.2 O que é específico do contexto brasileiro ou latino-americano

* O estudo de Kuratomi et al. construiu um assistente RAG para documentos normativos da Universidade de São Paulo. Foram coletados 866 documentos; o melhor recuperador obteve acurácia Top-5 de 30%, e o melhor gerador 22,04% contra respostas de referência. Quando os trechos corretos eram fornecidos ao modelo, a acurácia subia para 54,02%; sem contexto, caía para 13,68%. [16] O resultado é particularmente importante para a especificação: em um caso brasileiro realista, o gargalo observado foi a recuperação e a seleção de contexto, não apenas a escolha do LLM.
* Rodrigues et al. avaliaram GPT-4 e Sabiá em perguntas educacionais em português brasileiro, com tipos de questão, disciplinas e habilidades variadas. Dois professores experientes atribuíram notas médias próximas de 9,8/10, mas apareceram erros específicos e diferentes entre os modelos. [17] O estudo não é um estudo de RAG; ele demonstra por que testes em português brasileiro, por tipo de tarefa e por competência são necessários antes de extrapolar resultados em inglês.
* Harada, de Melo e da Silva descrevem um sistema brasileiro para apoiar práticas inclusivas no ensino superior. O resumo relata corpus de literatura revisada por pares, ingestão que preserva estrutura documental, comparação de sete modelos de embedding e seis LLMs abertos, com melhor configuração reportada de Recall@10 documental 0,91 e Faithfulness 0,92 segundo RAGAs. [18] São resultados de um sistema e corpus específicos; o resumo não demonstra impacto pedagógico, equidade ou eficácia com estudantes com deficiência.
* A revisão sistemática de Li et al. sintetiza 51 estudos de RAG em educação, abrangendo aprendizagem interativa, produção e avaliação de conteúdo e ecossistemas educacionais. Os autores identificam como desafios alucinação, completude e atualidade do conhecimento, custo computacional e suporte multimodal. [15] A própria revisão reúne aplicações heterogêneas; “potencial para educação” não deve ser convertido em eficácia causal sobre aprendizagem.

## 3. Conceitos e requisitos técnicos

### 3.1 Objetivo, usuários e não objetivos

Antes de selecionar modelos, o sistema deve declarar:

1. **Perguntas-alvo:** por exemplo, localizar uma norma vigente, explicar um conceito curricular, resumir evidência ou orientar a navegação em documentos.
2. **Usuários e permissões:** estudante, professor, servidor, pesquisador, profissional de saúde ou público geral podem possuir corpus e direitos diferentes.
3. **Ações permitidas:** responder, citar, resumir, comparar e encaminhar. A geração não deve executar ações externas sem uma camada de política e autorização separada.
4. **Nível de risco:** informacional, institucional, educacional de baixo risco, ou decisão de alto impacto. Quanto maior o risco, maior a exigência de fonte primária, revisão humana, registro e abstenção.
5. **Não objetivos:** o RAG não deve ser descrito como mecanismo de diagnóstico, tratamento, certificação automática, correção infalível, substituição de docente ou decisão autônoma sobre direitos.

A aceitação deve ser definida antes dos testes. Não há um limiar universal de Recall@k, fidelidade ou satisfação que valha para todo domínio; os limiares devem ser definidos contra uma linha de base no corpus real, por classe de pergunta e por consequência de erro. A literatura de avaliação ressalta que a interação entre recuperação e geração impede reduzir o sistema a uma única métrica. [3]

### 3.2 Corpus, proveniência e ciclo de vida

A unidade de conhecimento deve ser um documento com identidade estável e metadados, não apenas um vetor. O registro mínimo recomendado inclui:

* identificador do documento e da versão;
* título, autor ou entidade emissora, data de publicação, data de vigência e data de revisão;
* idioma e variante linguística, inclusive português brasileiro quando pertinente;
* tipo de fonte, jurisdição, domínio, nível de autoridade e licença;
* endereço original, hash do conteúdo e método de extração;
* classificação, proprietário, papéis ou usuários autorizados;
* relação com documentos substituídos, corrigidos ou revogados;
* data e motivo de ingestão, atualização e exclusão.

A ingestão deve começar por uma lista de fontes autorizadas e por uma política de qualidade: fonte primária oficial para norma, diretriz ou legislação; revisão sistemática ou meta-análise quando a pergunta for de síntese; estudo primário quando a pergunta for sobre um resultado experimental; e identificação explícita de preprint, opinião, material comercial ou fonte secundária.

A atualização precisa ser incremental e auditável. A versão nova não deve apagar silenciosamente a versão anterior: deve registrar o evento, invalidar o que deixou de vigorar e preservar o histórico necessário à auditoria. Se o documento for excluído, desautorizado ou expirar, a exclusão deve propagar-se a chunks, embeddings, índices, caches e respostas derivadas; manter o vetor pesquisável depois de excluir a fonte é uma falha de governança. [8]

### 3.3 Extração, normalização e particionamento

A etapa de ingestão deve preservar estrutura que muda o significado: títulos, seções, parágrafos, notas, referências, tabelas, fórmulas, cabeçalhos, rodapés, página e ordem. PDFs escaneados exigem OCR; documentos com estrutura visual ou figuras podem exigir um modelo visão-linguagem, mas a saída deve ser validada contra a fonte.

O particionamento (*chunking*) deve ser tratado como hipótese testável. Chunks muito curtos perdem definições e exceções; chunks muito longos misturam assuntos e ocupam o contexto. Uma especificação adequada compara particionamento por seção, parágrafo e janela com sobreposição, preservando metadados e links para o documento-pai. O estudo da USP comparou tamanhos de chunk e mostrou que a configuração de recuperação influenciou fortemente o resultado, mas não permite transformar um tamanho de caracteres em regra geral. [16]

Cada chunk deve carregar o identificador e a versão do documento, página ou âncora, seção, posição, idioma, vigência, nível de acesso e origem. O texto para busca pode ser normalizado; o texto exibido como evidência deve permanecer recuperável em forma fiel à fonte. O sistema deve conservar também um mecanismo para mostrar contexto anterior e posterior quando a interpretação depender de exceções ou definições.

### 3.4 Representação e recuperação

A recuperação deve ser escolhida de forma comparativa:

* **Lexical:** favorece termos exatos, nomes próprios, números, artigos, siglas e linguagem normativa. BM25 é um baseline necessário porque permaneceu robusto no BEIR. [4]
* **Densa:** favorece correspondência semântica e paráfrases, mas pode perder termos raros, negações, números e versões de norma.
* **Híbrida:** combina sinais lexicais e densos; é o padrão preferível quando perguntas contêm simultaneamente linguagem natural e identificadores.
* **Reranqueamento:** reordena poucos candidatos com um modelo que olha pergunta e documento juntos. Pode elevar relevância, mas adiciona custo, latência e dependência de modelo.
* **Estruturada ou por entidade:** deve ser considerada quando a pergunta exige artigo, data, pessoa, órgão, produto, código normativo ou relação explícita.

O pipeline deve aplicar filtros de idioma, vigência, jurisdição, classificação e autorização **antes** de disponibilizar os candidatos ao gerador. Um modelo não deve ser incumbido de decidir se o usuário pode ver um documento. A orientação OWASP exige metadados de acesso em cada chunk, checagem no momento da recuperação, isolamento entre locatários e registro de cada recuperação. [8]

Para português brasileiro, a qualidade deve ser medida no próprio domínio e variedade linguística. O MIRACL fornece um benchmark multilíngue amplo, com julgamentos humanos em 18 línguas e mais de 726 mil julgamentos de relevância, mas seu corpus é Wikipedia e seu objetivo é recuperação monolíngue; ele não substitui uma coleção brasileira com consultas reais e documentos institucionais. [14] O estudo brasileiro de perguntas educacionais confirma que desempenho em português brasileiro pode variar por tipo de questão e habilidade, portanto uma média agregada é insuficiente. [17]

### 3.5 Consulta, ambiguidade e recuperação iterativa

A camada de consulta deve:

1. identificar idioma, intenção, entidade, período e domínio;
2. detectar se a pergunta exige documento vigente, evidência histórica, comparação ou síntese;
3. preservar a pergunta original para auditoria;
4. produzir, quando necessário, uma reformulação ou múltiplas consultas, sem alterar silenciosamente a intenção;
5. pedir esclarecimento quando faltarem jurisdição, período, curso, população ou unidade de análise;
6. limitar iteração para evitar custo e deriva da consulta;
7. registrar quais reformulações e filtros produziram os documentos finais.

Consultas sem evidência suficiente devem produzir **abstenção informativa**, não preenchimento especulativo. Uma resposta aceitável pode dizer que o corpus não contém informação suficiente, mostrar as fontes consultadas e indicar como reformular a pergunta.

### 3.6 Reranqueamento, suficiência e conflito

Antes de gerar, o sistema deve estimar pelo menos três propriedades distintas: relevância para a pergunta, cobertura do que a pergunta pede e confiabilidade da fonte. Relevância não é sinônimo de autoridade; um blog muito parecido semanticamente pode ser menos adequado que uma norma oficial.

Quando fontes discordarem, o sistema deve:

* preservar as versões e datas;
* dar prioridade à fonte competente para aquele tipo de afirmação;
* mostrar a divergência e não escolher uma resposta única sem justificativa;
* separar fato, interpretação e recomendação;
* marcar incerteza quando não houver critério para resolver o conflito.

CRAG oferece uma formulação experimental útil: classificar recuperação como correta, incorreta ou ambígua e acionar refinamento, descarte ou combinação de fontes. [7] Essa ideia deve ser convertida em requisito de produto apenas depois de validação no domínio; busca externa não é automaticamente uma correção e amplia o perímetro de segurança.

### 3.7 Geração, evidência e abstention

O gerador deve receber instruções que distingam sistema, pergunta e conteúdo recuperado. O conteúdo recuperado deve ser delimitado como **dados não confiáveis, não instruções**. A saída mínima deve conter:

* resposta direta e em linguagem adequada ao usuário;
* citações de fonte junto às afirmações verificáveis;
* identificação de documento, versão e localização do trecho;
* separação entre o que a fonte afirma e inferência do sistema;
* aviso de insuficiência, conflito ou desatualização;
* encaminhamento humano quando o risco exceder o escopo informacional.

A exigência de citação não garante fidelidade. O sistema deve verificar se cada afirmação material é apoiada pelo trecho citado, se a citação realmente corresponde à fonte apresentada e se o gerador não acrescentou detalhes ausentes. Self-RAG registra que mesmo melhorias em factualidade e atribuição podem deixar respostas sem apoio completo. [6]

Não se deve instruir o modelo a “sempre responder”. O modo seguro tem pelo menos três saídas: **respondido com evidência suficiente**, **respondido com ressalvas e conflito**, ou **não respondido por insuficiência/risco**.

### 3.8 Avaliação e critérios de liberação

A avaliação deve ser feita em conjunto congelado de perguntas reais ou representativas, separado por intenção, domínio, idioma, dificuldade, temporalidade, sensibilidade e grupo de usuário. O conjunto de teste não pode ser usado para ajustar o índice sem controle de vazamento.

**Avaliação da recuperação:**

* Recall@k e precisão@k para saber se a evidência necessária entrou no conjunto candidato;
* MRR e nDCG@k para medir posição e relevância graduada;
* cobertura de fontes obrigatórias e taxa de recuperação de documento vigente;
* taxa de resultados indevidos, duplicados, obsoletos ou de outro locatário;
* desempenho por idioma, variante, domínio, extensão documental e consulta longa.

BEIR recomenda nDCG@10 para comparabilidade em seus conjuntos e mostra que avaliações in-domain podem não prever generalização; o benchmark também explicita limitações como escopo predominantemente em inglês, documentos curtos e ausência de sinais multifatoriais comuns no mundo real. [4] Isso exige avaliação brasileira e fora de distribuição, não apenas um número de benchmark.

**Avaliação da geração:**

* fidelidade: cada afirmação deve estar sustentada pelo contexto;
* correção: a resposta deve concordar com uma referência ou com julgamento especializado quando houver referência válida;
* relevância e completude: responde à pergunta sem desvio e cobre partes necessárias;
* correção de citação: a fonte citada existe, é acessível ao usuário e sustenta a frase;
* taxa de abstenção apropriada: abstém-se quando deve e não se abstém de forma excessiva;
* segurança: não revela conteúdo fora da autorização nem segue instruções inseridas em documentos;
* utilidade e clareza, com avaliação humana para casos de alto impacto.

**Avaliação do sistema:**

* latência de indexação, recuperação, reranqueamento e geração;
* custo por consulta e por atualização;
* disponibilidade, taxa de erro e consistência de versão;
* desempenho quando o corpus está vazio, desatualizado, contraditório ou contaminado;
* acessibilidade, legibilidade e qualidade no português brasileiro;
* rastreabilidade ponta a ponta.

RAGAs pode ser usado como triagem automatizada, mas deve ser combinado com amostra de revisão humana, conjunto de adversarial testing e métricas específicas do domínio. [5] A revisão de avaliação recomenda considerar separadamente recuperação, geração e a interação das duas; uma resposta boa com contexto errado e uma resposta ruim com contexto correto têm falhas diferentes. [3]

**Portões de liberação textual:**

1. nenhuma liberação sem conjunto de teste versionado, baseline e critérios por risco;
2. nenhuma liberação para dados restritos sem teste de isolamento por usuário/locatário;
3. nenhuma liberação para normas, educação formal ou saúde sem verificação de vigência e fonte;
4. nenhuma liberação quando a melhoria média esconder regressão material em um idioma, grupo ou tipo de pergunta;
5. nenhuma liberação quando a resposta não puder apresentar sua proveniência;
6. revisão humana obrigatória para ações externas, aconselhamento de alto impacto ou conflito não resolvido.

### 3.9 Segurança, privacidade e governança

A orientação OWASP trata a superfície de ataque como todo o pipeline: ingestão, embeddings, armazenamento vetorial, recuperação, geração, validação de saída e integração com agentes. [8] A especificação deve tratar como requisitos mínimos:

* verificação de proveniência e integridade do documento contra manifesto protegido;
* varredura e revisão de conteúdo para instruções ocultas, Unicode invisível e documentos envenenados;
* delimitação do contexto e limite de tamanho/quantidade de chunks;
* autorização por chunk e filtro de consulta antes do modelo;
* isolamento de locatários e classes de sigilo;
* atribuição de fonte com versão e, quando necessário, hash verificável;
* validação de saída e política de falha fechada;
* menor privilégio para quaisquer ferramentas conectadas;
* aprovação humana para ações de risco;
* logs de ingestão, consulta, documentos recuperados, versão de prompt, modelo, resposta, citações e decisão de abstenção;
* testes regulares de injeção direta e indireta, vazamento, recuperação cruzada e envenenamento;
* propagação de exclusão e política de retenção.

A OWASP define injeção indireta como conteúdo externo, como uma página ou arquivo, alterando o comportamento do modelo; RAG não elimina a vulnerabilidade. A prevenção perfeita não é garantida, portanto a prioridade deve ser reduzir impacto por separação, menor privilégio, filtragem, testes adversariais e aprovação humana. [9]

O NIST AI RMF é voluntário e estrutura gestão de risco em **Govern, Map, Measure e Manage**, com a finalidade de incorporar confiabilidade ao desenho, desenvolvimento, uso e avaliação de sistemas de IA. [10] Para RAG, isso se traduz em proprietário do risco, inventário de fontes, análise de contexto, métricas e monitoramento contínuo, não somente em um filtro no prompt.

A LGPD define dado pessoal e dado pessoal sensível, inclui operações como coleta, uso, acesso, armazenamento e eliminação no conceito de tratamento, e exige princípios de finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização. [13] Portanto, embeddings, chunks, caches, logs e transcrições devem entrar no inventário de tratamento; não se deve presumir que um vetor seja anônimo apenas por não ser texto legível.

### 3.10 Operação, observabilidade e mudança

O sistema deve conservar um registro que permita reconstruir uma resposta sem registrar mais dados pessoais do que o necessário. O evento de auditoria deve incluir versão da fonte, filtros aplicados, candidatos, reranqueamento, modelo, prompt, resultado de validação, citações e política acionada. Dados de usuário devem ser minimizados, separados por finalidade e retidos pelo período justificável.

Mudanças em embedding, chunking, reranqueador, modelo gerador, prompt ou corpus exigem reavaliação. Atualizar apenas o modelo gerador pode mudar o uso do mesmo contexto; atualizar apenas o índice pode mudar a evidência; ambos devem ser versionados. O monitoramento pós-lançamento deve procurar deriva de corpus, queda de recuperação, aumento de abstenção, novas classes de prompt injection, respostas sem citação e regressões linguísticas.

## 4. Comparação textual de arquiteturas e decisões

### RAG ingênuo

Indexa documentos, recupera um conjunto fixo e concatena-o à pergunta. É simples, barato para prototipar e adequado para validar se o corpus contém a resposta. É inadequado como padrão de produção quando há permissões, documentos longos, consultas ambíguas, versões, conflito ou alto risco. O problema não é somente o LLM: o conjunto fixo pode conter ruído, ultrapassar o contexto e induzir a resposta.

### RAG avançado

Acrescenta limpeza e particionamento melhores, metadados, filtros, reformulação de consulta, recuperação híbrida, reranqueamento e validação. É o padrão recomendado para um assistente institucional ou educacional porque permite localizar o gargalo e medir cada etapa. O custo é maior e cada componente pode introduzir deriva, latência e novos modos de falha.

### RAG modular

Trata consulta, recuperação, reranqueamento, fontes estruturadas, gerador, verificador e política como módulos substituíveis. É útil quando há múltiplos domínios, modelos ou exigências de auditoria. Exige contratos claros entre módulos: esquema de metadados, limites de confiança, formato de citação, tratamento de erro e versão. Sem isso, a modularidade apenas distribui a responsabilidade e dificulta a depuração.

### RAG adaptativo ou reflexivo

Recupera somente quando há necessidade e pode criticar relevância, suporte e qualidade da própria resposta. Self-RAG é a evidência experimental mais conhecida nessa direção. [6] Use-o quando consultas variam entre perguntas conversacionais simples e perguntas que exigem fontes, ou quando contexto irrelevante prejudica a geração. Não substitua revisão humana por “autocrítica” do mesmo modelo.

### RAG corretivo

Testa se a recuperação parece correta e tem plano para documento irrelevante ou ambíguo. CRAG exemplifica essa estratégia. [7] Use-a em bases dinâmicas ou quando falhas de recuperação forem mais perigosas que latência adicional. Qualquer busca externa deve passar pelas mesmas verificações de proveniência, autorização, atualidade e prompt injection da base interna.

### RAG com grafo ou dados estruturados

É apropriado quando a resposta depende de entidades, relações, datas, hierarquia normativa ou filtros exatos. Pode complementar texto vetorial; não deve ser escolhido apenas por tendência. A especificação precisa dizer qual fonte é normativa quando o texto e o grafo divergirem e como a resposta citará ambos.

### RAG multimodal

Pode recuperar texto, imagens, tabelas, áudio ou vídeo, mas preservação de layout não equivale a compreensão correta. Em educação, documentos visuais e acessibilidade tornam o caso relevante; em alta consequência, cada modalidade exige seu próprio teste de extração, rastreabilidade e erro. A revisão educacional identifica suporte multimodal limitado como lacuna. [15]

## 5. Aplicações educativas

### 5.1 Casos de uso compatíveis com a evidência

RAG pode apoiar busca em regulamentos e materiais de curso, explicação baseada em leituras indicadas, criação de perguntas para revisão, feedback formativo acompanhado de referências, planejamento de aula e localização de adaptações pedagógicas. A revisão de educação descreve aplicações em aprendizagem interativa, produção/avaliação de conteúdo e integração em ecossistemas educacionais, mas também identifica limitações de atualidade, custo, alucinação e multimodalidade. [15]

O assistente da USP é um caso brasileiro útil para serviços institucionais: o sistema usou documentos normativos e comparou modelos, chunks e número de documentos recuperados. Seus resultados mostram que fornecer o trecho correto melhorou muito o desempenho em relação à ausência de contexto, mas a recuperação Top-5 ainda foi baixa. [16] A implantação de um assistente de secretaria deve, portanto, priorizar documentos vigentes, perguntas de benchmark reais, fallback para página oficial e possibilidade de o usuário confirmar a norma.

O estudo de Harada et al. indica um possível uso para apoiar docentes em práticas inclusivas com literatura revisada por pares. [18] O requisito pedagógico é que a ferramenta organize evidências e alternativas, não classifique estudantes nem substitua avaliação profissional de necessidades educacionais.

### 5.2 Salvaguardas pedagógicas

* A resposta deve indicar fonte, data e nível de evidência; o estudante deve poder abrir o trecho original.
* O professor deve poder revisar, corrigir, excluir ou substituir fontes e explicar a decisão.
* Conteúdo gerado deve ser tratado como rascunho verificável, não como material automaticamente pronto.
* Avaliação de aprendizagem e decisões disciplinares não devem depender de uma resposta RAG sem procedimento humano, critérios publicados e direito de contestação.
* Os testes devem cobrir português brasileiro, variações regionais, linguagem simples, deficiência, baixa conectividade e perguntas não padronizadas.
* Citações devem ensinar verificação, e não apenas ornamentar a resposta.
* Dados de estudantes devem ser minimizados; conversas não devem virar corpus de treinamento ou memória persistente sem base legal, informação clara e governança.

O Referencial brasileiro para uso e desenvolvimento responsáveis de IA na educação recomenda supervisão humana efetiva, transparência, explicabilidade, proteção de dados, valorização do trabalho docente e compromisso com inclusão e equidade. [19] Essas são condições de implantação, não efeitos garantidos pelo fato de usar RAG.

### 5.3 O que ainda não está demonstrado

A literatura educativa revisada é heterogênea e reúne protótipos, comparações técnicas e estudos de aplicação. Ela não demonstra de forma geral que RAG melhora aprendizagem de longo prazo, reduz desigualdade ou substitui tutoria humana. [15] O estudo brasileiro em português de Rodrigues et al. não é RAG e teve amostra/tarefas específicas; seu achado de notas altas não autoriza generalização para tutoria ou avaliação de estudantes. [17]

## 6. Contexto social, brasileiro e latino-americano

RAG pode aumentar acesso a normas e materiais locais, mas também pode ampliar desigualdade se o corpus privilegiar inglês, instituições centrais ou fontes com infraestrutura digital. BEIR explicitamente é majoritariamente inglês e não cobre bem documentos longos, sinais multifatoriais ou generalização para todos os domínios. [4] Um sistema para o Brasil deve medir cobertura de português brasileiro, acesso móvel, baixa largura de banda, linguagem simples, regiões e grupos que não aparecem nos dados de desenvolvimento.

A UNESCO recomenda uma abordagem centrada em direitos, inclusão e agência humana para IA generativa em educação e pesquisa, com atenção a privacidade, equidade e uso apropriado à idade. [11] O Referencial do MEC aplica princípios semelhantes ao contexto brasileiro e afirma que a IA deve combater, e não criar, barreiras de participação. [19]

A opinião de Matos et al. sobre a proposta de IA generativa em escolas públicas de São Paulo alerta que capacidade técnica, estrutura escolar, formação docente, carga de revisão e qualidade do conteúdo são inseparáveis. [21] O texto é uma análise/opinião fundamentada em contexto brasileiro, não uma avaliação causal de RAG; seu valor para a especificação é lembrar que “revisão humana” tem custo de tempo, formação e carreira, e não pode ser apenas uma frase de conformidade.

A ANPD registra que IA generativa pode introduzir ou amplificar riscos de privacidade e que dados pessoais percorrem o ciclo de vida, inclusive geração e compartilhamento de novos dados. O Radar Tecnológico também ressalta que sua edição é um ponto de partida e pode ficar desatualizada diante da velocidade técnica. [20] A especificação deve, por isso, registrar finalidade, base legal, minimização, retenção, direitos do titular e avaliação de impacto quando aplicável.

## 7. Fronteira clínica e encaminhamento profissional

Um RAG clínico ou de saúde pode, no máximo, auxiliar a localizar e apresentar diretrizes, literatura ou informações administrativas sob controle profissional. Recuperar uma diretriz não significa avaliar um paciente, considerar contraindicações, realizar diagnóstico ou prescrever tratamento. Nem a citação nem uma pontuação de fidelidade transformam a saída em ato clínico.

A OMS afirma que IA em saúde deve colocar ética e direitos humanos no centro do desenho, implantação e uso, e responsabilizar os atores que dependem do sistema e as pessoas afetadas. [12] Para qualquer uso clínico, a especificação deve exigir fonte vigente, rastreabilidade, revisão por profissional habilitado, gestão de conflito e um caminho de encaminhamento. A interface deve dizer claramente que não substitui consulta ou serviço de emergência.

Se a pergunta envolver sintomas, risco imediato, medicação, gravidez, saúde mental, criança, ideação suicida, reação grave ou decisão terapêutica, o sistema deve limitar-se a informação geral segura e recomendar avaliação por profissional habilitado. Em emergência, a orientação apropriada é procurar o serviço local de emergência; o RAG não deve diagnosticar nem tratar.

## 8. Contradições, lacunas e decisões não resolvidas

1. **“RAG reduz alucinação” versus “RAG garante factualidade.”** As fontes experimentais relatam melhorias em tarefas específicas, enquanto OWASP e os próprios autores de Self-RAG reconhecem que injeção, contexto errado e respostas sem suporte continuam possíveis. [1] [6] [9] A especificação adota “reduzir risco e tornar verificável”, nunca “garantir verdade”.
2. **Métrica automatizada versus julgamento humano.** RAGAs acelera avaliação sem referência, mas RAGAs e revisões de avaliação não eliminam necessidade de julgamentos humanos, especialmente em respostas abertas, normativas ou de alto risco. [3] [5]
3. **Desempenho in-domain versus generalização.** BEIR mostra diferenças fortes entre tarefas e domínios, além de viés lexical em alguns conjuntos. [4] Um número de benchmark não libera o sistema para outro corpus.
4. **Promessa educacional versus efeito educacional.** A revisão de Li et al. reúne 51 estudos e identifica aplicações, mas ainda relata desafios e heterogeneidade; os estudos brasileiros encontrados são casos, estudos preliminares ou descrições de sistema. [15] [16] [17] [18]
5. **Fonte oficial versus atualidade.** Uma fonte oficial pode estar revogada, conter erro de publicação ou não responder à pergunta. A especificação exige vigência, versão, localização e tratamento explícito de conflito.
6. **Eficiência versus segurança.** Recuperar mais documentos pode elevar cobertura e aumentar ruído, custo e superfície de injeção. Recuperar menos reduz latência, mas pode omitir exceção. O valor de *k* precisa ser calibrado por intenção e validado no corpus.
7. **Português brasileiro ainda exige conjunto próprio.** MIRACL amplia o panorama multilíngue, mas seu corpus e tarefa não substituem consultas e documentos brasileiros. [14] O estudo de português brasileiro encontrado avalia LLMs, não RAG. [17]
8. **Lacuna de causalidade e impacto social.** Não foi confirmada, nas fontes lidas, evidência suficiente de impacto de longo prazo em aprendizagem, trabalho docente, desigualdade ou desfechos clínicos atribuível especificamente a RAG.
9. **Lacuna de privacidade em vetores.** A LGPD cobre o tratamento de dados, e OWASP exige exclusão e isolamento, mas limiares e métodos universais para risco de reidentificação de embeddings não foram confirmados neste levantamento. [8] [13]
10. **Contradição temporal de documentos.** Não foi encontrada uma regra universal que resolva, em geral, conflitos entre fonte nova, fonte oficial, fonte local e conhecimento paramétrico. O sistema deve tornar o conflito visível e delegar a decisão ao responsável pelo domínio.

## 9. Fichas das fontes e estado de verificação

**Critério de contagem:** 21 fontes originais foram localizadas e selecionadas. As 21 URLs abaixo foram abertas na página do editor, repositório acadêmico ou órgão responsável; portanto, contam como **verificadas** para metadados e para os achados usados. “Texto integral efetivamente lido” significa que a sessão leu o conteúdo integral disponível em HTML/web ou o instrumento correspondente; quando apenas ficha, resumo ou trechos indexados foram lidos, isso está marcado explicitamente. O total é **14 textos integrais efetivamente lidos**; 7 fontes têm texto integral vinculado, mas nesta sessão foram lidos apenas ficha, resumo ou seções relevantes.

### [1] Lewis et al. (2020/2021)

* **Autor/entidade, ano e identificador:** Patrick Lewis et al.; publicação NeurIPS 2020, versão arXiv v4 de 2021; arXiv:2005.11401. DOI de arXiv disponível: 10.48550/arXiv.2005.11401.
* **Tipo e contexto:** artigo primário de método e avaliação; tarefas NLP intensivas em conhecimento, incluindo perguntas abertas, geração e verificação, com índice de Wikipedia.
* **Achados:** combinação de retriever neural, índice denso e gerador seq2seq; comparação de condicionamento por sequência e por token; ganhos experimentais em tarefas abertas e geração mais específica, diversa e factual que baseline paramétrico.
* **Limitações:** resultados dependem de Wikipedia, tarefas e treinamento específicos; o próprio trabalho discute documentos latentes e dificuldade de recuperação útil; não avalia segurança, LGPD, português brasileiro ou operação institucional.
* **Verificação:** sim, HTML original do arXiv lido. **Texto integral acessível:** sim; lido.

### [2] Gao et al. (2023/2024)

* **Autor/entidade, ano e identificador:** Yunfan Gao et al.; arXiv:2312.10997, versão v5 de 2024; sem DOI de periódico confirmado na página lida.
* **Tipo e contexto:** survey técnico de RAG para LLMs.
* **Achados:** taxonomia Naive/Advanced/Modular; análise de indexação, consulta, recuperação, geração, aumento, tarefas e avaliação; enumera problemas de ruído, contexto, atualização, robustez e avaliação.
* **Limitações:** revisão ampla, não meta-análise de efeitos; reúne estudos e benchmarks heterogêneos; recomendações não equivalem a validação em um corpus brasileiro.
* **Verificação:** sim, HTML original do arXiv lido. **Texto integral acessível:** sim; lido.

### [3] Yu et al. (2024)

* **Autor/entidade, ano e identificador:** Hao Yu, Aoran Gan, Kai Zhang, Shiwei Tong, Qi Liu e Zhaofeng Liu; arXiv:2405.07437v2, 2024; sem DOI confirmado na página lida.
* **Tipo e contexto:** survey de avaliação de RAG e framework AUEPORA.
* **Achados:** avaliação separada de recuperação, geração e sistema completo; discute relevância, precisão, fidelidade, correção, latência, ambiguidade e limitações dos benchmarks.
* **Limitações:** survey e proposta de organização, não validação universal de um protocolo; métricas dependem de conjunto, referência, modelo avaliador e tarefa.
* **Verificação:** sim, HTML original do arXiv lido. **Texto integral acessível:** sim; lido.

### [4] Thakur et al. (2021)

* **Autor/entidade, ano e identificador:** Nandan Thakur, Nils Reimers, Andreas Rücklé, Abhishek Srivastava e Iryna Gurevych; arXiv:2104.08663; trabalho associado à avaliação BEIR. DOI formal não confirmado na página lida.
* **Tipo e contexto:** benchmark primário de recuperação zero-shot; 18 conjuntos, nove tarefas e múltiplos domínios, predominantemente em inglês.
* **Achados:** BM25 como baseline robusto; reranqueamento/interação tardia com melhor média e maior custo; nenhum método universalmente melhor; desempenho in-domain não prediz bem generalização.
* **Limitações:** conjuntos majoritariamente ingleses, documentos em geral curtos, sinais multifatoriais e tarefas longas limitados; vieses de anotação e lexicalidade.
* **Verificação:** sim, HTML original lido. **Texto integral acessível:** sim; lido.

### [5] Es et al. (2024)

* **Autor/entidade, ano e identificador:** Shahul Es, Jithin James, Luis Espinosa Anke e Steven Schockaert; EACL 2024; DOI 10.18653/v1/2024.eacl-demo.16.
* **Tipo e contexto:** demonstração/artigo metodológico de avaliação automatizada sem referência humana, para pipelines RAG.
* **Achados:** propõe métricas para relevância do contexto, fidelidade e qualidade/relevância da geração.
* **Limitações:** “reference-free” não é “truth-free”; avaliadores LLM podem apresentar viés, instabilidade e correlação incompleta com humanos; página original consultada forneceu metadados e resumo, não auditoria integral do PDF.
* **Verificação:** sim, página ACL original. **Texto integral acessível:** PDF disponível, mas **não integralmente lido nesta sessão**.

### [6] Asai et al. (2023/2024)

* **Autor/entidade, ano e identificador:** Akari Asai, Zeqiu Wu, Yizhong Wang, Avirup Sil e Hannaneh Hajishirzi; arXiv:2310.11511, 2023; DOI de arXiv disponível: 10.48550/arXiv.2310.11511.
* **Tipo e contexto:** artigo primário de método Self-RAG; tarefas de QA aberta, raciocínio, verificação e geração longa, com pequenas avaliações humanas.
* **Achados:** recuperação sob demanda, tokens de reflexão, crítica da própria resposta e citações; ganhos experimentais sobre baselines em tarefas selecionadas.
* **Limitações:** modelo e treinamento específicos; avaliação humana pequena; os autores admitem que algumas saídas ainda não são completamente sustentadas pelas citações.
* **Verificação:** sim, HTML original lido. **Texto integral acessível:** sim; lido.

### [7] Yan et al. (2024)

* **Autor/entidade, ano e identificador:** Shi-Qi Yan, Jia-Chen Gu, Yun Zhu e Zhen-Hua Ling; arXiv:2401.15884v3, 2024; DOI de arXiv não confirmado nesta sessão.
* **Tipo e contexto:** artigo primário de método de recuperação corretiva, com avaliador de recuperação, refinamento e busca externa.
* **Achados:** ações Correct/Incorrect/Ambiguous; documentos corretos são refinados, incorretos descartados e ambíguos combinados com conhecimento externo; resultados experimentais em tarefas próprias.
* **Limitações:** limiares, avaliador, corpus e web search específicos; fonte externa amplia risco de desatualização, injeção e conflito; não é garantia de correção.
* **Verificação:** sim, HTML original lido. **Texto integral acessível:** sim; lido.

### [8] OWASP (2025/consulta 2026)

* **Autor/entidade, ano e identificador:** OWASP GenAI Security Project; RAG Security Cheat Sheet, versão consultada em 2026; sem DOI.
* **Tipo e contexto:** diretriz técnica de segurança para ingestão, embeddings, vector store, recuperação, geração, saída e agentes.
* **Achados:** recomenda proveniência, integridade, isolamento, autorização por chunk, exclusão em cascata, atribuição de fonte, observabilidade, falha fechada e testes adversariais.
* **Limitações:** orientação prática, não estudo experimental comparativo; controles precisam ser adaptados a arquitetura e legislação aplicável.
* **Verificação:** sim, página original lida. **Texto integral acessível:** sim; lido.

### [9] OWASP (2025)

* **Autor/entidade, ano e identificador:** OWASP GenAI Security Project; LLM01:2025 Prompt Injection; sem DOI.
* **Tipo e contexto:** diretriz de segurança para injeção direta e indireta em LLMs, inclusive conteúdo externo usado por RAG.
* **Achados:** documentos e páginas podem alterar comportamento; RAG não elimina prompt injection; recomenda delimitação de conteúdo, menor privilégio, filtros, formato validável, testes adversariais e aprovação humana.
* **Limitações:** não fornece prevenção perfeita nem limiar universal; eficácia depende do modelo, ferramentas e contexto de agência.
* **Verificação:** sim, página original lida. **Texto integral acessível:** sim; lido.

### [10] NIST (2023/2024)

* **Autor/entidade, ano e identificador:** National Institute of Standards and Technology; AI RMF 1.0 publicado em 2023 e perfil de IA generativa em 2024; DOI do AI RMF 1.0: 10.6028/NIST.AI.100-1; perfil: 10.6028/NIST.AI.600-1.
* **Tipo e contexto:** framework oficial voluntário de gestão de risco para IA.
* **Achados:** funções Govern, Map, Measure e Manage; integração de confiabilidade ao ciclo de desenho, desenvolvimento, uso e avaliação; perfil para riscos de IA generativa.
* **Limitações:** framework voluntário e geral, não especificação RAG nem norma jurídica; a página oficial foi lida, mas os PDFs completos dos frameworks não foram auditados integralmente nesta sessão.
* **Verificação:** sim, página oficial original. **Texto integral acessível:** documentos vinculados; **não integralmente lidos nesta sessão**.

### [11] UNESCO, Miao e Holmes (2023)

* **Autor/entidade, ano e identificador:** UNESCO; Fengchun Miao e Wayne Holmes; DOI 10.54675/EWZM9535; ISBN 978-92-3-100612-8.
* **Tipo e contexto:** diretriz internacional, 44 páginas, IA generativa em educação e pesquisa.
* **Achados:** enfoque em direitos, inclusão, equidade, privacidade, agência humana e uso apropriado; orienta instituições e políticas.
* **Limitações:** diretriz normativa internacional, não ensaio de RAG; página consultada confirmou metadados, licença e PDF multilíngue, mas o PDF integral não foi lido nesta sessão.
* **Verificação:** sim, registro UNESCO original. **Texto integral acessível:** sim via PDF; **não integralmente lido nesta sessão**.

### [12] World Health Organization (2021)

* **Autor/entidade, ano e identificador:** Organização Mundial da Saúde; ISBN 9789240029200; DOI não confirmado.
* **Tipo e contexto:** diretriz oficial de ética e governança de IA em saúde, 150 páginas.
* **Achados:** ética e direitos humanos no desenho, implantação e uso; responsabilização de atores; princípios para benefício público, segurança e equidade.
* **Limitações:** não é diretriz específica de RAG; página oficial e overview foram lidos, e o PDF integral está vinculado, mas não foi lido página a página nesta sessão.
* **Verificação:** sim, página WHO original. **Texto integral acessível:** sim via PDF; **não integralmente lido nesta sessão**.

### [13] Brasil, Lei nº 13.709/2018

* **Autor/entidade, ano e identificador:** Presidência da República/Planalto; Lei Geral de Proteção de Dados Pessoais, 2018, com alterações compiladas; sem DOI.
* **Tipo e contexto:** legislação brasileira aplicável ao tratamento de dados pessoais, inclusive meios digitais.
* **Achados:** define dado pessoal, dado sensível, controlador, operador, tratamento, anonimização e relatório de impacto; estabelece princípios de finalidade, necessidade, transparência, segurança, prevenção, não discriminação e responsabilização.
* **Limitações:** não prescreve arquitetura RAG ou técnica de anonimização de embeddings; aplicação depende de finalidade, contexto, base legal, regulamentação e interpretação jurídica atualizada.
* **Verificação:** sim, texto oficial em HTML lido nos artigos pertinentes. **Texto integral acessível:** sim; leitura focada nos dispositivos relevantes, não reauditoria jurídica de toda a lei compilada.

### [14] Zhang et al. (2023)

* **Autor/entidade, ano e identificador:** Xinyu Zhang et al.; TACL 2023; DOI 10.1162/tacl_a_00595.
* **Tipo e contexto:** dataset/benchmark primário de recuperação monolíngue em 18 línguas, Wikipedia, com mais de 726 mil julgamentos para 78 mil consultas.
* **Achados:** anotações realizadas por falantes nativos, cobrindo famílias linguísticas diversas e visando melhorar acesso a populações subatendidas.
* **Limitações:** corpus Wikipedia e tarefa de recuperação; não substitui dados institucionais ou educacionais brasileiros; a página lida não foi usada para afirmar cobertura específica de português brasileiro.
* **Verificação:** sim, página ACL original e abstract lidos. **Texto integral acessível:** PDF disponível, mas **não integralmente lido nesta sessão**.

### [15] Li et al. (2025)

* **Autor/entidade, ano e identificador:** Zongxi Li, Zijian Wang, Weiming Wang, Kevin Hung, Haoran Xie e Fu Lee Wang; DOI 10.1016/j.caeai.2025.100417.
* **Tipo e contexto:** revisão sistemática/survey em *Computers and Education: Artificial Intelligence*, publicada em 2025; educação e ensino, 51 estudos sintetizados.
* **Achados:** organiza indexação, recuperação e geração e cobre aprendizagem interativa, conteúdo/avaliação e ecossistemas educacionais; identifica alucinação, conhecimento incompleto/desatualizado, custo e multimodalidade como desafios.
* **Limitações:** heterogeneidade de estudos e aplicações; revisão não demonstra efeito causal comum sobre aprendizagem; não é específica do Brasil.
* **Verificação:** sim, página ScienceDirect original lida. **Texto integral acessível:** sim em HTML/PDF; HTML integral disponível e lido.

### [16] Kuratomi et al. (2025)

* **Autor/entidade, ano e identificador:** Gustavo Kuratomi, Paulo Pirozelli, Fabio G. Cozman e Sarajane M. Peres; arXiv:2501.13880v1, 2025; DOI de arXiv não confirmado.
* **Tipo e contexto:** estudo primário/aplicado de assistente RAG para documentos normativos da Universidade de São Paulo; 866 documentos coletados de janeiro de 2023 a maio de 2024.
* **Achados:** Top-5 do melhor recuperador 30%; geração 22,04% contra referência; 54,02% com trechos corretos e 13,68% sem contexto.
* **Limitações:** uma instituição, corpus normativo e dataset próprios; métricas e referência não generalizam; resultados são preprint e não medem impacto social ou satisfação longitudinal.
* **Verificação:** sim, HTML original do arXiv lido. **Texto integral acessível:** sim; lido.

### [17] Rodrigues et al. (2025)

* **Autor/entidade, ano e identificador:** Luiz Rodrigues et al.; LAK 2025; DOI 10.1145/3706468.3706515.
* **Tipo e contexto:** short paper primário, perguntas educacionais em português brasileiro; GPT-4 e Sabiá, tipos de questão e disciplinas variadas, dois professores avaliadores.
* **Achados:** médias próximas de 9,8/10, com erros específicos diferentes por modelo e tarefa.
* **Limitações:** não é estudo de RAG; amostra, rubrica e tarefas não autorizam generalizar para tutoria ou aprendizagem; desempenho alto médio pode esconder falhas críticas.
* **Verificação:** sim, página ACM original lida. **Texto integral acessível:** sim, artigo open access em HTML/PDF; lido.

### [18] Harada, de Melo e da Silva (2026)

* **Autor/entidade, ano e identificador:** William Massami Costa Harada, Tiago Eugênio de Melo e Fábio Santos da Silva; SBIE 2026; DOI 10.5753/sbie.2026.27325.
* **Tipo e contexto:** artigo/aplicação brasileira em ensino superior inclusivo; corpus de literatura revisada por pares, sete embeddings, seis LLMs abertos e RAGAs.
* **Achados:** melhor configuração reportada com Recall@10 documental 0,91 e Faithfulness 0,92.
* **Limitações:** números são do resumo e configuração específica; não demonstram melhora pedagógica, impacto em estudantes com deficiência, generalização ou segurança clínica; PDF integral não foi lido nesta sessão.
* **Verificação:** sim, página SBC original. **Texto integral acessível:** PDF disponível; **não integralmente lido nesta sessão**.

### [19] Ministério da Educação (2026)

* **Autor/entidade, ano e identificador:** Ministério da Educação, Secretaria de Gestão da Informação, Inovação e Avaliação de Políticas Educacionais; Referencial para o Uso e Desenvolvimento Responsáveis de IA na Educação, página atualizada em 24/07/2026; sem DOI confirmado.
* **Tipo e contexto:** referencial oficial brasileiro para instituições, educadores, gestores e formuladores de políticas, da educação infantil à pós-graduação.
* **Achados:** supervisão humana, transparência, explicabilidade, proteção de dados, valorização docente, inclusão e equidade.
* **Limitações:** orientação política/administrativa, não estudo experimental nem especificação RAG; implementação depende de regulamentação, recursos e governança local.
* **Verificação:** sim, página gov.br original lida. **Texto integral acessível:** página do referencial vinculada; nesta sessão foi lida a página-resumo, não o documento integral vinculado.

### [20] ANPD (2024)

* **Autor/entidade, ano e identificador:** Autoridade Nacional de Proteção de Dados; *Radar Tecnológico n.º 3 — Inteligência Artificial Generativa*, 1ª edição digital, novembro de 2024; sem DOI.
* **Tipo e contexto:** radar técnico oficial brasileiro sobre tecnologia emergente e proteção de dados.
* **Achados:** relaciona IA generativa a riscos de privacidade; recomenda perspectiva ética, jurídica e sociotécnica; ressalta que dados pessoais percorrem ciclo de vida e que a tecnologia muda rapidamente.
* **Limitações:** não é norma vinculante nem orientação específica de RAG; a própria nota explicativa alerta para possível desatualização; PDF foi acessado e seções relevantes lidas, não todas as páginas.
* **Verificação:** sim, PDF/URL oficial ANPD. **Texto integral acessível:** sim; **leitura parcial nesta sessão**.

### [21] Matos et al. (2024)

* **Autor/entidade, ano e identificador:** Fernanda D.A.O. Matos, Gildo Girotto Junior, Ana de Medeiros Arnt e Adriana Lippi; *Patterns*, 2024; DOI 10.1016/j.patter.2024.101020.
* **Tipo e contexto:** artigo de opinião/análise, acesso aberto, sobre proposta de uso de IA generativa em educação pública de São Paulo.
* **Achados:** chama atenção para qualidade, equidade, estrutura escolar, formação docente, carga de revisão e limitações técnicas; discute o contexto brasileiro.
* **Limitações:** não é avaliação experimental, não é estudo de RAG e não mede resultados educacionais; deve ser lido como análise argumentativa contextual.
* **Verificação:** sim, página Cell/Patterns original lida. **Texto integral acessível:** sim, HTML open access; lido.

## 10. Estatísticas de pesquisa e leitura

* **Fontes localizadas e selecionadas:** 21.
* **Fontes verificadas por abertura da página original e conferência de metadados/achados usados:** 21.
* **Textos integrais efetivamente lidos na sessão:** 14.
* **Fontes com texto integral acessível, mas das quais foram lidos apenas resumo, ficha ou seções selecionadas:** 7.
* **Revisões/surveys ou frameworks técnicos principais:** 5 ([2], [3], [10], [11], [15]); nem todos são revisões sistemáticas formais.
* **Estudos/recursos brasileiros ou diretamente pertinentes ao Brasil:** 7 ([13], [16], [17], [18], [19], [20], [21]).
* **Diretrizes oficiais ou legislação:** 8 ([8], [9], [10], [11], [12], [13], [19], [20]).

As estatísticas não significam que todas as fontes tenham sido avaliadas com a mesma profundidade. Os estados de texto integral estão descritos em cada ficha para evitar que uma página de resumo seja apresentada como leitura completa de um artigo ou guideline.

## References

[1]: https://arxiv.org/html/2005.11401 "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
[2]: https://arxiv.org/html/2312.10997 "Retrieval-Augmented Generation for Large Language Models: A Survey"
[3]: https://arxiv.org/html/2405.07437 "Evaluation of Retrieval-Augmented Generation: A Survey"
[4]: https://arxiv.org/html/2104.08663 "BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models"
[5]: https://aclanthology.org/2024.eacl-demo.16/ "RAGAs: Automated Evaluation of Retrieval Augmented Generation"
[6]: https://arxiv.org/html/2310.11511 "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection"
[7]: https://arxiv.org/html/2401.15884 "Corrective Retrieval Augmented Generation"
[8]: https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html "RAG Security Cheat Sheet"
[9]: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ "LLM01:2025 Prompt Injection"
[10]: https://www.nist.gov/itl/ai-risk-management-framework "AI Risk Management Framework"
[11]: https://unesdoc.unesco.org/ark:/48223/pf0000386693 "Guidance for generative AI in education and research"
[12]: https://www.who.int/publications/i/item/9789240029200 "Ethics and governance of artificial intelligence for health"
[13]: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm "Lei Geral de Proteção de Dados Pessoais"
[14]: https://aclanthology.org/2023.tacl-1.63/ "MIRACL: A Multilingual Retrieval Dataset Covering 18 Diverse Languages"
[15]: https://doi.org/10.1016/j.caeai.2025.100417 "Retrieval-augmented generation for educational application: A systematic survey"
[16]: https://arxiv.org/html/2501.13880v1 "A RAG-Based Institutional Assistant"
[17]: https://doi.org/10.1145/3706468.3706515 "LLMs Performance in Answering Educational Questions in Brazilian Portuguese: A Preliminary Analysis on LLMs Potential to Support Diverse Educational Needs"
[18]: https://doi.org/10.5753/sbie.2026.27325 "Retrieval-Augmented Guidance for Inclusive Teaching in Higher Education"
[19]: https://www.gov.br/mec/pt-br/referencial-de-ia-na-educacao "Referencial para o Uso e Desenvolvimento Responsáveis de Inteligência Artificial na Educação"
[20]: http://www.gov.br/anpd/pt-br/centrais-de-conteudo/documentos-tecnicos-orientativos/radar_tecnologico_ia_generativa_anpd.pdf/@@display-file/file "Radar Tecnológico n.º 3: Inteligência Artificial Generativa"
[21]: https://doi.org/10.1016/j.patter.2024.101020 "A proposal in Brazil to use generative AI in education threatens quality and equity"
