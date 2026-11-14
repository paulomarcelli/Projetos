---
name: direcao-de-arte
description: 'Direção de Arte, a skill de frontend contra o visual genérico de IA: direção de arte destilada de 247 sites selecionados em galerias (One Page Love, Awwwards Sites of the Day). Sorteia direções pesquisadas (ideia, composição, tipografia, paleta, fotos, plantas das seções) de uma biblioteca, impõe um estilo da casa rigoroso e confere o resultado num navegador de verdade, num ciclo de olhar e corrigir em capturas de tela. Use sempre que for construir, desenhar, redesenhar, refinar ou revisar uma landing page, site institucional, portfólio, página de produto, hero ou qualquer página pública, em qualquer stack (HTML/CSS, React, Next.js, Vue, Svelte, Astro, Tailwind), e quando o usuário disser que a página parece genérica, de template ou "feita por IA", ou pedir cara de design premium. Vale também para telas de app: dashboards, admin, configurações e outras telas de trabalho.'
---

# Direção de Arte

Uma página feita por um modelo costuma parecer a média de todas as páginas que ele já viu: uma headline
centralizada em três linhas, um rótulo pequeno acima dela, uma fileira de cards com ícone, um gradiente
suave, alguns fios finos e uma legenda em fonte monoespaçada. Nada ali está errado, e nada ali foi decidido.

Esta skill troca esses padrões por decisões, de quatro jeitos:

1. **Um script sorteia as direções; você escolhe entre elas.** Quando pedem a um modelo que invente um
   visual, ele escolhe o padrão da categoria toda vez. `scripts/draw.mjs` sorteia três de vinte direções
   pesquisadas; você escolhe a que sustenta a ideia do assunto, e o script então sorteia o sistema
   tipográfico, a paleta, o hero e as composições das seções, de uma biblioteca destilada de 247 sites reais.
2. **A ideia vem do assunto.** No estudo, o que separou os melhores sites dos esquecíveis foi um conceito
   tirado da própria coisa, não o estilo.
3. **Um estilo da casa sem enfeites,** medido num navegador de verdade por `scripts/inspect.mjs`, para as
   regras serem conferidas, e não apenas esperadas.
4. **Você olha o que fez.** Capturas de tela em três larguras, a régua de um jurado, corrigir, olhar de novo.

Um aviso aprendido nos testes. Tirar os enfeites é só metade do trabalho; uma página que perdeu os rótulos,
os fios e os cards e não ganhou nada no lugar parece rala, e jurados às cegas com razão preferem uma página
mais rica com cacoetes a uma página vazia sem eles. A outra metade é substância: fonte em tamanho maior,
campos de cor inteiros, imagens reais do mundo deste assunto (encontradas ou desenhadas) e cada seção
trazendo o conteúdo completo. A skill foi feita para dar isso a você; não troque isso por contenção.

Nos comandos abaixo, `<skill>` é a pasta desta skill. Execute-os na raiz do projeto, para os arquivos de
trabalho ficarem em `.taste-skill/` ali. Os scripts precisam do Node 22+ e de um Chrome, Edge ou Chromium
instalado, e não instalam nada. O `assets.mjs` também precisa de rede; ele não usa chave de API.

## Página ou tela de app

Decida primeiro qual dos dois tipos de trabalho é este.

- **Uma página** é lida e rolada: uma landing page, um site institucional ou de produto, um portfólio, um
  evento, um restaurante, um site de uma página. Ela segue **o roteiro** abaixo.
- **Uma tela de app** é onde se trabalha: um dashboard, uma tela de admin ou de analytics, configurações,
  cobrança, uma caixa de entrada ou fila para dar conta, uma carteira, uma lista com filtros, um editor ou
  construtor. Ela segue **`references/pt-BR/app-screens.md`**: roteiro próprio, sorteio próprio (`draw.mjs --app`),
  regras da casa próprias (bordas discretas, rótulos pequenos e painéis repetidos são normais lá;
  gradientes, brilhos, ícones em quadrados coloridos, gráficos com as cores do arco-íris e números de
  vaidade inventados, não) e `inspect.mjs --app`. Leia esse arquivo inteiro antes de começar; o roteiro de
  página abaixo não vale.

Um site de produto que mostra o app é uma página; os fragmentos de interface nele seguem, por dentro, as
regras de tela de app. Sorteie o estilo de app do produto uma vez, na pasta dele, mantendo as cores e a
fonte da página:

```bash
node <skill>/scripts/draw.mjs --app --kind <kind> --brief "<the product>" --keep palette,type --out .taste-skill/app
```

e construa cada fragmento que a página mostra (a tela ao vivo do hero, o recorte de uma funcionalidade, um
gráfico) como um pedaço real desse app: `assets/app.css` para os painéis, tabelas e controles,
`assets/charts.js` para os gráficos, dados reais que fecham a conta, uma conclusão dita, recortado e em
escala do jeito que a planta da página trata uma imagem. Um fragmento que parece um produto funcionando é a
imagem mais forte que uma página de software tem; barras cinza e números de lorem são as mais fracas.
Quando um pedido mistura os dois (uma landing page e o dashboard por trás dela), construa cada um com o
roteiro dele, com uma paleta e uma fonte compartilhadas.

## O roteiro

Faça nesta ordem. Os passos 1–5 levam poucos minutos e decidem se a página presta.

### 1. Leia o briefing e o projeto

