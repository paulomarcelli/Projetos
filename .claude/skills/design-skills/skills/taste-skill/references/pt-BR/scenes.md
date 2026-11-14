# Cenas de rolagem

Os grandes momentos de uma página: trechos da rolagem em que a página deixa de ser uma coluna de seções e
vira uma cena. Uma câmera voa por um campo de imagens, uma imagem cresce de uma janela até a tela
inteira, uma palavra se dobra sob a rolagem, um conjunto de fotografias orbita e pousa num grid. É disso
que os visitantes se lembram nos sites premiados, e é o que uma página feita só de seções arrumadinhas
nunca tem.

A biblioteca de cenas foi desmontada a partir de Sites of the Day recentes do Awwwards (outubro de 2026:
43 sites gravados quadro a quadro durante a rolagem, 261 cenas descritas, 30 tipos), refeita do zero em
código nosso, testada quadro a quadro na largura de desktop e de celular e com movimento reduzido, e
revisada contra as cenas de onde veio. Nada que pertença a um site está nelas. Até o
`library/scenes.json` ser lançado, o sorteio não traz nenhuma; uma página que precisa de uma cena
constrói a sua no palco (seção 8), com todas as regras daqui.

## Sumário

1. O que é uma cena
2. Pôr uma cena na página
3. Preencher a cena
4. Ajustar a cena à página
5. O celular, o movimento reduzido, sem script
6. Conferir a cena
7. Regras das cenas
8. Quando nenhuma cena da biblioteca serve
9. O catálogo

## 1. O que é uma cena

Uma seção alta cujo palco fica parado enquanto a página rola por ele. O palco é `position: sticky`
(gruda na tela enquanto a página rola); a seção tem (hold + 1) telas de altura, então o palco fica
parado por `hold` telas; uma timeline do GSAP é atrelada à rolagem, de 0 a 1. Nada captura a roda do
mouse: a barra de rolagem sempre diz a verdade, o teclado e o trackpad funcionam como em qualquer lugar,
e a cena termina.

O que uma cena não é: um fade com subida, um parallax pequeno, um rodapé sticky, um marquee (faixa de
texto que corre sozinha). Isso é a camada discreta (`references/pt-BR/motion.md`). Uma cena muda a tela inteira.

A ficha da direção sorteia duas ou três (seção 9 da ficha), de famílias diferentes, cada uma posta na
seção do argumento que ela consegue sustentar. Construa-as no passo 6, junto com a seção: uma cena é
composição, não decoração acrescentada no fim.

## 2. Pôr uma cena na página

Copie para o projeto o palco compartilhado e os arquivos da cena sorteada (`assets/scenes/stage.css`,
`stage.js`, `<id>.css`, `<id>.js`). O comentário no cabeçalho de cada arquivo de cena lista o markup que
ela espera e as opções dela; `assets/scenes/demo/<id>.html` é uma página completa, funcionando, para ler
ao lado.

```html
<head>
  <script>document.documentElement.classList.add('js')</script>
  <link rel="stylesheet" href="scenes/stage.css">
  <link rel="stylesheet" href="scenes/<id>.css">
</head>
<body>
  …
  <section class="scene" data-scene="<id>" data-options='{"hold": 3}' aria-label="…">
    <div class="scene-stage">
      <!-- o markup do cabeçalho do arquivo da cena, preenchido com o conteúdo desta página -->
    </div>
  </section>
  …
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
  <script src="scenes/stage.js"></script>
  <script src="scenes/<id>.js"></script>
  <script>Stage.smooth(); Stage.init();</script>
</body>
```

- Carregue o SplitText (`gsap@3.15.0/dist/SplitText.min.js`) só quando um arquivo de cena disser que precisa dele.
- `Stage.smooth()` acrescenta a rolagem com peso na roda do mouse (Lenis com lerp 0.12). Fica desligado
  no toque e no movimento reduzido. Deixe-o de fora numa página discreta; as cenas funcionam dos dois jeitos.
- `Stage.init()` liga todos os `[data-scene]` da página. Uma página com duas cenas carrega os dois arquivos.
- As versões são fixas. Não as troque por `@latest` nem por uma versão principal sem número fixo.

## 3. Preencher a cena

Uma cena é tão forte quanto o que vai nela. O cabeçalho do arquivo da cena e a linha "Content" da ficha
dizem quantas imagens e palavras ela leva; estas regras valem para todas:

- **Imagens de uma família só.** A mesma luz, o mesmo tratamento de cor, o mesmo tipo de assunto: um
  campo de fotos de banco de imagens que não combinam quebra a ilusão de um espaço único mais rápido que
  qualquer erro de tempo. Imagens reais do mundo do assunto (`assets.mjs`), as do próprio projeto ou as
  fotografias sorteadas, nessa ordem (`references/pt-BR/imagery.md`). Dimensione cada uma para o maior tamanho
  em que aparece e defina `width` e `height`.
- **Palavras que se leem num fôlego.** Uma frase de destaque parada tem de 4 a 12 palavras; as legendas
  têm de uma a quatro palavras, na fonte de texto, só com a inicial maiúscula. Uma frase de destaque na
  tela por vez.
- **A cena diz algo sobre o assunto.** Um voo da câmera pelos trabalhos do estúdio, a rota que uma
  remessa faz de verdade, os quatro cômodos da casa, a mudança de estado do produto. Uma cena cheia de
  imagens sem relação é truque, e é lida como truque.
- **Só conteúdo real.** Se a cena precisa de oito imagens do assunto e só há três, use o
  `--redraw scenes`; nunca complete com imagens provisórias.

## 4. Ajustar a cena à página

