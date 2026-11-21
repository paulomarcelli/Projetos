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
- **18/11/2026 · Render com GPU virou rotina.** Vídeo de ~34 s: teste de 60 quadros em 10 s e render completo em
  38 s. Com isso, conferir tudo de uma vez depois do render: ffprobe, loudnorm, silencedetect contra a legenda,
  brilho de todos os quadros e tiras de quadros dos trechos duvidosos.
- **Analisar antes de "corrigir".** Uma dúvida de cena ("o Sol aparece aceso") pede tira de quadros em volta da
  palavra e leitura do código da cena (curva e duração). Se o efeito segue um token do Design System, a mudança é da
  Sofia, não da Karol.

### Do que era vídeo realista (Blender + Remotion, v2)
- **19/11/2026 · Blender sem janela, por código.** `blender -b --factory-startup -P blender/render.py -- <video>
  <plano>`. Cycles com OptiX na RTX 5050: 2 a 3,5 s por quadro em 1080 × 1920 com 24 amostras; o Blender MCP não
  precisa estar aberto. No Blender 5 as ações são em camadas (`layers → strips → channelbags → fcurves`), o EEVEE se
  chama `BLENDER_EEVEE` e o céu físico é `MULTIPLE_SCATTERING`: leia os enums em vez de chutar.
- **Mesma conta de quadros no Blender e no Remotion:** `round(fim·30) − round(início·30)` por plano. Um quadro a menos
  vira quadro preto no corte.
- **Conferência com o 2D por cima, sempre.** O 3D sozinho escondeu três defeitos (legenda em 3 linhas, texto sobre o
  personagem, bomba na faixa da interface). `scripts/conferencia-v2.mjs` faz isso em minutos.
- **Duas filas de render.** Com um processo, a GPU fica ociosa entre quadros (cena e gravação); dois processos em
  planos diferentes a mantêm em ~96% sem estourar os 8 GB. Mais de dois não ajuda.
- **Remotion e vídeo de entrada:** `OffthreadVideo` falhou com "No frame found at position" em MP4 feito de JPEG, mesmo
  sem quadro B e em `yuv420p`. Ler os JPEG direto (um `<Img>` por quadro) é mais firme e evita a segunda compressão.
- **Comando longo vai para segundo plano.** O render do Remotion passou de 10 min e o comando em primeiro plano foi
  morto; rode em segundo plano com o log num arquivo.
- **Graphify:** `graphify update .` monta o grafo de código sem LLM e sem crédito (pacote `graphifyy`); serve para
  provar dependência ou independência entre partes (`graphify path "A" "B"`).
- **Skills da Sofia para Blender** (`blender-director` e especializadas): ela sobe o acabamento sem mudar câmera nem
  tempo quando o pedido deixa isso escrito. Diga o que não pode mudar e o teto de tempo por quadro.

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
| 18/11/2026 | Render final do vídeo do Sol no PC do Paulo com GPU, conferência do MP4 e análise do "apaga" e do fechamento | a avaliar | ~25 min (render de 38 s) | sem crédito pago | Nenhum defeito; deixar pronto um script único de conferência (formato, LUFS, sincronia, brilho, folha) em vez de montar os comandos a cada vídeo |
| 19 a 21/11/2026 | Primeiro vídeo no estilo realista ("Última pessoa"): 7 planos no Blender por código, camadas 2D da v2, conferência com antes e depois, acabamento da Sofia, graphify, render com GPU em duas filas | com ajustes (o Paulo pediu Sofia e personagem depois da folha) | ~2 dias de sessão (render de 84 min) | sem crédito pago | Chamar a Sofia para o acabamento 3D antes da primeira folha, não depois; testar o vídeo do Blender dentro do Remotion num trecho curto antes do render longo |
