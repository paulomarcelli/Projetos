# Auditoria de interface — Fase 4 (Agente 2)

> 2026-10-16 (UTC). Escopo: interface, fidelidade aos padrões observados no Spotify (`SPOTIFY_REVERSE_ENGINEERING.md`), aderência ao `DESIGN_SYSTEM.md` e consistência visual.
> **O site não foi editado.** As correções abaixo são propostas para o Agente 3.
> Medições refeitas de forma independente (o `TEST_REPORT.md` não foi usado como fonte de valores).

## 0. Método e evidências

| Item | Valor |
|---|---|
| Versão auditada | `index.html` e `assets/css/main.css` de 16:52:53, `tokens.css` de 16:27:55, JS de 16:37–16:40 (sem mudança entre o início e o fim da auditoria) |
| Servidor | `python3 -m http.server 8766 --bind 127.0.0.1` (encerrado no fim) |
| REA `capture_browser_scenario` 1440 (launch) | `ev_78fe1b6077ea0c09d52ea82cc7a72ce28c0e64fb93f6632baa93f08ba95d179d`: `#inicio` → clique em "Próxima etapa" → `#historia` → "Próxima" → `#capitulo-1` → "Etapa anterior" → `#historia`. 8/8 passos ok |
| REA `capture_browser_scenario` 390 (launch) | `ev_3ec6da57bd30cb6ec72ec6f4a6d3130e8d16978726cbcf5a3b35f81bbddfb92f` (captura `rea-390-inicio.png`) |
| Playwright (medição complementar) | `scripts/audit.js` (5 larguras × 8 views: 1440×900, 1024×768, 820×1180, 390×844 e 320×640, as duas últimas com UA de iPhone e toque) e `scripts/audit2.js` (foco, toque, player e correções simuladas com `addStyleTag`) |
| Arquivos | `/tmp/claude-0/-home-user-Projetos/7931bf90-6349-50dc-a767-5b37cf9c57ea/scratchpad/audit/`: `audit.json`, `audit2.json`, `v-<largura>-<view>.png` (40 capturas), `chapters-*.png`, `hero-*-FIXED.png`, `timeline-1440.png`, `player-*-selected.png`, `compare-{1440,1024,390}.png` (Spotify ao lado) |
| Limitação | No navegador do REA (modo launch) o Google Fonts não carrega (CA do proxy), então essas capturas usam fonte do sistema. No Playwright com proxy, Fredoka e Figtree carregaram (5–6 faces). |

---

## 1. Critérios F1–F24 (medição independente)

