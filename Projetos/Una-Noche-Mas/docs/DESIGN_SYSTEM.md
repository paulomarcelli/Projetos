# Design System · Una Noche Más

> Direção "colagem noturna": o site é a capa do single (`nochemas.png`) aberta em página. Fonte da verdade dos valores: `style.css` (seção 1, `:root`). Auditoria e paleta: `docs/DIRECAO.md`.

## 1. Tokens

**Cores** (os nomes originais foram mantidos, e os derivados vêm da capa):

| Token | Valor | Uso |
|---|---|---|
| `--preto` | `#000` | rodapé |
| `--noite` / `--noite-2` | `#0b0d12` / `#12151c` | fundo das seções / camada acima |
| `--cinza` | `#1a1a1a` | players, ingressos |
| `--azul` | `#2c4a5e` | **só superfície**: botão azul, canhoto, sombra do título e dos botões |
| `--azul-claro` | `#8fb3cf` | texto azul (h3, arrobas, links de crédito), 9,5:1 |
| `--rosa` | `#ff69b4` | h1, números, foco, botão principal. Texto sobre rosa = `--noite` |
| `--branco` / `--texto-suave` | `#fff` / `#a7a9b4` | texto / texto secundário (8,3:1) |
| `--papel` / `--tinta` / `--fita` | `#ece6da` / `#2a2a33` / papel 42% | polaroid / escrita sobre o papel / fita adesiva |
| `--linha` / `--linha-forte` | branco 12% / 28% | fios, bordas, tracejados |

**Espaçamento** `--esp-1..10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px. Use **só** esses valores: 1–4 dentro de componentes, 5–7 entre blocos e 8–10 entre seções. A margem lateral é `--gutter` (16 px no celular, até 64 px), e a largura máxima é `--largura-max` (1320 px), aplicada via `.container`.

**Tipo fluido** (`clamp`): `--fs-mono` 11→13, `--fs-texto` 16→18, `--fs-lide` 18→22, `--fs-h3` 28→40, `--fs-h2` 44→96 e `--fs-display` 56→160 px.

**Outros**: raios `--raio-s` 2 px (papel cortado), `--raio-m` 6 px (players, ingressos) e `--raio-redondo`. Sombras `--sombra-papel` / `--sombra-papel-alta` (contato + difusa). z-index: `--z-header` 50, `--z-menu` 60, `--z-flutuante` 70, `--z-toast` 80, `--z-grao` 90 e `--z-skip` 100. `--altura-header` vale 64 px, ou 72 px a partir de 768 px.

**Movimento** (para `motion.css`): `--ease-out` `cubic-bezier(.23,1,.32,1)`, `--ease-in-out` `(.77,0,.175,1)`, `--ease-drawer` `(.32,.72,0,1)`; `--dur-press` 140 ms, `--dur-curta` 200 ms, `--dur-media` 280 ms e `--dur-revelar` 700 ms.

## 2. Tipografia (papéis)

- **Playfair Display** (`--fonte-display`), itálico 600/800, com 700 normal de reserva. É a voz emocional, usada no h1, nos h2, nos nomes, nos links do menu mobile, no texto dos players e no ∞. Os títulos são grandes e com tracking negativo.
- **Inter** (`--fonte-texto`), 400/600. Serve para leitura: parágrafos de 16–18 px, line-height 1,65 e até cerca de 60ch. Também é a fonte dos botões.
- **Space Mono** (`--fonte-mono`), 400/700, sempre curto, em MAIÚSCULAS com tracking de .12–.22em (`.rotulo`). É a "máquina de escrever" da capa: datas, ficha técnica, numeração, créditos, menu desktop e eco do hero.

## 3. Componentes (em `style.css`)

| Classe | O que é | Estados |
|---|---|---|
| `.btn` + `--rosa` / `--azul` / `--fantasma` | botão/link de ação, com min-height 48 e sombra sólida deslocada | hover (sobe 2 px, só com mouse), active (afunda), focus-visible, `:disabled`/`[aria-disabled]`, `.is-loading` |
| `.polaroid` | moldura de papel com fita (`::before` no topo, `::after` no canto). Gira com `--rot` via a **propriedade `rotate`** | — |
| `.polaroid__imagem`, `.foto[data-iniciais]` | miolo da foto. `.foto` desbota a imagem e guarda as iniciais | `.foto--falhou` |
| `.polaroid__nota` | anotação "à mão" na faixa de baixo | — |
| `.rotulo`, `.credito` | rótulo mono / crédito de foto | — |
| `.secao`, `.secao__cabeca`, `.secao__numero`, `.secao__titulo` | ritmo das seções: número rosa + rótulo + fio + título display | — |
| `.estrela`, `.infinito` | glifos ★ ∞ (sempre `aria-hidden`) | — |
| `.titulo-cromatico` | rosa + sombras azuis deslocadas + brilho | — |
| `.site-header`, `.logo`, `.nav__link`, `.menu-toggle` | header fixo e menu | `.is-scrolled`, `[aria-current]`, `[aria-expanded]`, `.is-open` |
| `.hero__*`, `.lua`, `.video-toggle`, `.hero__rolar` | abertura | `[aria-pressed]` |
| `.ficha` | ficha técnica (`<dl>`) | — |
| `.player` + `--video` (16:9) / `--audio` (152 px, ou 352 px a partir de 1200 px) | fachada + iframe | `.is-loading`, `.is-loaded` |
| `.rede` | ingresso: canhoto azul picotado + corpo + seta | hover (sobe e gira), active, focus |
| `.topo`, `.toast` | voltar ao topo / aviso | `.is-visible`, `.is-shown` |

Hover só existe dentro de `@media (hover:hover) and (pointer:fine)`. Todo alvo de toque tem pelo menos 44 px (botões têm 48).

## 4. Por que cada recurso existe

- **Polaroid + fita + rotação**: na capa, as fotos são objetos colados. Aqui a regra é parcimônia, só na capa e nos 2 retratos. As rotações ficam entre ±2,5–3°, em sentidos opostos no dueto, para que um "olhe" para o outro.
- **Filtro desbotado nas fotos** (`.foto img`): o retrato da Karol é claro e saturado. O desbote aproxima a foto do preto e branco/sépia das fotos da capa.
- **Título cromático**: copia o "UNA NOCHE MÁS" rosa da capa, impresso com o azul fora de registro. O deslocamento é pequeno (0,035em) para parecer impressão, e não 3D. Ele aparece só no h1 e no logo.
- **Sombra sólida deslocada nos botões e nos ícones dos players**: repete o mesmo desalinhamento rosa/azul do título, de modo que o sistema inteiro fala a mesma língua.
- **Grão** (`body::before`, SVG feTurbulence, 5,5%): imita o papel granulado da capa e tira o ar "digital" dos pretos chapados.
- **Space Mono + eco repetido no hero**: os textos datilografados e o "ALAN NAVARRO / KAROL SEVILLA" repetidos e apagados aparecem na capa.
- **Lua num recorte de foto escura com fita**: é o mesmo recorte da capa, feito só com CSS (sombra interna de um círculo).
- **★ ∞**: os glifos da capa. O ∞ vira "ponte" entre Karol e Alan.
- **Numeração 01·02·03 + fio**: dá ritmo editorial e ajuda a orientação, porque o menu repete os números.
- **Assimetria**: no texto à esquerda, a capa desce 96 px. No dueto, Alan fica 128 px abaixo, e nas redes o segundo ingresso desce. É a colagem "jogada na mesa", não uma grade de landing page.
- **Ingressos**: as redes viram canhotos de show, porque seguir os artistas é o "próximo encontro".
- **Azul-jeans só em superfícies**: `#2c4a5e` reprova como texto (2,25:1), por isso o texto azul usa `--azul-claro`.

