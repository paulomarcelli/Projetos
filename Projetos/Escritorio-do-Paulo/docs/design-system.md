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
| Figurinha | Agente (8) | mapa e gaveta |

## Ambiente e personagens

- **Mapa** (`web/js/mapa.js`): cenário em pixel art desenhado por código, 336 × 176 pixels ampliados sem
  suavização. Sala da equipe (duas fileiras de quatro mesas), copa e sala de reunião.
- **Figurinhas** (`web/js/avatares.js`): desenhos originais em SVG, no estilo de figurinha (cabeça grande, olhos
  grandes, contorno branco), inspirados nos heróis de cada agente; a Sofia tem identidade própria, de designer.
  As figurinhas do Paulo (sete heróis da folha dele e a Sofia, feita no mesmo estilo) substituem os desenhos quando
  estão em `web/avatares/pessoais/<id>.png` (pasta fora do git; instale com `bin/escritorio.mjs figurinhas <zip>`).
  No Figma, o componente Figurinha já usa essas imagens.
- **Lugar e passeio**: cada agente tem a sua mesa. Quem está disponível (ou acabou de concluir) passeia por uma rede de
  caminhos: café e geladeira na copa, tapete, quadro e janela da sala de reunião, plantas, e a mesa de um colega para
  conversar; volta para a própria mesa de vez em quando. Ao concluir uma tarefa, leva a entrega até o lado da mesa de
  quem continua o trabalho. Quando uma execução começa, volta andando rápido para a mesa e fica lá. O Steve vai para a
  sala de reunião enquanto monta um plano. A copa é a casa de quem não tem mesa (do nono agente em diante).

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
- Clique no crachá ou na figurinha abre a gaveta do agente; Esc fecha.
- Pedido → plano do Steve → tarefas; a regra do Design System prende o front-end na tarefa da Sofia.
- "Executar projeto" faz cada tarefa começar quando as anteriores terminam; "Pausar" devolve à fila.
- Erro não some sozinho: fica até "Marcar como visto" ou "Tentar de novo".

## O que falta

- Protótipo navegável no Figma (as telas estão como capturas da implementação).
- Variante clara do tema, se um dia for pedida.