| # | Medido | Status |
|---|---|---|
| F1 | 1440/1024: áreas `"topbar topbar" "sidebar main" "player player"`, padding 8, gap 8 | ✅ |
| F2 | corpo `#07070D`; `main` `rgb(17,17,26)` = `#11111A`, raio 8 | ✅ |
| F3 | topbar 64 px em 1440/1024/820; botões ‹ › de 44 px | ✅ |
| F4 | lateral 300 (1440) e 280 (1024); posição idêntica antes e depois de `main.scrollTop = 800` | ✅ |
| F5 | 820: coluna de 72 px | ✅ |
| F6 | 390/320: lateral `display:none`, topo 56, abas 64 (+ `env(safe-area-inset-bottom)` no CSS), 5 itens de 78×63 / 64×63 | ✅ |
| F7 | `body overflow:hidden`; barras com o mesmo `top` antes e depois de rolar; `scrollY` 0 | ✅ |
| F8 | `scrollWidth` = largura da janela em 40/40 combinações; `main.scrollWidth` = `clientWidth` | ✅ |
| F9 | 1440: 1424×72; 1024: 1008×72; 820: 804×72 | ✅ |
| F10 | 390: player 56 em y=724, abas em y=780 | ✅ |
| F11 | sem `progress`/`slider`; texto "Este site não toca áudio" visível em todas as larguras; após selecionar Otro Mood: YouTube, Spotify, Apple Music, Detalhes (44 px) | ✅ |
| F12 | padding 12, raio 8, título 16, subtítulo 14 `#B9B9CC` ✅ — **mas a imagem não é 1:1 nos cartões com foto** (172×240 e 172×258 em 1440) | ❌ → U1 |
| F13 | 1440: 196; 1024 e 820: 160 (no limite inferior da faixa 160–180) | ✅ |
| F14 | h2 24/700 (20/700 em < 600); "Ver tudo" encostado à direita; 40 px entre o fim de uma prateleira e o próximo título (meta ≈ 48) | ✅ (aceitável) |
| F15 | 390: `scroll-snap-type: x mandatory`, 1º cartão em x=16, gap 16, capa 152 | ✅ |
| F16 | hover: fundo `transparent` → `#262635`; FAB 48×48 a 8 px da direita e da base da capa, opacidade 0→1, sombra `0 8px 16px rgba(0,0,0,.35)` | ✅ |
| F17 | 0 ocorrências de `1ed760`, `1db954`, `SpotifyMix`, `Circular` | ✅ |
| F18 | sem mudança nos pares de cor do DESIGN_SYSTEM; nenhuma cor de texto nova | ✅ |
| F19 | menor texto visível: 12 px nas 8 views e 5 larguras | ✅ |
| F20 | entrando em `/`: 1º Tab = "Pular para o conteúdo" ✅; entrando em `/#inicio` ou `/#musica`: 1º Tab vai para `[1]`/`[85]` | ⚠️ → U12 |
| F21 | anel 2 px azul em controles; cartões usam o anel no `::after` do link esticado (`.card__link:focus-visible::after`) | ✅ |
| F22 | nenhum controle < 44 px fora de texto corrido (links de cartão são esticados) | ✅ |
| F23 | maior `transition-duration` computada: 300 ms | ✅ |
| F24 | `aria-current="page"` + barra em gradiente + fundo; nos capítulos, a aba ativa no celular é "História" | ✅ |

**Resultado: 22 ✅, 1 ❌ (F12), 1 ⚠️ (F20).**

---

## 2. Problemas encontrados

Gravidade: **Alta** (quebra visual evidente ou contradiz o PRD) · **Média** (prejudica uso/consistência) · **Baixa** (polimento).

