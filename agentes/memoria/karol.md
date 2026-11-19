# Memória da Karol

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

### Pedido do Paulo
- **Sempre a superpowers (2026-11-15).** O Paulo deu a skill `superpowers` para a Karol: toda tarefa começa por ela
  (ver a regra número 1 do `.claude/agents/karol.md`), e o relatório diz quais partes foram usadas.

### Do que era arquitetura
- **Padrão do repositório.** Vite sem framework, `base: './'` (o Pages publica em subpasta), dependências com versão
  travada.
- **14/11/2026 · Escritório do Paulo.** Servidor Node sem dependências, dados em arquivos JSON, eventos por SSE e
  execução dos agentes pelo `claude -p --agent`. Foi a escolha por rodar com um comando e sem instalar nada.
- **Workflow do Pages.** Já aconteceu de uma pasta que o site carrega ficar fora da lista de cópia (a `fases/` da
  Aurora). Confira a lista a cada pasta nova.

### Do que era front-end
- **14/11/2026 · Furo e camadas (modelo Lusco).** Contêiner que guarda o furo não pode ter `z-index`: a sombra do furo
  cobre o texto que vem antes. Deixou dois títulos invisíveis no fã-site da Sofia Carson.
- **14/11/2026 · Entradas por marco.** Para conferir com captura, role em passos (≈ 40 px) e espere ~2,5 s; pular com
  `scrollTo` engana o `IntersectionObserver`.
- **Responsivo.** Teste 320, 375, 390, 768, 1024, 1280, 1920 e 2560 px e o celular deitado.
- **Sem Design System, sem tela.** Interface nova só começa com o `design-system.md` da Sofia.

### Do que era back-end e dados
- **14/11/2026 · Gravação segura.** No Escritório, cada arquivo de dados é gravado em um temporário e renomeado, para
  não corromper se o processo cair no meio.
- **Servidores do repositório.** A Luna usa Flask e roda fora do Pages (o Pages só serve arquivo estático); o endereço
  do servidor chega por variável.
- **Segredos.** Só em variável de ambiente. Nunca em arquivo versionado.

### Do que era vídeo (Remotion)
- **17/11/2026 · E Se, Hein?** Remotion 4 + `@remotion/three`. Sem GPU, transcrição com `@remotion/install-whisper-cpp`
  (CPU, modelo `small`, ~40 s para 60 s de áudio); o `whisper-webgpu` da skill exige GPU. Downloads do Node atrás do
  proxy precisam de `NODE_USE_ENV_PROXY=1` (whisper e o navegador do Remotion).
- **Whisper estica palavras por cima das pausas.** Corrigir com o `silencedetect` do ffmpeg: o recomeço da fala é
  confiável. Cuidado com três casos (palavra dentro da pausa perto do início, perto do fim, e palavra que mal começou
  quando a pausa começa). Conferir comparando o início das palavras com o fim das pausas, não só olhando.
- **Enquadramento com legenda fixa.** Legenda a 68 % da altura cobre o rosto se a câmera olhar muito para cima;
  câmera na altura do personagem, quase reta, deixa a cabeça acima da legenda.
- **Rótulos 2D presos ao 3D:** projetar com uma `PerspectiveCamera` igual à do mundo, calculada pela mesma função
  pura do quadro. Sem drei.
- **Folha de contato** (`scripts/quadros.sh`) acha defeito de enquadramento rápido; um quadro leva ~3 s.
- **17/11/2026 · Quadro vazio no @remotion/three.** Duas causas: (1) cena que depende de algo assíncrono (texturas)
  tem que esperar fora do `ThreeCanvas` e só criar o canvas com tudo pronto; (2) `EffectComposer` monta depois do
  primeiro desenho, então é preciso redesenhar com `advance()` num `useEffect` e segurar com `delayRender`. Para
  depurar, pôr um texto na tela (`COM TEX`) é mais rápido que procurar o `console.log`, que o `still` não mostra.
- **17/11/2026 · Custo sem GPU.** Por quadro, em 1080 × 1920: cena ~1,2 s, N8AO +1,8 s, MSAA 4× +1,1 s. Usar SMAA e
  deixar a oclusão desligada na nuvem. `--concurrency` maior que 1 não ajuda (o WebGL por software já usa os 4 núcleos).
