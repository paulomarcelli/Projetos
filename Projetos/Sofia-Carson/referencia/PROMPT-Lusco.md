# Lusco: landing page de produtora audiovisual com o filme do set preso atrás da página e furos que o revelam

## Antes de começar: pergunte

Antes de escrever qualquer código, faça estas perguntas, uma por vez e em linguagem simples (a pessoa pode não ser programadora):

1. **O que você quer fazer com este site?**
   - **Montar a demo como ela é**, para ver funcionando e trocar depois.
   - **Fazer o site da minha produtora ou da minha marca** com esta estrutura e estas animações.
   - **Usar só algumas peças** (a intro, o fundo preso atrás com os furos na página, o rodapé com as letras vazadas) num site que já tenho.
2. Se for a produtora dela: o nome, o que filma (comerciais, clipes, eventos, institucional...), há quanto tempo e quantos filmes já entregou, os filmes que quer mostrar (cliente, tipo, ano), como trabalha (etapas e prazos), contato, e **que material já tem** (reel em vídeo, quadros dos filmes, logo, cores). Avise desde já que o filme do fundo mostra o set da demo: para ser o dela, entra um trecho do reel dela (16:9, escuro, sem texto queimado) ou clipes novos gerados pelas receitas (`arquivos/receitas/LEIA.md`).
3. Se forem peças: quais, e onde está o site que vai recebê-las.

Depois, em qualquer caminho, **monte primeiro a demo completa como descrita abaixo** e confira que ela roda: é o caminho testado e fica de referência. Só então aplique a marca ou extraia as peças, seguindo a seção "Personalizar" do guia. Termine com uma lista curta do que ainda é da demo e do que falta a pessoa mandar.

## A demo

Construa a landing page da **Lusco**, uma produtora audiovisual. Leia antes o guia do projeto desta pasta (`CLAUDE.md`, ou `AGENTS.md` no Codex e outros agentes: design system, regras e como personalizar) e olhe as imagens em `arquivos/conceito/`: são prints da demo pronta, o alvo de cada trecho (01 e 02 a intro, 03 a 09 o desktop na ordem da página, 10 a 13 o celular). O filme do fundo já vem montado em `arquivos/video/`, as imagens em `arquivos/img/` e os módulos de motion prontos em `arquivos/motion/`; use-os como estão.

---

## Parte 1 — O site

### Marca e tom
- Lusco (de "lusco-fusco", a meia-luz): produtora de **comerciais, filmes de marca e clipes**, desde 2012, **318 filmes entregues**, equipe própria, **quatro diretores**, estúdio de **600 m² com fundo infinito**, montagem, cor e som na casa.
- Tom seco, de set: fatos curtos. Nada de "criativo", "experiência", "transformamos ideias", "paixão". Nenhuma cidade ou estado na copy.
- **Preto e branco.** O filme é a única imagem forte. Fora dele: folha cor de osso `#ebe8e2`, tinta `#0a0a0a`, rótulos `#6b6863`, texto sobre o filme `#f4f4f2`, fundo `#0a0a0a`. Sem cor de acento: a cor só aparece nos dois quadros dos filmes.
- Fontes: **Geist** variável (marca 800, títulos 750, manifesto 330, texto 400–450) e **Geist Mono** variável nos rótulos (caixa alta, 11 px, peso 450, tracking 0,16em).
- **A marca**: "LUSC" em Geist 800, tracking −0,035em, seguido do **O de meia-luz**: um círculo da altura da caixa alta (0,71em), com aro de 0,135em e a metade esquerda cheia (`border` + `background: linear-gradient(90deg, currentColor 50%, transparent 50%)`, `border-radius: 50%`). Na nav, menor, 650 e tracking 0,16em.
- Botões em **pílula** (40 px de altura, 18 px de padding, 14 px, `border-radius: 999px`, fio de 1 px): uma de contorno e uma cheia.

