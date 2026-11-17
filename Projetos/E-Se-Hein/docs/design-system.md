# E Se, Hein? · Design System dos vídeos

**Figma:** [E Se, Hein? · Design System dos vídeos](https://www.figma.com/design/okTGRiK8lTEXSoP9QDm0du)
(arquivo `okTGRiK8lTEXSoP9QDm0du`). Logo definitiva: [arquivo da logo](https://www.figma.com/design/tQIfaeQgkOZhwh60i6Y5fH),
seção "Definitiva · Conceito A".

**Estado:** está no Figma (criado em 17/11/2026 pela Sofia). Este documento resume o arquivo para a Karol implementar.
Se algo daqui e do Figma discordar, vale o Figma, e a Sofia corrige este documento.

**A ideia:** um mundo de brinquedo que a câmera atravessa sem cortar; o texto é grosso, curto e fica sempre no mesmo
lugar.

## Páginas do arquivo

| Página | O que tem |
|---|---|
| Capa | Nome, assinatura e o boneco. |
| Fundamentos | Paleta (Mundo em Dia, Noite e Breu; Marca e rótulos), legenda em 1080 × 1920 com as zonas seguras, tipografia e movimento. |
| Componentes | Ícone, Seta, Pílula, Texto preso, Rótulo de contexto, Legenda, Cartão, Marca / Símbolo E?, Marca / Assinatura, Marca-d'água. |
| Personagem | "Você" de frente, de lado e de costas, medidas para o 3D e o boneco nos três modos. |
| Fechamento | Componente dos 4 s finais e a conferência com as zonas seguras. |
| Storyboard · Lua | Os 8 quadros-chave de "E se a Lua desaparecesse?" com as notas de câmera e transição. |

Arquivos de código nesta pasta, gerados do mesmo lugar que o Figma:

- `docs/tokens.css`: todas as variáveis, com os mesmos nomes do Figma (`mundo/ceu/topo` vira `--mundo-ceu-topo`).
  Os modos Noite e Breu ficam em `[data-modo="noite"]` e `[data-modo="breu"]`.
- `docs/tokens.json`: os mesmos valores para o TypeScript (cores por modo, medidas, tipografia e movimento).

## Formato e zonas seguras

Quadro de 1080 × 1920 a 30 quadros por segundo. As zonas abaixo são o pior caso entre TikTok, Reels e Shorts
(componente **Guia / Zonas seguras** no Figma, só para conferência):

| Zona | Área | O que cobre |
|---|---|---|
| Topo | y 0 a 210 | Abas, busca, "ao vivo" |
| Base | y 1420 a 1920 | Nome do perfil, descrição, música, botão de seguir, barra de navegação |
| Direita | x 900 a 1080, y 700 a 1420 | Curtir, comentar, salvar, compartilhar |
| Margem | 72 px dos lados | Respiro mínimo |

Área livre para texto e rótulos: x 72 a 900, y 210 a 1420. Faixa da legenda: x 180 a 900, y 1210 a 1350. O cenário
3D pode ocupar o quadro todo; só o texto e os rótulos respeitam as zonas.

## Cores

Três coleções de variáveis no Figma.

**Mundo** (três modos). Dia é o modo das marés e da costa; Noite é com Lua; Breu é sem Lua, longe da cidade. As
cenas no espaço usam as cores fixas `mundo/espaco/*` e `mundo/terra/*`, iguais nos três modos.

| Token (Figma) | Variável CSS | Dia | Noite | Breu | Uso |
|---|---|---|---|---|---|
| `mundo/ceu/topo` | `--mundo-ceu-topo` | `#3E8EF0` | `#0B1A45` | `#03060F` | Céu no alto do quadro (degradê de cima) |
| `mundo/ceu/horizonte` | `--mundo-ceu-horizonte` | `#A9D8FF` | `#3A5A9E` | `#101A33` | Céu na linha do horizonte (degradê de baixo) |
| `mundo/ceu/brilho-cidade` | `--mundo-ceu-brilho-cidade` | `#FFFFFF` | `#6A5A8E` | `#7A4535` | Domo de luz sobre a cidade, visto de longe |
| `mundo/nuvem/luz` | `--mundo-nuvem-luz` | `#FFFFFF` | `#8EA3D6` | `#1E2A47` | Face iluminada das nuvens fofas |
| `mundo/nuvem/sombra` | `--mundo-nuvem-sombra` | `#D6E6FA` | `#56689E` | `#141C33` | Barriga das nuvens |
| `mundo/nevoa` | `--mundo-nevoa` | `#CFE6FF` | `#33508F` | `#0E1530` | Névoa de distância (fog do Three.js) |
| `mundo/predio/1` | `--mundo-predio-1` | `#F2A7B5` | `#8E6F96` | `#4B3D55` | Fachada rosa |
| `mundo/predio/2` | `--mundo-predio-2` | `#C7B3E6` | `#6E679E` | `#3E3A5C` | Fachada lilás |
| `mundo/predio/3` | `--mundo-predio-3` | `#B9E3B0` | `#5F8A86` | `#34504F` | Fachada menta |
| `mundo/predio/4` | `--mundo-predio-4` | `#F4E6C4` | `#8F8A8E` | `#4E4B52` | Fachada creme |
| `mundo/predio/5` | `--mundo-predio-5` | `#A8D4F0` | `#5D7FA6` | `#33475E` | Fachada azul |
| `mundo/predio/6` | `--mundo-predio-6` | `#F6C79A` | `#93788A` | `#50424F` | Fachada pêssego |
| `mundo/janela/apagada` | `--mundo-janela-apagada` | `#5B7FB8` | `#2C3A63` | `#1B2440` | Janela sem luz (vidro) |
| `mundo/janela/acesa` | `--mundo-janela-acesa` | `#FFD36B` | `#FFD36B` | `#FFD36B` | Janela com luz (emissiva, não muda com a luz da cena) |
| `mundo/telhado/base` | `--mundo-telhado-base` | `#E2553D` | `#8E3B45` | `#4E2430` | Telhado vermelho, face ao sol |
| `mundo/telhado/sombra` | `--mundo-telhado-sombra` | `#B63E2C` | `#5E2638` | `#33182A` | Telhado vermelho, face na sombra |
| `mundo/chao/grama` | `--mundo-chao-grama` | `#7CC56A` | `#355F5A` | `#1A2E30` | Grama e morros |
| `mundo/chao/rua` | `--mundo-chao-rua` | `#5A5F6B` | `#2A2F45` | `#151A28` | Asfalto |
| `mundo/chao/calcada` | `--mundo-chao-calcada` | `#E4DED0` | `#6B7190` | `#353A50` | Calçada e lajes |
| `mundo/agua/raso` | `--mundo-agua-raso` | `#4FC3E8` | `#2E5E9E` | `#16325A` | Mar perto da areia |
| `mundo/agua/fundo` | `--mundo-agua-fundo` | `#2A7FD0` | `#173F80` | `#0B1E40` | Mar aberto |
| `mundo/agua/espuma` | `--mundo-agua-espuma` | `#FFFFFF` | `#BFD0F0` | `#5E6F94` | Espuma e linha da onda |
| `mundo/areia/seca` | `--mundo-areia-seca` | `#F2DDA4` | `#A99E8E` | `#5A544F` | Areia seca |
| `mundo/areia/molhada` | `--mundo-areia-molhada` | `#D9BC7E` | `#7F7A78` | `#44403F` | Faixa de areia molhada (marca da maré) |
| `mundo/arvore/copa` | `--mundo-arvore-copa` | `#4FB04A` | `#2F6B5A` | `#183A33` | Copa das árvores |
| `mundo/arvore/tronco` | `--mundo-arvore-tronco` | `#8A5A35` | `#4A3A3F` | `#2A2226` | Tronco |
| `mundo/lua/superficie` | `--mundo-lua-superficie` | `#F3EFE0` | `#F3EFE0` | `#F3EFE0` | Lua (emissiva) |
| `mundo/lua/cratera` | `--mundo-lua-cratera` | `#CFC8B0` | `#CFC8B0` | `#CFC8B0` | Crateras da Lua |
| `mundo/espaco/fundo` | `--mundo-espaco-fundo` | `#070B1F` | `#070B1F` | `#070B1F` | Fundo do espaço (cenas da Terra vista de fora) |
| `mundo/espaco/estrela` | `--mundo-espaco-estrela` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | Estrelas |
| `mundo/terra/oceano` | `--mundo-terra-oceano` | `#2F7FE0` | `#2F7FE0` | `#2F7FE0` | Oceanos da Terra vista do espaço |
| `mundo/terra/continente` | `--mundo-terra-continente` | `#62C35A` | `#62C35A` | `#62C35A` | Continentes |
| `mundo/terra/gelo` | `--mundo-terra-gelo` | `#F4F8FF` | `#F4F8FF` | `#F4F8FF` | Polos |
| `mundo/personagem/pele` | `--mundo-personagem-pele` | `#F2C39B` | `#C79A86` | `#8E6E6A` | Pele do boneco "você" |
| `mundo/personagem/cabelo` | `--mundo-personagem-cabelo` | `#4A2F1D` | `#2E2028` | `#1E151B` | Cabelo |
| `mundo/personagem/camiseta` | `--mundo-personagem-camiseta` | `#FFD21F` | `#D8B83A` | `#9C8740` | Camiseta amarela |
| `mundo/personagem/bermuda` | `--mundo-personagem-bermuda` | `#2D55C8` | `#253E8F` | `#1A2C66` | Bermuda azul |
| `mundo/personagem/tenis` | `--mundo-personagem-tenis` | `#2F6BE0` | `#2A55B0` | `#1E3C80` | Tênis |
| `mundo/personagem/olho` | `--mundo-personagem-olho` | `#1B1B1B` | `#1B1B1B` | `#1B1B1B` | Olhos e boca |
| `mundo/sombra` | `--mundo-sombra` | `#1F2D5A` | `#050A1E` | `#000000` | Cor da sombra suave (usar a 25% no Dia, 40% na Noite e no Breu) |
| `mundo/vida/coral` | `--mundo-vida-coral` | `#FF8A7A` | `#9A5A6A` | `#4A2E3A` | Corais |
| `mundo/vida/caranguejo` | `--mundo-vida-caranguejo` | `#F06A3A` | `#9A4A3A` | `#4E2A28` | Caranguejos |
| `mundo/vida/ave` | `--mundo-vida-ave` | `#FFFFFF` | `#AAB6D6` | `#3A4258` | Aves da praia (corpo) |
| `mundo/vida/bico` | `--mundo-vida-bico` | `#FFB020` | `#A8803A` | `#5A4A2A` | Bico e pés das aves |

**Marca e rótulos** (um modo só).

| Token (Figma) | Variável CSS | Valor | Uso |
|---|---|---|---|
| `marca/laranja` | `--marca-laranja` | `#FF5A1F` | Cor da marca: fundo do fechamento, destaque raro |
| `marca/tinta` | `--marca-tinta` | `#111111` | Contornos, texto sobre laranja e branco |
| `marca/branco` | `--marca-branco` | `#FFFFFF` | Legenda, texto das pílulas, cartões |
| `rotulo/vermelho` | `--rotulo-vermelho` | `#E5383B` | Pílula de problema, seta de queda (4,2:1 com branco) |
| `rotulo/verde` | `--rotulo-verde` | `#1A8F3F` | Pílula de solução/estado bom, seta de subida (4,2:1 com branco) |
| `rotulo/amarelo` | `--rotulo-amarelo` | `#FFD21F` | Texto preso a objeto, seta neutra, ícones dos cartões |
| `rotulo/cartao` | `--rotulo-cartao` | `#FFFFFF` | Fundo do cartão com ícone |
| `rotulo/contorno` | `--rotulo-contorno` | `#111111` | Contorno de legenda, pílulas, setas e textos presos |

Regras de cor:

- Laranja é raro: logo, fechamento e nada mais. Não use laranja em rótulo.
- Vermelho = problema, "sem", queda. Verde = solução, "com", estado bom. Amarelo = nome de objeto e movimento neutro.
- Contraste conferido: branco sobre vermelho 4,2:1, branco sobre verde 4,2:1 (texto grande e grosso pede 3:1), tinta
  sobre laranja 6,1:1, tinta sobre amarelo 13:1. O verde da referência (`#2FB24A`) dava 2,8:1 com branco e foi
  escurecido para `#1A8F3F`.
- Sem gradiente, a não ser o do céu (topo para horizonte). Sombra do mundo: `mundo/sombra` a 25% no Dia e a 40% na
  Noite e no Breu.

## Tipografia

Uma família no vídeo: **Rubik** (Google Fonts, licença OFL, gratuita), pesos 800 (ExtraBold) e 900 (Black). Tem todos
os acentos do português. Os cantos levemente arredondados combinam com o mundo de brinquedo e a letra continua
legível em tela de celular. No Remotion, use o pacote `@fontsource/rubik` (pesos 800 e 900, subconjuntos latin e
latin-ext) com `loadFont`, como hoje é feito com a Montserrat.

| Estilo (Figma) | Peso | Corpo | Entrelinha | Espaçamento | Caixa | Cor |
|---|---|---|---|---|---|---|
| Legenda/Palavra | 900 | 112 px (mín. 84) | 1,00 | -0,01em | como no roteiro | branco; destaque amarelo |
| Rótulo/Texto preso | 900 | 56 px | 1,00 | 0,01em | alta | amarelo |
| Rótulo/Pílula G | 800 | 44 px | 1,00 | 0,02em | alta | branco |
| Rótulo/Pílula P | 800 | 32 px | 1,00 | 0,02em | alta | branco |
| Rótulo/Contexto | 800 | 44 px | 1,00 | 0,04em | alta | branco |
| Rótulo/Cartão | 800 | 34 px | 1,10 | 0,02em | alta | tinta |
| Fechamento/Pergunta | 900 | 120 px | 0,96 | -0,01em | como no roteiro | tinta |
| Fechamento/Chamada | 800 | 44 px | 1,10 | 0,02em | alta | tinta (branco na pílula) |

## Legenda de uma palavra

| Item | Valor |
|---|---|
| Fonte | Rubik 900, 112 px |
| Largura máxima | 720 px (x 180 a 900). Se passar, diminua o corpo de 2 em 2 px até caber, no mínimo 84 px. Nunca quebre a palavra. |
| Cor | branco (`--marca-branco`); destaque amarelo (`--rotulo-amarelo`), no máximo uma palavra por trecho |
| Contorno | tinta `#111111`, 12 px por fora da letra, cantos redondos |
| Sombra | tinta a 35%, 8 px para baixo, sem desfoque |
| Posição | centro em x 540, y 1280 (dois terços da altura) |
| Texto | como no roteiro, com acento. Mantém `?` e `!` no fim; tira vírgula, ponto, dois-pontos e reticências. Maiúscula só em início de frase e em nome (Lua, Terra). |
| Tempo | aparece no início da palavra no áudio e fica até o início da próxima. Em pausa maior que 0,35 s, sai 4 quadros depois do fim da fala. |
| Entrada | `mov/legenda-entrada`: 4 quadros, escala 86% para 100% com mola leve, opacidade 0 para 1 nos 2 primeiros. Sem saída animada. |

Medido no Figma em 112 px: "Lua" 214 px, "estabiliza" 573 px, "Caranguejos" 740 px, "comentários" 742 px,
"simplesmente" 821 px, "desaparecesse?" 949 px. As quatro últimas precisam encolher; "desaparecesse?" cabe em 84 px
(712 px).

Contorno por fora no CSS: `-webkit-text-stroke` desenha metade para dentro, então use o dobro da largura com
`paint-order: stroke fill`. Para 12 px por fora: `-webkit-text-stroke: 24px #111; paint-order: stroke fill;`.

Composição: a faixa da legenda cai sobre chão liso, céu ou água, nunca sobre o rosto do boneco. Rótulos, setas e
cartões ficam sempre acima da faixa da legenda.

## Componentes de rótulo

Todas as medidas em px no quadro 1080 × 1920.

| Token (Figma) | Variável CSS | Valor | Uso |
|---|---|---|---|
| `legenda/tamanho` | `--legenda-tamanho` | 112 px | Corpo da palavra (px no quadro 1080 × 1920) |
| `legenda/tamanho-min` | `--legenda-tamanho-min` | 84 px | Menor corpo, quando a palavra não cabe na largura máxima |
| `legenda/contorno-largura` | `--legenda-contorno-largura` | 12 px | Contorno escuro por fora da letra |
| `legenda/sombra-y` | `--legenda-sombra-y` | 8 px | Deslocamento da sombra dura para baixo |
| `legenda/centro-x` | `--legenda-centro-x` | 540 px | Centro horizontal da palavra |
| `legenda/centro-y` | `--legenda-centro-y` | 1280 px | Centro vertical da palavra (66,7% da altura) |
| `legenda/largura-max` | `--legenda-largura-max` | 720 px | Largura máxima da palavra (x 180 a 900) |
| `rotulo/pilula-g/altura` | `--rotulo-pilula-g-altura` | 88 px | Pílula grande: altura |
| `rotulo/pilula-g/fonte` | `--rotulo-pilula-g-fonte` | 44 px | Pílula grande: corpo do texto |
| `rotulo/pilula-g/padding-x` | `--rotulo-pilula-g-padding-x` | 36 px | Pílula grande: respiro lateral |
| `rotulo/pilula-p/altura` | `--rotulo-pilula-p-altura` | 64 px | Pílula pequena: altura |
| `rotulo/pilula-p/fonte` | `--rotulo-pilula-p-fonte` | 32 px | Pílula pequena: corpo do texto |
| `rotulo/pilula-p/padding-x` | `--rotulo-pilula-p-padding-x` | 26 px | Pílula pequena: respiro lateral |
| `rotulo/borda-largura` | `--rotulo-borda-largura` | 5 px | Borda branca da pílula e do cartão |
| `rotulo/contorno-largura` | `--rotulo-contorno-largura` | 6 px | Contorno escuro de pílula, seta e texto preso |
| `rotulo/sombra-y` | `--rotulo-sombra-y` | 8 px | Sombra dura da pílula e do cartão |
| `rotulo/texto-preso/fonte` | `--rotulo-texto-preso-fonte` | 56 px | Texto amarelo preso a objeto |
| `rotulo/contexto/fonte` | `--rotulo-contexto-fonte` | 44 px | Rótulo de contexto do canto |
| `rotulo/cartao/raio` | `--rotulo-cartao-raio` | 36 px | Raio do cartão branco |
| `rotulo/cartao/padding` | `--rotulo-cartao-padding` | 32 px | Respiro interno do cartão |
| `rotulo/cartao/icone` | `--rotulo-cartao-icone` | 168 px | Lado do ícone no cartão |
| `rotulo/seta/espessura` | `--rotulo-seta-espessura` | 28 px | Espessura do corpo da seta |
| `zona/topo` | `--zona-topo` | 210 px | Faixa de cima coberta pela interface (abas, busca) |
| `zona/base` | `--zona-base` | 500 px | Faixa de baixo coberta (descrição, música, botões) |
| `zona/direita` | `--zona-direita` | 180 px | Coluna da direita coberta (curtir, comentar, compartilhar), de y 700 a 1420 |
| `zona/margem` | `--zona-margem` | 72 px | Margem lateral mínima |

| Componente | Variantes | Como é | Onde e quando |
|---|---|---|---|
| **Pílula** | Cor (Vermelho, Verde) × Tamanho (G, P) | Fundo da cor, borda branca 5 px por dentro, raio total, sombra dura 0/8 a 35%. G: altura 88, texto 44, respiro 36. P: altura 64, texto 32, respiro 26. | Estado ou comparação. Até 3 palavras. Presa a um objeto ou a uma marca do cenário. |
| **Seta** | Cor (Vermelho, Verde, Amarelo) × Forma (Reta, Curva) | Corpo de 28 px, contorno tinta 6 px, cantos redondos. A reta aponta para baixo (gire); a curva gira no sentido horário (espelhe). | Queda, subida, giro, balanço. Oscila 6 px a cada 1,2 s depois de entrar. |
| **Texto preso** | Guia (Sem, Com) | Rubik 900, 56 px, amarelo, contorno tinta 6 px por fora, sombra dura. Com guia: linha tinta de 6 × 96 px e ponto amarelo de 24 px com contorno 5 px. | Nome de um objeto 3D. Com guia, o ponto fica exatamente sobre o objeto (projeção da câmera). Pode inclinar até ±8°. |
| **Rótulo de contexto** | Tipo (Texto, Tempo) | Rubik 800, 44 px, branco, contorno tinta 6 px, sombra dura. Tempo leva um relógio de 48 px antes do texto. | Canto superior esquerdo, x 72, y 236. Um por trecho, troca junto com o trecho. |
| **Cartão** | Tipo (Um, Dois, Antes e depois) | Branco, borda tinta 6 px, raio 36, respiro 32, sombra dura. Ícone 168 px, texto Rubik 800 34 px tinta. Dois: "OU" entre os ícones. Antes e depois: seta amarela entre eles. | Metade de cima do quadro (y 300 a 900), centralizado. |
| **Ícone** | Nome: Lua, Lua riscada, Maré alta, Maré baixa, Terra, Sol, Caranguejo, Coral, Floco | 168 × 168, amarelo com contorno tinta 8 px. | Só dentro do Cartão. |
| **Legenda** | Variante (Normal, Destaque) | Ver a seção da legenda. | Centro em x 540, y 1280. |
| **Marca-d'água** | — | Símbolo E? branco, 72 px, a 70%. | x 936, y 232, o vídeo todo menos o fechamento. |

Regra de quantidade: no máximo 3 rótulos na tela ao mesmo tempo (o de contexto não conta). Cada rótulo entra no
início da palavra que o nomeia, fica no mínimo 1,5 s e sai antes da transição de câmera.

## Personagem "você"

Boneco de brinquedo low-poly, cores chapadas, sem contorno, sem capacete. É o espectador dentro da cena: de costas
quando olha o mundo com a gente, de lado quando reage, de frente só na pergunta final. Altura total 1,80 m no
Three.js.

| Parte | Altura | Largura (frente) | Profundidade | Forma no 3D | Cor |
|---|---|---|---|---|---|
| Cabeça | 0,49 m (27%) | 0,46 m | 0,44 m | cilindro de 8 lados, chanfro 0,08 m | `--mundo-personagem-pele` |
| Cabelo | topo e nuca | 0,48 m | 0,48 m | calota achatada; franja só à esquerda | `--mundo-personagem-cabelo` |
| Pescoço | 0,07 m | 0,12 m | 0,12 m | cilindro de 6 lados | pele |
| Camiseta | 0,56 m | 0,56 m | 0,34 m | caixa com chanfro 0,04 m; mangas 0,17 × 0,24 m | `--mundo-personagem-camiseta` |
| Braços | 0,48 m | 0,11 m | 0,11 m | cilindros de 6 lados | pele |
| Bermuda | 0,35 m | 0,52 m | 0,32 m | caixa com vão de 0,03 m | `--mundo-personagem-bermuda` |
| Pernas | 0,34 m | 0,15 m cada | 0,15 m | cilindros de 6 lados, afastadas 0,08 m | pele |
| Tênis | 0,12 m | 0,20 m | 0,26 m | caixa arredondada, bico para a frente | `--mundo-personagem-tenis` |
| Olhos e boca | olho 0,07 m; boca 0,025 m | olho 0,055 m | — | discos planos, sem brilho | `--mundo-personagem-olho` |

Material sem textura e sem brilho (`MeshLambertMaterial` ou `MeshToonMaterial` com `flatShading`). Animação: piscar a
cada 3 a 5 s, respirar (tronco sobe 1%) e virar a cabeça antes do corpo.

## Fechamento (4 s finais)

Componente **Fechamento** no Figma, com as propriedades Pergunta e Chamada.

| Elemento | Posição | Estilo |
|---|---|---|
| Fundo | quadro todo | `--marca-laranja` |
| Assinatura E? E SE, HEIN? | x 88, largura 600 | tinta |
| Pergunta | x 100, largura 780, alinhada à esquerda, até 3 linhas | Fechamento/Pergunta, tinta |
| Chamada "Responde aqui nos comentários" | logo abaixo, +36 px | Fechamento/Chamada, tinta |
| Pílula "Segue para mais “E se”" | +72 px | fundo tinta, texto branco, símbolo E? laranja de 56 px, respiro 44 × 26 |

O bloco todo fica centralizado na vertical da área livre (entre y 210 e 1420) e alinhado à esquerda em x 100, longe
da coluna de botões. Sem marca-d'água e sem legenda. Tempo (120 quadros): 0 a 12 o círculo laranja cresce a partir da
Lua; 8 a 18 assinatura (mola); 14 a 26 pergunta; 30 chamada; 40 pílula; 70 o ponto do "?" quica uma vez.

A pergunta do fechamento é curta e diferente da fala: "Lua cheia ou marés?" (a fala completa fica na legenda do Q7).

## Movimento (30 quadros por segundo)

| Token | Duração | Curva | Uso |
|---|---|---|---|
| `mov/legenda-entrada` | 4 quadros | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Escala 86% para 100%, opacidade nos 2 primeiros |
| `mov/rotulo-entrada` | 8 quadros | `spring({damping: 12, mass: 0.6, stiffness: 180})` | Pílula, cartão, texto preso: escala 0 para 108% para 100% |
| `mov/rotulo-saida` | 6 quadros | `cubic-bezier(0.4, 0, 1, 1)` | Escala 100% para 90% e opacidade para 0 |
| `mov/seta-entrada` | 10 quadros | `cubic-bezier(0, 0, 0.2, 1)` | Cresce do pé à ponta |
| `mov/camera-transicao` | 30 a 45 quadros | `cubic-bezier(0.65, 0, 0.35, 1)` | Passagem entre trechos, sem corte |
| `mov/camera-deriva` | o trecho todo | linear | Dentro do trecho a câmera avança 3% a 5%: nunca fica parada |
| `mov/modo-cor` | 45 quadros | linear | Mistura das cores de um modo para o outro |
| `mov/lua-some` | 24 quadros | ease-in | Lua: escala 100% para 96%, opacidade para 0 |
| `mov/fechamento` | 12 quadros | `cubic-bezier(0.65, 0, 0.35, 1)` | Círculo laranja a partir da Lua |

Nada pisca mais de 3 vezes por segundo.

## Storyboard de "E se a Lua desaparecesse?"

Imagem: `storyboard-lua.png` (entregue à parte; no Figma, página Storyboard · Lua).

| Quadro | Tempo | Modo | Câmera | Rótulos | Legenda | Passagem para o próximo |
|---|---|---|---|---|---|---|
| Q1 · A Lua some | 0,0 a 9,6 s | Noite | Atrás do "você" (costas), numa laje; Lua cheia grande no centro | Contexto "HOJE À NOITE"; pílula vermelha "SEM EXPLOSÃO" | desaparecesse? | Tilt para o céu vazio, Noite para Breu |
| Q2 · Noite preta | 10,2 a 16,9 s | Breu | De lado, num morro fora da cidade; muitas estrelas | Contexto "LONGE DA CIDADE"; texto preso "CIDADE" no domo de luz; pílula "SEM LUAR" | **pretas** | Desce a encosta até o mar; amanhece (Breu para Dia) |
| Q3 · Marés | 17,3 a 26,2 s | Dia | Corte lateral da praia com régua de maré | Contexto "MARÉS"; cartão Antes e depois; pílulas "COM LUA" e "SEM LUA: ~METADE" nas faixas | **metade** | Dolly para baixo até a areia molhada |
| Q4 · Costa | 26,5 a 37,3 s | Dia | Rente à areia, travelling lateral | Contexto "LITORAL"; textos presos "CARANGUEJO" e "CORAIS"; pílula "SEM RITMO" | **ritmo** | Crane rápido pelas nuvens até o espaço |
| Q5 · O eixo | 37,8 a 49,4 s | espaço | Terra grande no centro, eixo inclinado 23,4° | Contexto Tempo "MILHÕES DE ANOS"; texto preso "EIXO" e seta curva; pílulas "COM LUA: 22° A 24,5°" e "SEM LUA: BALANÇA MAIS"; em "extremas", cartão Dois Sol "VERÃO" / Floco "INVERNO" | balançar (e **extremas**) | Dolly out até a Lua entrar no quadro |
| Q6 · Terra e Lua | 49,7 a 54,3 s | espaço | Terra embaixo à esquerda, Lua no alto à direita (Lua com 27% do diâmetro da Terra) | Contexto "TERRA E LUA"; textos presos "LUA" e "TERRA"; pílula verde "SEGURA O EIXO" e seta curva verde | **lugar** | Mergulho de volta à laje do Q1, à noite |
| Q7 · A pergunta | 54,7 a 60,0 s | Noite | De frente para o "você" na laje; Lua de volta atrás dele | Contexto "E VOCÊ?"; cartão Dois Lua "LUA CHEIA" ou maré "MARÉS" | marés? | A Lua cresce como um círculo e vira o fundo laranja |
| Q8 · Fechamento | 60,0 a 64,0 s | laranja | — | Assinatura, pergunta, chamada, "Segue para mais" | — | fim |

Em negrito, a palavra em destaque amarelo de cada trecho.

Fatos usados nos rótulos (a Sabrina confere antes de publicar): sem a Lua sobra a maré do Sol, com cerca de 46% da
força da maré lunar, por isso a maré fica com **menos da metade** do tamanho de hoje (correção da Sabrina em
17/11/2026; o "um terço" do primeiro roteiro só valia contra a maré de lua cheia e nova); com a Lua a inclinação do eixo varia entre cerca de 22,1° e
24,5° num ciclo de uns 41 mil anos; sem ela a variação seria maior, mas os estudos discordam de quanto, por isso o
rótulo vermelho não tem número; a desova de muitos corais acompanha as fases da Lua. A distância Terra–Lua do Q6 não
está em escala.

## Regras do estilo para o código

1. **Câmera contínua.** Nunca corte. Entre trechos, `mov/camera-transicao`; dentro do trecho, `mov/camera-deriva`.
2. **Cores pelo modo, não pela luz.** As cores dos materiais vêm do token do modo ativo (Dia, Noite ou Breu) e se
   misturam na transição (`mov/modo-cor`). A luz fica fixa e neutra (hemisférica + direcional suave), só para dar
   volume. Assim a tela fica igual ao Figma. Janelas acesas e a Lua são emissivas.
3. **Brinquedo, com toque real (versão 2).** Low-poly com `flatShading` nos prédios, no boneco e nos bichos, sombra
   suave. Nuvens são grupos de 3 ou 4 esferas achatadas com a barriga mais escura (`mundo/nuvem/sombra`). A pedido do
   Paulo (17/11/2026, "mais realista"), entram texturas reais sem trocar as cores dos tokens: relevo PBR do Poly Haven
   no chão, na areia e no asfalto (a textura só varia o tom da cor do token), água com reflexo do céu (HDRI), Lua e
   Terra com as fotos da NASA, e pós-processamento leve (brilho nas luzes fortes, tone mapping neutro e vinheta). O
   tone mapping é o **neutro**: o ACES lavava as cores (o céu azul do Dia virava cinza).
4. **Texto nas zonas.** Nada de texto ou rótulo fora de x 72 a 900, y 210 a 1420. A legenda só na faixa dela.
5. **Rótulos presos de verdade.** Texto preso e pílulas seguem o objeto pela projeção da câmera, quadro a quadro.
6. **Um rótulo por fala.** Entra na palavra que o nomeia; no máximo 3 ao mesmo tempo.
7. **Laranja só no fim.** A cor da marca aparece na marca-d'água (branca) e no fechamento.

## O que muda no código atual

Conferido em `src/` em 17/11/2026. Problema de visual, de conteúdo e de código separados.

**Visual**

| Arquivo | Hoje | Passa a ser |
|---|---|---|
| `src/fontes.ts` | Montserrat 800/900 | Rubik 800/900 (`@fontsource/rubik`, latin e latin-ext); `FONTE = "Rubik"` |
| `src/camadas/Legenda.tsx` | centro a 68% (y 1306), faixa x 110 a 910 (800 px), corpo até 108 por estimativa de caracteres, peso 800, contorno 16% do corpo, sombra 0/7 | centro y 1280, x 540; largura máxima 720 (x 180 a 900); corpo 112, encolhe medindo a largura real até 84; peso 900; contorno 12 px por fora (`-webkit-text-stroke: 24px #111` + `paint-order`); sombra `0 8px 0 rgba(17,17,17,.35)`; variante destaque amarela |
| `src/camadas/rotulos.tsx` · Pilula | peso 900, 40 px, borda 4, sombra 0/6, um tamanho | peso 800; G (88 de altura, 44 px, respiro 36) e P (64, 32 px, 26); borda branca 5; sombra 0/8 a 35% |
| `src/camadas/rotulos.tsx` · TextoPreso | 50 px, contorno 20% do corpo, sempre inclinado -4° | 56 px; contorno 6 px por fora (`12px` no stroke); inclinação só quando pedir (até ±8°); variante com guia (linha 6 × 96 e ponto 24) |
| `src/camadas/rotulos.tsx` · setas | corpo 12 px com contorno de 22 px desenhado à parte | corpo 28 px com contorno tinta 6 px; usar os caminhos do componente Seta do Figma |
| `src/camadas/rotulos.tsx` · AREA | x 90 a 880, y 190 a 1180 | x 72 a 900, y 210 a 1420, menos a faixa da legenda (y 1210 a 1350) |
| `src/camadas/icones.tsx` | ícones pequenos, várias cores (azul, laranja, rosa) | ícones 168 px, só amarelo com contorno tinta 8 px (componente Ícone) |
| `src/camadas/Contexto.tsx` | x 90, y 222, peso 900, 46 px, contorno 9, inclinado -3° | x 72, y 236, peso 800, 44 px, espaçamento 0,04em, contorno 6 por fora, sem inclinar; variante Tempo com relógio |
| `src/camadas/MarcaDagua.tsx` | 92 px, y 196, a 55% | 72 px, x 936, y 232, a 70% |
| `src/camadas/Fechamento.tsx` | tudo centralizado; pergunta 64 px peso 800; botão "Comenta aí" | alinhado à esquerda em x 100; assinatura 600 px; pergunta 120 px peso 900; chamada "Responde aqui nos comentários"; pílula tinta "Segue para mais “E se”" com o símbolo laranja; tempo da tabela do fechamento |
| `src/mundo/paleta.ts` | cores provisórias, só a noite | importar `docs/tokens.json` (ou copiar os valores) com os três modos; os nomes das chaves seguem os tokens |

**Conteúdo**

- Pergunta do fechamento: "Lua cheia ou marés?" (curta). Hoje o JSON usa a frase longa.
- Rótulos de cada trecho conforme a tabela do storyboard (textos e cores).

**Código**

- `src/mundo/ambiente.ts`: o campo `breu` passa a escolher o modo de cor (Noite para Breu); trechos Dia (marés e
  costa) precisam de um modo Dia que hoje não existe.
- Cartão com ícone (`rotulos.tsx`) precisa dos três tipos: Um, Dois e Antes e depois.

## O que ainda falta

- Conferir os fatos dos rótulos com a Sabrina (marés, inclinação, corais).
- Abertura de 1 s (está no plano da Karol): ainda não desenhada. Sugestão: começar já no Q1, sem cartela.
- Ícones para os próximos vídeos entram no componente Ícone conforme os roteiros.
- Capa do projeto (`docs/capas/`, 960 × 540) e a capa de cada vídeo para o perfil: não pedidas nesta rodada.
