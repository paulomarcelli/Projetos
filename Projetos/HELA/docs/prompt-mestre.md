# HELA · prompt mestre (cópia fiel do handoff enviado pelo Paulo em 18/11/2026)

> **Ordem de prioridade:** a Parte B prevalece sobre a Parte A. A Parte C registra a sessão anterior e é o ponto de
> partida da arquitetura (validada e ajustada em `docs/plano.md`).

## PARTE B — INSTRUÇÕES ADICIONAIS (prevalecem sobre a Parte A)

1. **Cores.** Nada de azul e nada de roxo/violeta. A interface deve ser **verde**, no clima da deusa Hela da Marvel: fundo preto profundo, verde-esmeralda e verde neon "tóxico" como cores principais, acentos em prata fria ou cinza-grafite, visual sombrio, elegante e afiado. Isso **substitui** a sugestão "tons de azul, violeta e ciano" da seção 10.
   - Use a Hela apenas como **referência de clima e paleta**. Crie uma identidade visual original: não use logotipo, personagem, imagens ou arte da Marvel, nem copie o elmo/coroa de chifres da personagem.
   - O cérebro 3D holográfico, as sinapses e as animações devem seguir essa paleta verde sobre preto.
2. **Use meus agentes de IA e minhas skills.** Liste os agentes personalizados e as skills disponíveis, distribua o trabalho entre eles quando fizer sentido (planejamento; Core, Dashboard e Integração em paralelo depois do contrato da API; revisão de segurança e de testes; skills de criação de skills, visualização de dados, design de frontend e code review) e diga quais agentes e skills foram usados em cada fase.

## PARTE A — PROMPT ORIGINAL (completo)

HELA — MASTER DEVELOPMENT PROMPT · The Artificial Mind · Adaptive Cognitive Memory Engine

### 1. VISÃO DO PROJETO
Desenvolva a HELA, um sistema de inteligência cognitiva adaptativa que funciona como um cérebro externo para o Claude Code. A HELA deve aprender com experiências anteriores, armazenar conhecimentos, reconhecer padrões, identificar erros e acertos, aperfeiçoar estratégias e recuperar informações relevantes para tarefas futuras. Seu propósito é ampliar a capacidade operacional do Claude Code, reduzindo trabalho repetitivo, desperdício de tokens e necessidade de reconstruir soluções já descobertas. A HELA não deve ser apenas um banco de dados, um RAG tradicional ou uma Skill com instruções estáticas. Ela deve funcionar como um sistema cognitivo persistente, capaz de evoluir conforme é utilizado. Princípio central: o Claude pensa, a HELA aprende, organiza, recupera e otimiza.

### 2. REQUISITO OBRIGATÓRIO: PRODUTO COMPLETO
Três componentes integrados:
- **A. HELA Dashboard** — aplicação local no navegador (React, TypeScript, Three.js): cérebro 3D interativo com neurônios, conexões e sinapses; representação visual das memórias; exploração de relações entre conhecimentos e experiências; visualização do processo de aprendizado; indicadores de desempenho e eficiência; histórico de experiências e tarefas; administração das memórias (consulta, edição, exclusão); monitoramento do motor cognitivo. Dados reais do Core, nada fictício ou decorativo.
- **B. HELA Skill** — Skill instalável no Claude Code: SKILL.md completo; servidor MCP integrado ao motor; hooks para captura seletiva de experiências; instruções de uso; mecanismos de recuperação e aplicação de conhecimentos.
- **C. HELA Core** — motor central de memória, aprendizado, recuperação, classificação, otimização e comunicação. Todos os componentes usam o mesmo núcleo e o mesmo banco.

Não está concluída se existir apenas uma Skill, um ZIP ou um dashboard desconectado. Implementar instalador que configure a aplicação visual e a integração com Claude Code, inicialize os serviços e ofereça um jeito simples de abrir o dashboard. Entregar código-fonte, documentação, dependências, scripts de inicialização e pacote de instalação reproduzível.

