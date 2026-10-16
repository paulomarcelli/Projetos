# Relatório de testes — Site Karol Sevilla (Fase 3)

> Agente 3 — 2026-10-16 (UTC). Todos os resultados abaixo vêm de comandos executados nesta sessão. Nada foi marcado como "passou" sem medição.
> Evidências (capturas, JSON, scripts) ficam **fora do repositório**, em `/tmp/claude-0/-home-user-Projetos/7931bf90-6349-50dc-a767-5b37cf9c57ea/scratchpad/validation/` e `…/scratchpad/pw/`.

## 1. Ambiente e ferramentas

| Item | Valor |
|---|---|
| Servidor | `python3 -m http.server 8765 --bind 127.0.0.1 --directory Projetos/Site-Karol-Sevilla` (encerrado no fim) |
| Navegador | Chromium 141.0.7390.37 (`/opt/pw-browsers/chromium-1194`), headless |
| Automação | Playwright 1.56.1 (global, `/opt/node-tools`), scripts `test.cjs`, `kb.cjs`, `w1280.cjs`, `ov.cjs` no scratchpad |
| REA | rea-agents via MCP: `capture_browser_scenario` (launch, 1440/820/390), `inspect_web_page` e `inspect_web_event_listeners` (CDP em `127.0.0.1:9333`, Chromium próprio, encerrado no fim) |
| Node | v22.22.0 (`node --check`) |
| Python | 3 (`html.parser`, cálculo de contraste WCAG, Pillow 12.3 para WebP) |
| Larguras | 1440×900, 1280×800, 1024×768→900, 820×1180, 390×844 (toque), 320×640 (toque) |

**Observações de ambiente**
- No Playwright, a opção `proxy` mandava até o `127.0.0.1` para o proxy do ambiente (HTTP 405). Resolvido com `--proxy-server` + `--proxy-bypass-list=<-loopback>;127.0.0.1;localhost`. Assim o site local carrega direto e o Google Fonts passa pelo proxy.
- No REA (modo launch), o navegador não usa o proxy nem a CA do ambiente: o único erro de console foi `net::ERR_CERT_AUTHORITY_INVALID` ao baixar a folha do Google Fonts. **É limitação do ambiente de teste, não do site** (no Playwright com proxy as fontes carregaram: `Figtree`, `Fredoka`). O site cai nas fontes do sistema quando isso acontece.

## 2. Validação de sintaxe

| Teste | Comando | Resultado |
|---|---|---|
| JS | `node --check assets/js/{app,player,ui}.js` | 3/3 ok |
| HTML (estrutura) | `html.parser` com pilha de tags e contagem de `id` | `index.html`: 0 tags fora de ordem, 0 abertas, 0 ids duplicados. `primeira-versao/index.html`: idem |
| CSS (chaves) | contagem de `{`/`}` sem comentários | `main.css` 368/368; `tokens.css` 10/10 |
| Links internos | todos os `href="#…"` têm alvo | 142 links, 0 quebrados |
| Termos proibidos | `grep` por *La Casa de los Famosos*, "Quiero volver", "Juego de mentiras", Ángela Aguilar | 0 no texto. Só aparece `angela-aguilar` dentro da URL da fonte [56] (título resumido como "responde a críticas…") |
| F17 | `grep -rniE "1ed760\|1db954\|SpotifyMix\|Circular" assets/` | 0 ocorrências |

Não havia `html5validator`/`vnu` disponível; a checagem de HTML foi estrutural (não valida atributos contra a especificação).

## 3. Navegador — por largura (Playwright, `test.cjs`)

Para cada largura, o script abriu as 8 views por hash, mediu a rolagem horizontal e conferiu que só a view certa aparece.

| Largura | Erros de console | Rolagem horizontal (página e `main`) | Views corretas | Shell medido |
|---|---|---|---|---|
| 1440 | 0 | 0/8 views | 8/8 | grid `"topbar topbar" "sidebar main" "player player"`, colunas 300/1116, linhas 64/732/72, padding 8, gap 8 |
| 1280 | — | `scrollWidth` 1280 | — | lateral 300, cartão 180 |
| 1024 | 0 | 0/8 | 8/8 | colunas 280/720, linhas 64/732/72 |
| 820 | 0 | 0/8 | 8/8 | trilho 72, linhas 64/1012/72 |
| 390 | 0 | 0/8 | 8/8 | `"topbar" "main" "player" "tabbar"`, linhas 56/668/56/64 |
| 320 | 0 | 0/8 | 8/8 | linhas 56/464/56/64 |

