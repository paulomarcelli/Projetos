# Telas de app

Dashboards, painéis de administração, analytics, configurações, caixas de entrada, carteiras e construtores: as telas em que as pessoas trabalham.
Leia este arquivo inteiro antes de começar uma delas. O roteiro de página do `SKILL.pt-BR.md` não vale para elas.

Um dashboard gerado é a média de todos os templates de dashboard: uma barra lateral escura ou tingida com uma
pílula colorida no item ativo, "Bem-vindo de volta" e uma mãozinha acenando, quatro cards de KPI, cada um com um ícone
num círculo tingido, um "+12,5%" verde e um sparkline, um gráfico de área com gradiente, uma tabela zebrada sob
cabeçalhos em caixa-alta. Nada ali está errado, e nada ali foi decidido.

Este capítulo é destilado de um estudo de 23 telas reais de produto escolhidas pelo autor: 17 produtos,
17 telas claras e 6 escuras, todas na largura de desktop (1440 ou 1512 px). Cada tela foi medida pelos
pixels e anotada no que funciona e no que falha; os números abaixo são essas medidas e as
medianas delas. Os produtos não são nomeados. O que separa essas telas das geradas, em ordem
do quanto aparece:

1. **A cor vai nos dados, não no chrome *(barras, bordas e controles em volta do conteúdo)*.** A tela mediana tem uns 3% de pixels coloridos; 17 de 23 ficam
   em 5% ou menos. 12 não têm nenhum botão principal preenchido.
2. **KPIs são tipografia, não blocos.** Nenhuma tela põe um ícone num círculo colorido num KPI, e nenhuma desenha
   um sparkline nele.
3. **As superfícies são chapadas.** 17 de 23 não dão sombra aos cards; a separação é um fio de 1 px ou um
   degrau de tom.
4. **Não há cabeçalho de hero.** 9 telas não têm nenhum título acima de 16 px; onde há um, a mediana é
   24 px.
5. **Os gráficos quase não têm chrome.** Uma série única não tem legenda; as linhas de grade são de 3 a 7 linhas apagadas ou
   nenhuma.
6. **A navegação recua.** O item ativo é uma pílula cinza neutra ou uma troca de cor do texto; uma
   barra colorida à esquerda aparece uma vez.
7. **Tabelas são fios e alinhamento.** Sem zebrado, sem faixas de cabeçalho, números alinhados à direita.
8. **Os estados dos dados são honestos.** Zeros aparecem como zeros, valores ausentes como um traço cinza, e uma
   seção vazia mantém a moldura.

Tirar os recursos do template é metade do trabalho, como numa página. A outra metade é substância:
os dados reais do produto, uma tela que responde primeiro à sua única pergunta e um grid cuja aritmética
fecha.

**Um alerta aprendido nos testes.** Na primeira rodada às cegas, as telas feitas com este capítulo saíram
limpas, discretas e corretas, e perderam para telas mais ricas feitas sem ele. Os motivos dos jurados foram
os mesmos toda vez, e cada um virou uma regra abaixo:

- **A primeira dobra era rala.** Um gráfico grande de uma linha reta a ocupava, e metade dos blocos que o
  briefing pedia começava abaixo da dobra. Numa tela de 1440×900, todo bloco que o briefing cita mostra o
  cabeçalho e as primeiras linhas (§2.2).
- **O produto não aparecia.** Sem nome, sem workspace, sem símbolo: a tela podia ser de
  qualquer um. A estrutura nomeia o produto e o escopo (§3.2).
- **A contenção escondia o sentido.** Uma alta da latência e uma alta das requisições tinham o mesmo cinza. A cor numa variação
  diz bom ou ruim, não sobe ou desce (§5).
- **Não havia o que fazer.** Nenhum controle para a tarefa que é a razão da tela. A tarefa mais frequente fica a
  um clique da primeira dobra (§2.2).
- **As fileiras terminavam desalinhadas** e **o movimento de um estilo era aplicado demais** (uma bandeja em volta de cada card, uma coluna de
  ícones onde as pessoas precisavam de rótulos). Deixe o movimento onde ele carrega sentido.

Discreto é o ponto de partida, não o objetivo. Uma tela em que uma pessoa confiaria mostra mais do
produto que um template: as pessoas dele, os objetos, os números e a próxima coisa a fazer.

**Dê uma cara ao produto.** Depois de quatro rodadas, a maior queixa dos jurados era a mesma na maioria das
telas: "um kit bem aplicado, não um produto com identidade própria" (Geist ou Inter de prateleira, um fundo #f8f8f8,
cards brancos de 12 px, verde-limão sobre preto). Os tokens do estilo deixam a tela correta; estes a tornam
deste produto, e escolhê-los é um passo do roteiro, não um acabamento (§2.3):

- **Uma cara da ficha, escolhida antes de construir.** Cada estilo lista duas ou três maneiras de tirar uma
  cara do briefing: um fundo tingido a partir do mundo do produto, uma fonte de números com personalidade, o
  matiz da marca no principal elemento de dados. Escolha uma, escreva nas suas notas ao lado da pergunta
  da tela e confira se ela aparece na primeira captura de tela.
- **A fonte sorteada, carregada de verdade.** Um build que caiu na fonte padrão caiu no
  visual padrão; o inspetor agora o reprova.
- **O símbolo e o nome do produto** no topo da estrutura, desenhados para este produto (um
  monograma ou símbolo simples na cor de destaque, a partir do nome ou do objeto dele), nunca um quadrado preto com uma letra.
- **Um elemento que só este produto tem**, construído com as coisas dele: o fluxo de energia de uma casa com energia solar, a
  faixa de esgotados de uma padaria, a cobertura de um planejador de férias contra o mínimo, os grupos de ritmo de uma assessoria de
  corrida num gráfico de unidades, o casal em três raias, o commit de um deploy como o destaque da visão geral. A
  ficha lista os elementos-assinatura da biblioteca cujas palavras aparecem no briefing; se não houver, invente um.
  Nomeie-o nas suas notas ao lado da pergunta da tela.
- **O único matiz de gráfico no principal elemento de dados**: a linha de hoje, as barras reservadas, o período atual,
  a margem que estoura. Uma tela cujo único matiz é uma variação parece um kit, e o inspetor avisa
  quando uma tela com gráficos não tem matiz nos dados (`no-data-hue`).
- **As pessoas e os objetos como eles mesmos**: cada pessoa ganha uma inicial fixa e um tom claro de um matiz
  só dela, com as pessoas listadas lado a lado a pelo menos 60 graus uma da outra. Esses tons são identidade,
  não dados: ficam claros e fora das legendas dos gráficos. Produtos mostram as miniaturas deles, capas
  mostram a capa.
