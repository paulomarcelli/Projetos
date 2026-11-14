# Layout

Como a página se monta: margens, o grid, onde fica o texto, como as seções se diferenciam, a navegação,
os finais e o celular. A ficha da direção dá as composições específicas; este arquivo dá os hábitos
por trás delas, tirados das anotações do painel sobre os 114 sites estudados com nota 7,3 ou mais (as
contagens abaixo foram feitas à mão a partir dessas anotações, então leia como "cerca de").

## Sumário

1. O que as páginas fortes fazem
2. Margens e o grid
3. Onde fica o texto
4. Espaço vazio
5. A moldura: margens, equilíbrio e títulos
6. Seções: levar a ideia, variar o arranjo
7. Navegação
8. Finais
9. O celular é uma segunda composição
10. Como as páginas falham

## 1. O que as páginas fortes fazem

- **Margens apertadas, conteúdo até as bordas.** Cerca de 45 dos 114 usam margens externas de 32 px ou
  menos; só cerca de 8 usam 80 px ou mais. O contêiner centralizado de 1.100–1.300 px é minoria entre os
  sites fortes e a moldura de sempre dos que o painel chamou de batidos.
- **O texto pende de uma linha fora do centro.** Cerca de 22 ancoram o texto numa linha fixa que não é
  nem o centro nem a margem: a um terço da largura, a 42%, no ponto médio.
- **Dois ou três tamanhos de fonte, sem nada no meio** (cerca de 30): um muito grande com um pequeno, ou
  tudo pequeno, com a escala entregue à imagem.
- **Uma coisa por tela** (cerca de 20): uma frase de destaque, um objeto, um projeto.
- **Seções diferenciadas pelo fundo.** Cerca de 20 trocam a cor do fundo inteiro a cada seção; cerca de
  12 alternam claro e escuro; cerca de 10 nunca trocam e separam só pelo espaço.
- **Seções recompostas, não repetidas.** Cerca de 14 rearranjam cada seção; cerca de 12 alternam uma
  tela de imagem sangrada (full-bleed) com uma tela de texto quase vazia.
- **O sistema quebrado uma vez, de propósito** (cerca de 14): uma linha centralizada numa página dividida, um card
  de papel numa página escura, a cor guardada até a última tela.
- **Muitas vezes, nenhuma barra de navegação** (cerca de 45), e finais que são uma cena desenhada, não colunas
  de links.
- **Poucas palavras.** Mediana de 575 no estudo inteiro; alguns dos melhores têm menos de 200.

## 2. Margens e o grid

```css
:root {
  --margin: clamp(1rem, 2.2vw, 2rem);   /* 16–32 px: apertada, para o conteúdo chegar às bordas */
  --gutter: clamp(0.75rem, 1.4vw, 1.5rem);
}
.wrap { padding-inline: var(--margin); }
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: var(--gutter); }
```

- Um par de margens e um grid para a página inteira. Toda borda esquerda é uma linha de coluna.
- Não embrulhe a página num contêiner `max-width: 1200px; margin: auto` por reflexo. Deixe as coisas grandes
  (texto, imagens, campos de cor) ocuparem a largura toda, e limite só a largura da linha do texto corrido
  (`max-width` em `ch` no parágrafo, não na página).
- Em telas muito largas, limite o layout a cerca de 1.760–1.920 px, ou faça o texto dimensionado em `vw` parar de crescer com
  um `clamp()`.
- As direções que pedem margens largas (fotografias irregulares (uneven photographs), o instrumento discreto (the quiet instrument)) dizem isso na
  ficha; siga a ficha.
- Nunca desenhe o grid. Linhas de coluna, miras e guias são enfeites proibidos aqui, mesmo estando
  na moda; o grid se sente pelo alinhamento.

## 3. Onde fica o texto

- **Escolha a linha-âncora e reutilize.** Se a headline do hero começa na coluna 5, os títulos das
  seções, o valor do preço e os links do rodapé também começam ali. Duas ou três linhas-âncora na
  página inteira; seis quer dizer que nada foi decidido.
- **Fora do centro ganha do centralizado.** Um título no terço esquerdo com o parágrafo na última coluna
  da direita, na mesma linha de base e sem nada no meio; uma headline no terço de baixo, sob um vazio
  proposital; texto encaixado nos cantos, com o meio entregue à imagem.
