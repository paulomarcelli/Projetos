# E Se, Hein? · passagem (para quem continuar o projeto)

Estado em 17/11/2026. Este documento junta tudo o que foi decidido para o canal e o que falta fazer. Leia antes de
mexer em qualquer coisa.

## 1. O canal

- **Nome:** E Se, Hein?
- **@ (o mesmo nas três redes, se estiver livre):** `esehein`. Alternativas, nesta ordem: `esehein.tv`, `oesehein`,
  `esehein_`, `eseheinoficial`.
- **Formato:** vídeos curtos verticais "E se…?" com ciência de verdade, animados em 3D, narrados pela **Maia** (voz de IA do
  ElevenLabs).
- **Redes:** TikTok (principal), YouTube Shorts e Instagram Reels. Suba o MP4 limpo em cada rede, sem marca-d'água de
  outra plataforma.
- **Ritmo:** 1 vídeo por dia, produzido em lote.

### Bios
- **TikTok** (80 caracteres): `E se o impossível acontecesse? 🌍 Ciência de verdade. Vídeo novo todo dia.`
- **Instagram** (150 caracteres):
  ```
  E se o impossível acontecesse? 🌍
  Hipóteses malucas, ciência de verdade.
  🎬 Um "e se?" novo todo dia
  👇 Comenta o próximo "e se"
  ```
- **YouTube:**
  ```
  E se a Lua sumisse? E se você fosse a última pessoa do mundo? E se a Terra parasse de girar?

  No E Se, Hein? a gente pega as perguntas mais malucas e responde com ciência de verdade, em vídeos curtos e animados em 3D.

  🎬 Um "e se?" novo todo dia.
  💬 Tem uma pergunta? Deixa nos comentários que ela pode virar o próximo vídeo.
  ```

### Marca
- **Logo:** o símbolo "E?", em que o braço de cima do E vira o gancho do ponto de interrogação. Desenho da Sofia,
  conceito A da rodada 2.
- **Cores:** laranja `#FF5A1F` e tinta `#111111`.
- **Arquivos prontos:**
  - `marca/redes/`: fotos de perfil (TikTok e Instagram em 1080, YouTube em 800), banner do YouTube (A, só o nome,
    recomendado; B, símbolo + nome) e marca-d'água dos vídeos.
  - `marca/svg/`: vetores.
- **Banner do YouTube:** o texto fica dentro de 1235 × 338 px no centro, a área de "todos os dispositivos". No editor do
  YouTube, a imagem inteira deve preencher o retângulo da TV, sem zoom.
- **Figma:**
  - Logo: https://www.figma.com/design/tQIfaeQgkOZhwh60i6Y5fH (seção "Definitiva · Conceito A").
  - Design System dos vídeos: https://www.figma.com/design/okTGRiK8lTEXSoP9QDm0du (Fundamentos, Componentes,
    Personagem, Fechamento, Storyboard · Lua).

## 2. A voz da Maia (ElevenLabs)

Criada em **Voices → Create a Voice → Voice Design** e salva com o nome **Maia**.

**Descrição da voz** (em português; a versão em inglês costuma dar sotaque mais estável):
```
Mulher jovem brasileira, de 25 a 30 anos, falando português do Brasil nativo, com sotaque neutro. Voz quente e levemente rouca, calma e confiante, com um toque de mistério, como alguém contando um segredo. Ritmo de narradora de documentário curto, com pequenas pausas antes de cada revelação. Natural e conversada, nunca robótica. Gravação limpa de estúdio, microfone próximo, sem ruído de fundo.
```
```
Young Brazilian woman, 25 to 30 years old, native Brazilian Portuguese with a neutral accent. Warm, slightly husky voice, calm and confident, with a hint of mystery, like someone telling a secret. Paced like a short documentary narrator, with small pauses before each reveal. Natural and conversational, never robotic. Clear, close-mic studio quality, no background noise.
```

**Ajustes no Text to Speech:**
- **Modelo:** Eleven v3, no modo **Natural** (o Creative exagera as emoções).
- **Estabilidade:** 45 a 50%.
- **Semelhança:** 75%.
- **Estilo:** 25%.
- **Velocidade:** 1.0.

**Ritmo medido:** cerca de 2,6 palavras por segundo. 157 palavras deram 60,2 s e 171 deram 65,1 s.