| ID | Gravidade | View / largura | Evidência | Problema | Correção proposta |
|---|---|---|---|---|---|
| U1 | **Alta** | Início › "A história em 3 capítulos", todas as larguras | `audit.json` `chapterCards`: placeholder 172×172; fotos **172×240** e **172×258** (1440), 136×190 (1024), 152×212/228 (390); `chapters-1440.png` | O `aspect-ratio: 1/1` de `.card__media` não segura a altura: a `<img>` com `width/height` intrínsecos (500×697, 640×960) estica a caixa. Os cartões 02/03 ficam mais altos que o 01, e o "02"/"03" caem fora do lugar. Viola F12. | `.card__media { position: relative; aspect-ratio: 1 / 1; overflow: hidden; }` e `.card__img { position: absolute; inset: 0; width: 100%; height: 100%; }`. Simulado: 3 cartões ficam 172×172, altura do cartão 290 (`chapters-1440-FIXED.png`). |
| U2 | Média | Início › cartões 02 e 03 | `chapters-1440-FIXED.png` | Com a capa quadrada, `object-position: top` corta o alto da cabeça no 02 (foto de show) e deixa o rosto do 03 encostado no topo. **Hoje o 03 não corta o rosto** (aparece inteiro), mas só porque a imagem está esticada (U1). | Recorte por imagem: `.card__img[src*="show-2017"] { object-position: 50% 10%; }` e `.card__img[src*="casi-el-paraiso-2024-pose"] { object-position: 50% 15%; }` (ou `style="object-position:…"` no `<img>`). Conferir na captura depois do U1. |
| U3 | Média | Início › capítulos | `chapters-1440.png` | O cartão 01 é placeholder e os 02/03 têm foto: a prateleira de abertura fica desigual. | Até haver foto autorizada da infância, usar no 01 um tratamento editorial (fundo `--gradient-hero`, número "01" grande em Fredoka e ícone de patins/borboleta) em vez do "Imagem pendente". Opcional: o mesmo tratamento nos três, com a foto só na view do capítulo. |
| U4 | **Alta** | Início, **1024 e 820** | `audit.json` `hero.portrait`: 1024 = **154×232**, 820 = **145×200**; `v-820-inicio.png` | O retrato do hero vira **oval**: em linha (`flex-direction: row`), o `.hero__media` encolhe, enquanto a altura fixa continua. | `.hero__media { flex: none; }` e `.hero__portrait { flex-shrink: 0; aspect-ratio: 1 / 1; }`. Simulado: 200×200 (820) e 232×232 (1024) (`hero-820-FIXED.png`). |
| U5 | **Alta** (PRD) | Início › hero, todas | `index.html:144` | O botão "Ouvir destaques" promete áudio num site que não toca áudio (PRD §8, DESIGN_SYSTEM §1.3 "honestidade"). | Trocar o texto por **"Conhecer as músicas"** (ou "Ver as músicas"). No mini-player do celular, trocar "Ouvir" por **"Onde ouvir"** (abre a folha com os links oficiais). |
| U6 | Média | Início, 390 e 320 | REA `ev_3ec6…fb92f` (`rea-390-inicio.png`); `audit.json` `hero.credit` 390: y 715–733, borda do `main` em 724 | O crédito da foto (CC BY 3.0, **atribuição obrigatória**) fica cortado na dobra, colado ao mini-player, e em 320 fica fora da primeira tela (y≈757). Ao rolar ele aparece (`creditReach.visible: true`), mas no primeiro olhar parece escondido atrás do player. | Levar o crédito para junto da foto: envolver retrato e crédito em `<figure class="hero__media">` com `<figcaption class="hero__credit">` logo abaixo da imagem (centralizado no celular, 12 px). CSS: `.hero__media { display: flex; flex-direction: column; align-items: center; gap: var(--p-space-2); }`. |
| U7 | Média | Música, 390 e 320 | `audit.json` `trackTap`: centro da linha → `LINK:Lyric video` (390) / `LINK:YouTube` e `LINK:Apple Music` (320); `audit2.json` `tapCenter`: o toque abriu **nova aba** e a faixa **não** foi selecionada; linhas de **165–186 px** | No celular, o botão invisível de seleção cobre a linha, mas os 2–3 links oficiais (camada acima) ocupam a faixa central. Tocar no meio abre uma plataforma externa em vez de selecionar. A linha fica alta e com dois comportamentos misturados. No Spotify móvel, tocar na linha toca a faixa e os extras ficam num menu. | Esconder os links da linha no celular com JS ativo; eles continuam acessíveis no mini-player → folha "Onde ouvir": `@media (max-width: 767px) { .js .track__links, .js .track__nolink { display: none; } }`. Simulado: linha com **61 px** e o toque no centro seleciona. Sem JS, a regra não vale e os links aparecem. Opcional: um ícone "+"/"✓" (24 px, `aria-hidden`) no fim da linha como affordance de seleção. |
| U8 | Média | História, ≥ 1024 | `audit2.json` `timeline`: `scrollLeft: 40` na carga; seta ‹ em x=348 sobre o 1º marco (x=316), **não desabilitada**; `timeline-1440.png` | A linha do tempo abre já rolada 40 px: "1999" fica cortado sob a seta ‹, que aparece ativa no início da lista. | `.timeline__list { scroll-padding-inline: var(--content-pad); }` e, no JS das prateleiras, aplicar à linha do tempo o mesmo estado das prateleiras: `seta.disabled = lista.scrollLeft <= 1` (e `scrollLeft + clientWidth >= scrollWidth - 1` para ›), escondendo a seta desabilitada (`.shelf__arrow:disabled { opacity: 0; pointer-events: none; }`). |
| U9 | Baixa | História, ≥ 1024 | `audit2.json` `timeline.items`: o topo do ano alterna entre 310 e 315 px | Os anos dos marcos não ficam na mesma linha de base. Itens com rótulo de 3 linhas têm as linhas da grade esticadas (`height: 100%` + `align-content: normal`). | `.timeline__link { align-content: start; }`. |
| U10 | Baixa | História › "Os capítulos" | `audit2.json` `chapterLinks`: 72 / 93 / 93 px | Os três cartões de capítulo têm alturas diferentes. | `.chapter-links > li { display: flex; } .chapter-link { flex: 1; }` |
| U11 | Média | Todas exceto Início | `audit.json`: `h1count = 0` em 7 das 8 views; títulos de view são `<h2 class="view__title">` (56 px) | Só o Início tem `h1`. Nas outras views o título principal é `h2`, e os títulos de seção ficam `h3` com tamanhos que se contradizem (Música: `h3` 18 px "A trilha…" e `h3` 32 px "Mariposas"; História: `h3` 24 px "Os capítulos" com o mesmo estilo dos `h2` de prateleira do Início). Isso contraria o DESIGN_SYSTEM §5.4 ("`h1` único por view") e enfraquece a navegação por títulos (WCAG 1.3.1). | Trocar `.view__title` para `<h1>` em cada view (só uma fica visível por vez; sem JS, vários `h1` em `<section>` são aceitáveis). Subir os títulos de seção para `h2` (`.shelf__title`, "A trilha de…", "Os capítulos") e deixar `h3` para cartões e destaques. Tamanhos: `h1` = `--text-h1`, `h2` de seção = `--text-h2` (24/20), `h3` = `--text-h3` (18). Os destaques "Mariposas/Más linda" (32 px) podem continuar grandes como `h3` com classe `.feature__title`. |
| U12 | Baixa | Entrada por link com hash (`/#inicio`, `/#musica`) | `scripts/tab.js`: `/` → skip-link; `/#inicio` → `[1]`; `/#musica` → `[85]` | O navegador move o ponto inicial de foco para o alvo do fragmento (a `<section id="inicio">`), então o "Pular para o conteúdo" fica para trás em links profundos. É comportamento padrão; afeta F20 só nessas entradas. | Evitar que o hash da view seja um alvo de fragmento: ids das views com prefixo (`id="view-inicio"`, mantendo o hash `#inicio` resolvido pelo roteador). Âncoras de trecho (`#cap2-teste`, `#fonte-33`) continuam como estão, porque ali mover o foco é desejado. |
| U13 | Média | Início, 390 e 320 | `compare-390.png`; `v-320-inicio.png` | No celular, o hero ocupa toda a primeira tela (retrato 160 + título 40 + intro de 6 linhas + 2 botões): nenhuma prateleira aparece antes de rolar. No Spotify móvel, a primeira prateleira começa em y≈344. | Compactar o hero em < 768: `.hero__portrait { width: 120px; height: 120px; }`, `.hero__intro { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }` (o texto completo continua na História), botões lado a lado com `flex: 1`. Meta: título da 1ª prateleira visível em 390×844. |
| U14 | Média | Todas, < 768 | `rea-390-inicio.png`; `audit.json` `player2` 390: "Nenhuma música selecionada… Ver músicas" | O mini-player vazio ocupa 56 px fixos (7% da tela em 390, 9% em 320) só para dizer que não há faixa. | Esconder o mini-player vazio no celular: `@media (max-width: 767px) { .js .player:not(.has-track) { display: none; } .js .shell:not(:has(.player.has-track)) { grid-template-rows: var(--topbar-h-mobile) minmax(0, 1fr) 0 calc(var(--tabbar-h) + env(safe-area-inset-bottom)); } }`. O aviso "Este site não toca áudio" já aparece no topo de Universo musical. |
| U15 | Baixa | Universo musical, todas | `v-1440-musica.png` | Em `#musica`, o player vazio mostra o botão "Ver músicas", que leva à view em que o usuário já está. | Esconder `.player__details` vazio quando a view ativa é `musica` (`[data-view="musica"] .player:not(.has-track) .player__details { display: none; }`, com `data-view` no `<html>` atualizado pelo roteador) ou trocar o texto por "Escolha uma faixa abaixo". |
| U16 | Baixa | Lições, todas | `audit2.json` `lessonTitle`: 18 px / **19,8 px** de entrelinha (1,1) em Fredoka; `v-1440-licoes.png` | Títulos de lição de 2 linhas ficam apertados ("Aceitar a oportunidade antes de / estar 100% pronta"). | `.lesson h3, .card--lesson .card__title { line-height: var(--p-lh-snug); }` (1,3). |
| U17 | Baixa | Capítulo 2 | `v-1440-capitulo-2.png` | O período do cabeçalho diz "2015–2024", mas o subtítulo começa com "2016–2018: …". É inconsistência de texto, não de layout. | Subtítulo: "Da escalação em 2015 às turnês de 2018, e depois a carreira com o próprio nome." (ou alinhar o período). |
| U18 | Baixa | `main.css` (tokens) | `grep`: 198 usos de `var(--p-*)` em `main.css` (espaçamento, tipo, raio, duração); **0** primitivos de cor; 1 cor literal (`.sheet::backdrop rgb(0 0 0 / .6)`); valores fora da escala: `top/bottom: 10px` (l.154), `margin-top: 6px` (l.454), `padding: 2px 10px` (l.348), `line-height` 1 / 1,2 / 2,2 literais (l.235, 462, 486) | Cores 100% por tokens (o que mais importa). Mas a regra do DESIGN_SYSTEM §3 ("componentes só usam semânticos/componente") não é seguida para espaço, tipo e raio, e há alguns valores fora da escala de 4 px. | (a) Aceitar primitivos de **espaço/tipo/raio/duração** em `main.css` e corrigir a regra no DESIGN_SYSTEM (decisão de documentação, sem custo de código). (b) Criar `--color-scrim: rgb(0 0 0 / 0.6)` em `tokens.css` e usar em `.sheet::backdrop`. (c) Arredondar 10→8 ou 12, 6→8, `2px 10px`→`var(--p-space-1) var(--p-space-3)`. (d) `line-height` com `--p-lh-*` (a legenda com 2,2 → `--p-lh-relaxed`, deixando as etiquetas quebrarem com `row-gap`). |
| U19 | Baixa | Início › cartão 02 | `chapters-1440.png` | A foto do show de 2017 tem baixa resolução e cor estourada: parece borrada perto das outras. | Se o arquivo não tiver versão melhor no Commons, usá-la só na figura do Capítulo 2 (maior, com legenda) e aplicar no cartão o tratamento do U3. |

