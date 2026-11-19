# Memória da Sabrina

Leia inteira no começo de cada tarefa. No fim, acrescente o que aprendeu em **Regras aprendidas** e uma linha no
**Registro de tarefas**. Este repositório é **público**: nada de e-mail, telefone, senha, chave ou outro dado pessoal
aqui.

## O projeto

- Repositório **Projetos** do Paulo: um projeto por pasta em `Projetos/<nome>/`, cada um com `README.md` (alguns com
  `CLAUDE.md` e `docs/`). O repositório é **público**.
- **Publicação:** `.github/workflows/pages.yml` publica os sites no GitHub Pages a cada push na `main`. Projeto novo,
  ou pasta nova que um site carrega, precisa entrar na lista de cópia desse workflow.
- A equipe e as regras: `agentes/README.md` e `agentes/PROTOCOLO.md`. O painel da equipe é o Escritório do Paulo
  (`Projetos/Escritorio-do-Paulo/`), que roda só na máquina dele.
- `PARA-A-PROXIMA-IA.md` (na raiz) tem o contexto geral dos outros projetos.

## O Paulo

- Fala português (Brasil) e gosta de texto humano: frases curtas, sem fórmula.
- Gosta de ver o resultado: evidência (captura, saída de teste, link), não só descrição.
- Pediu para **não mexer no Notion** sem pedido explícito.

## Regras aprendidas

### Do que era coordenação
- **14/11/2026 · Design System primeiro.** Projeto com interface sempre começa com a tarefa da Sofia no Figma, e o
  front-end depende dela. O Escritório acrescenta essa tarefa sozinho se o plano esquecer.
- **14/11/2026 · Plano em `json`.** O Escritório só cria as tarefas se o plano vier no formato do arquivo do agente
  (`projeto`, `tarefas`, `chave`, `agente`, `dependeDe`, `tipo`).
- **15/11/2026 · Equipe de três.** Sofia (design), Karol (arquitetura, front-end, back-end, dados e IA) e Sabrina
  (coordenação, pesquisa, QA e segurança). Não crie tarefa para papel que não existe.

### Do que era pesquisa
- **14/11/2026 · Sofia Carson.** "SC2" e o single "Her" não tinham fonte confiável: ficaram fora do site.
- **Karol Sevilla × Samsung.** "Embaixadora oficial da Samsung" não foi confirmado em fonte oficial: não afirmar.
- **Leia a página, não o resumo.** O trecho da busca engana; abra a fonte e anote a data.
- **17/11/2026 · Roteiros "E se…?" (TikTok E Se, Hein?).** Os erros que mais aparecem:
  - número de divulgação convertido e arredondado ("abaixo de 0 °F" virou "uns −18 °C");
  - prazo mais longo do que as fontes dizem ("no primeiro dia a luz acende", quando as fontes falam em horas);
  - consequência de outro cenário entrando na história (parada permanente × "um segundo"; Sol sumir × Sol apagar).
  Sempre pergunte: "a fonte fala exatamente deste cenário?".
- **Física de "e se": refaça a conta.** Velocidade no Equador, antípoda, túnel pela Terra (PREM: 38 min,
  35.700 km/h) e recuo no pulo saem em minutos com um script, e a conta vale mais que um site de curiosidades.
  Confira também as hipóteses escondidas (túnel sem ar, Terra sem rotação).
- **Conte as palavras de novo.** A Gabriela errou uma contagem (93, não 90). Conto sem as marcações entre colchetes,
  separando por espaço, e a frase corrigida mantém o número de palavras da original.
- **Sites que bloqueiam leitura automática (403):** FSIS, FoodSafety.gov, IBGE e a página web da ONU. Para a ONU, o
  PDF abre. NASA (science.nasa.gov) e Live Science abrem com `curl`; a extração do texto da Live Science começa em
  `id="article-body"`.

### Do que era QA e segurança
- **14/11/2026 · Texto invisível.** No fã-site da Sofia Carson, dois textos estavam no código e não apareciam na tela;
  só a captura mostrou. Sempre confira com captura depois de rolar devagar, não só pelo DOM.
- **14/11/2026 · Console e build.** Toda revisão de interface inclui `npm run build`, console sem erros e capturas em
  390 × 844, 1280 e 1920.