**Regras dos roteiros:**
- **Marcações de emoção entre colchetes, em inglês:** no máximo 3 por roteiro, só no começo de parágrafo, todas do
  mesmo registro (`[mysterious]`, `[calm]`, `[curious]`, `[whispers]`). Evite `[smiling]`, `[excited]` e `[happy]`:
  elas fazem o tom saltar de repente.
- **Fechamento:** sempre uma frase completa ("Me conta aqui nos comentários…"). Fechamentos curtos como "Comenta aí"
  soam robóticos.
- **Duração:** 165 a 180 palavras dão cerca de 1:03 a 1:09 de voz. Com o fechamento de 4 s, o vídeo passa de 1 minuto
  com folga, que é a regra do TikTok para pagar.
- **Fatos:** todo roteiro passa pela conferência (a Sabrina) **antes** de gerar a voz.

## 3. Roteiros

### Tema 2 · "E se a Lua desaparecesse?" (corrigido e gravado: `audio/lua-maia-v2.mp3`, 65,1 s)
```
[mysterious] E se, hoje à noite, a Lua simplesmente desaparecesse? Sem explosão. Sem barulho. Ela só... não estaria mais lá.

A primeira coisa que você ia notar é o escuro. Toda noite seria uma noite de lua nova. Longe das cidades, só as estrelas.

[calm] Depois, o mar. A Lua é a principal responsável pelas marés. Sem ela, as marés ficariam com menos da metade do tamanho.

E isso muda a vida na costa. Caranguejos e aves que vivem no ritmo da maré teriam o relógio bagunçado. E muitos corais, que usam a luz da lua para soltar óvulos e espermatozoides ao mesmo tempo, perderiam o sinal.

[mysterious] Mas o pior vem devagar. A Lua estabiliza a inclinação da Terra. Sem ela, ao longo de milhões de anos, o eixo do planeta poderia variar bem mais... e as estações mudariam muito.

Ou seja: a Lua não é só bonita. Ela ajuda a manter o nosso mundo estável.

[curious] E você? Ia sentir mais falta da lua cheia ou das marés? Me conta aqui nos comentários.
```

**Conferência de fatos** (Sabrina, 17/11/2026), com as fontes no relatório da conversa:
- **Marés:** a força do Sol é cerca de 46% da força da Lua. Sem a Lua, a maré média cai para **menos da metade**. O
  "um terço" só vale contra a maré de lua cheia e nova.
- **Inclinação com a Lua:** de 22,1° a 24,5°, num ciclo de cerca de 41 mil anos (NASA).
- **Inclinação sem a Lua:** variaria mais, mas não há consenso sobre quanto. Laskar (1993) dava de 0° a 85°;
  Lissauer (2012) e Li e Batygin (2014) dão bem menos. Por isso o roteiro não diz "extremas".
- **Corais:** soltam óvulos e espermatozoides guiados pela luz da Lua, entre outros sinais.
- **Rótulos na tela:** "SEM LUA: ~METADE", "COM LUA: 22° A 24,5°", "SEM LUA: BALANÇA MAIS" e "ESTABILIZA O EIXO".

### Tema 1 · "E se você fosse a última pessoa do mundo?" (rascunho, ainda sem conferência de fatos)
```
[mysterious] E se você fosse a última pessoa do mundo?

[calm] Você acorda. O celular não tem sinal. A rua está vazia. Nenhum carro, nenhuma voz... só o vento.

No primeiro dia, tudo parece normal. A luz ainda funciona, a internet ainda está no ar. Parece só um feriado muito estranho.

Mas em uma semana, as usinas param. Sem ninguém para cuidar delas, as cidades se apagam... uma por uma.

Em um mês, os cachorros e os gatos já mandam nas ruas. E os supermercados viram o seu único estoque de comida, até a comida começar a estragar.

[mysterious] Em um ano, o mato começa a rachar o asfalto. As janelas dos prédios quebram com o vento e a chuva.

E em dez anos... as cidades viram floresta. Como se a gente nunca tivesse existido.

[curious] E você? Qual seria a primeira coisa que você faria... se acordasse sozinho no mundo? Me conta aqui nos comentários, que eu quero saber.
```
Mande para a conferência de fatos antes de gravar. Para passar de 1 minuto, acrescente uns 20 a 30 palavras.

