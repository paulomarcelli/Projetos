# Imagens

As imagens são onde as páginas geradas mais claramente desistem: uma caixa cinza, um ícone num quadrado, um
dashboard falso, uma mancha abstrata. Este arquivo diz como decidir quais são as imagens, onde achar imagens reais,
como recortá-las e posicioná-las, e o que fazer quando não há nenhuma.

## Sumário

1. O que o estudo mediu
2. Decida que imagens existem
3. Imagens reais dos acervos abertos
4. As fotos sorteadas
5. Recorte e posição
6. Tratamento
7. Como mostrar software
8. Desenhe o assunto
9. Só tipografia e cor
10. Markup e créditos
11. Vídeo
12. Onde vão as imagens e os vídeos

## 1. O que o estudo mediu

- Em 60% dos sites estudados, uma mídia cobre pelo menos metade da primeira dobra; em metade
  deles, cobre quase toda. Sites de nota alta: 68% e 56%. Sites fracos: 48% e 39%.
- Só 15% dos heros não têm mídia nenhuma, e esses são frases de destaque tipográficas deliberadas.
- A mídia tem cantos retos em 73% dos sites. Onde os cantos são arredondados, o raio comum é de uns 12 px,
  aplicado igual em todas as imagens.
- As páginas de nota alta trazem muito mais imagens (mediana de 37 imagens contra 5 nas fracas): os sites
  fortes mostram, os fracos dizem.
- O que são as imagens, pela classificação do painel: mistura de tipos 32%, fotografia 14%, cenas generativas
  ou em WebGL 13%, interface real do produto 12%, renders 3D 11%, ilustração 9%, vídeo 6%, só tipografia
  3%.
- Entre os 54 sites com nota do painel abaixo de 6,8, a legibilidade (texto perdido sobre uma imagem carregada, ou
  contraste baixo demais) foi apontada como fraqueza em 13.
- No estudo de outubro de 2026 com 91 Sites of the Day do Awwwards (seção 12), a página mediana traz 7
  imagens (sites do topo 8, os mais baixos 2) e há vídeo em 42% dos sites (metade dos do topo, um
  dos 16 mais baixos).
- As imagens vêm em telas inteiras: 42% das telas roladas não têm nenhuma e 19% são 90% imagem ou mais.
- 94% das imagens têm cantos retos, e num site típico duas proporções concentram três quartos delas.

## 2. Decida que imagens existem

Em ordem de preferência:

1. **As imagens do próprio projeto.** Fotos do produto, o lugar, as pessoas, o trabalho. Até fotos
   comuns da coisa real ganham de fotos lindas de outra coisa. Pergunte o que existe; procure no
   repositório.
2. **Imagens que você pode gerar** com uma ferramenta de imagem nesta sessão. Escreva os prompts como o briefing de um
   fotógrafo: assunto, ângulo, luz, fundo, proporção do recorte e "sem texto". Gere o hero primeiro e
   faça o resto acompanhar a luz dele.
3. **Imagens reais do mundo do assunto, dos acervos abertos** (seção 3). Arquivos,
   museus e fotógrafos publicaram milhões de imagens que qualquer um pode usar dando o crédito: a
   cidade e a rua do cliente em cartões-postais antigos, mapas do bairro, os materiais dele, o ofício dele em
   gravuras, objetos de museu do mesmo tipo. Sempre que existir uma honesta, ela ganha de um desenho da
   mesma coisa: é real, tem um detalhe que nenhum desenho na cota de uma página alcança, e traz história.
   Honesta quer dizer que ninguém poderia tomá-la pelo produto, ambiente, prato, pessoa ou equipe do próprio cliente.
4. **Imagens que você desenha em código a partir do próprio assunto** (seção 8), para aquilo de que não existe
   imagem honesta: os objetos do produto em formas chapadas, os azulejos e as janelas do lugar, um mapa das
   ruas, o documento que uma ferramenta produz, a interface de um software. Nos testes, as páginas que
   desenharam o assunto com cuidado ganharam todas as vezes das que pegaram fotos sem relação emprestadas, e ganharam
   das que não mostravam nada.
5. **As fotos sorteadas na ficha da direção.** Fotos reais de lugares, luz, textura e
   clima. Use-as só onde cabe uma imagem honestamente genérica (o mar aberto para uma casa à beira-mar,
   a neblina para um retiro tranquilo). Elas não substituem um produto, prato, ambiente, pessoa ou
   tela específicos: uma estrada com neblina na página de um restaurante tem cara de banco de imagens na hora, e os jurados percebem.
6. **Só tipografia e cor,** feitas de propósito (seção 9).

Diga a verdade ao `draw.mjs` com `--have`. Se você não tem fotos do produto nem ferramenta de imagem, não
passe `product-photo`; o sorteio evita as direções que dependem de mostrar o objeto. Imagens
encontradas nos acervos abertos não são do projeto: não passe `photography` por causa delas.

## 3. Imagens reais dos acervos abertos

O `scripts/assets.mjs` busca em quatro fontes abertas sem chaves e imprime, para cada achado, uma URL direta da
imagem, a página de onde ela vem, o tamanho, o autor, a licença e uma linha de créditos:

- **Openverse**: um índice só sobre Flickr, Wikimedia Commons, museus e bibliotecas.
- **Wikimedia Commons**: fotos de arquivo, mapas antigos, digitalizações de gravuras e livros, lugares como
  estão hoje.
- **The Art Institute of Chicago** e **The Metropolitan Museum of Art**: pinturas, gravuras, desenhos,
  fotos, tecidos e objetos em domínio público, em digitalizações grandes.

```bash
node <skill>/scripts/assets.mjs "ghent postcard"
node <skill>/scripts/assets.mjs "fig" --source museums --orientation portrait
node <skill>/scripts/assets.mjs "basalt texture" --min-width 2400 --source openverse,commons
node <skill>/scripts/assets.mjs --get commons:36649959,met:707892     # baixa e registra os créditos
node <skill>/scripts/assets.mjs --credits                             # linha do rodapé e lista do relatório
```

Por padrão, ele fica só com licenças que permitem uso comercial (CC0, domínio público, CC BY, CC BY-SA) e
imagens de pelo menos 1.000 pixels de largura, e confere se toda imagem que imprime carrega de fato.
`--license pd` fica só com imagens que não pedem crédito; `--orientation`, `--min-width` e `--limit`
estreitam a lista; `--source` escolhe as fontes; `--json` dá os resultados crus. Cada resultado tem uma referência
(`commons:36649959`) que o `--get` recebe.

**O que buscar.** O inventário (passo 1 do SKILL.pt-BR.md), não a categoria: "padaria" acha as padarias dos
outros. O mundo do assunto é específico:

- **O lugar dele:** a cidade, a rua, o porto, o vale, em cartões-postais e fotos antigas
  ("ghent postcard", "rotterdam harbour 1920") e como estão hoje ("gent korenmarkt").
- **Os mapas dele:** o traçado das ruas, a carta náutica da baía, a geologia do vale ("ghent old map",
  "nautical chart lisbon").
- **Os materiais dele,** de perto o bastante para virar superfície: a pedra do cais, o veio do carvalho,
  o esmalte, os azulejos ("azulejo tiles", "basalt cobblestones", "oak grain").
- **A história do ofício dele:** as ferramentas antigas, o ofício em gravuras e catálogos comerciais, desenhos de
  patente ("bread oven engraving", "potter's wheel", "bicycle patent drawing").
