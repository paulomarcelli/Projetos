# Memória da Sofia

Leia inteira no começo de cada tarefa. No fim, acrescente o que aprendeu em **Regras aprendidas** e uma linha no
**Registro de tarefas**. Este repositório é **público**: nada de e-mail, telefone, senha, chave ou outro dado pessoal
aqui.

## O projeto

- Repositório **Projetos** do Paulo: um projeto por pasta em `Projetos/<nome>/`, cada um com `README.md` (alguns com
  `CLAUDE.md` e `docs/`). O `README.md` da raiz tem um cartão por projeto, com capa em `docs/capas/<projeto>.webp`
  (960 × 540).
- **Publicação:** `.github/workflows/pages.yml` publica os sites no GitHub Pages a cada push na `main`
  (`https://paulomarcelli.github.io/Projetos/`). Projeto novo, ou pasta nova que um site carrega, precisa entrar na
  lista de cópia desse workflow.
- Projetos em Vite usam `base: './'` (caminhos relativos), porque o Pages publica numa subpasta.
- `PARA-A-PROXIMA-IA.md` (na raiz) é a passagem de trabalho geral: leia quando precisar de contexto de outro projeto.
- Skills do repositório em `.claude/skills/` (a sua é a `design-skills`); agentes em `.claude/agents/`; o time em
  `agentes/README.md`.

## O Paulo

- Fala português (Brasil) e gosta de texto **humano**: frases curtas, sem fórmula de IA, sem "Não é X, é Y".
- Gosta de ver o resultado: mande capturas de tela, não só descrição.
- Faz posts no **Substack** sobre os projetos (calendário no Notion). Cada post tem uma cara: não repete abertura,
  intertítulos, subtítulo nem fechamento dos anteriores.
- Pediu para **não mexer no Notion** sem pedido explícito (o espaço dele fica como está).
- Usa o Figma com o plano dele; gerar imagem no Figma gasta créditos: peça antes.

## Projetos de design que você já fez (para manter a linguagem)

| Projeto | Pasta | Linguagem |
|---|---|---|
| Sofia Carson · a voz (fã-site) | `Projetos/Sofia-Carson/` | Modelo Lusco: filme preso atrás da página, folha cor de osso com furos, preto e branco com grão, Geist e Geist Mono. Design system no Figma: arquivo `41SYetZSfkGCyXrWKMkLl1` (Capa, Fundamentos, Componentes, Telas desktop, Telas celular). |
| E Se, Hein? (vídeos) | `Projetos/E-Se-Hein/` | Mundo 3D de brinquedo low-poly, câmera contínua, legenda de uma palavra em Rubik Black 112 com contorno tinta, rótulos (pílula, seta, texto preso, cartão) e fechamento laranja. Design System no Figma: arquivo `okTGRiK8lTEXSoP9QDm0du` (Capa, Fundamentos, Componentes, Personagem, Fechamento, Storyboard · Lua); documento em `docs/design-system.md` + `docs/tokens.css` e `tokens.json`. Logo definitiva (conceito A, "E?") no arquivo `tQIfaeQgkOZhwh60i6Y5fH`. |
| Escritório do Paulo | `Projetos/Escritorio-do-Paulo/` | Escritório escuro com a cor nos estados; mapa em pixel art visto de cima e figurinhas da equipe no estilo sticker (cabeça grande, contorno branco). Barlow Condensed, Geist e Geist Mono. Design System no Figma: arquivo `JFyZCMHbS1ASDzSdbGu6pC` (Capa, Fundamentos, Componentes, Ambiente e personagens, Telas); documento em `docs/design-system.md`. |
| Karol × Samsung | `Projetos/landing page Karol Sevilla x Samsung/` | Landing 3D com Three.js, GSAP e Lenis; um único celular desenhado em código que acompanha a rolagem. |
| HELA (dashboard) | `Projetos/HELA/` | Preto profundo, esmeralda e neon tóxico, prata fria; sem azul e sem roxo. Sora, Inter e JetBrains Mono. Logo Sinapse (H com neurônio). Cérebro holográfico em casca de pontos. Design System no Figma: arquivo `g75vqhm98nU8bh2DyWrwrY` (Capa, Marca, Fundamentos, Componentes, Telas, Cérebro 3D); documento em `docs/design-system.md` + `docs/tokens.css` e `tokens.json`. |