### Próximos temas sugeridos
1. E se você fosse a última pessoa do mundo?
2. ~~E se a Lua desaparecesse?~~ (em produção)
3. E se a Terra parasse de girar por 1 segundo?
4. E se a internet acabasse para sempre?
5. E se você caísse num buraco que atravessa a Terra?
6. E se o Sol se apagasse agora?
7. E se os humanos sumissem e os animais tomassem as cidades?

## 4. Estilo dos vídeos

Referência do Paulo: um explicativo do TikTok em 3D sobre como funciona uma grua (`docs/imagens/referencia-grua-folha.jpg`).
- **3D de brinquedo:** low-poly, cores fortes, céu com nuvens, cidade colorida.
- **Personagem "você":** um boneco de camiseta amarela.
- **Câmera contínua,** sem cortes.
- **Legenda de uma palavra por vez.**
- **Rótulos:** pílulas vermelhas e verdes, setas e textos presos aos objetos.

O Design System da Sofia (`docs/design-system.md`, `docs/tokens.json` e o Figma) define:
- os modos de cor Dia, Noite e Breu;
- a fonte Rubik 800/900;
- a legenda (112 px, encolhendo até 84, em y 1280, com largura máxima de 720);
- as zonas seguras do TikTok, do Reels e do Shorts;
- os rótulos, o boneco e o fechamento.

O storyboard do vídeo da Lua está em `docs/imagens/storyboard-lua.jpg`.

**Pedido do Paulo (17/11):** deixar o vídeo **mais realista**. Como não há Blender nem GPU na nuvem, o realismo é feito
no Three.js:
- céus HDRI do Poly Haven;
- texturas reais da NASA na Lua e na Terra;
- água com reflexo;
- texturas PBR na areia e na rocha;
- pós-processamento (bloom, oclusão, vinheta, tone mapping ACES).

O boneco, os rótulos e a legenda seguem o Design System. As licenças das texturas estão em `public/texturas/LICENCAS.md`.

As skills do Blender (`.claude/skills/`, de kevinbadi/blender-skills) só funcionam com o Blender aberto e o
complemento blender-mcp. Elas servem para realismo de filme num computador com Blender.

**Cenas no Blender, sempre (desde 18/11/2026).** Decisão do Paulo (18/11/2026): o canal continua só com "E se…?", com a conferência da Sabrina. A técnica da skill
`how-its-built-starter` (Morrow Studio) passa a ser usada **sempre** para as cenas 3D:
- **Cenas no Blender:** montadas por um `spec.json` (palco, câmera, peças que entram na palavra que as nomeia) e
  renderizadas no PC do Paulo, com o Blender 4.2 ou mais novo e a RTX 5050. Na nuvem não há Blender.
- **O que vale da skill:** a técnica (cena montada por dados, peças que chegam no tempo da fala, uma câmera, corte
  quando ajuda a explicar). O roteiro em cadeia "Se você… Mas… Então…" é de outro formato e não vale aqui.
- **O que continua igual:** a voz da Maia, a legenda de uma palavra por vez, os rótulos, o fechamento e o Design
  System do canal. A sugestão é pôr essas camadas por cima do vídeo do Blender no Remotion.
- **Começo:** o primeiro vídeo feito assim (a partir do de 19/11, "E se você fosse a última pessoa do mundo?") testa o
  caminho; o que der certo vira regra no README.
- **Realismo:** a skill sai com cor chapada (é um rascunho). Ele vem de ajustar o `scene.py` e das skills do Blender e
  do Poly Haven que já estão no repositório.

## 5. Como gerar um vídeo

Veja o `README.md` do projeto. Em resumo:
1. Escreva o roteiro e passe pela conferência de fatos.
2. Gere a voz da Maia no ElevenLabs e salve o MP3 em `audio/`.
3. Rode `scripts/preparar.mjs`, que:
   - normaliza a voz para -14 LUFS;
   - transcreve com o whisper.cpp local, de graça;
   - alinha a transcrição com o roteiro e gera `videos/<tema>.json`, com as palavras, os trechos e as cenas.
4. Crie ou reaproveite as cenas em `src/cenas/` (uma por trecho) e registre em `src/cenas/index.ts`.
5. Renderize com o Remotion, em 1080 × 1920 e 30 fps (veja o `README.md`).

