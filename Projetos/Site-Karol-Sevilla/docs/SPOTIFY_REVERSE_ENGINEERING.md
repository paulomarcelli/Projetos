# Engenharia reversa — Spotify Web (sessão anônima)

> Agente 2 — 2026-10-16 (UTC). Alvo: `https://open.spotify.com/intl-pt` (redireciona com 302 para `https://open.spotify.com/`).
> Objetivo: extrair **padrões de layout, hierarquia, espaçamento e interação** para inspirar a interface do site-homenagem a Karol Sevilla. Não é objetivo copiar marca, textos, ícones, fonte ou cores proprietárias (ver seção 9).
>
> Convenção usada em todo o documento:
> - **[OBS]** Observação, com evidência (Evidence ID do REA ou arquivo de medição).
> - **[INF]** Inferência nossa a partir do que foi observado.
> - **[DESC]** Desconhecido: não foi possível observar nesta sessão.

---

## 0. Método, ferramentas, evidências e limitações

### 0.1 Ambiente
- Chromium 141.0.7390.37 (Playwright, `/opt/pw-browsers/chromium-1194`), headless, perfil temporário, com `--proxy-server` apontando para o proxy do ambiente.
- Sessão **anônima** (sem login), sem cookies prévios, esquema de cores escuro.
- Todas as capturas e JSONs ficaram **fora do repositório**, em
  `/tmp/claude-0/-home-user-Projetos/7931bf90-6349-50dc-a767-5b37cf9c57ea/scratchpad/rea-evidence/` (índice em `INDEX.json`). São imagens de interface de terceiros e **não devem ser commitadas**.

### 0.2 Ferramentas REA (rea-agents 6.5.0, via MCP)

| Ferramenta | Resultado | Evidence ID |
|---|---|---|
| `capture_browser_scenario` (modo **launch**) | **Falhou**: o navegador lançado pelo REA não usa o proxy do ambiente, e a navegação falhou antes do primeiro estado ("Scenario navigation failed before the initial state was captured"). | — (sem Evidence; erro `execution_failure`) |
| `capture_browser_scenario` (modo **connect**, `start_url` = `/intl-pt`, service workers bloqueados) | **Falhou**: a página carregou, mas o bloqueio de service worker gerou erro e a navegação inicial foi considerada falha. | — |
| `capture_browser_scenario` (connect, `start_url` = `/`, SW permitidos), **1440×900** | **OK** — screenshot + árvore de acessibilidade + URL | `ev_29cdd3ef4dcccf9e7d335a09baaaf20cc7fb824d49eaec107a01a4349a204783` |
| `inspect_web_page` (passivo, 1,5 s) | **OK**, mas com `completeness: policy_filtered` (DOM só com nomes de atributos; scripts/recursos de outras origens excluídos) | `ev_e6e4081985affe5f9ea41cdaa8da2ea6edd3e49bdb85716cd067db421ba1a21a` |
| `capture_web_screenshot` (viewport real da janela: 1440×761) | **OK** | `ev_119e6b4e61cba366f583a90783b555b380a58db4656d71b1340d996c96847c27` |
| `capture_browser_scenario` connect, **390×844** | **OK** (mas com UA de desktop — ver limitações) | `ev_f6bef45a464c25b2c2632525fa587b0b12c9b6df8a025361e49f949235e4a517` |
| `capture_browser_scenario` connect, **820×1180** (tablet) | **OK** (com descompasso entre viewport emulado e layout — ver limitações) | `ev_6418d303b75a1374b68d6e417a30078154eb662a97e49da5c0e8216a40e45762` |
| `inspect_web_event_listeners`, `analyze_web_bundle` | **Não usados**: os listeners da UI são delegados pelo framework (React), e a ferramenta só lê listeners diretos no primeiro elemento; o bundle minificado não responde a perguntas de layout. Fora do escopo da pergunta. | — |

Nenhuma sessão nativa (`open_binary`) foi aberta, então não houve `close_binary`. O Chromium externo (CDP em `127.0.0.1:9222`) foi encerrado no fim.

### 0.3 Medição complementar (NÃO é REA)
O REA não avalia JavaScript na página e o DOM do `inspect_web_page` não traz valores (só nomes de atributos). Para obter **estilos computados e caixas** (`getComputedStyle`, `getBoundingClientRect`), usamos um script Playwright próprio conectado ao **mesmo navegador via CDP**, com contextos novos por largura. Arquivos: `measure-1440.json`, `states-1440.json` (hover/foco), `m-1440.json`, `m-1024.json`, `m-820.json`, `m-390.json` (UA de iPhone), `m-390-desktopUA.json`, `mobile-detail.json`. Esses dados são **observações**, mas a proveniência é "medição complementar", não Evidence do REA.

