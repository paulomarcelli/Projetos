# IRIS — Especificação de design

Documento de referência do sistema visual e de interação da IRIS, escrito para ser avaliado por
outra pessoa ou IA sem acesso ao código. Descreve o estado ATUAL da implementação (React 19,
Vite, TypeScript, Tailwind CSS 4). Valores entre crases são tokens ou nomes reais do código.
A seção 14 lista tensões conhecidas e perguntas abertas para revisão.

---

## 1. Produto e público

- **O que é:** plataforma de inteligência estratégica e prospectiva em Relações Internacionais.
  O usuário formula uma pergunta (ex.: "Como a competição tecnológica entre EUA e China pode
  transformar o equilíbrio estratégico nos próximos cinco anos?"), define horizonte e escopo, e
  recebe uma investigação com síntese, mapa de relações entre atores, três cenários alternativos e
  as evidências que sustentam cada afirmação.
- **Público:** pesquisadores, estudantes de pós-graduação e analistas de RI. Leitura longa,
  atenção alta, exigência de rastreabilidade.
- **Estado real (importante para avaliar):** a base científica (upload, leitura e metadados de
  PDFs) funciona com a API. O motor que produz investigações ainda não existe: os resultados
  aparecem com um exemplo ilustrativo (um contrafactual sobre a eleição brasileira de 2026,
  elaborado por IA com fontes reais e marcado como tal). Não há autenticação no servidor.
- **Percurso de uso:** Investigar → Compreender → Explorar relações → Comparar cenários →
  Consultar evidências.

## 2. Princípios de design

1. **Rigor antes de efeito.** Nenhum número, fonte, probabilidade ou capacidade é inventado.
   Estados não implementados dizem que não estão implementados.
2. **Toda afirmação diz o que ela é.** Fato, evidência, inferência, hipótese, cenário, incerteza e
   limitação têm marcadores visuais próprios (seção 7).
3. **O futuro nunca parece fato.** Tudo que é projetado usa âmbar, traço tracejado e/ou itálico.
4. **Cor com significado fixo.** Ciano = interação, conexão, vínculo com fonte. Âmbar = incerteza,
   hipótese, horizonte. Verde e vermelho só para estados reais do sistema. Nenhuma cor é
   decorativa e nenhuma distinção depende só de cor (sempre há forma ou texto junto).
5. **Revelação progressiva.** O essencial primeiro; o detalhe a um clique (seções recolhíveis,
   painel contextual).
6. **Movimento com função.** Anima-se para dar feedback, mostrar origem/destino, tornar uma
   mudança de estado legível ou explicar (landing). Nada se move em loop sem motivo.
7. **Uma ferramenta de análise, não uma demo de IA.** Nada de neon, estética militar, robôs,
   cérebros ou "magia".

## 3. Marca

- **Nome:** IRIS (em caixa-alta). Descritor: "Inteligência estratégica e prospectiva em Relações
  Internacionais". Conceito: "Compreender as relações de poder do presente para investigar os
  futuros possíveis da ordem internacional."
- **Símbolo (grade 32×32):** uma íris que olha para fora do próprio círculo.
  - anel aberto (raio 10, traço 2,6, pontas arredondadas, com vão de ~54° no quadrante superior
    direito) = o sistema observado;
  - pupila preenchida (raio 3,8) deslocada do centro em direção ao vão = o olhar analítico;
  - nó em ciano (raio 2,6) além do vão = o outro ator, a relação, o futuro investigado.
- **Wordmark:** "IRIS" em Source Serif 4, peso 600, espaçamento entre letras de 0,14 em,
  convertido em curvas (não depende da fonte instalada). Altura de maiúscula = 42% da altura do
  símbolo, centralizada na pupila.
- **Versões:** horizontal (símbolo + wordmark) e só símbolo; tom escuro (tinta `#F3F6FA`, acento
  `#52C7E8`) e tom claro (tinta `#0B1220`, acento `#0A6F91`); favicon com o símbolo sobre
  ladrilho `#0B1220` de cantos 7/32.
- **Legibilidade:** testada de 16 px a 160 px nos dois fundos.
- **Uso:** navegação da plataforma (26 px), cabeçalho móvel (22 px), landing (26 px), telas de
  conta (24–28 px), rodapé (28 px).

## 4. Cor

Dois temas com os MESMOS tokens semânticos. Os componentes só usam tokens (`bg-abismo`,
`text-texto-2`, `var(--color-ciano)`…), e o tema troca os valores.
- **Escuro:** padrão da marca.
- **Claro:** `<html data-tema="claro">`, escolhido em Configurações → Aparência ou no botão
  "Usar tema claro" do menu; "Igual ao sistema" segue o sistema operacional.
- **Impressão e PDF:** sempre no tema claro.

As cores que estavam escritas direto no código (mapa, ilustrações, diagramas) agora derivam dos
tokens com `color-mix(in srgb, var(--color-x) N%, transparent)`.

### 4.0 Por que azul-marinho, ciano e âmbar (revisão da paleta)

- **Azul-marinho como campo.** É a cor institucional da diplomacia e da cartografia (o mar, as
  cartas náuticas, organismos multilaterais) e transmite seriedade sem a neutralidade sem
  identidade do cinza. O risco é parecer "SaaS escuro genérico"; a identidade vem do conjunto
  (serifa editorial, linguagem epistêmica, cartografia), não da cor isolada.
- **Ciano para ação e seleção, âmbar para hipótese.** Esse par fica nos dois extremos do eixo
  azul–amarelo, que é o par de cores mais seguro para daltonismo (protanopia e deuteranopia
  preservam essa distinção). Por isso a dupla foi mantida em vez de trocada.
- **Saturação do ciano.** Foi mantida no tema escuro (contraste de 9,5:1, sem efeito neon, porque
  aparece em áreas pequenas) e reduzida no tema claro (`#0A6F91`), onde o ciano claro não teria
  contraste.
- **Uma cor, um papel.** Ciano = interação, seleção, conexão, vínculo com fonte. Âmbar = incerteza,
  hipótese, cenário, horizonte, "o que mudou". Verde e vermelho só para estados reais.
  **Seleção nunca é âmbar** (decisão da revisão; ver 14).

### 4.1 Superfícies (escuro / claro)

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `abismo` | `#0B1220` | `#F4F6F9` | Fundo; campos de formulário |
| `mar` | `#0F1A2C` | `#EAEEF4` | Landing e telas de conta: alterna seções (degrau de tom, sem linhas) |
| `institucional` | `#14243A` | `#FFFFFF` | Painéis e cartões; painel contextual |
| `grafite` | `#1C293B` | `#E4E9F0` | Hover, botão secundário, faixas |
| `grafite-alto` | `#243449` | `#D8DFE8` | Hover do botão secundário |

**Regra de superfícies:**
- **Plataforma:** painéis com borda fina (`linha`) e rótulos pequenos, porque a informação é densa
  e precisa de separação fina sem blocos pesados.
- **Landing e telas de conta:** separam por mudança de tom (`mar`), sem linhas, porque são leitura
  contínua.
- As duas linguagens são intencionais e não devem se misturar.

### 4.2 Texto e linhas

| Token | Escuro | Claro | Contraste no pior caso (escuro / claro) |
|---|---|---|---|
| `texto` | `#F3F6FA` | `#0B1220` | 13,6:1 / 13,9:1 |
| `texto-2` | `#B4C1D3` | `#334256` | 8,1:1 / 7,6:1 |
| `texto-3` | `#8797AE` | `#56647A` | 4,9:1 / 4,5:1 |
| `linha` | `rgb(154 170 192 / .14)` | `rgb(11 18 32 / .12)` | divisórias |
| `linha-forte` | `rgb(154 170 192 / .26)` | `rgb(11 18 32 / .22)` | bordas de campos e fichas |

`texto-2` foi clareado no tema escuro (de `#9AAAC0`, 7,9:1, para `#B4C1D3`, 10,3:1 sobre
`abismo`). Antes ele ficava próximo demais do `texto-3`, e a hierarquia entre os dois se perdia.

O `texto-3` NÃO foi escurecido, embora a revisão tenha sugerido isso. Ele também aparece sobre
`institucional` e `grafite`: com 4,5:1 sobre o fundo, cairia para cerca de 3,6:1 sobre `grafite`
e reprovaria no AA.

### 4.3 Significado

| Token | Escuro | Claro | Significado |
|---|---|---|---|
| `ciano` | `#52C7E8` | `#0A6F91` | interação, ação principal, **seleção**, conexão, ator em foco |
| `ciano-texto` | `#8FDAF0` | `#075B78` | links e números de citação |
| `ciano-suave` | ciano a 12% | ciano a 10% | fundo de seleção (cenário ativo, item escolhido) |
| `ambar` | `#E9B45B` | `#8A5600` | incerteza, hipótese, cenário (letra A/B/C), horizonte, "o que mudou" |
| `ambar-suave` | âmbar a 12% | âmbar a 12% | fundo de incerteza analítica (painel "O que ainda não se sabe", aviso `incerteza`) |
| `positivo` | `#6CCB9A` | `#1B6F45` | só estado real (API no ar, regra cumprida) |
| `negativo` | `#EF8A7C` | `#A8352A` | só erro real |

**Contraste:**
- Todos os pares de texto passam no AA nas cinco superfícies dos dois temas.
- O ciano claro sobre `grafite-alto` dá 4,2:1. Isso é aceitável porque, como texto, o ciano é
  sempre usado na variante `ciano-texto` (≥ 5,6:1); o ciano puro fica para bordas e ícones, que
  exigem 3:1.
- **Botão primário:**
  - no escuro, texto `abismo` sobre `ciano` (9,5:1);
  - no claro, texto `abismo` (papel) sobre `#0A6F91` (5,2:1).

**Selo de cenário (`Letra`):**
- a letra é sempre âmbar, porque o cenário é hipotético;
- quando o cenário está selecionado, ganha borda e fundo ciano.

**Teoria das cores aplicada (revisão de outubro de 2026):**
- **Harmonia:** a base é azul-marinho (matiz ~220°) com ciano análogo (~193°): frio, estável,
  "presente e verificável". O âmbar (~38°) é quase complementar ao azul: quente, salta do fundo
  e por isso marca o que é **futuro, hipótese ou incerteza**. Proporção aproximada 60-30-10:
  superfícies escuras, texto e linhas neutros, e os dois acentos em poucos pontos.
- **Um matiz, um significado:** nenhum matiz carrega duas ideias. Por isso foram corrigidos os
  usos de âmbar que não eram analíticos:
  - o selo "Prévia estática" e os estados do sistema (prévia, dependências pendentes) viraram
    neutros (`texto-2` sobre `grafite`);
  - avisos do sistema ("ainda não disponível") usam o tom `atencao`, neutro com filete; o âmbar
    ficou num tom novo, `incerteza`, só para atenção analítica;
  - a estrela de favorito virou ciano (é um estado escolhido pelo usuário, como a seleção);
  - na landing, o estado do projeto usa uma só cor em três intensidades (cheio → anel → anel
    apagado), em vez de ciano/âmbar/cinza: o progresso se lê pela forma;
  - no formulário, o marcador "hipótese" ao lado do título saiu: uma pergunta não é hipótese.
- **Verde e vermelho** continuam só para estado real (sucesso, erro, critério cumprido na
  checagem da pergunta), nunca para avaliar um cenário como "bom" ou "ruim".

### 4.4 Cartografia (seção Relações)

| Token | Escuro | Claro |
|---|---|---|
| `terra` (país) | `#182536` | `#DDE4EC` |
| `terra-envolvida` (país da investigação) | `#26384F` | `#C9D4E1` |
| `terra-foco` (país selecionado) | `#2E4562` | `#B3C3D6` |
| `no` (preenchimento do nó) | `#0F1A2A` | `#FFFFFF` |
| `luz` (brilho das linhas) | `#F3FBFE` | `#0A6F91` |
| fundo (`mapa-centro` → `mapa-borda`) | `#0F1D31` → `#08101D` | `#F8FAFC` → `#E3E9F0` |

**Exceção formal:** gradientes são proibidos no sistema, exceto como fundo de visualizações
espaciais contínuas (a vinheta radial do mapa ajuda a focar o centro e dá profundidade).

## 5. Tipografia

Três famílias, todas empacotadas localmente (sem chamadas externas):

| Família | Papel |
|---|---|
| **Source Serif 4** (variável) | títulos, manchetes, a síntese da análise, citações, wordmark |
| **Inter** (variável) | interface e texto corrido, inclusive o texto analítico denso. Substituiu a IBM Plex Sans (revisão de 2026-10): desenhada para tela, mais legível a 16 px com entrelinha generosa; o pacote da Plex Sans saiu (sem dependência redundante) |
| **IBM Plex Mono** (400/500) | dados, anos, números de citação, hashes, origem dos números (só na plataforma; a landing não usa mono). Mantida de propósito: a forma monoespaçada sinaliza "dado bruto, verificável" |

Números sempre tabulares (`.numeros`).

### 5.1 Escala da plataforma (base 16 px; nada abaixo de 13 px)

A raiz é `100%` (16 px, ou o que a pessoa configurou no navegador). Cada token de texto é
multiplicado por `--escala-texto`, a preferência **Tamanho do texto** (Configurações →
Aparência): Padrão 1 (16 px), Confortável 1,125 (18 px), Ampliada 1,25 (20 px). Os títulos
(`secao`, `titulo`, `manchete`) crescem pela metade da escala (`--escala-titulo`), para a
hierarquia não estourar. Espaçamentos, ícones (em px), mapas e gráficos não mudam: aumenta-se a
leitura, não a interface inteira. Entrelinhas sem unidade, para acompanhar o tamanho.

| Token | Tamanho (padrão) / entrelinha | Uso |
|---|---|---|
| `micro` | 13 / 1,45 | rótulos, datas, origem dos dados |
| `legenda` | 14 / 1,5 | metadados, texto de apoio |
| `corpo` | 16 / 1,6 | interface e texto denso |
| `leitura` | 17 / 1,65 | texto analítico, subtítulos |
| `secao` | 21 / 1,35 | síntese, títulos de cartão e painel |
| `titulo` | 30 / 1,2 | título de página e das seções da análise |
| `manchete` | 40 / 1,1 | manchete editorial do Início |

Rótulo de seção (`.rotulo`): 13 px, peso 500, espaçamento 0,04 em, `texto-2`. A densidade se
resolve com estrutura (linhas em vez de cartões, partes rotuladas), nunca encolhendo a letra.

### 5.2 Escala da landing (fluida, com `clamp`)

| Classe | Faixa | Detalhes |
|---|---|---|
| `.landing-manchete` | 36 → 68 px | Source Serif 500, entrelinha 1,04, espaçamento −0,022 em |
| `.landing-titulo` | 28 → 44 px | Source Serif 500, entrelinha 1,1 |
| `.landing-texto` | 17 → 19 px | Inter, entrelinha 1,6, 45–60 caracteres por linha |

Os títulos usam `text-wrap: balance`; os parágrafos, `pretty`.

## 6. Espaço, grade e forma

- **Raios:** `fino` 3 px, `padrao` 6 px (botões, campos), `painel` 10 px (painéis, mapa).
- **Plataforma, larguras:** coluna de leitura de **1200 px** (`--container-editorial`), centrada.
  Páginas com visualização (mapa, timeline) marcam um descendente com `data-largura="ampla"` e a
  coluna se abre a **1600 px** (`--container-ampla`), via `:has()`, sem estado no React.
- **Plataforma, menu lateral** (ver 11.3): desktop redimensionável de 224 a 360 px (padrão 272) e
  recolhível a 68 px (só ícones); tablet sempre em ícones, com a gaveta sobreposta ao expandir;
  celular com barra superior e gaveta.
- **Profundidade:** duas sombras só (`shadow-cartao` em repouso, `shadow-elevado` no cursor e na
  seleção), curtas e frias; nada de brilho. Cartões se separam do fundo pelo tom, não por contorno;
  o contorno aparece só para comunicar estado (cursor, seleção em ciano).
- **Landing:** contêiner de 1200 px, grade de 12 colunas, margens laterais iguais (≥ 20 px +
  `safe-area`). Seções com 96 px (celular) a 144–160 px (desktop) de respiro vertical;
  o espaço entre seções é sempre maior que o espaço interno.
- **Alvos de toque:** ≥ 44 px na plataforma; 48 px nos botões e campos da landing e das telas de
  conta.
- **Fundo da plataforma:** grade de coordenadas de 96 px a 3,5% de opacidade
  (`.fundo-cartografico`), quase imperceptível.

## 7. Linguagem epistêmica (núcleo do sistema)

Sete tipos de afirmação, cada um com glifo SVG de 14–16 px, rótulo e cor. A forma é a distinção
principal; a cor reforça.

| Tipo | Glifo | Cor |
|---|---|---|
| Fato observado | círculo cheio | `texto` |
| Evidência documental | documento com dobra e linhas | `ciano-texto` |
| Inferência analítica | círculo tracejado | `texto-2` |
| Hipótese | losango vazado | `ambar` |
| Cenário condicional | ramificação (uma linha que se abre em três) | `ambar` |
| Incerteza | duas ondas | `ambar` |
| Limitação metodológica | círculo cortado por diagonal | `texto-2` |

**Citações:** número sobrescrito em Plex Mono de 12 px, `[5]` ou `[14,15]`, em `ciano-texto`, sem
fundo (fundo em cada citação mancharia parágrafos densos). A área de clique é ampliada por um
pseudo-elemento invisível (+4 px nas laterais, +8 px acima e abaixo). O clique
abre, no painel contextual, a cadeia completa: Afirmação → Evidência → Fonte(s) → Interpretação →
Implicação prospectiva, mais a lista de onde aquela evidência é usada.

**Sem suporte:** afirmação marcada como fato ou evidência sem fonte ligada mostra "Sem evidência
vinculada nesta versão". Uma fonte não conferida no texto mostra "fonte não conferida no texto",
em âmbar.

**Tempo:** observado (círculo cheio), inferido (círculo tracejado), condicional (losango âmbar),
projetado (ramificação tracejada âmbar). O futuro usa itálico e traço tracejado âmbar.

## 8. Gramática das relações (mapa)

| Tipo | Traço | Cor | Espessura | Direção |
|---|---|---|---|---|
| Cooperação / aliança | contínuo | ciano | 2 | — |
| Competição / disputa | tracejado 8-4 | `texto-2` | 1,6 | — |
| Conflito | contínuo | `texto` | 2,6 | — |
| Dependência | contínuo + seta | `texto-2` | 1,6 | sim |
| Influência | tracejado 6-4 + seta | ciano | 1,6 | sim |
| Fluxo (comércio, energia, tecnologia) | pontilhado 1-5 | ciano | 2,2 | — |

**Origem do dado:**
- sem marca = documentada;
- ◌ = inferida;
- ◇ = hipótese do cenário.

**A espessura não mede intensidade.** Não há método para quantificar a força de uma relação, e o
painel diz isso.

**Mudança entre o presente e um cenário:** selo no meio da linha com glifo e linha em âmbar.
- `+` nova;
- `⇄` muda de natureza;
- `↑` reforçada;
- `↓` enfraquecida;
- `×` deixa de existir (a linha permanece como "fantasma").

## 9. Componentes

- **Botões:**
  - primário: fundo ciano, texto abismo, peso 500, altura 40 px, ou 48 px no `.botao-grande`;
  - secundário: fundo grafite com borda `linha`;
  - fantasma: só texto;
  - perigo: borda e texto em `negativo`.
  - Todos com pressão `scale(0.97)` em 140 ms; o hover só existe em dispositivos com ponteiro fino.
- **Campo de texto (`.campo`):** 16 px em toda a interface (evita o zoom automático do iOS); fundo
  abismo, borda `linha-forte`, foco com borda ciano e anel de 3 px a 18%; erro com borda `negativo`
  a 70%.
- **Fichas (`.ficha`):** cápsulas de 36 px de altura para filtros, regiões, horizontes e
  dimensões; o estado ativo (`aria-pressed` ou `aria-checked`) usa borda e texto em ciano sobre
  `ciano-suave`.
- **Abas:** sublinhado ciano de 2 px; padrão de teclado do WAI-ARIA (setas, Home, End).
- **Aviso (`Aviso`):** neutro, atenção (âmbar), erro (vermelho), sucesso (verde); com
  `role="status"`, ou `role="alert"` no erro.
- **Painel contextual:**
  - no desktop, lateral fixa de 400 px à direita (o conteúdo ganha margem para não ser coberto);
  - no celular, folha inferior com até 52% da altura, recolhível;
  - na seção Relações, painel flutuante de 340 px sobre o mapa;
  - histórico com "voltar"; Esc fecha;
  - o foco vai para o título ao abrir.
- **Estado vazio (`EstadoVazio`):** ícone, marcador epistêmico (geralmente "limitação"), título,
  explicação do que vai aparecer ali e uma ação.
- **Esqueletos:** brilho lento de 1,4 s enquanto há carregamento real.
- **Notificações:** entram e saem por baixo (400 ms / 200 ms).

## 10. Movimento

**Tokens:**
- `--ease-saida` `cubic-bezier(0.23, 1, 0.32, 1)`: entradas e saídas;
- `--ease-movimento` `cubic-bezier(0.77, 0, 0.175, 1)`: deslocamento na tela;
- `--ease-gaveta` `cubic-bezier(0.32, 0.72, 0, 1)`: gaveta;
- durações de 140 ms (toque), 180 ms (curta) e 240 ms (média).

**Ferramentas:**
- **Plataforma:** CSS (transições, `@starting-style`, keyframes).
- **Landing e telas de conta:** biblioteca Motion (`motion/react` com `LazyMotion` +
  `domAnimation`), carregada só nessas páginas. Só `opacity`, `transform` e `pathLength`.

**Catálogo:**

| Onde | O quê | Como |
|---|---|---|
| Botões e fichas | pressão | escala 0,97 em 140 ms |
| Cor de hover e seleção | troca de cor | 150–180 ms |
| Linha do horizonte (formulário) | cone de incerteza abre e fecha | 240 ms |
| Gaveta e notificações | entram e saem pelo mesmo caminho | 400 ms entrando, 200 ms saindo |
| Mapa: troca de cenário | linhas traçadas da origem ao destino; as que somem recolhem; as que mudam brilham em âmbar; selo de mudança após 0,55 s; zoom e posição preservados | ~1 s |
| Mapa: relações com sentido documentado | pulso de luz da origem ao destino | **loop de 2,2 s** |
| Mapa: país em crise | pulso de opacidade | **loop de 2,4 s** |
| Landing: abertura | a manchete já nasce visível e só assenta 10 px; texto e ações entram em sequência (70 ms entre eles, 500 ms cada, subindo 12 px) | uma vez |
| Landing: ilustração | cartografia aparece → nós (de escala 0,85 a 1) → relações traçadas → três trajetórias → marcas A/B/C | uma vez, ~2,6 s; depois fica parada |
| Landing: seções | revelação ao entrar na tela (sequência de 70 ms) | uma vez |
| Landing: capturas da plataforma | cruzamento de opacidade + assentamento de escala 1,012 → 1 entre abas; o fundo da aba ativa desliza (layoutId) | 280 ms |
| Landing: cabeçalho (desktop) | preso ao topo; ganha fundo ao rolar; traço ciano desliza até a seção em leitura | mola de 0,4 s |
| Landing: ilustração do hero (cursor) | passar sobre um ator acende as relações dele e recua o resto; sobre um futuro, destaca a trajetória e mostra "hipótese" | opacidade, 260 ms |
| Landing: etapas (cursor) | régua acende da esquerda para a direita; o diagrama sobe 2 px | 500 ms / 300 ms |
| Landing: diferenciais (rolagem, desktop) | o texto no centro da tela fica pleno; os outros recuam para 40% | 500 ms |
| Botões com seta | a seta anda 3 px no hover | 240 ms |
| Análise: futuros | cartão sobe 2 px e a borda esquenta (âmbar) no hover; a seta anda | 200 ms |
| Telas de conta | o painel fica montado; o formulário sai (8 px para cima, 160 ms) antes de o novo entrar (8 px de baixo, 220 ms) | por troca de tela |
| Avisos de resultado | 4 px + opacidade | 180 ms |

**Movimento reduzido:** os deslocamentos e escalas viram só opacidade; os desenhos já aparecem
prontos; os pulsos do mapa param; a troca de cenário fica instantânea.

## 11. Telas

### 11.1 Landing (`/`)

> **Abertura orbital (out/2026).** Referência pedida: a abertura de jobhunt.asmcleod.com (núcleo
> brilhante num campo de estrelas, fios que brotam com o tempo, contador no canto, "pular
> introdução", arrastar para girar). Refeita em `features/landing/components/CenaOrbital.tsx`:
> - Canvas 2D com projeção 3D simples (a referência usa WebGL/three.js, ~1,3 MB); +9 kB no
>   trecho da landing, nenhuma dependência nova;
> - mais rápida: ~4,5 s (24 fios, um a cada 130 ms, cada um cresce em 0,9 s); roda uma vez por
>   sessão; "Pular introdução" e depois "Rever introdução";
> - as palavras viram 24 conceitos de R.I. (Soberania, Diplomacia, ONU, Sanções, Tratados,
>   Multilateralismo, Geopolítica, Mercosul, Hegemonia, Cooperação, BRICS, Fronteiras, Comércio,
>   OTAN, Dissuasão, Interdependência, G20, Segurança, Alianças, União Europeia, Poder, Normas,
>   OMC, Conflito). São ilustrativos, não dados; o contador diz "N de 24 conceitos";
> - cor por família, com o significado da plataforma: ciano = cooperação, âmbar = tensão e poder,
>   neutro = instituições e blocos; o núcleo é âmbar (a pergunta, o que ainda não se sabe);
> - interação: arrastar gira (com inércia), o cursor afasta os fios, tocar o núcleo manda um pulso
>   de luz por todos eles; rótulos sem sobreposição (os da frente têm prioridade);
> - segue o tema (lê os tokens); pausa fora da tela; com "reduzir movimento" aparece pronta e
>   parada; sem canvas (testes), a manchete aparece direto. O `h1` existe desde o início.

> **Versão 3 (out/2026).** Referência pedida: template Quinn (Squarespace), de onde vieram os
> princípios (tipografia grande, muito espaço, composição editorial, imagens grandes e poucas).
> Direção sorteada e aplicada com a skill taste-skill ("Type and nothing else"), conferida com o
> inspetor dela (0 falhas). Seções: abertura só de texto num eixo a 1/3 → escada "Cada afirmação
> ligada à sua fonte / Cada futuro marcado como hipótese" com duas capturas → como funciona
> (chamada e resposta; a rede interativa é a segunda resposta) → **teste uma pergunta** (manchete
> que é um campo, com a checagem simples e um botão que leva a pergunta para `/app?pergunta=`) →
> a plataforma como lista de comandos gigante com a captura real ao lado → onde o projeto está
> (tabela num só tamanho, estado real) → pergunta final → rodapé. Ícones da landing: Font Awesome
> Free (só os desenhos importados, via `IconeFA`); a plataforma segue com Lucide. Imagens: só
> capturas reais da interface (os bancos de imagem não estão acessíveis neste ambiente e exigem
> licença). O texto abaixo descreve a versão anterior e fica como histórico.

1. **Barra:** marca, três âncoras (Como funciona, A plataforma, Diferenciais), "Entrar" e o botão
   "Começar". Sem efeito de vidro, sem sombra, sem ficar presa ao topo.
2. **Abertura:**
   - manchete em largura total, uma frase por linha: "Compreenda o sistema internacional. /
     Explore os futuros possíveis.";
   - abaixo, à esquerda (5 colunas): descrição e ações ("Começar uma investigação", primária, e
     "Conhecer a plataforma", link sublinhado);
   - à direita (7 colunas): a ilustração conceitual, com legenda "Ilustração conceitual".
   - A ilustração é uma grade de projeção cônica (paralelos em arco, meridianos convergentes) a
     13% de opacidade; nove nós; as relações do ator em foco em ciano; as demais em cinza a 32%;
     três trajetórias tracejadas em âmbar até uma linha de horizonte; marcas A, B, C.
3. **Como funciona** (fundo `mar`):
   - título "Da pergunta aos futuros alternativos." e uma frase de apoio;
   - lista ordenada de quatro passos, cada um com um diagrama da mesma pequena rede no estado
     correspondente: escopo da pergunta; relações com marcas de evidência; três trajetórias;
     trajetórias com marcas de indicador e uma em destaque;
   - sem numeração visível.
4. **A plataforma:**
   - título "Um ambiente de investigação, não uma caixa de perguntas.";
   - abas verticais (Análise, Mapa de relações, Timeline prospectiva), com a descrição só na aba ativa;
   - captura real da interface em quadro de proporção fixa;
   - legenda dizendo que o exemplo é ilustrativo e elaborado por IA.
5. **Diferenciais** (fundo `mar`):
   - título fixo à esquerda (5 colunas): "O rigor de uma pesquisa, com a leitura de um centro de
     análise.";
   - à direita, quatro textos (questões internacionais; relações entre atores e eventos;
     prospectiva e cenários; evidências e rastreabilidade);
   - o último mostra os sete marcadores reais.
6. **Chamada final:**
   - manchete "Toda investigação começa por uma pergunta." e o mesmo botão primário;
   - abaixo, "Onde o projeto está": as seis etapas do método, cada uma com o estado real
     (Disponível em ciano, Próxima fase em âmbar, Planejada em contorno).
7. **Rodapé** (fundo `mar`):
   - marca, links (Plataforma, Base científica, Entrar, Criar conta);
   - linha com "© ano · IRIS · descritor" e "Projeto em desenvolvimento".
   - Sem contato, privacidade ou termos, porque essas páginas não existem.

**Regras aplicadas:**
- um único caminho de conversão;
- nenhuma grade de cartões iguais nem cartão com ícone no topo;
- sem gradientes, sombras em repouso, vidro, emoji, rótulo pequeno acima do título ou numeração
  decorativa;
- nenhum número de marketing (há um teste automático que impede).

### 11.2 Telas de conta (`/entrar`, `/criar-conta`, `/recuperar-senha`, `/redefinir-senha?token=`)

- **Desktop:** duas colunas.
  - Esquerda, fundo `mar`: marca, a mesma ilustração conceitual e a frase-conceito em serifa de
    28 px.
  - Direita: formulário com largura máxima de 400 px e "Voltar ao site".
- **Celular:** só a marca e o formulário.
- **Campos:** rótulo real, campo de 48 px, dica e erro ligados por `aria-describedby`, erro
  logo abaixo do campo e anunciado; o foco vai para o primeiro campo inválido.
- **Senha:** botão de mostrar/ocultar com `aria-pressed`.
  - Regras: pelo menos 10 caracteres; letras e pelo menos um número.
  - As regras são marcadas enquanto se digita, com "(cumprida)" ou "(pendente)" para leitores de
    tela.
- **Envio:** o botão mostra um indicador e um rótulo de progresso ("Verificando…") e fica
  desativado.
- **Resultado:** três estados, `ok`, `erro` (por campo ou geral) e `indisponivel`.
  - Hoje, toda chamada devolve `indisponivel`, e a tela diz que nada foi verificado, criado ou
    enviado.
  - Login e cadastro oferecem "Continuar para a plataforma" (acesso aberto de desenvolvimento).
- **Recuperação:** a mensagem de sucesso não revela se o e-mail tem conta.
- **Redefinição:** sem token, a tela mostra "Link inválido ou incompleto" e "Pedir um novo link",
  sem o formulário.

### 11.3 Plataforma (`/app`)

- **Lateral:** Início, Investigações, Base científica | Pessoal: Favoritos, Configurações. Embaixo,
  o estado real do sistema (lido de `/health/ready`).
- **Início:**
  - manchete com a data e "Entenda o presente. / Explore futuros possíveis.";
  - formulário de nova investigação: pergunta (área de texto em serifa) e horizonte (1, 3, 5, 10
    ou 25 anos, com a linha de horizonte e o cone de incerteza), sempre à vista;
  - em "Ajustar parâmetros", com resumo: escopo geográfico (mapa-múndi clicável por região),
    dimensões e profundidade;
  - o botão salva um rascunho no navegador e diz isso;
  - depois do formulário, investigações recentes e o painel da base científica.
- **Investigação** (`/app/investigacoes/:id?area=`): fluxo pergunta → Análise → Mapa de relações
  → Timeline prospectiva, com estado compartilhado (cenário em vista, seleção).
  - **Cabeçalho** (A): rótulo e natureza, pergunta, horizonte e versão; ações que existem de fato
    ("Como esta análise foi feita" no painel, "Imprimir ou salvar PDF"); o aviso de contexto numa
    linha de apoio com fio âmbar.
  - **Análise** (entrada, revisão de 2026-10), tudo numa página, sem abas nem acordeões internos:
    1. índice "Nesta análise" (texto, não fichas);
    2. **Em síntese** (B): o fenômeno em serifa de 21 px e, ao lado, horizonte e escopo, principal
       incerteza e os futuros considerados;
    3. **Fatores determinantes** (C): uma linha por fator (estado atual com fonte · por que
       importa); abaixo, em três colunas, "O que ainda não se sabe" (espectros âmbar), atores (por
       número de relações registradas) e eventos recentes (abrem no painel);
    4. **Três futuros possíveis** (D): três cartões do MESMO componente, lado a lado quando o
       contêiner tem ≥ 896 px (consulta de contêiner: o menu e o painel mudam a largura útil). Em
       três colunas, uma subgrade alinha as partes (Lógica, Consequências, Atores decisivos,
       Depende de, Sinais a acompanhar, Incertezas). Clicar destaca o cenário (o mesmo estado do
       mapa e da timeline); "Detalhes e evidências" abre o cenário completo no painel;
    5. **Comparação entre os cenários** (E), explicitamente qualitativa: matriz das duas
       incertezas críticas (posição de cada cenário pelas premissas, `posicao`), "Os mesmos
       fatores, três direções" (`direcao`, gatilhos, atores, "rever se"), sinais de alerta
       (`favorece`/`enfraquece`, sempre com palavra) e linha do tempo compartilhada (anos do
       horizonte × agenda comum e faixas A, B, C). Nada calculado, nenhum percentual;
    6. **Evidências e fontes** (F): área técnica própria, recolhida, com busca.
    No celular, as tabelas viram blocos por linha (critério e, abaixo, A, B e C), sem rolagem
    lateral.
  - **Mapa de relações:** como descrito em 8; cabeçalho de uma linha.
  - **Timeline prospectiva:** SVG com eixo do primeiro antecedente ao fim do horizonte; passado em
    linha contínua; "HOJE" tracejado em âmbar; três faixas tracejadas (uma por cenário) reveladas
    por máscara (para manter o tracejado); faixa de "calendário comum" para eventos agendados.
    Eventos: forma por tipo, anel âmbar = inflexão, foco ciano. Dentro do ano, a posição segue a
    ordem dos eventos, não uma data inventada. "Percorrer o tempo" (~1,6 s por ano; com movimento
    reduzido, avança evento a evento). Legenda de altura fixa abaixo. Depois: cenário em foco
    (detalhe recolhível ou comparação lado a lado) e "O que separa os futuros".
- **Leitura guiada:** removida em out/2026. O endereço antigo (`?area=leitura`) abre a análise.
- **Menu lateral:** Nova investigação, Base científica, Minhas investigações (até 6, com título em
  duas linhas, data e "rascunho" quando for o caso; "Ver todas" leva à lista completa), Pessoal.
  - redimensionável pela alça da borda (separador WAI-ARIA com valor): arraste com mouse ou toque,
    ← → (Shift: passo largo), Home/End, Enter recolhe, duplo clique volta ao padrão; arrastar bem
    abaixo do mínimo recolhe;
  - botão "Recolher menu" / "Expandir menu" no topo (`aria-expanded`); recolhido, cada item mostra
    o ícone, mantém o nome no link (texto oculto) e mostra uma dica no cursor e no foco;
  - a transição da grade (240 ms) é desligada durante o arraste e com movimento reduzido;
  - largura e estado ficam salvos (`iris:menu`).
- **Tema:** botão sol/lua no menu (um só desenho: o disco cresce e é recortado por uma máscara;
  os raios giram e somem; CSS, para não levar a Motion ao pacote principal). A troca passa por
  uma View Transition curta (220 ms), sem clarão; com movimento reduzido é direta.
- **Base científica:**
  - indicadores e distribuições do acervo, cada número com a sua origem em Plex Mono
    ("fonte GET /documents → total");
  - leitor de fonte com o texto por página e uma ficha bibliográfica que mostra a origem de cada
    campo.

## 12. Acessibilidade

- Contraste AA ou melhor em todos os pares de texto (seção 4).
- Foco visível: contorno ciano de 2 px com afastamento de 2 px; campos com anel.
- Teclado completo: abas WAI-ARIA, mapa navegável (Tab percorre países e conexões), Esc fecha
  painéis, link "Pular para o conteúdo".
- Nada depende só de cor: glifos, traços, rótulos e textos para leitor de tela.
- O foco vai para o título do painel ao abrir e para o `h1` nas trocas de tela de conta.
- `prefers-reduced-motion` respeitado em CSS e no Motion.
- Texto de no mínimo 13 px no tamanho padrão. Todos os campos de formulário com ≥ 16 px.
- **Tamanho do texto** (Configurações → Aparência): Padrão 16, Confortável 18, Ampliada 20; grupo
  de rádio com setas; aplica na hora e fica salvo (`iris:texto`), antes da primeira pintura.
- Tema: escuro, claro ou "Igual ao sistema" (o padrão, quando não há escolha guardada); aplicado
  antes da primeira pintura (sem piscar). Tema, tamanho do texto e menu vêm de UM armazenamento
  (`src/store/preferencias.ts`, `useSyncExternalStore`): o botão do menu e as Configurações nunca
  discordam.
- Alvos de toque de ≥ 40–44 px nos controles da navegação, das abas e dos seletores.
- Impressão e PDF: tema claro forçado; menu, abas, painéis e botões escondidos; seções `<details>`
  abertas; links externos impressos com o endereço.
- `safe-area-inset` nas margens; folhas inferiores no celular.

## 13. Regras de conteúdo e honestidade

- Nunca simular processamento, envio de e-mail, login ou resultados.
- Dados de exemplo sempre identificados ("Ilustração conceitual", "exemplo ilustrativo",
  "Prévia estática · dados de exemplo").
- Sem probabilidades, pesos ou índices sem método declarado.
- Cenários são sempre "futuros alternativos, sem probabilidade atribuída".
- Links só para destinos que existem.
- Português do Brasil, frases curtas, sentence case, voz direta.

## 14. Decisões da revisão e pontos em aberto

Uma revisão externa respondeu às tensões levantadas na versão anterior deste documento. O que foi
decidido e aplicado:

| Tensão | Decisão | Estado |
|---|---|---|
| Duas linguagens de superfície | Manter as duas, com regra documentada (4.1) | Aplicado |
| Gradiente no mapa | Exceção formal só para visualizações espaciais (4.4) | Aplicado |
| Três famílias tipográficas | Manter Plex Mono: sinaliza "dado verificável" (5) | Aplicado |
| Citações de 11 px | 12 px, sem fundo, com área de clique ampliada (7) | Aplicado |
| Campos de 15 px | 16 px em toda a interface (9) | Aplicado |
| `texto-2` e `texto-3` próximos | Clarear `texto-2` (10,3:1); `texto-3` mantido para não reprovar sobre `grafite` (4.2) | Aplicado (diverge da sugestão original, que era escurecer `texto-3`) |
| Raio de 6 px | Manter | Aplicado |
| Âmbar com dois papéis | Seleção passa a ciano; a letra A/B/C continua âmbar (4.3) | Aplicado |
| Tema claro | Tema claro completo + impressão/PDF no tema claro (4) | Aplicado |
| Exemplo público politicamente sensível | Trocar por tema neutro | **Adiado por decisão do responsável** |

**Pontos ainda em aberto:**
1. **Movimento contínuo no mapa.** O pulso de luz nas relações com sentido e o pulso de "crise"
   rodam em loop. Manter, limitar ao item em foco, ou tornar opcional?
2. **Densidade da análise.** Agora são cinco blocos curtos (fenômeno, incertezas, fatores, atores,
   futuros) e as evidências recolhidas. Os fatores ainda trazem duas linhas cada: cortar o "por que
   importa"?
3. **Ilustrações e capturas da landing no tema claro.** As capturas de tela da plataforma são do
   tema escuro (são imagens). Ter um par de capturas por tema?
4. **"Igual ao sistema" como padrão?** Hoje o padrão é o tema escuro (identidade da marca) e o
   claro é opcional. Seguir o sistema operacional por padrão seria mais acessível, mas mudaria a
   primeira impressão da marca.

## Landing v4 (out/2026): o mundo noturno que desce com o scroll

Substitui as regras de landing acima (escala, abertura, seções e movimento). Estrutura e movimento vêm
da demo "Breu" (perfumaria noturna num jardim escuro), adaptados à Iris; o código está em
`src/pages/Landing/PaginaLanding.tsx`, `src/features/landing/mundo/` e `src/features/landing/landing-mundo.css`.

- **O mundo:** faixa vertical de sete imagens abstratas (WebP 2560 px, em `public/recursos/imagens/mundo/`) fixa atrás do
  texto, emendada por degradê em 263 px: globo de pontos sobre uma grade → mapas em camadas de pontos →
  rede de relações → arquivo de registros → mesa redonda de nós (a negociação) → superfície com o cabo de
  dados → breu. Geradas por IA (Figma), sem texto nem objetos reais; não representam dados, e o rodapé diz.
- **O fio de luz:** desenhado só por código (SVG), por um eixo calmo do globo ao breu, aceso até 64% da
  altura da tela. Acende os três marcos (Fato, Inferência, Hipótese) junto com os cartões dessas marcas, e cai como
  gota sobre o nome **IRIS** no rodapé. Eixo medido em `fio-pontos.json`.
- **Cena por seção:** `FOCO` em `cena.ts` casa o centro de cada seção (`data-scene`) com o ponto do cenário
  (curva monotônica): o cenário nunca descola do conteúdo.
- **Conteúdo:** nenhum caso real. A pergunta de exemplo é uma das perguntas de partida do formulário; os
  futuros são "Cenário A, B, C" com o tipo (continuidade, transformação, ruptura), sem probabilidade; o
  estado do projeto é o real (`lib/metodo.ts`).
- **Cores:** o escuro `#040506`, as imagens em luz fria e o acento em âmbar dourado `#f2c45a` (o fio, os
  marcos, os pontos e cartões acesos, a pílula e o nome IRIS), o mesmo âmbar da Iris; texto claro da Iris. A landing é sempre
  noturna, mesmo no tema claro. Fonte: Inter (a da interface).
- **Movimento:** o scroll dirige só o mundo (GSAP + Lenis, a única suavização); o texto entra por tempo,
  uma vez. A intro do logo começa no `index.html` (uma vez por visita) e tem failsafe de 3,5 s.
  Com "reduzir movimento": sem intro, sem Lenis, tudo no estado final. Ao sair da landing, ouvintes,
  gatilhos e o Lenis são desfeitos.
- **Dependências:** `gsap@3.15.0` e `lenis@1.3.26`, versões travadas, só no pedaço da landing.

## App refinado como a landing (out/2026)

Só cores e tipografia; o app continua uma ferramenta de trabalho, com tema claro e escuro.

- **Fundo escuro mais próximo da landing:** abismo `#080C12`, institucional `#0F1620`, grafite `#16202C`,
  grafite-alto `#1D2836` (e o mapa um degrau mais escuro). Contraste conferido: texto-3 sobre
  grafite-alto 5,6:1. O tema claro não muda de superfícies.
- **Tipografia:** a serifada saiu. Tudo em Inter; títulos (`font-editorial` com `text-titulo` ou
  `text-manchete`) em peso regular e espaçamento −0,032 em; seções −0,018 em. Substitui a §5 nos títulos.
- **Ouro (`--color-ouro`, `#F2C45A` / `#8A6A00` no claro):** só em detalhes, sem significado — o traço do
  item ativo do menu e a aba selecionada. Ciano
  continua sendo ação e âmbar continua sendo hipótese.
- **Grade do fundo:** a grade de linhas virou uma grade de pontos, como a da landing.

## Desempenho (out/2026)

Medido com quadros por `requestAnimationFrame` e rastros do Chromium. Regras que saíram disso:

- **Sem `backdrop-filter` sobre o que se move.** Desfocar o fundo que rola (cartões da landing, barra de abas
  fixa, painéis sobre o mapa) repinta o desfoque a cada quadro. Use fundo escuro denso; o desfoque fica
  só na pílula da abertura.
- **Sem filtro de desfoque SVG (`feGaussianBlur`) em linhas do mapa.** O halo é um traço largo e
  transparente.
- **Animação de troca de cenário só no que mudou** (a varredura de luz); a máscara do traço cobre só a
  própria linha.
- **Grão de filme sem mesclagem e do tamanho da tela.**

Resultado (Chromium, 1440 × 900): rolar a landing passou de 30 para 60 fps de mediana; trocar de cenário
no mapa, de 30 tarefas longas (até 116 ms) para nenhuma.

### Segunda rodada (out/2026): fluidez em aparelho fraco

Medido no build de produção com a CPU 4× e 6× mais lenta (Chromium), em celular (390 × 844, toque) e desktop
(1440 × 900): quadros por `requestAnimationFrame`, tarefas longas e rastros por tipo de trabalho. Mais regras:

- **Nada da landing repinta durante o scroll.** O fio de luz acende por uma janela que desliza (`.fio-janela`
  e o SVG andam em sentidos opostos, só por transform); `stroke-dashoffset` repintava a faixa inteira (as sete
  imagens com máscara) a cada quadro. As marcas do fio andam num contêiner só; a sombra lateral é um degradê
  fixo três vezes mais largo que desliza (`--dx`), em vez de um degradê que muda de posição.
- **Nada caro no clique.** Os contornos dos países vêm projetados do build (`npm run gerar-mapa` →
  `geo/contornos.json`); a área nova de uma investigação renderiza em segundo plano (`useDeferredValue`), com a
  barra de abas respondendo na hora.
- **Menu lateral por FLIP**, nunca por largura: o layout muda uma vez e menu e conteúdo deslizam por transform
  (`LayoutDoApp`). Por isso o painel lateral da investigação vai num portal: `position: fixed` dentro de um
  elemento com transform deixaria de ser fixo na tela.
- **Rolagem sem medir o DOM.** Quem reage à rolagem usa as próprias entradas do `IntersectionObserver`, sem
  `getBoundingClientRect` em todos os elementos.
- **Canvas de partículas em resolução 1**: os pontos de luz são borrões e o canvas tem até 4× menos pixels.

Resultado (CPU 4×): abrir a landing no celular passou de 1,4 s para 0,23 s de bloqueio, e rolar a landing no
celular ficou sem quadro perdido; recolher o menu, de 22% para 8% de quadros perdidos; abrir o mapa, de um
travão de 370 ms para 67 ms; abrir a timeline, de 233 ms para 100 ms. No desktop, a rolagem da landing ainda
mede quadros longos no ambiente de teste, mas o tempo é do compositor rasterizando em software (o Chromium do
teste não tem GPU); o trabalho do processo principal fica em ~3 ms por quadro.

## Entrar, menu lateral e botões Cristal (out/2026)

- **Entrar** (`pages/autenticacao/Entrar.tsx` sobre `components/ui/sign-in-page.tsx`): página inteira em duas
  colunas, fora da moldura das outras telas de conta. Formulário de vidro (foco em violeta, olho da senha, "Manter
  conectado", "Esqueci a senha", "Criar conta") e, à direita, a imagem de R.I. (`public/recursos/imagens/entrar/plenario.webp`: um plenário de assembleia vazio, com a parede de ouro e um medalhão sem emblema,
  abstrata, gerada por IA no Figma), sem depoimentos. Não há "Continuar com Google": a Iris não tem esse login, e o
  componente só mostra o botão com `onGoogleSignIn`. O envio continua honesto: sem autenticação no servidor, aparece
  "Login ainda não disponível" e o acesso aberto de desenvolvimento.
- **Menu lateral** (`components/layout/MenuDoApp.tsx` sobre `components/ui/dashboard-sidebar.tsx`): a marca no topo
  (a Iris não tem workspaces), Buscar (⌘K), Nova investigação, Base científica, Minhas investigações (com rascunhos e
  "Ver todas"), Favoritos, Configurações (⌘,) e, no pé, o tema, o estado do sistema e "Voltar ao site". No desktop
  recolhe pelo botão do topo (a escolha fica guardada); no celular abre como gaveta. A alça de redimensionar saiu: a
  barra tem 260 px. As cores vêm dos tokens da Iris (`.iris-menu` em `styles/globais.css`), com o traço de ouro no item
  ativo. A busca procura de verdade nos itens e nas investigações, sem ligar para acento.
- **Cristal** (`styles/cristal.css`): a pílula clara com o chip da seta nos botões de começar/entrar da landing e no
  Entrar; o vidro líquido nas ações secundárias da landing ("Ver um exemplo", "Ver a base científica").

## Landing v5 (out/2026): uma IA de relações internacionais

A landing foi refeita no padrão das landings de IA (ChatGPT, Gemini, Manus): título curto, o campo de pergunta no
centro, a interface encenada e o que ela entrega. Substitui o "mundo noturno" (GSAP, Lenis e as imagens geradas, que
saíram do projeto).

- **Paleta:** azul-noite com ouro, as cores da diplomacia (o azul das bandeiras e organizações, o ouro dos selos).
  Tokens próprios em `features/landing/landing.css`, todos dentro de `.lp`: a landing é sempre escura, seja qual for o
  tema do app, e redefine `--color-texto`/`--color-ciano` só para dentro dela (a marca fica clara, com o nó em ouro).
- **Sequência:** herói (selo, título com "futuros" em ouro, texto, campo de pergunta que digita exemplos sozinho,
  atalhos) → o planeta nascendo no horizonte → faixa de temas → "Uma pergunta. Uma investigação inteira." (janela que
  encena a conversa: pergunta, etapas, análise com Fato/Inferência/Hipótese e citações, cenários A/B/C sem
  probabilidade, rede de atores) → recursos (cinco blocos, cada um com uma ilustração animada) → método (as três
  camadas, ligadas por um fio de ouro) → estado do projeto (`config/metodo.ts`) → chamada final → rodapé.
- **Honestidade:** a encenação diz "Ilustração da interface" e mostra a análise como linhas, não como afirmações
  inventadas; nenhum número de marketing; o herói diz que o motor de investigação é a próxima fase; só links para
  páginas que existem. A pergunta escrita vai para `/app?pergunta=…` e entra no campo da conversa sem ser enviada.
- **Movimento:** Motion para as entradas (opacidade e 18 px, em sequência) e para a encenação; CSS para os laços
  curtos (faixa de temas, cursor, ilustrações dos recursos); canvas para o globo. Tudo para fora da tela
  (`data-fora-da-tela` pausa as animações em CSS; o globo para por IntersectionObserver) e respeita "reduzir
  movimento" (globo parado com as rotas acesas, encenação no quadro final, placeholder fixo).
- **Globo:** pontos de terra firme calculados no build (`npm run gerar-globo` → `globo/pontos.json`, 2.376 pontos),
  projeção ortográfica que gira devagar, rotas entre capitais e sedes multilaterais acendendo em ouro. Desenho em
  faixas de brilho (um preenchimento por faixa) e degradês criados uma vez por tamanho: com a CPU 4× mais lenta, a
  rolagem no celular fica em 60 quadros por segundo.