---

## 3. Consistência visual entre views

| Aspecto | Observado | Avaliação |
|---|---|---|
| Título da view | Início: `h1` 72 px (hero); demais: `h2` 56 px Fredoka (32 px no celular) | Tamanho consistente; semântica inconsistente → U11 |
| Títulos de prateleira/seção | Início `h2` 24/700; História `h3` 24/700; Música `h3` 18 e 32; Créditos `h3` 18 | Mesmo papel com tags e tamanhos diferentes → U11 |
| Cartões | Prateleiras: padding 12, raio 8, título Figtree 16/700, subtítulo 14. Lições: Fredoka 18/700 com entrelinha 1,1 | Variante de lição com tipo diferente é intencional (cartão de leitura), mas a entrelinha precisa de ajuste → U16 |
| Heros | Início e capítulos usam o mesmo `--gradient-hero`; Música/Lições/Créditos sem gradiente | Coerente: gradiente marca "abertura" (artista e capítulo) |
| Etiquetas Fato / Nas palavras dela / Nossa leitura | mesma pílula de 12 px em todas as views | ✅ |
| Navegação ativa | lateral e abas com o mesmo indicador em gradiente | ✅ |

---

## 4. Checklists de pré-entrega

### 4.1 `ui-ux-pro-max` (`references/pro-rules.md`)
| Item | Resultado |
|---|---|
| Sem emoji como ícone; um conjunto só de SVG | ✅ (símbolos `<use href="#i-…">`; nenhum emoji no HTML) |
| Alvos ≥ 44 | ✅ (F22) |
| Estado pressionado sem mexer no layout | ✅ (`scale(.97)` só em `transform`) |
| Tokens semânticos de cor, sem hex solto | ✅ (só `rgb(0 0 0 / .6)` no backdrop → U18b) |
| Contraste no escuro ≥ 4,5 | ✅ (F18) |
| Áreas seguras | ✅ no CSS (`env(safe-area-inset-bottom)` nas abas, no grid e na folha); não testado em aparelho |
| Conteúdo não encoberto por barras fixas | ⚠️ crédito do hero na dobra (U6); `scroll-padding` presente |
| Cor não é o único indicador | ✅ (etiquetas com texto, item ativo com barra + fundo) |
| Movimento reduzido | ✅ no CSS (`prefers-reduced-motion` zera escalas e animações) |
| Carrossel sem rotação automática | ✅ |
| Hierarquia de títulos | ❌ U11 |
| Gutter adaptado à largura | ✅ (16 / 24 / 40) |
| Texto corrido com largura legível | ✅ (`--measure` 68ch nos capítulos) |