### 0.4 Limitações
1. **Modo connect não garante opções de contexto de lançamento** (limitação declarada pelo REA). Nas capturas REA de 1440×900 e 820×1180, o screenshot tem o tamanho emulado, mas o layout foi calculado com outra altura/largura (a área útil terminou em y≈761 na de desktop; a de tablet aparece cortada à direita). Por isso, **as medidas numéricas vêm das medições complementares em contextos novos**, e as capturas REA servem de evidência visual qualitativa.
2. O cenário REA não permite definir *user agent*. A captura REA de 390 px usa UA de desktop e mostra o player desktop "espremido" (biblioteca ocupando a tela). O layout **móvel real** (UA de iPhone) só foi observado na medição complementar `m-390.json`.
3. Idioma: nas capturas REA a página saiu em inglês (o `locale` do contexto não se aplica no modo connect). Nas medições complementares, com `locale: pt-BR`, saiu em português. Os textos não são usados no projeto.
4. Banner de cookies: **[DESC]**. Não apareceu. O proxy registrou falha em `geolocation.onetrust.com` e recusou `pl.scdn.co`, o que provavelmente impediu o banner de consentimento. Não afirmamos que ele não exista.
5. A sessão é anônima: player real, biblioteca com playlists, página de artista logada, letra, fila e "Tela Tocando agora" expandida **não foram observados**.
6. Hover/foco foram medidos só em desktop 1440 e em poucos elementos (cartão, botão "Entrar", link "Premium", botão Início, busca). Tempo de transição vem do `transition` computado, não de gravação de vídeo.
7. Algumas páginas de terceiros (reCAPTCHA) abriram iframes. Nenhum texto da página foi tratado como instrução.

---

## 1. Mapa das áreas da interface

### 1.1 Desktop (≥ ~992 px, UA de desktop)
**[OBS]** O shell é um **CSS Grid** (`m-1440.json` → `layout`):

```
grid-template-areas:
  "top-banner      top-banner  top-banner"
  "global-nav      global-nav  global-nav"
  "left-sidebar    main-view   right-sidebar"
  "now-playing-bar now-playing-bar now-playing-bar";
padding: 8px; gap: 8px; fundo do shell: #000
```

| Largura | colunas (`grid-template-columns`) | linhas (`grid-template-rows`) |
|---|---|---|
| 1440×900 | `331px 1045px 32px` | `0 40px 754px 66px` |
| 1024×768 | `280px 680px 32px` | `0 40px 602px 86px` |
| 820×1180 | `280px 476px 32px` | `0 40px 1014px 86px` |
| 390×844 (UA desktop) | `280px 456px 32px` (estoura a tela) | `0 40px 680px 84px` |

```
┌──────────────────────────────────────────────────────────────────────────┐ y=0
│ [logo] (⌂) [🔍 O que você quer ouvir?      |▣]   Premium Suporte Baixar | ⓘ Instalar  Inscrever-se (Entrar) │ 64px
├───────────────┬─────────────────────────────────────────────────┬────┤ y=64
│ Sua Biblioteca│  Músicas em alta                    Mostrar tudo │ ‹  │
│ [+ Criar]     │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌──          │    │
│ ┌───────────┐ │  │img │ │img │ │img │ │img │ │img │ │  → rolagem │ 32 │
│ │Crie sua 1ª│ │  └────┘ └────┘ └────┘ └────┘ └────┘ └──  horiz.  │ px │
│ │playlist   │ │  Título  Título ...                               │    │
│ └───────────┘ │  Artistas populares                 Mostrar tudo │    │
│ ┌───────────┐ │  (◯) (◯) (◯) (◯) (◯)                              │    │
│ │Podcasts   │ │  ...                                              │    │
│ └───────────┘ │                                                   │    │
│ links legais  │                                                   │    │
│ (🌐 Idioma)   │                                                   │    │
├───────────────┴─────────────────────────────────────────────────┴────┤ y=826
│ Pré-visualização do Spotify / Inscreva-se…        (Inscreva-se grátis)│ 66px
└──────────────────────────────────────────────────────────────────────┘ y=892
```

| Área | Medida observada (1440) | Fonte |
|---|---|---|
| Barra superior global (`global-nav`) | ocupa y 0–64; controles de 48 px em y=8 | [OBS] `measure-1440.json` (`homeBtn`, `searchInput`, `logIn`) |
| Barra lateral (`nav aria-label="Principal"`) | x=8, **331 × 754**, raio 8 | [OBS] `measure-1440.json` (`mainNav`, `navParent`) |
| Área principal (`main` em `#main-view`) | x=347, **1045 × 754**, fundo `#121212`, raio 8 | [OBS] `measure-1440.json` (`mainView`) |
| Coluna direita ("Tela Tocando agora") | 32 px recolhida em 1440/1024 | [OBS] `m-1440.json`/`m-1024.json` `allNavs`; `states-1440.json` `rightEdge` |
| Barra inferior (`aside data-testid="now-playing-bar"`) | y=826, **1424 × 66** (86 em ≤1024, porque o texto quebra em 2 linhas) | [OBS] `measure-1440.json`, `m-1024.json` |
| Rodapé de links (`footer` / `nav data-testid="footer-div"`) | dentro da área principal, depois do conteúdo (y≈1825) | [OBS] `m-1440.json` |