**Referência de estilos:** a folha [Referências · Design systems](https://www.figma.com/design/tQ7hPXebEj84uV385CQ37X) (Figma `tQ7hPXebEj84uV385CQ37X`) tem cinco estilos (inspirados em Anthropic, Duolingo, Vercel, Notion e Linear), a comparação com "use quando…" e a coleção de variáveis **Tema**, com um modo por estilo. Consulte antes de propor a direção de um projeto novo. Relatório: `agentes/relatorios/sofia/2026-11-15-referencias-design-systems.md`.

## Regras aprendidas

- **14/11/2026 · Pedido do Paulo: Figma primeiro e Design System obrigatório.** O Figma é a ferramenta principal. Todo
  projeto de interface começa com a criação ou a atualização do Design System, documentado em
  `Projetos/<projeto>/docs/design-system.md` e entregue à Karol. Sem Figma disponível, dizer isso e não
  fingir.
- **17/11/2026 · Pedido do Paulo: sempre o Figma.** Todo trabalho da Sofia passa pelo Figma, inclusive logo, capa e
  revisão de cenário: o resultado final fica num arquivo do Figma, com vetores editáveis, e o link vai na entrega. Se
  um pedido disser para dispensar o Figma, confirme antes com o Paulo. A proibição é só gastar créditos (Weave e
  geração de imagem), não usar o Figma.
- **14/11/2026 · Figma nas execuções pelo painel.** Quando a tarefa roda pelo Escritório (`claude -p`), o Figma pode
  aparecer como "precisa de autorização". Confira antes de prometer.

- **14/11/2026 · Pedido do Paulo: sempre a `design-skills`.** Toda tarefa, grande ou pequena, começa pela skill
  `design-skills`; o relatório diz quais partes dela foram usadas.

- **14/11/2026 · Furo e camadas (Lusco).** O furo é um bloco transparente com `box-shadow: 0 0 0 300vmax` cor de osso
  numa seção com `overflow: hidden; isolation: isolate`. **Nenhum contêiner que guarda o furo pode ter `z-index`**: senão
  ele vira outra camada e a sombra cobre o texto que vem antes. Isso deixou o manifesto e o título "Palco e estúdio"
  invisíveis no ar até alguém tirar print. Sempre confira com captura depois de rolar devagar.
- **14/11/2026 · Texto sob a nav transparente.** Texto que passa por baixo da nav sobre o filme (cantos do hero,
  aberturas) some por marco (`.is-sob`), nunca por scrub.
- **14/11/2026 · Capturas com rolagem.** Pular direto com `scrollTo` engana as entradas por marco; role em passos
  (≈ 40 px) e espere ~2,5 s antes do print.
- **Figma · texto.** Carregue a fonte (`loadFontAsync`) antes de qualquer mudança em texto.
- **Figma · auto-layout.** Linha ou cartão com altura fixa corta o texto: use `layoutSizingVertical = 'HUG'`. Na página
  Fundamentos do design system da Sofia, os nomes dos estilos e os cartões de regras estavam cortados por isso
  (corrigido em 14/11/2026).
- **Figma · imagem em instância.** Para foto 4:5 obedecer ao tamanho do quadro, trave a proporção
  (`lockAspectRatio()`) na imagem do componente.
- **Responsivo.** Teste 320, 375, 390, 768, 1024, 1280, 1920 e 2560 px e o celular deitado. Em 320 px, menu com três
  links e botão cabe só se o botão encurtar ("Entrar").
- **Fã-site.** O aviso "projeto de fã, sem vínculo" fica; formulário de fã não envia nem guarda dado. Fato sem fonte
  confiável fica de fora (ex.: "SC2" e o single "Her" da Sofia Carson, em 14/11/2026).
- **Material pago** (guias, prompts e prints de modelos comprados, como o Lusco) fica fora do repositório público
  (`.gitignore` do projeto).
- **15/11/2026 · Texto sobre filme: medir em vários planos.** Uma captura só engana: o contraste do texto claro sobre o
  filme muda a cada plano. Esconda o texto, recorte a tela atrás dele e meça a luminância em 6 momentos (script em
  `agentes/relatorios/sofia/2026-11-15-sofia-carson/captura.cjs`). No fã-site da Sofia Carson a nav caiu a 3,5:1 e a
  pílula de contorno a 2,4:1 no plano claro.
- **15/11/2026 · Filme de fundo pede pausa.** Vídeo em loop sem controle reprova a WCAG 2.2.2. Todo Design System com
  filme de fundo já nasce com o componente "Pausar o filme".
- **15/11/2026 · Foco em cada superfície.** Anel de foco em `currentColor` some quando a pílula cheia fica sobre o
  filme escuro. Teste o Tab com captura sobre o filme e sobre a folha.
- **15/11/2026 · Capturas pelo painel.** O Playwright fica em `/opt/node-tools` e abre o site no ar sem configuração
  extra; o vídeo toca. Escreva os scripts com a ferramenta de arquivos (o terminal bloqueia heredoc e `$(...)`). PNG
  de revisão pesa: 114 capturas deram 38 MB; converta ou suba só as folhas de contato.
- **15/11/2026 · Sofia Carson sem `docs/design-system.md`.** O Design System está só no Figma e no README. Criar o
  documento quando o Figma estiver autorizado.

- **15/11/2026 · Figma: `createAutoLayout` nasce com fundo branco.** Todo quadro interno (campo, linha de botões) precisa de
  `fills = []`, senão aparece um retângulo branco no tema escuro. Escondeu o botão secundário no modo Linear.
- **15/11/2026 · Figma: fonte por variável funciona.** Variáveis STRING com escopo `FONT_FAMILY` e `FONT_STYLE` trocam
  a fonte junto com o modo, desde que o estilo (ex.: "Medium") exista em todas as famílias dos modos e todas estejam
  carregadas.
- **15/11/2026 · Arquivos de design system se contradizem.** Compare a seção Componentes com Fundos e Faça antes de
  desenhar (cartão branco × cor da página, contorno de 1 × 2 px) e registre a escolha no relatório.
- **15/11/2026 · `query()` do Figma não aceita acento no seletor.** `[name=Ações]` dá erro: filtre por `children` e
  `name ===`.

- **16/11/2026 · Planta de referência: alinhar antes de medir.** Para copiar uma planta (ou layout) em outra escala,
  alinhe a imagem nova sobre a de referência com OpenCV (SIFT + `estimateAffinePartial2D`) e meça nas coordenadas do
  arquivo. Depois compare o cenário com a planta lado a lado e em mistura (50%), e desenhe a rede de caminhos por
  cima para ver móvel no caminho. No mapa do Escritório, o canvas capturado muda de escala (3× ou 5×): use
  `largura / 480`.
- **16/11/2026 · Mapa do Escritório.** Ponto de lazer = pés da agente; ela ocupa 14 × 22 px acima do ponto. Móvel que
  muda de lugar leva junto o ponto de lazer. O vão de porta precisa de piso, senão aparece o fundo da cidade.


- **17/11/2026 · Figma: `figma.group` e opacidade.** No helper `R(par,nome,x,y,w,h,cor,raio,opacidade)` passei a opacidade
  na posição do raio e a água ficou opaca, escondendo os corais. Use objeto de opções ou confira a ordem dos
  argumentos. Opacidade dentro da pintura ligada a variável (`{...paint, opacity}`) não pegou: use `node.opacity`.
- **17/11/2026 · Figma: SVG com traço aberto.** Vetor criado por `createNodeFromSvg` pode vir com o traço alinhado por
  dentro, e linha aberta some. Ponha `strokeAlign = 'CENTER'` em todo vetor com traço.
- **17/11/2026 · Figma: modos de variável no storyboard.** Desenhar a cena ligada às variáveis e pôr o modo no quadro
  (`setExplicitVariableModeForCollection`) mostra Dia, Noite e Breu com o mesmo desenho. Gradiente aceita variável na
  parada (`boundVariables.color` em `gradientStops`).
- **17/11/2026 · Vídeo vertical.** Zonas que a interface cobre (pior caso TikTok, Reels e Shorts): topo 0 a 210, base
  1420 a 1920, direita x 900 a 1080 entre y 700 e 1420. Legenda de uma palavra precisa encolher pela largura real:
  em 112 px, palavras com mais de 11 letras passam de 720 px.
- **17/11/2026 · Verde de rótulo.** `#2FB24A` com texto branco dá 2,8:1; `#1A8F3F` dá 4,2:1.

- **18/11/2026 · Figma: seções novas na mesma página.** Calcule o Y da próxima seção depois de terminar a anterior
  (`fim(secao)`), não uma vez no começo: as 5 primeiras seções de componentes da HELA nasceram empilhadas no mesmo ponto.
- **18/11/2026 · Figma: anel de foco por sombra.** Sombra com `spread` (anel de foco) só aparece se o quadro tiver
  `clipsContent = true` e um preenchimento. Botão fantasma em foco precisa de fundo (use a cor do painel).
- **18/11/2026 · Figma: o que a instância não aceita.** Dentro de instância não dá para mudar o tamanho de um
  retângulo, girar, nem inserir filho; filho novo no componente principal pode não chegar a uma instância já criada.
  Barra proporcional: gradiente de parada dura com as paradas ligadas às variáveis. Variação de ícone ou glifo: deixe
  as camadas escondidas no componente desde o começo.
- **18/11/2026 · Figma: propriedade de texto em variantes.** Ligar uma propriedade TEXT apaga o texto próprio de cada
  variante (o "sem resposta" do status Parado virou "p95 84 ms"). Texto que muda por variante fica sem propriedade.
- **18/11/2026 · Figma: números.** `toLocaleString('pt-BR')` não formata no plugin; use regex para o ponto de milhar.
- **18/11/2026 · Figma: erro desfaz tudo.** Um `use_figma` que dá erro não deixa nada pela metade (conferido). Mesmo
  assim, leia a página antes de repetir.
- **18/11/2026 · Figma: nuvem de pontos.** 4 mil pontos cabem em 4 vetores: codifique x e y com 3 dígitos cada (6
  caracteres por ponto) e monte os quadradinhos no `vectorPaths` dentro do script. Passou dos 50 mil caracteres? Corte
  a camada de fundo pela metade.
- **18/11/2026 · Paleta sem azul e sem roxo.** O validador da `dataviz` reprova verde neon e prata na faixa de
  luminosidade e no croma mínimo, mas a separação para daltonismo passa (ΔE 10,4). Registre a exceção e exija forma e
  rótulo junto da cor.
- **18/11/2026 · Logo: o conceito antes do kit.** A `logo-design` para nos conceitos; como subagente, entregue os
  conceitos com a recomendação e as variantes essenciais e deixe o kit completo para depois da escolha do Paulo.

- **21/11/2026 · Especialização 3D no Blender.** O pacote arjun988/blender-skills (v1.3.0, MIT) está em
  `.claude/skills/`; comece pela `blender-director`. Avalie antes se a tarefa pede 3D: interface simples fica no Figma.
  O Blender complementa o Figma e o Design System, nunca substitui. Sem o Blender MCP conectado, use o Blender sem janela
  por script e diga isso no relatório.

## Registro de tarefas

Uma linha por tarefa. Resultado: **perfeito** (sem retrabalho), **com ajustes** (o Paulo pediu mudança) ou **falhou**.

| Data | Pedido | Resultado | Tempo | Custo | O que melhorar |
|---|---|---|---|---|---|
| 14/11/2026 | (criação da Sofia; nenhuma tarefa ainda) | — | — | — | — |
| 15/11/2026 | Design System do Escritório do Paulo no Figma (feito seguindo este arquivo, antes da Sofia rodar como agente) | com ajustes (cartões e rótulos cortados na primeira captura, corrigidos) | — | — | Conferir a captura de cada página antes de entregar; auto-layout com largura fixa corta texto. |
| 15/11/2026 | T-0001 · Análise de design do fã-site Sofia Carson · a voz (só análise, com capturas do site no ar) | aguardando o retorno do Paulo | cerca de 1 h | — | Figma sem autorização: não deu para comparar com o Design System. Faltou Safari, Firefox e aparelho de verdade. |
| 15/11/2026 | Folha Figma "Referências · Design systems" com 5 estilos, comparação e coleção Tema (5 modos) | aguardando o retorno do Paulo | cerca de 1 h | sem créditos de IA | Primeira captura do teste de tema mostrou fundo branco nos quadros internos; já criar quadros com `fills = []`. |
| 16/11/2026 | Corrigir o apartamento da Monica e da Rachel no mapa (paredes, cozinha, móveis, caminhos) a partir da planta | aguardando o retorno do Paulo | cerca de 1 h 30 | — | Alinhar a planta com OpenCV logo no começo: medir no olho custou tempo. |
| 17/11/2026 | Design System dos vídeos do E Se, Hein? no Figma (tokens em 3 modos, legenda, zonas seguras, rótulos, personagem, fechamento, storyboard da Lua) + `docs/design-system.md` e logo definitiva no arquivo da logo | aguardando o retorno do Paulo | cerca de 3 h (com uma pausa por limite de uso) | sem créditos de IA | Conferir a ordem dos argumentos dos helpers antes de desenhar 8 quadros; 4 defeitos vieram de opacidade e traço. |
| 18/11/2026 | HELA: identidade (3 conceitos de logo, Sinapse recomendado) e Design System do dashboard no Figma (136 variáveis, 30 componentes + 16 ícones, 5 telas 1440 × 900, guia do cérebro 3D) + `design-system.md`, tokens, capturas e SVGs | aguardando o retorno do Paulo | cerca de 4 h (com uma pausa por limite de uso) | sem créditos de IA | Calcular a posição de cada seção ao criá-la; testar a instância (tamanho, rotação) antes de desenhar componente que dependa disso. |