- **Pontas opostas.** Dois textos curtos nas pontas opostas de uma linha de base (o nome à esquerda, uma descrição de uma linha
  à direita) é a alternativa mais comum à pilha centralizada.
- **Centralizar é uma decisão.** Quando uma página forte centraliza, ela usa um eixo com laterais vazias e largas e um
  único elemento por tela, não uma pilha centralizada de título, parágrafo e dois botões.
- **Linhas para copy longa:** o título no terço esquerdo, o texto nos dois terços da direita, a mesma divisão em
  todas as linhas da página.
- Escalone com moderação: uma segunda linha recuada em um terço, para uma headline de duas linhas descer em degrau pela tela.

## 4. Espaço vazio

Espaço vazio é posicionado, não é sobra. No estudo de 97 Sites of the Day capturados em outubro de 2026,
os leitores julgaram cada área vazia grande ou como uma pausa, que algo fecha, ou como um buraco, que nada
fecha. Os sites fortes têm muitas pausas. Cerca de metade deles ainda deixa pelo menos um buraco, e os
buracos são o que os visitantes apontam ("espaços em branco grandes e aleatórios").

**Um vazio está posicionado quando algo o fecha.** Nas anotações dos leitores, quem fecha é, na maioria das vezes:

- a própria imagem (céu, chão, o objeto, o filme), com o texto encaixado na borda dela;
- uma imagem do outro lado do vazio: a fotografia na ponta de uma faixa vazia, a fileira de largura total
  subindo sob uma frase de destaque, a imagem oposta num escalonamento;
- o texto: uma headline grande o bastante para cobrir o espaço, ou dois textos curtos nas duas pontas de uma
  linha de base;
- numa página de uma tela, o logotipo, a navegação e um dado nos cantos, como o passe-partout em volta de
  uma gravura.

Cerca de um em cada cinco fechamentos no estudo é um fio finíssimo ou uma linha de grid. Esse recurso é proibido aqui; feche o
vazio com a imagem, o texto, um degrau no tom do fundo ou um campo de cor chapada.

**De onde vêm os buracos.** Em ordem de frequência no estudo:

1. Um intervalo entre seções esticado demais: faixas de 250–760 px de fundo liso.
2. Texto numa metade da seção e nada na outra.
3. Conteúdo que chega atrasado: uma revelação que ainda não disparou, e o visitante rola sobre fundo vazio enquanto as
   palavras aparecem em fade.
4. Um bloco curto esticado até uma tela inteira: um rodapé com preenchimento até a altura da janela, o título de uma seção
   sozinho numa tela inteira.
5. Uma cena fixada que não sustenta quase nada por várias telas.
6. Imagens de alturas diferentes alinhadas pelo topo numa fileira, deixando um buraco sob a mais curta.

**Regras**

- Decida onde fica o vazio e diga o que o fecha. Se nada fecha, é um buraco: leve a imagem da seção
  para ele, aumente o elemento principal ou tire o espaço.
- Mantenha o vazio limpo: nenhuma legenda solta, nenhuma forma decorativa, nenhuma marca-d'água clarinha, nenhuma linha de grid.
- No desktop, as seções ficam a 120–240 px umas das outras, contando da última linha de uma à primeira linha da
  seguinte (a mediana no estudo é de cerca de 230–250 px), e a 72–112 px no celular. Uma troca de cor de
  fundo permite um intervalo um pouco menor. Mais de cerca de 40% de uma tela de fundo liso entre duas
  seções é um buraco.
- O intervalo entre seções é claramente maior do que qualquer intervalo dentro de uma. Coisas relacionadas ficam perto e
  as não relacionadas, longe; um título tem pelo menos o dobro de espaço acima do que abaixo.
- Nenhum trecho da página com mais de cerca de meia tela de altura fica sem nada. No estudo, trechos de uma
  tela ou mais sem nada na página eram quase sempre a pista de rolagem de uma cena fixada; o
  palco fixado tem então de mostrar algo em cada posição da rolagem.
- O conteúdo está no lugar já na primeira pintura. Uma entrada move o que já está lá (veja `motion.md`);
  ela nunca deixa uma tela de fundo vazio enquanto as palavras chegam.