### 4.2 `emil-design-eng`
| Antes | Depois | Por quê |
|---|---|---|
| Nenhum `transition: all` encontrado | — | ✅ propriedades explícitas |
| Hover dentro de `(hover: hover) and (pointer: fine)` | — | ✅ |
| FAB entra com `opacity` + `translateY(8px)` | — | ✅ (nada parte de `scale(0)`) |
| Seta ‹ da linha do tempo ativa e sobreposta no início (U8) | esconder/desabilitar no limite | feedback de estado honesto |
| Toque na linha abre link externo (U7) | um gesto = uma ação | evitar ações acidentais |
| Mini-player vazio permanente (U14) | aparece quando há faixa (entrada com `--motion-enter`) | elemento com propósito e transição de estado |

---

## 5. Comparação com o Spotify (lado a lado)

Capturas: `compare-1440.png`, `compare-1024.png`, `compare-390.png` (Spotify à esquerda, site à direita).

- **Familiar, sem copiar a marca.** Estrutura reconhecível: moldura escura com painéis de raio 8 e gap 8, lateral com item ativo, faixa superior de 64 px com ‹ ›, prateleiras com título + "Ver tudo", cartões 196/160 com capa e subtítulo cinza, barra inferior persistente e, no celular, topo de 56 + abas inferiores.
- **Identidade própria:** azul/rosa/lilás do autor no lugar do verde, Fredoka/Figtree no lugar da fonte proprietária, ícones próprios, borboleta, nada de logo, textos ou ícones do Spotify (F17 ✅).
- **Onde se afasta (para pior):** (1) a primeira tela do celular é só hero, enquanto o Spotify mostra conteúdo logo (U13); (2) as prateleiras de cartões desiguais (U1/U3) quebram o ritmo de grade que é a assinatura da referência; (3) o retrato oval em 820/1024 (U4).
- **Onde se afasta (de propósito, e certo):** player honesto sem controles de reprodução; topbar com redes oficiais em vez de busca/conta; timeline editorial.

