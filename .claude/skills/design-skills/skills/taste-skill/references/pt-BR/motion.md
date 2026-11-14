# Movimento

Leia isto antes de acrescentar qualquer animação. A página estática já tem de estar pronta e passando
no `inspect.mjs`; o movimento é a última leitura, nunca um jeito de salvar um layout fraco.

## Sumário

1. A cota
2. O que as páginas fortes fazem com o movimento
3. Quatro perguntas antes de qualquer animação
4. Tokens
5. Comportamentos de rolagem, em ordem
6. Receitas (copie e depois adapte)
7. Movimentos-assinatura
8. Movimento reduzido e desempenho
9. O que denuncia o movimento gerado
10. Regras de movimento

## 1. A cota

Uma página que não se mexe parece mockup; o inspetor conta o que se move enquanto a página carrega e
rola, e a reprova com menos de oito elementos. A camada de movimento tem cinco partes:

- **Duas ou três cenas de rolagem:** os grandes momentos atrelados à rolagem pelos quais os sites premiados são lembrados (o
  voo da câmera por um campo de imagens, uma imagem que cresce de uma janela até a tela inteira,
  texto que atravessa um palco parado, cards que são distribuídos e se empilham). A ficha da direção as sorteia de
  `library/scenes.json` quando a biblioteca tem cenas para o briefing; `references/pt-BR/scenes.md` diz como
  preenchê-las e encaixá-las. É nelas que a página ousa; todo o resto fica discreto para que elas causem impacto.

- **Um momento-assinatura:** aquilo que um visitante descreveria uma hora depois: a headline que sobe
  de dentro de uma máscara, a imagem que abre como um obturador, o logotipo que muda de escala com a rolagem. A
  ficha da direção gerada pelo `draw.mjs` aponta um. Construa esse um bem; é o único movimento que pode ser
  chamativo.
- **Entradas de seção, coreografadas seção a seção:** as partes de cada seção chegam na ordem de leitura
  (título, texto, imagem, detalhes), em cascata de 60–90ms, subindo 16–32px com opacidade, uma vez só. Varie
  o jeito conforme o conteúdo, em vez de carimbar o mesmo preset em tudo: uma lista chega linha a linha, uma
  imagem abre de uma máscara ou assenta a partir de uma leve escala, um número sobe contando uma vez, uma frase de destaque sobe
  linha a linha.
- **Feedback sob a mão:** botões que cedem ao serem pressionados, links que respondem ao ponteiro, cards e
  imagens que reagem ao hover, um menu que abre de onde foi clicado.
- **Uma imagem em movimento:** um vídeo curto encontrado, em loop e sem som, com um quadro de poster, um deslize ou escala lenta em
  uma fotografia grande, ou um movimento atrelado à rolagem na imagem do hero.

O que continua proibido: o mesmo fade com subida, com o mesmo tempo, em todo bloco, que é o cacoete
de movimento mais citado das páginas geradas; movimento que esconde o conteúdo até um script rodar, sem fallback;
easing de quique e elástico; qualquer coisa que anime propriedades de layout. Movimento uniforme diz que ninguém decidiu
nada; movimento coreografado com um momento protegido diz que alguém decidiu.

## 2. O que as páginas fortes fazem com o movimento

Medido nos 99 Sites of the Day mais recentes do Awwwards (de julho a outubro de 2026), em 1440 e 390, com
as transições, os tweens e os gatilhos de rolagem registrados enquanto cada página carregava e era rolada. Onde
a galeria faz algo que as regras da casa proíbem, segue a versão da casa.

- **A stack.** Duas em cada três usam uma biblioteca de rolagem suave e três em cada cinco carregam Three.js; o GSAP
  aparece em 56. A camada discreta abaixo (revelações, linhas que sobem, o preenchimento de tinta) não precisa de nada disso: as scroll
  timelines e as view transitions do CSS *(animações presas à rolagem e transições de página, nativas do CSS)* fazem esse trabalho, embora só 3 e 6 dos sites as usem. As grandes
  cenas de rolagem são construídas sobre o GSAP ScrollTrigger, como nos sites premiados, pelo palco compartilhado em
  `assets/scenes/` (`references/pt-BR/scenes.md`).
- **Curvas.** As curvas que de fato rodaram são ease-outs fortes: o expo out (`.16,1,.3,1` e
  `.19,1,.22,1`) rodou em 14 sites, o cubic out em 13, o quint out em 7, e pelo número de transições o
  quint out e o expo out lideram entre todas as curvas escolhidas. As curvas in-out ficam para varreduras e coisas que
  se deslocam (cubic e quart in-out, cerca de 15 sites cada). O ease-in aparece só em saídas, curtas, antes de
  uma chegada lenta. Mudanças de cor usam o `ease` simples (46 sites). O overshoot *(passa do ponto e volta)* está em 19 folhas de estilo e
  rodou em 2.
- **Durações.** Cor no hover, 200-300 ms; pequenos movimentos de interface, 300-450 ms; revelações e linhas que sobem,
  600-1.000 ms; aberturas de imagem e varreduras, 1.100-1.600 ms. A mediana de tudo o que rodou num
  site é 420 ms.
- **Cascatas.** 20-40 ms entre caracteres, 75-120 ms entre linhas, 50-100 ms entre itens de lista.
- **O movimento atrelado à rolagem fica preso à barra de rolagem.** Dos sites que fazem scrub, 14 de 18 o prendem sem
  suavização; os outros quatro suavizam em 0,1-3 s. As revelações disparam quando o topo do elemento está a 80-95% da altura
  da janela, de cima para baixo, uma vez só.
- **Quanto se move.** Uma mediana de 130 elementos é movida por script numa página, mas eles vêm de poucos
  gestos: um título dividido em pedaços já são 20-60 elementos. O piso do inspetor (8, com aviso abaixo de 16) é um
  piso, não uma meta.
- **Esperar é o custo mais comum.** 60 de 99 abrem com uma tela de carregamento, 26 delas com um contador.
  Metade das páginas utilizáveis ainda estava ilegível 2,5 s depois de o navegador dizer que a página tinha carregado, um
  terço aos 4,5 s. Os preloaders *(telas de carregamento)* não estavam cobrindo páginas lentas (os documentos deles carregaram mais rápido que o
  resto) e as notas de design dos leitores foram as mesmas qualquer que fosse a espera; só a usabilidade caiu. Versão da
  casa: nenhum preloader, a mensagem legível no primeiro quadro, a sequência de carregamento encerrada em 1,2 s.
- **Fixar custa comprimento.** Duas em cada três páginas que rolam mantêm algo sticky *(gruda na tela enquanto a página rola)* ou fixado. Essas páginas
  são duas vezes mais longas (uma mediana de 16,6 telas contra 7,5), com menos palavras por tela (27 contra 46).
  Versão da casa: no máximo dois palcos parados, cerca de uma tela por passo, três telas por palco.
- **O movimento reduzido quase sempre falta.** 35 de 99 têm alguma regra de `prefers-reduced-motion`, 16 têm
  três ou mais; 5 de 26 cenas atreladas à rolagem têm uma. Toda receita aqui mantém o estado final
  como o estado reduzido.

## 3. Quatro perguntas antes de qualquer animação

1. **Com que frequência alguém vai ver isso?** Uma vez por visita (o carregamento do hero, a revelação de uma seção): pode levar o
   seu tempo. Muitas vezes por visita (hover, menu, acordeão): rápido e pequeno. Centenas de vezes (ações de
   teclado, digitação): sem animação.