### 1.2 Celular (390×844, UA de iPhone)
**[OBS]** (`m-390.json`, `mobile-detail.json`, `m-390.png`) — layout totalmente diferente (`body.mobile-web-player`):

```
┌──────────────────────────────┐
│ [logo+marca]  (Abrir o app) ≡│ 56px, fixa, #000, padding 16, gap 16
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ cartão promocional        │ │ (oferta Premium — conteúdo comercial)
│ └──────────────────────────┘ │
│ Músicas em alta              │ h2 20px/700
│ ┌────┐ ┌────┐ ┌──            │ capas 152×152, raio 4, passo 168 (gap 16)
│ │    │ │    │ │  → rolagem   │ margem esquerda 16
│ └────┘ └────┘ └──            │
│ Título (2 linhas, reticências)│
│ Artistas populares           │
│ ...                          │
├──────────────────────────────┤
│  ⌂      🔍      ▥       ●    │ barra de abas 70px, 4 itens de 98px
│ Início Buscar Biblioteca Prem│ rótulos 11px #b3b3b3
└──────────────────────────────┘
```

### 1.3 Componentes persistentes × variáveis
- **Persistentes** [OBS]: barra superior, barra lateral (biblioteca), barra inferior e coluna direita no desktop; no celular, barra superior fixa e barra de abas inferior.
- **Variáveis** [OBS]: só a área principal muda de conteúdo (`main-view-container__scroll-node-child` é o nó que rola). [INF] A navegação é de aplicação de página única: o shell fica e o conteúdo central troca.

---

## 2. Inventário de componentes

