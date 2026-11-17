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