- **Palavras do ofício** nos rótulos e nos estados vazios ("Aguardando o cliente", "De atestado", "Vence
  dia 28"), nunca o substantivo genérico de um template ("Itens", "Registros", "Status").

**Calendários e timelines** (regra da casa, dos testes; o estudo não tem nenhum). As pessoas descem pela esquerda numa
coluna fixa de 160–220 px, agrupadas sob um subtítulo de equipe em vez de repetir a equipe em cada linha;
os dias atravessam com fios de dia apagados de 1 px, os fins de semana um degrau de tom mais escuros, e hoje marcado por um fio de 1 px
no único matiz de dados com a data na tinta. As barras têm 20–24 px de altura com raio 4. Nomes de uma linha ficam num
intervalo de 32 px; um nome com uma linha de apoio (equipe, escritório) precisa de 40–44 px, senão a linha de apoio encosta no próximo nome.
**Cada tipo de reserva tem a sua marca**, para o atestado se distinguir das férias num relance:
férias, um preenchimento claro; atestado, uma hachura diagonal de 1 px; licença longa, um degrau de cinza mais escuro; trabalho fora, um
contorno; um pedido pendente, um contorno tracejado. Um estilo com cota de matiz pode acrescentar uma borda esquerda de 3 px no
matiz para o tipo de que a tela trata. Cor cheia só para o que pede uma decisão (um pedido que
fura a cobertura). O rótulo fica dentro da barra; uma barra curta demais para ele mostra o código do tipo dentro e
o rótulo completo no tooltip, ou o rótulo depois do fim da barra, nunca por cima dos dias antes dela.
Marcadores de feriado nomeiam o escritório num produto com vários escritórios. Toda amostra da legenda é a própria marca,
em tamanho menor, e lista só os tipos na tela: `Charts.timeline(el, rows, kinds)` desenha as barras
e devolve essa legenda a partir do mesmo mapa de tipos.

## Sumário

1. Quando isto vale
2. O roteiro de uma tela de app
3. A estrutura
4. A área de conteúdo e o título da página
5. KPIs
6. Gráficos
7. Tabelas e listas
8. Formulários e configurações
9. Tipografia e cor
10. Densidade
11. Estados vazio, zerado, de carregamento e de erro
12. O celular
13. Regras da casa para telas de app
14. Cacoetes de dashboards gerados

## 1. Quando isto vale

Uma tela de app é usada para trabalhar, não para ler. Este capítulo cobre:

- dashboards e visões gerais: o dia de um vendedor, a saúde de um projeto, o crescimento de uma publicação;
- administração e back office: membros, pedidos, eventos, um catálogo;
- analytics e relatórios, inclusive um relatório gerado sem nenhum app em volta;
- configurações e cobrança;
- telas de lista para dar conta: caixas de entrada, filas, tabelas com filtros;
- carteiras e telas iniciais de finanças;
- construtores e editores: de fluxos, de formulários e de páginas, áreas de desenho;
- a página de detalhe de um objeto: um evento, um deploy, um cliente.

O site de um produto que mostra a interface é uma página; os fragmentos de interface nele seguem estas regras
por dentro (marque a raiz de cada fragmento com `data-ui`). Quando um pedido tem os dois, construa cada um
com o seu próprio roteiro e compartilhe uma paleta e uma fonte.

O estudo tem 23 telas de desktop. Não tem telas de celular, nem estados de carregamento ou de erro, tem uma página
de configurações, nenhuma caixa de entrada e nenhuma tabela de operações densa (a tela mais densa mostra uns 120 pontos de dados). Onde uma
regra abaixo vai além do estudo, ela diz **regra da casa**.

## 2. O roteiro de uma tela de app

Faça nesta ordem. Os três primeiros passos decidem se a tela presta.

### 2.1 Faça o inventário dos dados e das tarefas

O roteiro de página faz o inventário do mundo do assunto; uma tela de app faz o inventário dos dados. Escreva nas suas notas,
em 8 a 12 linhas:

- **os objetos** que a tela mostra (deploys, faturas, membros, eventos, conversas) e os campos deles,
  com unidades;
- **grandezas realistas**: quantos objetos, um valor típico, a faixa de uma taxa, como os valores se movem
  ao longo de um dia, um mês, um ano, e, numa conta nova, quão pequenos eles são de verdade;
- **as pessoas**: quem abre esta tela, com que frequência (uma olhada uma vez por dia, ou uma sessão de oito horas),
  em que aparelho;
- **as tarefas**: o que elas fazem a seguir daqui (aprovar, responder, pagar, enviar, convidar), e qual tarefa aparece
  mais;
- **as coisas do próprio produto**: o nome e o símbolo, o workspace ou a conta a que ele se restringe, as pessoas
  nele (dois sócios, uma equipe de seis, os membros da assessoria), e os objetos que as pessoas reconhecem de vista
  (fotos de produto numa loja, capas numa ferramenta de mídia, o mapa do percurso). São eles que fazem
  a tela pertencer a este produto em vez de a um template; planeje onde cada um aparece.

Depois escreva os próprios dados: um conjunto pequeno num arquivo JSON ou JS a partir do qual a tela é renderizada, com
nomes críveis, valores que somam os totais, datas em ordem e uma unidade em cada número.
Os totais são calculados a partir das linhas, nunca digitados à parte. Números pequenos continuam pequenos: as telas estudadas
mostram contas novas com 1, 6 ou 9 de alguma coisa, desenhadas com honestidade no tamanho real. Escreva os
números que precisam bater como asserções no arquivo de dados (`console.assert(sold - cancelled === rsvps)`,
as faixas somam o total, as partes o todo) e leia o console: nos testes, uma tabela de ingressos
que não batia com o próprio KPI custou a confiança de um jurado na tela inteira. Checagens que precisam de
valores calculados (o saldo depois de um pedido, a cobertura por dia) vão no script que os calcula.

**Dados que dizem a verdade** (regras da casa, dos testes; os jurados conferiram cada uma):

- **Um fato mostrado duas vezes é uma variável só.** Uma janela de tempo, um total ou um estado que aparece em dois cards
  (a bateria cheia das 13:30 às 16:30 no rótulo do KPI, o trecho sombreado e o card da bateria) é um valor só no
  arquivo de dados, e a copy *(o texto da página)* e a anotação do gráfico saem dele. Dois cards que
  discordam em meia hora custam mais confiança que um card faltando.
- **Totais e variações saem das partes como são mostradas.** Some os centavos já arredondados que a tela mostra;
  nunca arredonde à parte o total sem arredondamento: R$ 21,68 + R$ 8,34 − R$ 3,81 dá R$ 26,21, e a tela que
  diz R$ 26,22 é pega no erro. Uma variação é a diferença dos dois valores na tela (R$ 5,28 contra
  R$ 5,22 é +R$ 0,06, não +R$ 0,07).
- **Todo número relativo diz a sua base** na mesma frase: "3 h 40 min antes de fechar", "45 min
  mais cedo que domingo passado", "+5 sobre a segunda-feira típica". "Cedo", "subiu" ou um "+5" solto ao lado de outro
  horário ou número parece medido contra aquele.
- **Um nome por horário.** As lojas fecham às 15:00 e os caixas são fechados às 15:12; o cabeçalho e
  o card usam as mesmas palavras para o mesmo momento, e um estado de erro reescreve a linha de status.
- **Se uma legenda precisa dizer qual barra é qual, codifique isso no gráfico**: um período marcado num
  segundo tom com a sua entrada na legenda, um eixo com sinal, um rótulo na marca.

### 2.2 Dê nome à única pergunta da tela

Toda tela responde primeiro a uma pergunta: "As vendas de hoje entraram?", "Qual deploy quebrou?", "Quem está
esperando resposta?", "Quanto sobra do orçamento deste mês?". Escreva-a numa linha. Ela decide
três coisas:

- **o que é maior.** No estudo, o maior bloco é sempre o que carrega a pergunta da tela,
  qualquer que seja a forma (um gráfico, um plano, um anel, uma lista). O mesmo vale para os números:
  o maior número da tela responde à pergunta que a frase da linha do título responde. Nos testes,
  uma taxa de sol de 88% em 32 px gritou mais alto que a janela de carga de 24 px com que o título abria;
- **o que vem primeiro** na ordem de leitura;
- **o que fica de fora.** A página de configurações estudada mostra três números de uso e leva à
  tela de analytics em vez de desenhar um gráfico; quatro telas não desenham gráfico nenhum porque uns
  poucos números já dizem tudo.

Depois dê nome à **única descoberta** da tela: o fato nos dados de hoje que mais pede atenção ("9 faltas
enquanto 8 pessoas esperavam vaga", "o deploy das 23:28 dobrou a taxa de erro", "comer fora passou R$ 36 do previsto").
Ponha-a onde é lida primeiro, como a linha sob o título ou a linha de apoio do número principal,
ao lado da ação que ela pede. Nos testes, a descoberta que importava ficou numa legenda de 14 px no
pé de um card, e a tela pareceu sem graça.

**Não refaça uma tela estudada.** Quando o produto é do mesmo tipo de uma tela do estudo (uma
tela inicial de finanças, a visão geral de um deploy), o arranjo dela é a armadilha: os jurados reconheceram as cópias na hora.
Tire a estrutura das coisas do próprio produto: no orçamento de um casal, Ana, Conjunta e Pedro
como três colunas que atravessam contas, plano e boletos; numa assessoria de corrida, os grupos de ritmo.

Depois liste os blocos da tela como as respostas às próximas perguntas dela, um por linha, do jeito que o roteiro
de página lista as afirmações. Bloco sem pergunta é apagado. É assim que você evita a ordem de prateleira de fileira de
KPIs, gráfico grande, dois gráficos pequenos, tabela.

Mais três linhas, cada uma testada:

- **Tudo o que o briefing cita está na primeira dobra.** Em 1440×900, todo bloco que o briefing pede
  mostra o cabeçalho e as primeiras linhas ou o número dele. Dimensione o bloco principal pela pergunta (uns
  200–360 px de altura), limite listas longas a 4–6 linhas com "Ver todos" e ponha os blocos que dependem de prazo (boletos
  a vencer, SLAs acabando, um deploy que falhou) antes das tabelas longas. Um gráfico cuja linha é reta na maior parte
  da janela não ganha a largura inteira: dê a ele dois terços e ponha a próxima resposta ao lado.
- **A tarefa mais frequente fica a um clique.** Dê nome a ela ("embalar os pedidos de hoje", "responder ao estouro
  mais antigo", "fazer de novo o deploy que falhou") e ponha o controle onde a resposta aparece: um botão
  principal na linha do título, uma ação na linha que precisa dela, um "Ver logs" no item que falhou. Uma
  tela sem controle para a tarefa principal parece um relatório, não uma ferramenta.
- **Mostre a prova ao lado da resposta.** Um jurado confia mais em "Taxa de erro 0,28%" com o pico
  anotado ("chegou a 3,9% depois do deploy das 23:28, revertido") do que no número sozinho. Uma linha
  de explicação no evento que importa vale mais que um segundo gráfico.

### 2.3 Escolha um estilo

```bash
node <skill>/scripts/draw.mjs --app --kind <kind> --brief "<one line about the product>" \
  --screens <screens> [--theme light|dark] [--keep palette,type] --options 3
```

Isto sorteia até três estilos de `library/app.json` (menos quando só dois servem ao tipo e ao
tema). `draw.mjs --app --list kinds` (ou `styles`, `screens` ou `signatures`) imprime as opções; as
telas são `overview`, `analytics`, `list`, `detail`, `settings`, `wallet`,
`builder`, `inbox`, `home` e `report`. A biblioteca tem sete estilos, cada um destilado das
telas estudadas que compartilham o movimento dele:

| Estilo | Tema | Para | O movimento |
| --- | --- | --- | --- |
| `achromatic-ledger` | claro | telas iniciais de finanças, relatórios, configurações com uso | Nenhuma cor no chrome; gráficos na tinta; um sinal pequeno onde um número mudou |
| `framed-sheet` | claro | analytics B2B, plataformas para desenvolvedores, construtores | Uma moldura em L tingida; a página numa folha branca recuada 8 px, sem sombra |
| `accent-ladder` | claro | administração de criadores e pequenos negócios com planos | O matiz cheio só em marcas pequenas; os tons claros dele em todas as áreas |
| `editorial-greeting` | claro | telas iniciais de equipe e pessoais | A saudação como h1 numa coluna centralizada de 12 colunas; todo número em peso regular |
| `pastel-consumer` | claro | carteiras, orçamento | Blocos claros do mesmo matiz sob um raio grande; polaridade do dinheiro discreta |
| `true-black-flat` | escuro | comunidade, eventos, mídia | Elevação só pela luminosidade; cor só nos dados |
| `data-terminal` | escuro | mercados, monitoramento | Toda seleção é o mesmo fio de 1 px na cor de destaque; sinais, não cor, nos números |

Escolha pela forma como o produto é usado (sessões longas ou uma olhada rápida, dinheiro ou mídia, uma equipe ou uma
pessoa, dia ou noite), não pelo que é mais familiar, e escreva uma linha sobre o porquê. Depois sorteie a ficha:

```bash
node <skill>/scripts/draw.mjs --app <the same arguments, without --options> --style <id>
```

A ficha dá os tokens e a tipografia do estilo, a estrutura dele e um padrão para cada tela que você citou.
Mantenha intacto o único movimento do estilo e tire todos os outros valores dos padrões deste arquivo. Sorteie
de novo (`--redraw style | shell | screen:<name>`) só por um motivo que você consiga dizer: contradiz a marca,
ou o produto é usado de um jeito que não combina com o estilo. Com uma marca já existente, passe
`--keep palette,type`, mapeie as cores dela nos papéis do §9 e mantenha a cota de cor do estilo.

**Depois escolha a cara dele, antes de qualquer markup.** A lista "Its face" da ficha dá duas ou três maneiras de este
estilo tirar uma cara do briefing, e "Signature elements" lista os elementos da biblioteca cujas palavras
aparecem no briefing (um fluxo de energia para uma casa com energia solar, uma faixa de esgotados para uma padaria, uma matriz de cobertura
e uma timeline com os tipos codificados para um planejador de férias). Escreva nas suas notas, ao lado da pergunta da tela:
a cara que você escolheu, o elemento-assinatura (da ficha, ou um seu, feito com as coisas
do produto) e onde cada um aparece na primeira dobra. Um estilo sorteado para dois produtos não pode dar a eles
a mesma cara: em quatro rodadas, as telas que pularam este passo receberam nota de mesmo kit.

### 2.4 Construa a estrutura

Construa primeiro a moldura, vazia: a barra lateral ou a coluna de ícones, a barra superior se a estrutura tiver uma, a área de conteúdo com
os gutters *(espaço entre colunas)*, a linha do título (§3 e §4). `<skill>/assets/app.css` é um começo neutro para tudo isso:
copie-o para o projeto e ponha os tokens da ficha no `:root` dele. Olhe em 1440 e em 390 antes de entrar qualquer dado. Faça a
aritmética do grid agora e escreva num comentário: o número de colunas, o gutter e a soma que prova
que os cards chegam às bordas da área de conteúdo.

### 2.5 Ponha os dados

Renderize todo bloco a partir do conjunto de dados; desenhe os gráficos a partir dele também, com `<skill>/assets/charts.js`
(`Charts.line`, `Charts.bars`, `Charts.diverging`, `Charts.ring`, `Charts.barList`, `Charts.plan`,
`Charts.bullet`, `Charts.timeline`, `Charts.matrix`, `Charts.timeStrip`; o cabeçalho do arquivo lista as
opções deles) ou com o seu próprio SVG nas regras do §6, nunca com os padrões de uma biblioteca de gráficos e nunca com a imagem de um
gráfico. Os auxiliares mais novos devolvem `{ svg, legend }`: ponha essa legenda no cabeçalho do card em vez de
desenhar a sua, para cada amostra ser a marca que ela explica. Formate todo número pelo §7.4: separadores, casas decimais fixas por
métrica, um sinal em toda variação, unidades como sufixos cinza menores, algarismos tabulares, alinhamento à direita nas
colunas. Use as palavras do próprio produto nos rótulos. Nada de dados de placeholder *(conteúdo provisório)*: o inspetor reprova lorem ipsum,
Acme, John Doe e afins. A prova também não é inventada aqui: nada de totais de vaidade, nada de "+12%" numa
conta que tem uma semana.

### 2.6 Construa os estados

Para cada bloco, construa o estado vazio, zerado, de carregamento e de erro (§11); para cada linha e controle, o
hover, selecionado, foco e desabilitado. Olhe cada um no navegador. Uma tela que só funciona
com dados completos está construída pela metade.

### 2.7 A checagem

```bash
node <skill>/scripts/lint.mjs --app <source files or folder>
node <skill>/scripts/inspect.mjs --app <url or path/to/index.html>
```

Uma ficha sorteada com `--app` passa as duas ferramentas para as regras de app sozinha. O inspetor abre a
tela em 1440, 768 e 390 e mede o que este capítulo pede: um h1 (e o relata como o hero
da tela); uma barra lateral que se recolhe no celular; a área de conteúdo usada até a borda direita; sombras
e bordas dos painéis; o número de raios de canto; cards numa fileira que terminam em alturas diferentes, sendo que uma coluna de cards
empilhados com o gutter conta como um bloco só (`ragged-row`); uma faixa em branco de mais de 40 px dentro de um card,
ou de mais de 64 px antes do título de uma nova seção (`panel-void`); ícones em quadrados tingidos; alinhamento numérico e algarismos tabulares; matizes dos gráficos; parcela
de cor, e uma tela com gráficos mas sem matiz nos dados (`no-data-hue`); dados de placeholder; texto abaixo de
11 px; e as regras de página que continuam valendo (contraste, gradientes, as paletas proibidas, emoji). Corrija todo
`FAIL`. Trate cada `WARN` como erro, a não ser que você consiga defendê-lo para um designer numa frase.

Depois olhe as capturas de tela, em todas as larguras, e responda a estas por escrito. Esta é a crítica de uma
tela de app: os tetos do `critique.md` para imagens, movimento e o elemento vivo da página são regras de página
e não valem aqui.

1. A pergunta da tela é respondida pela maior coisa nela, e essa coisa é lida primeiro? O
   maior número é o que responde à frase da linha do título?
2. Todo bloco compartilha as bordas da tela? Há uma faixa morta num dos lados, um card parando
   antes, uma célula órfã, um card esticado com uma faixa em branco (uma legenda presa no pé, quatro linhas
   num card mantido na altura do vizinho)?
3. A cor está só nos dados, no status e na única ação principal, e o principal elemento de dados
   leva o único matiz? A cara que você escolheu aparece na primeira dobra?
4. Os números batem, e se alinham algarismo por algarismo? Liste todo fato que aparece duas vezes
   e confira se as cópias concordam; recalcule cada total e variação a partir dos valores como são mostrados;
   confira se todo número relativo diz contra o que ele é medido.
5. Todo zero parece um zero e todo valor ausente parece um traço? Todo selo de contagem fica
   numa fila que pede ação, com o substantivo claro pelo rótulo?
6. Toda amostra da legenda bate com a marca que explica, e alguma legenda precisa dizer qual barra
   é qual (então codifique isso no gráfico)? Algum rótulo bate numa linha ou em outro rótulo?
7. No celular, a navegação está recolhida, e cada bloco ainda responde à sua pergunta?

Corrija os três piores, inspecione de novo, olhe de novo. No máximo três rodadas. Julgue as imagens: se um problema
aparece numa captura, ele é real, diga o código o que disser.

### 2.8 Relatório

Diga ao usuário, em poucas palavras: o estilo sorteado (nome e seed) e os novos sorteios com os motivos; a cara
que você escolheu e o elemento-assinatura; a única pergunta de cada tela; toda checagem que você liberou e por quê (por exemplo `--allow icon-chips` para os blocos
de tipo de nó num construtor); e os dados de exemplo que precisam ser trocados por dados reais, listados para que possam ser
encontrados.

Telas de app não têm piso de movimento. Movimento é feedback: pressionar, hover, foco, um menu ou uma gaveta abrindo,
uma linha chegando. Nada na tela faz uma entrada (regra da casa).

## 3. A estrutura

### 3.1 Cinco arquétipos

| Estrutura | No estudo | O que é |
| --- | --- | --- |
| **Plano aberto (Open plane)** | 5 telas | Uma barra lateral com rótulos sobre o fundo da página (ou a 1–2% dele), separada por nada ou por um fio finíssimo de 1 px. Sem barra superior: o cabeçalho e os cards ficam sobre o fundo. A área de conteúdo é fluida com um gutter de 24–64 px, ou uma coluna centralizada. |
| **Moldura tingida, folha branca (Tinted frame, white sheet)** | 8 telas | A barra lateral e a barra superior compartilham um fundo tingido (#f6f6f6–#f9fbfc) sem fio entre elas; a página fica numa folha branca recuada 8 px das bordas direita e inferior da janela, raio 10–16 (mediana 16), uma borda de 1 px #eaeaea–#ededed e nenhuma sombra. Variantes: uma moldura em L rente, a folha recuada e painéis flutuantes recuados 8–12 px com um vão de 12 px. |
| **Moldura em T com fios (Ruled T-frame)** | 4 telas | Uma barra lateral de 210–240 px e uma barra superior de 64 px no mesmo fundo, divididas só por fios de 1 px. O seletor de workspace fica na ponta direita da barra superior, atrás de um divisor de altura inteira. Três das quatro são escuras. |
| **Coluna de ícones (Icon rail)** | 3 telas | Uma coluna sem rótulos de 50–60 px de largura (mediana 55); ícones de 15–18 px num intervalo de 34–49 px; o item ativo marcado pela cor ou por uma faixa tingida de 2%; grupos separados por fios finíssimos de 20 px. Economiza uns 180 px de largura. |
| **Sem barra lateral (No sidebar)** | 3 telas | Uma barra superior de 46–48 px sobre uma coluna centralizada de 1088–1208 px com gutters de 152–212 px; o logotipo fica na borda esquerda da coluna. Para relatórios, visualizadores e produtos com poucos destinos. |

As seis telas escuras usam um fundo só em todo lugar, divididas por fios de 1 px de #161616–#232323 ou por nada.
Nenhuma tela do estudo põe uma barra lateral escura ou saturada contra uma área de conteúdo clara (0 de 17).

### 3.2 Barra lateral

- **Largura.** Barras laterais com rótulos vão de 210 a 292 px; a mediana é 230 e a maioria fica em 224–240. Aparece um card
  de barra lateral flutuante (280 px de largura, 40 px para dentro da borda da janela).
- **Linhas.** Uma área clicável de 32 px num intervalo de 34 px é a moda (7 telas); as versões folgadas vão de 40 a 52 px num
  intervalo de 42–60 px. Os ícones têm 14–20 px, mediana 16, em contorno com traço de uns 1,5 px em 14 de 16 telas.
  Os rótulos têm 14 px em 400 em 12 de 16, na tinta ou num cinza de #4b4d4f–#63666e, a uns 8–10 px do
  ícone, com a coluna dos rótulos em x 36–48.
- **Item ativo.** Uma pílula cinza neutra com o rótulo inalterado, em 8 telas: raio 4–16 (mediana 8),
  recuada 8–14 px das bordas da barra lateral, um preenchimento de uns #e9e9e9–#ededed. No escuro, só o brilho:
  o rótulo vai de #bbb a #fff (3 telas). Só a cor no ícone ou no rótulo (3, todas colunas de ícones
  ou um card flutuante). Um preenchimento tingido na cor de destaque (3). Uma barra de destaque à esquerda uma vez em 23. O peso
  muda em 2. Padrão: a pílula cinza no claro, o brilho no escuro.
- **Grupos.** Rótulos cinza só com a inicial maiúscula, em 12–13 px, nunca em caixa-alta (9 telas), com 22–56 px de respiro
  acima e 13–33 px até o primeiro item; ou fios finíssimos no lugar (4). Utilitários como configurações e ajuda
  empurrados para baixo (5).
- **Topo e pé.** O seletor de workspace ou de conta no topo da barra lateral (7 telas), no
  pé (2) ou na barra superior. O pé tem uma linha do usuário (8) ou uma oferta de upgrade (8); uma dessas
  ofertas é um botão preenchido na cor de destaque.
- **O produto tem nome** (regra da casa, dos testes). O símbolo e o nome do produto ficam no topo da
  barra lateral ou da coluna de ícones, e o escopo (workspace, equipe, projeto, conta) aparece como um seletor ou um
  breadcrumb. Uma tela cujo produto não dá para nomear pela captura parece um template.
- **Contagens nos itens da navegação** (regra da casa, dos testes). Uma contagem só aparece numa fila que pede
  ação, e o substantivo dela fica claro pelo rótulo: "Pedidos 5", "Mudanças de preço 3". Um "Linha e
  preços 9" solto deixou o jurado perguntando nove do quê.
- **Rótulos por padrão.** Uma barra lateral com rótulos, a não ser que o produto tenha cinco destinos ou menos e a
  tela precise da largura (uma visão de pesquisa ou de monitoramento); uma coluna de ícones sempre leva o símbolo
  do produto no topo, um tooltip e um nome acessível em cada ícone. Itens da navegação são outras telas, nunca
  âncoras dentro da página atual (uma barra lateral que acompanha a rolagem de uma página longa levou nota baixa duas vezes).

### 3.3 Barra superior

14 de 23 telas têm uma; o padrão é não ter. As alturas caem em dois grupos: 44–51 px (mediana de uns
48) num chrome claro, e 64 px, em geral com um fio de 1 px. Uma barra superior tem de conter algo real: busca,
o seletor de workspace, ou o nome da página ou do objeto. A busca fica centralizada na janela com 548x32 e
uma dica de atalho (2 telas), ou com 457–537x36 numa barra sem barra lateral. O grupo da direita fica recuado 24–46 px
da borda. Duas telas deixam uns 1070 px da barra superior em branco; as duas são apontadas por isso.

### 3.4 Coluna da direita e colunas fixadas

Uma tela tem coluna da direita: uma coluna fixa de 384 px num grid `1fr 384px` com um vão de 24 px, começando
na altura do primeiro card e não do título, com os títulos das seções fora dos cards e 8 px
acima de cada um. Use uma só para um fluxo secundário estável: itens recentes, os detalhes do
objeto selecionado, links de compartilhamento. Uma coluna esquerda fixada aparece uma vez: um card de contas de 306 px na altura da viewport
menos 72 px, para o patrimônio líquido ficar à vista enquanto o resto da tela rola.

Cinco telas têm um botão flutuante (24–56 px), e um desses botões cobre o conteúdo sobre o qual fica e é
apontado por isso. Regra da casa: nada de botão flutuante, a não ser que ele seja a única ação principal da tela e não cubra
nada em nenhuma largura.

## 4. A área de conteúdo e o título da página

### 4.1 Largura e gutters

- **Fluida** (14 telas): margem lateral de 17–64 px, mediana 29, sendo 24 e 36–40 os valores comuns;
  conteúdo de 1120–1312 px de largura, mediana de uns 1204.
- **Centralizada** (8 telas): 624, 864, 1088, 1100, 1152, uns 1190 e 1208 px; mediana de uns 1126.
  Páginas de dados ficam em 1100–1250 de qualquer jeito. Só duas telas iniciais pessoais ficam estreitas (624 e 864), e as duas
  são apontadas por desperdiçar a largura.
- **Distância do topo**, do topo da área de conteúdo até o título: 20–88 px, mediana de uns 36. Ferramentas ficam em 20–36;
  telas iniciais com saudação em 50–88.
- **Um gutter só.** Use um valor de vão na horizontal e na vertical. Gutters misturados (12 contra 16, 20
  contra 24, 16 contra 12) são apontados em 8 telas.

### 4.2 Uma borda esquerda, uma borda direita

As telas mais fortes mantêm uma única borda esquerda do cabeçalho à última linha. Uma recua o cabeçalho
da página pelo padding de 24 px dos cards, então o título, os títulos dos cards, os números e o gráfico começam todos
numa linha só. Os fios das linhas podem passar 7–8 px da coluna de texto enquanto o texto fica nela.

A aritmética do grid fecha: 3 x 372 + 2 x 17 = 2 x 568 + 16 = 1152; 12 x 77 + 11 x 16 = 1100;
4 x 144 + 3 x 16 = 624; um card da segunda fileira exatamente tão largo quanto os dois cards acima dele
(251 + 24 + 515). Anote a sua soma.

Falhas a evitar, todas do estudo: cards parando 120 px antes da borda direita da folha; um gutter
direito de 0 px contra um esquerdo de 40 px; uma coluna centralizada na janela em vez de na área ao lado
da barra lateral (204 px à esquerda, 444 px à direita); um medalhão 108 px fora do eixo da coluna. O
inspetor avisa quando o conteúdo para bem antes da borda direita.

**Espaço morto de um grid que não serve aos dados** é a falha mais comum do estudo (10
telas): quatro blocos de KPI num grid de três colunas, deixando o quarto órfão; um card sozinho numa
fileira de três colunas ao lado de 810 px de nada; um card esticado até a altura do vizinho com 250 px de
branco sob a legenda. Escolha o número de colunas pelo número de itens, deixe um card sozinho ocupar mais colunas e
não estique a moldura de um card sobre espaço vazio.

**Cards que dividem uma fileira dividem a borda de baixo.** Nos testes, fileiras cujos cards paravam com 26–190 px
de diferença levaram nota baixa toda vez, dos jurados e do inspetor (`ragged-row`). Equilibre a fileira primeiro pelo
conteúdo: mova as linhas de uma lista para as duas colunas terem o mesmo número, limite as duas listas à mesma
quantidade ou junte blocos de altura parecida. Dois cards empilhados numa coluna ao lado de um card alto contam como
um bloco só: eles se equilibram quando a coluna termina no mesmo nível. Só quando o conteúdo não puder se equilibrar, empilhe os
dois blocos, ou deixe o card mais curto ocupar a altura da fileira com o conteúdo alinhado em cima e a ação do
rodapé (um "Ver todos", um total) presa no pé, para a altura a mais não virar um buraco.

**Um card esticado só estica quando tem conteúdo para preencher.** Só uma ação ou um total pode ficar
preso no pé de um card esticado; uma legenda ou uma nota fica logo abaixo do gráfico. Nos testes, um
card de cobertura esticado até o vizinho com a legenda presa no pé deixou 60 px em branco sob a
última linha, e um card de esgotados deixou 45 px acima dos links. Quando o conteúdo é curto, deixe o card
com a própria altura (`align-items: start` na fileira), passe o link do rodapé para o cabeçalho ou dê à
fileira um bloco de altura parecida. Um bloco filtrado encolhe até as linhas dele, ou mantém um número fixo de
linhas com uma frase nas vazias; quatro linhas sobre 270 px de card vazio é um buraco. O inspetor
avisa numa faixa em branco de mais de 40 px dentro de um card (`panel-void`).

**Blocos estreitos não ocupam a área de conteúdo inteira.** Uma tabela de cinco colunas ou menos, ou uma lista de seis linhas ou
menos, vai até uns 760 px em 1440 e faz par com o próximo bloco; esticada a 1300 px, ela deixa
vazios de 400–600 px entre um nome e o primeiro número.

### 4.3 O título

- **Toda tela tem um h1**; o inspetor reprova a tela sem ele. 14 telas o põem na
  área de conteúdo em 18–48 px, mediana e moda 24, em 600–700 (700 em 8). As outras não têm nada acima de 16 px: um
  breadcrumb ou a barra superior nomeia a página. Aí o último item do breadcrumb é o h1, em 16 px, e
  o nome da tela continua sendo a primeira coisa lida.
- **Um substantivo, não uma saudação**: "Analytics", "Visão geral", o nome do projeto ou do objeto. 3 de 23
  cumprimentam, e uma acrescenta um emoji, que sai. Saudação só combina com uma tela inicial pessoal ou de equipe.
- **Uma segunda linha opcional**: uma frase cinza de 14–16 px sobre os dados ou o objeto (a descoberta,
  o período, o escopo), nunca sobre a interface ("os filtros restringem todos os blocos…", "esta página
  mostra…" parecem instruções, não um produto), ou uma linha de 12 px
  dizendo a fonte dos dados.
- **À direita do título**: ações só quando são reais (10 telas); senão, nada. Um carimbo de atualização
  ("Atualizado em 27/07, 16:09", com um botão de atualizar) em 6.
- **A ação principal.** 12 de 23 não têm botão principal preenchido; 5 o fazem quase preto (#1d1f20,
  #1f2937) ou branco invertido no escuro; 4 o preenchem com o matiz da marca. Uma ação principal por tela.

### 4.4 Abas, filtros e o período

- **O período** no nível da página (7 telas) ou em cada card (7), nunca nos dois. Um card que diz o
  próprio período o põe no cabeçalho, alinhado à direita, em cinza.
- **Abas sublinhadas** (8 telas) sempre ficam sobre um fio de 1 px de largura inteira; o indicador tem 1–4 px (mediana
  2), tão largo quanto o rótulo ou passando 8–11 px dele.
- **Uma trilha segmentada** uma vez: 48 px, #f3f4f6, uma pílula ativa branca de 36 px e o seletor de data dentro da ponta
  direita, para abas e período se lerem como uma fileira só. Um controle segmentado é tão largo quanto as opções, e de largura
  inteira só abaixo de uns 480 px: três opções espalhadas num card de tablet de 680 px parecem uma barra de progresso.
- **Altura dos controles** nas linhas de título e de filtro: 28–40 px, mediana 34, concentrada em 32 e 36.
- **Ordem**: o escopo à esquerda (a data primeiro, depois os filtros), utilitários e atualizar à direita.
- **Filtros compostos** que se leem como uma frase ("Data | 14/06 - 13/07 | Diário"), com 28 px de altura e 8 px
  de distância, uma vez.
- **Até o primeiro card**: 13–64 px, mediana 24.

## 5. KPIs

- **Nenhum bloco próprio.** 11 das 20 telas com números principais não dão bloco ao KPI: texto solto na
  página ou num card (5), ou um contêiner dividido por fios finíssimos de 1 px (6). 9 usam um card por KPI,
  com 61–147 px de altura (mediana de uns 108). O padrão é um contêiner dividido por divisores de 1 px em
  colunas iguais. 7 telas não têm fileira de KPIs e põem cada número principal no card que o
  explica, o que muitas vezes é melhor.
- **Quantidade.** 1–6 por fileira, mediana 3–4. A quantidade bate com o grid: quatro KPIs ganham quatro colunas.
- **Tamanho.** Valores de 16–40 px, mediana 26, moda 24. Valores num bloco próprio ficam maiores (mediana 30) que
  numa faixa compartilhada (mediana 24). Nada em 48 px ou mais. Rótulos de 12–16 px, mediana 14; o valor tem
  umas 1,7 vez o rótulo.
- **Peso.** Uma divisão por igual: 400 em 8 telas, 600 em 6, 700–800 em 6. Um número grande em peso
  regular sob um rótulo semibold é o padrão comum. Negrito só para dinheiro.
- **Ordem.** Rótulo acima do valor em 14 telas; rótulos cinza (#6b6b6b–#aaa) em 13; só a inicial maiúscula.
- **Mais nada.** Nenhum ícone num círculo colorido (0 de 23), nenhum sparkline (0 de 23), nenhum bloco tingido.
  Um ícone de informação ao lado do rótulo pode (5 telas). Unidades são um sufixo cinza menor: "5 min" em 24
  sobre 14, "2 min 24 s", "5 /10".
- **O número da resposta lidera.** Quando um número é a resposta da tela (um saldo, o patrimônio líquido, o
  valor da carteira), ele tem 30–36 px e pelo menos 1,3 vez os números irmãos (os de 18–24 px). Nos
  testes, um valor de carteira de 24 px ao lado de dois números de 24 px deixou a tela sem destaque. Nenhum outro
  número na tela é maior: o maior número responde à frase da linha do título, então uma
  taxa secundária em outro card fica no tamanho dos irmãos.
- **Um número, um lugar.** Um número mostrado na faixa não se repete numa legenda ao lado, e uma
  faixa de KPIs em que cada célula nomeia um painel abaixo (Confirmações, depois um painel de Confirmações) sai: abra cada
  painel com o próprio número.
- **Uma segunda função.** KPIs podem ser as abas de série do gráfico ou o filtro de tipo da lista (o card selecionado
  ganha uma borda de 1,5 px). Como abas, a selecionada leva um fio de 2 px ou o preenchimento ativo e um rótulo
  na tinta; as outras mantêm o rótulo cinza e o valor na tinta, em 400 contra os 500 da selecionada.
  Um valor cinza parece desabilitado: nos testes, o faturamento de três lojas posto em cinza por serem abas
  pareceu secundário, embora fosse o primeiro pedido do briefing. Quando as abas são o detalhamento por entidade
  que o briefing pede, não deixe nada cinza e deixe só o fio marcar a seleção. No celular as
  abas viram um grid de 2 colunas com a célula selecionada preenchida, ou uma fileira que rola de lado; nunca um
  sublinhado flutuando dentro do grid (o `app.css` faz as duas coisas).

### Variações

- Opcionais: 9 das 20 telas com KPIs mostram uma; 11 não.
- 10–15 px (mediana 14), nunca maiores que o rótulo. Texto ou um glifo pequeno em 6 telas; uma pílula
  clara em 3.
- **A janela em palavras**: "vs. 30 dias anteriores", "nos últimos 90 dias", "a partir de 0 (últimas 4 semanas)" (7 das
  9).
- **Pinte só o número**, ou ponha a variação inteira em cinza.
- **A cor diz bom ou ruim, não sobe ou desce** (regra da casa, dos testes). Toda métrica tem uma direção
  boa: latência, taxa de erro, custo, churn e tempo de resposta são melhores quando caem. Uma variação
  na direção ruim põe `--negative` no número (ou um glifo pequeno apontando para baixo nessa
  cor); uma variação na direção boa é `--positive` ou cinza. Um jurado leu uma alta de 2,5× nos erros
  posta no mesmo cinza de uma alta nas visitas como se a tela escondesse a sua única má notícia.
- **Variação zero ou indefinida é cinza.** A falha de KPI mais comum do estudo é uma variação zero ou indefinida
  mostrada como sinal: três pílulas verdes idênticas de "subiu 100%" nascidas do zero, um ">999%", um "0,00%" vermelho
  em negrito, um "+0" verde. Quando o período anterior era zero, escreva "+4 (novo)"; quando não há com o que
  comparar, um traço cinza curto onde ficaria a variação.

## 6. Gráficos

### 6.1 Qual gráfico para qual pergunta

| Pergunta | Forma | No estudo |
| --- | --- | --- |
| Está mudando com o tempo? | Uma linha; área só com preenchimento de 15% ou menos | 9 telas |
| Quanto por período? | Colunas de cantos retos | 3 |
| Como se distribui? | Um histograma de faixas iguais | 1 (as faixas desiguais dele foram apontadas) |
| Quem lidera? | Uma lista de barras horizontais ordenada, ou o preenchimento da linha como barra numa lista de um valor só | 3 |
| Qual a fatia? | Um anel fino, ou uma barra empilhada de 100% com emendas de 2 px; cinco partes no máximo | 5 |
| Quanto falta para a meta? | Uma barra de progresso, as duas pontas rotuladas, o preenchimento na proporção real | 4 |
| Quanto do planejado já foi usado? | Uma trilha do comprimento do planejado, a parte gasta preenchida, o já comprometido como um segmento mais claro, o estouro além do fim da trilha na cor negativa (`Charts.plan`) | regra da casa |
| Saiu da meta? | Uma linha por parte: a fatia atual como barra, com uma marcação de 1 px na meta (`Charts.bullet`); nunca duas barras empilhadas para comparar | regra da casa |
| Onde? | Um mapa com uma lista ao lado; a lista leva as grandezas | 1 |
| Por período, e o acumulado? | Os dois lado a lado, com a mesma largura e as mesmas datas | 1 |
| Para que lado foi o fluxo, e quanto? | Colunas acima e abaixo de uma única linha do zero, numa escala só, o eixo com sinal e legenda de cada lado ("Vendido" acima, "Comprado" abaixo), um período destacado num segundo tom com a sua própria entrada na legenda (`Charts.diverging`) | regra da casa |
| Quem está fora, e quando? | Uma timeline de pessoas por dia, cada tipo de reserva com a sua própria marca (`Charts.timeline`) | regra da casa |
| Tem gente suficiente? | Uma matriz de equipe por dia com a folga em relação ao mínimo (+2, +1, 0, −1), um matiz só que escurece em direção à cor negativa, o número de pessoas no hover (`Charts.matrix`) | regra da casa |
| Em que hora do dia, comparado com a última vez? | Uma linha por item num eixo comum da abertura ao fechamento: uma trilha cinza de 2 px, um ponto na tinta para hoje, uma marcação vazada para o dia de comparação (`Charts.timeStrip`) | regra da casa |

Mais três, dos testes:

- **O par de barras por período e o acumulado aparece uma vez por tela**, e só quando o
  acumulado cruza uma linha que importa (a capacidade, uma meta). Três desses pares em seis gráficos parecem um
  padrão carimbado.
- **Uma série reta, a não ser por um evento,** ganha no máximo dois terços da largura e cerca de 140 px de
  altura, ou um intervalo limitado a cerca do dobro da sua linha de referência, com o pico fora da escala rotulado
  (`Charts.line({ max })`). Um gráfico de largura total 85% vazio era o maior bloco de uma primeira
  dobra e perdeu nota.
- **Previsão não é fato**: depois de hoje a linha fica tracejada e o valor final é rotulado
  (`Charts.line({ today, endLabel })`), com a distância até a meta marcada entre colchetes quando houver meta.
- **O que o briefing pede para ver ao longo do tempo é desenhado na primeira dobra.** As células de KPI só podem trocar o gráfico
  entre métricas que o briefing não citou.

Quando há só alguns números, não desenhe gráfico: quatro telas não têm, e a página de configurações leva
à tela de análise com "Ver mais".

### 6.2 Uma pergunta, uma série

Uma série por gráfico é a norma; três é o máximo que alguma tela desenha. Para mostrar outra métrica, troque-a
com um controle (um controle segmentado, um dropdown, os KPIs como abas) em vez de sobrepor linhas.
Os gráficos têm de 112–264 px de altura (mediana de cerca de 195) e de 316–1.136 px de largura (mediana de cerca de 570), uma proporção de 1,8
a 5,2.

### 6.3 Eixos e linhas de grade

- **Linhas de grade** só na horizontal em 7 dos 12 gráficos cartesianos, nos dois sentidos em 3 e nenhuma
  em 2. Use 3–5 (o estudo vai de 3–7, mediana de 4–5): 1 px, contínuas, cerca de #e5e5e5 no claro (faixa
  #cfcfd2-#f2f2f2), #2b2b2b sobre #111. Linhas tracejadas são permitidas nas grades dos gráficos (4 telas: 3/3, 4/4,
  3/2.5) e em nenhum outro lugar da tela.
- **Sem linha do eixo y.** A base é a única linha mais pesada (2 px em duas telas, 1 px em uma); eixos completos
  em uma.
- **Marcações do y**: 4–7, mediana 5, com 11–16 px (mediana 12) em cinza (#5f5f5f-#6c6c6c), à esquerda (8
  telas) ou à direita (2). Degraus redondos e iguais (0/5/10/15%; de 0 a 600 de 150 em 150), a marcação de cima acima do
  máximo, inteiros para contagens e o zero como base para barras e contagens.
- **Nunca sem escala.** Duas telas não desenham escala no y e só mostram a grandeza no hover; as duas foram
  apontadas. Também foram as marcações desiguais (0/3/6/10), uma marcação de 0,8 numa contagem, uma marcação de cima igual ao máximo, de modo que
  a linha bate na borda do gráfico, e um eixo acumulado que começa em 1.
- **Texto do eixo não maior que os dados.** Marcações de 15–16 px ao lado de valores de 14 px foram apontadas como mais chamativas
  que os números.
- **Rótulos do x**: 4–8 por gráfico, retos, nunca girados (40 graus foi apontado), o primeiro e o último puxados
  para dentro do gráfico, num mesmo degrau do começo ao fim: um rótulo final forçado depois das 14:00 num degrau de 90 minutos
  deixou um último intervalo curto que um jurado mediu. Escolha um degrau que caia no fim (de hora em hora das 08:00
  às 15:00) ou deixe o fim sem rótulo. Rotular só as duas pontas esconde quando as coisas aconteceram. Datas irregulares num
  eixo de categorias são apontadas: tempo vai numa escala de tempo.

### 6.4 Marcas

- **Linhas** de 1–3 px, mediana 2, em segmentos retos. Quatro telas suavizam as linhas, e uma curva
  suavizada inventa valores entre os totais diários (apontada); então desenhe segmentos retos. Sem marcadores nos pontos,
  a não ser um ponto no hover (8 px numa tela).
- **Preenchimento**: nenhum em 7 de 10 gráficos de tempo. No máximo um tom chapado de cerca de 14%, ou um fade da linha até
  o transparente ao longo de 150–200 px.
- **Barras** têm cantos retos (4 telas), ou no máximo um raio de 4 px em cima com a base reta sobre a
  linha de base. Segmentos empilhados são separados por uma emenda de 1–2 px.
- **Cor.** Um matiz por gráfico. A cor de destaque toca só os dados em 8 telas, e a tinta dos dados fica abaixo de 3%
  dos pixels na maioria. Séries neutras funcionam, e muitas vezes melhor: uma linha quase preta que fica cinza-clara
  depois do cursor; uma linha branca contra uma vermelha; sinais em vez de cor ("+R$ 24.000.000").
  Mas o matiz único, quando o estilo tem um, vai no principal elemento de dados da tela (a série de hoje,
  as barras reservadas, o período atual, a margem que estoura), não num gráfico secundário ou numa variação:
  nos testes, uma tela toda na tinta, sem matiz em nenhum dado, pareceu um kit.
  Um assunto mantém um matiz na tela inteira: os mesmos assinantes desenhados em rosa num gráfico e em índigo
  no seguinte são apontados. Matizes sem relação numa tela (três, cinco) são apontados toda vez. Cores de status
  são para status. O inspetor avisa acima de quatro matizes e reprova acima de seis.
- **Legendas.** Nenhuma para uma série só (9 gráficos): o título ou o dropdown dá o nome. Fora isso, cinco
  itens no máximo, como um ponto de 5–8 px com um rótulo cinza de 12–14 px no cabeçalho do card, ou como uma tabela pequena
  (ponto, nome, valor, variação) que faz a legenda levar dados. Nunca liste uma série sem dados
  (apontado). Toda amostra é a marca que ela explica, em tamanho menor: o ponto da legenda é da cor da linha,
  a amostra de uma barra hachurada é hachurada. Uma amostra desenhada à parte da marca se afastou dela nos testes
  (um contorno preto com borda vermelha explicando um contorno vermelho); os helpers devolvem a legenda montada a partir
  do mesmo objeto de estilo das marcas.
- **Anéis** só para três a cinco partes de um todo que ainda não estejam listadas ao lado (um anel
  que redesenhava os valores gasto, a vencer e restante do bloco ao lado foi marcado como redundante). Nunca
  rotulados nas fatias; o total fica no centro ou ao lado do anel. As
  telas elogiadas pelos anéis usam traços finos: 3–5 px num anel de 90–154 px, 8 px num de 182 px. Duas outras
  usam 28 e 37 px.
- **Barras de progresso** têm de 4–24 px de altura (mediana 8), totalmente arredondadas, com as duas pontas rotuladas ("Habilidoso 200"
  e "Especialista 2.000"); o preenchimento é a proporção real, então 303 nessa escala preenche 22 px de 392. Um zero não tem
  toco (um toco de 6 px no zero é apontado).
- **Tooltips** são texto puro ou uma caixa simples sem seta: rótulo e valor numa linha.
- **Anote o evento que importa.** Um degrau ou um pico de mais de cerca de três vezes a variação habitual
  ganha um marcador de 1 px e um rótulo de 12 px dizendo a causa ("Deploy a3f09c1", "Destaque na newsletter");
  linhas de referência (um orçamento, um SLO, um horário de início) são tracejadas de 1 px com o rótulo na ponta. Nos
  testes, um salto sem explicação foi a primeira coisa que um jurado perguntou. `Charts.line`,
  `Charts.bars` e `Charts.diverging` recebem `annotations` e `reference`.
- **Rótulos nunca se chocam.** Os rótulos das anotações ficam em fileiras acima do gráfico, cada um ao lado do topo da sua
  própria linha-guia, e nenhuma linha-guia passa por outro rótulo; as fileiras só são reservadas quando existe
  rótulo, então um gráfico sem rótulo não tem uma faixa morta em cima. O rótulo "Agora" de uma previsão vai
  do lado da linha que a série não cruza. Posicione os rótulos depois que as fontes carregarem, senão
  o conjunto de rótulos muda de um carregamento para outro (mudou nos testes). Os helpers fazem tudo isso; dê a um rótulo
  que pode não caber uma forma `short`.
- **Use o helper e depois amplie-o.** Desenhe os gráficos com `assets/charts.js` e acrescente a ele o que o gráfico precisa,
  em vez de escrever código de eixo novo: nos testes, todo gráfico escrito do zero num celular pôs
  os rótulos do y em cima da linha.
- **Históricos curtos e vazios são desenhados com honestidade**: uma linha reta no zero com um pico, barras ausentes para
  os períodos vazios, sem intervalo do y inflado, sem imagem de "Sem dados". Mas não dê a um único ponto o maior
  gráfico da tela: um ponto solitário numa grade de tamanho cheio parece deserto (apontado uma vez).

## 7. Tabelas e listas

### 7.1 Linhas

- Linhas de dados de uma linha só: 36–53 px, mediana 45.
- Linhas de duas linhas com mídia: 56–92 px, mediana 72. O intervalo é a altura da mídia mais 24–32 px
  (48 + 24, 48 + 32, 50 + 30).
- Linhas de chave e valor e de legenda dentro de cards: 21–32 px.
- Numa célula de duas linhas, a linha 2 fica cerca de 21 px abaixo da linha 1 (19–23), um tamanho menor (12–14 px) e
  cinza. Rótulos de duas linhas precisam de um intervalo de pelo menos 40–44 px: num intervalo de 32 px a sublinha quase encostou no
  nome da linha seguinte, e a lista embolou (regra da casa, dos testes).
- Listas de visão geral mostram de 2 a 5 linhas.

### 7.2 Cabeçalho

- 11–14 px, mediana 12, quase sempre em peso regular, cinza, só com a inicial maiúscula (9 das 11 tabelas com cabeçalho). O único
  cabeçalho em caixa-alta do estudo foi apontado como mais chamativo que os dados.
- **Sem faixa de preenchimento** (0 de 11) e **sem fio embaixo** em 8 de 11. Onde há fio, ele é a
  linha mais forte da tabela (#e5e7eb sobre fios de linha #f3f4f6).
- Linha do cabeçalho de 36–40 px.
- Cabeçalhos numéricos são alinhados à direita, rentes aos valores; um cabeçalho que para 15 px antes do fim
  da coluna é apontado. Um cabeçalho sobre um controle se alinha com o controle que ele rotula (centralizado sobre uma
  coluna de steppers), e uma variação ao lado de um stepper ganha a sua própria coluna estreita, sem rótulo; três
  alinhamentos numa linha de cabeçalho foram apontados.
- Um símbolo de ordenação só na coluna ativa.

### 7.3 Fios divisórios

- **Sem linhas zebradas** (0 de 23).
- Sem fio entre as linhas em cerca de metade das listas; elas contam com um intervalo de 61–92 px ou com vãos de 2–8 px entre
  linhas preenchidas.
- Quando há: 1 px, 3–7% mais escuro que a superfície (#ededed-#f4f4f4 sobre branco; #161616 sobre #000,
  #1b1a1f sobre #131217).
- Extensão: passando 8–9 px da borda do texto; começando na coluna do texto e pulando a mídia; ou
  a largura interna inteira. Escolha uma por tela.

### 7.4 Números e alinhamento

- **Números alinhados à direita**, em algarismos tabulares ou numa fonte mono. Toda coluna numérica alinhada à esquerda e
  toda coluna de algarismos proporcionais do estudo foi apontada (durações "00:00:12" e "00:00:04"
  que tremem, centavos que escorregam).
- **Casas decimais fixas por métrica**: dinheiro 2, porcentagens 1 ou 2, contagens nenhuma. Separador de milhar
  em todo lugar ("R$ 16.531,54"); abrevie só numa linha de capacidade ("12,7 mil de 20,0 mil"). Sinal em toda
  variação ("−R$ 0,09", "+10.100 (+0,20%)"). Em reais, um formato só, com espaço depois do símbolo (o "R$89,00" de uma tela
  ao lado de "R$ 15,00" é apontado).
- **A coluna de identificação ganha a maior largura**, cerca de um terço a metade da tabela, e nunca é
  a que fica cortada na largura de desktop: encurte os nomes editorialmente primeiro (tire o emissor que toda linha
  repete, a classe da cota, o "Ltda.") e use o mesmo nome curto em todas as larguras.
- **Uma borda direita por linha ou card**: todo número alinhado à direita dentro de um card ou linha termina na mesma
  linha de padding (um número de dias na etapa 18 px antes do valor acima dele parece uma segunda borda).
- **Duas medidas se empilham numa célula** em vez de ocupar duas colunas: uma contagem sobre a sua porcentagem cinza de 12 px,
  uma data sobre a sua hora, um valor em dinheiro sobre a quantidade em unidades, as duas linhas na mesma borda
  direita.
- **Datas** em ISO e alinhadas à direita onde as linhas são comparadas ("2024-02-15"); por extenso para
  o que é recente ("Hoje", "Ontem", "6 dias").
- **IDs** numa fonte mono no tamanho do corpo, cortados em cerca de 8 caracteres com reticências e um ícone de copiar
  12 px depois.
- Corte em uma linha com reticências; nunca quebre no meio de uma palavra.
- **Um detalhamento num card estreito** ("Pinheiros 6 · Vila Madalena 5 · Moema 3") vai em minicolunas fixas,
  ou cada item fica em `nowrap` com o separador preso ao item seguinte, para nenhuma linha terminar
  num "·" solto.
- **Uma célula editada mostra que mudou** (regra da casa, dos testes). Numa grade editável, um valor
  alterado leva uma marca (um ponto, uma borda tingida), e o cabeçalho da coluna ou uma legenda diz a
  referência ("vs. a segunda-feira habitual"); um "+5" cinza solto ao lado de um stepper foi lido como ruído.

### 7.5 Tinta dentro das linhas

- Só a identificação e o número principal levam a tinta principal; todo o resto é cinza ("5" na tinta,
  " /10" em cinza).
- Um valor ausente é um traço cinza; um zero de verdade é impresso ("R$ 0", "0,00%", "0% (0)").
- O sinal mora no texto, não na cor: receita verde com "+", despesas na tinta, sem vermelho em
  todo negativo.
- Cor de link só na célula do nome, sem sublinhado.

### 7.6 Pílulas de status

- 15–28 px de altura (mediana 20), texto de 9–14 px no estudo (mediana 12) em 500; aqui, nada abaixo de 11 px. Uma
  pílula inteira ou uma tag de 3–5 px.
- Um tom claro com texto escuro do mesmo matiz, opcionalmente com uma borda de 1 px um degrau mais escura: #dcfae5 com
  #04250e, #ffedea com #831c1e.
- Estados neutros são chips monocromáticos com um símbolo ("Público" com um globo).
- Uma máquina de estados usa um matiz em três intensidades: cinza para desligado, o matiz cheio para a chamada à
  ação, um tom escuro para em andamento. Preenchimento saturado com texto branco só para essa única chamada à ação,
  e só enquanto ela for rara: quando mais de cerca de um quinto das linhas visíveis a levam, ela vira uma
  faixa de manchas pretas mais chamativa que os dados (perdeu nota nos testes); use o par claro ou um ponto de 6 px
  com um rótulo na tinta.
- **Uma marca de status por linha.** Uma tag e um selo que dizem a mesma coisa são apontados.
- **Um chip nunca é espremido.** Tags e pílulas são `flex: none; white-space: nowrap`: nos testes, uma
  coluna de tabela encolheu um chip de ambiente para uma caixa de 12 px com a palavra vazando.

### 7.7 Mídia

Logos de 16 px em linhas densas; avatares de 24–32 px; 48–50 px em linhas de duas linhas. Círculos para pessoas, tokens e
empresas; raio de 2–3 px para arte e bandeiras; 8 px para fotos. Um espaço fixo de mídia lista abaixo,
para o texto começar numa borda só (um espaço de 50 px com o texto 16 px depois). Vão entre mídia e texto
de 10–16 px, mediana 12.

### 7.8 Ações e paginação

- **Sem paginação numa visão geral** (0 de 23). Limite as linhas e leve para fora: "Ver todos" no cabeçalho
  da seção, um botão contornado de 30 px embaixo da lista, uma barra de largura total de 32 px. Diga o total ("3 faixas").
- Ações da linha: nenhuma em 9 telas; fora isso, um kebab na ponta direita. Reserve uma coluna de ação no fim
  só quando a maioria das linhas tem a ação; fora isso, a ação é uma ação em texto na tinta na
  segunda linha, e os números ficam rentes à borda do card. Quando uma linha pede ação
  (uma conta a pagar, um pedido a embalar, um deploy que falhou), a ação é um botão fantasma visível ou uma ação
  em texto na tinta numa coluna fixa no fim, no mesmo intervalo em todas as linhas; nunca texto cinza apagado,
  e nunca empilhada embaixo do valor, para as linhas não mudarem de altura.
- Checkboxes só onde existem ações em lote (uma tela: 18 px, traço de 2 px, raio de 3 px).
- Hover e selecionado: um contorno de 1 px com raio de 6 px passando 1 px do painel, ou uma borda mais escura
  com um anel de 1 px. Nenhum hover que muda o preenchimento foi visto. Numa lista que comanda um painel de detalhe (uma
  caixa de entrada, uma fila), a linha selecionada leva o preenchimento `--active` da pílula da navegação, para não ser
  confundida com um anel de foco ou um hover (regra da casa, dos testes).
- Barra de ferramentas: uma busca, de 30–36 px de altura (256x30, 252x36, 316x32).
- **Uma tela de lista inteira** (regra da casa; o estudo não tem nenhuma): diga o total acima da tabela, mantenha a
  linha do cabeçalho à vista durante a rolagem e pagine ou carregue mais no fim, mostrando o intervalo
  ("1–50 de 1.284").

### 7.9 Listas que levam dados

- **O preenchimento da linha é a barra**: o fundo arredondado da linha (raio 8) tão largo quanto a sua fatia em relação à
  maior fatia; linhas de 44 px, vãos de 2 px. Só numa lista de ranking de um valor só (um rótulo e um valor): numa
  linha com várias colunas ou duas linhas, a borda do preenchimento corta as palavras (reprovado nos testes).
  Planejado contra gasto é uma trilha à parte de 6–8 px embaixo do rótulo (`Charts.plan`).
- **Lista de barras**: um intervalo de 64 px, uma linha de rótulo e depois uma barra em pílula de 10 px com o valor 5 px depois da ponta; a
  barra mais longa com cerca de 88% da largura; uma cor, sem trilha.
- **Barras dentro de uma lista são finas e cinza**, a não ser que sejam a série principal da tela: 2–3 px no
  máximo. Uma lista de valores em dinheiro ordenada num card estreito leva uma barra proporcional de 2 px embaixo de cada rótulo, cinza,
  com o primeiro item na tinta (`Charts.barList(el, rows, { thin: true })`), para o "mais caro primeiro" ser
  visto, e não só lido. Nos testes, seis barras pretas de 4 px foram as marcas mais chamativas da tela.
- **Uma timeline desenha a sua comparação.** Quando o briefing pede "comparado com o domingo passado", a comparação é uma
  marca no mesmo eixo (`Charts.timeStrip`: um ponto na tinta para hoje, uma marcação vazada para o dia
  de comparação), não só uma linha de texto.
- **Legenda como tabela**: ponto, nome, pílula, valor e variação num intervalo de 57 px.
- **Poço de chave e valor**: um poço tingido, raio 8, linhas de 32 px, rótulo à esquerda, número à direita.
- **Feed em cards de linha**: 63 px de altura, vãos de 8 px, raio 14, um preenchimento um degrau mais claro e uma borda um degrau
  mais escura que o painel, uma data relativa à direita.
- **Árvore**: sem fios divisórios, 8 px de recuo por nível, tinta contra cinza conforme o nível, um intervalo de cerca de 30 px,
  cerca de 45 px entre os grupos.

## 8. Formulários e configurações

O estudo tem formulários em três telas e uma página de configurações, então esta seção se apoia em pouco. É
o bastante para os padrões.

### 8.1 Campos

- **Rótulo acima do campo**, 14 px em 500, vão de 8–10 px. Sem rótulos flutuantes e sem placeholder (conteúdo provisório) fazendo
  as vezes de rótulo.
- **Campos de entrada** de 38–40 px nos formulários (raio 8–10); controles da barra de ferramentas e de filtro de 28–40 px, mediana 32. Uma
  altura de controle por contexto.
- Os campos ficam brancos com uma borda de 1 px #e5e7eb-#e8e8e8 até num painel cinza; os controles de filtro e de seleção
  levam uma borda um degrau mais escura (#cdcfcf-#d1d5db).
- Um ícone na frente de 14 px, 13 px para dentro da borda, com o texto começando em 38 px.
- **Espaçamento**: 24 px da descrição ao primeiro rótulo, 16 px entre os campos, 16 px até o botão
  Salvar.
- **Um campo e uma ação juntos** (um link só de leitura e o seu botão Copiar) dividem a borda e deixam retos
  os cantos internos.
- **Toggles** de 28x16 a 33x20. A cor de ligado é um verde semântico ou quase preto, não a cor de destaque da marca.
- **Controles desativados** continuam legíveis e dizem por que estão desativados: o Salvar desativado do estudo
  (#cecece sobre #f4f4f4, cerca de 1,4:1) e o seu painel bloqueado pelo plano com 30% de opacidade foram apontados como
  ilegíveis.

### 8.2 Layout das configurações

- Cada seção é uma linha: uma coluna de rótulo (cerca de 450 px: um título 16/500 e uma descrição cinza de 14 px)
  ao lado de um painel (cerca de 700 px, #fafafa, raio 16, padding 16, sem borda, sem sombra). O topo das maiúsculas
  do título se alinha com a primeira linha do painel, 6–8 px abaixo do topo do painel.
- As seções são separadas por um fio de 1 px de largura total, com 32 px acima e abaixo.
- Uma linha com chave: um título 14/500, um selo de status 8 px depois dele, uma descrição cinza de 14 px e o toggle
  à direita, a 16 px da borda e centralizado na linha do título.
- Um recurso que depende do plano: uma faixa tingida de 48 px com um botão de 32 px logo acima do painel bloqueado; o
  painel continua legível.
- Contêineres estreitos empilham: rótulo, 10 px, campo e depois 26 px até o par seguinte.
- Não deixe a coluna de rótulo vazia ao lado de um painel alto (um vazio de 250 px é apontado): ponha ali a ajuda da seção
  ou um resumo dos valores atuais, ou estreite a coluna.
- **Ações destrutivas** (regra da casa; nenhuma no estudo) vão por último, numa seção só delas, como um
  botão de texto ou contornado na cor negativa, com a consequência em palavras e uma confirmação
  que diz o nome do objeto.
- **Uma visualização por área** (regra da casa, dos testes). Quando as configurações cobrem várias áreas (geral,
  membros, cobrança, notificações), cada item da barra lateral abre a sua própria visualização (uma rota com hash basta
  num build estático), com o nome da área como h1. Uma página longa com todas as áreas, com a barra lateral
  rolando até âncoras, pôs a primeira área que o briefing citou quatro telas abaixo e perdeu nota.
- **Um modelo de salvar por visualização**: todo controle se salva sozinho e mostra um discreto carimbo "Salvo", ou um
  Salvar por painel, no canto inferior direito do painel. Nunca uma mistura dos dois na mesma visualização.
- **Mostre o que a configuração produz.** Ao lado do controle que a muda, uma pequena prévia do
  resultado (o e-mail de convite, a notificação como ela vai chegar, a próxima fatura do plano) é a
  substância própria do produto que uma tela de configurações de outro modo não tem.
- Uma visualização de configurações abre com uma faixa de uso só quando o uso é a pergunta dela (uma visualização de plano ou de cota), e os
  números dela ficam menores que o h1.

### 8.3 Botões

Os controles têm 27–40 px de altura (mediana 34; 32 é o mais comum), com raio de 6–8 px nos estilos fechados
e pílulas inteiras nos suaves. Um botão principal preenchido por tela, quase sempre quase preto; o secundário é
branco com borda de 1 px; o terciário é texto. Os controles de uma mesma fileira têm a mesma altura.

## 9. Fonte e cor

### 9.1 Fonte

- **Uma grotesca.** Todas as 23 telas usam uma neogrotesca, e 14 usam só essa família. Uma segunda fonte
  sempre tem uma função: uma mono para todo número ou só para os IDs, uma serifada para uma saudação, uma fonte da marca
  restrita ao logotipo ou ao seletor. Nunca três. As marcações dos eixos, as notas dos gráficos e os rótulos ficam na
  fonte de texto mesmo quando os IDs estão numa mono.
- **Fonte de app não é fonte display.** O h1 fica em 18–32 px, e nenhum número chega a 48 px: nos testes, um
  título serifado de 50 px e um saldo de 76 px fizeram uma tela de orçamento parecer uma landing page (o inspetor
  avisa em 34 px e em 48 px).
- **Tamanhos**:

| Papel | Faixa no estudo | Mediana |
| --- | --- | --- |
| Título da página | 14-48 | 24 |
| Valor de KPI | 16-40 | 24 |
| Título do card (500-600) | 14-24 | 16 |
| Corpo, navegação, células | 13-16 | 14 |
| Rótulos, metadados | 11-14 | 12 |
| Marcações dos eixos | 11-16 | 12 |
| Pílulas, selos | 9-14 | 11-12 (piso da casa 11) |

  Uma tela usa de 4 a 9 tamanhos, mediana 6. As escalas mais limpas do estudo são 12/14/18/24, 12/14/16/30
  e 12/14/16/24.
- **Pesos**: mediana de 3 por tela; 10 de 23 nunca passam de 600; o 700 tem uma função por tela
  (o dinheiro, a saudação ou o título).
- **Algarismos**: tabulares em todo número de tabela, de KPI ou de qualquer lugar que se atualiza. Confira que a
  fonte tem mesmo algarismos tabulares: `font-variant-numeric: tabular-nums` tem de mudar a largura dos algarismos;
  se não mudar, pegue outra fonte.
- **Caixa**: só a inicial maiúscula em cerca de 19 de 23; rótulos de conteúdo em caixa-alta só em 4. Tracking (espaço entre letras) 0,
  e negativo só em letra grande (-0,02em em 32 px). Entrelinha de 20 px para texto de 14 px, 24 px para 16 px.
- **Telas escuras** põem o corpo em 13 px em três, e os títulos em 18–20/600 ou 26–28/700.

### 9.2 Cor em telas claras

- **Modelos de fundo**: cards brancos sobre um fundo off-white (10 telas; de #f3f5f7 a #fdfdfd, mediana
  #f9f9f9-#f9fafb); painéis cinza sobre branco (6); uma folha emoldurada (7).
- **A barra lateral nunca é escura nem saturada** (0 de 17): ela acompanha a página, fica 1–3 níveis distante dela
  ou é branca numa página cinza.
- **Linhas em três degraus.** Bordas de card com mediana #eaeaea, a faixa de trabalho #e5e7eb-#ededed (cerca de 1,2:1 sobre
  branco). Fios de linha um degrau mais claros, #efefef-#f4f4f4. Bordas de controle um degrau mais escuras, mediana
  #d1d5db. #cbcecd nos cards fica pesado; #f5f5f5 some.
- **Texto em três níveis.** Principal cerca de #111 (faixa de #000 a um #272446 tingido). Secundário cerca de #606060
  (#3a3b3b-#8e8e8e). O terciário no estudo vai de #969696-#9f9d9b e os placeholders de #9ca3af-#b0b2b6,
  o que dá 2,5–3:1 sobre branco, abaixo do piso da casa. Regra da casa: todo nível que leva palavras
  chega a 4,5:1 sobre a superfície onde está, placeholders incluídos; #6b6b6b é mais ou menos o cinza mais claro
  que se sustenta sobre branco e sobre #f9fafb.
- **Onde vai a cor de destaque**: só nos dados, com o chrome (barras, bordas e controles em volta do conteúdo) em escala de cinza (4 telas), só nas ações (2), ou nenhuma
  cor de destaque (2). O botão principal costuma ser quase preto. Toda tela com mais de uma família de cor de destaque
  é apontada.
- **Status**: os verdes positivos do estudo vão de #16a34a-#40a670, que fica abaixo de 4,5:1 como texto; use um
  verde mais escuro, como #247b50 (5,2:1), para texto, e os pares claros para as pílulas: positivo #dcfae5 com
  #04250e, negativo #ffedea com #831c1e, um aviso #fffbeb com borda #fde68a e texto #92400e, um
  selo de contagem #c4242a-#dc3532.

### 9.3 Cor em telas escuras

- **Fundo**: #000 (3 telas), #111 (2), #171719 (1). Nada de azul-marinho nem de ardósia.
- **Superfícies**, de três jeitos: um degrau mais claro sem borda (#111 sobre #000, painéis aninhados em
  #222-#2a2a2a); o próprio preenchimento do fundo com uma linha de 1 px (#2e2e2e sobre #111); mais escura que o fundo com
  uma sombra suave (uma vez: #131217 sobre #171719 com 0 12px 28px rgba(0,0,0,.2)).
- **Linhas**: linhas estruturais 22–31 níveis acima do fundo (#1a1a1a sobre #000, #2e2e2e sobre #111,
  #222224 sobre #171719); contornos interativos mais claros, #373737-#4c4c4c, para um botão contornado parecer
  clicável sem preenchimento.
- **Texto**: #fff; secundário cerca de #aaa (#82848a-#bbb); terciário cerca de #888. #4c4c4f (cerca de 2:1) é
  apontado. O piso da casa de 4,5:1 vale aqui também. Dois cinzas no máximo, e distantes o bastante para parecerem
  dois: cerca de #b4b4b4 para o texto secundário e #949494 para os metadados (nos testes, #aaaaaa, #969696 e
  #bbbbbb numa tela pareceram um cinza usado de três jeitos).
- **Cor de destaque** só nos dados, ou num único estado selecionado. Navegação ativa pela luminosidade. Ênfase sem
  cor: uma pílula branca invertida, um botão preenchido de cinza (#212121), um contorno.
- **Status** como um matiz sobre um tom escuro dele mesmo: #3fc07a sobre #172a1d; #44a282 sobre #1b2828. **Quando a
  cor de destaque é verde ou verde-amarelada, o `--positive` é a cor de destaque** (um destaque lima: lima sobre um tom
  lima escuro), ou o sinal leva o sentido na tinta neutra; um "+R$ 3,81" verde-menta ao lado de um "Vendido" lima pareceu
  dois verdes. O mesmo vale nas telas claras.
- **Fatia de cor** em 3% ou menos em todas as seis.

### 9.4 Superfícies, raio, ícones, espaçamento

- **Bordas.** Uma borda de 1 px separa as superfícies em 12 das 17 telas claras; três usam só um degrau de preenchimento
  e uma só uma sombra. Borda ou sombra, nunca as duas. As sombras que existem são fracas
  (alfa de 0,06 ou menos em 0 2px 8px; uma vez 0 1px 4px em 0,12). Sombras de verdade são para o que flutua: um menu,
  um popover, um tooltip, um campo de composição.
- **O raio é bimodal**: fechado, 4–8 px (9 telas, mais cards retos em uma), ou suave, 16–24 px (10);
  11–12 px só em 3. Os controles seguem os cards: 6 px com cards fechados, pílulas inteiras com os suaves.
  Raios aninhados descem em degraus (20, 10, 8, 5, 4). O inspetor avisa acima de três raios de painel.
- **Agrupe, não encaixote.** Um conjunto de KPIs é um card dividido por fios divisórios de 1 px, ou uma faixa solta com divisórias
  verticais de 48–52 px.
- **Ícones**: contorno em 22 de 23; ícones de navegação de 14–20 px (mediana 16) com cerca de 1,5 px; ícones no texto de 12–14 px;
  cerca de 10 px até o rótulo; cinza (#454545-#73737f numa navegação clara, branco ou #81858a-#999 no escuro). Nunca
  num círculo saturado (0 de 23). Um contêiner, se houver, é neutro (um disco #f0f0f0) ou codifica um tipo
  de nó num construtor.
- **Espaçamento** numa base de 4 px: vão entre cards de 6–24 px (mediana 16); padding de card de 12–34 px (mediana 20); vão entre seções
  de 24–64 px; altura de controle de 27–40 px (mediana 34).

### 9.5 Tokens padrão

Cada estilo em `library/app.json` traz os seus próprios tokens. Estes são as medianas do estudo para tudo que um
estilo não define, com os cinzas ajustados para passar em 4,5:1.

Os nomes batem com a ficha que o `draw.mjs --app` imprime e com `assets/app.css`, um ponto de partida neutro ajustado para esses
padrões (estrutura, linha do título, painéis, a faixa de KPIs dividida, tabelas, pílulas, controles, abas, estados vazios
e a dobra do celular). `assets/charts.js` desenha os gráficos da §6 em SVG a partir dos seus dados (linha, barras,
colunas divergentes, anel, lista de barras, planejado, bullet, timeline, matriz de cobertura e faixa de horário), com essas
regras embutidas e as cores lidas desses tokens.

```css
:root {
  /* claro */
  --ground: #f9fafb;  --surface: #ffffff;  --raised: #f9f9f9;  --active: #eeeeee;
  --border: #e8e8e8;  --rule: #f2f2f2;     --control: #d1d5db;
  --text: #111111;    --muted: #5f6368;    --faint: #6b6b6b;    /* os placeholders usam --faint */
  --primary: #1d1f20;                      /* preenchimento quase preto, rótulo branco */
  --accent: /* um matiz, cerca de 3% dos pixels: os dados e no máximo um controle */;
  --positive: #247b50;  --pill-positive-bg: #dcfae5;  --pill-positive-ink: #04250e;
  --negative: #c4242a;  --pill-negative-bg: #ffedea;  --pill-negative-ink: #831c1e;
  --pill-warning-bg: #fffbeb;  --pill-warning-ink: #92400e;  /* borda do aviso #fde68a */
  --grid: #e5e5e5;  --chart-span: 0.06;  /* a opacidade de um intervalo sombreado num gráfico */

  --radius-card: 8px;  --radius-control: 6px;  --radius-chip: 4px;  /* estilos suaves: 20 / 14 / 999 */
  --gap: 16px;  --card-pad: 20px;  --pad: 24px;
  --nav-row: 34px;  --control-height: 32px;  --row-height: 48px;
  --font: "Inter", system-ui, sans-serif;                            /* uma grotesca */
  --fs-title: 24px;  --fs-section: 16px;  --fs-kpi: 24px;  --fs-body: 14px;  --fs-small: 12px;
}
:root[data-theme="dark"] {
  --ground: #000000;  --surface: #111111;  --raised: #222222;  --active: #222222;
  --border: #1a1a1a;  --rule: #161616;     --control: #444444;  /* sobre um fundo #111 a borda é #2e2e2e */
  --text: #ffffff;    --muted: #b4b4b4;    --faint: #949494;  /* dois cinzas que se distinguem */
  --primary: #ffffff;                      /* invertido: preenchimento branco, rótulo preto */
  --positive: #3fc07a;  --pill-positive-bg: #172a1d;  --pill-positive-ink: #3fc07a;  /* uma cor de destaque verde substitui estes */
  --negative: #e5566f;  --pill-negative-bg: #2c1a20;  --pill-negative-ink: #e5566f;  /* o #d4405d do estudo, clareado para 4,5:1 */
  --grid: #2b2b2b;  --chart-span: 0.12;
}
.num { font-variant-numeric: tabular-nums; }
td.num, th.num { text-align: right; }
```

## 10. Densidade

- As telas estudadas têm de 6 a cerca de 120 pontos de dados, mediana de cerca de 25.
  - **Esparsa** (6–25): telas iniciais, configurações, um objeto só. Padding de card de 20–24 px, linhas de 56–92 px, corpo de
    14–16 px.
  - **Média** (25–50): visões gerais de análise, telas iniciais de finanças, telas de lista. Linhas de 44–56 px, padding de
    16–24 px.
  - **Densa** (cerca de 120, uma tela): pesquisa e monitoramento, lidos em sessões longas. Corpo de 13 px,
    linhas de lista de 28 px e linhas de tabela de 42 px, emolduradas com respiro generoso: gutters (espaço entre colunas) de 100 px, 64 px entre as faixas,
    32 px de padding nos cards.
- Densidade são três ajustes movidos juntos: intervalo das linhas, padding e tamanho da fonte. Não encolha a fonte
  mantendo o padding.
- **Espaço posto de propósito parece calma; espaço que sobrou parece inacabado.** No estudo, o vazio parece
  intencional quando vem de um grid fixo e de vãos repetidos, e acidental quando vem de um
  grid que não cabe nos dados, de uma coluna vazia em todas as linhas (uma faixa morta de 300 px), de uma barra superior quase
  vazia ou de um card esticado até a altura do vizinho.
- **Projete para os dados que a conta tem, e também para os que vai ter.** Várias telas estudadas
  foram feitas para uma conta movimentada e mostram uma nova: um gráfico de 673x240 para uma linha que fica no zero em
  dois terços do comprimento. Mantenha o desenho honesto, mas dimensione o bloco pela pergunta, não pelos
  dados que o produto espera ter.

## 11. Estados vazio, zerado, de carregamento e de erro

- **Um zero de verdade** é impresso no estilo normal: "R$ 0", "0", "0%", "0,00%", "0% (0)" (10 telas). Um
  zero pode ser esmaecido para cinza quando a legenda ao lado vira o próximo passo ("R$ 0,00", e depois
  "Automatize suas economias com até 3,50% ao ano").
- **Ausente ou não se aplica** é um traço cinza: um travessão, um "-", uma marca de 6x2 px. Nunca um traço no tamanho cheio
  do valor: "--" com 24 px parece carregando (apontado).
- **As contagens seguem a visualização, e a moldura também.** As contagens mostradas no escopo (abas, blocos de KPI, "12
  abertos") são calculadas a partir das linhas da visualização ou do filtro atual e recalculadas a cada troca. Um
  bloco filtrado encolhe até as suas linhas e o vizinho de fileira se alinha pelo topo, ou o bloco mantém um número fixo
  de linhas com uma frase de estado vazio; a sublinha de cada visualização é calculada para ela.
- **Um card lateral vazio se preenche com os dados de referência**, não com uma caixa tracejada em 400 px de branco: antes
  de qualquer coisa esgotar, os horários de esgotamento do domingo passado como uma lista discreta embaixo de "Nada esgotou ainda
  hoje".
- **Vermelho é sinal, não textura**: no máximo uma marca vermelha por objeto, no fato atrasado ou com falha;
  treze textos vermelhos num quadro parecem ruído, e uma lista de negócios que pedem atenção não
  repete as mesmas marcações do quadro ao lado.
- **Uma seção vazia mantém a moldura e o cabeçalho** e ganha uma frase que ocupa o bloco inteiro (num
  grid de linhas, `grid-column: 1 / -1`; uma mensagem espremida numa coluna de 34 px quebrou palavra por palavra nos
  testes): uma caixa tracejada de 1 px, raio
  8, com cerca de 38 px de altura ("Nenhum uso de canal neste período."), ou uma caixa com borda e um link de adicionar
  ("+ Conta de passivo"). Num construtor, um espaço vazio é uma caixa tracejada de 1 px na cor da área de conteúdo.
- **Um gráfico vazio é desenhado**: a linha do zero, barras ausentes para os períodos vazios, sem intervalo inflado, sem
  imagem.
- **Primeiro uso** (a tela inteira vazia): mantenha a moldura e o título, e ponha a primeira ação onde
  os dados vão aparecer, com o progresso da configuração na porcentagem real se houver passos (uma tela
  mostra "Conclua sua configuração" em 67%; outra, uma faixa de primeiros passos de quatro células acima das tabelas).
- **Carregamento** (regra da casa; não está no estudo): o layout final com cada valor trocado por uma barra cinza chapada
  no tamanho real (um valor de 24 px ganha uma barra de 24 px de altura; as linhas mantêm o intervalo), rótulos e cabeçalhos
  mostrados de uma vez, sem gradiente de brilho e sem o layout mudar quando os dados chegam. Uma atualização de
  dados já na tela mantém os valores antigos e atualiza o carimbo de atualização.
- **Erro** (regra da casa; não está no estudo): dentro do bloco que falhou, nunca como um
  aviso de tela inteira. Uma frase dizendo o que falhou e quando os dados estavam bons pela última vez ("Não foi possível carregar
  os deploys. Última atualização às 09:14."), e um botão de texto Tentar de novo. A cor negativa só num ícone pequeno
  ou no par da pílula.
- **Dados desatualizados ou estáticos**: um carimbo de atualização com um botão de atualizar (6 telas). Um retrato fixo que
  não pode ser atualizado diz isso num aviso discreto (uma vez: #fffbeb, uma borda #fde68a de 1 px, texto #92400e de 12 px).
  Um tom de aviso nunca é fundo; o inspetor lê um fundo âmbar claro como creme.
- **Limites e uso**: uma barra na proporção real com as duas pontas rotuladas ("12,7 mil de 20,0 mil").

## 12. O celular

O estudo não tem telas de celular. Esta seção é regra da casa, montada a partir das regras de celular da skill
(`layout.md` §9) e do que as telas de desktop sugerem. O inspetor reprova uma barra lateral que ainda
ocupa mais de 30% da largura do celular.

- **A navegação se recolhe.** A barra lateral vira uma barra superior de 48 px com o nome da tela, um botão de menu que
  abre uma folha de tela inteira (navegação, seletor de workspace, conta) e no máximo uma ação; ou uma barra
  inferior de quatro ou cinco destinos com rótulos curtos. Uma coluna de ícones vira essa barra inferior.
- **Margens** de 16–20 px; áreas de toque com pelo menos 44 px de altura; dados e rótulos em 14 px, sublinhas não menores
  que 12 px.
- **O título fica**, com 20–24 px. As ações do cabeçalho vão para um kebab, menos a principal.
- **Filtros** se recolhem numa fileira de chips ou numa folha de Filtros; as abas rolam para o lado dentro da própria
  fileira, nunca a página. A primeira linha da lista começa nos 60% de cima da tela do celular: três fileiras de
  controles de filtro acima dela empurraram a lista para fora da primeira dobra nos testes.
- **KPIs**: um contêiner dividido vira um grid de 2 colunas, ou uma lista com o rótulo à esquerda e o
  valor à direita. Nunca quatro colunas espremidas. Num grid de 2 colunas, a contagem depois de qualquer item principal de largura total
  é par; senão, use três colunas estreitas ou uma lista dividida, ou deixe a última célula ocupar a
  largura toda (o `app.css` faz isso para uma contagem ímpar). Um "Vendido 3,18 kWh" sozinho ao lado de meia fileira vazia
  foi apontado.
- **No máximo uma fileira de controles acima de um gráfico**: um seletor de escritório e uma troca de semana dividem uma fileira.
  Dois controles segmentados de largura total empilhados empurraram os dados para baixo nos testes.
- **Gráficos** vão na largura total, com 160–200 px de altura, 3–4 rótulos no x e uma legenda de pontos acima, posta num
  grid de 2 colunas (ou atrás de um "Legenda" recolhível) quando ela quebraria em três linhas. As marcações do y mantêm
  a sua própria faixa à esquerda (ou vão para a borda direita); um rótulo de marcação nunca fica em cima da linha.
- **Ações da linha no celular** são ações em texto ou um botão compacto no fim, com uma ação em lote preenchida
  para a lista ("Aprovar os 3 que cabem"); cinco blocos cinza de Aprovar de 44 px transformaram uma lista numa pilha
  de botões.
- **Quando uma faixa se recolhe, tire o item menos importante para a ação principal da tela**, não o último
  na ordem do código: o preço ao vivo fica numa tela de energia cujo plano depende dele.
- **Tabelas viram listas de linhas de duas linhas abaixo de cerca de 640 px**: a identificação e o número principal na linha
  1, os outros campos que o briefing cita em cinza de 13 px na linha 2 ("fra1 · 1m 38s"), a única ação à
  direita. Os campos vão para a linha 2; nunca são tirados. Uma tabela que precisa continuar tabela rola dentro da
  própria moldura com a primeira coluna fixa; a página nunca rola para o lado.
- **O tablet (641–1.100 px) é uma faixa própria**: a barra lateral se recolhe na barra superior, mas as tabelas mantêm quatro
  ou cinco colunas com os campos secundários como sublinhas, dois painéis estreitos empilham assim que um deles ficaria
  abaixo de cerca de 340 px, e a coluna de identificação nunca é a cortada enquanto outra tem espaço.
- **Blocos que levam uma ação sobem, não descem**: uma coluna da direita com uma ação (estoque baixo e o seu
  Repor, contas a vencer e Pagar) vira uma linha de resumo acima da lista ("5 itens em falta · Revisar"),
  nunca um bloco embaixo de vinte pedidos.
- **Vários painéis** (uma lista e o seu detalhe, uma caixa de entrada): uma região de cada vez. Escolher uma linha abre o
  detalhe; voltar retorna à lista na mesma posição de rolagem.
- **Configurações**: a coluna de rótulo empilha acima do seu painel.
- **Uma coluna da direita** vai para baixo da coluna principal ou para uma aba.
- **Construtores** mostram o trabalho só para leitura, com a paleta numa folha inferior se a edição continuar.
- Confira 390 px nas capturas do inspetor a cada rodada.

## 13. Regras da casa para telas de app

As regras da casa no `SKILL.pt-BR.md` foram escritas para páginas lidas uma vez. Uma tela de app é lida todo
dia, e parte do que essas regras proíbem é a estrutura de uma tela de trabalho. Estas se afrouxam, com limites:

| Permitido em telas de app | Limite |
| --- | --- |
| **Bordas de 1 px** em cards, painéis, tabelas e controles | Cerca de 1,1–1,3:1 contra o fundo no claro (#e5e7eb-#ededed sobre branco); #1a1a1a sobre #000, #2e2e2e sobre #111. Controles um degrau mais fortes. Borda ou sombra, nunca as duas. |
| **Fios de linha** em tabelas e listas | 1 px, 3–7% mais escuros que a superfície. Sem zebra, sem faixa no cabeçalho. |
| **Linhas tracejadas** | Só nas grades dos gráficos e nos espaços vazios. |
| **Rótulos pequenos** acima dos valores | 12–14 px, só a inicial maiúscula, cinza a 4,5:1. Metadados e texto dos eixos de 11–12 px. Nada abaixo de 11 px. No máximo um rótulo em caixa-alta espaçada por tela (o rótulo de contexto de um seletor). |
| **Fileiras de cards idênticos** | Só para métricas ou objetos do mesmo nível: 3–6 por fileira, larguras iguais, um vão, nenhum órfão, bordas alinhadas entre as fileiras, nenhum ícone em cima. Prefira um card dividido; larguras variadas ganham de um grid uniforme. |
| **Fonte mono** | IDs, chaves e código; ou todo número, como decisão de um estilo. Fora isso, algarismos tabulares na fonte de texto. |
| **Pílulas** | Só dentro de linhas e ao lado de um valor: 16–24 px de altura, um tom claro com texto escuro do mesmo matiz. Nunca acima de um título. |
| **Números de índice** | Só como dado: uma posição ("1."), um número de nó. |
| **Ícones** | De contorno, 14–20 px, um conjunto só, cinza: na navegação, antes de um rótulo ou como único sinal de ação (kebab, seta, info). Contêiner só se for neutro, ou blocos de tipo de nó num construtor (passe `--allow icon-chips` e dê o motivo no relatório). |
| **Sombras** | No que flutua: um menu, um popover, um tooltip, um campo de composição, um diálogo. Um card parado ganha no máximo um desfoque pequeno com menos de 8% de preto. |
| **Uma segunda fonte** | Com uma função: uma mono para IDs ou números, uma serifada para uma saudação. |
| **Um gradiente** | Só como fade de área embaixo de um gráfico de linha; um tom chapado de cerca de 14% é mais seguro. |

Continuam proibidos, como nas páginas, e checados:

| Proibido | No lugar |
| --- | --- |
| Gradientes em fundos, botões, cards, texto e blocos de KPI (os dois botões com gradiente do estudo foram apontados) | Preenchimentos chapados |
| Brilhos, vidro, desfoque de fundo | Superfícies opacas a um degrau de tom do fundo |
| Um ícone num círculo colorido ou num quadrado tingido em todo KPI ou card (0 de 23) | Um rótulo e um número |
| Gráficos arco-íris: mais de quatro matizes, um matiz por barra, um assunto em dois matizes | Um matiz por gráfico, neutros para o resto |
| Sparklines nos KPIs (0 de 23) | A tendência no seu próprio gráfico, ou em lugar nenhum |
| Emoji em saudações, rótulos, navegação ou estados vazios | Palavras |
| Lorem ipsum, Acme, John Doe, "Usuário 1"; números de vaidade ("10.000+ equipes"); totais que não fecham | Dados de exemplo críveis calculados a partir das linhas, listados no relatório |
| Cor de status numa variação zero ou indefinida | Cinza, ou a variação em palavras ("+4 (novo)") |
| Uma barra lateral escura ou saturada numa tela clara; um tema escuro azul-marinho ou ardósia | O fundo da página na barra lateral; escuros neutros de verdade |
| A cor de destaque no chrome: uma linha da navegação tingida com barra à esquerda, pílulas de aba coloridas, a cor da marca em todo botão | A cor de destaque nos dados e no máximo num controle; um principal quase preto |
| Cabeçalhos de tabela em caixa-alta espaçada, linhas zebradas, faixas no cabeçalho | Cabeçalhos cinza de 12 px, só com a inicial maiúscula; fios ou espaço |
| Números alinhados à esquerda, algarismos proporcionais em colunas | Algarismos tabulares alinhados à direita |
| Um cabeçalho de hero, uma saudação com emoji, um banner de boas-vindas ilustrado | Um título-substantivo de 24 px |
| Paginação embaixo de uma lista de visão geral de cinco linhas | Linhas limitadas, "Ver todos", o total |
| Cores de destaque violeta e índigo; creme com terracota | A paleta do estilo sorteado |
| Um título de landing page (acima de 32 px) ou um número de 48 px ou mais | Um título de 18–32 px; números de 16–40 px |
| Ícones em caixas repetidos lista abaixo ou em cima de todo card do mesmo nível, tingidos ou neutros | Um ícone simples de 16 px onde ajuda, ou nenhum |
| Cada linha num matiz diferente, um valor "restante" em verde em toda linha do orçamento | Cinza para o que está bem; cor só nas linhas em risco ou estouradas |
| Uma tela que não diz o nome de produto nenhum e não oferece ação nenhuma | O símbolo do produto e o escopo na estrutura; a função principal a um clique |

**Sobre violeta e índigo.** 10 das 23 telas estudadas usam violeta ou índigo, sempre como matiz de dados ou num
único controle. A proibição é gosto do autor, não uma conclusão do estudo: a biblioteca sorteia outros
matizes para os estilos que vieram dessas telas, e a checagem de paleta do inspetor continua ligada.

## 14. Cacoetes de dashboards gerados

Cada linha põe um hábito dos dashboards gerados contra o que as 23 telas fazem no lugar.

| Cacoete | O que entra no lugar |
| --- | --- |
| Uma barra lateral azul-marinho escura ou tingida, com pílula ativa colorida e barra à esquerda | A barra lateral no fundo da página; uma pílula cinza neutra, ou o rótulo clareando no escuro. Uma barra à esquerda aparece uma vez em 23. |
| "Bem-vindo de volta, Lucas" com uma mãozinha acenando e um subtítulo | Um título-substantivo em 24/600. Três telas cumprimentam; o único emoji sai. |
| Quatro cards de KPI, cada um com um ícone num círculo tingido | Um contêiner dividido por fios finíssimos, rótulo sobre valor. Nenhum ícone em nenhuma das 23. |
| Uma pílula verde "+12,5%" em todo KPI | Uma variação em 9 de 20 telas, em palavras com o período; cinza para o zero; "+4 (novo)" a partir do zero. |
| Uma sparkline em todo KPI | Nenhuma em nenhuma das 23. A tendência tem o seu próprio gráfico. |
| Valores de KPI de 36–48 px, em negrito, na cor da marca | 24–30 px em 400–600 na tinta; nada em 48. |
| Um gráfico de área com gradiente, spline suavizada e um ponto em cada valor | Uma linha reta de 2 px, sem preenchimento em 7 de 10, sem marcadores. |
| Uma paleta arco-íris, um matiz por barra ou por gráfico | Um matiz por gráfico; a cor de destaque só nos dados; quatro matizes no máximo numa tela. |
| Linhas de grade a cada 20 px, linhas de eixo dos dois lados, legenda para uma série só | 3–5 linhas fracas, sem linha do eixo y, sem legenda para uma série só; marcações redondas acima do máximo. |
| Uma rosca grossa com rótulos nas fatias e um total grande no buraco | Um anel fino, sem rótulos nas fatias, a legenda como tabela com os valores. |
| Cards com raio de 16–24 px, borda de 1 px e uma sombra suave grande | Uma borda ou um degrau de tom, sem sombra; um raio fechado ou suave, escolhido uma vez. |
| Uma tabela zebrada sob cabeçalhos em caixa-alta espaçada, com checkbox, avatar, chip de status e kebab em toda linha | Fios e alinhamento: cabeçalhos cinza de 12 px, uma marca de status, uma ação onde ela é necessária. |
| Números alinhados à esquerda em algarismos proporcionais | Algarismos tabulares alinhados à direita, casas decimais fixas, unidades em cinza. |
| Chips de status saturados com texto branco | Tons claros com texto escuro do mesmo matiz. |
| A cor de destaque em todo botão, aba e link | Nenhum principal preenchido em 12 de 23; quase preto onde há um. |
| Uma barra superior com busca, sininho e avatar em toda tela, ou uma deixada quase vazia | Nenhuma barra superior em 9 de 23; quando há, ela leva a busca, o seletor ou o nome do objeto. |
| Exportar, Compartilhar e um seletor de data amontoados junto ao título | Ações só quando são de verdade; um carimbo de atualização no lugar. |
| Pessoas e empresas de placeholder, totais de vaidade redondos, crescimento numa conta de uma semana | Os dados do próprio produto, números pequenos no tamanho real, totais somados das linhas. |
| Paginação embaixo de uma lista curta | Linhas limitadas e "Ver todos". |
| Um grid igual de quatro, sejam quais forem os dados, com células órfãs e cards esticados | Um número de colunas escolhido pela quantidade de itens; larguras que mudam por fileira e caem nas mesmas linhas. |
| Neon no escuro, bordas brilhantes, vidro | Escuros neutros de verdade, degraus de luminosidade, cor nos dados. |
| A cara do próprio kit: Geist ou Inter sobre #f8f8f8 com cards brancos de 12 px e nenhum matiz nos dados, ou lima sobre preto | Uma fonte tirada do briefing (um fundo do mundo do produto, uma fonte de números com personalidade, o matiz da marca no principal elemento de dados) e um elemento que só este produto tem. |
| Um ícone colorido por categoria numa lista | Um conjunto de ícones cinza; a cor, se houver, nos números. |
| Uma ilustração e "Ainda não há dados" num gráfico vazio | A linha do zero desenhada e uma frase na moldura. |

Uma tela com todos os cacoetes tirados e nada posto no lugar é um template arrumado. O que preenche o
espaço é o produto: os seus próprios dados no tamanho real, a única pergunta da tela respondida pelo seu
maior bloco, e um grid cujas somas fecham.