- Os arquivos de cena leem os tokens da página: `--ground`, `--ink`, `--muted`, `--accent`,
  `--font-display`, `--font-text` (com fallbacks). Defina-os no `:root` a partir da ficha, e a cena
  assume a cor e a tipografia da página. Confira a demo contra a sua página, não o contrário.
- A fonte display numa cena usa a fonte display sorteada e a regra da headline em duas linhas; as
  frases de destaque ficam no tamanho de frase de destaque.
- Deixe uma seção discreta entre duas cenas (uma seção de texto, uma lista, uma imagem simples), para
  cada uma ter seu impacto. Duas cenas coladas parecem um passeio só, comprido, e a segunda perde.
- Uma cena na primeira dobra tem de ser legível no progresso 0: o título, a frase e a ação estão lá no
  primeiro quadro (regra de movimento 1), e a cena só começa a se mexer quando o visitante rola.
- Dê um título à seção. Se o design não tem título visível na cena, a seção ainda leva um (`aria-label`
  na seção e um título de verdade na composição final).

## 5. O celular, o movimento reduzido, sem script

- **O celular.** Cada cena tem um plano para o celular no próprio arquivo: a mesma cena com outros
  números, uma versão mais simples, ou `phone: 'rest'`, em que o celular mostra a composição final. A
  rolagem por toque nunca é suavizada. Olhe a folha do celular com o mesmo cuidado que a do desktop.
- **Movimento reduzido e sem script.** A seção é uma seção comum, mostrando a composição final: o mesmo
  conteúdo, disposto para ser lido sem movimento. Nada fica escondido esperando um script. A checagem
  `reduced-hidden` do inspetor e a folha de movimento reduzido do `scenes.mjs` mostram isso.
- **Um CDN que falha** também cai na composição final (o palco acrescenta `.is-rest`). O inspetor
  reprova uma cena que fica parada no desktop (`scene-not-live`), então um script quebrado não passa.

## 6. Conferir a cena

```bash
node <skill>/scripts/scenes.mjs <page>        # cada cena em 0, 10 … 100%, desktop e celular, e com movimento reduzido
node <skill>/scripts/inspect.mjs <page>       # a checagem; com cenas na ficha, ele também filma a rolagem
```

O `scenes.mjs` grava uma folha de contato por cena e por largura em `.taste-skill/scenes/`. Leia todas.
Em cada quadro, pergunte: há uma coisa clara para olhar; dá para ler a frase de destaque na tela; alguma
coisa pipoca, fica em branco, é cortada ou cruza as palavras; ela está tão ousada quanto deveria? O
`desktop-film-NN.jpg` do inspetor mostra a rolagem da página inteira, um terço de tela por vez: confira
se as cenas e as seções discretas entre elas fazem um ritmo, e se nada entre elas fica vazio.

## 7. Regras das cenas

1. **Duas ou três por página,** de famílias diferentes, com uma seção discreta entre elas. O inspetor
   alerta acima de quatro (`many-scenes`) e quando as cenas ocupam mais de 60% da página (`scene-heavy`).
2. **Cada uma fica parada de uma a quatro telas:** mais ou menos uma tela por batida da história; um
   trecho parado sem nada novo para mostrar é cortado, não esticado.
3. **Só rolagem nativa.** Nada de capturar a roda do mouse, nada de travar a página, nada de cenas que
   só rodam com um clique. Suavização só pelo `Stage.smooth()`.
4. **Legível nos pontos de pausa.** A frase de destaque na tela se lê inteira; nada passa por cima do
   texto enquanto ele está sendo lido; texto sobre imagem tem um véu (camada escura translúcida) chapado
   ou uma área calma embaixo.
5. **Dentro de uma cena valem os números da cena** (regra de movimento 7): uma imagem pode crescer de
   uma janela até a tela inteira, a tipografia pode atravessar o palco, uma câmera pode voar pelas
   imagens. Fora das cenas, valem os limites discretos de `references/pt-BR/motion.md`.
6. **Transform, opacity, clip-path.** Nada que force layout a cada quadro. Imagens decodificadas antes
   de se moverem.
7. **As regras da casa valem dentro das cenas:** nada de legendas em monoespaçada, nada de contadores
   01/07 (um simples "3 de 7" se for preciso contar), nada de gradientes (véus chapados), nada de sombras
   ou brilhos, nada de decoração com fios finíssimos, nada de partículas decorativas, nada de violeta.
8. **A composição final é projetada,** não é um improviso de última hora: é o que o movimento reduzido,
   um script que falhou e alguns celulares veem.

## 8. Quando nenhuma cena da biblioteca serve

Primeiro sorteie de novo (`--redraw scenes`). Se o briefing realmente precisa de uma cena que a
biblioteca não tem, construa-a no mesmo palco, para ela herdar as proteções:

```js
Scenes['my-scene'] = (root, opts = {}) => Stage.scene(root, {
  hold: opts.hold ?? 2,          // telas em que o palco fica parado
  scrub: opts.scrub ?? true,     // true quando o Lenis roda; sem ele, 0.4-0.8 dá sensação de peso
  phone: 'same',                 // ou 'rest', ou { hold, build } para um plano de celular
  build(tl, { q, phone }) {      // as posições são frações da cena, 0-1
    tl.fromTo(q('.picture'), { clipPath: 'inset(30% 30% 30% 30%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6 }, 0)
      .to(q('.title'), { yPercent: -40, autoAlpha: 0, duration: 0.25 }, 0.7);
  },
});
```

e escreva primeiro o CSS da composição final, depois o layout vivo, sob `.scene.is-live`. Confira-a com
o `scenes.mjs` como qualquer outra.

## 9. O catálogo

(Gerado a partir de `library/scenes.json`; o sorteio sai dele. `node <skill>/scripts/draw.mjs --list
scenes` o imprime.)