### A peça principal: o filme preso atrás da página
- `arquivos/video/montagem.mp4` (13 s, preto e branco, mudo, cinco clipes do set com corte seco: o cinegrafista andando agachado com a câmera na mão contra a luz, as mãos no anel de foco, um olho que pisca, o diretor no monitor, o operador de boom) fica em `position: fixed; inset: 0; z-index: 0` atrás de **tudo**, tocando em loop. Pôster `montagem.jpg`.
- Sobre o vídeo: `object-fit: cover; object-position: 62% 50%`, `inset: -1%` (sobra para a trepidação), `filter: grayscale(1) contrast(1.14) brightness(.9)` e uma **trepidação de projetor** (keyframes em `steps(1)` de 0,9 s, deslocando 0,3–0,6 px). Por cima, uma vinheta (`radial-gradient(120% 95% at 55% 45%, transparent 45%, rgba(0,0,0,.55))` + escurecido de 28% no topo e 40% no pé) e **grão**: `arquivos/img/grao.png` repetido a 192 px, `opacity .16`, `mix-blend-mode: overlay`, num elemento com `inset: -50%` que salta de posição a cada ~0,08 s (`animation: 0.5s steps(1) infinite`, seis posições).
- O **hero é transparente**. Depois dele, a página vira **uma folha cor de osso com furos**: cada seção é transparente e tem **um** furo, um bloco transparente com `box-shadow: 0 0 0 300vmax var(--osso)`; a seção tem `overflow: hidden; isolation: isolate`, então a sombra pinta o resto dela de osso e o filme só aparece pelo furo, parado em relação à tela enquanto a folha sobe. O furo fica na camada 0 e todo texto e foto na camada 1 (`position: relative; z-index: 1`); nenhuma caixa entre eles cria outra camada, e **o furo nunca tem fade de entrada** (apagaria a folha junto).

### Intro (pronta em `arquivos/motion/carga.js`)
1. Tela `#0a0a0a`. No centro, dois rótulos mono lado a lado: "[ Lusco Filmes ]" e "[ N por cento ]". A porcentagem anda sozinha até 90 e só passa quando o vídeo do fundo pode tocar até o fim (mínimo 0,9 s).
2. Em 100, os rótulos se afastam até as bordas (a largura do conjunto vai de 20em a `100vw − 2 × margem` em 0,9 s) e **uma coluna de quadros sobe pelo meio** em 1,7 s: 11 miniaturas 16:9 (`arquivos/img/intro/`: quadros dos clipes e as duas fotos dos filmes), `min(28vw, 50svh)` de largura (62vw no celular), com respiro de 8–14 px, e por último o pôster da montagem **na proporção da tela**. A coluna para com esse último quadro no centro.
3. O último quadro se solta e **cresce até cobrir a tela, só com `transform`** (o elemento já tem o tamanho da tela e começa encolhido sobre a miniatura; nada de animar largura e posição, que trava), 1,1 s, sobre o preto. O LUSCO do hero começa a subir aos 0,8 s.
4. Coberta a tela, o preto sai, o vídeo começa por baixo (no mesmo 1º quadro) e o quadro some em 0,35 s.
- Rolar, tocar, clicar ou apertar uma tecla durante a intro pula para o fim. A rolagem fica parada até ela acabar. Com movimento reduzido, não roda.

### Nav
Fixa, em três colunas: à esquerda os links "Filmes", "Estúdio", "Contato" (14 px); no centro a marca pequena (17 px), que **só aparece depois do hero**; à direita a pílula de contorno "▶ Ver o reel" (abre o reel) e a cheia "Pedir orçamento →" (`#contato`). Clara sobre o filme. Quando a folha passa por baixo, a nav ganha **fundo cor de osso** e tinta (o texto da folha nunca passa por baixo dos links); nas aberturas de tela inteira volta a ser clara. Escondida até a intro acabar. No celular: só os links (13 px) e a pílula cheia, sem a seta.

### Hero (`#topo`, 100svh)
Só o filme e o nome: **LUSCO grande, centrado** na tela (`clamp(84px, 13.2vw, 260px)`), em `#f4f4f2`, passando por cima da câmera e do braço do cinegrafista. As letras sobem uma a uma por uma máscara depois da intro (1,3 s, 0,07 s entre letras). Nos cantos de baixo, alinhados à margem: à esquerda "PRODUTORA AUDIOVISUAL" (mono) e "Comerciais, filmes de marca e clipes"; à direita "DESDE 2012" e "318 filmes entregues". No celular, o canto direito sai e entra um "▶ VER O REEL" mono logo abaixo do nome.