Descubra o que é real: o assunto, o público, a única coisa que a página tem de levar alguém a fazer, a
stack, a marca que já existe (cores, fontes, logo) e, acima de tudo, **que imagens existem de verdade**: as
fotos do próprio projeto ou do produto, uma interface real que pode ser mostrada, uma ferramenta de geração
de imagem que você pode chamar, ou nada. Não planeje em cima de imagens que você não tem. Nada próprio
raramente é nada mesmo: a cidade, a rua, os materiais e a história do assunto estão em acervos abertos e
museus, livres para usar com crédito (passo 6, `scripts/assets.mjs`).

Se o pedido for vago, decida e diga em uma linha como você o entendeu, em vez de perguntar. Pergunte só
quando um fato que falta trava o trabalho (por exemplo, sem o nome do produto).

Depois, **faça o inventário do assunto** nas suas notas: de oito a doze coisas que são deste cliente e de
nenhum concorrente. Procure o nome e o que ele significa; o endereço, o número da porta, a rua e o bairro, e
como é esse lugar (os azulejos, as placas, as cores das paredes, as letras das fachadas das lojas, a luz, o
clima); os números do briefing (lugares, quartos, minutos até o mar, o preço, o ano); a restrição com que
ele vive (só uma fornada por mês, fechado no inverno, só com hora marcada); os materiais e as cores; os
rituais e horários (o forno aceso às cinco, a balsa às sete); as coisas impressas do mundo dele (uma tabela
de horários, um rótulo, um ingresso, uma placa). É dessa lista que vem a ideia no passo 4. Nos testes às
cegas, a página que venceu cada briefing foi construída a partir de um item de uma lista assim (o nome do
cliente e o que ele significa, a rua onde fica, a restrição que o faz ser o que é), e as que perderam
tinham uma boa composição com uma ideia de categoria. A lista também é a sua busca de imagens: cada lugar,
material e coisa impressa nela é uma busca para o passo 6.

### 2. Escreva o argumento

Antes de qualquer design, liste a página como afirmações com suas provas, uma linha por seção, do jeito
que `references/pt-BR/copy.md` §1 mostra. As afirmações decidem quais seções existem e em que ordem. Apague toda
seção que não tem afirmação. É assim que você foge da sequência batida de hero, logos, três
funcionalidades, depoimento, preços, chamada para ação.

### 3. Sorteie a direção

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<one line about the subject>" \
  --sections <roles in the order of your argument> [--tone <tone>] [--have <assets>] [--keep palette,type] \
  --options 3
