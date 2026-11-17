# Apartamento da Monica e da Rachel, fiel à planta

**Pedido:** "melhore o apartamento da Monica, está errado algumas coisas". Corrigir só a parte da Monica e da Rachel
(X ≥ 309) em `Projetos/Escritorio-do-Paulo/web/js/temas/apartamento.js`.

**A ideia:** cada peça no lugar da planta, medida e não no olho. Alinhei a planta nova (40.jpg) sobre a combinada
(38.jpg) com o OpenCV (SIFT e transformação afim, 260 pontos coincidentes). Assim deu para medir cada móvel já nas
coordenadas do arquivo e comparar o desenho com a planta por sobreposição. Partes da `design-skills` usadas:
`critique-composition` (equilíbrio e agrupamento entre os cômodos) e `design-qa-checklist` (conferir peça por peça
contra a referência). O Figma não entrou: o pedido dispensava.

## O que estava errado

Coordenadas da planta (X, Y). "Era" é como estava; "agora" é como ficou.

**Paredes, portas e janelas**
- Quina da cozinha: a parede em degraus subia para cima e para a direita (de 318,140 até 336,130), por cima de onde
  fica o lado de fora. Na planta, a quina corta o canto da cozinha em diagonal, de (320,158) a (338,140), com janela.
- Parede da esquerda da cozinha: tinha 9 de espessura (309–318). Agora vai de 309 a 322, como na planta.
- Porta de entrada: era Y 205–224. Na planta é Y 220–235. Ficou Y 214–234 (veja "o que não deu").
- Banheiro: a porta para o corredorzinho era Y 120–132. Na planta é Y 104–119. A janela da esquerda era Y 98–110;
  agora é Y 105–118. As paredes ficaram mais grossas (esquerda 335–343, fundo 137–142), como na planta.
- Armário "?": o fundo era Y 32–56 e a porta ficava em Y 55. Na planta, o interior vai até Y 60, e a porta (marrom)
  fica em X 382–398, Y 60–63. Faltava o "?" vermelho.
- Corredorzinho: a parede da direita parava em Y 91. Na planta, ela desce até Y 103 (fim do banco). Por isso dava
  para "atravessar" do corredor para o banco onde a planta tem parede.
- Varanda: a grade ficava em Y 37 e X 476; na planta fica em Y 43 e X 472. A escada de incêndio ficava em X 414–424;
  na planta, em X 423–432.
- Quartos: a parede dos quartos ficava em X 465–469. Na planta, fica em X 475–479 (Monica) e 472–476 (Rachel). A
  porta da Monica era Y 110–126; na planta é Y 119–134.
- Faltavam a coluna escura ao lado do banco (X 465–503, Y 79–103), o cantinho da penteadeira no quarto da Monica
  (X 479–501, até Y 176), a parede entre os quartos começando em X 501 e a meia-parede da Rachel (X 501–503,
  Y 179–201).
- Janelas da direita: a da Monica era Y 120–138 (planta: 131–149); a da Rachel era Y 196–214 (planta: 201–219).

**Cozinha**
- Bancada laranja: era uma barra reta (X 336–376). Na planta, ela vira o canto em ângulo, com a pia na quina
  (334,153), e desce ao lado da bancada turquesa até Y 181.
- Bancada turquesa: começava em X 318 e tinha o fogão em cima dela. Agora fica em X 323–330, e o fogão é uma peça à
  parte (X 330–337, Y 183–198), com quatro bocas.
- Geladeira: ficava em Y 137–151, em cima da parede do banheiro. Agora fica em X 361–377, Y 142–157. Faltava o armário
  marrom ao lado (X 350–360).
- Carrinho ou ilha branca: era um retângulo azul pequeno (336,153). Na planta, é um quadrado branco girado em (346,167).
- Faltava o pufe amarelo (386,146), ao lado do batente.

**Sala, jantar e entrada**
- Mesa redonda: as cadeiras de baixo ficavam em Y 202; na planta ficam em Y 196–197.
- Tapete grande: era X 426–462, ficando à direita do sofá. Na planta, ele vai de 413 a 464, por baixo do sofá.
- Mesinha com abajur acima do sofá: era Y 152–159; agora Y 156–164.
- Cadeira verde: era (452,224); agora (451,218). Cadeira rosa: era (462,234); agora (461,228). Faltava a mesinha
  redonda marrom (466,208).
- Faltava o armário com planta, encostado na parede dos quartos (X 466–475, Y 143–172).
- Entrada: o tapete ficava em X 322–352; na planta, em X 334–361.

**Canto do banco da janela**
- Faltavam o tapete (X 414–466, Y 108–134), o banquinho marrom (470,110) e o degrau entre esse canto e a sala (Y 137).
- O banco, que era roxo com quadrados de seis cores, agora tem base verde-clara com almofadas roxas e rosa, como na
  planta.

**Corredorzinho e varanda**
- Baú verde: era Y 66–88; agora Y 72–95. A planta, que ficava dentro do armário (402,62), foi para (402,69). Faltavam
  a passadeira branca e a caixinha laranja.
- Varanda: a espreguiçadeira (X 434–460, Y 66–73) virou a mesinha comprida da planta (X 428–452, Y 76–81). Os dois
  vasos, que não existem na planta, saíram.