2. **Para que serve?** Respostas válidas: mostra de onde algo veio, confirma uma ação,
   evita que uma mudança seja brusca, explica como o produto funciona, é o momento-assinatura.
   "Fica bonito" só vale para o momento-assinatura.
3. **Qual easing?** Entrando ou saindo: ease-out, para o movimento começar no instante em que o olho chega.
   Movendo entre dois lugares da tela: ease-in-out. Cor e opacidade no hover: `ease`. Deslocamento
   constante (marquee, progresso): `linear`. O `ease-in` deixa a interface com cara de lenta porque os primeiros quadros
   quase não se mexem; não o use. As curvas por palavra-chave do CSS são fracas, então use os tokens abaixo.
4. **Quanto tempo?** Feedback de clique 100–160ms. Hover 150–200ms. Menus e popovers 150–250ms. Diálogos e
   gavetas 250–450ms. Revelações de seção e do hero 500–900ms. Sair é mais rápido que chegar (cerca de 70%).

## 4. Tokens

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);        /* entradas, hovers que movem, UI abaixo de 600ms */
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);        /* novo: revelações de 800ms ou mais, linhas que sobem, aberturas */
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);     /* varreduras, painéis, coisas que se deslocam à vista */
  --ease-soft: cubic-bezier(0.33, 1, 0.68, 1);       /* escala e deslize lentos em fotografias */
  --ease-exit: cubic-bezier(0.55, 0.055, 0.675, 0.19); /* novo: algo que sai de vez, curto */
  --t-press: 140ms;
  --t-hover: 180ms;
  --t-ui: 240ms;
  --t-reveal: 800ms;
  --t-open: 1200ms;                                  /* novo: aberturas de imagem e varreduras com clip */
  --stagger-line: 90ms;                              /* novo */
  --stagger-item: 70ms;                              /* novo */
}
```

Como o estudo pesa em cada um:

- `--ease-out` (quint out) está em 28 folhas de estilo, junto com seu quase gêmeo, e é a curva escolhida
  mais frequente entre as transições que rodaram. Mantenha.
- `--ease-expo` é novo. O expo out (`.16,1,.3,1` e `.19,1,.22,1`) está em 28 folhas de estilo e rodou em 14
  sites, mais que qualquer outra família escolhida, e é a curva que as revelações longas usam: linhas que sobem,
  aberturas de imagem, entradas de card de 0,9-1,6 s. Use-o em tudo que dure `--t-reveal` ou mais; ele
  substitui o `--ease-out` nas receitas da headline com máscara e da revelação na rolagem.
- `--ease-in-out` (quart in-out) bate com a sua família (14 folhas de estilo, 7 rodaram). Mantenha-o para varreduras,
  obturadores, menus e transições de página.
- `--ease-soft` (cubic out) bate com a família cubic-out (21 folhas de estilo, 13 rodaram), mas o estudo a usa
  para movimentos de interface de 0,3-0,8 s, em que o `--ease-out` já serve. Restrinja-o a escala e
  deslize lentos em fotografias.
- `--ease-exit` é novo. O ease-in serve para exatamente uma função: algo que sai de vez (uma
  legenda que vai embora, um slide substituído, um painel que fecha), curto, com cerca de 60-70% da
  entrada correspondente. Nunca para algo que o visitante está esperando ver.
- Não adotados: `.4,0,.2,1` (38 folhas de estilo) é um padrão de framework, e as curvas com overshoot (19) continuam
  proibidas em elementos de interface.
- `--t-hover` fica em 180ms. Os hovers de cor do estudo rodam em 200-300ms; um pouco mais rápido parece
  mais preciso. Um hover que move algo (um rótulo que rola, uma seta) leva de `--t-ui` a 400ms.

## 5. Comportamentos de rolagem, em ordem

| Comportamento | Páginas de 99 | Para que serve | Versão da casa |
| --- | --- | --- | --- |
| Biblioteca de rolagem suave | 67 | Uma sensação de peso; facilita construir cenas atreladas à rolagem | Opcional, pelo `Stage.smooth()`: Lenis com lerp 0,1-0,14, desligado no toque e no movimento reduzido |
| Palco parado (sticky ou fixado) | 44 | Uma imagem ou objeto sustenta várias afirmações; capítulos | Sim: as cenas de rolagem (`references/pt-BR/scenes.md`), duas ou três por página, de uma a quatro telas cada; outros palcos sticky, no máximo três telas |
| Texto dividido | 40 | Linhas e palavras que chegam conforme são lidas; rolagens no hover | Linhas para títulos e frases de destaque; palavras só para o preenchimento de tinta; caracteres só para um título de uma a três palavras |
| Cor por capítulo | 34 | Distingue os capítulos sem faixas de espaçamento | Sim, como cortes secos nas bordas das seções; a tinta do cabeçalho acompanha em 300ms |
| Cena atrelada à rolagem (câmera, objeto, sequência de imagens) | 26 | Explica um produto movendo-o | Sim, da biblioteca de cenas, construída sobre o palco compartilhado, com uma composição final para o movimento reduzido |
| Profundidade em parallax | 24 | Profundidade em colagens; imagens que deslizam dentro de molduras maiores que elas | Deslocamento abaixo de 8% do elemento, imagens a 106-110% dentro das molduras |
| Marquee *(faixa de texto que corre sozinha)* | 21 | Vida numa faixa estática | O "Marquee de ponta a ponta" (Edge-to-edge marquee) que já existe: um por página, que pode ser pausado |
| Linha ou palavra que sobe com máscara | 18 | Títulos que chegam como tipo composto | Sim: "Revelação de linhas com máscara" no carregamento, "Linhas que sobem na rolagem" abaixo da dobra |
| A roda do mouse move uma cena, sem rolar a página | 16 | Explorar um objeto | Não usado (ver 2.6) |
| Entrada com desfoque | 15 | Chegada suave | No máximo 8px de desfoque, 600ms, some depois de assentar; nunca em texto corrido |
| Imagem de moldura recuada a sangrada (full-bleed) | 14 | A passagem de uma tela de texto para a imagem grande | Sim: "Janela que abre", cerca de uma tela de rolagem |
| Texto que vai do cinza à tinta | 14 | Dá o ritmo de uma frase de destaque | Sim, uma vez por página, começando em 45% de tinta: "Preenchimento de tinta" |
| Folha desliza sobre uma camada parada | 11 | Ritmo de virar página entre capítulos | Sim: o movimento novo "Folha sobre uma imagem parada" |
| Embaralhar ou decodificar | 11 | Uma voz de "código" | Não usado (ver 2.6) |
| Tinta do cabeçalho por capítulo | 10 | O cabeçalho fixo continua legível | Sim, com a cor por capítulo |
| Trilho horizontal fixado à rolagem vertical | 8 | Percorrer ambientes ou uma coleção | Primeiro a fileira nativa de arrastar; fixado só quando a fileira tem menos de três telas de comprimento, com suporte a teclado: "Galeria lateral" |
| Rodapé cortina | 8 | A página termina como uma cena | Movimento que já existe |
| Dígitos que rolam | 6 | Números que chegam | Sim, para páginas cujo argumento é um punhado de números: "Números que rolam" |
| Índice com prévia no hover | 5 | Navegar pelos trabalhos pelo nome | Movimento que já existe, receita melhorada |

Texto, dividido por unidade: caracteres em cerca de 20 páginas, linhas em cerca de 14, palavras em cerca de 11. Divisões por
caractere servem a títulos curtos e a rolagens de botão; em frases de destaque longas, deixam fragmentos no meio da rolagem.

## 6. Receitas

Todas as receitas mantêm o conteúdo visível com o JavaScript desligado, põem todo estado escondido dentro de
`prefers-reduced-motion: no-preference` e usam os tokens acima. Duas notas que valem para várias:

- **As scroll timelines precisam de um contêiner de rolagem para observar.** `animation-timeline: view()` pega o contêiner de rolagem
  mais próximo, e `overflow: hidden` cria um. Uma imagem dentro de uma moldura com `overflow: hidden`, portanto,
  nunca anima. Use `overflow: clip` nas molduras, ou dê nome à timeline na seção
  (`view-timeline-name: --hero`) e aponte os filhos para esse nome. Isso vale também para a
  receita "Progresso atrelado à rolagem" que já existe.
- **Atrelado à rolagem quer dizer linear.** A rolagem é o easing. 14 dos 18 sites do estudo que fazem scrub
  prendem o movimento à barra de rolagem, que é o que as scroll timelines do CSS fazem.

Todas as receitas mantêm o conteúdo visível quando o JavaScript está desligado ou lento: o estado escondido só vale sob
`html.js`, que um script inline de uma linha define.

```html
<script>document.documentElement.classList.add('js')</script>
```

### Sequência de carregamento em 1,2 segundo

Tudo está no HTML e é pintado no primeiro quadro; a sequência só acrescenta a chegada. Nada
espera o evento de load, e nada na navegação anima.

```html
<header class="hero">
  <h1 class="display lines">
    <span class="line"><span data-line style="--i:0">Banquinhos para</span></span>
    <span class="line"><span data-line style="--i:1">cozinhas pequenas</span></span>
  </h1>
  <p class="lead" data-load style="--d:420ms">…</p>
  <a class="button" data-load style="--d:480ms" href="#stools">Ver os banquinhos</a>
  <figure class="hero__picture" data-open><img src="stool.jpg" alt="…" fetchpriority="high"></figure>
