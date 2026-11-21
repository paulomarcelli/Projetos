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

- **18/11/2026 · E Se, Hein? v2 (realismo documental).** Página "Realismo documental (v2)" no arquivo
  `okTGRiK8lTEXSoP9QDm0du`; coleções `v2 · Cor` (Dia, Noite, Frio) e `v2 · Medidas`; Newsreader (o que se diz) e IBM
  Plex Sans (o que se mede). Contador no canto com o lugar em outra linha, depois de um fio; fato com fonte em outro
  componente (`v2 / Fato`), para não parecer contagem. Vídeos novos usam o v2; o v1 fica para os antigos.
- **18/11/2026 · Figma: variável em parada de degradê apaga a transparência.** Ligar a cor da parada a uma variável
  preta deixou o véu opaco e o quadro todo preto. Para degradê com alfa, use cor solta com `a`.
- **18/11/2026 · Figma: destaque dentro de texto de componente se perde.** O trecho em outro estilo (o "você" em
  redondo) não sobreviveu à ligação com a propriedade de texto. Reaplique `setRangeTextStyleIdAsync` no componente e
  na instância e confira com `getStyledTextSegments`.
- **18/11/2026 · Texto sobre céu de drone.** Céu claro dá 2,4:1 com branco. A solução de fotografia (filtro degradê no
  céu, `v2/grade/ceu-nd`) levou para 3,8:1 sem caixa nem faixa; embaixo, o véu de leitura. Meça na foto antes de
  decidir o tom do texto.
- **18/11/2026 · Retoque de foto por código tem limite.** Esvaziar a Paulista levou quatro técnicas (inpaint,
  perspectiva com mediana, campo de luz, asfalto repintado). Só a última serviu, e com defeitos. Para referência de
  composição, limite o tempo a uma hora e diga o que ficou imperfeito; a cena real é do Blender.
- **18/11/2026 · Acervos abertos.** `taste-skill/scripts/assets.mjs` acha foto real com licença e crédito (Wikimedia,
  Openverse). Chamar a API da Wikimedia direto deu 429, e trocar o User-Agent foi bloqueado: use o script.
- **18/11/2026 · Legenda de frase inteira.** Quebre por sentido (`text-wrap: balance`). Palavra sozinha na última
  linha apareceu duas vezes nos exemplos.

- **21/11/2026 · Blender por código: o que mais denuncia o "3D de código" é a maior área do quadro.** Do drone, é o
  telhado (claro e liso), o céu (leitoso depois do AgX) e a árvore (esfera). Comece por eles: platibanda, casa de
  máquinas e laje escura; Hue/Saturation no céu; copa em tufos irregulares com galho aparente.
- **21/11/2026 · Blender: não mudar o sorteio aprovado.** Para acrescentar detalhe sem mexer no layout que o Paulo
  aprovou, use um `random.Random(semente)` próprio e, se trocar um trecho que gastava `random` global, gaste o mesmo
  número de sorteios.
- **21/11/2026 · Blender: `bmesh.ops` em malha grande é quadrático.** `create_cube`/`create_icosphere` varrem a malha
  inteira a cada chamada: 40 mil caixas travaram a montagem. Monte vértice a vértice (`caixa_rapida`) ou copie um
  modelo. A montagem do P5 caiu de 157 s para 7 s.
- **21/11/2026 · Blender: Boolean exato em malha de caixas sobrepostas destrói a geometria.** O túnel do metrô
  estava sem parede, piso e trilhos e ninguém tinha notado na folha. Imprima o número de faces de cada objeto
  avaliado (`evaluated_get(depsgraph)`) quando uma cena parecer estranha, e monte vãos em blocos.
- **21/11/2026 · Blender: corte de terra na sombra vira parede azul.** A face só pega o céu. Luz de preenchimento
  com light linking (`light_linking.receiver_collection`) só na terra resolve sem acender o resto.
- **21/11/2026 · Personagem pequeno sobre texto.** Confira a projeção do personagem (`c.projetar`) contra as faixas
  do fato (y 1085 a 1180) e da legenda (1240 a 1380) no plano inteiro, não só num quadro.
- **21/11/2026 · Conferência: pasta com quadros velhos.** `out/conferencia/<video>/` guarda quadros de rodadas
  antigas; rode de novo todos os tempos que for mostrar, senão a folha mistura antes e depois.

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
| 18/11/2026 | Direção de arte v2 "Realismo documental" dos vídeos do E Se, Hein? no Figma (página nova, 2 coleções de variáveis, 10 estilos de texto, 6 componentes, 4 quadros 1080 × 1920 da Paulista) + seção v2 no `docs/design-system.md` e tokens v2 em `tokens.css`/`tokens.json`; com as correções da Sabrina (8,3 bilhões, lugar em outra linha, componente Fato) | aguardando o retorno do Paulo | cerca de 4 h (com uma pausa por limite de uso) | sem créditos de IA | O retoque da Paulista vazia custou quase uma hora em quatro tentativas: limitar o tempo antes. Ligar variável em parada de degradê apagou o alfa. |
| 21/11/2026 | Acabamento 3D do vídeo "E se você fosse a última pessoa do mundo?" (céu, telhados, fachadas, árvores, carros, P3 metrô refeito sem Boolean, P4 supermercado, P6 Pripyat) + personagem novo (o "você" e a multidão) + "você" fora do fato no P4; folha `out/conferencia/sofia-antes-depois.jpg` | aguardando o retorno do Paulo | cerca de 3 h | sem créditos de IA | Medir a montagem e o tempo por quadro logo no começo; olhar o número de faces dos objetos quando uma cena parece estranha (o túnel estava quebrado desde antes). |