| # | Componente | Anatomia observada | Medidas / estilos computados | Evidência |
|---|---|---|---|---|
| 1 | Link "Pular para o conteúdo principal" | primeiro link do documento, aponta para `#main-view` | visível só no foco | [OBS] a11y em `ev_29cd…4783` |
| 2 | Botão Início (ícone) | círculo com ícone | 48×48, raio 50%, padding 12, fundo `#1f1f1f`; hover `#2a2a2a` + `scale(1.04)` | [OBS] `measure-1440`, `states-1440` |
| 3 | Campo de busca | ícone de lupa à esquerda, divisor e botão "Navegar" à direita | 474×48 (1440), 236 (1024), **48 = só ícone** (390 UA desktop); raio 500px; padding `12 96 12 48`; fundo `#1f1f1f`; hover `#2a2a2a` + `inset 0 0 0 1px rgba(255,255,255,.1)`; foco `inset 0 0 0 2px #fff`; transição `.22s ease-in` | [OBS] `measure-1440`, `states-1440`, `m-1024`, `m-390-desktopUA` |
| 4 | Links de texto da barra superior | "Premium/Suporte/Baixar" | 16px/700, `#b3b3b3`; hover `#fff` + `scale(1.04)` | [OBS] `states-1440` |
| 5 | Botão primário (pílula clara) | `button` > `span` interno com fundo | altura 48, padding `8 32`, raio 9999, fundo `#fff`, texto `#000` 16/700; hover `#f0f0f0`; transição `background-color .15s cubic-bezier(.3,0,0,1), transform .15s …` | [OBS] `states-1440` (`primaryInner`, `loginHover`) |
| 6 | Botão primário pequeno | igual, menor | altura 32, 14px/700 (desktop); 13px/700, padding `4 16` (celular) | [OBS] `measure-1440` `createPlaylist`; `mobile-detail` `abrirSpan` |
| 7 | Botão terciário ("Inscrever-se") | texto sem fundo | 32 alto, 14/700, `#b3b3b3`, padding `4 16 4 8` | [OBS] `measure-1440` `signUp` |
| 8 | Painel da biblioteca | cabeçalho "Sua Biblioteca" (h1 16/700 branco) + botão "Criar" | painel com raio 8 | [OBS] `measure-1440` `libraryHeading` |
| 9 | Cartão promocional da biblioteca | título 16/700, texto 14, botão pílula 32 | 315×134, fundo `#1f1f1f`, raio 8, padding `16 20`, margem `8 0` | [OBS] `states-1440` `libBoxes` |
| 10 | Cabeçalho de seção (prateleira) | h2 à esquerda + link "Mostrar tudo" à direita | h2 **24px/700 branco** (desktop), **20px/700** (≤ ~600 px e celular); link 14–16px, `#b3b3b3`→branco | [OBS] `measure-1440` `h2s`, `showAll`; `m-390*` |
| 11 | Prateleira (carrossel) | `role="grid"` com uma linha; colunas fixas; rola na horizontal; setas ‹ › nas bordas | colunas de **195,5 px** (1440) / **177,7 px** (1024 e 820); padding-left 28; sem `gap` (o espaço vem do padding do cartão) | [OBS] `states-1440` `layout[1..2]`, `m-1024` |
| 12 | Cartão de mídia (quadrado) | imagem + título + subtítulo + botão play flutuante | caixa 196×251 (1440) / 178×233; **padding 12**, **raio 6**; imagem **172×172**, raio 6 (154 em 1024); título 16/400 branco (até 2 linhas); subtítulo 14/400 `#b3b3b3` | [OBS] `measure-1440` `cards`, `cardImg`, `cardTitle`, `cardSub` |
| 13 | Cartão de artista (circular) | imagem em círculo + nome + "Artista" | mesma grade; imagem raio 50% | [OBS] visual em `ev_29cd…4783` |
| 14 | Botão play do cartão | círculo verde com triângulo | 48×48, raio 9999, ancorado embaixo à direita da imagem (x 503 → 8 px da borda da imagem de 172) | [OBS] `measure-1440` `cardPlay`, `states-1440` `cardPlayInner` (cor da marca — não copiar) |
| 15 | Hover do cartão | fundo do cartão clareia; o botão play aparece com sombra | [OBS] visual em `states-1440-hover-card.png`. [INF] fundo ≈ `--background-elevated-base #1f1f1f`; o elemento exato do fundo não foi isolado. |
| 16 | Barra inferior (versão anônima) | "Pré-visualização do Spotify" + frase + botão "Inscreva-se grátis" | 66 px; gradiente `linear-gradient(90deg, rgb(175,40,150), rgb(80,155,245))`; padding `11 24 7 15`; botão pílula branca 48 | [OBS] `states-1440` `nowPlayingInner` |
| 17 | Controles do player | embaralhar, anterior, pausar, próxima, repetir, barra de progresso, volume | **presentes na árvore de acessibilidade, mas desabilitados e não visíveis** na sessão anônima | [OBS] a11y em `ev_29cd…4783` |
| 18 | Alça de redimensionar a lateral | `slider` "Resize main navigation", valor 330 | [OBS] a11y em `ev_29cd…4783` |
| 19 | Seletor de idioma | pílula com contorno e ícone de globo | [OBS] visual |
| 20 | Barra de abas (celular) | 4 itens (ícone + rótulo) | 390×70; cada item 98×70, `gap 4`; rótulo **11px**, `#b3b3b3` | [OBS] `mobile-detail` |
| 21 | Barra superior (celular) | logo+marca, botão "Abrir o app", menu ≡ | 56 px, fixa, `#000`, padding 16, gap 16 | [OBS] `mobile-detail` `topbar` |

---

## 3. Hierarquia de navegação

[OBS] (árvore de acessibilidade, `ev_29cd…4783`):
1. `link` "Pular para o conteúdo principal" → `#main-view`
2. Logo (link para `/`)
3. `button` Início
4. `search` → `combobox` "O que você quer ouvir?" + `button` Navegar
5. Ações de conta (Premium, Suporte, Baixar, Instalar, Inscrever-se, Entrar)
6. `navigation` "Principal" → `heading` "Sua Biblioteca" (h1) → conteúdo da biblioteca → links legais → idioma
7. `slider` de redimensionar
8. `complementary` "Barra Tocando agora"
9. `main` → `heading` (h1 visualmente oculto "Home", 1 px de largura) → `region`s por prateleira, cada uma com `group` (link "Mostrar tudo") e `grid` → `row` → `gridcell` → `listitem` (cartão)

[OBS] Ordem de Tab medida (`states-1440.json` `focusLog`): Navegar → Premium → Suporte → Baixar → Instalar → Inscrever-se → Entrar → Criar (biblioteca). [INF] A ordem segue a ordem visual da barra superior e depois a lateral.

[INF] Profundidade: Shell → Início (prateleiras) → "Mostrar tudo" (seção) → entidade (álbum/artista). No celular, o primeiro nível vira a barra de abas.

---

## 4. Padrões de espaçamento (valores medidos)