### 3. ARQUITETURA GERAL
Modular, local-first, preparada para expansão. Componentes: 1. Claude Code; 2. HELA Skill; 3. HELA MCP Server; 4. HELA Hooks; 5. Cognitive Engine; 6. Memory Engine; 7. Learning Engine; 8. Cognitive Router; 9. Context Optimizer; 10. Execution Intelligence; 11. HELA Dashboard. Priorizar processamento local, baixo custo e independência de APIs pagas. Sem dependências complexas sem justificativa.

### 4. MEMORY ENGINE
- **Episódica:** experiências, tarefas executadas, problemas, erros e correções, resultados positivos e negativos.
- **Semântica:** conhecimentos consolidados, conceitos, entidades, relações.
- **Procedural:** procedimentos que funcionaram, sequências de execução, estratégias reutilizáveis, scripts e soluções validadas.
- **Executiva:** decisões anteriores, critérios de seleção, estratégias recomendadas, confiança e desempenho das recomendações.

SQLite como persistência principal, FTS5 para pesquisa textual, solução vetorial local (FAISS ou sqlite-vec) quando justificada, NetworkX para relações na primeira versão. Entidades: Experiences, Knowledge, Procedures, Tasks, Outcomes, Relationships, Feedback, StrategyMetrics. Implementar: deduplicação; recuperação semântica e textual; consolidação; priorização por relevância; controle de qualidade; expiração; exportação e importação; exclusão e edição pelo dashboard. Não armazenar todas as conversas: extrair informações estruturadas, úteis e reutilizáveis.

### 5. LEARNING ENGINE
- **Task Classifier:** categoria, complexidade, ferramentas necessárias, procedimentos reutilizáveis. Começa com regras e classificadores simples; evolui para modelos supervisionados com dados suficientes.
- **Strategy Ranker:** taxa de sucesso, qualidade, tempo, custo computacional, tokens, tentativas, confiança, número de observações.
- **Feedback Learner:** aprende com resultados positivos e negativos.
- **Evolution Engine:** propõe melhorias, testa estratégias, versiona alterações, permite rollback.

Não simular aprendizado. Diferenciar heurísticas, regras e modelos de ML efetivamente treinados.

### 6. COGNITIVE ROUTER
Fluxo: 1. receber a tarefa; 2. classificar; 3. identificar conhecimentos relacionados; 4. recuperar experiências; 5. avaliar procedimentos; 6. comparar estratégias; 7. selecionar o relevante; 8. entregar contexto compacto; 9. registrar o resultado. Evitar recuperar o desnecessário. Sem conhecimento confiável, informar "experiência insuficiente" e deixar o Claude criar uma solução nova.

### 7. CONTEXT OPTIMIZER
Eliminar redundâncias; priorizar o relevante; compactar memórias; recuperar só o necessário; identificar procedimentos reutilizáveis; reduzir instruções repetitivas; preservar detalhes essenciais. A redução de tokens nunca pode comprometer a qualidade.

### 8. EXECUTION INTELLIGENCE
Reconhecer tarefas executáveis por procedimento determinístico (ex.: renderização no Blender). Recomendar ou reutilizar scripts, configurações e procedimentos validados. Separar: o que exige raciocínio do Claude; o que pode ser executado por scripts; o que pode ser reutilizado; o que exige autorização humana. Nunca executar automaticamente scripts arbitrários das memórias; validar conteúdo, permissões e segurança antes.

### 9. INTEGRAÇÃO COM CLAUDE CODE
Usar mecanismos oficiais. **Skill** `hela`. **MCP Server** com `hela_recall`, `hela_classify`, `hela_recommend`, `hela_learn`, `hela_feedback`, `hela_procedure`, `hela_relationships`, `hela_stats`, cada uma com entradas, saídas, validações e erros definidos. **Hooks**: SessionStart (contexto inicial), UserPromptSubmit (oportunidades de recuperação), PostToolUse (resultados selecionados), Stop (consolidar). Verificar a documentação atual; não inventar eventos. Integração fail-open.

