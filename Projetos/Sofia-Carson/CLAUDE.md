# Guia do projeto — Lusco

(Salve como `CLAUDE.md` na raiz do projeto se você usa o Claude Code, ou como `AGENTS.md` se usa o Codex, o Cursor ou outro agente. O conteúdo é o mesmo.)

Guia para construir e manter a landing page da Lusco (produtora audiovisual). Leia inteiro antes de codar.

## O que importa
- **O filme fica atrás da página inteira.** A montagem do set toca presa à tela (`position: fixed`) desde o hero até o rodapé, e a página é uma folha cor de osso com **furos** por onde ela aparece: a janela cinemascope, o bloco do meio dos filmes, as letras do nome no rodapé. Na seção "Como trabalhamos" a folha se abre inteira. Essa é a ideia do site; ela vem primeiro e precisa estar perfeita.
- **A intro** (coluna de quadros que sobe e o último que cresce até virar o fundo) é a primeira impressão: tem de rodar lisa, sem engasgo, e emendar no vídeo sem salto.
- **Preto e branco, com grão.** O filme e as miniaturas da intro em preto e branco; só os quadros dos filmes têm cor, e mesmo assim com tratamento de película.
- **Minimalismo de set.** No hero, só o nome no centro e um texto pequeno em cada canto. Nada de título de efeito, HUD, contador, "role para baixo", rótulo com traço ou cards.
- As imagens em `arquivos/conceito/` são o alvo. Compare o resultado com elas.

## Design system
Tokens em `src/styles/tokens.css`, sempre por variável:

| Token | Valor | Uso |
|---|---|---|
| `--osso` | `#ebe8e2` | a folha (seções), a faixa da nav sobre ela |
| `--tinta` | `#0a0a0a` | texto na folha, pílula cheia na folha |
| `--tinta-2` | `#6b6863` | rótulos mono na folha, rodapé |
| `--luz` | `#f4f4f2` | texto e pílulas sobre o filme |
| `--noite` | `#0a0a0a` | fundo do `html`, da intro e do reel |

- Fontes: **Geist** (`@fontsource-variable/geist`) e **Geist Mono** (`@fontsource-variable/geist-mono`). Marca 800; títulos 750 com tracking −0,045em; manifesto 330; rótulos mono em caixa alta, 11 px, 450, tracking 0,16em.
- Tamanhos: `--f-marca` `clamp(84px, 13.2vw, 260px)`, `--f-manifesto` `clamp(26px, 2.2vw + 10px, 50px)`, `--f-h2` `clamp(44px, 3.4vw + 14px, 78px)`, `--f-furo` `clamp(24px, 1.2vw + 12px, 34px)`, `--f-linha` 15–17 px, nav 14 px.
- `--margem` `clamp(16px, 2.8vw, 44px)`; `--topo` (nav) `clamp(18px, 2.2vw, 30px)`.
- Pílulas de 40 px (36 no celular), fio de 1 px, `border-radius: 999px`.
- Curvas: entrada `cubic-bezier(.16, 1, .3, 1)`; saída `cubic-bezier(.55, 0, .75, .2)`.

## Regras de código
- Vite sem framework; dependências com versão travada.
- Uma seção por CSS em `src/sections/`; motion em `src/motion/`. Os módulos de `arquivos/motion/` vêm prontos: mude números, não a lógica.
- **Furo = bloco transparente com `box-shadow: 0 0 0 300vmax var(--osso)`**, numa seção com `overflow: hidden; isolation: isolate`. Um furo por seção (dois furos na mesma seção se cobrem). Furo na camada 0, texto e foto em `position: relative; z-index: 1`; nenhum contêiner intermediário com `transform`, `opacity < 1` ou `z-index` (criaria outra camada e a sombra cobriria o texto). Nunca ponha fade de entrada no furo: apagaria a folha junto.
- O rodapé vazado é uma `<mask>` de SVG: retângulo branco, letras e o círculo do O em preto, a metade interna do O de volta em branco. O texto da máscara usa a Geist da página e `textLength` para caber na largura.
- A intro anima **só `transform` e `opacity`**. O quadro que cresce sai da coluna antes (`position: fixed` dentro de um pai com `transform` se prende ao pai) e já tem o tamanho da tela, encolhido por escala; a última miniatura tem a proporção da tela para a escala não mudar o recorte. Animar `width`/`height`/`left`/`top` trava.
- O vídeo do fundo fica parado no 1º quadro durante a intro e começa quando o quadro cobre a tela. O pôster é esse mesmo 1º quadro.
- Grão: um PNG de ruído repetido, em `mix-blend-mode: overlay`, num elemento maior que a tela (`inset: -50%`) que salta de posição com `steps(1)`. Nunca filtro SVG animado nem canvas de ruído por quadro.
- Texto que passa por baixo da nav transparente (nas aberturas) some por marco (`.is-sob`), nunca por scrub.
- Hover só em `@media (hover: hover)` e fora de `html.is-scrolling`. Foco visível em tudo.
- `prefers-reduced-motion`: sem intro, sem Lenis, vídeo no pôster, grão parado, entradas sem deslocamento.
- Textos em PT-BR com acento certo; "m²" e "·" tipográficos.