## 6. Estratégia e monetização

- **TikTok:** Programa de Recompensas para Criadores. Exige 18 anos, mais ou menos 10 mil seguidores, 100 mil
  visualizações em 30 dias, e paga só vídeos originais de **mais de 1 minuto**.
- **YouTube Shorts:** Programa de Parcerias, com 1.000 inscritos e 10 milhões de visualizações em Shorts em 90 dias.
- **Instagram:** quase não paga por visualização no Brasil. Serve para audiência e publis.
- **Fase de crescimento:** a maioria dos vídeos curtos (25 a 40 s), com 2 ou 3 longos por semana. De cada roteiro longo,
  tirar também um corte curto. Depois de entrar no programa, inverter: a maioria longos.
- **O que medir:** a retenção (porcentagem assistida até o fim) antes das visualizações. Dê 90 dias de constância antes
  de julgar.
- **Cuidados:**
  - rotular o conteúdo como IA (exigência do TikTok);
  - não clonar voz de pessoa real;
  - só música da biblioteca da plataforma;
  - evitar conteúdo repetitivo, que corta a monetização.

## 7. Onde parou (17/11/2026)

- **Vídeo da Lua, versão 1:** renderizado, mas é só prévia, não vai ao ar. Tinha o roteiro antigo ("um terço") e cenas
  provisórias.
- **Vídeo da Lua, versão 2: renderizada no PC do Paulo (17/11/2026), esperando a aprovação dele.** Tem:
  - o Design System da Sofia;
  - o realismo ligado ao mundo 3D: relevo PBR no chão, areia e asfalto; água e areia molhada refletindo o céu HDRI;
    Lua e Terra com as fotos da NASA; brilho, tone mapping neutro e vinheta;
  - o áudio novo (`audio/lua-maia-v2.mp3`) e os rótulos corrigidos;
  - qualidade máxima com a GPU (RTX 5050, `REMOTION_GPU=1`, `--gl=angle`): oclusão de ambiente e MSAA 4× nas cenas
    na Terra; SMAA nas cenas no espaço (veja abaixo).

  **Render:** `out/lua-v2.mp4` no PC do Paulo (fora do git), em **69 s** para 2.075 quadros (~0,03 s por quadro; na
  nuvem levaria ~1 hora). Conferido: 1080 × 1920, 30 fps, 69,2 s, h264 + AAC estéreo 48 kHz; voz em **-13,98 LUFS**
  (pico -1,48 dBTP); legenda em sincronia (nas 22 pausas, o recomeço da fala no MP4 bate com o início da palavra da
  legenda, diferença máxima de 3 ms). Folha de contato (Q1 a Q8) e comparação lado a lado com o storyboard em
  `out/quadros-v2/` (fora do git).

  **Defeito achado e corrigido:** no primeiro render com GPU, cerca de 120 quadros das cenas no espaço (Q5 e Q6) saíram com o
  3D todo preto. A causa era o MSAA 4× do pós-processamento na GPU (ANGLE/Direct3D). Agora o espaço usa SMAA e sem
  oclusão, como na nuvem (`src/mundo/Mundo.tsx`, `Efeitos`). Depois da correção, a varredura do brilho quadro a
  quadro só acha as passagens de cena, sem quadro preto.

  **Para a Sofia olhar** (diferenças do vídeo para o storyboard, nenhuma quebra a história):
  - Q1: a cidade quase não aparece atrás do "você" (só a laje e o céu).
  - Q2: o "você" fica cortado na borda direita, olhando para cima.
  - Q3: sem o "você" pequeno na areia e sem a areia em diagonal; a régua e os rótulos estão lá.
  - Q4: caranguejos e corais aparecem um depois do outro no travelling, nunca juntos; a ave não aparece.
  - Q6: a pílula diz "ESTABILIZA O EIXO" (rótulo corrigido pela Sabrina) e sai antes de "estável".

  **Próximo:** o Paulo assiste, aprova e posta. O MP4 não vai para o git.