- **Objetos de museu do mesmo tipo,** com `--source museums`: um aparelho de café de por volta de 1810 para um ateliê
  que faz aparelhos de café, uma xilogravura de uma onda para uma escola de surfe, um prato de porcelana pintado
  com figos para um pomar de figos.
- **Imagens científicas:** pranchas botânicas e zoológicas ("botanical engraving fig"), cartas celestes,
  fotos de microscópio, vistas de satélite do litoral, cortes geológicos.

Busque nas palavras do próprio lugar (azulejo, não "blue tile"; Korenmarkt, não "market square"), acrescente um
meio (postcard, engraving, old map, lithograph, aerial photograph) ou uma década, e tente duas ou três
buscas por ideia. As fontes de museu respondem melhor a uma ou duas palavras ("fig", "harbour", "teapot").

**O que faz um bom achado.**

- Ele pertence ao mundo deste assunto e não caberia na página do concorrente mais próximo.
- Ele ainda se lê no recorte que a parte da ficha pede. Olhe antes de decidir: o `--get` baixa, depois
  abra o arquivo. Título não é imagem.
- Ele é grande o bastante: o dobro da largura em que aparece, para tudo que é sangrado (o script imprime o
  maior tamanho disponível). Uma foto de 1.024 pixels do Flickr é, no máximo, uma imagem de meia largura.
- Ele forma uma família com os outros da página: todos gravuras, ou todos fotos de uma
  época, ou todos superfícies de perto na mesma luz. Um postal de 1900 ao lado de uma foto moderna de banco de imagens ao lado de uma
  prancha botânica parece um álbum de recortes.
- Sem marca d'água, sem texto ou logo embutido, sem moldura ou borda de scanner que não dê para recortar, e sem
  pessoa viva reconhecível que possa ser tomada pela equipe ou pelos clientes do cliente.

**Use com criatividade.** Imagens encontradas são material, não enfeite:

- **Uma foto de arquivo como hero,** sangrada: a rua como era há um século, atrás do
  nome do negócio que está nela hoje, com o ano na legenda.
- **Uma gravura de museu ampliada até o traço virar textura,** recortada bem fechada e voltando em
  escalas diferentes como o motivo único da página (a prancha inteira do figo no hero, uma única folha dela
  ao lado do cardápio).
- **Uma gravura ou um mapa em papel branco com `mix-blend-mode: multiply` sobre o campo de cor
  da página,** para a tinta assentar no fundo (seção 6).
- **O mapa real da rua como a seção de contato,** com a porta marcada, o norte e a escala
  tirados do original.
- **Um close de material como campo inteiro:** a pedra do cais atrás do horário de funcionamento.
- **Uma sequência de postais ou pranchas antigos como galeria,** um tamanho, um tratamento.

Os tratamentos ficam dentro da seção 6: sem retoque, preto e branco para o conjunto todo, ou multiply sobre um campo.

**Seja honesto.**

- **Uma imagem encontrada nunca é do cliente.** Ela pode mostrar a cidade do cliente, os materiais, a
  história, o tipo de coisa que ele faz; nunca pode substituir o produto, ambiente, prato,
  pessoa, equipe ou clientes do cliente. Se um visitante puder tomá-la como do próprio cliente (um balcão de padaria, um
  prato de massa, um barista sorrindo, um quarto de hóspedes), não use.
- **Legenda tirada da fonte,** quando uma legenda ajuda: o que é e quando, como o acervo descreve
  ("Gand, unloading a steamer, 1905"). Nunca escreva uma legenda que a ligue ao cliente.
- **Registre e dê crédito a toda imagem.** O `--get` grava a fonte, o autor, a licença e a página de cada
  download em `assets/credits.json`. CC BY e CC BY-SA exigem um crédito com o título, o autor,
  um link para a fonte e um link para a licença; o `--credits` os imprime como uma linha de HTML para
  o rodapé (seção 10). Imagens em domínio público não pedem crédito; dê assim mesmo.
- **Respeite a licença.** CC BY-SA: uma versão alterada (recolorida, combinada com outras imagens)
  tem de ser compartilhada sob a mesma licença. Licenças não comerciais (NC) e sem derivações (ND) estão fora
  para o site de um cliente, e por isso o script as deixa de fora, a menos que se peça. Leia as linhas `note`:
  algumas imagens têm direito de imagem ou marca registrada, são de domínio público só nos Estados Unidos,
  ou vêm com uma declaração do acervo no lugar de uma licença.
- **Baixe, não faça hotlink.** Salve o que usar no projeto: o `--get` põe em `assets/` com
  1.920 pixels de largura (passe `--width 1280` para uma imagem mostrada em meia tela, `--width 3840` para um
  hero muito grande quando a fonte tem). Assim a página funciona offline, não quebra quando um
  acervo muda um arquivo de lugar e não carrega do servidor de outra pessoa. Toda licença que o script
  aceita por padrão permite cópia.
- **Liste no relatório:** arquivo, título, autor, licença, página da fonte e onde fica o crédito.
  O `--credits` imprime essa lista também.

Se duas ou três buscas honestas por ideia não acharem nada que sirva, desenhe (seção 8). Um desenho feito para
o assunto é melhor que uma imagem encontrada que só chega perto. Se o script não alcançar nenhuma
fonte (sem rede), desenhe e diga isso no relatório. Para imagens em movimento, o mesmo script busca
vídeos reais com `--video` (seção 11).

## 4. As fotos sorteadas

- A ficha lista oito de um mesmo conjunto, para dividirem assunto e luz. Use de três a seis.
- Cada linha diz onde fica a área calma. Ponha o texto ali ou deixe o texto fora da imagem.
- Mais do mesmo conjunto ou de outro: `node scripts/draw.mjs --photos list`, `--photos <set>`, ou
  `--photos "fog coast"` para buscar nas descrições.
- As URLs têm a forma `https://picsum.photos/id/<id>/<width>/<height>`. Peça o tamanho exato em pixels em que
  renderiza, com o dobro do tamanho em CSS para ficar nítido, limitado a uns 2.400 de largura. Acrescente `?grayscale` para
  preto e branco.
- São fotos do Unsplash servidas pelo Lorem Picsum sob a licença do Unsplash. Liste os ids
  que usou no relatório; elas existem para serem trocadas pelas imagens do próprio projeto.

## 5. Recorte e posição

- **Escolha um conjunto pequeno de proporções e fique nele:** por exemplo, 4:5 para verticais, 16:10 para
  horizontais e 1:1 para detalhes. Proporções aleatórias parecem um despejo de banco de imagens.
- **Vá grande.** Uma foto em largura total, ou em meia tela e altura total, tem presença. Seis
  pequenas num grid não têm nenhuma. Se a imagem é boa, dê espaço a ela; se não é, corte.
- **Recorte com intenção.** Use `object-fit: cover` com um `object-position` escolhido para cada imagem, para o
  assunto ficar onde a composição precisa (fora do centro, num terço, encostado no lado do texto).
- **Deixe as imagens tocarem as bordas.** Sangrada, ou sangrando por um lado, parece desenhada. Uma imagem
  flutuando com margens iguais dos quatro lados parece posta no padrão.
- **Sobreponha pouco e de propósito:** uma headline cuja última linha passa por cima da borda de cima da
  imagem, uma imagem pequena sobrepondo uma grande numa medida fixa de 40–80 px. No máximo uma sobreposição por tela.
- **Cantos retos,** a menos que a direção ou a forma do motivo único diga outra coisa. Se arredondar, um raio só
  para todas as imagens da página.