### Seções (na folha)
1. **Estúdio** (`#estudio`): manifesto centrado, `clamp(26px, 2.2vw + 10px, 50px)`, peso 330, entrelinha 1,14, largura igual à da janela: "Filmamos do roteiro à cor final, com equipe própria e um estúdio de 600 m² com fundo infinito." Embaixo, **a janela**: um furo retangular 2,39:1 (cinemascope), `min(980px, 66vw)` de largura, com uma nota de cada lado, centrada na altura dela: à esquerda (alinhada à direita) "DIREÇÃO" / "Quatro diretores na casa"; à direita "FINALIZAÇÃO" / "Montagem, cor e som no mesmo lugar". No celular, a janela em 16:10 na largura toda e as notas lado a lado embaixo.
2. **Filmes recentes** (`#filmes`): o título "Filmes / recentes" (`clamp(44px, 3.4vw + 14px, 78px)`, 750, entrelinha 0,9, tracking −0,045em) e, à direita, na base dele, a pílula de contorno "Ver todos os filmes →" (abre o reel). Embaixo, **três blocos 4:5**: à esquerda `filme-carro.webp` com "Vértice Automóveis" / "COMERCIAL · 2026"; **no meio um furo** com um véu `rgba(10,10,10,.26)` e a frase "Cada filme começa com uma conversa" em `#f4f4f2`, 650, `clamp(24px, 1.2vw + 12px, 34px)`, centrada; à direita `filme-clipe.webp` com "Nina Calé, Maré Alta" / "CLIPE · 2026". **Os dois quadros têm película, com cor**: `filter: contrast(1.08) saturate(.86) brightness(.97) sepia(.06)`, pretos lavados por uma camada `rgb(30,24,20)` com `mix-blend-mode: lighten`, vinheta radial (45% nas bordas) e o mesmo grão animado (160 px, `opacity .24`, overlay). No celular, uma coluna com o furo primeiro (4:3).
3. **Como trabalhamos** (`#processo`): **sem folha**, a seção é transparente e tem 118svh: o filme volta de ponta a ponta, com um degradê escuro no pé (`transparent 35%` → `rgba(0,0,0,.55)`). No pé, em luz: o título "Do roteiro à cor final em seis semanas." (mesmo tamanho dos títulos) e três etapas em colunas: "SEMANAS 1 E 2" / "Roteiro, elenco, locação e plano de filmagem, aprovados com você."; "SEMANA 3" / "Filmagem em uma a três diárias, com equipe e câmeras próprias."; "SEMANAS 4 A 6" / "Montagem, cor, trilha e mixagem no nosso estúdio." O texto que chega à altura da nav some por marco (classe `.is-sob`, opacidade 0 em 0,3 s; o `nav.js` cuida). No celular, as etapas empilham.
4. **Contato e rodapé** (`#contato`): em cima, em folha lisa, "Tem um filme / para fazer?" à esquerda e, à direita, "contato@lusco.film", "(11) 4002-3180" e a pílula cheia escura "Pedir orçamento →" (mailto com assunto). Embaixo, **o nome da largura da tela com as letras furadas**: um SVG (`viewBox="-30 -18 984 236"`) com um retângulo cor de osso e uma `<mask>`: "LUSC" em Geist 800, 270 unidades, `textLength="720"`, base em y = 194, e o O como círculo (centro 829, 100; raio 94) com a metade direita interna (raio 48) devolvida à folha. As letras mostram o filme. Por fim, a linha do rodapé em mono cinza: "© 2026 LUSCO FILMES" e "INSTAGRAM VIMEO LINKEDIN".

Nas seções, título, textos e fotos entram por marco: fade e subida de 26 px (0,9–1,1 s, `cubic-bezier(.16, 1, .3, 1)`), com atraso de 0,08–0,2 s entre vizinhos.

### Reel
Um `<dialog>` em tela cheia, fundo preto, com a montagem em `object-fit: contain` (em preto e branco) tocando em loop e a pílula "Fechar ×" no canto, com fundo escuro translúcido e desfoque para ler sobre a luz. Abre por qualquer `[data-abre-reel]`; fecha no botão, no Esc ou clicando fora do vídeo; a rolagem para enquanto está aberto e o foco volta para quem abriu.

### Interações
- Pílulas: no hover, a de contorno enche e a cheia esvazia; a seta anda 4 px, o play cresce, o × gira 90°; no clique, `scale(.96)`. Foco visível (contorno de 1 px).
- Links da nav e do contato: um fio de 1 px que desenha da esquerda.
- Quadros dos filmes: aproximam 3,5% em 1,4 s no hover.
- Rolando com o cursor parado, nenhum hover acende (classe `.is-scrolling` no `html`, já posta pelo `rolagem.js`).

