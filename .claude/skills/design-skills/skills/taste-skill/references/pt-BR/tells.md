# Cacoetes: o registro datado

Um cacoete é um recurso que faz uma página parecer gerada. Cacoetes não são design ruim em si; a maioria
começou como boa ideia em sites bons. Viraram cacoetes por serem produzidos por padrão, em todo lugar,
sem motivo. É por isso que este registro é datado, e por isso ele nunca indica uma fonte, cor ou
componente substituto: toda lista publicada de "use isto no lugar" virou a próxima onda de cacoetes em
poucos meses. As substituições aqui são procedimentos (sortear da biblioteca, derivar do assunto), não produtos.

O `scripts/inspect.mjs` e o `scripts/lint.mjs` detectam a maior parte das entradas. Situação:
**proibido** quer dizer que o inspetor reprova a página; **alerta** quer dizer que ele a sinaliza e
você precisa de um motivo.

## Sumário

1. Primeira onda (2023–2024)
2. Segunda onda (2025)
3. Terceira onda (2025–2026): a "correção" que virou o visual
4. Moda de galeria, proibida como estilo da casa
5. Cacoetes de estrutura
6. Cacoetes de copy
7. Cacoetes de movimento
8. Por que tirar não basta

## 1. Primeira onda (2023–2024)

| Cacoete | Situação | Faça no lugar |
| --- | --- | --- |
| Gradientes violeta / índigo no hero, nos botões e nos brilhos | proibido | A paleta sorteada; cor chapada |
| Texto da headline preenchido com gradiente | proibido | Tinta sólida |
| Painéis de vidro: desfoque de fundo, cards translúcidos | alerta (2 ou mais) | Superfícies opacas, a um degrau de tom do fundo |
| Botão "Comece agora" com brilho ou gradiente | proibido | Botão chapado, com o nome da ação |
| Sombra cinza suave embaixo de cada card | proibido | Degrau de tom, ou nenhuma caixa |
| Três cards de recurso idênticos, cada um com um ícone num quadrado arredondado | proibido | A planta de seção sorteada |
| Emoji como ícone ou marcador de lista | proibido | Palavras, ou uma imagem de verdade |
| Headline centralizada, subtítulo, dois botões, captura de tela embaixo | sem regra; o sorteio evita | O hero sorteado |
| A mesma fonte em toda página gerada | alerta (lint: default-font) | O sistema tipográfico sorteado |

## 2. Segunda onda (2025)

| Cacoete | Situação | Faça no lugar |
| --- | --- | --- |
| Chapéu (eyebrow, o rótulo acima do título): rótulo minúsculo em caixa-alta espaçada acima de cada título | proibido | Incorpore ao título, ou apague |
| Selo em pílula acima da headline do hero ("Novo", "Beta", "Apresentamos") | proibido | Diga isso na frase de apoio |
| Uma palavra da headline em serifada itálica, em cor ou sublinhada | alerta | Uma fonte, uma cor |
| Grid bento de blocos arredondados como seção de recursos | alerta como fileira de cards | Uma seção composta; blocos só na direção de blocos densos, preenchidos, com tamanhos rígidos |
| Fundo quase preto com uma cor de destaque neon e um brilho | proibido via sombra, gradiente | Uma paleta escura sorteada, sem brilho |
| Navegação flutuante em pílula arredondada com desfoque | alerta | Uma barra simples |
| Hero de dashboard falso feito de barras cinza e gráficos de rosca | sem regra; veja imagery.md §7 | Um trecho de interface real, ou nenhuma imagem |
| Ponto de status decorativo ("Disponível para projetos", "ao vivo" pulsando) | lint: bounce | Tire |
| Fade com subida em todas as seções | sem regra; veja motion.md | Um movimento-assinatura |

## 3. Terceira onda (2025–2026): a "correção" que virou o visual

O remédio publicado para as duas primeiras ondas foi "esquente e deixe com cara editorial". Os modelos
adotaram o remédio por inteiro, e hoje ele é o visual gerado mais reconhecível de todos.

| Cacoete | Situação | Faça no lugar |
| --- | --- | --- |
| Fundo creme-amarelado + cor de destaque terracota / ferrugem / argila | proibidos juntos; terracota proibida sozinha; creme em alerta | A paleta sorteada. Calor de uma pedra de croma baixo, uma tinta profunda, uma fotografia ou um campo quente inteiro |
| Serifada display de alto contraste ou suave como atalho para o "premium" | sem regra | O sistema tipográfico sorteado, seja qual for a classe dele |
| Headline serifada itálica gigante | sem regra | Como sorteado |
| Fantasia de jornal: fios finíssimos por todo lado, raio zero, colunas densas | proibido via hairline | Estrutura feita de espaço e tom |
| "Field notes", "Quietly trusted by", "On our desks" ("Bastidores", "A escolha discreta de", "Na nossa mesa"): rótulos performáticos | lint: copy | Nomes de seção simples |