- **Sem molduras:** sem bordas, sem sombras, sem mockups de aparelho, sem chrome (barras, bordas e controles em volta do conteúdo) de navegador em volta das imagens.
- **Legendas** são uma linha curta, no tamanho pequeno e na tinta suave, embaixo da imagem, alinhadas à esquerda com a
  borda dela. A maioria das imagens não precisa de nenhuma.
- Onde cada imagem vai na página, de que tamanho, e o que o celular faz com ela: seção 12.

## 6. Tratamento

Um tratamento para a página toda:

- **Sem retoque.** O padrão. Escolha imagens cuja luz já combine.
- **Preto e branco.** `filter: grayscale(1) contrast(1.05)`, ou `?grayscale` na URL. Unifica um conjunto
  misturado na hora e combina com direções editoriais e tipográficas. Aplique em todas as imagens ou em nenhuma.
- **Multiply sobre um campo.** Num fundo chapado claro, `mix-blend-mode: multiply` faz sumir o fundo branco de
  estúdio, e o produto fica direto sobre a cor.
- **Escurecida para uma página escura.** `filter: brightness(0.85) contrast(1.05)`, para as bordas da imagem afundarem
  no fundo.

Não são tratamentos: banhos de cor sobre fotos, sobreposições em duotone, desfoque, camadas de granulado, vinhetas,
molduras "polaroid" inclinadas com sombra.

Para texto sobre uma foto, um véu (camada escura translúcida) neutro cobrindo só a área do texto: um bloco sólido a 40–55% de preto,
ou um fade de 55% de preto até transparente no terço de baixo. Nunca uma sobreposição colorida.

## 7. Como mostrar software

- Construa em HTML um fragmento real da interface, no tamanho verdadeiro, com conteúdo crível, no lugar de
  uma captura encolhida ou de um mockup decorativo. Recorte a parte que prova o ponto: um controle,
  uma linha, um painel.
- Crível quer dizer rótulos reais, números reais que fecham a conta, um item em hover ou selecionado, alinhamento
  correto. Barras cinza no lugar de texto são piores que nenhuma imagem.
- Ponha o fragmento direto na página ou sobre uma cor de palco chapada. Nada de notebook, nada de moldura de celular, a menos que
  o produto seja um app de celular e a moldura seja um retângulo arredondado simples.
- Dentro de um fragmento valem as convenções da interface do próprio produto (os raios pequenos, as bordas de 1 px
  dos controles, uma sombra no menu aberto). Ponha o atributo `data-ui` no elemento raiz do fragmento: o
  inspetor e o linter deixam em paz o que está dentro e cobram as regras da casa da página em volta.
  `data-ui` é só para fragmentos recortados; envolver um título ou uma seção inteira nele reprova.
  Escreva o CSS do fragmento sob um seletor `[data-ui]` (`[data-ui] .row { … }`), para o linter
  distingui-lo dos estilos da página.
- Se o usuário fornecer capturas de tela reais, mostre-as grandes e sem recorte pelo menos uma vez.

## 8. Desenhe o assunto

Quando nada real pode ser fotografado e os acervos abertos não têm imagem honesta dele, desenhe,
e desenhe bem. SVG em linha e CSS bastam. Desenhos e imagens encontradas podem dividir uma página: as
encontradas mostram o mundo em volta do cliente, os desenhos mostram as coisas do próprio cliente.

- **Desenhe as coisas do próprio assunto,** não enfeite: as três pernas da banqueta e o veio do assento,
  a placa esmaltada sobre a porta da padaria, as duas janelas do refúgio e o cano do fogão, o traçado das ruas, a
  nota fiscal que a ferramenta emite, o palco do festival. Se você não consegue dizer o que um desenho retrata no mundo do assunto, é enfeite.
- **Uma linguagem gráfica para a página toda:** formas chapadas preenchidas, sem contorno ou com uma espessura de
  traço constante, o mesmo vocabulário de cantos e curvas em todo lugar, desenhado nas cores reais da paleta
  (campos de cor e cor de destaque com força total, não cinzas). Um conjunto de desenhos que claramente andam juntos
  vira identidade; uma mistura de estilos vira clip art.
- **A cor é o material.** Um produto vendido pelo acabamento é desenhado nas cores desse acabamento; uma casa de praia nos
  azuis do mar e na areia; nunca uma página de placeholders (conteúdo provisório) cinza.
- **Desenhe com três níveis de detalhe.** Os jurados chamaram os desenhos simples de "básicos" todas as vezes. Dê a cada
  desenho formas grandes que se leem num relance, formas médias que descrevem a coisa (a alça, o
  batente da janela, o degrau) e detalhes pequenos que premiam um segundo olhar (a marca do artesão, o número
  da casa, o azulejo lascado, a dobradiça, um passarinho no telhado). Faça a luz com degraus de tom chapados (uma face iluminada
  e uma face na sombra de cada volume), não com gradientes. Um desenho que passaria por ícone de placeholder em
  tamanho cheio não está pronto.
- **Desenhe grande e deixe trabalhar:** o desenho é o elemento dominante do hero, uma faixa de largura total, um conjunto
  de blocos, o símbolo do rodapé. Rabiscos pequenos espalhados parecem enchimento.
- **Deixe que ele leve a ideia pela página,** como faz um motivo: o mesmo objeto desenhado volta em
  escalas diferentes, o grid de azulejos vira o horário de funcionamento, o mapa vira a seção de reservas.
- **Honestidade:** diga com clareza, em texto pequeno perto do primeiro desenho ou no rodapé, que as imagens
  são desenhos até as fotos existirem, se de outro modo o cliente pudesse ser tomado como mostrando produtos
  reais. No relatório, liste quais desenhos são placeholders de fotografia.
- **Isto não:** manchas com sombreado em gradiente com cara de 3D, clip art isométrico, ilustrações genéricas em traço de
  pessoas no notebook, formas abstratas flutuando, ícones em quadrados. Esse é o visual genérico de IA.

## 9. Só tipografia e cor

Isso é um design legítimo, não uma lacuna a disfarçar. Só 7 dos sites estudados não usam imagem nenhuma,
e eles se sustentam: nota mediana do painel de 7,5 contra 7,2 do conjunto todo.

- Faça da tipografia a imagem: uma frase de destaque a 10–14vw, uma lista composta a 5vw, algarismos em tamanho display.
- Use cor em escala: um campo inteiro, uma seção invertida, uma divisão em dois campos.
- Use a forma do próprio assunto como um motivo chapado, se a direção pedir (um círculo, um arco, um
  entalhe), desenhado em CSS e recortado pela viewport.
- Não acrescente: ícones em quadrados, gradientes abstratos, grids de pontos, divisórias em onda, formas flutuando, emoji,
  ilustrações genéricas em traço, nem uma caixa vazia onde uma imagem "vai entrar".

## 10. Markup e créditos

Uma imagem encontrada, baixada para o projeto com `--get`, usada como hero:

```html
<img src="assets/fig-engraving.jpg" width="1920" height="2807" fetchpriority="high" decoding="async"
     alt="Gravura colorida à mão de um figo aberto, com as flores e as sementes, em preto, rosa e verde">
```

Uma foto sorteada mais abaixo na página:

```html
<img src="https://picsum.photos/id/626/2400/1500" width="2400" height="1500"
     alt="Farol vermelho e branco num mar turquesa abaixo de uma falésia de calcário" loading="lazy" decoding="async">
```