- **17/11/2026 · Tone mapping.** O ACES lava as cores dos tokens (céu azul vira cinza); o `NEUTRAL` mantém o Design
  System.
- **17/11/2026 · Render com GPU (PC do Paulo, RTX 5050).** `--gl=angle` + `REMOTION_GPU=1`: 69 s para 2.075 quadros
  (~50× mais rápido que a nuvem). Confirmar a GPU com `nvidia-smi` durante o render (`chrome-headless-shell.exe` na
  lista); o `npx remotion gpu` falha (o headless não abre `chrome://gpu`). O aviso `X3595` no log é do compilador do
  Direct3D, sinal de que o ANGLE está na placa.
- **17/11/2026 · MSAA no espaço apaga o quadro.** Com `multisampling={4}` no EffectComposer, na GPU, parte dos quadros
  do espaço saía com o 3D todo preto (o quadro solto também, então não é corrida entre abas). Testar desligando um
  efeito por vez num `still` do quadro ruim; a primeira hipótese (N8AO com intensidade 0) estava errada. Solução:
  qualidade máxima só com `espaco <= 0.5`.
- **Folha de contato não basta.** Ela só mostra os quadros escolhidos. Depois de cada render, medir o brilho de todos
  os quadros (`signalstats` YAVG) e procurar quedas bruscas; as que sobram têm que ser passagens de cena, conferidas
  na imagem.
- **Ambiente do PC do Paulo.** O Node 22 e o ffmpeg vieram pelo `winget` (`OpenJS.NodeJS.22`, `Gyan.FFmpeg`). O app
  do Claude só vê o PATH novo depois de reiniciar; até lá, pôr `C:\Program Files\nodejs` e a pasta `bin` do ffmpeg
  (em `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*`) no PATH do comando. No filtro do ffmpeg, um caminho
  com `C:` quebra a sintaxe: grave em caminho relativo.

- **18/11/2026 · HELA (Python + SQLite).** FTS5 com conteúdo externo precisa de rowid estável: `rid INTEGER PRIMARY
  KEY` + `id TEXT UNIQUE`. Apagar do FTS5 só grava uma marca; o termo some do disco com `optimize`, e o `-wal` só com
  `wal_checkpoint(TRUNCATE)` (`secure_delete` sozinho não basta: medido com sentinela nos bytes). Migração atômica:
  conexão em autocommit e o script inteiro entre `BEGIN IMMEDIATE` e `COMMIT`.
- **Mensagem do pydantic vaza a entrada.** `str(ValidationError)` traz `input_value=...`; para erro ao usuário, montar
  a mensagem só com `loc` e `msg`.
- **`pip install -e` cedo demais.** Instalar o pacote editável antes de existirem os `__init__.py` grava tudo como
  namespace, e o comando instalado quebra ("unknown location"). Reinstalar depois de criar os pacotes.
- **Scratchpad compartilhado.** Outras sessões deixam pastas lá (havia uma `hela/`), e o Python põe a pasta do script
  no `sys.path`: rodar script de medição numa subpasta própria, com `python -I`.
- **Repositório compartilhado em paralelo.** Com outras agentes escrevendo no mesmo projeto, `git add` só nos meus
  caminhos (nunca a pasta inteira), e conferir `git status` antes de cada commit.
- **19/11/2026 · HELA Fase 3.** Regex com `re.IGNORECASE` contamina padrões que dependem de maiúsculas (`\bE[A-Z]{3,}\b`
  para errno casava "esperar"): usar `(?-i:...)` no trecho. Achei pelo sintoma "frase repetida não sai"; olhar a
  classificação do segmento antes de mexer no deduplicador.
- **Limiar medido, não chutado.** Para "experiência insuficiente", medir a distribuição (relacionadas, sem relação e
  **iscas com uma palavra em comum**) antes de escolher: 0,30 deixava passar 6 de 10 iscas; 0,35, nenhuma. Resultado
  perfeito num conjunto escrito por mim é sinal para testar paráfrases difíceis (deram 2 de 10).
- **Exemplos de documentação saem de execução real.** Rodar as operações num banco temporário e copiar a saída achou
  dois defeitos (plural errado e "site" puxando WebFetch).