## Como conferir
1. `npm run dev` e abra no navegador.
2. Intro: "[ LUSCO FILMES ]" e a porcentagem no centro; em 100, os rótulos vão para as bordas e a coluna sobe; o último quadro (o cinegrafista contra a luz) cresce até a tela **liso**, sobre o preto, e o vídeo começa sem salto. O LUSCO sobe letra a letra; a nav e os cantos aparecem.
3. Recarregue e role a roda no meio da intro: ela pula direto para o hero, com o vídeo tocando.
4. Role devagar: a folha sobe por cima do filme, com a beira reta; a nav ganha a faixa cor de osso e o nome pequeno no centro; o filme continua tocando atrás e aparece pela janela larga, parado na tela enquanto a janela sobe.
5. Filmes: o bloco do meio mostra o filme com a frase legível; os dois quadros com cor têm grão se mexendo e vinheta.
6. "Como trabalhamos": a folha se abre de ponta a ponta, a nav volta a ser clara, e o texto some ao chegar perto dela.
7. Fim da página: as letras do LUSCO mostram o filme, com margem dos dois lados.
8. "Ver o reel": a montagem em tela cheia; Esc fecha e o foco volta ao botão.
9. Celular (390 × 844): a intro com a coluna mais larga e o último quadro em pé; nada corta; "Ver o reel" embaixo do nome no hero; o furo dos filmes primeiro.
10. `npm run build` sem erro; console sem erro.

## Personalizar

O site chega como a demo da Lusco, uma produtora inventada. Esta seção vale sempre que a pessoa pedir uma mudança, hoje ou daqui a meses: trocar a marca, um texto, uma foto, o filme do fundo, ou levar uma peça para outro site.

### Antes de mexer
- Se ainda não sabe o objetivo, pergunte qual destes é (uma pergunta por vez, em linguagem simples):
  1. **Ver a demo funcionando** como está, para trocar depois.
  2. **O site da minha produtora ou da minha marca**, com esta estrutura e estas animações.
  3. **Só algumas peças** (a intro, o fundo preso atrás com os furos, o rodapé vazado) para um site que já existe.
- Para o caminho 2, pergunte o que ainda não sabe: nome, o que filma, desde quando e quantos filmes, quais filmes mostrar (cliente, tipo, ano), as etapas e prazos de trabalho, contato (e-mail, telefone, redes), cores e logo (se tiver), e **que material já tem** (reel, quadros dos filmes). Não peça tudo de uma vez.
- Para o caminho 3, pergunte quais peças e onde fica o site de destino. Leia o código do destino antes: em React, Next ou outro framework, leve os módulos de `src/motion/` (são JS puro) e o CSS de `fundo`, `folha` e da seção, em vez de colar esta página.
- Diga com clareza o que muda só com texto e o que depende de material novo (tabela abaixo). **O filme do fundo mostra o set da demo**: ninguém consegue pôr a equipe da pessoa nele editando o vídeo atual. Ele vira dela com um trecho do reel dela ou com clipes novos (`arquivos/receitas/LEIA.md`).