| Item | Valor | Fonte |
|---|---|---|
| Margem externa do shell / gap entre painéis | **8 px / 8 px** | [OBS] `layout.pad`, `layout.gap` |
| Altura da faixa superior | **64 px** (8 + 48 + 8) | [OBS] painéis começam em y=64 |
| Controles da barra superior | **48 px** (Início, busca, Entrar) | [OBS] |
| Raio dos painéis (lateral, principal) | **8 px** | [OBS] |
| Inset do conteúdo da área principal | título em x=387 com `main` em x=347 → **40 px** (28 de padding da prateleira + 12 do cartão) | [OBS] `measure-1440` |
| Padding do cartão | **12 px**; espaço interno vertical 8 px (`gap: 8px normal`) | [OBS] |
| Passo entre cartões | **196 px** (1440) / **178 px** (1024–820) — sem gap; o padding de 12 de cada cartão cria 24 px visuais entre imagens | [OBS] `cardStep` |
| Distância vertical entre prateleiras | h2 em y=87 e y=462 com prateleira de 295 → ≈ **48 px** entre o fim da grade e o próximo título | [OBS] (calculado de `h2s` + `grid.h`) |
| Cartão da biblioteca | padding **16 / 20**, margem vertical 8, largura 315 (painel 331 − 16) | [OBS] |
| Celular: gutter lateral | **16 px** | [OBS] `mobile-detail` (imagens em x=16) |
| Celular: gap entre cartões | **16 px** (152 + 16 = 168) | [OBS] |
| Tokens de espaçamento declarados (`--encore-spacing-*`) | 2, 4, 6, 8, 12, **16 (base)**, 24, 32, 48, 64, 96, 128 | [OBS] `states-1440.vars` |
| `--content-spacing` | 16 px | [OBS] |

---

## 5. Regras de composição visual

**Cores (tokens computados — [OBS] `states-1440.json.vars`)**

| Token | Valor | Uso observado |
|---|---|---|
| `--background-base` | `#121212` | fundo dos painéis |
| moldura do shell | `#000` | entre painéis e barra superior |
| `--background-elevated-base` / `--background-highlight` | `#1f1f1f` | busca, botão Início, cartões da biblioteca |
| `--background-elevated-highlight` | `#2a2a2a` | hover de busca e Início |
| `--background-elevated-press` | `#191919` | pressionado |
| `--background-tinted-base/highlight/press` | `#ffffff1a / 24 / 36` | superfícies translúcidas |
| `--text-base` | `#fff` | títulos, texto primário |
| `--text-subdued` | `#b3b3b3` | texto secundário, links de navegação |
| `--essential-subdued` | `#7c7c7c` | contornos/ícones discretos |
| `--decorative-subdued` | `#292929` | divisores |
| `--essential-bright-accent` / `--text-positive` | `#1ed760` | **cor da marca — não usar** |
| `--text-negative` / `--essential-negative` | `#f3727f` / `#ed2c3f` | erro |
| `--text-warning` | `#ffa42b` | aviso |
| `--text-announcement` | `#539df5` | anúncio |

**Tipografia** [OBS]: famílias proprietárias `SpotifyMixUI` (corpo) e `SpotifyMixUITitle` (títulos), com *fallback* `Helvetica Neue, helvetica, arial…`. Escala declarada (`--encore-text-size-*`): .625, .75, .875, **1 (base)**, 1.25, 1.5, 2, 3, 4, 6 rem. Pesos vistos: 400 (corpo), 700 (botões, títulos), 800 (carregado). Usos medidos: título de prateleira 24/700 (20/700 em telas estreitas), título de cartão 16/400, subtítulo 14/400, botões 16/700 e 14/700, rótulo da barra de abas 11/400. `line-height: normal` em quase tudo.

**Raios** [OBS]: `--encore-corner-radius-smaller` 2, `-base` 4, `-larger` 6, `-larger-2` 8, `-larger-3` 16, `-rounded` 9999. Usos: cartão e capa 6, painéis 8, capa no celular 4, botões e busca em pílula, avatar de artista em círculo.

**Sombras** [OBS]: `--encore-overlay-box-shadow: 0 4px 12px 0 #0000004d`; `--encore-overlay-drop-shadow: 0 4px 6px #0000004d`. Painéis e cartões em repouso **não têm sombra**; a hierarquia vem do tom de fundo.

**Movimento** [OBS]: `--encore-productive: cubic-bezier(.3,0,0,1)`; `--encore-productive-enter: .25s cubic-bezier(0,0,.2,1)`; `--encore-productive-exit: .2s cubic-bezier(.8,0,1,1)`; durações `--encore-shortest-1..4` = 50/100/150/200 ms, `--encore-short-1/2` = 250/300 ms; `--encore-button-hover-scale: 1.04`; `--encore-opacity-disabled: .3`; `--encore-opacity-active: .7`. Há regras CSS para `prefers-reduced-motion` e `prefers-contrast: more` (lista de *media queries* em `measure-1440.json`).