```

Isso sorteia três direções e imprime um resumo curto de cada uma. Ponha cada uma ao lado do seu
inventário: que jeito de compor consegue sustentar algo que só este cliente tem? Escolha essa, não a mais
familiar, e escreva uma linha nas suas notas dizendo por quê. Nos testes, uma única direção aleatória que
não combinava com o assunto foi a causa mais comum de página fraca. Depois, sorteie a ficha completa:

```bash
node <skill>/scripts/draw.mjs <the same arguments, without --options> --direction <chosen id>
```

- `--sector`: `node <skill>/scripts/draw.mjs --list sectors`. Escolha o mais próximo.
- `--sections`: papéis de `--list roles` (features, showcase, how-it-works, testimonial, proof, stats,
  pricing, faq, cta, footer, intro, about, work, gallery, list, contact). O hero está implícito.
- `--tone` (opcional): quiet, bold, warm, technical, playful, luxury, editorial. Só passe quando o briefing
  pedir um com clareza.
- `--have`: os materiais que existem de verdade, separados por vírgula: `photography` (as fotos do próprio
  projeto, do lugar, das pessoas ou do trabalho), `product-photo` (fotos do produto específico, ou uma
  ferramenta de imagem que consiga fazê-las), `product-ui` (capturas de tela reais), `illustration`,
  `video`. Deixe de fora se não tiver nenhum: o sorteio então evita composições que dependem deles, e a
  ficha diz como preencher os espaços da imagem com honestidade (software mostra a própria interface,
  construída em HTML; um produto sem fotos é desenhado e posto entre imagens reais do mundo dele, nunca
  uma falsa foto de produto). Imagens que você vai encontrar nos acervos abertos não são do projeto;
  deixe-as fora do `--have`.
- `--keep palette,type`: quando a marca já define as cores ou as fontes. O sorteio então só sorteia a
  composição, e você distribui os valores da marca pelos papéis.

O comando imprime uma **ficha da direção**. Ela é a direção de arte deste build:

- **Adote-a.** Não a misture com o layout que você faria de qualquer jeito. Se ela parecer estranha, ótimo:
  o layout familiar é justamente o que esta skill existe para evitar.
- Sorteie de novo uma parte da ficha (`--redraw hero | type | palette | photos | scenes | section:<role> | direction`)
  só por um motivo que você consiga dizer: ela contradiz uma restrição de marca declarada, precisa de um
  material que não existe ou é uma seção que não comporta o conteúdo real (próximo item). Nunca sorteie de
  novo para ter algo mais confortável. Registre cada novo sorteio no relatório.
- Quando uma seção sorteada não comporta o conteúdo real (ela compara três planos e há um preço só; ela
  quer cinco citações e não há nenhuma), não force o conteúdo a caber. Liste as outras com
  `--alternatives <role>`, escolha a que parte de premissas que batem com o conteúdo e pegue-a com
  `--redraw section:<role>=<id>`.
- **Confira a paleta contra o assunto.** Uma paleta sorteada é um conjunto de proporções (um fundo, uma
  tinta, uma cor de destaque, campos de cor) tanto quanto um conjunto de cores. Se as cores dela brigam com
  o material do próprio assunto (tons pastel de bala para uma cachaça envelhecida em barril, neon para um
  refúgio na serra), sorteie a paleta de novo uma vez; se o assunto tem cores próprias inconfundíveis (o
  material dele, a pintura da rua, a paisagem lá fora das janelas), mantenha as proporções sorteadas e tire
  as cores do assunto, e diga isso no relatório.
- Reimprima a ficha quando quiser com `node <skill>/scripts/draw.mjs --show`. Numa sessão longa, releia-a
  antes de cada seção que construir.

### 4. Encontre a ideia

A direção é um jeito de compor. A ideia é o que faz a página ser deste assunto e de nenhum outro. Escreva
esta frase nas suas notas e não comece a construir até preencher as duas lacunas a partir do próprio
assunto:

> Nesta página, **[algo que é do assunto]** vira **[o recurso que a direção pede]**.

Onde procurar a primeira lacuna:

- **O que ele produz.** O que a coisa produz? Ponha o que ela produz de verdade na página, como material.
  (Uma câmera que imprime poemas entregou a copy dela em tiras de papel.)
- **O objeto ou a forma.** Como ele é fisicamente, em corte, em silhueta? Amplie, recorte, faça disso a
  moldura ou o único motivo.
- **O nome.** As letras conseguem conter uma foto, empilhar-se num muro, dividir-se em dois cantos?
- **O lugar.** Existe uma vista que faz alguém querer estar lá?
- **O ritual.** Existe uma sequência que a página pode encenar enquanto rola?
- **O artefato.** Que coisa impressa já existe no mundo dele: ingresso, cardápio, rótulo, recibo, convite,
  pasta, manual?
- **O oposto.** Que outra categoria tem o sentimento que falta a esta?

Preencha a primeira lacuna com o seu inventário (passo 1), não com a categoria. **O teste do concorrente:**
ponha na frase o concorrente real mais próximo (a padaria duas ruas adiante, outro fabricante de móveis de
carvalho, outro refúgio na mesma serra). Se a frase ainda funcionar, a ideia é da categoria: um pão é
qualquer padaria; as sete portas da rua que dá nome a esta são só desta. "Limpo e moderno" não é ideia. Os
sites que o painel do estudo pior avaliou foram aqueles cuja ideia foi registrada como "nenhuma além da
fórmula padrão".

**Um elemento vivo.** Dê à página uma coisa que o visitante pode fazer, ou que muda a cada visita, feita a
partir da ideia: escolher uma madeira e ver a cadeira nela; digitar o nome e vê-lo cortado nas letras da
fundição; ajustar o empréstimo e ler o valor real da parcela; ver se o fogão do refúgio está aceso agora e
quanto falta para a última balsa; escolher um tamanho e vê-lo no cômodo. Nos testes às cegas, toda página
vencedora tinha um, e os jurados o citaram primeiro. Regras: usa o conteúdo real do assunto, funciona no
celular com o polegar, tem um fallback simples sem script, nunca atrapalha a leitura e é uma coisa só, não
um parquinho. Ele é construído no passo 6 como parte da página, não acrescentado como movimento no passo 9.

**As cenas também sustentam a ideia.** As cenas de rolagem da ficha são recursos esperando um assunto.
Decida o que cada uma mostra a partir do seu inventário antes de construir: o voo da câmera passa pelas
cartelas deste estúdio, o trajeto é a estrada que esta encomenda percorre de verdade, a imagem que se abre
para a tela inteira é o quarto onde o hóspede vai acordar. Uma cena cheia de imagens que poderiam ser de
qualquer um é um protetor de tela.

### 5. Escreva o texto

Escreva a página inteira como um documento de copy (texto puro) antes do markup, seguindo
`references/pt-BR/copy.md`:

- **Toda headline cabe em duas linhas ou menos, em qualquer largura.** Faça a conta de copy.md §2 antes de
  se comprometer com uma frase: cerca de 32 caracteres é seguro em qualquer lugar, num tamanho confiante.
  Os heroes estudados nas galerias têm mediana de 5 palavras e 32 caracteres.
- Uma frase de apoio, logo abaixo da headline (32–48 px abaixo dela) e mostrada junto com ela, nunca
  encostada no pé da primeira dobra nem segurada por uma animação. Quando a headline é um nome ou uma
  figura de linguagem, essa frase diz com clareza o que a coisa é. Uma ação principal, com o nome do que
  ela faz, como um botão de verdade na primeira dobra.
- **A primeira dobra responde à primeira pergunta do visitante em letra grande.** Para um evento: o que é,
  quando e onde (as datas vão na headline ou no segundo tamanho, nunca só em letra pequena). Para um
  produto: o que é e quanto custa ou o que faz. Para uma pessoa: quem é e o que faz. Toda seção que o
  visitante veio buscar (a programação, o cardápio, os quartos, o preço) tem título próprio e lugar próprio
  na navegação.
- **Escreva o conteúdo completo.** Toda seção que o briefing pede entrega a informação inteira: o cardápio
  todo com os preços, cada quarto com os seus detalhes, cada palestrante e palestra, o preço com o que ele
  inclui, uma resposta para cada pergunta real. Seções ralas são o motivo mais comum de uma página limpa
  perder para uma mais cheia.
- Detalhes de exemplo são esperados onde o briefing deixa lacunas (nomes de pratos, nomes e diárias dos
  quartos, títulos de projetos), para o design ser visto na densidade real; liste-os no relatório para o
  cliente confirmar. Prova nunca se inventa: nada de clientes, citações, avaliações, imprensa, logos ou
  números do negócio.

### 6. Construa sem movimento

Construa a página com o movimento desligado na sua cabeça; uma página que precisa de animação para parecer
pronta não está pronta. Ordem do trabalho:

1. **Tokens.** Os papéis de cor e de tipografia da ficha como propriedades personalizadas do CSS. Tudo dali
   para frente só referencia tokens. `<skill>/assets/base.css` é uma base neutra de onde você pode partir
   (reset, nomes de tokens, degraus tipográficos fluidos, grid, estilos de foco e de seleção, os auxiliares
   de movimento); ela não tem visual próprio.
2. **O hero, exatamente como a planta descreve,** no desktop e na largura do celular. Deixe a coisa grande
   grande e as pequenas pequenas antes de existir qualquer outra coisa.
3. **Cada seção a partir da planta dela,** com o conteúdo deste projeto. Mantenha a geometria, troque o
   assunto. Seções vizinhas não podem ter o mesmo layout. **Leve a ideia para todas as seções,** preços,
   perguntas frequentes e rodapé incluídos: a falha mais comum no estudo, até entre sites bons, é uma
   primeira dobra marcante seguida de blocos batidos.
4. **Imagens,** nesta ordem de preferência:
   1. as do próprio projeto;
   2. geradas, se você tiver uma ferramenta de imagem;
   3. **imagens reais do mundo do assunto, dos acervos abertos,** sempre que existir uma honesta. Busque
      com `node <skill>/scripts/assets.mjs "<query>"` (Openverse, Wikimedia Commons, o Art Institute of
      Chicago e o Met; por padrão, só licenças que permitem uso comercial). Busque pelo inventário, não
      pela categoria: a rua dele em cartões-postais antigos, um mapa antigo do bairro, o material dele de
      perto, o ofício dele em gravuras, um objeto de museu do mesmo tipo, uma prancha botânica, uma carta
      celeste. Use-as grandes e com intenção: uma foto de arquivo como hero, uma gravura ampliada como
      motivo da página, o mapa real da rua como seção de contato. Olhe cada uma antes de escolher;
      `--get <ref>` baixa para `assets/` e registra a fonte e a licença, e `--credits` imprime a linha de
      créditos para o rodapé. Uma imagem encontrada mostra o mundo em volta do cliente e nunca é
      apresentada como produto, quarto, prato, pessoa ou equipe do próprio cliente;
   4. **desenhadas em código a partir do próprio assunto,** para o que não existe imagem honesta (os
      objetos dele, os azulejos, as janelas, a interface do produto, feitos como uma linguagem gráfica
      chapada e coerente, nas cores reais da paleta);
   5. as fotos sorteadas na ficha, só onde cabe uma imagem genérica com honestidade (o mar para uma casa
      de praia), nunca no lugar do assunto;
   6. só tipografia e cor.

   Quando o projeto tem vídeo ou uma imagem real do próprio processo ou produto, a primeira dobra mostra
   isso, grande (cerca de 40% da tela ou mais). Nunca escreva na página uma frase sobre de onde vêm as
   imagens ou o que elas não são ("nenhuma destas mostra o nosso bar"): a legenda diz o que a imagem é, e
   a linha de créditos fica pequena no rodapé. Um portfólio cujo trabalho é inventado para o briefing
   desenha cada peça como uma imagem parada e acabada daquele trabalho (a cartela com a tipografia própria,
   um quadro final, um cartaz), com detalhe real, nunca como um pictograma do produto do cliente.

   **O piso, que o inspetor confere:** pelo menos quatro imagens reais na página, normalmente de seis a
   doze (fotos, imagens de arquivo, mapas, gravuras, vídeo, arte em bitmap; para software, os recortes da
   interface também contam). Desenhos em SVG não contam para o piso: desenhe o que não existe em imagem e
   ainda assim traga imagens reais. Ponha uma imagem em movimento onde existir um vídeo curto honesto:
   busque com `assets.mjs --video "<query>"` e use em loop sem som, com um quadro de poster. Os modelos
   pulam imagens e vídeos porque encontrá-los dá trabalho; sem eles, a página é reprovada.

   `references/pt-BR/imagery.md` trata de busca, licenças e créditos, vídeo, desenho, recortes e tratamentos.
5. **O elemento vivo** do passo 4, construído na seção onde ele prova a afirmação (muitas vezes o hero ou a
   reserva), com conteúdo real, uma versão de celular do tamanho do polegar e um fallback simples.
6. **As cenas de rolagem,** quando a ficha as sorteia (seção 9), cada uma com a seção que ela sustenta: os
   grandes momentos da página, a câmera que voa pelo trabalho, a imagem que se abre para a tela inteira, a
   palavra que se dobra com a rolagem. Copie o palco compartilhado e os arquivos da cena de
   `<skill>/assets/scenes/`, preencha a cena com as imagens e as palavras deste projeto e defina os tokens
   da página para ela pegar o visual da página. Uma cena é composição: decide o tamanho da página e o que
   cada tela mostra, então ela é construída agora e vista em toda rodada de olhar, não acrescentada no fim.
   `references/pt-BR/scenes.md` diz como pôr uma numa página, preenchê-la, ajustá-la e conferi-la;
   `assets/scenes/demo/<id>.html` é um exemplo funcionando de cada uma.
7. **Página cheia.** Olhe cada tela do desktop como um cartaz: uma coisa dominante e o conteúdo que ela
   sustenta. Uma tela que é quase só fundo vazio é uma seção mal construída, não uma pausa; uma pausa
   deliberada por página é o limite, e o inspetor reprova a página com duas ou mais telas quase vazias. O
   texto corrido vai na tinta cheia, com 16 px ou mais; o cinza é para notas secundárias.
8. **A moldura.** A página tem um par de margens externas iguais em toda largura, e toda seção usa a largura
   que a página estabeleceu: quando o texto fica na metade esquerda, a metade direita traz a imagem, a
   segunda coluna, a lista ou o número dela, nunca nada. A assimetria mora dentro do grid, nunca na
   moldura: um vazio só é posto quando algo o fecha do outro lado. Nenhum trecho da página com mais de cerca
   de meia tela de altura fica sem nada; as seções ficam a 120–240 px umas das outras no desktop. Toda seção
   que o visitante veio buscar abre com um título que diz o nome dela, e a primeira dobra traz o título da
   página num `h1`. É isso que os leitores citam primeiro quando uma página parece errada ("sem título
   claro", "espaço vazio aleatório", "tudo empurrado para um lado"), e o inspetor mede cada um.
9. **Estados e semântica.** Links e botões de verdade, foco visível, texto alternativo, um layout de
   celular que é uma composição própria. Todo controle, inclusive o elemento vivo, funciona só pelo teclado,
   na ordem de leitura, e tem nome acessível: o rótulo visível, ou `aria-label` quando ele mostra só um
   ícone.

Leia `references/pt-BR/type.md`, `references/pt-BR/colour.md` e `references/pt-BR/layout.md` quando precisar do detalhe por
trás de uma decisão; as leis abaixo são a versão curta.

### 7. Checagem

```bash
node <skill>/scripts/lint.mjs <source files or folder>
node <skill>/scripts/inspect.mjs <url or path/to/index.html>
node <skill>/scripts/scenes.mjs <url or path/to/index.html>     # quando a página tem cenas de rolagem
```

O `scenes.mjs` fotografa cada cena de rolagem a 0, 10 … 100% do trecho parado dela, no desktop e no
celular, e a página com movimento reduzido; com cenas na ficha, o `inspect.mjs` também filma a rolagem
inteira (`desktop-film-NN.jpg`). Uma cena que nunca começou ou que fica parada no desktop é um `FAIL`.

O `lint.mjs` varre o código-fonte atrás de padrões proibidos e frases feitas. O `inspect.mjs` abre a página
num navegador de verdade a 1440, 768 e 390 pixels, mede (quantas linhas tem cada headline, tamanhos de
fonte, as fontes que de fato carregaram, cores, fios, sombras, gradientes, contraste, transbordamento e a
moldura: margens iguais, seções amontoadas de um lado, trechos em branco, o título, seções sem título,
texto encostado na borda da tela) e salva capturas de tela em `.taste-skill/inspect/`. Corrija todo
`FAIL`. Trate cada `WARN` como erro, a não ser que você consiga defendê-lo para um designer em uma frase.
Execute de novo até não haver nenhum `FAIL`. Não discuta com o medidor e não esconda nada dele. O inspetor
serve os arquivos locais por um servidor local descartável; se a página também precisa abrir direto do
sistema de arquivos, abra o `index.html` assim uma vez antes de terminar.

Inspecione o que o visitante recebe. Com uma etapa de build, faça a última checagem no build de produção
(`vite build && vite preview`, `next build && next start`, ou o `index.html` gerado), não só no servidor de
desenvolvimento: minificadores e bundlers mudam o que vai ao ar (um deles tirou um `backdrop-filter` que o
servidor de desenvolvimento mostrava). O inspetor avisa quando está olhando um servidor de desenvolvimento.

### 8. Olhe

Passar na checagem quer dizer que nada proibido foi medido. Não quer dizer que a página é boa. Abra as
capturas que o inspetor lista (todas as larguras, com o seu visualizador de imagens ou a ferramenta Read) e
critique-as com `references/pt-BR/critique.md`: as quatorze leituras, a nota com os pesos do Awwwards, os tetos.
Escreva a crítica no formato dela, corrija os três maiores problemas, execute o inspetor de novo, olhe de
novo. No máximo três rodadas.

Julgue só as capturas. Se um problema aparece numa captura, ele é real, diga o código o que disser.

### 9. Anime

Agora construa a camada de movimento. Ela é obrigatória, e é mais do que um fade: o inspetor conta os
elementos que de fato se mexem enquanto a página carrega e é rolada, e reprova a página com menos de oito
(avisa com menos de dezesseis). As cenas de rolagem, se houver, já estão construídas (passo 6); em volta
delas, a camada tem quatro partes:

1. **O movimento-assinatura** que a ficha nomeia: um, bem-feito (uma cena sorteada pode ser ele).
2. **Uma entrada para as partes de cada seção:** o título, depois o texto, depois a imagem, em cascata, com
   60–90 ms entre um e outro, subindo 16–32 px com opacidade, disparada uma vez quando a seção entra. Não
   um fade para o bloco inteiro, e nunca conteúdo que fica escondido se o script falhar.
3. **Feedback em todo controle:** clique, hover e foco em botões, links, cards e no elemento vivo.
4. **Uma imagem em movimento:** um vídeo curto encontrado, em loop sem som, uma escala ou um deslize lento
   numa foto, ou um movimento atrelado à rolagem na imagem do hero.

Só transform e opacity; todo movimento tem um fallback de `prefers-reduced-motion` que mantém o conteúdo e
tira o deslocamento. Um movimento que muda a cor ou o layout de telas inteiras (cor por capítulo, uma
história fixada) é parte da composição, então construa-o no passo 6 e deixe toda rodada de olhar vê-lo.
`references/pt-BR/motion.md` tem os tokens e receitas testadas. Depois execute o inspetor mais uma vez e confira
em cada captura se algum conteúdo deixou de aparecer.

### 10. Relatório

Não faça o relatório até tudo isto ser verdade; cada item foi pulado numa rodada de teste que saiu ruim:

- O `inspect.mjs` mostra **0 FAIL** a 1440, 768 e 390, na versão final da página.
- Você abriu todas as capturas que ele listou depois da última mudança, não só a primeira dobra.
- Com cenas de rolagem: o `scenes.mjs` foi executado na página final sem problemas, e você leu todas as
  folhas (desktop, celular, movimento reduzido).
- Um desconhecido que lê a primeira dobra por cinco segundos consegue dizer o que é isto e o que fazer.
- Toda seção tem título; as margens batem dos dois lados; nenhum trecho da página está vazio.
- A crítica da sua última rodada está escrita no formato de `references/pt-BR/critique.md` §4.

Diga ao usuário, em poucas palavras: a direção sorteada (nome e seed) e cada novo sorteio com o motivo; a
frase da ideia e o elemento vivo; as notas finais da sua última rodada de crítica e o que ainda fica
aquém; cada imagem e vídeo encontrado com título, autor, licença e página de origem (`assets.mjs --credits`
imprime a lista) e onde o crédito fica na página; quais fotos do pacote e quais desenhos estão no lugar de
fotografia (para poderem ser trocados); e todo conteúdo de exemplo que precisa ser trocado antes de ir ao
ar. Não afirme uma checagem que você não fez.

## Regras da casa

Valem em todo build, seja qual for a direção. O `inspect.mjs` mede todas.

| Regra | Em vez disso |
| --- | --- |
| **Headlines: duas linhas ou menos, em qualquer largura.** Todo `h1`–`h6`, e a frase principal da primeira dobra, seja qual for a tag. | Corte palavras. Depois alargue a linha. O tamanho por último. |
| **Um título claro na primeira dobra**, no único `h1` da página, e um título em toda seção. | Diga o que é isto: o nome com o que faz, o produto com para que serve, o evento com a data e o lugar. |
| **Margens externas iguais; nenhuma seção amontoada de um lado** com a outra metade da tela vazia. | Feche todo vazio com algo do outro lado: a imagem da seção, uma segunda coluna, uma lista, um número. |
| **Nenhum trecho em branco** com mais de cerca de meia tela de altura. | O espaço normal entre seções. Uma pausa deliberada é uma imagem posicionada ou um campo de cor, uma vez por página. |
| **Frases de destaque são parágrafos.** Uma frase de abertura ou uma citação em tamanho grande vai marcada como `<p>` ou `<blockquote>`, fica no tamanho de frase de destaque (36 px ou menos no desktop, 24 px no celular) e vai até cerca de 25 palavras, três linhas. | Maior que isso é uma headline, e vale a regra das duas linhas. Nos testes às cegas, os jurados leram uma frase de 42 px em quatro linhas como uma headline de quatro linhas. |
| **Sem chapéu (eyebrow).** Nenhum rótulo pequeno acima de um título, nenhum selo em pílula acima da headline, nenhum chip "Novo ·". | Ponha a informação no título ou na primeira frase, ou corte. |
| **Sem fonte monoespaçada** fora de blocos de código de verdade. | A fonte de texto. Algarismos tabulares onde os números se alinham. |
| **Sem numeração de índice.** Nada de 01 / 02 / 03, nada de (001), nada de "Passo 2". | A ordem mostrada pela posição, pelo tamanho ou pelas palavras. Um `<ol>` de verdade se a ordem importa. |
| **Sem fios finos.** Nada de fios divisórios finíssimos, caixas com contorno de 1 px, linhas de grade, cruzetas ou marcas de corte. | Espaço. Um degrau no tom do fundo. Uma mudança de escala. Uma forma preenchida. |
| **Sem gradientes.** Nem no fundo, nem em botões, nem em texto. | Cor chapada, ou uma foto de verdade. Um véu (camada escura translúcida) neutro sob texto em cima de foto é a única exceção. |
| **Sem sombras em coisas paradas.** Sem brilhos. | Um degrau de tom entre superfícies. Sombra só no que de fato flutua: um menu, um diálogo. |
| **Sem paleta de assistente.** Nada de fundo creme amarelado com terracota ou ferrugem; nada de violeta ou índigo. | A paleta sorteada. |
| **Sem rótulos minúsculos em caixa-alta espaçada.** | Só a inicial maiúscula, num tamanho legível. |
| **Sem cards de funcionalidade com ícone em cima, sem fileiras de cards idênticos.** | A planta de seção sorteada. |
| **Sem vidro.** Nada de painéis com desfoque de fundo, nada de navegação flutuante em pílula. | Uma barra simples: logotipo, alguns links, uma ação. |
| **Sem emoji, sem manchas de gradiente, sem formas decorativas, sem dashboards falsos de barras cinza.** | Uma imagem real, um fragmento de interface real, ou nada. |
| **Sem palavra de destaque estilizada** na headline (itálico, serifa, colorida, sublinhada). | Uma fonte, uma cor. As palavras fazem a ênfase. |
| **No máximo duas fontes,** normalmente uma. | O sistema tipográfico sorteado. |

Três lugares mantêm as próprias convenções e o inspetor não mexe neles: código de verdade em
`<pre>`/`<code>` (fonte monoespaçada é o certo ali), tabelas e campos de formulário de verdade (podem ter
linhas) e um fragmento de interface real cuja raiz leva o atributo `data-ui` (as bordas e os menus do
próprio produto; veja `references/pt-BR/imagery.md` §7).

Por que estas, com honestidade. Algumas são o que o estudo mediu: entre os 247 sites, os que o painel
avaliou com 7,5 ou mais usaram cards de funcionalidade com ícone 1% das vezes, contra 28% dos sites abaixo
de 6,5; selos em pílula, 14% contra 34%; gradientes, 22% contra 52%; sombras, 24% contra 48%; rótulos
minúsculos em caixa-alta espaçada, 16% contra 57%. Outras são o gosto do autor e vão contra a moda atual das galerias:
rótulos em fonte monoespaçada, números de índice e grids de fios finíssimos são na verdade *mais* comuns
em sites premiados do que nos fracos, e é justamente por isso que os geradores os imitam e por isso que
hoje parecem fantasia. Aqui eles são proibidos sem exceção. `references/pt-BR/tells.md` guarda o registro
datado.

Tirar enfeite deixa espaço. Nunca o preencha com outro enfeite. Preencha com escala (deixe a coisa
principal maior), com o conteúdo completo, com uma imagem feita para este assunto ou com um campo de cor
chapada. Deixe-o vazio de propósito no máximo uma vez por página.

## Leis do ofício

Versão curta. Os números são do estudo, salvo quando marcados como estilo da casa.

**Tipografia**
- Dois ou três tamanhos fazem o trabalho visível: um muito grande, um pequeno, nada no meio. A razão
  mediana entre headline e texto nos sites estudados é 4,3; os melhores vão muito além (maior fonte:
  mediana de 8,4vw nos sites de nota alta contra 5,0vw nos fracos).
- Fonte display: tracking (espaço entre letras) de -0,02 a -0,05em, entrelinha de 0,85–1,05. Texto:
  16–20 px, entrelinha de 1,45–1,6, 45–75 caracteres por linha.
- Cinco tamanhos numa página é o teto. Uma família é o normal (um terço dos sites estudados); duas é o
  limite.
- Alinhado à esquerda por padrão. Centralize no máximo um momento.

**Espaço**
- Um grid, um par de margens justas (16–32 px), usado em todo lugar; coisas grandes vão até as bordas. Os
  blocos de texto dividem duas ou três bordas esquerdas na página inteira.
- Assimetria dentro do grid, nunca na moldura: as duas margens externas são iguais, e um título fora do
  centro tem resposta em algo do outro lado do grid.
- O espaço entre seções é claramente maior que qualquer espaço dentro de uma: 120–240 px no desktop (a mediana do estudo é cerca de 240).
- Cada seção tem uma composição diferente das vizinhas; nenhuma é um grid de cards.

**Cor**
- Um fundo, uma tinta, uma cor de destaque. A cor de destaque aparece na ação e talvez em mais uma coisa.
- Texto corrido na tinta cheia. Uma página em cinza suave parece inacabada.
- As superfícies se separam por um degrau pequeno de tom, nunca por um fio ou uma sombra.
- Uma seção pode trocar a cor do campo inteiro. Nada se desfaz em nada.

**Imagens**
- Uma imagem dominante vale mais que seis pequenas. Nos sites de nota mais alta, a mídia do hero cobre pelo
  menos metade da primeira dobra 68% das vezes.
- As mesmas proporções de recorte, o mesmo tratamento, cantos retos, a não ser que a direção diga outra
  coisa (73% dos sites estudados deixam a mídia com cantos retos).
- Ficar sem imagem é melhor que um placeholder (conteúdo provisório), um ícone ou uma forma abstrata. Uma
  imagem desenhada para este assunto, nas cores dele e com cuidado, é melhor que as duas coisas. Uma imagem
  real do mundo dele, encontrada e creditada, é melhor ainda.
- Toda imagem encontrada é baixada para o projeto, creditada na página e listada no relatório. Nenhuma é
  apresentada como sendo do cliente.
- Nada nunca fica por cima de uma headline ou de uma frase de destaque (o inspetor reprova).

**Componentes**
- Botões: chapados, uma cor de preenchimento, ou de cantos retos ou totalmente redondos, decidido uma vez
  (sites de nota alta: 52% retos, 23% em pílula; o raio "suave" de 9–16 px é o padrão dos sites fracos). A
  maioria dos heroes fortes não tem botão nenhum, ou tem um.
- Navegação: logotipo, de três a cinco links simples, uma ação. Sem chrome (barras, bordas e controles em
  volta do conteúdo) na barra.
- Um controle explica como se usa pela forma, pelo rótulo e pelo lugar. Quando parecer que ele precisa de
  uma frase explicando como operá-lo, redesenhe o controle em vez de acrescentar a frase. O que um campo
  aceita é outra coisa. Primeiro tire o limite onde puder: um seletor de data, ou um interpretador que
  aceita qualquer formato comum. Um limite que sobra, como as regras da senha ou o tipo e o tamanho do
  arquivo, fica visível ao lado do campo e ligado a ele com `aria-describedby`.
- O rodapé é um fechamento desenhado, não um mapa do site: na maioria dos sites fortes, o nome volta em
  largura total.

## Casos especiais

**Uma marca ou um design system que já existe.** Passe `--keep palette,type`, distribua as cores e as
fontes da marca pelos papéis e tire do sorteio só a composição. As regras da casa continuam valendo; se a
própria marca exige um recurso proibido (o logo fica num gradiente, a cor de destaque é violeta), mantenha
o material da marca, diga isso no relatório e passe `--allow <rule>` ao inspetor só para essa regra.

**Redesenho, troca de estilo ou revisão de uma página ou tela de app existente.**

1. **Registre o antes.** Execute o projeto como ele está e inspecione-o numa pasta própria
   (`inspect.mjs <url> --out .taste-skill/before`, com `--app` para uma tela de app) e passe o lint no
   código-fonte. Leia o código: o framework, o jeito de estilizar (Tailwind v3 ou v4, CSS modules,
   styled-components, CSS puro), os componentes e o que tem de sobreviver: rotas, formulários, dados,
   comportamento, os materiais da própria marca.
2. **Uma revisão para aqui.** Critique as capturas do antes com `references/pt-BR/critique.md`, liste o que
   encontrou com as medidas do inspetor e diga as três mudanças que mais melhorariam a página.
3. **Mantenha a stack, o conteúdo e o que funciona.** Nada de migrar framework ou biblioteca de estilo;
   confira o arquivo de dependências antes de acrescentar qualquer coisa. Uma troca de estilo mantém o
   layout e tira a tipografia, a cor e os componentes de uma direção sorteada (`--keep` no que a marca
   define); um redesenho sorteia uma direção completa e reconstrói as seções a partir das plantas dela,
   dentro dos componentes existentes. Nos dois casos, siga a partir do passo 2 do roteiro com o conteúdo
   real da página.
4. **Ordem do trabalho, mais efeito com menos risco:** tipografia (fontes e escala), cor (um fundo, uma
   tinta, uma cor de destaque), a moldura (margens, ritmo das seções, um título na primeira dobra e um
   título em cada seção), estados (hover, foco, carregamento, vazio, erro) e, por fim, os componentes
   batidos (cards com ícone, selos em pílula, manchas de gradiente, grids de cards) trocados pelas plantas
   sorteadas.
5. **Prove.** Inspecione de novo em `.taste-skill/after`, compare o antes e o depois em toda largura,
   clique em todo link, formulário e menu que funcionava antes e relate as medidas do antes e do depois
   lado a lado.

**Um componente ou uma seção só, não uma página.** Pule o sorteio, a não ser que não haja direção para
seguir. Acompanhe o design em volta, aplique as regras da casa e as leis, e mesmo assim inspecione o
resultado.

**Sem checkout, sem backend de formulário.** O botão principal leva ao destino real quando o briefing
indica um. Senão, ele abre um e-mail com assunto e corpo escritos (`mailto:` com as escolhas do visitante
preenchidas) ou, numa loja, aponta para `#checkout`, e o relatório diz que ele precisa ser ligado antes de
ir ao ar. Nunca finja um formulário de pagamento.