## 4. Moda de galeria, proibida como estilo da casa

Estes estão em alta nos sites premiados agora. No estudo eles aparecem *mais* nos sites de nota alta do
que nos fracos (observações do painel: rótulos em mono 44% contra 24%, numeração de índice 38% contra
21%; fios finos medidos 61% contra 52%). Mesmo assim são proibidos aqui, por decisão do autor: são as
primeiras coisas que um gerador copia da galeria, não levam informação nenhuma, e uma página feita sem
eles tem de achar uma estrutura de verdade.

| Cacoete | Situação | Faça no lugar |
| --- | --- | --- |
| Microrrótulos em monoespaçada, mono como voz "técnica", legendas em mono | proibido | A fonte de texto; algarismos tabulares para dados |
| Numeração de índice: 01 / 02 / 03, (001), "Passo 02", marcadores de seção numerados | proibido | Ordene pela posição, pela escala ou pelas palavras; `<ol>` quando for de fato uma lista |
| Fios finos: fios divisórios finíssimos, grids riscados, caixas e blocos contornados em 1px | proibido (caixas: 3 ou mais) | Espaço, degraus de tom, formas preenchidas, uma barra grossa se a ideia for uma barra |
| Chrome (barras, bordas e controles) de ferramenta de design como enfeite: miras, marcas de corte, alças de seleção, guias tracejadas, réguas | proibido via hairline, dashed | Tire |
| Micrometadados de agência: hora local, coordenadas, clima, carimbos de versão, "©2026 — Role", sequências com ponto médio | lint: copy; micro-label | Tire |
| Legendas minúsculas em caixa-alta espaçada espalhadas pela tela | proibido (3 ou mais) | Só a inicial maiúscula, em tamanho legível, junto do conteúdo que descrevem |

As maiúsculas minúsculas espaçadas são o único item deste grupo que os dados também condenam: 16% dos
sites de nota alta contra 57% dos fracos.

## 5. Cacoetes de estrutura

| Cacoete | Situação | Faça no lugar |
| --- | --- | --- |
| Headline como frase inteira em tamanho display, em três ou quatro linhas | proibido (mais de duas linhas) | Um título de umas cinco palavras; o resto vai embaixo |
| Ordem de seções batida: hero, logos, recursos, depoimento, preços, CTA | sem regra; veja copy.md §1 | A ordem do argumento |
| Todas as seções da mesma família de layout | critique.md leitura 9 | Uma composição diferente por seção, da ficha |
| Tudo centralizado | alerta acima de 72% | Ancorado à esquerda, um momento centralizado |
| Um raio de borda médio (12–16px) em tudo | nenhuma | Quadrado ou totalmente redondo, escolhido uma vez |
| Nove tamanhos de fonte quase iguais | alerta acima de 9 | Cinco tamanhos, bem distantes entre si |
| Prova social inventada: logos, depoimentos, fileiras de estrelas, "mais de 10.000 equipes" | copy.md §5 | Prova real, ou nenhuma |
| Texto ou uma caixa de CSS onde devia haver uma imagem | teto em critique.md | Uma imagem de verdade, ou um design que não precise de nenhuma |

## 6. Cacoetes de copy

Sinalizados pelo `lint.mjs`: os verbos e adjetivos do gênero (unlock, supercharge, seamless, elevate,
effortless, cutting-edge, all-in-one …); a correção ("não é só X, é Y"); headlines em trinca; "Get
started" e "Learn more" como rótulo; mais que um punhado de travessões; lorem ipsum. Veja `copy.md` §6.

## 7. Cacoetes de movimento

O mesmo fade com subida em todo bloco; uma dúzia de entradas em cascata no hero; card que levanta no
hover, em todos; easing com quique; loops infinitos que não querem dizer nada; revelações que falham e
deixam uma faixa em branco. Veja `motion.md` §9.

## 8. Por que tirar não basta

Uma página da qual se tirou todo cacoete sem pôr nada no lugar é uma página vazia e bem-comportada, e
isso também é um cacoete (a "estética da evitação": qualquer um adivinharia a página a partir da
categoria mais a lista do que evitar). Os cacoetes estavam tapando o buraco onde devia haver uma ideia.
A ordem de trabalho do `SKILL.pt-BR.md` existe para tapar esse buraco primeiro: a ideia vinda do assunto, a
composição sorteada, imagens de verdade ou uma tipografia assumida, e só depois as checagens.
