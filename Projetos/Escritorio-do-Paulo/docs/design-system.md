# Design System · Escritório do Paulo

**Figma:** [Escritório do Paulo — Design System](https://www.figma.com/design/JFyZCMHbS1ASDzSdbGu6pC)
(páginas Capa, Fundamentos, Componentes, Ambiente e personagens, Telas). Feito pela Sofia, a designer da equipe.

No código, os tokens estão em [`web/css/tokens.css`](../web/css/tokens.css), com os **mesmos nomes** das variáveis do
Figma (`cor/fundo` no Figma é `--cor-fundo` no CSS). Quem mexer na interface usa estes tokens e componentes; o que faltar
é pedido à Sofia e entra aqui antes de ir para o código.

## A ideia

O escritório é escuro e calmo; a cor mora nos **estados dos agentes**, nunca no entorno. O mapa é a exceção clara: um
escritório visto de cima, em pixel art, com as figurinhas da equipe por cima. Quem está livre passeia; quem tem uma
execução real está na mesa, trabalhando. Ninguém finge trabalho.

## Tokens

### Cor (coleção `Cor`, modo Escuro)

| Variável | Valor | Uso |
|---|---|---|
| `cor/fundo` | `#0a0d13` | fundo da página |
| `cor/piso` | `#0d1119` | chão do escritório (área do mapa) |
| `cor/superficie` | `#121824` | painéis, cartões, mesa de projeto |
| `cor/elevada` | `#19202e` | diálogos e itens em foco |
| `cor/borda` | `#263043` | contorno de painel e de controle |
| `cor/fio` | `#1a2231` | divisória dentro de um painel |
| `cor/texto` | `#e9edf5` | texto principal |
| `cor/texto-2` | `#9aa5b8` | texto de apoio |
| `cor/texto-3` | `#66718a` | rótulos e horários |
| `cor/acao` | `#e9edf5` | o único botão principal |
| `cor/acao-texto` | `#0a0d13` | texto do botão principal |
| `cor/marca` | `#e23636` | só no símbolo do produto |

### Estado (coleção `Estado`)

| Variável | Valor | Quando |
|---|---|---|
| `estado/disponivel` | `#7f8a9c` | sem execução |
| `estado/trabalhando` | `#4c9aff` | editando, escrevendo, rodando comandos, no Figma |
| `estado/pensando` | `#b39dff` | entre um passo e outro |
| `estado/pesquisando` | `#35c9c0` | lendo arquivos, buscando na internet, consultando skills |
| `estado/aguardando` | `#f2b544` | espera a tarefa de outro agente, ou passou trabalho para outro |
| `estado/revisao` | `#ff8f5a` | tarefa de revisão em execução |
| `estado/concluido` | `#4cc38a` | entregou a última tarefa (até ser visto ou passar 10 min) |
| `estado/erro` | `#ff5d5d` | a última execução falhou (até ser visto ou repetido) |

Todo estado tem **cor, ícone e rótulo**. A cor nunca fala sozinha.

### Medida (coleção `Medida`)

`espaco/1…6` = 4, 8, 12, 16, 24, 32 · `raio/controle` 6 · `raio/cartao` 8 · `raio/estacao` 10 ·
`altura/controle` 32 · `altura/topo` 52.

### Tipografia (estilos de texto)

| Estilo | Fonte | Uso |
|---|---|---|
| Título | Barlow Condensed Bold 26, caixa alta | nome do projeto, títulos de diálogo |
| Nome | Barlow Condensed Bold 22, caixa alta | nome do agente |
| Número | Barlow Condensed Bold 30 | números da parede e do desempenho |
| Seção | Geist SemiBold 16 | títulos de bloco |
| Corpo | Geist Regular 14 | texto |
| Pequeno | Geist Regular 12 | linhas de apoio |
| Rótulo | Geist Regular 11 | rótulos |
| Mono | Geist Mono Regular 12 | ids (T-0001), horários, custos |

As fontes ficam em `web/fontes/` (licença OFL) para o escritório funcionar sem internet.

## Componentes

| Componente | Variantes | Onde |
|---|---|---|
| Botão | Tipo (Principal, Contorno, Perigo) × Tamanho (Normal, Pequeno) | topo, diálogos, listas |
| Chip de estado | Estado (8) | gaveta do agente, detalhe da tarefa |
| Crachá | Estado (8) | sobre a cabeça de cada figurinha no mapa; é o botão que abre a gaveta |
| Tarefa | Situação (Andamento, Aguardando, Pronta, Concluída, Erro) | lista lateral |
| Nó da mesa | Situação (5) | mesa de projeto, em colunas de dependência |
| Marco | — | números do dia na parede |
| Personagem | Agente (3) | mapa (sprite) e gaveta (retrato) |

## Ambiente e personagens

- **Mapa** (`web/js/mapa.js`): cenário em pixel art desenhado por código, 480 × 272 pixels ampliados sem suavização,
  visto de cima. Seis salas e um jardim: **equipe** (duas fileiras de quatro mesas), **lounge** (sofá, estante, tapete,
  luminária), **reunião** (mesa com seis cadeiras e quadro), **jogos** (pingue-pongue, TV com videogame e pufes,
  fliperama), **estúdio** (quatro mesas e mural) e **copa** (máquina de café, pia, geladeira, bebedouro, mesa redonda);
  à direita, o **jardim** com árvores, banco, canteiro e laguinho.
- **Personagens** (`web/js/sprites.js`): sprites de 12 × 20 pixels com contorno de 1 pixel, quatro direções (frente,
  costas, lado e lado espelhado), dois passos de caminhada e pose sentada. Cada agente tem o visual do retrato dela:
  - **Sofia**: cabelo castanho-escuro comprido, vestido preto de alça;
  - **Karol**: loira-mel de cabelo comprido, blusa cinza com flor laranja, jaqueta verde, short coral e bota amarela;
  - **Sabrina**: loira clara de cabelo comprido com franja e laço preto, blusa preta.
  Nenhuma é ruiva: as cores de cabelo seguem as ilustrações. Agente sem visual próprio ganha um visual padrão.
- **Retratos**: na gaveta aparece o retrato animado da agente quando está em `web/avatares/pessoais/<id>.webp` (pasta
  fora do git; instale com `bin/escritorio.mjs figurinhas <zip>`). Sem ele, a gaveta mostra o sprite ampliado.
- **Lugar e diversão**: cada agente tem a sua mesa. Quem está disponível (ou acabou de concluir) vai se divertir pelo
  caminho mais curto: pingue-pongue em dupla (com a bolinha indo e voltando), videogame no pufe, fliperama, leitura no
  sofá, café na copa, água no bebedouro, passeio e banco no jardim, regar o canteiro. Cada atividade tem lugar, pose,
  direção, ícone no balão e duração. Ao concluir uma tarefa, leva a entrega até o lado da mesa de quem continua. Quando
  uma execução começa, larga o que estava fazendo e volta rápido para a mesa. A coordenadora (Sabrina) vai para a sala
  de reunião enquanto monta um plano.

## Animações

| Estado | Movimento | Tempo |
|---|---|---|
| Disponível | passeia devagar pelo escritório; parado, respira; balão do que está fazendo (café, conversa…) | 3,2 s |
| Trabalhando | balança como quem digita; monitor aceso | 0,5 s |
| Pensando | inclina devagar; balão com três pontos | 2,6 s |
| Pesquisando | olha de um lado para o outro; lupa no balão | 1,8 s |
| Aguardando | respira; ampulheta vira; fio tracejado até quem ele espera | 3,6 s |
| Em revisão | como trabalhando, com o balão de revisão | 0,5 s |
| Concluído | dois pulinhos ao terminar | 0,6 s × 2 |
| Com erro | treme duas vezes ao falhar | 0,4 s × 2 |
| Andando | passo saltitado e vira para o lado em que anda; devagar quando passeia, rápido quando vai trabalhar | 0,42 s |
| Levando entrega | anda até o lado da mesa de quem continua, com o balão de documento, e espera um pouco | 2,6 s parado |

Curva `cubic-bezier(.2, .8, .2, 1)`. Anima só `transform` e `opacity`. Com "reduzir movimento", nada se mexe e o estado
continua legível.

## Padrões de interação

- Uma ação principal por tela: **Novo pedido**.
- Clique no crachá ou na personagem abre a gaveta do agente; Esc fecha.
- Pedido → plano da Sabrina → tarefas; a regra do Design System prende o front-end na tarefa da Sofia.
- "Executar projeto" faz cada tarefa começar quando as anteriores terminam; "Pausar" devolve à fila.
- Erro não some sozinho: fica até "Marcar como visto" ou "Tentar de novo".

## O que falta

- Protótipo navegável no Figma (as telas estão como capturas da implementação).
- Variante clara do tema, se um dia for pedida.
