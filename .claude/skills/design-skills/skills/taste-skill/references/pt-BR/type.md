# Tipografia

A tipografia é a maior parte do que o visitante vê e a maior parte do que faz uma página parecer desenhada ou montada.
A ficha da direção sorteia para você um sistema tipográfico (fontes, pesos, ajustes). Este arquivo diz como usá-lo.

## Sumário

1. O que o estudo mediu
2. A escala: poucos tamanhos, bem distantes
3. Compor texto display
4. Compor o texto corrido
5. Carregar as fontes direito
6. Uma família ou duas
7. Detalhes que separam texto composto de texto digitado
8. Erros que o inspetor não vê

## 1. O que o estudo mediu

De 202 sites mensuráveis entre os 247 estudados (Chrome, 1440×900 e 390×844):

| | Mediana | Metade do meio | Nota |
| --- | --- | --- | --- |
| Tamanho da headline do hero | 72 px (5,0vw) | 43–109 px | Sites de nota alta: mediana de 6,0vw |
| Maior texto da página | 6,4vw | até 10,4vw | Sites de nota alta 8,4vw, sites fracos 5,0vw |
| Headline do hero no celular | 40 px | 32–59 px | |
| Tracking (espaço entre letras) do hero | -0,01em | -0,03 a 0 | Mais apertado à medida que o tamanho cresce |
| Entrelinha do hero | 1,0 | 0,95–1,1 | |
| Tamanho do texto corrido | 16 px | 14–18 px | |
| Headline ÷ texto corrido | 4,3 | | Sites de nota alta 4,7 |
| Fontes de fato usadas | 2 | 31% usam uma, 45% duas, 22% três | |
| Peso do hero | regular 48%, medium 18%, bold ou mais pesado 22% | | Texto grande não precisa ser negrito |
| Hero em caixa-alta | 24% | | |
| Hero centralizado | 39% | | 52% nos sites fracos |

Duas lições. Primeiro, o contraste de tamanho é a alavanca principal, e os melhores sites puxam mais forte.
Segundo, o peso não é: metade dos heros está num peso regular. Escala e espaçamento dão confiança
ao texto; o negrito é uma opção entre várias.

## 2. A escala: poucos tamanhos, bem distantes

O painel descreveu cerca de 30 dos 114 sites mais fortes como usando dois ou três tamanhos de fonte sem nada
no meio, e nenhum como usando uma escala graduada de cinco ou seis degraus. Então: um tamanho display, um tamanho de texto
e um tamanho pequeno sustentam a página; um tamanho de abertura (lead) e um de título existem para quando forem necessários. Cinco
é o teto. A falha comum são nove tamanhos todos próximos uns dos outros (16, 18, 20, 24, 28,
32…), que vira uma papa. Escolha degraus claramente diferentes:

```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);   /* 13–14 px  legendas, texto legal */
  --step-body:  clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);    /* 17–19 px  parágrafos */
  --step-lead:  clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);      /* 20–26 px  frase de apoio, texto corrido grande */
  --step-head:  clamp(2rem, 1.3rem + 3.2vw, 4rem);             /* 32–64 px  títulos de seção */
  --step-display: clamp(3rem, 1rem + 9vw, 9rem);               /* definido pela planta do hero */
}
```

- `--step-display` é da direção. Um logotipo-monumento tem 16–24vw; a headline do instrumento discreto (quiet instrument) tem
  28 px. Use o tamanho que a planta do hero dá, como um `clamp()`, para ele acompanhar a
  janela mas ter limite no celular e em telas muito largas.
- Mantenha a distância: o tamanho display deve ser pelo menos quatro vezes o do texto corrido no desktop, e nada
  deve ficar entre `--step-lead` e `--step-head`, a não ser que o design precise mesmo de um sexto tamanho.
- Resista a um tamanho de "subtítulo" para cada card e rótulo. Se dois tamanhos parecem quase iguais, iguale-os.

## 3. Compor texto display

Texto grande expõe um espaçamento que fica invisível no tamanho de texto. Aplique tudo isto a qualquer coisa acima de 40 px:

```css
.display {
  font-size: var(--step-display);
  line-height: 0.95;              /* 0,85–1,05; mais apertada para caixa-alta e fontes condensadas */
  letter-spacing: -0.035em;       /* -0,02 a -0,05em; use o valor da ficha da direção */
  font-kerning: normal;
  text-wrap: balance;
  max-width: 14ch;                /* escolha a largura da linha para as linhas quebrarem onde você quer */
  margin: 0;
}
```

- **O tracking acompanha o tamanho.** Quanto maior o texto, mais apertado ele precisa ser; um valor certo para
  120 px sufoca 32 px. Defina o tracking por degrau, não uma vez para todos os títulos.
- **Entrelinha abaixo de 1,0 precisa de conferência.** Procure choques entre as descendentes e as ascendentes ou os
  acentos da linha seguinte. Headlines de duas linhas facilitam conferir isso a olho.
- **Tudo em caixa-alta** pede um tracking levemente aberto (0 a +0,03em), mesmo em tamanho display, e entrelinha em torno
  de 0,9.