## 5. CONTRATO de classes e estados (Fase B)

Quem **adiciona** a classe é o JS, e o visual base já está pronto em `style.css`, salvo onde está indicado.

| Gancho | Significado / quem faz |
|---|---|
| `html.js` | JS ligado. O `<head>` coloca a classe antes do CSS. Sem ela, o menu fica visível em linha e o `.topo` fica parado no rodapé |
| `[data-reveal]` → `.is-visible` | bloco que entra ao rolar. `script.js` já adiciona `.is-visible` (uma vez só). **O visual é do Agente 3** (hoje nada é escondido) |
| `[data-reveal="imagem"]` | revelação de imagem por clip-path. Fica no **miolo** (`.foto` / `.polaroid__imagem`), nunca na moldura, para não cortar a fita nem a sombra |
| `[data-reveal-stagger]` | grupo escalonado. Os filhos têm `style="--i:N"` (`.ficha`, `.redes`) |
| `[data-parallax="0.1"]` | fator de parallax (`.hero__lua` 0.12, polaroid da Karol 0.06, do Alan 0.1). A rotação usa `rotate`, então use `translate`/`transform` sem medo |
| `[data-hero]` | peças da coreografia de entrada: glifos, lua, artistas, h1, linha, ações, toggle, indicador de rolagem |
| `.site-header.is-scrolled` | header sólido depois de rolar. Sem a classe e com JS, ele fica transparente sobre o vídeo |
| `body.menu-aberto` + `.menu-toggle[aria-expanded="true"]` + `#menu-principal.is-open` | menu mobile (< 900 px): painel em tela cheia. O body trava a rolagem e as linhas viram X |
| `.nav__link[aria-current="true"]` | seção atual (rosa + sublinhado) |
| `.video-toggle[aria-pressed]` | `true` = **pausado** (mostra ▶). O rótulo sr-only é fixo: "Pausar vídeo de fundo" |
| `.player.is-loading` / `.player.is-loaded` | o ícone vira anel / a fachada some e a `<iframe>` inserida dentro de `.player` ocupa 100% |
| `.foto--falhou` | colocada no **`.foto`** (pai da `<img>`) em `error`. Mostra `data-iniciais` (KS/AN), que está na `.foto` e repetido na `<img>` |
| `.toast.is-shown` | aviso visível (o texto vai no próprio `.toast`, `role="status"`) |
| `.topo.is-visible` | botão flutuante de voltar ao topo aparece (só com `html.js`) |
| `.btn.is-loading` | o texto some e um anel aparece. Desabilite o clique |

Embeds: Spotify `https://open.spotify.com/embed/track/7nxvsuEtsUoFWx5H9jaF8A` (height 152, ou 352 a partir de 1200 px). YouTube `https://www.youtube-nocookie.com/embed/pCgq0ZMoUg4`. O botão `.player__carregar[data-player]` diz qual carregar. Âncora do CTA do hero: `#player-youtube`.

**Divisão da Fase B**
- **Agente 2**: `index.html` (só ajustes), `script.js` (manter o revelar já existente), `components.css`.
- **Agente 3**: `motion.css`, `motion.js` (respeitar `prefers-reduced-motion`; o vídeo não tem `autoplay`, então o play fica com o Agente 2).
- **Agente 1**: `style.css`, `docs/DESIGN_SYSTEM.md`. Para mudar um token, peça ao Agente 1 em vez de sobrescrever.
