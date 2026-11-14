# Cor

A ficha da direção sorteia uma paleta com papéis nomeados. Este arquivo diz como aplicá-la para a página
parecer decidida, e não apenas tingida.

## Sumário

1. O que o estudo mediu
2. Os papéis
3. Proporção
4. Superfícies sem fios nem sombras
5. Campos de cor
6. Páginas escuras
7. Cor e fotografias
8. Contraste
9. Famílias proibidas, e o que "quente" quer dizer aqui

## 1. O que o estudo mediu

- 41% das páginas estudadas são escuras, 59% claras. Um quarto fica sobre branco puro; 12% sobre preto puro.
- Esquemas, como o painel os classificou: monocromático com uma cor de destaque 23%, neutro claro 22%,
  neutro escuro 14%, várias cores chapadas 13%, estritamente em duas cores 12%, cor levada pelas
  fotografias 9%, um campo de cor saturado 6%.
- Os botões são neutros (preto, branco, cinza) em 52% dos sites. Um botão colorido é uma escolha, não
  uma exigência.
- Preenchimentos em gradiente aparecem em 22% dos sites de nota alta e em 52% dos fracos; texto em
  gradiente, em 2% contra 13%.
- Um site em 246 tem botão principal terracota, e nenhum tem botão violeta. Essas são cores de páginas
  geradas, não da galeria. Fundos off-white quentes existem (32 sites), quase sempre com tinta escura
  ou verde, e não com cor de destaque laranja.
- Os sites de nota alta trocam o campo de cor da página entre as seções com mais frequência (mediana de
  dois fundos de seção, contra um).

## 2. Os papéis

```css
:root {
  --bg: …;          /* o fundo: a maior parte da superfície */
  --surface: …;     /* a um degrau de tom do fundo: painéis preenchidos, campos de formulário, blocos */
  --ink: …;         /* texto principal e as marcas mais fortes */
  --muted: …;       /* texto secundário; ainda passa no contraste sobre --bg */
  --accent: …;      /* a única cor de destaque */
  --accent-ink: …;  /* texto sobre a cor de destaque */
  /* --field-1 … --field-n e suas tintas, quando a paleta tem campos de cor por seção */
}
```

Use os tokens para todas as cores do build. Um hex solto num componente é uma segunda paleta começando.
Não acrescente cinzas entre os papéis: se precisar de um texto mais discreto, é `--muted`; se precisar
de uma superfície mais discreta, é `--surface`.

## 3. Proporção

Decida as fatias antes de colorir qualquer coisa e confira-as na captura de tela:

- **Fundo:** 70–90% da página.
- **Tinta:** o texto e talvez uma seção invertida (tinta como fundo, fundo como tinta).
- **Cor de destaque:** menos de 5% de qualquer tela. Ela marca a ação e no máximo uma outra coisa que
  se repete. No momento em que aparece em cinco lugares, deixa de querer dizer "aqui".

Paletas com campos de cor (chapada e chamativa, pastel) funcionam de outro jeito: cada seção é um campo
de cor em força total, e a regra de proporção vale dentro de cada seção (o campo, a tinta dele, mais nada).

A cor de destaque não é para títulos, ícones, marcadores de lista, bordas ou sublinhados, a menos que a
ficha da direção diga. Uma headline é tinta.

## 4. Superfícies sem fios nem sombras

Com fios e sombras proibidos, uma superfície se distingue do fundo só pelo tom:

```css
.panel { background: var(--surface); }          /* 2–6 pontos de luminosidade de --bg */
.field { background: var(--surface); border: 0; } /* campos: preenchidos, com estado de foco claro */
.field:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- Um degrau basta. Se um painel não se destaca, aumente o padding ou separe com espaço antes de partir
  para um segundo tom.
- Não ponha painel dentro de painel.
- Imagens não precisam de moldura. Se uma fotografia clara se dissolve num fundo claro, troque o recorte
  ou ponha-a sobre `--surface`; não a contorne.
- Uma barra grossa (4px ou mais) em tinta ou na cor de destaque é um elemento gráfico, permitido onde a
  direção o usa. Uma linha de 1px não é.

## 5. Campos de cor

Uma seção que troca a cor do fundo inteiro é o gesto de cor mais forte que existe, e ela substitui de
uma vez fios divisórios, cards e decoração de fundo.

- Os campos se encontram de borda a borda, numa linha seca. Nada esmaece.
- Cada campo tem a sua tinta designada pela paleta. Nunca ponha `--muted` num campo colorido; use a
  tinta do campo em força total, ou a 70% de opacidade para o texto secundário, se ainda passar no contraste.
- Campos vizinhos devem diferir em luminosidade, não só em matiz, senão a página vibra.
- Ordene-os como capítulos: abra forte, dê uma pausa, surpreenda, feche escuro ou bem claro.
- A cor de tema (meta theme color) da página e a navegação seguem o primeiro campo.

## 6. Páginas escuras

- Ponha `color-scheme: dark` na raiz, para os controles de formulário e as barras de rolagem acompanharem.
- O fundo é um tom profundo, com um leve tingimento da paleta, e a tinta é um claro suave, não `#fff`
  sobre `#000`, a menos que a paleta sorteie exatamente isso para uma direção em duas cores, seca.
- O texto secundário é onde as páginas escuras falham: confira `--muted` contra o fundo (4,5:1).
- A profundidade no escuro vem de um degrau de superfície mais claro, nunca de brilhos ou luz colorida.
- Use pesos de fonte mais leves do que usaria numa página clara.

## 7. Cor e fotografias

- Quando as fotografias levam a cor, a interface fica neutra e tira a tinta do tom mais escuro das imagens.
- Não lave uma fotografia com a cor da marca. Ou deixe-a como está, ou assuma um tratamento de verdade
  para todas as imagens da página (todas em tons de cinza, ou todas intocadas).
- Texto sobre fotografia precisa de uma região calma. Se não houver, tire o texto de cima da imagem. Um
  véu (camada escura translúcida) neutro (preto ou a cor da tinta, 30–55% de opacidade, chapado ou
  esmaecendo só sobre a área do texto) é o único gradiente que o inspetor aceita.
- Um campo chapado tirado de uma fotografia (o céu, a sombra dela) faz uma seção combinar com aquela imagem.

## 8. Contraste

- Texto corrido com 4,5:1 ou mais; fonte display e números grandes com 3:1 ou mais; as paletas sorteadas
  atingem 7:1 para tinta sobre fundo.
- O `inspect.mjs` calcula o contraste do texto sobre fundos chapados e reprova o que fica abaixo de 2,6:1.
  Ele não enxerga texto sobre fotografias: confira esses você mesmo, nas capturas.
- Não baixe a opacidade do texto para deixá-lo "suave" sem conferir a proporção resultante.
- Estados de foco e de hover aumentam o contraste, nunca o reduzem.

## 9. Famílias proibidas, e o que "quente" quer dizer aqui

O inspetor reprova estas:

- **Creme com terracota.** Um fundo creme-amarelado (matiz entre 22 e 62, mais ou menos, claro e
  visivelmente saturado) com cor de destaque ferrugem, argila ou laranja queimado é o estilo da casa dos
  assistentes de IA e das páginas que eles geram. Cada metade sozinha já é suspeita; juntas, são
  inconfundíveis.
- **Violeta e índigo.** A primeira onda de páginas geradas foi roxa; ainda é lida assim.

Se o briefing pede calor, tire-o de um fundo pedra, osso ou massa de vidraceiro de croma baixo (saturação
abaixo de uns 15%), de uma tinta verde-escura, marrom ou bordô, de fotografias, ou de um campo quente
inteiro (mostarda, vermelho-tomate, rosa) usado chapado e com convicção. Calor não é bege.

Se a própria marca é dona de uma das cores proibidas, a cor é da marca e você a mantém: use
`--keep palette`, passe `--allow palette-purple` (ou a regra correspondente) ao inspetor e registre isso
no relatório.
