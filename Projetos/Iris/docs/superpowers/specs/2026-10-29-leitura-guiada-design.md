# Leitura guiada: o universo geopolítico de uma investigação, revelado com o scroll

Data: 29 out. 2026 · Status: aguardando aprovação · Escopo: só frontend (`frontend/`)

## Intenção

A IRIS já mostra uma investigação em três áreas: Análise, Mapa de relações e Timeline. Cada
área é boa sozinha, mas quem lê precisa montar na cabeça como elas se ligam. A **Leitura guiada**
é um quarto modo de leitura da MESMA investigação. A pessoa rola um texto, e um palco fixo ao lado
mostra as camadas (mapa, relações, linha do tempo, incertezas, cenários e evidências) reagindo ao
trecho que está na tela. O objetivo é entender a situação de ponta a ponta, em poucos minutos, sem
abrir e fechar painéis.

Duas premissas guiam o desenho (lembradas pela pessoa):
- **A IRIS analisa Relações Internacionais.** O presente é lido com as categorias da área: níveis
  de análise, atores estatais e não estatais, interesses e capacidades, relações de poder por tipo
  e por dimensão, alinhamentos e blocos.
- **A IRIS é uma IA prospectiva.** O destino da leitura são os futuros. O presente só importa como
  ponto de partida: forças motrizes, incertezas críticas, cenários, trajetórias até o horizonte,
  sinais de alerta e implicações. O palco mostra isso o tempo todo numa régua do tempo em que o
  cursor sai do passado, cruza o HOJE e entra no cone de incerteza.
- Como é uma IA, cada afirmação mostra o seu tipo (fato, evidência, inferência, hipótese, cenário)
  com os marcadores que já existem, e o fecho diz que métodos prospectivos foram aplicados e quais
  não foram (`metodos`).

Decidido pela pessoa:
- adaptar a IRIS existente (não fazer uma demo separada nem trocar telas);
- o universo mora **dentro da investigação**, como um novo modo de leitura; a análise atual fica;
- abordagem **A**: palco fixo, montado com as peças de visualização que já existem.

## Objetivos

1. Um modo "Leitura guiada" em `/app/investigacoes/:id?area=leitura`, ao lado das três áreas.
2. Um roteiro de leitura montado SÓ com campos do resultado (`ResultadoDeInvestigacao`).
3. Um palco fixo que muda de camada e de foco conforme o passo que está na tela.
4. Estado compartilhado: o que o palco destaca e o que a pessoa seleciona são o mesmo estado das
   outras áreas (`vista`, `selecao`). Escolher um ator no palco abre o painel contextual. Ao trocar
   de aba, o cenário em foco continua o mesmo.
5. Movimento discreto (só `transform` e `opacity`); respeito a "reduzir movimento"; teclado completo.
6. Desktop, tablet e celular sem rolagem horizontal; no celular, a lista de relações continua sendo
   a alternativa ao mapa.

## Não objetivos

- Nenhum dado novo. Não se inventam vínculos, datas, confiança de extração nem probabilidades. O
  modelo de dados não tem "confiança" nem "data de observação" por relação. Por isso a leitura
  mostra a natureza da informação que existe (observada / inferida / hipótese), e não um número.
- Não substitui nem altera a área Análise, o Mapa ou a Timeline.
- Nenhuma mudança no backend. Fora da prévia não existe investigação, e a página mostra o mesmo
  estado vazio de hoje.
- Nenhuma biblioteca nova (nada de GSAP, Lenis, three.js, d3).

## Antiobjetivos (fracasso mesmo que funcione)

- Cenário decorativo que "parece geopolítico" sem corresponder aos dados.
- Scroll que prende a pessoa (scroll-jacking), que salta sozinho ou que obriga a ver tudo em ordem.
- Texto ou gráfico ilegível durante uma transição; letras cortadas em repouso.
- Um destaque no palco que sugira causalidade onde há só uma relação registrada.

## Restrições

- Stack existente: React 19, TypeScript, Tailwind 4 (tokens em `styles/index.css`), react-router.
  A Motion NÃO entra neste trecho (a plataforma anima com CSS; ver `App.tsx`).
- Reaproveitar e não duplicar:
  - `relacoes/apoioDoMapa.ts` (curvas, estilos, `useTransicao`), `relacoes/Territorios.tsx`,
    `relacoes/Gramatica.tsx` e `geo/mundo.ts` (projeção);
  - `investigacao/contexto.tsx` (estado, índices, `relacaoNaVista`, `ix.ondeSeUsa`);
  - `investigacao/pecas.tsx` (`Letra`, `GlifoTempo`, `Citacoes`, `LinhaAfirmacao`, `ChipAtor`);
  - `PainelContextual`;
  - a matriz das incertezas de `cenarios/ComparacaoDeCenarios.tsx`, que hoje é interna e passa a
    ser exportada.
- Arquivos pequenos, no padrão da pasta (`components/leitura/`).
- Testes existentes continuam passando; build normal e build da prévia continuam funcionando.

## Abordagens consideradas