Os créditos, como o `--credits` os imprime, no rodapé:

```html
<p class="credits">Pictures: <a href="https://commons.wikimedia.org/wiki/File:Fig_(Ficus_carica_L.);_57_segments_of_flowers_and_fruits_at_Wellcome_V0043000.jpg">“Fig (Ficus carica L.): 57 segments of flowers and fruits”</a>, <a href="https://creativecommons.org/publicdomain/mark/1.0/">public domain</a>, via Wikimedia Commons.</p>
```

- Sempre `width` e `height` (ou `aspect-ratio` no CSS), para nada pular enquanto carrega.
- `loading="lazy"` em tudo, menos na imagem do hero, que leva `fetchpriority="high"`.
- O `alt` descreve a imagem em palavras simples. Repetições decorativas levam `alt=""`. O alt sugerido
  pelo script é o título do acervo; reescreva para dizer o que a imagem mostra.
- Um `background-color` com cor no contêiner da imagem (o tom do fundo ou da superfície), para o layout ficar
  inteiro antes de a imagem chegar.
- A linha de créditos faz parte do design do rodapé, com contraste total e com os links. Componha no tamanho
  do texto corrido; um degrau menor só numa página com bastante texto corrido, porque uma linha de créditos longa em
  letra pequena pode virar o tamanho de texto mais comum da página e reprovar na checagem de tamanho do texto do inspetor.
  Uma linha para todas as imagens; nada de legendas de crédito sobre as próprias imagens. Dê crédito só às
  imagens que a página ainda usa.
- Uma imagem quebrada reprova no inspetor. Confira cada imagem nas capturas.

## 11. Vídeo

Uma imagem em movimento do mundo do assunto pode sustentar uma seção como uma foto: o rio no
fim da rua, o tambor do torrador girando, uma estrutura de madeira subindo. O `assets.mjs --video`
busca vídeos reais sem chaves: Wikimedia Commons (todo vídeo lá vem com versões convertidas
em tamanho de web; a melhor fonte para vídeos curtos), os Prelinger Archives do Internet Archive (filmes industriais,
educativos, de cidade e caseiros dos anos 1920 aos 1970, na maioria em domínio público e na maioria longos)
e a NASA (a Terra vista da órbita, lançamentos, aeronaves, laboratórios). O resto do Internet Archive fica
de fora: qualquer um pode subir arquivos lá, e as licenças declaradas não são conferidas.

```bash
node <skill>/scripts/assets.mjs "coffee roasting" --video
node <skill>/scripts/assets.mjs "river" --video --source commons,nasa --orientation landscape
node <skill>/scripts/assets.mjs --get commons:49769620        # o vídeo, um quadro de poster, o crédito
```

Ele pega uma versão de 720p ou menor (`--res` muda isso), lista os vídeos curtos primeiro, imprime a
duração e o tamanho do arquivo de cada um e marca tudo acima de 25 MB ou de mais de um minuto. O `--get` recusa um
vídeo acima de 25 MB, a menos que você passe `--max-mb`, e salva ao lado a imagem parada da fonte como
poster (Commons e NASA; as imagens paradas do próprio Internet Archive são pequenas demais). Um filme de arquivo de dez minutos é
pesado demais como está: corte alguns segundos dele com o ffmpeg, se estiver instalado, ou escolha um
vídeo mais curto. Licenças, créditos e honestidade funcionam exatamente como nas imagens (seção 3).

**Como escolher um vídeo.**

- **Curto:** de 5 a 20 segundos que fazem loop sem salto visível: água, fumaça, um tambor girando, trânsito,
  folhas, uma multidão de longe. Assista até o fim antes de escolher.
- **Leve:** abaixo de uns 5 MB para uma seção e 10 MB para um hero. No estudo, as fontes são 1920×1080
  (a mais comum) ou 1280×720, duração mediana de 10 s; 720p sobra atrás de texto. Para um hero sangrado,
  corte uma versão vertical de 720×1280 para o celular, ou defina o `object-position` no assunto.
- **Limpo:** sem claquete, cartela, logo, marca d'água ou legenda embutida. Os filmes da NASA e de arquivo muitas vezes
  abrem com uma claquete, e o quadro de poster da fonte pode ser essa claquete. Sem pessoa reconhecível que possa
  ser tomada pela equipe ou pelos clientes do cliente.
- **Nunca é do cliente:** um vídeo encontrado de uma torrefação não é esta torrefação.
- **Vídeos encontrados: um por página, dois no máximo.** Um vídeo encontrado mostra o mundo em volta do cliente; um
  terceiro transforma isso em tema. A filmagem do próprio projeto aguenta mais: no estudo, um site com
  vídeo traz uma mediana de três ou quatro. Em todo caso, **uma imagem em movimento por tela**;
  dois loops rodando lado a lado são ruído.

**Na página.**

- Sem som, em loop, em linha, com poster e tamanho fixo, como o `--get` imprime:
  `<video autoplay muted loop playsinline preload="metadata" poster="assets/river-poster.jpg"
  width="854" height="480" aria-hidden="true"><source src="assets/river.webm" type="video/webm"></video>`.
  Sem som e sem controles num loop decorativo. `aria-hidden` porque é enfeite: o que o
  vídeo diz que importa vai no texto ao lado.
- O poster aparece antes de o vídeo tocar, em conexões lentas e com movimento reduzido, então tem de
  funcionar sozinho como imagem. Se a imagem parada da fonte for uma claquete ou um borrão, tire você mesmo um quadro do vídeo
  ou use uma imagem encontrada.
- No estudo, só 31% dos vídeos tinham poster, e o painel registrou como defeito as caixas vazias e cinza
  antes de eles tocarem. Aqui todo vídeo tem um.
- Toque um vídeo só enquanto ele está à vista, e nenhum sob `prefers-reduced-motion: reduce`, onde o
  poster aparece no lugar:

  ```html
  <script>
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    const clips = [...document.querySelectorAll('video[autoplay]')];
    const inView = new Set();
    const sync = (v) => {
      if (calm.matches) return;
      if (inView.has(v)) v.play().catch(() => {}); else v.pause();
    };
    const settle = () => {
      for (const v of clips) {
        if (calm.matches) { v.removeAttribute('autoplay'); v.pause(); v.load(); }
        else if (inView.has(v)) v.play().catch(() => {});
      }
    };
    const watch = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target);
        sync(e.target);
      }
    }, { threshold: 0.2 });
    clips.forEach((v) => watch.observe(v));
    settle();
    calm.addEventListener('change', settle);
  </script>
  ```

- Recorte e posicione como uma foto (seções 5 e 6): `object-fit: cover`, uma proporção, cantos
  retos, sem moldura, um `background-color` na cor do fundo enquanto carrega.
- Nunca sob texto corrido. Sobre um vídeo ponha no máximo uma headline, uma linha e uma ação, e confira o
  contraste onde elas ficam ao longo do loop inteiro, não só no poster: um vídeo escuro num
  segundo pode estar claro no seguinte. Se algum quadro cair abaixo de 4,5:1 (3:1 para 24 px ou mais), use o
  véu da seção 6 ou tire o texto de cima do vídeo. Nada fica por cima de uma headline ou de uma frase de destaque.
- É movimento: deixe que seja a única coisa que se mexe na página, ou que fique numa seção onde nada mais se mexe.
- Dê o crédito junto com as imagens: o `--credits` imprime uma linha de rodapé para os dois ("Pictures and footage:")
  e a lista para o relatório, com a duração de cada vídeo.
