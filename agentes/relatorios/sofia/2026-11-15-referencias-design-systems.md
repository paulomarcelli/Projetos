# Referências · Design systems (folha no Figma)

**Figma:** [Referências · Design systems](https://www.figma.com/design/tQ7hPXebEj84uV385CQ37X) (rascunhos do Paulo, página "Referências")

## 1. Pedido

Analisar cinco design systems inspirados em sites conhecidos (Anthropic, Duolingo, Vercel, Notion, Linear) e reunir
todos numa folha do Figma, para consulta em projetos futuros.

## 2. A ideia

**Cada estilo fala com a própria voz.** Cada prancha usa o fundo, as fontes e as cores do próprio estilo, e o que é
comum (comparação e tema) fica em pranchas neutras, em branco, com Inter e JetBrains Mono.

Partes da `design-skills` usadas e o que cada uma mudou:

| Parte | O que mudou no resultado |
|---|---|
| `design-system` | Organizei em três camadas: as amostras de cor são os valores crus; a coleção **Tema** é a camada de uso (fundo, cartão, texto…); o **Cartão de tema** é a camada de componente, sem nenhum valor fixo. |
| `design-token` | Nomes no padrão `categoria/uso` (`cor/fundo`, `raio/cartao`), escopo certo em cada variável (preenchimento, texto, contorno, raio, espessura, família, peso), descrição de uso e sintaxe CSS (`var(--cor-fundo)`). |
| `theming-system` | Um modo por estilo e nenhum componente duplicado: o tema muda só no modo. Isso me fez acrescentar `cor/texto-no-acento` (o limão do Linear pede texto escuro), `fio/espessura` (o Duolingo usa 2 px) e as variáveis de fonte. |
| `typography-scale` | Cada espécime mostra uso, família, peso e tamanho, com entrelinha justa (100 a 110%) nos títulos e 150% no corpo, e espaçamento negativo nos títulos grandes. Os pesos 450, 510 e 590, que não existem como estilo no Figma, estão anotados. |
| `critique-color` | Medi o contraste de todos os pares. Isso gerou a seção "Leitura e contraste" em cada prancha, a linha "Cuidado com" na comparação e a troca do texto pequeno de apoio na Anthropic (#87867f → #6d6c66) e no Duolingo (#777777 → #737373). |
| `critique-typography` | Na conferência: nenhum texto cortado, rótulos alinhados, o "✓" da Vercel não fica mais sozinho numa linha e cada prancha usa só as famílias do próprio arquivo. |

Também usei as skills do Figma `figma-use`, `figma-generate-library` e `figma-generate-design`.

## 3. O que mudou

Arquivo novo no Figma, página **Referências**:

| Quadro | Onde | O que tem |
|---|---|---|
| Capa | topo | Título, como ler a folha e o aviso "inspirado em, sem vínculo". |
| Prancha · Anthropic, · Duolingo, · Vercel, · Notion, · Linear | fileira do meio, 1280 × 3086 cada | Nome e frase-resumo; fundos e acentos com nome, HEX e uso; espécimes de tipo; botão principal, botão secundário, campo, cartão e peças próprias de cada estilo; Faça e Evite; Movimento; Leitura e contraste. |
| Comparação | embaixo, à esquerda | Tabela com claro ou escuro, temperatura da cor, onde fica o acento, serifa, raio, sombra, personalidade, "use quando…" e "cuidado com". |
| Tema em teste | embaixo, à direita | O componente **Cartão de tema** nos cinco modos e o componente principal. |

Variáveis: coleção **Tema** com 5 modos (Anthropic, Duolingo, Vercel, Notion, Linear) e 15 variáveis: `cor/fundo`,
`cor/cartao`, `cor/texto`, `cor/texto-suave`, `cor/acento`, `cor/texto-no-acento`, `cor/fio`, `raio/botao`,
`raio/cartao`, `fio/espessura`, `fonte/titulo`, `fonte/titulo-estilo`, `fonte/texto`, `fonte/ui`, `fonte/ui-estilo`.
O componente usa as 15 (53 ligações conferidas por script).

Peças próprias de cada estilo: botão "aba de fichário" (Anthropic); etiqueta adesivo e realce de conquista (Duolingo);
janela de terminal e pílula do menu (Vercel); pílula no título, bloco amarelo e bloco azul-noite (Notion); atalho,
etiquetas e moldura do produto (Linear).

## 4. Capturas

Em `agentes/relatorios/sofia/2026-11-15-referencias-design-systems/`:

- `visao-geral.webp`: a página inteira
- `anthropic.webp`, `duolingo.webp`, `vercel.webp`, `notion.webp`, `linear.webp`: as cinco pranchas
- `comparacao.webp`: a prancha de comparação
- `tema-em-teste-antes.webp` e `tema-em-teste.webp`: o teste de tema antes e depois da correção (o fundo branco
  escondia o botão secundário no modo Linear)

## 5. Conferido em

- Captura de cada prancha pelo Figma (`get_screenshot`), depois de cada etapa e depois de cada correção.
- Script: 5 instâncias do componente, cada uma com o próprio modo; 15 variáveis ligadas.
- Fontes: as seis famílias pedidas (Source Serif 4, Inter, JetBrains Mono, Nunito, Geist, Geist Mono) carregaram no
  Figma; nenhuma precisou ser trocada.
- Contraste: calculado pela fórmula da WCAG 2.x para 33 pares (tabela abaixo).
- Sem navegador, sem build: a entrega é só no Figma.

## Os cinco estilos, nas minhas palavras

- **Anthropic.** Uma revista de pesquisa em papel cru. A serifa carrega o texto inteiro, a sem serifa fica só na
  interface, não há sombra, e um terracota marca a única ação que importa. Passa calma e seriedade.
- **Duolingo.** Um livro infantil. Branco, títulos redondos e gordos em verde, botões com contorno grosso que parecem
  adesivos. Tudo chapado, e o movimento tem mola. Passa alegria e incentivo.
- **Vercel.** Um terminal impresso. Preto, branco e cinza, títulos grandes e leves, etiquetas em letra de máquina, fio
  de 1 px no lugar da sombra. A única cor é o verde do "✓". Passa precisão.
- **Notion.** Um caderno sob a luz da tarde. Fundo creme, cartões brancos com fio fino, um azul só no botão, e cor viva
  em pílulas e blocos, como post-its. Passa organização com simpatia.
- **Linear.** Um painel de comando à noite. Quase preto em degraus, letras brancas em peso médio e um verde-limão num
  só botão. A imagem é sempre o produto. Passa foco e velocidade.

## Comparação

| | Anthropic | Duolingo | Vercel | Notion | Linear |
|---|---|---|---|---|---|
| Claro ou escuro | Claro (pergaminho) | Claro (branco) | Claro (gelo) | Claro (creme) | Escuro (quase preto) |
| Temperatura | Quente, terra | Quente e saturada | Neutra | Quente, com pontuação viva | Fria, com limão |
| Único acento | Argila no botão principal | Verde no botão e títulos; azul em links | Verde só no ✓; botão quase preto | Azul no botão; pílula pêssego | Limão num botão e na aba ativa |
| Serifa | Sim, títulos e texto | Não (Nunito) | Não (Geist) | Só na frase de abertura | Não (Inter) |
| Raio | 8 / 24 px | 12 px | 6 px | 8 / 12 px | 6 / 12 px |
| Sombra | Nenhuma | Nenhuma | Nenhuma | Nenhuma | Nenhuma |
| Personalidade | Editorial, calmo | Lúdico, alegre | Técnico, enxuto | Amigável, organizado | Focado, premium |

**Use quando…**

- **Anthropic:** texto longo que pede confiança: ensaio, relatório, estudo, consultoria, os posts do Substack.
- **Duolingo:** projeto que ensina, motiva ou é jogo: app de estudos e revisão, quiz, gamificação, público jovem.
- **Vercel:** ferramenta de quem programa: documentação, painel técnico, landing de software, portfólio de código.
- **Notion:** produtividade com tom leve: notas, agenda, organização pessoal, site de serviço próximo do cliente.
- **Linear:** painel que fica aberto o dia todo: SaaS, gestão de tarefas, o próprio Escritório do Paulo.

## Contraste (critique-color)

| Estilo | Par | Contraste | Nota |
|---|---|---|---|
| Anthropic | branco no argila #d97757 | 3,1:1 | reprova texto pequeno; usar #c4522c (4,6:1) ou texto ardósia (5,9:1) |
| Anthropic | texto suave #87867f no pergaminho | 3,2:1 | na folha uso #6d6c66 (4,5:1) |
| Duolingo | branco no verde #58cc02 | 2,1:1 | reprova até texto grande; usar #398501 (4,6:1) |
| Duolingo | azul #1cb0f6 / verde no branco | 2,4:1 / 2,1:1 | links em #077db4 (4,6:1) |
| Vercel | fio #ebebeb no gelo; exemplo #a8a8a8 | 1,1:1; 2,4:1 | borda mais forte no foco; exemplo #737373 (4,7:1) |
| Notion | azul no azul clarinho | 4,05:1 | texto em #006dcf (4,6:1) |
| Linear | fio #23252a; branco na íris #6366f1 | 1,3:1; 4,47:1 | anel de foco de 2 px; etiqueta no limite |

Em comum: o contorno do campo fica abaixo de 3:1 nos cinco estilos. Em qualquer projeto que nascer daqui, o campo
precisa de uma borda mais forte no foco.

**Separando os problemas:**

- **Visual:** os pares acima são dos próprios arquivos, e as pranchas os mostram como são. As correções ficam como
  sugestão.
- **Conteúdo:** os arquivos se contradizem em três pontos (abaixo), e eu escolhi um lado em cada um.
- **Código:** nada foi implementado; não há código nesta entrega.

## 6. Ficou de fora ou foi substituído

- **Pesos sem estilo no Figma:** Geist 450 → Regular; Inter 510 → Medium; Inter 590 → Semi Bold. Anotado em cada
  prancha.
- **Contradições dos arquivos:**
  - **Notion e Vercel:** o componente diz que o cartão tem o mesmo fundo da página, mas os fundos e o "Faça" dizem
    que ele é branco. Usei branco.
  - **Duolingo:** o componente diz contorno de 1 px no secundário, mas o "Faça" pede 2 px. Usei 2 px. O raio do
    cartão não é dito; usei 12 px.
  - **Anthropic:** os cantos de 8 px e a "aba de fichário" (só os cantos de baixo) aparecem os dois, como peças
    separadas.
- **Componente de teste:** usa `cor/fio` no contorno do botão secundário. Na Anthropic o arquivo pede #87867f, então
  o teste fica um pouco mais claro que o original.
- **Ilustrações, fotos e logos:** não usei nenhuma. Sem logos por regra, e gerar imagem gastaria créditos.
- **Tentativa anterior:** o Figma MCP não lista os rascunhos. Não achei nenhum registro local de um arquivo com esse
  nome e criei um novo. Se existir um duplicado de uma tentativa interrompida, ele precisa ser apagado à mão (eu não
  apago sem aprovação).
- Os cinco `.md` de origem não foram copiados para o repositório.

## 7. Próximos passos

1. **(Alta)** Se um projeto adotar um destes estilos, criar o Design System dele a partir da prancha, já com as
   correções de contraste e um estado de foco forte no campo.
2. **(Média)** Acrescentar estados (hover, foco, desativado) ao Cartão de tema e transformar os botões em componentes
   com variantes.
3. **(Média)** Publicar a coleção Tema como biblioteca, se o Paulo quiser usá-la direto em outros arquivos.
4. **(Baixa)** Uma versão celular (390 px) de cada prancha, para ver como os títulos grandes se comportam.