| | Como | Troca |
|---|---|---|
| **A (escolhida)** | Texto à esquerda, palco fixo à direita, montado com as peças existentes; o passo ativo define o foco | Pede um modo "palco" do mapa (só leitura); reaproveita o resto |
| B | Uma cena 3D nova (como a abertura orbital) com mapa, rede e tempo numa composição única | A mais vistosa, mas duplica mapa e rede e é a de maior risco de virar decoração |
| C | Seções com visualizações pequenas embutidas, sem palco fixo | A mais simples; perde o universo coordenado. Vira a forma do celular, não a do desktop |

## Como funciona

### Entrada

- Nova aba "Leitura guiada" na barra de áreas (`ABAS` em `contexto.tsx`, id `leitura`), por último,
  para não mudar a área de entrada (a Análise continua sendo a primeira).
- Na Análise, um link discreto no índice "Nesta análise": "Ler como percurso".
- O cabeçalho fica compacto, como no mapa e na timeline. A página fica "ampla" (`data-largura`).

### O roteiro (passos), só com dados do resultado

Cada passo é um bloco de texto que carrega um **foco** (atores, relações, eventos, vista, camada e
posição do cursor na régua do tempo). O texto vem dos campos indicados e a interface não o
reescreve. O roteiro tem duas partes e um fecho.

**Parte I · O sistema hoje (leitura de R.I.)**: o cursor da régua fica no passado e no HOJE.

| # | Passo | Texto (campos) | Palco |
|---|---|---|---|
| 1 | A questão internacional | `pergunta`, `natureza`, `avisoDeContexto`, `escopo`, `horizonte` | Mapa geral, vista Hoje; a régua mostra o horizonte e o cone ainda apagado |
| 2 | Níveis de análise | atores agrupados por `grupo`: multilateral → regional (Américas, Europa, Ásia) → doméstico | O palco "aproxima" de um nível para o outro (enquadramento por transform), acendendo os atores daquele nível |
| 3 | Atores | Estados (`tipo = estado`) e atores não estatais (organizações, instituições, grupos), com `papel` e `caracteristicas` (interesses e capacidades, com citações) | Foco no ator e nos seus vizinhos (mesma regra de foco do mapa) |
| 4 | Relações de poder | relações agrupadas por `tipo` (cooperação, competição, conflito, dependência, influência, fluxo) e por `tema` (política, economia, segurança, diplomacia, instituições), com o estado observado (`presente`) e a natureza (observada, inferida, hipótese) | Acende uma família de relações por subpasso, com a legenda viva |
| 5 | Alinhamentos e blocos | `blocos` na vista Hoje (membros, estado) | Territórios dos membros (hachura que já existe) |
| 6 | A trajetória até aqui | eventos `observado` de `linhaDoTempo`, um subpasso por evento | Cursor da régua na data do evento; o mapa destaca `evento.atores` e `evento.relacoes` |

**Parte II · Os futuros (prospectiva)**: o cursor cruza o HOJE e o cone de incerteza se abre.

| # | Passo | Texto (campos) | Palco |
|---|---|---|---|
| 7 | Forças motrizes | `variaveis` (estado atual, por que importa, direção em cada cenário) e `mecanismos` dos cenários | Destaca atores e relações que citam as MESMAS evidências do estado atual (`ix.ondeSeUsa`); sem vínculo, o palco diz isso |
| 8 | Incertezas críticas | `incertezas` (pergunta, polos, por quê) | Camada "matriz": as duas incertezas como eixos, com A, B e C nos quadrantes (`posicao`) |
| 9 | Três futuros | um subpasso por cenário: `arquetipo`, `ideia`, `sintese`, `premissas`, `gatilhos`, `condicoes` | Define `vista` = A, B ou C: alianças, blocos e relações se reconfiguram no mapa (transição existente); a régua acende a banda do cenário até o horizonte |
| 10 | Implicações | `consequencias` por região e `implicacoes` de cada ator no cenário em vista | Regiões coloridas pelo efeito (aproximação, atrito, misto), como no detalhe do cenário |
| 11 | Sinais de alerta | `sinais`: o que observar, onde, quando, e a qual futuro dá ou tira força | Régua com o cursor no `quando` de cada sinal (quando é um ano ou período); mapa na vista em vigor |

**Fecho · Em que isso se apoia**

| # | Passo | Texto (campos) | Palco |
|---|---|---|---|
| 12 | Evidências | as evidências mais usadas (`ix.usosDaEvidencia`) com as fontes | Destaca no mapa os elementos que usam a evidência ativa; o clique abre a cadeia no painel |
| 13 | Método e limites | `metodos` (aplicado, parcial, não aplicado), `limitacoes`, `revisoes`; links para Análise, Mapa e Timeline | Volta à vista Hoje, visão geral; a régua mostra o cone inteiro |

### O palco (camadas)