- Dimensione a seção pelo conteúdo. `min-height: 100vh` é de uma seção que preenche a tela, não
  de um rodapé ou de um título sozinho.
- Numa fileira de imagens de alturas diferentes, alinhe as bases ou ponha algo sob a mais curta,
  ou recorte a fileira numa proporção só.
- Uma pausa é uma coisa só numa tela: uma única linha, um objeto, uma imagem ou um campo de cor. No máximo
  uma vez por página. Uma tela de nada nunca é uma pausa, e o inspetor reprova duas telas quase vazias.
- Quando uma seção parece vazia, a resposta quase nunca é "acrescentar algo". Aumente o elemento principal
  ou corte a seção.

## 5. A moldura: margens, equilíbrio e títulos

A moldura é o que os leitores julgam antes de qualquer detalhe: "sem uma margem boa", "tudo jogado para um
lado", "sem título claro", "seções aleatórias e confusas". O inspetor mede cada uma dessas coisas. Os números
são do estudo de 97 Sites of the Day (outubro de 2026).

**Um par de margens iguais.**

- As margens esquerda e direita são iguais, em todas as larguras. Nos sites estudados com seções
  que rolam, os dois lados batem por poucos pixels: 16 e 16, 20 e 21, 32 e 32, 140 e 137. Nenhuma
  página forte do estudo estava empurrada para um lado.
- A margem de costume é apertada: mediana de cerca de 28 px a 1440, metade dos sites entre cerca de 18 e 45 px, alguns
  com 80 px ou mais. Aqui ela é de 16–32 px (seção 2), e nunca menos de 16 px em nenhuma largura, no celular
  inclusive. Cerca de um site premiado em sete põe o texto a 8–15 px da borda; esse hábito de estúdio
  fica excluído aqui.
- A navegação fica nas mesmas margens do conteúdo. O defeito pequeno mais comum no estudo é um
  cabeçalho num recuo e a página em outro (40 px contra 20 px, ou 34 px à esquerda contra 10 px à
  direita).
- Um sangrado é proposital e parte da margem: uma fileira de imagens que sai pela borda direita
  começa na margem esquerda; uma linha display que sangra começa ou termina numa margem. Um sangrado nunca move a
  margem.
- A assimetria mora dentro da moldura: uma linha-âncora fora do centro (a um terço da largura, a 42%, a linha central)
  sobre margens simétricas.

**Use a largura que a página estabeleceu.**

- No estudo, cerca de uma seção de texto em cem deixa metade da largura vazia. Texto que fica numa
  metade é comum, em mais ou menos um site em três, mas a outra metade então mostra a imagem da própria seção
  (na maioria das vezes), uma imagem sangrada atrás do texto, uma segunda coluna, uma lista ou um número.
- Quando o texto ocupa um lado, ponha a imagem, a segunda coluna, a lista ou o número grande no
  outro. Nunca deixe a outra metade para o fundo liso.
- O meio também conta: um card na borda esquerda e um botão sozinho na direita, com o terço do meio
  vazio, é o mesmo buraco.
- A primeira dobra também conta. Quando a frase e o botão ocupam o terço esquerdo acima de um nome
  encaixado no pé, o canto superior direito mostra algo (a imagem ou o filme, um dado, a ação) ou
  o nome cresce até encontrá-los; nos testes, 60% de uma primeira dobra deixados como fundo liso sob a
  navegação foram lidos como buraco, e o inspetor agora avisa quando um bloco vazio ocupa 28% da primeira
  dobra ou mais.
- Uma linha display ajustada à largura é ajustada por medição (um script pequeno que define o tamanho dela a partir
  da caixa de conteúdo, ou texto em SVG com `textLength`), nunca por um tamanho chutado para uma fonte: um nome que
  começa na margem e passa alguns pixels da outra borda parece erro.
- Uma composição centralizada tem um eixo, laterais iguais e uma coisa nele, não uma pilha de título,
  parágrafo e dois botões.

**Um título que diz o que é isto, na primeira dobra.**

- Perguntados se um estranho conseguiria dizer o que é a página em cinco segundos, os leitores viram que 40 das
  97 primeiras dobras dizem isso em palavras, 42 dizem só por imagens, letras miúdas ou um nome solto,
  e 15 não dizem de jeito nenhum. Esse último grupo perdeu pontos de usabilidade e de conteúdo, não de design.