Teste de rolagem (F7): `main.scrollTop = 600` + roda do mouse → posições de barra superior, lateral, player e abas **idênticas** antes e depois; `window.scrollY` = 0; `body { overflow: hidden }`.

## 4. Fluxos e interações (1440, Playwright)

| Fluxo | Resultado medido |
|---|---|
| Primeiro Tab | `skip-link` "Pular para o conteúdo", visível; Enter → foco no `<main id="conteudo">`, view continua `inicio` |
| Clique na lateral (8 itens) | 8/8 abrem a view certa; `aria-current="page"` no item clicado; barra `::before` presente; foco vai para o título da view |
| Botões ‹ › | sequência inicio → historia → capitulo-1 → capitulo-2 → capitulo-3 → musica → licoes → creditos (fim, botão desabilitado); rótulo dinâmico "Etapa anterior: Lições" |
| Linha do tempo (clique no marco 2015) | hash `#cap2-teste`, view `capitulo-2`, parágrafo realçado (`is-target`), visível na área do `main`, com foco |
| Linha do tempo (teclado) | `kb.cjs`: Tab chega ao marco com anel `solid 2px rgb(105,185,255)`; Enter no marco 2015 → `#cap2-teste`, foco no parágrafo |
| Voltar do navegador | volta para `#historia` com o marco 2015 marcado `aria-current="step"` |
| Seleção pelo botão do cartão (FAB) | player: "Mariposas" + "Soy Luna: Volver a rodar (trilha), faixa 9 · 2026"; 3 links (YouTube, Lyric video, Apple Music), todos `_blank` + `noopener noreferrer`; `aria-pressed="true"` nas 3 instâncias da faixa |
| Seleção pela linha da faixa | "Otro Mood", 3 links, linha marcada `is-selected` (selo "No player") |
| Faixa sem link oficial | "Mil besos por segundo": 0 links e a frase "Sem link oficial confirmado nesta pesquisa." (nenhum botão sem ação) |
| Filtros | Álbum → 1 faixa (status "1 música na lista"); Trilha 2026 → 2; Todas → 13 |
| Persistência | recarregar mantém a última faixa (`sessionStorage`) |
| Hash desconhecido `#nao-existe` | volta para `#inicio` e mostra "O endereço "#nao-existe" não existe neste site. Você voltou ao Início." |
| Referência `[33]` | abre `#fonte-33` na view Créditos, item realçado |
| Imagem com erro | trocar o `src` por um arquivo inexistente → vira `pendente.svg`, ganha `is-pending`, `alt` passa a "Imagem indisponível: …" (o 404 desse teste é o único erro de console da bateria, provocado de propósito) |
| Imagens | 32 `<img>`: 0 quebradas (`naturalWidth > 0` após forçar o carregamento), 26 pendentes intencionais, 5 fotos reais distintas; 0 sem `alt`, 0 sem `width`/`height`; hero com `loading="eager"` |
| Links externos no DOM | 93 (61 URLs únicas): 0 sem `target="_blank"`, 0 sem `rel="noopener noreferrer"` |

**Celular (390, toque)**

| Fluxo | Resultado |
|---|---|
| Barra de abas | 5/5 abas abrem a view certa com `aria-current="page"`; em `#capitulo-2` a aba ativa é "História" |
| Botão do cartão | visível sem hover (`opacity: 1`) |
| Mini-player | 56 px, encostado na barra de abas (base 780 = topo das abas 780); mostra "Este site não toca áudio"; botão "Ouvir" aparece depois da seleção |
| Folha de links | abre (`<dialog>` modal) com 3 links `_blank` + `noopener noreferrer`; foco no botão Fechar; Esc fecha e devolve o foco a "Ouvir" |
| Linha do tempo | marco "2026 – Volta a Luna" → `#cap3-volta`, trecho realçado |