- Onde vai o vídeo (fundo do hero, loop em linha, a moldura que cresce, um card fixo no canto) e o que
  o estudo mediu sobre isso: seção 12. Nada que importa toca só no hover, e um filme inteiro
  com som fica atrás de um botão de play que abre um player com controles.

## 12. Onde vão as imagens e os vídeos

O que as páginas fortes fazem com as imagens, medido nos 100 Sites of the Day mais recentes do Awwwards
(de 10 de julho a 17 de outubro de 2026, capturados em 1440×900 e 390×844). 91 puderam ser usados. Um painel descreveu onde
cada imagem estava e deu nota a cada site do jeito do Awwwards, e um script mediu quanto de cada tela
é imagem. "Topo" quer dizer nota do painel de 7,5 ou mais (36 sites); "mais baixos", abaixo de 7,3 (16 sites). As
notas ficam próximas umas das outras (de 6,7 a 7,9) e uma nota sozinha carrega cerca de meio ponto de ruído, então leia
as relações entre uma posição e a nota como tendências, não leis.

### Quanto de cada tela é imagem

- **Tudo ou nada.** Contando fotos, vídeos e fundos de imagem (não canvas), a tela rolada
  mediana do estudo é 16% imagem, mas poucas telas ficam perto disso: 42% não têm imagem e
  19% são 90% imagem ou mais. Só 19% ficam entre 20% e 60%. Uma imagem ou comanda a tela ou
  fica fora dela.
- **Cerca de um terço, com pausas.** Nos 67 sites que põem imagens na página, a tela média é
  36% imagem (metade do meio 18–69%). Os sites do topo ficam em 30% e deixam 28% das telas sem imagem
  nenhuma: as telas de tipografia são as pausas entre as telas de imagem.
- **A primeira dobra.** Uma imagem cobre pelo menos metade dela em 41% dos sites e quase toda
  em 32%. Uma foto ou filme sangrado é a primeira dobra inteira em 29%; o vídeo é a imagem principal do hero
  em cerca de um quarto.
- **Uma cena não é uma imagem.** 66 dos 91 mantêm um canvas WebGL sobre pelo menos 30% da tela, então,
  contando os canvas, a tela mediana fica toda coberta. Nos sites de nota mais baixa, esse canvas muitas vezes
  é tudo o que existe: os cinco sites usáveis mais baixos (de 6,7 a 7,0) desenham tudo nele e põem no máximo duas
  imagens na página.
- **O texto ocupa pouca área.** A tela mediana é 8% texto. A tipografia é grande e esparsa em volta das
  imagens, não apertada ao lado delas.
- **Fora do centro.** Medido por seção nos sites rastreados, as imagens ficam à esquerda ou à direita
  939 vezes, centralizadas 273 vezes, e sangradas ou atrás do texto 269 vezes.
- **O celular tem mais imagem,** não menos: 19% de uma tela de celular na mediana, e 27% da
  primeira dobra no celular contra 17% no desktop. Imagens sangradas são recortadas de novo na vertical e enchem a
  tela; as divisões põem a imagem primeiro, em largura total.

### Quantas

- **Sete imagens por página** na mediana (metade do meio 1–25). Sites do topo 8 (metade do meio 4–27), mais baixos
  2 (0–4). O piso do passo 6 do SKILL.pt-BR.md, quatro e normalmente de seis a doze, é a metade forte do
  estudo.
- **Vídeo em 42% dos sites:** em metade dos sites do topo e metade da faixa do meio, e em um dos
  16 mais baixos. Um site com vídeo traz uma mediana de três ou quatro.
- **De três a cinco posições.** Os sites que usam duas ou menos das posições abaixo têm média de 7,31;
  os que usam três ou mais têm média de cerca de 7,5. O site mediano do topo usa quatro; o site mediano mais baixo,
  uma. Numa página desenhada, o lugar das imagens muda de seção para seção.

### As posições, em ordem

| Posição | Sites (de 91) | Topo (de 36) | Mais baixos (de 16) | Nota média com / sem |
| --- | --- | --- | --- | --- |
| Dividida: imagem em metade ou dois terços | 32 | 17 | 2 | 7,50 / 7,38 |
| Galeria horizontal | 32 | 13 | 4 | 7,44 / 7,41 |
| Faixa sangrada entre seções | 31 | 14 | 3 | 7,48 / 7,40 |
| Foto ou filme sangrado como primeira dobra | 26 | 10 | 3 | 7,45 / 7,41 |
| Mosaico irregular | 25 | 11 | 1 | 7,49 / 7,40 |
| Imagem parada enquanto o texto rola | 23 | 12 | 1 | 7,52 / 7,39 |
| Vídeo atrás do texto | 22 | 8 | 2 | 7,46 / 7,41 |
| Grid regular | 20 | 11 | 2 | 7,48 / 7,41 |
| Colagem espalhada | 19 | 6 | 3 | 7,47 / 7,41 |
| Painel deslizando sobre uma imagem parada | 19 | 8 | 2 | 7,48 / 7,41 |
| Moldura recuada que cresce | 17 | 7 | 1 | 7,52 / 7,40 |
| Uma imagem centralizada num campo de cor | 14 | 5 | 3 | 7,38 / 7,43 |
| Objeto recortado num campo chapado | 13 | 7 | 1 | 7,57 / 7,40 |
| Índice com prévia no hover | 12 | 6 | 1 | 7,49 / 7,41 |
| Galeria 3D | 12 | 4 | 4 | 7,30 / 7,44 |
| Card pequeno fixo num canto | 11 | 5 | 1 | 7,47 / 7,42 |
| Imagem dentro ou na frente da tipografia display | 11 | 7 | 1 | 7,50 / 7,41 |
| Uma imagem pequena ao lado de uma frase de destaque | 8 | 5 | 0 | 7,56 / 7,41 |
| Imagens pequenas entre as palavras | 6 | 4 | 0 | 7,52 / 7,42 |

- Aparecem nas páginas do topo mais do que a parte delas e quase nunca nas mais baixas: a dividida, a imagem parada
  enquanto o texto rola, o mosaico irregular, a moldura recuada que cresce, o recorte num campo chapado e
  as imagens compostas com a tipografia (as três últimas linhas juntas: 24 sites, 16 do topo, 1 entre os mais baixos).
- A galeria horizontal é comum em todas as faixas e não eleva nada. Use onde navegar é o objetivo.
- A galeria 3D é a única posição que anda junto com notas mais baixas, e com a menor usabilidade da
  tabela (5,9 contra 6,35 de todos os sites).

### Cada posição

Cada item diz quando usar, a geometria em 1440×900, a versão de celular e como ela falha.

**Dividida: imagem em metade ou dois terços**

- *Quando.* Uma afirmação e a imagem que a prova. O jeito mais comum de as páginas fortes juntarem palavras e
  imagem.
- *Geometria.* A imagem ocupa 42% da largura na mediana (metade do meio 33–49%), até dois terços,
  na altura total da seção: 680×850 e 720×900 são típicos. 38% dessas imagens são
  verticais, na maioria 4:5 ou 3:4. O texto começa na linha dos 50% (x = 720) ou na linha onde a
  imagem termina, alinhado em cima ou fixado embaixo, não centralizado na metade dele. Deixe a imagem tocar a viewport
  no lado de fora: só cerca de 30% tocam no estudo, e as que têm margem em todos os lados parecem
  postas no padrão (seção 5). Alterne os lados só ao longo de três fileiras ou mais.