- **Tempo da suíte oscila com cache frio** (22 s numa rodada, 4 s nas seguintes): repetir antes de caçar lentidão.
- **19/11/2026 · Revisão da Fase 2 (A-1 a A-7).** Regex com `[\w.\-]*?` antes de uma alternância é quadrática:
  procurar primeiro a palavra sensível. Conferir o tamanho **antes** de redigir. `PRAGMA journal_mode = WAL` não
  respeita o `busy_timeout`: ler o modo antes e tentar de novo. Migração concorrente: reler a versão e tolerar "já
  aplicada". `COMMIT` vai dentro do `try`. Invisíveis saem do texto **gravado**, não só da cópia do detector.
- **Script de edição com `assert` no fim pode gravar só metade.** Duas vezes o `assert` final barrou a gravação de um
  arquivo depois de outro já gravado. Conferir com `grep` depois, ou checar tudo antes de escrever.
- **Regra nova de redação quebra ids.** O hex solto pegou o uuid das memórias no export: rodar a suíte inteira, não só
  os testes do módulo, e excluir os formatos internos (uuid hex 32, commit 40).

### Do que era IA
- **14/11/2026 · Agentes do Claude Code.** O arquivo fica em `.claude/agents/<nome>.md`; a `description` decide quando
  ele é chamado; um agente novo só carrega em sessão nova. Use a skill `criar-agente`.
- **14/11/2026 · Eventos de execução.** `claude -p --agent <nome> --output-format stream-json --verbose` devolve cada
  ferramenta usada, o resultado, o tempo e o custo; os ganchos (`SubagentStart`, `PreToolUse`…) trazem `agent_type`.
- **Modelos e preços mudam.** Consulte a skill `claude-api` em vez de responder de memória.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 15/11/2026 | (criação da agente; nenhuma tarefa ainda) | — | — | — | — |
| 17/11/2026 | Base do projeto de vídeo E Se, Hein? + vídeo da Lua | a avaliar | ~3 h | sem crédito pago | Estilo mudou no meio (referência da grua): fazer o mundo contínuo desde o início quando houver referência de câmera |
| 17/11/2026 | Vídeo da Lua v2: realismo ligado ao mundo, enquadramentos pelo storyboard, render final (continuação, outra sessão) | a avaliar | ~1 h + 1 h de render | sem crédito pago | Conferir a folha de contato contra o storyboard antes de cada render longo |
| 17/11/2026 | Render final da Lua v2 no PC do Paulo com GPU: Node e ffmpeg instalados (com aprovação), teste de 60 quadros, render, conferência e folha Q1–Q8 contra o storyboard | a avaliar | ~40 min (2 renders de 70 s) | sem crédito pago | O caminho com GPU nunca tinha rodado: renderizar e varrer o brilho de todos os quadros já no teste, não só 60 quadros do começo (o defeito estava no espaço, aos 42 s) |
| 18/11/2026 | HELA Fase 2 (Cognitive Core): pacote, SQLite WAL com esquema completo, segurança, Memory Engine com busca híbrida, grafo, consolidação, export/import, Engine e CLI; reforços do seguranca.md | a avaliar | ~5 h (com uma pausa pelo limite de uso) | sem crédito pago | Commitei a pasta inteira e levei arquivos da Sabrina pela metade: só os meus caminhos daqui em diante. Testes de segurança: escrever e ver falhar antes, ou fazer mutação logo |
| 18–19/11/2026 | HELA Fase 3 (Intelligence): classificador (regras + Naive Bayes só com rótulos humanos), ranker (Wilson + custos), feedback, evolução (replay Brier, snapshot, rollback), router (9 passos, limiar medido), otimizador, execution intelligence, 8 operações do Engine, `docs/api.md` | a avaliar | ~6 h em duas sessões (pausa pelo limite de uso) | sem crédito pago | O conjunto-ouro foi escrito por mim: na Fase 7, medir com consultas reais. Mutação logo depois de cada teste de proteção funcionou bem (classificador e aprovação) |
| 19/11/2026 | HELA: correção dos achados altos A-1 a A-7 da revisão da Fase 2 (migrações concorrentes, COMMIT, busca só leitura, ReDoS, lacunas da redação, injeção invisível, import e campos de confiança) | a avaliar | ~1,5 h | sem crédito pago | Os médios ficaram para depois (15 testes de ataque ainda vermelhos) |