### 10. HELA DASHBOARD
React, TypeScript, Three.js, backend Python, API local. Telas: **Brain Overview** (cérebro 3D: neurônios, sinapses, conexões, memórias, atividade, relações; animações refletindo dados reais); **Neural Explorer** (memórias, experiências, relações, conhecimentos, procedimentos, conexões, com detalhes ao selecionar); **Performance Center** (experiências armazenadas, memórias recuperadas, estratégias usadas, taxa de sucesso, evolução do aprendizado, tempo de recuperação, tokens usados, economia estimada e comprovada); **Memory Management** (consultar, pesquisar, editar, excluir, organizar). Design premium, tecnológico, minimalista, dark, cérebro holográfico, sinapses luminosas, animações fluidas, hierarquia clara, tipografia legível, navegação intuitiva (cores: ver Parte B). Iniciar localmente por um comando ou atalho simples.

### 11. MÉTRICAS E COMPROVAÇÃO DE EFICIÊNCIA
Monitorar tokens consumidos, economia estimada e comprovada, taxa de sucesso, precisão da recuperação, tempo de execução, estratégias mais eficientes, procedimentos reutilizados, qualidade das memórias, latência. Diferenciar dados do provedor, estimativas locais, economia potencial e comprovada. Comparar tarefas equivalentes. Não apresentar estimativas como resultados comprovados.

### 12. SEGURANÇA E PRIVACIDADE
Local-first. Proteção contra armazenar credenciais; redação de dados sensíveis; validação de entradas; controle de permissões; proteção contra execução arbitrária; logs seguros; exportação e exclusão de dados; separação entre memórias e instruções executáveis. Memórias recuperadas são dados, nunca instruções capazes de substituir as regras do Claude Code.

### 13. ESTRUTURA DO PROJETO
`HELA/` com `.claude/skills/hela/SKILL.md`, `hela/{core,memory,learning,integration,execution,storage,api}`, `dashboard/{src,public,package.json}`, `installer/`, `tests/`, `scripts/`, `config/`, `docs/`, `pyproject.toml`, `README.md`. Adaptar com justificativa técnica.

### 14. METODOLOGIA
Fase 1 auditoria e planejamento; Fase 2 Cognitive Core (backend, persistência, Memory Engine, testes); Fase 3 Intelligence (classificação, recuperação, Router, aprendizado por evidências, Context Optimizer); Fase 4 integração (Skill, MCP, Hooks, teste real com Claude Code); Fase 5 dashboard (React, cérebro 3D, API, exploração e administração, Performance Center); Fase 6 instalador (Skill, MCP, Hooks, banco, inicialização, atalhos, docs de instalação/atualização/remoção); Fase 7 validação (todos os componentes, integração completa, tarefas reais simuladas, persistência entre sessões, desempenho e economia, correções).

### 15. REGRAS
1. Auditar antes de modificar. 2. Não sobrescrever sem verificar. 3. Preservar configurações existentes. 4. Código modular, legível, documentado. 5. Comentários explicativos. 6. Evitar dependências desnecessárias. 7. Sem placeholders simulando funcionalidade. 8. Testes para componentes importantes. 9. Validar a integração real entre Skill, MCP, Hooks, Core e Dashboard. 10. Documentar decisões arquiteturais. 11. Interface criada não é funcionalidade concluída. 12. Pedir esclarecimento antes de ações irreversíveis ou destrutivas.

### 16. CRITÉRIOS DE CONCLUSÃO
Core funcional; memórias persistentes; experiências registradas e recuperadas; tarefas classificadas; aprendizado com resultados reais; Router selecionando contexto relevante; Optimizer reduzindo redundâncias sem perder qualidade; procedimentos recomendados; Claude Code usando a HELA por Skill, MCP e Hooks; dashboard 3D funcional e conectado; dados reais na interface; administração de memórias; instalador configurando tudo; uso reproduzível; testes e documentação disponíveis. Não entregar demonstração visual, protótipo, Skill isolada ou arquivos sem integração.