- **Vídeo do Sol ("E se o Sol se apagasse agora?", vai ao ar em 18/11/2026): renderizado e conferido no PC do Paulo
  (18/11/2026), pronto para postar.**
  - **Render:** `out/sol.mp4` (fora do git) em 38 s com a GPU (`REMOTION_GPU=1`, `--gl=angle`). Conferido: 1080 × 1920,
    30 fps, 33,6 s, voz em -13,98 LUFS, legenda em sincronia (9 pausas, até 13 ms) e nenhum quadro preto (brilho de
    todos os quadros medido; as 4 quedas são passagens de cena). Folhas em `out/quadros-sol-mp4/`.
  - **"Apaga" (ponto a):** não é só a passagem. O Sol fica aceso até "apaga" de propósito e some em 24 quadros com
    ease-in (token `mov/lua-some`), então ainda brilha ~0,5 s depois do 0:00 e da pílula "SEM LUZ". Ficou como está;
    apagar mais rápido é decisão da Sofia. Nota para a Sabrina: Lua cheia perto do Sol não acontece no céu de verdade.
  - **Pergunta final (ponto b):** o Sol aceso conta a história certa (os últimos oito minutos de luz, antes do
    apagão) e vira o círculo laranja do fechamento, como a Lua no outro vídeo. Fica como está.
  - Relatório: `agentes/relatorios/karol/2026-11-18-video-sol.md`.

  O que a nuvem deixou pronto (cenas, voz e legenda):
  - **Pronto:**
    - roteiro final conferido pela Sabrina (`videos/sol.roteiro.txt`);
    - voz da Maia (`audio/sol-maia.mp3`, 29,6 s, normalizada em -13,94 LUFS);
    - legenda alinhada (`videos/sol.json`, 89 de 90 palavras com tempo direto).
  - **Cenas da Karol:** 5 cenas (`sol-agora`, `sol-luz`, `sol-apaga`, `sol-frio`, `sol-pergunta`) com o Sol no céu,
    o cronômetro de 8:00 e o termômetro.
  - **Conferido:** testes (37) e lint passando; a Lua continua igual pixel a pixel; a folha de contato do Sol está em
    `out/quadros-sol/` (fora do git).
  - **Sem arte da Sofia** (capa e storyboard): as cenas seguiram o roteiro de cenas da Gabriela, no Design System do
    canal.