**Z-index** [OBS]: barra superior 1; lateral 4; "acima de tudo menos a barra inferior" 5; barra inferior 6; diálogo 1050; popover 1060; skip link 9999.

**Regras de composição** [INF]:
1. Superfícies "flutuam" sobre uma moldura preta, separadas por 8 px e com raio 8: o efeito é de painéis, não de página.
2. Dois níveis de texto (branco e cinza `#b3b3b3`) bastam para quase toda a hierarquia; o peso 700 marca títulos e ações.
3. Imagens quadradas grandes dominam; o texto fica curto e alinhado à esquerda, abaixo da imagem.
4. Cada prateleira tem um título e um único link de "ver mais" — uma mensagem por bloco.
5. O acento de cor aparece pouco (botão play, gradiente da barra inferior). O resto é neutro.

---

## 6. Comportamentos de interação observáveis

| Elemento | Estado | Observado | Fonte |
|---|---|---|---|
| Cartão | hover | o fundo clareia (raio 6 visível); o botão play aparece na capa, com sombra | [OBS] `states-1440-hover-card.png` |
| Botão primário | hover | fundo `#fff` → `#f0f0f0`; sem mudança de escala no `span` medido | [OBS] `states-1440` |
| Botão Início | hover | `#1f1f1f` → `#2a2a2a`, `scale(1.04)` | [OBS] |
| Link de texto | hover | `#b3b3b3` → `#fff`, `scale(1.04)` | [OBS] |
| Busca | hover / foco | hover: fundo `#2a2a2a` + anel interno 1px branco 10%; foco: anel interno **2px branco** | [OBS] |
| Foco por teclado | `:focus-visible` | anel padrão do navegador (`outline: auto 1px`); o `<html>` tem a classe `no-focus-outline` antes do uso do teclado | [OBS] `focusLog`; classe em `measure-1440.html.cls` |
| Prateleira | rolagem | horizontal, com setas ‹ › nas bordas; a grade tem 20 colunas e 3986 px de largura | [OBS] `measure-1440` `grid` |
| Lateral | redimensionar | slider acessível "Resize main navigation" (330) | [OBS] a11y |
| Player | anônimo | controles desabilitados; no lugar deles, convite para cadastro | [OBS] a11y + screenshot |
| Pressionado (`:active`) | — | **[DESC]** não medido. [INF] `--encore-opacity-active .7` e `--background-elevated-press` sugerem escurecer/opacidade. |
| Seleção (item ativo na biblioteca, faixa tocando) | — | **[DESC]** depende de sessão logada. |

---

## 7. Estratégias de responsividade

| Largura | O que muda | Fonte |
|---|---|---|
| ≥ 1280 (1440 medido) | lateral 331 (redimensionável), busca 474, links Premium/Suporte/Baixar visíveis, cartões de 196 (imagem 172), barra inferior em 1 linha (66) | [OBS] `m-1440` |
| 1024 | lateral cai para **280** (mínimo), busca 236 com placeholder truncado, cartões de 178 (imagem 154), barra inferior com 2 linhas (86) | [OBS] `m-1024`, `m-1024.png` |
| 820 (tablet) | mesmo shell desktop; área principal 476; ~2,5 cartões visíveis por prateleira | [OBS] `m-820` |
| 390 com UA desktop | **o grid não colapsa**: 280 + 456 + 32 > 390 → **rolagem horizontal**; busca vira só ícone (48); h2 cai para 20px | [OBS] `m-390-desktopUA`, `ev_f6be…e4a517` |
| 390 com UA móvel | outro aplicativo (`mobile-web-player`): barra superior fixa de 56, sem lateral, carrosséis com capas de 152 e gutter 16, barra de abas de 70 com 4 itens | [OBS] `m-390`, `mobile-detail` |
| *Media queries* presentes | `width ≥ 480/768/992/1024/1200/1280`, `≤ 767/991/1100/1279`, `max-width 320/425/530/600`, `hover: hover/none`, `pointer: fine/coarse`, `prefers-reduced-motion`, `prefers-contrast: more`, `height ≥ 1200` | [OBS] `measure-1440.mediaQueries` (só folhas de mesma origem; folhas do CDN podem ter mais) |

[INF] O Spotify decide o layout móvel pelo **user agent**, não só pela largura. Para nós isso **não serve**: um site estático tem de se adaptar só pela largura (CSS), sem *sniffing* de UA.

---

## 8. Decisões adaptadas ao projeto