---

## 6. Respostas às perguntas do orquestrador

| Pergunta | Resposta |
|---|---|
| "Ouvir destaques" sugere áudio? | Sim. Contradiz o PRD → **U5** (trocar por "Conhecer as músicas"; "Ouvir" → "Onde ouvir"). |
| Cartão 01 placeholder × 02/03 com foto; o recorte do 03 corta o rosto? | O desequilíbrio existe (**U3**). O 03 **não** corta o rosto hoje, mas só porque a imagem não respeita o quadrado (**U1**, alta). Depois de corrigir o U1, ajustar o recorte (**U2**). |
| Crédito do hero escondido atrás do mini-player em 390? | Ele fica cortado na borda do `main`, colado ao player, na primeira tela (y 715–733 vs. 724), e some em 320. Não fica sob o player (ao rolar aparece) → **U6** (crédito vira `figcaption` da foto). |
| Toque no centro da linha cai nos links? | Confirmado: no Playwright, o toque abriu nova aba e não selecionou. → **U7** (esconder os links da linha no celular com JS; ficam na folha "Onde ouvir"). |
| Botões voltar/avançar da topbar funcionam? | Sim. REA `ev_78fe…d179d`: inicio → historia → capitulo-1 → (anterior) historia. No Início, "Etapa anterior" está `disabled`; rótulos dinâmicos ("Próxima etapa: História"). |

---

## 7. Ordem sugerida de correção
1. U1, U4, U5 (alta): três mudanças pequenas de CSS/texto.
2. U7, U6, U13, U14 (celular).
3. U11 (títulos), U8 (linha do tempo), U2/U3 (imagens).
4. Baixas: U9, U10, U12, U15–U19.

Depois das correções, refazer: `audit.js` (F1–F24, overflow), toque no centro da linha em 390, captura do Início em 820/1024 e em 390.