- **Estilo realista (v2): aprovado pelo Paulo em 18/11/2026.** É o padrão a partir do vídeo de 19/11.
  - **Por quê:** referência de outro canal de "What if"; a análise está em `docs/estilo-realismo.md`.
  - **Visual da Sofia:** Figma `okTGRiK8lTEXSoP9QDm0du`, página "Realismo documental (v2)"; seção "v2 · Realismo
    documental" em `docs/design-system.md` (com "O que a Karol precisa para o código"), tokens em `docs/tokens.css` e
    `docs/tokens.json`; relatório e prints em `agentes/relatorios/sofia/2026-11-18-realismo-documental.md`.
  - **Resumo do visual:**
    - lugar real do Brasil visto de drone (120–250 m, inclinado 35°–55°, lente 24–35 mm, um movimento lento por
      plano, antes e depois no mesmo enquadramento);
    - contador no canto (número grande e o lugar em outra linha);
    - "fato" com desenho próprio;
    - título em Newsreader;
    - legenda de frase inteira em itálico;
    - números em IBM Plex Sans;
    - cor nos modos Dia, Noite e Frio;
    - o "você" vira um ponto amarelo (#FFD21F) visto do alto.
    - Saem as pílulas, setas, ícones e o boneco de perto. Ficam o E?, o fechamento laranja e as zonas seguras.
  - **Como se produz:**
    - **3D no Blender,** montado por código com a técnica da skill `how-its-built-starter` e as skills do Blender e do
      Poly Haven, renderizado no PC do Paulo (RTX 5050);
    - **as camadas 2D** (véu, contador, fato, título, legenda e fechamento) no Remotion, por cima do vídeo do Blender;
    - **rodada obrigatória de conferência dos quadros** antes do render final (regra no arquivo da Karol).
  - **Processo novo:** a Gabriela confere se o tema já tem vídeo grande no TikTok e no YouTube; a Sabrina confere
    também o dado do canto.
- **Vídeo de 19/11, "E se você fosse a última pessoa do mundo?": renderizado no PC do Paulo em 21/11/2026, o primeiro
  no estilo realista. Esperando o Paulo assistir e postar.**
  - **MP4:** `out/ultima-pessoa.mp4` (fora do git; cópia em Downloads). Conferido: 1080 × 1920, 30 fps, 69,67 s,
    voz em -14,01 LUFS, legenda em sincronia (20 pausas, até 2 ms) e nenhum quadro preto (as 9 quedas de brilho são
    cortes e viradas). Folha final em `out/final/folha-final.jpg`.
  - **Como foi feito** (passo a passo no README, seção "Vídeo no estilo realista"):
    - 3D no Blender 5.3 por código, sem janela (`blender/`): 7 planos no `blender/ultima-pessoa.spec.json`, com os
      eventos presos a palavras da fala;
    - camadas 2D da v2 no Remotion (`src/v2/`), lendo os quadros do Blender (o MP4 dos planos deu erro no Remotion);
    - rodada de conferência dos quadros com o 2D por cima, antes e depois, e a folha aprovada pelo Paulo;
    - acabamento 3D e personagem da Sofia em 21/11, com as skills de Blender dela (relatório
      `agentes/relatorios/sofia/2026-11-21-ultima-pessoa-blender.md`);
    - render em duas filas de Blender em paralelo (GPU a 96%): 84 min para 1.999 quadros; Remotion em 131 s.
  - **Graphify:** CLI instalado (pacote `graphifyy`); `graphify update .` monta o grafo de código sem crédito, em
    `graphify-out/` (fora do git).
  - **Para os próximos vídeos v2:** o "você" do alto é a pessoa em escala 6× (ponto amarelo do Design System); a
    câmera do drone usa ~18° de inclinação, como no Figma, e não os 35° a 55° do texto. Relatório da Karol:
    `agentes/relatorios/karol/2026-11-19-ultima-pessoa-realista.md`.
  - **Roteiro:** aprovado pela Sabrina em 17/11; a fala não muda. Está na página do vídeo no Notion (Calendário de
    conteúdo) e na seção 3 desta passagem.
  - **Voz da Maia gravada (19/11):**
    - `audio/ultima-pessoa-maia.mp3`, 65,6 s, normalizada para -13,95 LUFS em `public/audio/ultima-pessoa.wav` (fora do
      git: gere de novo com `node scripts/normalizar.mjs audio/ultima-pessoa-maia.mp3 public/audio/ultima-pessoa.wav`);
    - roteiro em `videos/ultima-pessoa.roteiro.txt`;
    - legenda alinhada em `videos/ultima-pessoa.json` (9 trechos, 172 de 178 palavras com tempo direto). A fala bate
      com o roteiro aprovado.
    - Com o fechamento, o vídeo fica com ~69,6 s, mais de 1 minuto.
    - Na legenda de frase inteira (v2), escrever o ano como "1986".
  - **Tema já postado:** há vídeos grandes do tema (até 25 milhões em português). O Paulo decidiu manter, com a Avenida
    Paulista real e o contador como diferencial.
  - **Lugar, dados do canto e lista de cena:** a lista diz o que aparece e some em cada palavra da fala. Está em
    `agentes/relatorios/gabriela/2026-11-18-ultima-pessoa-realista.md`, seção "Depois da conferência", e na página
    do Notion.
  - **Dados conferidos pela Sabrina em 18/11** (`agentes/relatorios/sabrina/2026-11-18-dados-ultima-pessoa.md`):
    - POPULAÇÃO DO MUNDO · 8,3 BILHÕES → 1, com "Avenida Paulista, São Paulo" em outra linha;
    - SOZINHO · PRIMEIRAS HORAS;
    - usinas sem "São Paulo", numa cena de várias cidades sem nome apagando à noite;
    - metrô num corte genérico, sem nome de estação;
    - geladeira ~4 horas (FDA);
    - Pripyat com 49 mil moradores, esvaziada em 27/04/1986 e sem moradores há 40 anos;
    - sem floresta tomando a avenida.
- **Pendente:**
  - o Paulo assistir e postar o vídeo de 19/11 (legenda e hashtags na página do Notion);
  - pendências visuais da Sofia para o próximo v2: copas de Pripyat de perto, água do metrô, janelas quebradas vistas
    do alto;
  - os temas de 20 a 22/11 (Terra para, Pulo, Buraco): roteiros aprovados, mas ainda sem a busca de tema já postado,
    sem lugar real e sem dado do canto;
  - o corte curto (35 s) de cada vídeo;
  - checar se o @ `esehein` está livre nas três redes.