- *Celular.* Imagem primeiro, em largura total (4:5, ou 4:3 para uma horizontal), texto embaixo.
- *Falha.* A mesma divisão em três seções seguidas; uma imagem flutuando no meio da metade dela; uma
  coluna de texto mais estreita que uns 30 caracteres.

**Faixa sangrada**

- *Quando.* Uma imagem sustenta uma tela inteira entre telas de tipografia: o lugar, o trabalho, o objeto em
  tamanho cheio. No máximo uma a cada três ou quatro telas.
- *Geometria.* 100% de largura e de uma a uma tela e meia de altura (mediana de 900 px em 1440×900, metade do meio
  890–1.170 px; proporções de 1,4 a 1,9). Para um parallax lento, a imagem fica maior que a moldura em 4–10%
  (32–72 px de cada lado no estudo) e não se desloca além disso. O texto é uma headline e uma linha, ou
  nada, fixado a 32–64 px de um canto, sobre a parte calma da imagem.
- *Celular.* Um novo recorte vertical que enche a tela, com o `object-position` no assunto; o
  texto desce para o quarto de baixo.
- *Falha.* Texto branco de 11–14 px sobre uma área clara; três faixas sem nada entre elas; uma faixa que
  só enfeita.

**Imagem parada enquanto o texto rola**

- *Quando.* Uma lista, passos ou um parágrafo longo que pertencem todos a uma imagem. Se a imagem muda a
  cada item, é o índice com prévia, abaixo.
- *Geometria.* Um palco sticky (gruda na tela enquanto a página rola) de 100vh dentro de uma seção de duas a seis telas (pistas de rolagem
  de 1.800–5.400 px são típicas no estudo). A imagem ocupa uma metade (685×880 é uma vertical típica), dois terços, ou
  a tela inteira, com o texto passando por cima num painel sólido. Linhas de texto a cerca de 150 px uma da outra, para duas
  ou três estarem à vista ao mesmo tempo.
- *Celular.* Solte o sticky: imagem primeiro, texto embaixo. Se a imagem troca a cada item, mantenha-a como
  faixa nos 40% de cima da tela.
- *Falha.* Pistas de rolagem longas em que o texto já sumiu e só sobrou a imagem parada (o
  painel registrou vários palcos vazios no celular); texto corrido composto sobre a imagem parada.

**Moldura recuada que cresce**

- *Quando.* Uma vez por página, para o filme ou a imagem de que a página trata, como a passagem da tipografia para a
  imagem.
- *Geometria.* A moldura começa centralizada com 35–50% da largura (549×366, 710×480 e 864×540 no
  estudo) ou como um recuo de 16 px em volta de uma tela inteira, e cresce até a largura e a altura totais ao longo de
  720–2.700 px de rolagem. Qualquer raio de canto vai a 0 quando ela chega às bordas. Uma headline fica acima dela
  antes de começar; nada mais na tela se mexe enquanto ela cresce.
- *Celular.* Comece em largura total dentro das margens de 16 px e cresça até uma vertical sangrada, ou pule o
  crescimento.
- *Falha.* O crescimento é a única coisa na tela por três rolagens; um spinner de carregamento ou uma caixa vazia
  no primeiro quadro (dê um poster, comece a carregar antes de ela entrar); usada duas vezes.

**Mosaico irregular**

- *Quando.* Um conjunto de trabalhos, ou um lugar visto de vários jeitos: de cinco a doze imagens.
- *Geometria.* Duas colunas, ou fileiras de três num grid de 24 colunas. Duas ou três larguras de imagem (por
  exemplo, 32%, 48% e 65% da largura, ou 5, 7 e 12 colunas), vizinhas deslocadas na vertical em
  120–190 px, 130–450 px entre as fileiras, uma ou duas proporções, uma legenda embaixo de cada.
- *Celular.* Uma coluna alternando largura total e cerca de 70% da largura, ou duas colunas de blocos de 120–180 px
  que mantêm os deslocamentos.
- *Falha.* Proporções aleatórias com deslocamentos aleatórios, que parecem um despejo de banco de imagens. Legendas em mono de 9–12 px com
  números de índice, o hábito dos sites premiados: aqui a legenda é uma linha na fonte de texto, no tamanho do texto corrido, sem
  número.

**Galeria horizontal**

- *Quando.* Um conjunto que as pessoas percorrem em qualquer ordem: produtos, quartos, eventos, uma equipe.
- *Geometria.* Cards de 25–35% da largura (435×326 com espaços de 20 px em 1440: três inteiros e um quarto
  cortado pela borda), ou uma tira numa altura fixa com larguras variadas (576 px de altura no estudo), ou um
  slider cujo slide central tem cerca de 73% da largura, com 170–180 px de cada vizinho à mostra. Sempre
  cortada pela borda direita, para parecer que há mais. Um marquee (faixa que corre sozinha) de imagens anda devagar: 60–120 s por volta.
- *Celular.* Um card a 75–80% da largura (290–300 px de 390) com o seguinte à mostra; deslize com o dedo.
- *Falha.* Setas sem arrastar nem deslizar; um marquee de coisas que as pessoas precisam ler; um carrossel com a
  única imagem importante da página.

**Painel deslizando sobre uma imagem parada**

- *Quando.* Uma troca de capítulo: a imagem fica parada e a seção seguinte sobe por cima dela.
- *Geometria.* A imagem é sticky a 100vh; o fundo da seção seguinte sobe por cima dela em largura total,
  com a borda de cima reta ou com uma forma tirada do assunto (o estudo tem o arco das janelas de um prédio).
  Aqui é um painel sólido com cantos retos: nada de topos de folha arredondados, nada de vidro fosco.
- *Celular.* Igual.
- *Falha.* Pilhas de cinco ou seis cards em que os anteriores ficam como lascas; empilhar por empilhar.

**Grid regular**

- *Quando.* Só para um acervo (layout.md §5): a linha de uma loja, a equipe, um cardápio, a lista completa de trabalhos.
- *Geometria.* Duas, três ou quatro por fileira, células iguais, espaços de 8–16 px, uma proporção (4:5 é a mais comum),
  a legenda embaixo de cada imagem.
- *Celular.* Duas por fileira para produtos, uma para trabalhos e pessoas.
- *Falha.* Três cards iguais como "recursos do produto". Cards com um gradiente escuro no pé para o rótulo ficar
  sobre a imagem, comum no estudo: aqui o rótulo vai embaixo da imagem.

**Índice com prévia no hover**

- *Quando.* Uma lista de oito ou mais projetos ou clientes em que os nomes importam tanto quanto as imagens.
- *Geometria.* Linhas a cada 45–80 px, nomes de 30–60 px. Uma imagem por vez, com cerca de um terço da
  largura em 16:9 ou uma vertical de 300–450 px de altura, num lugar fixo (a metade direita a partir da linha dos 50%, ou
  o centro), trocada em até 0,3 s. Uma versão que dispensa o mouse: os nomes rolam sobre uma imagem
  fixa no centro, e a imagem mostra o nome que está passando por ela. No estudo, a imagem
  fica por cima dos nomes; aqui nada fica por cima de tipografia grande, então os nomes passam na frente dela.
- *Celular.* Sem hover. Dê a cada linha uma miniatura de cerca de 100 px de largura, ou use a versão com rolagem.
- *Falha.* Imagens que nunca aparecem numa tela de toque. Linhas separadas por fios finíssimos, o hábito dos sites
  premiados: aqui as linhas se separam por espaço, e a linha ativa pela tinta ou por uma troca de fundo.