**Quarto da Monica**
- Cama: era X 507–547, larga demais. Agora fica em X 516–543, com a almofada rosa.
- Faltavam o tapete, a escrivaninha (X 482–499, Y 103–112), o pufe laranja, o abajur amarelo e a penteadeira de vidro
  (X 481–498, Y 164–175).
- A cômoda ficou clara, com dois puxadores redondos, como na planta. As plantas que estavam nos lugares errados
  (478,155 e 554,158) foram para (507,159).

**Quarto da Rachel**
- Cama: era X 524–558, encostando na parede. Agora fica em X 523–551, com as almofadas verdes.
- O criado-mudo e a mesinha escura estavam fora do lugar (514,172 e 496,184). Agora a mesinha redonda escura fica em
  (514,174), e o criado amarelo e o abajur ficam à direita da cama.
- Faltavam a cadeira amarela, a cômoda pequena, o tapete, o pufe, a mesinha redonda branca e a meia-parede.
- Escrivaninha: era X 522–558; agora X 524–550, com a cadeira verde em cima dela.

## O que mudou

- Arquivo `Projetos/Escritorio-do-Paulo/web/js/temas/apartamento.js`, só a parte da Monica e da Rachel:
  - Ajudantes novos: `girado` (retângulo girado pixel a pixel, sem borrar) e `interrogacao` (o "?").
  - Pisos, paredes, portas, janelas e todos os móveis, nas medidas acima.
  - Rede de caminhos refeita: 83 pontos (eram 81), sem nenhum móvel no caminho. Novos: `k-meio` e `k-sul` (a volta da
    cozinha por fora da mesa), `m-passagem`, `n-leste`, `ra-sul`, `b-porta`, `pia-banho` (lazer no espelho do
    banheiro) e `poltrona-rosa` (lazer na cadeira rosa).
  - Mesas: a mesa redonda usa a cadeira de baixo, à esquerda (373,201). A mesinha do banco usa a cadeira rosa
    (tela em Y 110). A escrivaninha da Rachel fica em X 537.
  - Ponto de lazer de cada móvel que mudou de lugar: sofá, poltronas, cadeiras verde e rosa, cama da Monica (senta na
    beirada), penteadeira (na poltrona rosa, de frente para o espelho), cama da Rachel (no pé da cama), poltrona
    redonda e mesinha da varanda.
  - Animação do fogão e do vapor da pia, nas peças novas.
- Arquivo `Projetos/Escritorio-do-Paulo/docs/apartamento.webp`: captura nova.

## Capturas

- Antes: a captura `apto-2x.png` que veio no pedido (a do começo da tarefa).
- Depois: `Projetos/Escritorio-do-Paulo/docs/apartamento.webp` (página com as agentes, WEBP 88).
- No rascunho da sessão, que pode ser apagado: o cenário ao lado da planta, a mistura das duas e a rede de caminhos
  desenhada por cima do cenário.

## Conferido em

- `node --check web/js/temas/apartamento.js`: sem erro.
- `checar.mjs`: apartamento com 83 pontos, nenhum solto, nenhum faltando, 4 mesas. O escritório não mudou (70 pontos,
  12 mesas).
- `npm test`: 28 de 28 passando.
- `foto-apto.mjs`, `foto-apto2.mjs` e `foto-trabalho.mjs`: console sem erros. A tela da Sofia acende no notebook da
  mesa redonda.
- Diff conferido: nenhuma linha do lado do Joey e do Chandler, do corredor, de `mapa.js` nem do tema do escritório.
- Só Chromium (Playwright). É um canvas fixo de 480 × 272, então não conferi os quatro tamanhos de tela.

## Ficou de fora (o que não deu para fazer igual)

- **Porta de entrada 6 unidades acima da planta** (Y 214–234 em vez de 220–235). O ponto `h-20` fica no corredor, que
  eu não podia mexer, em Y 214. Com a porta exata, a agente cortaria a quina da parede ao entrar.
- **Escala.** Um móvel de 4 unidades vira 3 ou 4 pixels. Ficaram de fora o quadrinho rosa na parede da Monica, o
  abajur de pé em cruz da Rachel e os dois tufos de planta do canto do banco; este último ficaria no caminho até o
  banco.
- **Cor do banheiro.** Usei um xadrez cinza-escuro e branco, em vez do preto e branco de antes, para ficar mais perto
  da planta.
- **O que é cada peça.** A peça da varanda e a da quina da sala de jantar aparecem na planta sem legenda. Segui o seu
  pedido: "mesinha" e "pufe amarelo". O nome do ponto da varanda continua `espreguicadeira`, para não mexer no que
  outras partes usam.

## Próximos passos

1. (Visual, baixa) Se o Paulo quiser a entrada idêntica à planta, mover o `h-20` do corredor para Y 222 numa tarefa que
   inclua o corredor.
2. (Conteúdo, baixa) Levar o cenário novo para a página "Ambiente e personagens" do Design System no Figma, quando
   houver sessão com o Figma.
3. (Código, nenhuma) Nada pendente para a Karol: nenhum token nem componente novo, só o cenário.