### Barra de rolagem
A nativa fica escondida e uma barra própria, fina, aparece ao rolar ou com o mouse perto da borda direita, e dá para arrastar (pronta em `arquivos/motion/barra.js`; some no toque).

### Celular
Tão caprichado quanto o desktop (prints 10 a 13). Nada corta em 390 px; o filme cobre a tela em pé (`object-position: 62% 50%`).

### Movimento reduzido
Sem intro, sem Lenis, vídeo parado no pôster, grão e trepidação parados, entradas sem deslocamento.

---

## Parte 2 — Como construir (stack)

- **Vite sem framework**: HTML, CSS e JS puros. Instale com versão travada (`npm i -E`): `lenis@1.3.27`, `@fontsource-variable/geist@5.3.0`, `@fontsource-variable/geist-mono@5.3.0` e `vite@8` como dependência de desenvolvimento. Importe as fontes por `.../wght.css` (famílias `'Geist Variable'` e `'Geist Mono Variable'`).
- Estrutura: `index.html` com as seções; `src/styles/tokens.css` (variáveis) e `base.css` (base, rótulo mono, marca, pílulas, entradas); **um CSS por seção** em `src/sections/` (`carga`, `fundo`, `nav`, `hero`, `folha`, `manifesto`, `filmes`, `processo`, `contato`, `reel`); motion em `src/motion/`.
- Copie `arquivos/video/*` para `public/video/`, `arquivos/img/*` para `public/img/` (com a pasta `intro/`), `arquivos/favicon.svg` para `public/` e **todos** os módulos de `arquivos/motion/` para `src/motion/`. No `main.js`, depois dos CSS: `carga(fundo()); nav(); barra(); entradas(); reel(); links();`.
- **O contrato dos módulos** (o HTML tem de bater):
  - `fundo.js`: `<div class="fundo" data-fundo aria-hidden="true">` com `<video src="/video/montagem.mp4" poster="/video/montagem.jpg" muted loop playsinline preload="auto">`, `<i class="fundo__vinheta">` e `<i class="fundo__grao">`.
  - `carga.js`: `<div class="carga" data-carga aria-hidden="true">` logo no começo do `<body>`, com `<p class="carga__rotulos mono"><span>[ Lusco Filmes ]</span><span>[ <b data-pct>0</b> por cento ]</span></p>` e `<div class="carga__coluna" data-coluna>` com as 11 `<img>` da intro e, por último, `<img src="/video/montagem.jpg" class="carga__ultimo" data-ultimo>`. Ele põe na carga `.is-abre` (rótulos para as bordas), `.is-crescendo` (rótulos somem), `.is-abrindo` (fundo transparente) e `.is-fora` (`display: none`); no `html`, `.is-pronto` (o hero entra). A coluna começa em `top: 100%`, centrada; o último quadro usa `aspect-ratio: var(--tela)` (o JS põe a proporção da tela) e, solto (`.is-solto`), fica `position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; transform-origin: 0 0; object-fit: cover; object-position: 62% 50%` com o mesmo filtro do vídeo. As letras do hero são `<b>` dentro de `.hero__marca .marca`, escondidas com `translateY(1.2em)` sob um `clip-path` até `.is-pronto`.
  - `nav.js`: `<header class="nav" data-nav>`; a folha é o `<div class="folha">` que envolve as seções depois do hero; aberturas de tela inteira levam `data-aberta`. Ele põe `.is-clara` na nav e `.is-sob` no `h2`/`li` das aberturas que passam por baixo dela.
  - `reel.js`: `<dialog class="reel" data-reel>` com o `<video>` (`preload="none"`) e o botão `[data-fecha-reel]`.
  - `entradas.js` põe `.is-in` nos `.entra`; `links.js` leva os `a[href^="#"]` pelo Lenis; `rolagem.js` cria o Lenis (`lerp` 0,05).
- Antes do JS, um `<style>` no `index.html` com `background: #0a0a0a` no `html` e um `<link rel="preload" as="image" href="/video/montagem.jpg">`.
- No fim: `npm run build` precisa passar e o console fica limpo; o `dist/` sobe em qualquer hospedagem estática.