**Uma imagem num campo de cor, ou uma imagem pequena ao lado de uma frase de destaque**

- *Quando.* Uma pausa na página: um único retrato ou objeto. Ou uma imagem pequena que dá um rosto a uma frase de
  destaque.
- *Geometria.* Uma única imagem centralizada em 3:4 e com 75% da altura da viewport, sobre um fundo tirado
  da imagem. Ou uma imagem pequena de 7–26% da largura (108–374 px) ao lado, acima ou entre as linhas
  de uma frase de destaque de 48–136 px, alinhada a uma das linhas.
- *Celular.* A imagem acima da frase, com 60–100% da largura.
- *Falha.* Usada como padrão para toda imagem: uma imagem com margens iguais em todos os lados parece
  posta no padrão (seção 5).

**Imagens pequenas entre as palavras**

- *Quando.* Uma frase de destaque sobre as próprias coisas (materiais, pessoas, produtos), numa tela só
  dela.
- *Geometria.* De duas a quatro imagens-chip na frase, da altura das maiúsculas até três quartos do tamanho da
  letra, e de uma a uma vez e meia isso de largura (50×46 px numa linha de 60 px; 113×75 px entre as duas
  palavras de um nome de 150 px), todas da mesma sessão de fotos, cantos retos. Dê largura e altura para as linhas
  não pularem enquanto carregam.
- *Celular.* Mantenha-as em linha, na altura do texto.
- *Falha.* Mais de quatro; chips de sessões diferentes; um chip que traz uma informação que as palavras
  não trazem.

**Imagem dentro ou atrás da tipografia display**

- *Quando.* O objeto é o assunto: um produto, um prédio, uma pessoa.
- *Geometria.* Uma pequena janela de imagem fica dentro de um bloco de tipografia display de 150–200 px e depois se abre
  na tela seguinte; ou o objeto fica atrás das letras, aparecendo entre elas e em volta;
  ou toca a borda da palavra sem cobrir nenhuma letra. No estudo, o objeto fica mais vezes
  na frente e cobre uma ou duas letras, ou uma linha de texto passa atrás de uma imagem quadrada; aqui
  nada fica por cima de uma headline (o inspetor reprova texto grande com um quinto ou mais escondido), então a
  tipografia fica na frente.
- *Celular.* Mantenha, com a tipografia a cerca de 15vw, e confira se a palavra ainda se lê.
- *Falha.* Um objeto por cima das letras; tipografia deslocada ou com glitch por causa da imagem.

**Objeto recortado num campo chapado**

- *Quando.* Produtos e objetos. A maior nota média da tabela, em 7 dos 36 sites do topo.
- *Geometria.* O objeto com 35–60% da largura num fundo chapado tirado das cores dele mesmo, apoiado
  na borda de baixo ou saindo por um lado, com a tipografia atrás ou ao lado.
- *Celular.* O objeto com 80–90% da largura, embaixo da headline.
- *Falha.* Um render flutuando no vazio, sem chão; uma sombra projetada acrescentada a um recorte (aqui não há sombras
  de apoio; mantenha uma sombra de contato só se ela foi fotografada).

**Colagem espalhada**

- *Quando.* Acervos, materiais efêmeros, um festival de muitas coisas pequenas. Com moderação: ela é quase tão comum nas
  páginas mais baixas quanto nas do topo.
- *Geometria.* De seis a dezesseis imagens de 100–300 px, em poucos tamanhos, em volta de um título centralizado, nunca por cima
  dele.
- *Celular.* Reempilhe como pares sobrepostos numa coluna.
- *Falha.* Fotos inclinadas e adesivos com sombras deslocadas, comuns no estudo e que não são tratamento
  aqui (seção 6); imagens cruzando o texto.

**Card pequeno fixo num canto**

- *Quando.* Um atalho permanente para o reel ou para a próxima coisa.
- *Geometria.* De cerca de 216×144 a 240×140, a 30–43 px do canto; um por página.
- *Celular.* Tire, ou passe para o fluxo da página.
- *Falha.* Conteúdo rolando por baixo dele; um segundo card.

**Galeria 3D**

- *O que é.* Imagens num anel, esfera, hélice ou túnel numa cena WebGL, giradas pela roda do mouse ou
  arrastando.
- *No estudo.* 12 sites, 4 deles entre os 16 mais baixos; nota média de 7,30 contra 7,44, usabilidade de 5,9
  contra 6,35.
- *Aqui.* Não construa. Mostre as mesmas imagens como um índice com prévias ou uma galeria horizontal.

### Vídeos

**O que o estudo mediu.**

- Vídeo em 38 dos 91 sites (42%): 18 dos 36 sites do topo, 19 dos 39 do meio, 1 dos 16
  mais baixos. Um site com vídeo traz uma mediana de três ou quatro (metade do meio 1–8).
- O vídeo cobre pelo menos metade da primeira dobra em cerca de um quarto dos sites, e é sangrado
  em quase todos eles.
- Os vídeos são curtos: mediana de 10 s, metade do meio 5–14 s; 61% têm 10 s ou menos e 88%, 20 s ou menos.
- Todo vídeo decorativo é sem som, em loop, toca em linha e não tem controles. O atributo autoplay está em
  44% dos vídeos; o resto é iniciado por script, na maioria quando entra na tela.
- Só 31% dos vídeos têm poster (13 dos 38 sites). O resto mostra uma caixa vazia ou cinza até
  tocar, e o painel registrou isso como primeira pintura em branco. Aqui o poster é obrigatório (seção 11).
- Fontes: 1920×1080 é a mais comum, depois 1280×720; vídeos verticais de 450×800 ou 540×960 para celular e
  blocos verticais. Largura mediana da fonte: 1.080 px.
- Na página: 16:9 41%, quadrado 19%, vertical (de 4:5 a 9:16) 25%, 4:3 ou 3:2 12%. Cantos retos em 75%
  (o resto, 8 px ou menos, ou 20–32 px). `object-fit: cover` em 84%, contain em 16% (tiras de produto, filmes
  com tarja preta).

**Onde vai.**

- **Fundo do hero:** sangrado, cover, muitas vezes maior que a moldura em 1–25%, para um deslize ou zoom nunca mostrar uma
  borda. Ou uma tomada lenta só, ou uma montagem cortando a cada um ou dois segundos.
- **Em linha, como imagem:** em divisões, blocos e cards, com cerca de um terço da largura (mediana de 33%,
  metade do meio 24–45%); um terço desses vídeos tem menos de um quarto da largura e menos de um em
  dez tem largura total. Assuntos lentos, quase parados (água, pele, luz, um objeto girando), parecem fotos
  vivas e combinam bem com imagens paradas.
- **A moldura que cresce** (acima), para um reel.
- **Um card fixo** (acima): um vídeo pequeno num canto.
- **No hover:** só dois ou três sites tocam vídeos no hover, todos num índice ou lista. Nada
  que importa deve tocar só no hover; celular não tem hover.
- **Filmes inteiros:** cerca de dez sites oferecem um filme inteiro atrás de um botão de play que abre um player com
  controles. Nenhum o toca sozinho.
- **Som:** seis sites oferecem som atrás de um toggle; nenhum vídeo começa com som.

**Como o texto fica sobre ele.**