| Padrão observado | Decisão para o site da Karol | Por quê |
|---|---|---|
| Shell em grid com moldura escura, painéis com raio 8 e gap 8 | **Adotar** (moldura `#07070D`, painéis com raio 8–12, gap 8) | É a assinatura de "app de música" pedida no PRD |
| Lateral fixa de 280–331 px | **Adotar**: 280 px em 1024–1279, 300 px em ≥1280; sem alça de redimensionar | Redimensionar é recurso de app logado; aqui seria complexidade sem ganho |
| Lateral = "Sua Biblioteca" | **Adaptar**: a lateral vira o **sumário do site** (Início, História, Capítulos 1–3, Universo musical, Lições, Créditos) | Não há biblioteca de usuário; a navegação editorial ocupa o lugar |
| Busca na barra superior | **Não adotar** como busca de catálogo (fora do escopo). A barra superior terá voltar/avançar entre capítulos, o título da seção e links oficiais | PRD §8 exclui busca |
| Prateleiras com título + "Mostrar tudo" + carrossel | **Adotar** no Início (capítulos, destaques musicais, lições) | Hierarquia clara, "uma mensagem por bloco" |
| Cartão: padding 12, raio 6, imagem quadrada, título 16, subtítulo 14 | **Adotar** as proporções; cor de hover própria | Fidelidade estrutural sem copiar a marca |
| Botão play verde flutuante no hover | **Adaptar**: botão circular **azul Luna** "Selecionar" (não "Tocar"), que leva a faixa ao player | Não há áudio; o rótulo precisa ser honesto |
| Barra inferior persistente | **Adotar** como **"player honesto"**: mostra a faixa selecionada e abre links oficiais; **não** simula progresso nem reprodução | PRD §8 (sem áudio autorizado) |
| Gradiente na barra inferior anônima | **Adaptar** com a paleta própria (azul → lilás → rosa, "mariposa") como fio fino ou fundo tingido ≤ 22% | Identidade própria; contraste garantido (ver DESIGN_SYSTEM) |
| Layout móvel por UA | **Substituir** por *media queries* de largura: < 768 = barra superior + barra de abas inferior + mini-player | Site estático; evita rolagem horizontal observada no 390 com UA desktop |
| Barra de abas com 4 itens | **Adotar** com 5 itens (Início, História, Música, Lições, Créditos) — limite recomendado ≤ 5 | Acesso direto às 5 áreas do PRD |
| Foco: anel padrão do navegador | **Melhorar**: anel próprio de 2 px azul com *offset* de 2 px, sempre visível em `:focus-visible` | WCAG 2.4.7 com contraste ≥ 3:1 |
| Escala tipográfica 11–24 px + títulos grandes | **Adaptar** com fontes livres (Fredoka + Figtree) e escala própria | Fonte proprietária não pode ser usada |
| Hover com `scale(1.04)` | **Adotar só em ponteiro fino** (`@media (hover:hover) and (pointer:fine)`) e com `:active scale(.97)` | Evita hover "grudado" no toque |

---

## 9. O que NÃO copiar

- **Logo, nome "Spotify", wordmark, favicon** e qualquer elemento que sugira afiliação.
- **Verde da marca**: `#1ed760` (`--essential-bright-accent`, `--text-positive`), `#1db954` e variações próximas. Nenhum verde como acento.
- **Fontes proprietárias** `SpotifyMixUI`, `SpotifyMixUITitle`, `SpotifyMixMono`, `CircularSp-*`.
- **Textos e microcopy** ("O que você quer ouvir?", "Mostrar tudo", "Sua Biblioteca", "Pré-visualização do Spotify", "Inscreva-se grátis" etc.). Escrever microcopy própria em pt-BR.
- **Ícones proprietários** (Início, Biblioteca, Navegar, botão play da marca). Usar um conjunto aberto (ex.: Lucide, licença ISC) ou SVGs desenhados para o projeto.
- **Imagens do catálogo** (capas de terceiros) e capturas de tela.
- **O gradiente exato** `rgb(175,40,150) → rgb(80,155,245)` da barra anônima. Além de ser da marca, texto branco sobre o fim azul (`#509bf5`) tem só **2,86:1** de contraste (calculado) — reprova em AA.
- **Padrões comerciais**: convite de cadastro, oferta Premium, "Abrir o app".
- **Nomes de classes, `data-testid` e código** do Spotify.

---

## 10. Plano de implementação e validação