- **Alinhamento óptico.** Letras grandes com a borda esquerda redonda ou diagonal (O, C, A, T, W) parecem recuadas.
  Puxe a headline para a esquerda em cerca de 0,04–0,06em (`margin-left: -0.05em`) para ela se alinhar opticamente com o
  texto embaixo.
- **Texto da largura da janela.** Para uma linha que tem de atravessar a tela, dimensione em `vw` e confira a 390 e
  1440; ponha `white-space: nowrap` e deixe o contêiner cortar em vez de quebrar. Calcule o tamanho pelo
  número de caracteres: `font-size ≈ container width ÷ (characters × k)`, com k de `copy.md` §2.
- Nunca ponha sombra de texto, contorno ou preenchimento em gradiente num texto display.

## 4. Compor o texto corrido

```css
body { font-size: var(--step-body); line-height: 1.5; font-kerning: normal; text-rendering: optimizeLegibility; }
p { max-width: 62ch; text-wrap: pretty; margin: 0; }
p + p { margin-top: 0.9em; }
.lead { font-size: var(--step-lead); line-height: 1.35; max-width: 40ch; }
small, .caption { font-size: var(--step-small); line-height: 1.45; }
```

- Largura da linha: 45–75 caracteres. Mais larga que isso, o olho perde a linha seguinte; o inspetor avisa
  a partir de cerca de 88.
- Entrelinha: 1,45–1,6 no texto corrido, mais apertada (1,3–1,4) no tamanho maior da abertura, mais folgada para leitura longa.
- O texto secundário é a mesma fonte numa tinta mais suave (`--muted`), não um peso mais leve e não menor
  que 13 px.
- Não centralize parágrafos de mais de três linhas. Não justifique.
- Texto claro sobre fundo escuro parece mais pesado: desça um degrau de peso ou acrescente 0,01em de tracking, e aumente
  um pouco a entrelinha.

## 5. Carregar as fontes direito

A ficha dá uma tag `<link>`. Use exatamente como está; não troque por uma fonte de que você goste mais.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="…from the direction sheet…" rel="stylesheet">
```

```css
:root {
  --font-display: "Family From Sheet", "Helvetica Neue", Arial, sans-serif;
  --font-text: "Family From Sheet", Georgia, serif;
}
```

- Peça só os pesos que você usa (em geral dois ou três no total).
- Sempre dê uma pilha de fallback do mesmo tipo geral (sem serifa para sem serifa, serifada para serifada).
- Num framework, use o carregador de fontes dele com a mesma família e os mesmos pesos (`next/font/google`, ou um
  `@font-face` hospedado no próprio projeto com `font-display: swap`). As fontes do Fontshare carregam da folha de estilo de
  `api.fontshare.com` que está na ficha.
- Depois do build, o `inspect.mjs` informa as famílias que de fato renderizaram. Se ele avisar que uma fonte
  não carregou, as capturas mostram um fallback e nada que você julgue a partir delas é real. Corrija o link
  primeiro.

## 6. Uma família ou duas

Um terço dos sites estudados usa uma única família para tudo, e esse é o jeito mais seguro de parecer
coerente. Quando o sistema sorteado tem duas fontes:

- Dê a cada uma uma função e nunca as troque: uma compõe as headlines, a outra compõe todo o resto.
- Não introduza uma terceira fonte para rótulos, números ou citações.
- Não misture duas fontes dentro de uma headline.
- O itálico é para títulos de obras e ênfase real dentro de parágrafos, nunca como decoração.

## 7. Detalhes que separam texto composto de texto digitado

- Aspas e apóstrofos curvos, travessões de verdade, reticências de verdade (veja `copy.md` §7).
- `font-variant-numeric: tabular-nums` para preços, tabelas, datas em colunas; `oldstyle-nums` combina com
  texto corrido serifado.
- `text-underline-offset: 0.18em; text-decoration-thickness: 0.07em` nos links, para o sublinhado passar longe das
  descendentes.
- `hyphens: none` nos títulos. `overflow-wrap: anywhere` só em URLs ou e-mails longos.
- Um título pertence ao texto que vem depois dele: o espaço acima de um título é pelo menos o dobro do espaço abaixo.
- `::selection { background: var(--accent); color: var(--accent-ink); }` e um contorno de
  `:focus-visible` visível na cor de destaque, para até os estados do próprio navegador fazerem parte do design.
- Não mude o peso no hover; a linha se rearranja.

## 8. Erros que o inspetor não vê

- Uma headline que passa na regra das duas linhas mas quebra mal: uma palavra órfã na segunda linha, ou uma quebra
  que parte uma expressão ("Banquetas para cozinhas / pequenas"). Decida a quebra você mesmo.
- Texto display tão apertado que as letras se encostam, ou tão solto que se desmancha.
- Um hero confiante seguido de títulos de seção quase do mesmo tamanho. Mantenha um tamanho dominante por tela.
- Texto corrido composto na fonte display quando essa fonte foi desenhada só para tamanhos grandes.
- Tudo em negrito. Se toda linha tem ênfase, nenhuma tem.