- **Mapa do palco**: um componente novo e leve, só de leitura. Usa a projeção, os territórios, as
  curvas e o estilo das relações que já existem, mas não reutiliza o `MapaGeopolitico` inteiro
  (900 linhas com zoom, arraste e painel flutuante próprio). Recebe um foco. Atores focados ficam
  acesos; o resto recua (opacidade); relações focadas engrossam. Os nós são botões: o clique
  seleciona o ator (`selecionar`) e abre o `PainelContextual`. Enquadramento fixo no escopo da
  investigação, com um ajuste suave (transform) quando o foco cai em uma região.
- **Régua do tempo** (sempre visível, embaixo do palco): eixo do primeiro evento ao fim do
  horizonte, com `GlifoTempo` por categoria, o marco HOJE e um cursor. Depois do HOJE, o cone de
  incerteza QUALITATIVO (o mesmo desenho e o mesmo aviso de `LinhaHorizonte`) se abre na Parte II;
  não é intervalo calculado nem probabilidade. Os eventos de cenário só aparecem nos passos de
  cenário. As datas aparecem como estão nos dados, sem inventar dia exato.
- **Matriz**: a matriz das incertezas, reaproveitada.
- **Legenda viva**: tipos de relação presentes no passo e a natureza (observada, inferida,
  hipótese). Sempre visível no palco.
- Rótulo fixo no palco: "Visualização do passo N de M". Na prévia, o selo de demonstração já
  existente continua no topo.

### Scroll e movimento

- O passo ativo é o que cruza a faixa central da tela (`IntersectionObserver`, um só observador).
  Sem `scroll` listeners por quadro e sem bibliotecas.
- Trocar de passo muda o foco. As camadas trocam por opacidade e `transform` (240 ms, `--ease-saida`);
  as relações usam a transição que o mapa já tem.
- O texto de cada passo aparece uma única vez ao entrar na tela (opacidade + 8 px). Antes da
  revelação, o texto já ocupa o seu espaço (sem salto de layout).
- Um índice de passos (lateral no desktop) permite pular para qualquer passo; o scroll é livre.
- Com "reduzir movimento": nenhuma revelação nem transição de camada; o foco muda direto.
- Segurança: se o JavaScript falhar ou o observador não existir, todo o texto já está visível e o
  palco mostra a visão geral. Nada fica escondido à espera de animação.

### Estado compartilhado

- O passo ativo é estado local da Leitura (não vai para o endereço).
- Os passos de cenário (9) escrevem `vista`, e ela continua valendo ao trocar de aba (é o que já
  acontece entre Análise, Mapa e Timeline).
- O destaque do passo é foco visual e não `selecao`; só um clique da pessoa muda a seleção. Assim
  a rolagem não abre painéis sozinha.
- (Decisão minha.) Só o passo 9 ESCREVE `vista`. Os passos 1 a 8 e 12 a 13 desenham o palco na vista
  Hoje, sem alterar o estado compartilhado; os passos 10 e 11 desenham a vista em vigor. Assim, abrir a
  Leitura não desfaz o cenário que a pessoa escolheu em outra aba, e voltar a rolar para cima não
  reverte uma escolha.
- (Decisão minha.) O mapa do palco segue as regras do mapa atual para o que entra no desenho:
  países pelas capitais (`coord`); blocos e organizações como âncoras ou territórios, como no
  `MapaGeopolitico` (mesma lógica, extraída para uso comum, e não copiada).

### Celular e tablet

- Abaixo de 1024 px, o palco vira uma faixa fixa no topo (cerca de 40 % da altura da tela), com um
  botão "Ocultar visualização", e o texto rola embaixo.
- O mapa do palco mostra só os atores do foco com rótulo; "Ver relações em lista" abre a lista em
  texto (o mesmo conteúdo da `ListaDeRelacoes`).
- A régua do tempo usa toda a largura e não rola na horizontal; os rótulos densos viram só glifos,
  e o ano aparece no eixo.

### Acessibilidade

- Os passos são `section` com título. O palco é `aria-hidden` no que é decorativo e tem uma
  descrição em texto ("Mapa: Brasil, EUA e China em destaque; 3 relações"), atualizada a cada
  passo num `aria-live="polite"`.
- Os nós do palco são focáveis; Esc fecha o painel (comportamento atual).
- Contraste e tamanhos seguem os tokens. O texto acompanha o "Tamanho do texto".

## Fica para quem constrói

- Divisão interna dos componentes em `components/leitura/` e nomes.
- O ajuste exato do enquadramento por região e os limites de rótulos no mapa do palco.
- Os textos de interface curtos (rótulos, botões), no tom da IRIS.
- Testes: além dos atuais, cobrir a aba nova, a mudança de foco pelo passo ativo (simulando o
  observador), a escrita de `vista` nos passos de cenário, a abertura do painel pelo nó e o estado
  com "reduzir movimento".

## Demonstrativo e pendente

- Os dados da Leitura são os da investigação de exemplo da prévia. Fora dela não há investigação,
  porque o backend não tem API de investigações. A Leitura fica pronta para o contrato atual de
  `ResultadoDeInvestigacao`.
- Confiança da extração e data de observação por relação: não existem nos dados; aparecerão quando
  o backend as fornecer.