- **Repositório público.** Procure e-mail, chave, `.env` e material pago em todo diff antes de liberar.
- **18/11/2026 · HELA: conferir a documentação do Claude Code pelo `.md`.** `code.claude.com/docs/en/<página>.md`
  abre em Markdown puro com `curl` (hooks, skills, mcp, settings, permissions, cli-reference). Mais rápido e completo
  que o WebFetch.
- **18/11/2026 · `claude -p` funciona aqui com `HOME` isolado.** `env -u CLAUDECODE HOME=<tmp> claude -p ...
  --settings <arquivo> --output-format json --debug-file <log>`. Nunca `--bare` (desliga hooks e MCP). O `usage` do
  `--output-format json` é o oráculo para a soma de tokens do transcript. Cada chamada curta custa de US$ 0,09 a 0,13.
- **18/11/2026 · Transcript: só a estrutura.** Para analisar `~/.claude/projects/*.jsonl` sem copiar conversa, um
  script que imprime chaves e tipos (nunca valores) e roda com `python3 -I`.
- **18/11/2026 · Arquivo de teste com nome de pacote.** Um `attrs.py` na pasta do script sombreou o pacote `attrs` e
  derrubou o servidor MCP. Scripts de teste com nomes que não colidem, sempre `python -I`.
- **18/11/2026 · Chave falsa em teste.** Repositório público: montar a chave falsa em tempo de execução
  (`"AKIA" + "X" * 16`), nunca literal, para não cair na proteção de push do GitHub.
- **19/11/2026 · Revisar o commit publicado, não a árvore.** A Karol trabalha nos mesmos arquivos enquanto reviso.
  Extraio o commit com `git archive <sha> Projetos/HELA | tar -x -C <scratch>` e rodo o Python com `-I` e essa cópia na
  frente do `sys.path`. O scratchpad tem uma pasta `hela` de outra sessão que sombreia o pacote: scripts sempre numa
  subpasta minha.
- **19/11/2026 · Teste de ataque afirma o comportamento seguro.** Teste vermelho = defeito reproduzido. Fica num
  arquivo à parte, no scratchpad, nunca em `tests/` da dona.
- **19/11/2026 · SQLite multiprocesso: o que olhar.** Migração com a versão lida antes da trava, `PRAGMA journal_mode =
  WAL` sem espera, leitura que grava evento (perde o WAL), `COMMIT` sem `ROLLBACK` no erro, `purge`/checkpoint com
  leitor aberto e manutenção que grava a partir de uma leitura velha. Reproduzo com `multiprocessing` `spawn` e barreira.
- **19/11/2026 · Hook = processo novo.** Cache em memória não ajuda no hook; meço sempre na parede, com processo novo.
- **19/11/2026 · Regex de redação: medir o tempo com `"a." * n`.** Quantificador sem limite antes de alternância vira
  ReDoS. Stdout de script longo fica no buffer: `flush=True` e `timeout` por caso.
- **19/11/2026 · Skills de revisão.** `security-review` abre no diff da árvore de trabalho e pede subtarefas: aplico o
  método à mão. `code-review` precisa de diff: código novo inteiro vai com `git diff --no-index base-vazia head`.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 15/11/2026 | (criação da agente; nenhuma tarefa ainda) | — | — | — | — |
| 17-18/11/2026 | Conferência de fatos dos 5 roteiros do TikTok de 18 a 22/11 (Sol, Última pessoa, Terra para, Pulo, Buraco) | aguardando retorno do Paulo | cerca de 2 sessões (o limite de uso interrompeu antes de gravar) | não medido | Gravar o relatório mais cedo (por roteiro, começando pelo que vai ao ar primeiro), para não perder trabalho se a sessão parar. |
| 18/11/2026 | HELA: preparar a Fase 7 (referência do Claude Code conferida e testada, modelo de ameaças, plano de testes, teste do `claude -p` com HOME isolado) | aguardando retorno | 1 sessão | cerca de US$ 0,34 em 3 chamadas de `claude -p` de teste | Conferir antes quantos arquivos a entrega pede e o nome de cada um. |
| 18-19/11/2026 | HELA: revisão de segurança e de código da Fase 2 (`docs/revisoes/2026-11-18-fase2.md`): 43 testes de ataque (39 defeitos), concorrência multiprocesso, desempenho com 10 mil memórias, veredito do `--trusted` | aguardando retorno | 2 sessões (o limite de uso interrompeu uma vez) | não medido | Escrever o relatório por partes, para não perder trabalho se o limite de uso cortar a sessão. |