- Só o tamanho não resolve: 66 das 97 primeiras dobras trazem uma linha em tamanho display, mas 26 delas são
  um nome, um slogan ou um lugar, sem nada que diga o que é oferecido.
- A primeira dobra tem um `h1`, em tamanho display (32 px ou mais no desktop; nas primeiras dobras
  claras do estudo, quase sempre 50–150 px), de no máximo duas linhas, que diz o que é isto: o nome com
  o que ele faz, o produto com aquilo para que serve, o evento com a data e o lugar. Se o `h1` é
  o nome, a linha embaixo dele, com 18 px ou mais, diz o que a coisa é.
- Ele está lá já na primeira pintura. Cerca de um terço das páginas estudadas ainda mostrava uma tela de carregamento ou nada legível aos 4,5
  segundos.

**Um título em cada seção.**

- 82% das seções de texto dos sites estudados abrem com um título: mediana de 57 px (40–96 px na
  metade do meio), cerca de três vezes e meia o tamanho do texto corrido, uma ou duas linhas.
- Os títulos começam na margem externa ou na linha-âncora interna da página (no estudo, cerca de um terço
  cada) e no mesmo lugar em todas as seções. Cerca de um quarto dos títulos do estudo é
  centralizado; aqui, centralize um momento por página.
- Onde uma seção estudada não tem título, o substituto de costume é um rótulo pequeno: caixa-alta, mono ou um número
  entre colchetes. Os três são proibidos aqui. Ponha as palavras do rótulo num título, na fonte dos títulos, no
  tamanho de seção ("Os quartos", "Como funciona", "Preços"), alinhe na linha-âncora e deixe a primeira
  frase levar o resto.
- Uma frase de destaque só pode abrir uma seção como título quando nomeia o que a seção contém.

## 6. Seções: levar a ideia, variar o arranjo

A falha mais comum em todas as faixas de nota é uma primeira dobra marcante seguida de blocos batidos:
cards com ícone, uma fileira de três, um accordion, um rodapé de colunas de links. Cerca de 25 dos sites estudados perdem
pontos assim, inclusive vários acima de 7,5.

- **A ideia sobrevive até o último pixel.** Pergunte a cada seção, preços e FAQ inclusive: o que a
  ideia da página faz aqui? Se a página é um cardápio, os preços são linhas de cardápio. Se o nome é um
  monumento, o rodapé é o nome de novo. Se a forma do objeto é o motivo, o botão e as máscaras das
  imagens o levam.
- **Duas vizinhas nunca dividem o mesmo layout.** Use a forma de cada planta sorteada (lista, dividida, frase de destaque,
  sangrada, mosaico, tabela, faixa, fixada …). Conte as formas na captura de tela; uma forma usada três vezes
  é o template aparecendo.
- **Alterne denso e vazio, imagem e texto, claro e escuro**, para a rolagem ter ritmo.
- **Um módulo repetido é só para arquivos** (um índice de trabalhos, um cardápio, uma programação). Em qualquer outro lugar,
  a repetição parece kit.
- **Quebre o sistema uma vez.** Depois que a página estabeleceu a regra, uma exceção planejada (uma única
  linha centralizada, uma seção invertida, uma imagem numa escala diferente) é o que torna a regra visível.
- **Páginas curtas estão ótimas.** Um quarto dos sites estudados tem uma ou duas telas. Não acrescente seções
  para parecer completo; cada uma tem de levar uma afirmação (veja `copy.md` §1).

## 7. Navegação

- A forma simples: o logotipo numa ponta, de três a cinco links de texto, uma ação, tudo no tamanho do texto, sobre o
  fundo da página, sem barra, borda nem fundo próprio. A mediana de links no estudo é 3.
- Também é normal ter menos: links pequenos nos cantos, uma única ação, ou a navegação
  dobrada dentro do conteúdo (uma lista dos títulos das seções que é ela mesma o índice).
- Se ela fica fixa, nunca pode ficar por cima do conteúdo: confira cada posição da rolagem nas
  capturas, principalmente no celular. As barras flutuantes em pílula são onde o painel mais registrou uma
  navegação cobrindo texto.
- No celular: o logotipo e uma ação à vista; os links vão para uma folha simples de tela cheia, aberta por um
  botão de texto ("Menu"), ou passam para o rodapé quando são só três.