**Movimento reduzido** (`reducedMotion: 'reduce'`): `--hover-scale` 1, `--press-scale` 1, ponto do marco sem `transform`, botão do cartão sem `transform`, animação da view 120 ms (só opacidade).

**Sem JavaScript**: `<html class="no-js">`, 8/8 views visíveis em sequência, 0 elementos `.js-only` visíveis (nenhum botão sem ação), 22.733 caracteres de texto no `main`, âncora `#cap2-teste` rola até o parágrafo (topo em y = 112).

**Primeira versão** (`/primeira-versao/`): `h1` "Karol Sevilla" com a cor original `rgb(105,185,255)` (CSS carregou), 4 músicas, clique em "Mariposas" mostra "Você escolheu Mariposas!" (JS funciona). Erro de console: 1 × 404 do `favicon.ico`, que o site antigo nunca teve (código preservado sem mudanças).

## 5. REA

| Ferramenta | Evidence ID | Resultado |
|---|---|---|
| `capture_browser_scenario` 1440 (launch, pt-BR, escuro) | `ev_43f558dc19fcaa8a0776b1ccc13617e9be85f40b76b5b58952cbac4142695201` | 8/8 passos ok: `#inicio` → clique "História" → marco 2015 → `#cap2-teste` (espera `#capitulo-2.is-active` ok) → "Universo musical" → "Selecionar Mariposas no player". Árvore de acessibilidade final: `complementary "Faixa selecionada"` com "Mariposas", contexto, "Este site não toca áudio" e lista de 3 links oficiais; botão "Selecionar no player" `[pressed]` |
| `capture_browser_scenario` 820 | `ev_937d1431dbba09e4c7e7f215cf1511339a7daa9dd16bf26a3410a0637af7640b` | 6/6 ok: selecionar Otro Mood, filtro Álbum, botão "Próxima etapa" → `#licoes` |
| `capture_browser_scenario` 390 (1ª tentativa) | `ev_82a42cca0d247297ecf6db5f0a1c22aa6c010a3c087c9296efe040daa1719df9` | Abas, marco 2026 → `#cap3-volta` e aba Música ok; o passo "Selecionar Más linda" falhou por **localizador ambíguo do teste** (2 botões com o mesmo nome: o do destaque e o da linha) |
| `capture_browser_scenario` 390 (2ª) | `ev_0311840badad9df83e369fb29be52601ad6cb9ab497d10917879955212a197ea` | Clique no **centro** da linha "Más linda" foi interceptado pelo link "Lyric video" (no celular os links ficam na 2ª linha da faixa, sobre o centro do botão invisível). Ver §9 |
| `capture_browser_scenario` 390 (3ª) | `ev_0bab0259c3da290b64efe577de3906ba1dce22910539f03e233b490366d4ab11` | 4/4 ok: botão do cartão "Más linda" → "Ouvir" → folha de links aberta (captura `rea-390-sheet.png`) |
| `inspect_web_page` (CDP, `#musica`) | `ev_db85f98854e26f3c596b00af9682b2e6c8d82f19cd9dd048fbe945712ce8dbfa` | Recursos de mesma origem: 2 CSS, 3 JS, `pendente.svg`, retrato WebP; 0 workers; armazenamento vazio na carga (sem chaves); recursos do Google Fonts excluídos pela política de origem do REA (`disallowed_origin`) |
| `inspect_web_event_listeners` `#player-abrir` | `ev_5464d9518b98004b465857b56b2c86f3802b15e4a5ad82aff279cc5cc0fa9482` | 1 listener `click` em `player.js:93` (`abrirFolha`) |
| `inspect_web_event_listeners` `#passo-proximo` | `ev_e06cac1dc69a1b79bfe32c78766ea4b315844ff36d6872c4fee7fee375608d54` | 1 listener `click` em `app.js:142` |

Os cliques em cartões, faixas e filtros usam delegação (`document.addEventListener('click')`), que o REA declara não enumerar; eles foram cobertos pelos cenários acima e pelo Playwright.

## 6. Critérios F1–F24