1. **Tokens** (`DESIGN_SYSTEM.md` §3) em `assets/css/tokens.css`; nenhum valor de cor fora dos tokens.
2. **Shell** em CSS Grid com `grid-template-areas` (topbar / sidebar / main / player) e breakpoints da seção 7 do DESIGN_SYSTEM.
3. **Componentes** na ordem: botão → cartão → prateleira → linha de faixa → player honesto → linha do tempo → rodapé.
4. **Roteamento por hash** e estado (ver DESIGN_SYSTEM §8).
5. **Validação** (Agente 3 e auditoria):
   - Medir com Playwright, em 1440×900, 1024×768, 820×1180 e 390×844, as mesmas grandezas deste documento (caixas do shell, cartões, player, barra de abas) e comparar com a seção 11.
   - Lighthouse/axe para acessibilidade; contraste conferido com o script de cálculo do DESIGN_SYSTEM.
   - Navegação só por teclado em todas as views; `prefers-reduced-motion: reduce` emulado.
   - `document.documentElement.scrollWidth <= innerWidth` em todas as larguras (sem rolagem horizontal da página).
   - Busca no código por `1ed760`, `1db954`, `Spotify`, `Circular` → zero ocorrências (exceto em links para faixas no Spotify e no texto de aviso de não afiliação).

---

## 11. Critérios objetivos de fidelidade visual (checklist mensurável)

> Tolerância padrão: ±2 px em medidas, salvo indicação. "Medir" = `getBoundingClientRect`/`getComputedStyle` em contexto novo do navegador.

**Shell**
- [ ] F1. Em ≥ 1024 px, o shell é um grid com áreas `topbar`, `sidebar`, `main`, `player`; `padding` 8 e `gap` 8 na moldura (ref. [OBS] 8/8).
- [ ] F2. Moldura com fundo `--color-bg-frame` e painéis (`sidebar`, `main`) com fundo `--color-bg-base` e raio ≥ 8 px.
- [ ] F3. Faixa superior com **64 px** de altura em ≥ 768 px (controles de 40–48 px).
- [ ] F4. Lateral **fixa** (não rola com a página) de **280 px** em 1024–1279 e **300 px** em ≥ 1280 (ref. [OBS] 280 mín. / 331).
- [ ] F5. Em 768–1023 px, lateral recolhida em trilho de **72 px** só com ícones + rótulo acessível (decisão de projeto; o Spotify mantém 280).
- [ ] F6. Em < 768 px, não há lateral; há **barra superior de 56 px** e **barra de abas inferior de 64 px** (+ `env(safe-area-inset-bottom)`) com ≤ 5 itens (ref. [OBS] 56 / 70).
- [ ] F7. Só a área principal rola; barra superior, lateral e player permanecem visíveis.
- [ ] F8. Sem rolagem horizontal da página em 320, 390, 820, 1024 e 1440 px.

**Player honesto**
- [ ] F9. Barra inferior fixa, largura total menos 16 px (8 de cada lado) em ≥ 768 px, altura **72 px** (ref. [OBS] 66–86).
- [ ] F10. Em < 768 px, mini-player de **56 px** acima da barra de abas.
- [ ] F11. Não existe barra de progresso, tempo ou botão "pausar"; existe texto visível "Este site não toca áudio" (ou equivalente) e ao menos 1 link oficial por faixa com link confirmado.

**Cartões e prateleiras**
- [ ] F12. Cartão com padding **12**, raio **6–8**, imagem quadrada (1:1) com raio 6; título 16 px; subtítulo 14 px em `--color-text-secondary`.
- [ ] F13. Em ≥ 1280 px, a largura do cartão fica entre **180 e 200 px** (ref. [OBS] 196); em 1024 px, entre **160 e 180** (ref. 178).
- [ ] F14. Prateleira: título h2 **24 px/700** (20 px em < 600 px) + link "Ver tudo" alinhado à direita; ≈ 48 px entre prateleiras.
- [ ] F15. No celular, carrossel horizontal com `scroll-snap`, gutter **16 px**, gap **16 px**, capa de 140–160 px (ref. [OBS] 152).
- [ ] F16. Hover (ponteiro fino): fundo do cartão muda para `--color-bg-highlight` e aparece o botão circular de 48 px no canto inferior direito da capa, com sombra.

**Tipografia e cor**
- [ ] F17. Nenhuma ocorrência de `#1ed760`, `#1db954`, `SpotifyMix`, `Circular` no CSS.
- [ ] F18. Dois níveis principais de texto (primário branco, secundário ≥ 4,5:1) em todas as superfícies.
- [ ] F19. Base de 16 px; nenhum texto < 12 px (rótulo da barra de abas: 12 px; o Spotify usa 11).

**Interação e acessibilidade**
- [ ] F20. Link "Pular para o conteúdo" como primeiro foco.
- [ ] F21. `:focus-visible` com anel de 2 px e contraste ≥ 3:1 em todos os elementos focáveis.
- [ ] F22. Botões e links de navegação com alvo ≥ 44×44 px (exceto links inline em texto corrido).
- [ ] F23. Transições ≤ 300 ms em elementos de UI; `prefers-reduced-motion: reduce` remove `transform` animado.
- [ ] F24. Item de navegação ativo com `aria-current="page"` e indicador visual que não dependa só de cor.