### O que muda e onde
| o quê | onde | precisa de material novo? |
|---|---|---|
| Nome e marca (o "O" de meia-luz) | `.marca` no `index.html` (hero, nav), `.carga__rotulos`, o `<text>` da máscara no rodapé e o `favicon.svg` | não |
| Textos, números, etapas, contato, redes | cada seção no `index.html` | não |
| Cores | `src/styles/tokens.css` | não |
| Fontes | `@fontsource-variable/*` no `package.json`, os imports em `src/main.js`, `--sans`/`--mono` em `tokens.css` | não |
| Forma e tamanho dos furos | `.janela` em `manifesto.css` (proporção 2,39), `.furo` em `filmes.css`, o `viewBox`/`textLength` do SVG em `contato.html` | não |
| Grão e filtro do filme | `.fundo__grao` e `.fundo__video` em `src/sections/fundo.css` | não |
| Tempos da intro | os números em `src/motion/carga.js` (1700 ms a coluna, 1100 ms o crescimento) | não |
| Tirar uma seção | apague a seção e o import do CSS em `src/main.js` | não |
| Quadros dos filmes | `public/img/filme-*.webp` e as legendas em `#filmes` | sim |
| Miniaturas da intro | `public/img/intro/` e as `<img>` da coluna | sim (saem do filme novo) |
| O filme do fundo e do reel | `public/video/montagem.mp4` e `montagem.jpg` | sim: vídeo novo |

### Material da pessoa
Para cada peça visual, ofereça estes caminhos, do mais simples para o mais trabalhoso, e deixe a pessoa escolher:
1. **Manter o da demo por enquanto** e trocar o resto. O site fica pronto hoje, mas com o set e os filmes da Lusco: diga isso e ponha a troca na lista do fim.
2. **Usar o material que ela já tem.** Confira antes de trocar:
   - o filme do fundo: 16:9, 8 a 20 s, **escuro e com pouca coisa no centro** (o nome grande fica por cima), sem texto queimado nem logo de cliente; vários planos curtos com corte seco funcionam bem, como na demo. Comprima com `sh arquivos/fonte/montagem.sh` (adapte os trechos) ou `ffmpeg -i reel.mp4 -an -vf format=gray -c:v libx264 -crf 24 -movflags +faststart public/video/montagem.mp4` e tire o pôster do 1º quadro (`ffmpeg -i public/video/montagem.mp4 -frames:v 1 public/video/montagem.jpg`). Até ~4 MB. Em cor, tire o `format=gray` e o `grayscale(1)` do `fundo.css` e da intro.
   - quadros dos filmes: 4:5, 1024 × 1280 ou maior, um frame forte de cada filme, em WebP.
   - miniaturas da intro: 480 × 270, um quadro de cada plano do filme novo (`sh arquivos/fonte/miniaturas.sh <clipe> <segundo> <saida.webp>`). O último da coluna é sempre o pôster da montagem.
   Material que não serve (vídeo claro demais, vertical, com legenda, de celular tremido sem intenção) estraga o hero: diga isso e proponha o caminho 3.
3. **Gerar com IA** seguindo `arquivos/receitas/LEIA.md`: os prompts que fizeram cada quadro e cada clipe da demo. A pessoa roda no gerador que usar e devolve os arquivos. Pessoa sempre em silhueta ou em close parcial.
4. **Sem vídeo:** só o pôster como imagem fixa (apague o `src` do `<video>` e deixe o `poster`; o grão continua se mexendo por cima). A intro funciona igual.

### Regras ao trocar
- As regras de cima continuam valendo: o filme preso atrás, um furo por seção, a intro só com `transform`, preto e branco com grão.
- O pôster da montagem tem de ser o **1º quadro** do vídeo novo, senão a intro dá um salto quando o vídeo começa.
- Nada de número de filmes, ano de fundação, prazo ou cliente inventado como se fosse da produtora: o que a pessoa não informou fica `[preencher]` e entra na lista do fim. Os "318 filmes", "desde 2012", "600 m²", "quatro diretores", as seis semanas e os clientes (Vértice Automóveis, Nina Calé) são da demo.
- Depois de cada troca, rode o "Como conferir" de novo nos trechos que mudaram, e no fim liste para a pessoa o que ficou da demo (filme, fotos, textos) e o que falta ela mandar.