</header>
```

```css
.hero__picture { overflow: clip; margin: 0; }
@media (prefers-reduced-motion: no-preference) {
  .js .hero [data-line] { transform: translateY(105%); animation: load-line 800ms var(--ease-expo) forwards; animation-delay: calc(100ms + var(--i) * var(--stagger-line)); }
  .js .hero [data-load] { opacity: 0; transform: translateY(12px); animation: load-rise 500ms var(--ease-out) forwards; animation-delay: var(--d); }
  .js .hero [data-open] { clip-path: inset(0 0 100% 0); animation: load-open 1000ms var(--ease-in-out) 150ms forwards; }
  .js .hero [data-open] img { transform: scale(1.08); animation: load-settle 1100ms var(--ease-expo) 100ms forwards; }
}
@keyframes load-line { to { transform: none; } }
@keyframes load-rise { to { opacity: 1; transform: none; } }
@keyframes load-open { to { clip-path: inset(0); } }
@keyframes load-settle { to { transform: none; } }
```

A timeline: as linhas da headline sobem de 100 a 990 ms, a imagem abre de 150 a 1.150 ms,
a frase e o botão chegam de 420 a 980 ms. Tudo assentado em 1,2 s, quatro coisas no máximo.
Pré-carregue a fonte display (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) para que as linhas
subam na fonte de verdade, e dê à imagem `fetchpriority="high"` e uma cor de fundo tirada dela,
para que uma imagem lenta abra sobre a própria cor, e não sobre uma caixa vazia. Estudo: 22 de 91 páginas estavam legíveis
no primeiro quadro da introdução e mais 11 até 1,2 s; as introduções que os leitores chamaram de respeitosas terminavam em
cerca de 1-1,2 s; um terço das páginas ainda estava ilegível aos 4,5 s.

### Revelação de linhas com máscara (a headline clássica de galeria)

Cada linha sobe de trás da sua própria linha de base. Como as headlines têm no máximo duas linhas, você define
as quebras de linha e envolve cada linha.

```html
<h1 class="lines">
  <span class="line"><span data-line style="--i:0">Banquinhos para</span></span>
  <span class="line"><span data-line style="--i:1">cozinhas pequenas</span></span>