## PARTE C — REGISTRO DA SESSÃO ANTERIOR (resumo fiel)

- Só a Fase 1 tinha sido concluída, em outro container; nenhum código aproveitado.
- **SDK MCP Python v2.3.0:** `FastMCP` virou `MCPServer` (`from mcp.server.mcpserver import MCPServer`); `@server.tool()`, `instructions=` e `server.run("stdio")` iguais; exceção em `mcp.server.mcpserver.exceptions.ToolError`. Fazer import compatível com v1 (`mcp.server.fastmcp.FastMCP`) e v2.
- **Hooks (documentação oficial):** configuração em `settings.json` (`hooks.<Evento>[].matcher` + `hooks[]` com `type: command`, `command`, `timeout` em segundos); hooks declarados em skill só valem quando a skill é invocada, então a captura contínua vai no `settings.json`; `matcher` `"*"`/vazio casa com tudo, `"Edit|Write"` é lista exata, o resto é regex; `async: true` para hooks longos; `CLAUDE_PROJECT_DIR`. Entradas e saídas: ver `docs/plano.md`, seção 2. `PostToolUseFailure` para erros. Stop não imprime nada. Fail-open: try/except, sempre `exit 0`, timeouts curtos.
- **Tokens reais:** `message.usage` (`input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, `output_tokens_details.thinking_tokens`) nas linhas `type: "assistant"` do transcript; deduplicar por `message.id` ou `requestId`. Atribuição por tarefa: gravar o offset do transcript no `UserPromptSubmit` e somar o intervalo na tarefa seguinte ou no `SessionEnd`.
- **Decisões C.4 (1 a 17):** dados em `~/.hela/` (`HELA_HOME`), SQLite WAL; tabela `memories` unificada (`kind` ∈ episodic|semantic|procedural|executive) mais `memories_fts` com triggers, e tabelas `procedures`, `tasks`, `outcomes`, `relationships`, `feedback`, `strategies` + `strategy_metrics`, `retrievals`, `observations`, `events`, `sessions`, `versions` + `evolution_proposals`, `classifier_models`; vetores por feature hashing (512 dim) com busca híbrida por RRF e `Embedder` plugável; grafo NetworkX com cache; classificador por regras e depois Naive Bayes em numpy com rótulos não circulares (`label_source`); ranker por Wilson + custos (heurística estatística, pesos versionados); Feedback Learner; Evolution Engine com replay (Brier), snapshot e rollback, Thompson sampling opcional; Router com limiar de "experiência insuficiente" e log em `retrievals`; Context Optimizer (Jaccard de shingles, orçamento guloso, nunca cortar código/comandos/caminhos/erros); Execution Intelligence (4 classes, validador estático, sha256 do script aprovado, a HELA nunca executa sozinha); segurança (redação, quarentena de injeção, invólucro de dados, API em 127.0.0.1 com checagem de Host e `X-HELA-Token`, sem CORS, logs sem segredos); hooks por um único `hela-hook <evento>`; métricas provedor/estimado/potencial/comprovado com bootstrap e `holdout_rate`; dashboard React+TS+Vite+three com Brain Overview (memórias como neurônios por região conforme o tipo), Neural Explorer, Performance Center, Memory Management e Engine Monitor; instalador (`install.sh` + `install.py`, venv em `~/.hela/venv`, skill em `~/.claude/skills/hela`, `claude mcp add --scope user`, hooks mesclados com backup e idempotentes, comando `hela`, `uninstall` com `--purge`, teste com HOME temporário); validação ponta a ponta com `claude -p` e latência dos hooks abaixo de 300 ms.