**Sem Chrome ou Node 22.** Execute o `lint.mjs` (Node 18+), tire capturas de tela com a ferramenta de
navegador que você tiver e critique essas. Diga no relatório que o inspetor não pôde ser executado.

**Sem rede.** Se o `assets.mjs` não alcançar nenhuma fonte, desenhe as imagens e diga no relatório que os
acervos abertos não puderam ser consultados.

## Arquivos

| Arquivo | Leia quando |
| --- | --- |
| `references/pt-BR/app-screens.md` | Qualquer dashboard, admin, configurações ou outra tela de app: roteiro, regras, tokens e checagens próprios. |
| `references/pt-BR/copy.md` | Ao escrever o argumento e o documento de copy (passos 2 e 5). A conta das duas linhas. |
| `references/pt-BR/type.md` | Ao compor a tipografia: escalas, tracking, largura da linha, carregamento de fontes, combinações. |
| `references/pt-BR/colour.md` | Ao aplicar a paleta: papéis, proporções, degraus de tom, páginas escuras, contraste. |
| `references/pt-BR/layout.md` | Grid, margens, ritmo, variedade das seções, navegação, rodapé, a composição do celular. |
| `references/pt-BR/imagery.md` | Escolher, encontrar, creditar, recortar e tratar imagens; o que fazer quando não há nenhuma. |
| `references/pt-BR/motion.md` | Passo 9. Cota, tokens, receitas, movimento reduzido. |
| `references/pt-BR/scenes.md` | Passo 6, quando a ficha sorteia cenas de rolagem: pôr uma na página, preencher, ajustar, o celular, conferir, o catálogo. |
| `references/pt-BR/critique.md` | Passo 8. Como olhar, como dar nota, o que corrigir primeiro. |
| `references/pt-BR/tells.md` | O registro datado dos cacoetes de página gerada e do que entra no lugar de cada um. |
| `references/pt-BR/research.md` | O estudo: método, números, o que os melhores e os piores sites fazem. Cite-o, não chute. |
| `scripts/draw.mjs` | Sorteia e reimprime a direção; `--photos`, `--site <id>` para mais referências; `--app` sorteia um estilo de app. |
| `scripts/assets.mjs` | Passo 6: busca nos acervos abertos imagens reais do mundo do assunto; `--get` baixa com o crédito, `--credits` os imprime. |
| `scripts/lint.mjs` · `scripts/inspect.mjs` | A checagem. |
| `scripts/scenes.mjs` | A checagem das cenas de rolagem: cada cena a 0-100% do trecho parado, desktop, celular, movimento reduzido. |
| `assets/base.css` · `assets/base.js` | Uma base neutra opcional para construir em cima. |
| `assets/scenes/` | As cenas de rolagem: o palco compartilhado (`stage.js`, `stage.css`) e, para cada cena da biblioteca, o `.js`, o `.css` e uma página de demonstração funcionando em `demo/`. |
| `assets/app.css` · `assets/charts.js` | Para telas de app: uma estrutura neutra, painéis, tabelas e controles, e gráficos pequenos em SVG desenhados pelas regras de app. |
| `library/` | Os dados que o sorteio lê: direções, heroes, seções, sistemas tipográficos, paletas, fotos, sites estudados, movimentos, cenas de rolagem (`scenes.json`) e os estilos, estruturas e padrões de tela de app (`app.json`). Não leia inteira; use o script. |