</h1>
```

```css
.lines .line { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.lines [data-line] { display: block; }
@media (prefers-reduced-motion: no-preference) {
  .js .lines [data-line] {
    transform: translateY(105%);
    animation: line-up 900ms var(--ease-out) forwards;
    animation-delay: calc(var(--i) * 110ms + 150ms);
  }
}
@keyframes line-up { to { transform: none; } }
```

O par `padding-bottom` / margem negativa impede que as descendentes (g, y, p) sejam cortadas pela máscara.
Num celular estreito, cada uma das duas linhas definidas pode quebrar; confira a captura do celular e, se quebrarem,
defina uma quebra mais curta para o celular com o padrão `<br class="only-wide">` ou reduza o tamanho.

### Revelação na rolagem (uma vez só)

Para as duas ou três seções que merecem, não para todo bloco.

```css
@media (prefers-reduced-motion: no-preference) {
  .js [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 700ms var(--ease-out), transform 900ms var(--ease-out); }
  .js [data-reveal].is-in { opacity: 1; transform: none; }
}
```

```js
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
```

Nunca ligue revelações com um listener de scroll, nunca as repita quando o elemento volta a entrar, e nunca
deixe nada em `opacity: 0` se o observer não disparar (a trava do `html.js` cuida do caso sem JS; o
`unobserve` cuida das repetições).

### Obturador de imagem

Uma imagem abre a partir de uma borda enquanto diminui levemente de escala dentro da moldura. Clássico das galerias; use-o para
a única imagem do hero ou de vitrine.

```css
.shutter { overflow: hidden; }
@media (prefers-reduced-motion: no-preference) {
  .js .shutter { clip-path: inset(0 0 100% 0); transition: clip-path 1100ms var(--ease-in-out); }
  .js .shutter img { transform: scale(1.12); transition: transform 1500ms var(--ease-soft); }
  .js .shutter.is-in { clip-path: inset(0); }
  .js .shutter.is-in img { transform: none; }
}
```

### Clique e hover

```css
.button { transition: transform var(--t-press) var(--ease-out), background-color var(--t-hover) ease, color var(--t-hover) ease; }
.button:active { transform: scale(0.97); }
.link { text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 0.2em; text-decoration-thickness: 0.07em; transition: text-decoration-color var(--t-hover) ease; }
@media (hover: hover) and (pointer: fine) {
  .button:hover { background-color: var(--accent-strong); }
  .link:hover { text-decoration-color: currentColor; }
}
```

Os estilos de hover ficam atrás de `(hover: hover)` porque os aparelhos de toque disparam o hover no toque e o deixam preso.
O hover deve aumentar o contraste, nunca diminuir. Não mude o peso da fonte no hover (o texto se reorganiza).
Não levante nem amplie todo card no hover; uma resposta pequena e consistente basta.

### Progresso atrelado à rolagem sem JavaScript

Para um logotipo que muda de escala enquanto o hero sai, uma imagem que desliza alguns por cento, ou uma barra de progresso.
Envolva em `@supports` para que os navegadores sem scroll timelines fiquem com o estado estático.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .drift { animation: drift linear both; animation-timeline: view(); animation-range: entry 0% exit 100%; }
    @keyframes drift { from { transform: translateY(-4%); } to { transform: translateY(4%); } }
  }
}
```

Mantenha o deslocamento pequeno (abaixo de 8% do elemento). Parallax grande dificulta a leitura do texto e parece
datado.

### História fixada

Uma seção cujo título fica parado enquanto os itens passam. Use `position: sticky`; não sequestre a rolagem.

```css
.story { display: grid; grid-template-columns: 5fr 7fr; gap: var(--gutter); align-items: start; }
.story__title { position: sticky; top: 18vh; }
@media (max-width: 800px) { .story { grid-template-columns: 1fr; } .story__title { position: static; } }
```

### Índice com prévia, ancorada na linha

Linhas de nomes; apontar para uma linha ou chegar a ela pelo Tab abre uma moldura na altura dessa linha. A moldura
segue a linha, nunca o ponteiro.

```html
<section class="index">
  <ul class="index__list">
    <li><a class="index__row" href="/work/harbour-house" data-preview="/img/harbour-house.jpg">
      <span class="index__name">Harbour House</span><span class="index__year">2025</span>
      <img class="index__thumb" src="/img/harbour-house-small.jpg" alt="" loading="lazy" width="640" height="400">
    </a></li>
    <!-- … -->
  </ul>
  <div class="index__frame" aria-hidden="true"><img alt=""></div>
</section>
```

```css
.index { position: relative; }
.index__list { list-style: none; margin: 0; padding: 0; }
.index__row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0 var(--gutter); padding-block: 0.3em; font-size: var(--step-head); color: inherit; text-decoration: none; transition: opacity var(--t-hover) ease; }
.index__thumb { order: -1; flex-basis: 100%; width: 100%; height: auto; margin-bottom: 0.4rem; }
.index__frame { display: none; }
@media (hover: hover) and (pointer: fine) {
  .index__list { max-width: 62%; }
  .index__thumb { display: none; }
  .index__list:has(.index__row:hover, .index__row:focus-visible) .index__row:not(:hover, :focus-visible) { opacity: 0.4; }
  .index__frame { display: block; position: absolute; top: 0; right: var(--margin); width: 30%; aspect-ratio: 4 / 3; z-index: 1; pointer-events: none; clip-path: inset(100% 0 0 0); transition: clip-path 320ms var(--ease-out), transform 360ms var(--ease-out); }
  .index__frame.is-open { clip-path: inset(0); }
  .index__frame img { width: 100%; height: 100%; object-fit: cover; }
}
@media (prefers-reduced-motion: reduce) { .index__frame { transition: none; } }
```

```js
(() => {
  const root = document.querySelector('.index');
  if (!root) return;
  const frame = root.querySelector('.index__frame');
  const picture = frame.querySelector('img');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let warmed = false;
  const show = (row) => {
    if (!fine.matches) return;
    if (!warmed) { warmed = true; root.querySelectorAll('[data-preview]').forEach((a) => { new Image().src = a.dataset.preview; }); }
    picture.src = row.dataset.preview;
    const y = row.offsetTop + row.offsetHeight / 2 - frame.offsetHeight / 2;
    const max = root.offsetHeight - frame.offsetHeight;
    const opening = !frame.classList.contains('is-open');
    if (opening) frame.style.transitionProperty = 'clip-path';   // abre no lugar, sem deslizar a partir do topo
    frame.style.transform = `translateY(${Math.min(max, Math.max(0, y))}px)`;
    if (opening) { frame.getBoundingClientRect(); frame.style.transitionProperty = ''; }
    frame.classList.add('is-open');
  };
  const hide = () => frame.classList.remove('is-open');
  root.querySelectorAll('.index__row').forEach((row) => {
    row.addEventListener('pointerenter', () => show(row));
    row.addEventListener('focus', () => show(row));
  });
  root.addEventListener('pointerleave', hide);
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) hide(); });
})();
```

Nas telas de toque, cada linha mostra a própria imagem acima do nome. Estudo: 5 páginas navegam pelos trabalhos desse jeito;
molduras de cerca de 470x270 até pranchas grandes atrás da lista; as outras linhas esmaecidas para cerca de 0,3 (0,4 aqui, o piso para texto esmaecido). Os
rastros de imagem e as prévias carregadas pelo cursor vistos em outras partes do estudo são a versão truque.

### Linhas que sobem na rolagem

Para um título de seção ou uma frase de destaque cujas quebras de linha você não controla. Divide depois que as fontes
carregam, revela uma vez e então devolve o texto simples para que ele quebre normalmente. Só texto simples (sem links nem
ênfase dentro).

```html
<h2 class="head" data-lines>Torneados à mão numa pequena oficina</h2>
```

```css
[data-lines] .line { display: block; overflow: clip; padding-bottom: 0.12em; margin-bottom: -0.12em; }
[data-lines] .line > span { display: block; }
@media (prefers-reduced-motion: no-preference) {
  .is-split .line > span { transform: translateY(110%); }
  .is-split.is-in .line > span { transform: none; transition: transform 900ms var(--ease-expo) calc(var(--i) * var(--stagger-line)); }
}
```

```js
(() => {
  const els = [...document.querySelectorAll('[data-lines]')];
  if (!els.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const restore = (el) => { el.textContent = el.dataset.text; el.classList.remove('is-split', 'is-in'); };
  const split = (el) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.dataset.text = text;
    el.textContent = '';
    const words = text.split(' ').map((word) => {
      const s = document.createElement('span');
      s.style.display = 'inline-block';
      s.textContent = word;
      el.append(s, ' ');
      return s;
    });
    const lines = [];                                   // agrupa as palavras pela linha em que caíram
    for (const w of words) {
      const last = lines.at(-1);
      if (last && Math.abs(last.top - w.offsetTop) < 4) last.words.push(w.textContent);
      else lines.push({ top: w.offsetTop, words: [w.textContent] });
    }
    el.textContent = '';
    lines.forEach((line, i) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'line';
      inner.style.setProperty('--i', i);
      inner.textContent = line.words.join(' ');
      mask.append(inner);
      el.append(mask, ' ');
    });
    el.classList.add('is-split');
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.classList.add('is-in');
      e.target.querySelector('.line:last-of-type > span')
        .addEventListener('transitionend', () => restore(e.target), { once: true });
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  document.fonts.ready.then(() => els.forEach((el) => { split(el); io.observe(el); }));
  let width = innerWidth;                               // a largura mudou antes da revelação: devolve o texto
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    els.filter((el) => el.matches('.is-split:not(.is-in)')).forEach((el) => { io.unobserve(el); restore(el); });
  });
})();
```

Estudo: subidas com máscara a partir de 100-120% abaixo da linha, 0,6-1,2 s, 75-120 ms entre linhas, disparadas quando
o topo do bloco está a 80-95% da altura da janela. Movimento reduzido: o script não roda; o texto fica simples.

### Janela que abre

A passagem de uma tela de texto para a única imagem grande: a imagem aparece primeiro como uma janela no
meio de um palco parado e abre até ficar sangrada ao longo de cerca de uma tela de rolagem.

```html
<section class="opening">
  <div class="opening__stage">
    <img src="workshop-wide.jpg" alt="A oficina ao amanhecer, com as bancadas vazias" width="2400" height="1500">
  </div>
</section>
```

```css
.opening__stage { height: 100svh; overflow: clip; }
.opening__stage img { display: block; width: 100%; height: 100%; object-fit: cover; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .opening { height: 200svh; view-timeline-name: --opening; --inset-y: 20%; --inset-x: 28%; }
    .opening__stage { position: sticky; top: 0; animation: opening-window linear both; animation-timeline: --opening; animation-range: contain 0% contain 75%; }
    .opening__stage img { animation: opening-settle linear both; animation-timeline: --opening; animation-range: contain 0% contain 75%; }
  }
}
@media (max-width: 700px) { .opening { --inset-y: 18%; --inset-x: 8%; } }
@keyframes opening-window { from { clip-path: inset(var(--inset-y) var(--inset-x)); } to { clip-path: inset(0); } }
@keyframes opening-settle { from { transform: scale(1.15); } to { transform: none; } }
```

A seção tem duas telas de altura; o palco fica parado durante uma, e a janela está totalmente aberta depois de três
quartos dela, então a imagem sangrada descansa por um momento antes de a página seguir. Estudo: 14 páginas;
janelas iniciais de 38-60% da largura; pistas de rolagem de 600-1.800 px, e os leitores pediram de uma a duas telas.
Sem scroll timelines, e no movimento reduzido, a imagem é uma tela sangrada.

### Imagem parada, legendas que passam

A história fixada feita para fotografias: a imagem fica parada de um lado enquanto legendas curtas passam do
outro; a legenda no meio da tela fica acesa e a imagem dela aparece.

```html
<section class="steps">
  <figure class="steps__media">
    <div class="steps__pictures">
      <img src="seasoning.jpg" alt="Tábuas de freixo empilhadas para secar" class="is-on">
      <img src="turning.jpg" alt="Um pé sendo torneado no torno">
      <img src="finish.jpg" alt="Óleo passado num assento pronto">
    </div>
    <figcaption class="steps__count" aria-hidden="true"></figcaption>
  </figure>
  <ol class="steps__list">
    <li class="steps__item"><h3>Secos por um ano</h3><p>…</p></li>
    <li class="steps__item"><h3>Torneados à mão</h3><p>…</p></li>
    <li class="steps__item"><h3>Acabamento com óleo</h3><p>…</p></li>
  </ol>
</section>
```

```css
.steps { display: grid; grid-template-columns: 7fr 5fr; column-gap: var(--gutter); }
.steps__media { margin: 0; align-self: start; }           /* um item de grid esticado não consegue grudar */
.steps__pictures img { display: block; width: 100%; height: auto; }
.steps__list { list-style: none; margin: 0; padding: 0; }
.steps__item { min-height: 80svh; display: flex; flex-direction: column; justify-content: center; }
.js .steps__media { position: sticky; top: 0; height: 100svh; display: flex; flex-direction: column; justify-content: center; gap: 0.75rem; }
.js .steps__pictures { position: relative; aspect-ratio: 4 / 5; max-height: 80svh; }
.js .steps__pictures img { position: absolute; inset: 0; height: 100%; object-fit: cover; opacity: 0; transition: opacity 500ms ease; }
.js .steps__pictures img.is-on { opacity: 1; }
.js .steps__item { opacity: 0.4; transition: opacity var(--t-ui) ease; }
.js .steps__item.is-active { opacity: 1; }
@media (max-width: 800px) {
  .steps { display: block; }                               /* a seção, e não uma área do grid, contém a imagem sticky */
  .js .steps__media { height: auto; z-index: 1; background: var(--bg); padding-block: 0.5rem; }
  .js .steps__pictures { aspect-ratio: 3 / 2; max-height: 42svh; }
  .steps__item { min-height: 60svh; }
}
@media (prefers-reduced-motion: reduce) { .js .steps__pictures img, .js .steps__item { transition: none; } }
```

```js
(() => {
  const root = document.querySelector('.steps');
  if (!root || !('IntersectionObserver' in window)) return;
  const items = [...root.querySelectorAll('.steps__item')];
  const pictures = [...root.querySelectorAll('.steps__pictures img')];
  const count = root.querySelector('.steps__count');
  const show = (i) => {
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
    pictures.forEach((el, k) => el.classList.toggle('is-on', k === i));
    if (count) count.textContent = `${i + 1} de ${items.length}`;
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) show(items.indexOf(e.target));
  }, { rootMargin: '-45% 0px -45% 0px' });                 // uma faixa no meio da tela
  items.forEach((el) => io.observe(el));
  show(0);
})();
```

Sem JavaScript, as imagens e as legendas viram duas colunas simples. Estudo: itens inativos a 20-40%
(esmaecidos de 10-15% parecem texto faltando, então o piso aqui é 40%), crossfades de 400-600 ms, cerca de uma
tela por passo; os leitores pediram uma contagem visível em qualquer sequência parada de mais de dois passos.
A contagem é uma frase simples na fonte do texto, não um numeral com zeros à esquerda.

### Galeria lateral

Uma fileira de imagens que a rolagem vertical move para o lado enquanto o palco fica parado, para uma coleção
curta (oito itens ou menos). A fileira nativa de arrastar é a base; a versão fixada só entra
em telas largas com o movimento permitido, e só quando a fileira tem menos de três telas de comprimento.

```html
<section class="gallery">
  <div class="gallery__stage">
    <h2 class="head">Oito cozinhas, um banquinho</h2>
    <ul class="gallery__track">
      <li class="gallery__item"><a href="/kitchens/leith"><img src="leith.jpg" alt="Uma cozinha estreita, de corredor, em Leith" width="1200" height="1500"><span>Leith</span></a></li>
      <!-- … -->
    </ul>
  </div>
</section>
```

```css
.gallery__track { display: flex; gap: var(--gutter); list-style: none; margin: 0; padding: 0 var(--margin); overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: var(--margin); }
.gallery__item { flex: 0 0 min(72vw, 28rem); scroll-snap-align: start; }
.gallery__item img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 5; object-fit: cover; }
.gallery.is-pinned .gallery__stage { position: sticky; top: 0; height: 100svh; display: flex; flex-direction: column; justify-content: center; gap: 2rem; overflow: clip; }
.gallery.is-pinned .gallery__track { overflow: visible; scroll-snap-type: none; }
.gallery.is-pinned .gallery__item { flex-basis: calc(62svh * 0.8); }
```

```js
(() => {
  const root = document.querySelector('.gallery');
  if (!root) return;
  const track = root.querySelector('.gallery__track');
  const wide = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  let dx = 0, queued = false;
  const place = () => {
    queued = false;
    if (!root.classList.contains('is-pinned')) return;
    const p = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / dx));
    track.style.transform = `translate3d(${(-p * dx).toFixed(1)}px, 0, 0)`;
  };
  const measure = () => {
    root.classList.add('is-pinned');                     // mede a fileira como ela ficaria fixada
    track.style.transform = '';
    dx = track.scrollWidth - track.clientWidth;
    const pin = wide.matches && dx > 0 && dx < innerHeight * 3;
    root.classList.toggle('is-pinned', pin);
    root.style.height = pin ? `${innerHeight + dx}px` : ''; // um pixel de rolagem move a fileira um pixel
    place();
  };
  track.addEventListener('focusin', (e) => {             // teclado: traz o item focado para a vista
    if (!root.classList.contains('is-pinned')) return;
    const item = e.target.closest('.gallery__item');
    const x = Math.min(dx, Math.max(0, item.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft)));
    scrollTo({ top: root.getBoundingClientRect().top + scrollY + x, behavior: 'instant' });
  });
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(place); } }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  wide.addEventListener('change', measure);
  measure();
})();
```

Estudo: 8 páginas fixaram um trilho horizontal; essas páginas tinham uma mediana de 25 telas, e os piores
casos dos leitores gastaram 9 telas em três cards e 10.000-23.000 px de roda do mouse num trilho só. Aqui a velocidade é 1:1
e o trecho parado termina quando a última imagem chega à margem. Celulares, janelas estreitas, movimento reduzido e
fileiras longas ficam todos com a fileira nativa com snap, que também funciona no toque, no trackpad e no
teclado. Nunca ponha a única cópia de uma chamada para ação dentro da fileira que se move.

### Hero que recua

Enquanto a primeira dobra sai, a imagem dela afunda um pouco e escurece, enquanto as palavras sobem um pouco
mais rápido, e assim o hero recua em vez de simplesmente rolar para fora.

```html
<header class="hero">
  <img class="hero__picture" src="kitchen.jpg" alt="…" width="2400" height="1600" fetchpriority="high">
  <div class="hero__copy"><h1 class="display">…</h1><p class="lead">…</p></div>
</header>
```

```css
.hero { position: relative; min-height: 100svh; overflow: clip; display: grid; align-items: end; view-timeline-name: --hero; }
.hero__picture { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero::after { content: ''; position: absolute; inset: 0; background: var(--ink); opacity: 0; pointer-events: none; }
.hero__copy { position: relative; z-index: 1; padding: var(--margin); }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .hero__picture { animation: hero-sink linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    .hero::after { animation: hero-dim linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    .hero__copy { animation: hero-lift linear both; animation-timeline: --hero; animation-range: exit 0% exit 70%; }
  }
}
@keyframes hero-sink { to { transform: translateY(8%) scale(1.06); } }
@keyframes hero-dim { to { opacity: 0.35; } }
@keyframes hero-lift { to { transform: translateY(-6%); opacity: 0; } }
```

O intervalo `exit` vai do momento em que o topo do hero encontra o topo da tela até o momento em que a base dele encontra,
o que, numa primeira dobra, é a primeira tela de rolagem. Estudo: imagens de hero que afundam e escurecem enquanto
saem, um título atrelado à rolagem indo de 140 a 60 px, uma cartela que diminui no celular; os
leitores o chamaram de discreto e a página de "uma folha só". O deslocamento fica abaixo de 8%; a camada por cima é uma tinta chapada de
até 35%, não um gradiente. Estático onde não há suporte ou no movimento reduzido.





### De página em página

Navegação entre as páginas do site com as view transitions do próprio navegador: a página antiga some
rápido, a nova sobe, e a imagem em que o visitante clicou viaja até o lugar dela como o hero da nova
página. Sem biblioteca, sem cortina de tela cheia.

```css
/* em todas as páginas */
@view-transition { navigation: auto; }
@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }
::view-transition-old(root) { animation: vt-leave 200ms var(--ease-exit) both; }
::view-transition-new(root) { animation: vt-arrive 380ms var(--ease-out) 60ms both; }
::view-transition-group(*) { animation-duration: 480ms; animation-timing-function: var(--ease-in-out); }
::view-transition-image-pair(*.picture) { overflow: clip; }
::view-transition-old(*.picture), ::view-transition-new(*.picture) { height: 100%; object-fit: cover; }
@keyframes vt-leave { to { opacity: 0; } }
@keyframes vt-arrive { from { opacity: 0; transform: translateY(16px); } }
```

```html
<!-- no índice: a imagem do card de um projeto -->
<img src="/img/leith.jpg" alt="…" style="view-transition-name: kitchen-leith; view-transition-class: picture">
<!-- na página desse projeto: a imagem do hero -->
<img src="/img/leith-wide.jpg" alt="…" style="view-transition-name: kitchen-leith; view-transition-class: picture">
```

Cada nome pode aparecer uma vez por página. Os navegadores sem view transitions entre documentos simplesmente navegam.
Estudo: 16 páginas carregam uma biblioteca de transição de página e rodam cortinas de tela cheia de 0,7-2,4 s; 6 usam view
transitions. A nova página deve estar legível em meio segundo.

### Preenchimento de tinta

Uma frase de destaque que vai de parte da tinta à tinta cheia enquanto sobe pela tela, linha a linha. Ela é
legível antes de se preencher; o preenchimento só dá o ritmo.

```html
<p class="statement head" data-fill>Nove pessoas, uma oficina, nenhum catálogo: cada banquinho é feito para a cozinha para onde vai.</p>
```

```css
[data-fill] { --fill: var(--ink); color: var(--fill); }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .is-filling > span { display: inline-block; color: color-mix(in oklab, var(--fill) 45%, transparent); animation: ink-fill linear both; animation-timeline: view(); animation-range: cover 20% cover 45%; }
  }
}
@keyframes ink-fill { to { color: var(--fill); } }
```

```js
(() => {
  if (!CSS.supports('animation-timeline: view()') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-fill]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const s = document.createElement('span');
      s.textContent = word;
      el.append(s, i < words.length - 1 ? ' ' : '');
    });
    el.classList.add('is-filling');
  });
})();
```

Cada palavra observa a própria posição, então as palavras de uma linha se preenchem juntas enquanto a linha vai de três
quartos da altura da tela até pouco depois da metade. Num capítulo escuro, defina `--fill` como a tinta dele.
Estudo: 14 páginas levam uma frase de destaque do cinza à tinta com a rolagem; as palavras ainda não lidas começavam em cerca de 25-30%, e quadros
já assentados ainda pegavam frases meio pálidas, o que parece texto desabilitado. Aqui: uma frase de destaque por página,
de três a cinco linhas, 32px ou maior, começando em 45% (cerca de 3:1 contra o fundo, o bastante para texto
grande). Tinta cheia sem scroll timelines ou no movimento reduzido.

### Números que rolam

Para páginas cujo argumento é um punhado de números: cada dígito rola até o seu valor uma vez, as colunas com uma
batida de intervalo. O número real fica no texto para leitores de tela e para a busca.

```html
<p class="figure"><span class="display" data-roll>1987</span> o ano em que o primeiro banquinho foi vendido</p>
```

```css
.roll__digits { display: inline-flex; font-variant-numeric: tabular-nums; line-height: 1; }
.roll__col { display: inline-block; height: 1em; overflow: clip; }
.roll__strip { display: flex; flex-direction: column; transform: translateY(calc(var(--d) * -1em)); }
.roll__strip > span { height: 1em; }
@media (prefers-reduced-motion: no-preference) {
  .roll:not(.is-in) .roll__strip { transform: none; }
  .roll.is-in .roll__strip { transition: transform 1100ms var(--ease-expo) calc(var(--i) * var(--stagger-item)); }
}
```

```js
(() => {
  const els = [...document.querySelectorAll('[data-roll]')];
  if (!els.length) return;
  els.forEach((el) => {
    const value = el.textContent.trim();
    const said = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: value });
    const shown = Object.assign(document.createElement('span'), { className: 'roll__digits' });
    shown.setAttribute('aria-hidden', 'true');
    let i = 0;
    for (const ch of value) {
      if (!/\d/.test(ch)) { shown.append(ch); continue; }
      const col = Object.assign(document.createElement('span'), { className: 'roll__col' });
      const strip = Object.assign(document.createElement('span'), { className: 'roll__strip' });
      strip.style.setProperty('--d', ch);
      strip.style.setProperty('--i', i++);
      for (let n = 0; n < 10; n++) strip.append(Object.assign(document.createElement('span'), { textContent: n }));
      col.append(strip);
      shown.append(col);
    }
    el.classList.add('roll');
    el.replaceChildren(said, shown);
  });
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach((el) => io.observe(el));
})();
```

Estudo: 6 páginas rolam colunas de dígitos (estatísticas, um ano, coordenadas), cerca de 0,9-1,1 s por coluna num
expo-out, em cascata por coluna. Use para três ou quatro números em tamanho display, nunca em texto corrido
e nunca para um valor que muda depois do carregamento. Movimento reduzido: o número já aparece no seu valor.

### Acordeão

```css
.acc__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 320ms var(--ease-out); }
.acc__panel > div { overflow: hidden; }
.acc[open] .acc__panel, .acc__item.is-open .acc__panel { grid-template-rows: 1fr; }
```

Animar `grid-template-rows` de `0fr` a `1fr` abre até a altura real do conteúdo sem medi-la
em JavaScript.

### Menu ou diálogo

```css
.menu { transform-origin: top right; transition: opacity var(--t-ui) var(--ease-out), transform var(--t-ui) var(--ease-out); }
.menu[hidden], .menu.is-closed { opacity: 0; transform: scale(0.97) translateY(-6px); pointer-events: none; }
```

As coisas abrem de onde foram acionadas (`transform-origin` no gatilho). Nada entra a partir de
`scale(0)`; comece em 0,95–0,98. Um diálogo centralizado é o único caso que muda de escala a partir do próprio centro.

## 7. Movimentos-assinatura

A ficha da direção aponta um. Cada um destes foi visto repetidas vezes nos sites de galeria estudados.

| Movimento | O que acontece | Construa com |
| --- | --- | --- |
| Headline com máscara (Masked headline) | As linhas sobem de trás das suas linhas de base no carregamento | Receita da revelação de linhas com máscara |
| Imagem em obturador (Shutter image) | A imagem do hero ou de vitrine abre a partir de uma borda, assentando a partir da escala 1,12 | Receita do obturador de imagem |
| Logotipo que muda de escala (Scaling wordmark) | Um logotipo gigante diminui ou cresce alguns por cento enquanto o hero sai da tela | Receita atrelada à rolagem em `scale` |
| História fixada (Pinned story) | Um título fica parado enquanto os itens dele passam pela rolagem | Receita do sticky |
| Índice com prévia (Index with preview) | Linhas de texto; a linha sob o hover mostra a sua imagem | Índice com prévia, ancorada na linha |
| Rodapé cortina (Curtain footer) | A última seção é revelada de baixo da página quando você chega ao fim | Rodapé com `position: sticky; bottom: 0` sob um main com fundo e `z-index` |
| Crossfade lento (Slow crossfade) | A imagem do hero faz crossfade entre 3–4 fotografias, 5–6s cada | Imagens empilhadas, keyframes de opacidade, pausa quando a aba está escondida |
| Marquee de ponta a ponta (Edge-to-edge marquee) | Uma linha de texto muito grande se desloca para o lado, devagar | Duplique o conteúdo, loop linear de `translateX(-50%)`, pausa no hover e no movimento reduzido |
| Fileira de arrastar (Drag row) | Uma fileira de imagens grandes que rola na horizontal, com scroll snap | `overflow-x: auto; scroll-snap-type: x mandatory`, sem biblioteca |
| Cor por capítulo (Colour by chapter) | Cada capítulo é o seu próprio campo de cor sangrado, então o fundo muda nas bordas das seções; um cabeçalho fixo assume a tinta do capítulo embaixo dele | Fundos das seções no CSS; o `base.js` define `--header-ink` a partir de `data-ink`. Nunca recolora a página inteira a partir de um observer |
| Janela que abre (Opening window) | Uma tela de texto passa a vez para a imagem grande: uma janela no meio de um palco parado abre até ficar sangrada ao longo de cerca de uma tela | Receita da janela que abre |
| Frase com preenchimento de tinta (Ink-fill statement) | Uma frase de destaque vai de 45% à tinta cheia enquanto sobe pela tela | Receita do preenchimento de tinta |
| Folha sobre uma imagem parada (Sheet over a held picture) | Uma fotografia sangrada fica parada por uma tela; o capítulo seguinte sobe por cima dela como uma folha opaca | Uma figure de 100svh com `position: sticky; top: 0` seguida de uma seção com fundo próprio e `z-index` mais alto; sem script |
| Galeria lateral (Sideways gallery) | Uma fileira curta de imagens se move para o lado enquanto a rolagem vertical segura o palco | Receita da galeria lateral |
| Linha empurrada (Pushed line) | Uma linha de texto muito grande é empurrada para o lado pela rolagem e pode ser lida inteira no meio do percurso | `animation-timeline: view()` na linha, `translateX` de 12% a -12%, linear; estática onde não há suporte |
| Números que rolam (Rolling figures) | Os poucos números que sustentam o argumento rolam até os seus valores uma vez | Receita dos números que rolam |
| Imagem carregada (Carried picture) | A imagem clicada numa lista viaja até o lugar dela como o hero da página seguinte | Receita de página em página |

Escolha pelo assunto. Um portfólio pede o índice com prévia; um restaurante pede o crossfade lento; um
produto pede o obturador no objeto do hero. Se o movimento não diz nada sobre o assunto, é
enfeite, e a página fica melhor sem ele.

Escolha pelo assunto, como antes: a janela que abre para um produto ou um lugar com uma grande fotografia; a
folha para capítulos que têm cada um a sua imagem; a galeria lateral para um conjunto curto de ambientes, cozinhas ou
peças; a linha empurrada para uma marca cuja afirmação é uma palavra; números que rolam para um relatório, um fundo ou um
escritório que abre com números; a imagem carregada para um portfólio cujo índice e cujas páginas de case estão
ambos construídos.

## 8. Movimento reduzido e desempenho

- `prefers-reduced-motion: reduce` quer dizer menos e mais suave, não nenhum: mantenha as mudanças de opacidade e de cor,
  tire deslocamento, escala, parallax e reprodução automática. Todas as receitas acima estão escritas dentro de
  blocos `no-preference`, então o estado reduzido é simplesmente o estado final.
- Anime `transform`, `opacity` e `clip-path`. Animar `width`, `height`, `top`, `left`, `margin`
  ou `padding` força o layout a cada quadro. `grid-template-rows` nos acordeões é a exceção
  aceita porque é curto e raro.
- Não comande muitos filhos a partir de uma variável CSS que muda num pai; defina o transform no
  elemento que se move.
- `will-change` só num elemento que está prestes a animar, removido depois.
- Pause os loops quando estiverem fora da tela ou quando a aba estiver escondida.
- Sem sequestro da rolagem e sem cursor personalizado. Eles custam usabilidade, que é 30% da nota do Awwwards e
  o critério em que a maioria dos vencedores tira a nota mais baixa. Suavização só pelo `Stage.smooth()`, que fica desligado
  no toque e no movimento reduzido.

## 9. O que denuncia o movimento gerado

- O mesmo fade com subida em todo bloco.
- Uma dúzia de entradas em cascata no hero.
- Hover que levanta ou dá zoom em todo card e toda imagem.
- Easing de quique ou elástico em elementos de interface.
- Loops infinitos que não significam nada: pontinhos pulsando, formas flutuando, texto cintilando, selos girando.
- Uma revelação que nunca dispara e deixa uma faixa vazia na página. Rode o `inspect.mjs` depois da leitura de
  movimento e olhe cada captura atrás de conteúdo faltando.

### Visto nos Sites of the Day mais recentes

O que foi visto no estudo, com a frequência, e o que a casa faz no lugar.

- **Preloaders e contadores (60 de 99; 26 com contador).** Metade das páginas utilizáveis estava ilegível
  2,5 s depois do carregamento, um terço aos 4,5 s; os preloaders ficavam quase sempre em páginas que já tinham carregado, e
  25 das 29 que carregaram em menos de 3 s ainda não mostravam nada legível aos 4,5 s. Os contadores travavam,
  duravam mais que o carregamento ou eram tweens sem nada por trás. Casa: nenhum preloader. Se uma cena precisa
  carregar, a primeira dobra em HTML (headline, imagem, ação) aparece na hora e a cena surge com fade
  por trás quando estiver pronta.
- **Barreiras de entrada (10 de 99): entrar, som, idade ou gesto antes de qualquer conteúdo.** Casa: nenhuma. O som é um
  controle na página, desligado por padrão.
- **Sequestro da rolagem (16 cenas movidas pela roda do mouse, 9 delas sem fim, mais 14 telas únicas em que a roda
  não faz nada).** O visitante não sabe onde está, quanto falta nem como sair, e o
  teclado e os leitores de tela não recebem nada. Usabilidade 6,01 contra 6,50 nas páginas que rolam. Casa:
  rolagem nativa; toda cena é movida pela posição da rolagem num palco sticky que termina, com uma contagem.
- **Bibliotecas de rolagem suave (67 de 99).** Elas dão peso às cenas atreladas à rolagem e também
  põem um atraso entre a mão e a página; com um ease longo, a página continua deslizando depois que a roda
  para.
- **Cursores personalizados (28 de 99).** Seguidores, rastros de imagem, uma lente que borra a headline sobre a qual está,
  rótulos que só existem no hover; 10 dos 28 têm alguma regra de movimento reduzido. Casa: o cursor do sistema;
  os rótulos ficam na página.
- **Texto embaralhado e de máquina de escrever (11 e 5).** A headline ilegível por quatro segundos, o texto corrido
  embaralhado no meio da rolagem, ações seguradas até a digitação acabar. Casa: não usado. Palavras de verdade chegam inteiras.
- **Pistas de rolagem paradas longas.** As páginas com fixação têm em média o dobro do comprimento, com menos palavras por tela; 17 páginas
  têm 20 telas ou mais, algumas com telas inteiras que só seguram uma rotação lenta. Casa: cerca de uma
  tela por passo, três por palco, e toda tela parada leva uma linha de texto.
- **Conteúdo mantido em opacidade zero.** Revelações que deixam o texto invisível até a rolagem assentar, itens
  inativos esmaecidos para 10-15%, frases de destaque deixadas meio pálidas. Casa: revelações só abaixo da dobra, uma vez, nunca
  mais longas que 900 ms à vista; esmaecidos nunca abaixo de 40%; preenchimentos começam em 45%.
- **Movimento por cima das palavras.** Marquees e objetos à deriva que cruzam frases de destaque, uma linha deslizante que corta
  as próprias palavras, desfoque deixado no texto no meio do movimento. Casa: nada se move por cima do texto que o visitante está lendo;
  uma linha em movimento tem de se ler inteira em algum ponto do percurso.
- **Overshoot e quique (19 folhas de estilo).** Casa: continuam proibidos em elementos de interface.
- **Loops sem fim e sem botão de desligar.** Grão, pontinhos pulsando, equalizadores, selos girando, rodando sem
  regra de movimento reduzido na maioria das páginas. Casa: os loops pausam fora da tela e param no movimento reduzido.

Onde o trabalho estudado faz algo que a casa proíbe, a versão da casa: barras de progresso finíssimas e
trilhos de marcações nos palcos parados viram uma contagem simples na fonte do texto ("2 de 4"); contadores com zeros à esquerda
("01/08") viram uma contagem simples ou nada; fundos em gradiente com crossfade viram cores de capítulo chapadas com
cortes secos; rótulos de HUD em monoespaçada viram texto pequeno na fonte de texto.

## 10. Regras de movimento

1. **Primeiro quadro.** A headline, a frase e a imagem estão no HTML e são pintadas no primeiro
   quadro. A sequência de carregamento começa sem esperar o evento de load e está assentada em 1,2 s, com
   quatro elementos no máximo.
2. **Sem preloader, sem contador, sem barreira, sem cursor personalizado, sem captura da roda do mouse.** Suavização só pelo
   `Stage.smooth()` (Lenis com lerp 0,1-0,14, desligado no toque e no movimento reduzido): peso, nunca uma página
   que continua deslizando depois que a mão para.
3. **Curvas.** `--ease-out` para tudo abaixo de 600ms; `--ease-expo` para revelações de 800ms ou mais;
   `--ease-in-out` para varreduras e coisas que se deslocam; `--ease-exit` só para coisas que saem de vez;
   `linear` para movimento atrelado à rolagem e loops; `ease` simples para cor. Sem overshoot.
4. **Durações.** Clique 140ms; cor no hover 180-200ms; hover que move 300-400ms; menus 240ms; revelações
   700-900ms; aberturas de imagem 1.100-1.300ms; saídas com 60-70% da entrada correspondente.
5. **Cascatas.** Linhas 80-110ms; itens de lista 50-90ms; caracteres 20-40ms e só num título de uma a
   três palavras; quatro passos no máximo em qualquer sequência.
6. **Revelações.** Disparam uma vez, quando o topo do elemento está a 85-90% da altura da janela; sobem 12-32px
   ou de uma máscara de linha; nada à vista fica escondido por mais de 900ms; nada acima da dobra espera
   a rolagem.
7. **As cenas de rolagem são onde a página ousa.** Os grandes movimentos vêm da biblioteca de cenas
   (`references/pt-BR/scenes.md`): a ficha da direção sorteia duas ou três por página, cada uma construída sobre
   `assets/scenes/stage.js`, cada uma parada por uma a quatro telas, cada uma com uma versão para celular e uma
   composição final. Dentro de uma cena valem os números da própria cena (uma imagem pode crescer de uma
   janela até a tela inteira, o texto pode atravessar o palco, uma câmera pode voar por um campo de
   imagens); as regras 8 e 10 continuam valendo para o texto que o visitante está lendo.
8. **Fora das cenas, o deslocamento atrelado à rolagem fica discreto.** Linear e preso à barra de rolagem;
   parallax abaixo de 8% do elemento; escala entre 0,94 e 1,15; construído com scroll timelines dentro de
   `@supports`, estático sem elas. Outros palcos parados: sticky, cerca de uma tela por passo, três
   telas no máximo, uma linha de texto em toda tela parada.
9. **Um de cada.** Um movimento-assinatura (uma cena sorteada pode ser ele); uma imagem em movimento; um marquee no
   máximo. Uma seção discreta entre duas cenas, para que cada uma cause impacto.
10. **O texto continua legível.** Os preenchimentos começam em 45% de tinta; esmaecidos nunca abaixo de 40%; desfoque de no máximo 8px e some
    depois de assentar; nada se move por cima do texto que está sendo lido.
11. **Cor por capítulo** como cortes secos nas bordas das seções; a tinta do cabeçalho fixo acompanha em 300ms.
12. **Movimento horizontal.** Primeiro a fileira nativa de arrastar; a galeria lateral fixada só para fileiras com menos de
    três telas de comprimento, com suporte a teclado.
13. **De página em página.** View transitions, 480ms no máximo, desligadas no movimento reduzido.
14. **Movimento reduzido.** Todo estado escondido mora dentro de `prefers-reduced-motion: no-preference`; a
    página reduzida é a página final; os loops param. Duas em cada três páginas premiadas pulam isso, o que é um
    motivo para fazê-lo, não uma licença para pular.