- Dos cerca de 30 sites com foto ou filme sangrado atrás do texto na primeira dobra, uns 14 põem a
  tipografia direto sobre ele e contam com o vídeo ter tratamento de cor escuro onde o texto fica; uns 10 o escurecem
  (a meio brilho, sob uma camada escura de 30–40% ou com um fade escuro nos 180–590 px de baixo);
  uns 6 deixam o texto fora da imagem, acima dela ou num card sólido.
- O que vai sobre o vídeo no estudo é o nome ou uma headline de 47–136 px e uma linha curta, fixados
  embaixo à esquerda ou centralizados. Onde texto corrido de 11–14 px foi posto sobre vídeo ou sobre uma foto carregada, o painel
  apontou como defeito, também em sites de nota alta.
- Aqui: no máximo uma headline, uma linha e uma ação sobre o vídeo, e nunca texto corrido. Confira o contraste
  onde a tipografia fica ao longo do loop inteiro, não só no poster; se algum quadro cair abaixo de 4,5:1
  (3:1 para texto de 24 px ou mais), use o véu da seção 6 ou uma faixa sólida.

**No celular.** O vídeo é recortado de novo numa vertical de tela cheia (uma fonte vertical separada, ou
`object-position` no assunto); as molduras recuadas ficam sangradas. Um site do estudo acrescenta um véu de 40%
só no celular, onde o texto cobre mais da imagem.

### Recortes e tratamento

- **Proporções.** De 1.356 imagens e vídeos medidos: 4:5 21%, 16:9 19%, 1:1 16%, 16:10 10%, 3:2 7%, 2:3
  5%, 4:3 5%, 5:4 4%, 3:4 3%, mais largas que 2:1 6%, 9:16 ou mais altas 3%. Horizontais 52%, verticais 33%,
  quadradas 15%.
- **Duas proporções fazem a maior parte do trabalho.** Nos sites com quatro imagens ou mais, as duas proporções mais comuns
  concentram 76% das imagens. As outras (cinco proporções ao todo na mediana) são exceções com motivo:
  uma vertical alta numa sequência de horizontais, uma faixa larga.
- **Cantos retos** em 94% das imagens; 62 dos 68 sites com imagens na página mantêm pelo menos 80%
  delas com cantos retos. Onde os cantos são arredondados, é 5 px ou menos em dois terços deles, ou 20–32 px em
  interfaces de cards, um valor por site.
- **Cover.** `object-fit: cover` em 78%, contain em 10% (um produto num bloco, um filme com tarja preta).
- **Sem retoque.** Filtros de CSS mexem nas imagens em só 9 sites, na maioria para estados de hover. Um punhado usa
  fotografia em preto e branco como conjunto; dois aplicam multiply de papel digitalizado sobre o fundo. Vários mantêm a
  interface em preto, branco e cinza e deixam as fotos trazerem toda a cor.
- **Comuns no estudo, não são tratamentos aqui** (seção 6): uma camada fixa de granulado sobre a página toda
  (cerca de um terço dos sites), fotos em duotone ou tingidas, cópias desfocadas atrás de uma imagem como
  brilho, fotos inclinadas e adesivos com sombras deslocadas.
- **Aumente só na medida do deslocamento.** 22 sites movem imagens com a rolagem, aumentando-as em
  1–25%. Aumente pelo deslocamento e nada mais, numa imagem por tela.
- **Resolução.** O estudo serve imagens a uma mediana de 1,9 vez a largura em CSS, mas 17% são servidas
  menores do que aparecem, e as imagens de largura total a uma mediana de só 1.440 px. Aqui: o dobro da largura
  em CSS, limitado a cerca de 2.400 px (seção 4).

### Texto sobre imagens

- No estudo, o texto fica sobre imagens com frequência e é conferido raramente: cerca de 28 anotações registram texto posto
  direto sobre uma imagem sem véu, e os defeitos de 16 sites incluem texto perdido sobre imagens: rótulos
  e texto corrido de 8–14 px sobre fotos, e navegação em modo de mesclagem difference ou sem fundo passando
  por cima delas.
- Onde funciona, o texto é de tamanho display e fica sobre a parte calma (céu, uma parede escura, o lado
  da sombra), fixado num canto ou ao longo de uma borda. Duas outras formas no estudo: um card sólido na
  cor do fundo, recuado sobre a foto e levando o título, e texto sobre o branco de uma imagem
  que se dissolve na página.
- Aqui: sobre uma imagem, ponha só texto display, uma linha curta e uma ação. Texto corrido, legendas e
  rótulos vão ao lado ou embaixo. Meça o contraste na posição do próprio texto (4,5:1, ou 3:1 para 24 px ou
  mais). Se reprovar, leve o texto para uma parte mais calma, ponha num card sólido na cor do fundo ou use
  o véu da seção 6. Uma navegação fixa que passa sobre imagens ganha uma faixa sólida, ou some
  ao rolar para baixo.

### Regras para um gerador

1. **Cerca de um terço da página é imagem.** Ao longo das telas roladas, as imagens ocupam 30–40% da
   área, e pelo menos uma tela em quatro não tem imagem (sites do topo: 30% e 28%).
2. **Uma imagem comanda a tela ou fica pequena.** Uma imagem principal ocupa pelo menos 60% da tela;
   uma de apoio fica abaixo de 10%. Evite tela após tela de imagens a 20–40%: no estudo, 42% das
   telas são 0% e 19% são 90% ou mais.
3. **De três a cinco posições por página,** e nunca duas seções vizinhas com a mesma. Sites
   com duas ou menos têm média de 7,31; sites com três ou mais, de cerca de 7,5.
4. **De seis a doze imagens, nunca menos de quatro.** Mediana do estudo 7; sites do topo 4–27; mais baixos 2.
5. **Duas proporções para pelo menos 75% das imagens** (76% no estudo), uma terceira só para uma exceção
   deliberada. Padrões: 4:5 para verticais, 16:9 ou 3:2 para horizontais.
6. **Cantos retos em todas as imagens** (94% no estudo). Se a direção arredondar, um raio só de
   4 px para todas as imagens e vídeos.
7. **Imagens em divisão ocupam 42–50% da largura, ou dois terços,** na altura total da seção e
   tocando a viewport no lado de fora; o texto começa na linha dos 50%. No celular, a
   imagem vem primeiro, em largura total.
8. **Faixas sangradas têm 100% de largura e 100–150vh de altura,** uma a cada três ou quatro telas, maiores que a moldura em
   no máximo 10% para o parallax, com texto só num canto, a pelo menos 32 px da borda. No celular, recorte de novo numa
   vertical de tela cheia.
9. **Uma moldura recuada que cresce por página,** de 35–50% da largura até a tela inteira ao longo de
   720–2.700 px de rolagem, sem mais nada se mexendo naquela tela.
10. **Galerias horizontais mostram três cards e um quarto cortado:** cards de 25–35% da largura com espaços de 16–20 px;
    no celular, um card a 75–80% da largura com o seguinte à mostra.
11. **Uma imagem em movimento por tela.** Vídeos de 5–15 s (mediana de 10 s), sem som, em loop, em linha, com
    poster, pausados fora da tela; uma fonte de hero de 1920×1080 abaixo de 10 MB, vídeos em linha de 1280×720 ou
    menores abaixo de 5 MB.
12. **Só texto display sobre uma imagem:** no máximo uma headline, uma linha e uma ação, com o contraste
    medido na posição do texto ao longo do loop inteiro. Texto corrido, com 16 px ou mais, vai ao lado ou
    embaixo da imagem, nunca sobre ela.