- A navegação é mobília pequena, seja como for desenhada. No desktop ela ocupa no máximo cerca de um décimo
  da primeira dobra; no celular, é uma linha. Uma planta que monta a navegação como uma coluna de
  blocos de cor ou uma pilha de abas recebe esse tratamento só no desktop, e se recolhe a uma linha no
  celular, para a headline, a frase de apoio e a ação ficarem na primeira dobra. Nos testes às cegas,
  uma navegação que engoliu o hero custou um ponto inteiro de usabilidade.

## 8. Finais

- A página deve terminar numa cena desenhada. No estudo: o nome em largura total (cerca de 18 de 114), o
  hero repetido em cores invertidas (cerca de 12), uma cena de fechamento própria, como o único dado de contato
  composto como headline (cerca de 14), ou simplesmente uma linha discreta (cerca de 22). Rodapés de colunas de links aparecem
  nas anotações do painel só como crítica.
- O nome em largura total é forte, mas já virou hábito de estúdio; use quando a direção é puxada pelo nome,
  senão prefira a planta sorteada para o rodapé.
- Ponha os dados práticos (endereço, horário, e-mail, linha legal) na fonte de texto, num tamanho legível,
  nas mesmas linhas-âncora do resto da página.

## 9. O celular é uma segunda composição

Desenhe a tela de 390 px como uma página própria, não como a página do desktop espremida. Sites fortes que descuidam disso
perdem pontos de usabilidade; os fracos muitas vezes simplesmente quebram.

- Cada planta da ficha tem o seu parágrafo de celular. Construa-o.
- Mantenha uma coisa dominante na primeira dobra. Um logotipo que tinha 20vw de largura no desktop pode empilhar em
  duas linhas com 26vw no celular e ficar ainda mais forte.
- Refaça as quebras de linha; recorte as imagens de novo na vertical (`object-position` por breakpoint, ou outro
  tamanho de recorte na URL da imagem); mantenha a irregularidade com larguras alternadas, em vez de deixar tudo
  em largura total.
- Margens de 16–20 px. Texto corrido de 16–18 px. Áreas de toque com pelo menos 44 px de altura.
- Confira os 390 px nas capturas do inspetor em toda rodada: rolagem lateral e headlines de três linhas
  costumam aparecer aqui primeiro.

## 10. Como as páginas falham

Das anotações do painel sobre os 54 sites com nota abaixo de 6,8 (contagens de 54):

- A página inteira é o template batido da categoria; troque o logo e poderia ser qualquer concorrente
  (cerca de 20).
- Headline centralizada, selo em pílula, dois botões, captura de tela ou grade de blocos embaixo (cerca de 9).
- Um hero marcante, depois módulos batidos na ordem de sempre (cerca de 8, e cerca de mais 17 na faixa
  do meio).
- Uma fonte padrão, sem personalidade (cerca de 13).
- Texto pequeno demais ou com contraste baixo demais (cerca de 13); legibilidade perdida sobre fotografias carregadas (cerca de 9).
- Uma headline pequena demais e nenhum ponto focal (cerca de 9).
- A página nunca diz o que a coisa é, ou não mostra trabalho nenhum (cerca de 12 e 7).
- Conteúdo ralo esticado por muitas telas, ou uma piada só (cerca de 11).
- Barreiras, preloaders (telas de carregamento) e pop-ups de entrada antes de qualquer conteúdo (cerca de 9).
- Um layout de celular que é o do desktop encolhido, ou quebrado (cerca de 8).
- Elementos fixos por cima do conteúdo; detalhes descuidados, como linhas que se chocam (cerca de 7 e 5).

E os defeitos dos melhores sites, que não são para copiar: texto corrido de 9–13 px (cerca de 24 dos 90
sites com 7,5 ou mais), informação escondida atrás do conceito (cerca de 20), a ideia se esgotando
no meio da página (cerca de 15), texto sobre vídeo sem véu (uma camada escura translúcida) (cerca de 12), barreiras e primeiras pinturas em branco (cerca de
12), elementos flutuantes se chocando com o conteúdo (cerca de 11) e uma primeira dobra sem dizer o que
é isto e sem ação (cerca de 9). Diga o que a coisa é, e ofereça a ação, na primeira dobra.