| # | Critério | Valor medido | Status |
|---|---|---|---|
| F1 | Grid com `topbar`/`sidebar`/`main`/`player`, padding 8, gap 8 (≥ 1024) | 1440 e 1024: áreas corretas, `padding: 8px`, `gap: 8px` | passou |
| F2 | Moldura `--color-bg-frame`; painéis `--color-bg-base`, raio ≥ 8 | corpo `rgb(7,7,13)` (#07070D); lateral e main `rgb(17,17,26)` (#11111A), raio 8 px | passou |
| F3 | Faixa superior 64 px (≥ 768), controles 40–48 | 64 px em 820/1024/1440; controles 44 px | passou |
| F4 | Lateral fixa 280 (1024–1279) / 300 (≥ 1280) | 1024: 280; 1280: 300; 1440: 300; posição y inalterada ao rolar o `main` | passou |
| F5 | Trilho de 72 px em 768–1023 | 820: 72 px, só ícones, rótulos visualmente ocultos (acessíveis) | passou |
| F6 | < 768: sem lateral, topo 56, abas 64 + safe area, ≤ 5 itens | 390 e 320: lateral `display:none`, topo 56, abas 64 (`calc(64px + env(safe-area-inset-bottom))`, 0 no teste), 5 itens de 78×63 / 64×63 | passou |
| F7 | Só o `main` rola | `body overflow:hidden`; `main overflow-y:auto`; barras com y idêntico antes/depois; `scrollY` 0 | passou |
| F8 | Sem rolagem horizontal em 320/390/820/1024/1440 | 0 de 40 combinações (5 larguras × 8 views) | passou |
| F9 | Player fixo, largura total − 16, altura 72 (≥ 768) | 1440: 1424×72; 1024: 1008×72; 820: 804×72 | passou |
| F10 | Mini-player 56 acima das abas (< 768) | 390: 56 px, base 780 = topo das abas 780 | passou |
| F11 | Sem progresso/tempo/pausar; texto "não toca áudio"; ≥ 1 link por faixa com link | 0 `progress`/`progressbar`/`slider`/`range` no player; texto visível em todas as larguras; 11 faixas com link, 2 sem link mostram aviso em vez de botão | passou |
| F12 | Cartão: padding 12, raio 6–8, imagem 1:1 raio 6, título 16, subtítulo 14 secundário | ≥ 768: padding 12, raio 8, imagem 172×172 (1440) e 136×136 (1024/820), raio 6, título 16 px, subtítulo 14 px `rgb(185,185,204)` | passou (no celular o padding é 0 para cumprir F15, como no Spotify móvel) |
| F13 | Cartão 180–200 (≥ 1280); 160–180 (1024) | 1440: 196; 1280: 180; 1024: 160 | passou (1280 e 1024 no limite inferior) |
| F14 | h2 24/700 (20 em < 600) + "Ver tudo" à direita; ≈ 48 entre prateleiras | ≥ 600: 24 px/700; < 600: 20 px/700; "Ver tudo" encostado à direita (0 px); distância 49 px (desktop) / 51 px (celular) | passou |
| F15 | Celular: carrossel com snap, gutter 16, gap 16, capa 140–160 | `scroll-snap-type: x mandatory`, 1º cartão a 16 px, gap 16, passo 168, capa 152 | passou |
| F16 | Hover: fundo `--color-bg-highlight` + botão 48 no canto inferior direito, com sombra | fundo `transparent` → `rgb(38,38,53)` (#262635); botão 48×48, a 8 px da direita e da base da capa, opacidade 0 → 1, sombra `0 8px 16px rgba(0,0,0,.35)` | passou |
| F17 | Sem `#1ed760`, `#1db954`, `SpotifyMix`, `Circular` no CSS | 0 ocorrências | passou |
| F18 | Primário branco; secundário ≥ 4,5:1 em todas as superfícies | secundário: 10,40 (moldura), 9,72 (base), 8,82 (elevada), 7,71 (hover), 8,17 (translúcida), 4,59 (hero, pior caso 35% azul) | passou |
| F19 | Base 16; nenhum texto < 12 | menor texto visível em todas as 8 views: 12 px | passou |
| F20 | Pular para o conteúdo como 1º foco | 1º Tab = `.skip-link`, visível | passou |
| F21 | `:focus-visible` com anel de 2 px e contraste ≥ 3:1 | 77 elementos focáveis percorridos por Tab em `#musica` (+ marcos em `#historia`): 0 sem anel; anel `outline 2px #69B9FF` ou `box-shadow` 2 px azul; contraste 8,10–9,55:1 | passou |
| F22 | Alvos ≥ 44×44 (exceto links em texto corrido) | 184 controles medidos em 6 views: 0 abaixo de 44 (após correção do link "TikTok", ver §8) | passou |
| F23 | Transições ≤ 300 ms; movimento reduzido sem `transform` | maior `transition-duration` computada: 300 ms; com `reduce`: escalas 1, sem `transform` no ponto e no botão | passou |
| F24 | Item ativo com `aria-current="page"` e indicador que não depende só de cor | lateral e abas com `aria-current="page"`; barra/traço com gradiente (`::before`) + fundo + negrito | passou |

**Resumo: 24/24 passaram.**

## 7. Contraste (WCAG 2.1, fórmula de luminância relativa)

| Uso | Par | Razão | Mínimo |
|---|---|---|---|
| Texto primário | #FFFFFF sobre #07070D / #11111A / #1B1B27 / #262635 | 20,09 / 18,77 / 17,04 / 14,88 | 4,5 |
| Texto primário em bloco "Nossa leitura" | #FFFFFF sobre #22222A (7% branco) | 15,79 | 4,5 |
| Texto secundário | #B9B9CC sobre moldura / base / elevada / hover / translúcida | 10,40 / 9,72 / 8,82 / 7,71 / 8,17 | 4,5 |
| Secundário no hero (pior caso) | #B9B9CC sobre #304C6A | 4,59 | 4,5 |
| Primário no hero | #FFFFFF sobre #304C6A | 8,87 | 4,5 |
| Terciário | #9494AB sobre base / elevada | 6,33 / 5,75 | 4,5 |
| Links azuis | #69B9FF sobre base / elevada / translúcida | 8,92 / 8,10 / 7,51 | 4,5 |
| Rosa (hover de link, sobretítulo) | #FF69B4 sobre base / elevada | 7,09 / 6,43 | 4,5 |
| Lilás (números) | #B79CFF sobre base / elevada | 8,23 / 7,47 | 4,5 |
| Botão primário / FAB | #0B0B14 sobre #69B9FF | 9,31 | 4,5 |
| Chip ativo / item selecionado | #0B0B14 sobre #FFFFFF | 19,59 | 4,5 |
| Selo "Destaque" | #0B0B14 sobre #FF69B4 | 7,40 | 4,5 |
| Anel de foco | #69B9FF sobre moldura / base / elevada | 9,55 / 8,92 / 8,10 | 3 |
| Borda de botão secundário | #7A7A94 sobre base / elevada / moldura | 4,50 / 4,09 / 4,82 | 3 |
| Bordas das etiquetas | rosa / lilás sobre base | 7,09 / 8,23 | 3 |
| Borda do aviso de rota | #FFC56B sobre base | 12,02 | 3 |

0 pares reprovados.

## 8. Links externos (`curl -I -L`, GET quando HEAD ≠ 200)

64 URLs únicas extraídas dos `href` de `index.html` (inclui os `preconnect`).

| Resultado | Quantidade | Detalhe |
|---|---|---|
| 200 no HEAD | 52 | |
| 200 só no GET | 6 | `kivamusic.lnk.to/Imperfecta` (HEAD 204), `www.tiktok.com/@karolsevillaokay` (HEAD 403), 4 páginas da Wikimedia/Wikipedia que deram 429 no HEAD; `commons…Sedal_2021_3.jpg` deu 200 na nova tentativa |
| 429 (limite de requisições) | 2 | `en.wikipedia.org/wiki/Soy_Luna_Live` e `instagram.com/karolsevillaofc/` (persistiram após 30 s) — bloqueio por excesso de pedidos, não link quebrado |
| 403 | 1 | `viapais.com.ar/…chica-disney/` (fonte [15]); o site bloqueia o `curl`. A fonte é a mesma da pesquisa (lida só pelo resumo de busca) |
| 404 | 2 | `https://fonts.googleapis.com` e `https://fonts.gstatic.com` — são `preconnect` (só a origem), não links navegáveis; esperado |

## 9. Problemas encontrados e corrigidos

| Problema | Onde | Correção | Verificação |
|---|---|---|---|
| Botões Instagram/YouTube apareciam no topo do celular | `.btn` (declarado depois) vencia `.topbar__social` | seletor `.topbar .topbar__social` | captura 390 sem os botões |
| Marca "Karol Sevilla · fã-site" quebrava em 3 linhas no topo do celular | `.topbar__brand` | `white-space: nowrap` | captura 390 |
| Linha do tempo horizontal sem forma de rolar com mouse | `#historia` ≥ 1024 | setas ‹ › (mesmo componente das prateleiras) | captura 1440 |
| Número do capítulo espremia o título no celular | `.hero--chapter` | empilhado em < 600 | captura 390 |
| Rolagem horizontal escondida no `main` em Créditos (320–1024) | nomes de arquivo longos no grid | `grid-template-columns: minmax(0,1fr)` e `overflow-wrap:anywhere` | 0/40 após a correção |
| Link "TikTok" da lateral com 42×44 | `.sidebar__links a` | `min-width: 44px` | F22: 0 alvos pequenos |
| Distância entre prateleiras 57–59 px | `.shelf` | margem 48 → 40 | 49 px |
| Realce de trecho com transição de 600 ms | `.prose > p[id]` | 300 ms | F23: máx. 300 ms |
| Link de pular (`#conteudo`) era tratado como hash desconhecido | roteador | caso especial: mantém a view e foca o `main` | Enter no link → foco em `conteudo`, view `inicio` |
| Botões "Selecionar no player" dos destaques tinham o mesmo nome | `#musica` (achado no REA) | `aria-label="Selecionar Mariposas/Más linda no player"` | árvore de acessibilidade |
| Cartões de lição encostados uns nos outros | prateleira "Para refletir" | `gap: 16px` | 1440: `column-gap` 16 px |

## 10. Limitações conhecidas

- **Toque no centro de uma faixa no celular:** os links oficiais ficam na 2ª linha da faixa, sobre o centro do botão de seleção invisível; um toque exatamente no meio abre o link, não seleciona (achado do REA, evidência `ev_0311…97ea`). Tocar no título ou na capa seleciona normalmente, e os cartões e o destaque têm botões próprios. Não corrigido para não reduzir a área dos links.
- `env(safe-area-inset-bottom)` foi verificado só no CSS (no teste vale 0); falta testar num iPhone real.
- A validação de HTML foi estrutural (`html.parser`); não houve validador W3C (`vnu`) disponível offline.
- Os URLs de Open Graph são absolutos e supõem `https://paulomarcelli.github.io/Projetos/`.
- As fontes do Google não carregam no navegador do REA (CA do proxy); o layout usa as fontes do sistema nesse caso.
- Contraste do texto secundário no topo do hero (4,59:1) está no limite; não usar tinta acima de 35% atrás dele.
- O "player" do celular abre a folha de links; no desktop os links ficam na própria barra. Não há reprodução de áudio por decisão do PRD.

## 11. Pendências

**Imagens a fornecer (26 espaços com `is-pending` e comentário `<!-- IMAGEM … -->`):**
- Capas: Mariposas, Más linda (cartão, destaque e linha), *Imperfecta*, Otro Mood, Cenicienta, Una noche más, Weekend, Anónimo, Miedo de sentir, Dime dime, Tus besos, Vuélveme a mirar así, Mil besos por segundo, e a capa do player.
- Capítulo 1: foto da infância / início na TV (cartão 1:1 e figura 16:9).
- Capítulo 2: cena de *Soy Luna* com patins (4:5).
- Capítulo 3: Karol como Luna em *Volver a rodar* (4:5).

**Itens a validar (da pesquisa, `RESEARCH_KAROL_SEVILLA.md` "Precisa de validação"):** filmografia sem referência própria (marcada no Capítulo 1); data de estreia de *Soy Luna* (14/03/2016, citada só como "março de 2016"); origem de "Mariposas" para *Imperfecta* (não usada); produtor e tema de "Más linda" (não usados); entrevistas de 2022 [52]–[54] lidas só por resumo; revisão de licença ⚠ de arquivos do Commons não usados.

**Próxima ação:** auditoria cruzada (Fase 4–5).
