# Design system — "Karol Sevilla: história, superação e música"

> Agente 2 — 2026-10-16. Base: `SPOTIFY_REVERSE_ENGINEERING.md` (evidências REA), `RESEARCH_KAROL_SEVILLA.md` (conteúdo) e `PROJECT_BRIEF.md` (PRD).
> Stack: HTML + CSS + JavaScript puro, sem build, publicado no GitHub Pages.
> Marcadores: **[OBS]** = medido no Spotify (ver o documento de engenharia reversa); **[DEC]** = decisão de projeto.

---

## 1. Identidade

### 1.1 Conceito: "Noite de Luna, asas de mariposa"
A estrutura vem do app de música (painéis escuros, lateral, prateleiras, barra inferior). A **cor, a forma e o tom** vêm da história da Karol:

| Elemento | Origem | Como aparece |
|---|---|---|
| **Azul Luna `#69B9FF`** (acento primário) | Paleta original do autor (`--azul` do primeiro site) + céu noturno de *Soy Luna* | Links, foco, botão "Selecionar", item ativo, linha do tempo |
| **Rosa `#FF69B4`** (acento secundário) | Paleta original do autor (`--rosa`, hover do primeiro site) | Destaques musicais (*Mariposas*, *Más linda*), hover de links, marcadores |
| **Lilás mariposa `#B79CFF`** (ponte) | Mistura do azul com o rosa — a transformação de "Mariposas" | Ponto médio do gradiente, ícones de borboleta, chips |
| **Gradiente mariposa** azul → lilás → rosa | Asas de borboleta; as duas cores do autor se encontrando | Fio de 2 px no topo do player, fundo tingido do hero, faixa de capítulo ativo |
| **Fundo "noite"** `#07070D`/`#11111A` (preto azulado) | Moldura preta observada no Spotify [OBS], com leve azul para não ser o `#121212` dele | Moldura e painéis |
| **Formas arredondadas** (pílulas, cantos de 8–16 px, display arredondada) | Rodas dos patins de Luna; tom acolhedor | Botões, chips, títulos |
| **"Imperfecta"** | Primeiro álbum autoral (2026) | Licença estética: pequenas assimetrias editoriais (legenda manuscrita/itálico, grão sutil no hero), nunca "polido demais" |

**Sem verde Spotify** (`#1ed760`/`#1db954`) e sem nenhum verde como acento.

### 1.2 Tipografia (Google Fonts, licença OFL)

| Papel | Fonte | Pesos | Justificativa |
|---|---|---|---|
| Display (títulos, hero, números da linha do tempo) | **Fredoka** (variável `wght 300–700`, `wdth 75–125`) | 500, 600, 700 | Arredondada como rodas de patins; jovem sem ser infantil; o eixo `wdth` permite títulos condensados no celular. Substitui o papel de `SpotifyMixUITitle` [OBS]. |
| Texto e UI | **Figtree** | 400, 500, 700, 800 | Sans geométrica limpa, próxima do ritmo da sans observada [OBS] (corpo 16, botões 700), mas livre; ótima legibilidade em 14–16 px no escuro. |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
```
Fallback: `ui-rounded, "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif` (display) e `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` (texto).

### 1.3 Voz e tom (skill `brand`)

**Personalidade:** calorosa, factual, respeitosa e esperançosa. É um fã que admira **e** cita a fonte.

| Traço | Significa | Fazer | Não fazer |
|---|---|---|---|
| Calorosa | Fala com o fã de igual para igual | "Bora conhecer essa história?" (só em CTAs) | Gírias em excesso, emojis como ícones |
| Factual | Toda afirmação tem fonte | "Em 2016, *Soy Luna* estreou no Disney Channel [8]." | "Ela sempre foi a maior estrela." |
| Respeitosa | Saúde mental e corpo tratados com cuidado | "Ela contou que passou por uma depressão depois da série." | Dramatizar, especular, julgar |
| Esperançosa | Superação como processo, não troféu | "Um processo que ela descreve aos poucos." | "Superou tudo!" |

| Contexto | Tom | Exemplo |
|---|---|---|
| Hero | Convite | "De Luna Valente a *Imperfecta*: a trajetória de Karol Sevilla." |
| Capítulos | Narrativo, com etiquetas de fonte | Etiquetas: **Fato** · **Nas palavras dela** · **Nossa leitura** |
| Lições | Reflexivo, sempre com "Base factual" | "Às vezes a coragem de tentar vem antes da habilidade." |
| Player | Instrucional e honesto | "Este site não toca áudio. Ouça nas plataformas oficiais." |
| Créditos | Formal | "Site de fã, sem vínculo oficial com Karol Sevilla, Disney ou gravadoras." |

**Regras de conteúdo obrigatórias** (da pesquisa): "Una noche más" **não** entra como faixa dela; não citar *La Casa de los Famosos*, "Quiero volver" nem "Juego de mentiras"; "Más linda" só com fatos (trilha, ano, faixa 3, intérprete), sem atribuir tema; as etiquetas de classificação da pesquisa aparecem na interface.

---

## 2. Princípios
1. **Estrutura do app, alma da artista** — o layout segue o observado [OBS]; cor, tipo e texto são próprios.
2. **Honestidade** — nada simula reprodução de áudio, número de ouvintes ou conteúdo oficial.
3. **Fonte visível** — cada fato tem número de fonte clicável; interpretação é rotulada.
4. **Acessível por padrão** — WCAG 2.1 AA, teclado completo, movimento reduzido.
5. **Leve** — sem frameworks; tudo funciona com JS desligado (as views viram uma página longa).

---

## 3. Tokens (três camadas: primitivo → semântico → componente)

Arquivo sugerido: `assets/css/tokens.css`. Componentes **só** usam tokens semânticos ou de componente; primitivos não aparecem fora deste arquivo.

```css
:root {
  /* ============ 1. PRIMITIVOS ============ */
  /* Neutros "noite" (preto azulado) */
  --p-night-950: #07070D;
  --p-night-900: #0D0D15;
  --p-night-850: #11111A;
  --p-night-800: #1B1B27;
  --p-night-700: #262635;
  --p-night-600: #3A3A4F;
  --p-night-500: #7A7A94;
  --p-night-400: #9494AB;
  --p-night-300: #B9B9CC;
  --p-white:     #FFFFFF;
  --p-ink:       #0B0B14;

  /* Acentos (paleta original do autor + ponte lilás) */
  --p-blue-400:  #69B9FF;   /* azul Luna (original) */
  --p-blue-300:  #8CCBFF;
  --p-pink-400:  #FF69B4;   /* rosa (original) */
  --p-pink-300:  #FF8CC6;
  --p-lilac-400: #B79CFF;   /* mariposa */
  --p-amber-300: #FFC56B;   /* "pendente/validar" */
  --p-red-300:   #FF8A8A;

  /* Tipografia */
  --p-font-display: "Fredoka", ui-rounded, "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif;
  --p-font-text: "Figtree", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --p-fs-12: 0.75rem;  --p-fs-14: 0.875rem; --p-fs-16: 1rem;   --p-fs-18: 1.125rem;
  --p-fs-20: 1.25rem;  --p-fs-24: 1.5rem;   --p-fs-32: 2rem;   --p-fs-40: 2.5rem;
  --p-fs-56: 3.5rem;   --p-fs-72: 4.5rem;
  --p-fw-regular: 400; --p-fw-medium: 500; --p-fw-semibold: 600; --p-fw-bold: 700; --p-fw-black: 800;
  --p-lh-tight: 1.1; --p-lh-snug: 1.3; --p-lh-normal: 1.5; --p-lh-relaxed: 1.65;

  /* Espaçamento (base 4, alinhado à escala observada 4/8/12/16/24/32/48/64/96) */
  --p-space-1: 4px;  --p-space-2: 8px;  --p-space-3: 12px; --p-space-4: 16px;
  --p-space-5: 20px; --p-space-6: 24px; --p-space-8: 32px; --p-space-10: 40px;
  --p-space-12: 48px; --p-space-16: 64px; --p-space-24: 96px;

  /* Raios */
  --p-radius-4: 4px; --p-radius-6: 6px; --p-radius-8: 8px; --p-radius-12: 12px;
  --p-radius-16: 16px; --p-radius-pill: 9999px; --p-radius-circle: 50%;

  /* Sombras */
  --p-shadow-overlay: 0 4px 12px 0 rgb(0 0 0 / 0.30);   /* igual ao valor observado */
  --p-shadow-float:   0 8px 16px 0 rgb(0 0 0 / 0.35);

  /* Movimento */
  --p-dur-100: 100ms; --p-dur-160: 160ms; --p-dur-200: 200ms; --p-dur-250: 250ms; --p-dur-300: 300ms;
  --p-ease-out: cubic-bezier(0.23, 1, 0.32, 1);          /* entrada/feedback */
  --p-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);       /* movimento na tela */
  --p-ease-standard: cubic-bezier(0.3, 0, 0, 1);          /* cor/fundo (equivale ao "productive" observado) */

  /* ============ 2. SEMÂNTICOS ============ */
  /* Fundos e superfícies */
  --color-bg-frame:      var(--p-night-950);  /* moldura do shell, barra superior */
  --color-bg-base:       var(--p-night-850);  /* painéis lateral e principal */
  --color-bg-elevated:   var(--p-night-800);  /* cartões, player, campos */
  --color-bg-highlight:  var(--p-night-700);  /* hover de cartões e linhas */
  --color-bg-press:      var(--p-night-900);  /* pressionado */
  --color-bg-tinted:     rgb(255 255 255 / 0.07);

  /* Texto */
  --color-text-primary:   var(--p-white);
  --color-text-secondary: var(--p-night-300);
  --color-text-tertiary:  var(--p-night-400);
  --color-text-on-accent: var(--p-ink);
  --color-text-link:      var(--p-blue-400);
  --color-text-link-hover:var(--p-pink-400);

  /* Acentos */
  --color-accent:          var(--p-blue-400);
  --color-accent-hover:    var(--p-blue-300);
  --color-accent-2:        var(--p-pink-400);
  --color-accent-2-hover:  var(--p-pink-300);
  --color-accent-3:        var(--p-lilac-400);
  --gradient-mariposa: linear-gradient(90deg, var(--p-blue-400), var(--p-lilac-400) 50%, var(--p-pink-400));
  --gradient-hero: linear-gradient(180deg, rgb(105 185 255 / 0.35) 0%, rgb(183 156 255 / 0.18) 45%, var(--p-night-850) 100%);

  /* Estados e status */
  --color-focus-ring:   var(--p-blue-400);
  --color-selected:     var(--p-blue-400);
  --color-pending:      var(--p-amber-300);
  --color-error:        var(--p-red-300);
  --opacity-disabled:   0.4;

  /* Bordas */
  --color-border-subtle: var(--p-night-600);  /* decorativa (divisores) — não informa estado */
  --color-border-strong: var(--p-night-500);  /* contorno de controles (≥ 3:1) */

  /* Tipografia semântica */
  --font-display: var(--p-font-display);
  --font-text:    var(--p-font-text);
  --text-hero:    clamp(var(--p-fs-40), 6vw + 1rem, var(--p-fs-72));
  --text-h1:      clamp(var(--p-fs-32), 3vw + 1rem, var(--p-fs-56));
  --text-h2:      var(--p-fs-24);      /* título de prateleira [OBS 24/700] */
  --text-h3:      var(--p-fs-18);
  --text-body:    var(--p-fs-16);
  --text-meta:    var(--p-fs-14);
  --text-caption: var(--p-fs-12);

  /* Layout */
  --shell-gap: var(--p-space-2);          /* [OBS] 8 */
  --shell-pad: var(--p-space-2);          /* [OBS] 8 */
  --topbar-h: 64px;                       /* [OBS] 64 */
  --topbar-h-mobile: 56px;                /* [OBS] 56 */
  --sidebar-w: 280px;                     /* [OBS] mínimo 280 */
  --sidebar-w-wide: 300px;                /* [DEC] entre 280 e 331 */
  --sidebar-w-rail: 72px;                 /* [DEC] tablet */
  --player-h: 72px;                       /* [DEC] faixa 66–86 observada */
  --player-h-mobile: 56px;
  --tabbar-h: 64px;                       /* [OBS] 70; [DEC] 64 + safe area */
  --content-pad: var(--p-space-6);        /* 24 no celular→ 40 no desktop (via media query) */
  --measure: 68ch;                        /* largura máxima de texto corrido */

  /* Movimento semântico */
  --motion-press:  var(--p-dur-100) var(--p-ease-out);
  --motion-hover:  var(--p-dur-160) var(--p-ease-standard);
  --motion-enter:  var(--p-dur-250) var(--p-ease-out);
  --motion-exit:   var(--p-dur-200) var(--p-ease-out);
  --motion-move:   var(--p-dur-300) var(--p-ease-in-out);
  --hover-scale: 1.04;                    /* [OBS] --encore-button-hover-scale */
  --press-scale: 0.97;

  /* Z-index */
  --z-base: 0; --z-sticky: 10; --z-sidebar: 20; --z-player: 30; --z-tabbar: 30;
  --z-overlay: 40; --z-dialog: 50; --z-skiplink: 100;

  /* ============ 3. COMPONENTES ============ */
  --card-bg: transparent;
  --card-bg-hover: var(--color-bg-highlight);
  --card-pad: var(--p-space-3);           /* [OBS] 12 */
  --card-radius: var(--p-radius-8);
  --card-img-radius: var(--p-radius-6);   /* [OBS] 6 */
  --card-gap: var(--p-space-2);           /* [OBS] 8 */
  --card-w: clamp(160px, 14vw, 196px);    /* [OBS] 178–196 */

  --btn-h: 48px;  --btn-h-sm: 36px;       /* [OBS] 48 / 32 → 36 para alvo de toque com margem */
  --btn-pad-x: var(--p-space-8);          /* [OBS] 32 */
  --btn-radius: var(--p-radius-pill);
  --btn-primary-bg: var(--color-accent);
  --btn-primary-bg-hover: var(--color-accent-hover);
  --btn-primary-fg: var(--color-text-on-accent);
  --btn-secondary-border: var(--color-border-strong);
  --btn-icon-size: 48px;
  --fab-size: 48px;                       /* botão "Selecionar" do cartão [OBS 48] */

  --track-row-h: 56px;
  --track-row-radius: var(--p-radius-6);
  --track-thumb: 40px;

  --player-bg: var(--color-bg-elevated);
  --player-accent-line: var(--gradient-mariposa);

  --timeline-dot: 14px;
  --timeline-line: 2px;

  --chip-h: 32px;  --chip-radius: var(--p-radius-pill);
  --focus-ring: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-focus-ring);
}

@media (min-width: 1024px) { :root { --content-pad: var(--p-space-10); } }  /* [OBS] inset ≈ 40 */
@media (min-width: 1280px) { :root { --sidebar-w: var(--sidebar-w-wide); } }

@media (prefers-reduced-motion: reduce) {
  :root { --hover-scale: 1; --press-scale: 1; --motion-move: 1ms linear; --motion-enter: 120ms ease; }
  *, *::before, *::after { scroll-behavior: auto !important; }
}
```

### 3.1 Breakpoints

| Nome | Faixa | Shell |
|---|---|---|
| `sm` | < 768 px | barra superior 56 + conteúdo + mini-player 56 + barra de abas 64 |
| `md` | 768–1023 px | trilho lateral de 72 px (ícones), barra superior 64, player 72 |
| `lg` | 1024–1279 px | lateral 280 px [OBS] |
| `xl` | ≥ 1280 px | lateral 300 px |

Usar `min-width` (*mobile-first*). Testar também 320 px.

---

## 4. Contraste (WCAG 2.1 AA) — calculado

Calculado com a fórmula de luminância relativa da WCAG (script fora do repositório: `/tmp/claude-0/-home-user-Projetos/7931bf90-6349-50dc-a767-5b37cf9c57ea/scratchpad/scripts/contrast.py`, Python 3; pode ser refeito com a fórmula `(L1+0,05)/(L2+0,05)`). Texto normal exige 4,5:1; texto grande (≥ 24 px, ou ≥ 18,66 px em negrito) e componentes de UI exigem 3:1.

| Texto / elemento | Fundo | Razão | AA texto normal | Uso permitido |
|---|---|---|---|---|
| primário `#FFFFFF` | frame `#07070D` | **20,09:1** | ✅ | tudo |
| primário `#FFFFFF` | base `#11111A` | **18,77:1** | ✅ | tudo |
| primário `#FFFFFF` | elevated `#1B1B27` | **17,04:1** | ✅ | tudo |
| primário `#FFFFFF` | highlight `#262635` | **14,88:1** | ✅ | tudo |
| secundário `#B9B9CC` | base | **9,72:1** | ✅ | tudo |
| secundário `#B9B9CC` | elevated | **8,82:1** | ✅ | tudo |
| secundário `#B9B9CC` | highlight | **7,71:1** | ✅ | tudo |
| terciário `#9494AB` | base | **6,33:1** | ✅ | metadados, legendas |
| terciário `#9494AB` | elevated | **5,75:1** | ✅ | metadados |
| terciário `#9494AB` | highlight | **5,02:1** | ✅ | metadados |
| azul `#69B9FF` | base / elevated / highlight | **8,92 / 8,10 / 7,08:1** | ✅ | links, item ativo, foco |
| rosa `#FF69B4` | base / elevated / highlight | **7,09 / 6,43 / 5,62:1** | ✅ | destaques, hover de link |
| lilás `#B79CFF` | base / elevated | **8,23 / 7,47:1** | ✅ | chips, ícones |
| âmbar `#FFC56B` | elevated | **10,91:1** | ✅ | selo "Imagem pendente / validar" |
| tinta `#0B0B14` | azul `#69B9FF` (botão primário) | **9,31:1** | ✅ | texto de botão |
| tinta | azul hover `#8CCBFF` | **11,29:1** | ✅ | |
| tinta | rosa `#FF69B4` | **7,40:1** | ✅ | |
| tinta | rosa hover `#FF8CC6` | **9,16:1** | ✅ | |
| tinta | lilás `#B79CFF` | **8,59:1** | ✅ | |
| **branco** | azul / lilás / rosa | **2,10 / 2,28 / 2,65:1** | ❌ | **proibido**: texto sobre acento é sempre `--color-text-on-accent` |
| branco | hero tingido 35% azul (`#304C6A`) | **8,87:1** | ✅ | título e texto do hero |
| secundário | hero 35% azul | **4,59:1** | ✅ (no limite) | só até 35% de tinta; acima disso, usar texto primário |
| secundário | hero 50% azul (`#3D658C`) | **3,16:1** | ❌ | **não usar** tinta > 35% atrás de texto secundário |
| branco / secundário | player tingido 22% (azul `#2C3E57`, lilás `#3D3757`, rosa `#4D2C46`) | ≥ **10,86 / 5,62:1** | ✅ | fundo do player com a cor da faixa |
| secundário / terciário | superfície translúcida 7% (`#22222A`) | **8,17 / 5,32:1** | ✅ | chips |
| borda forte `#7A7A94` (UI, 1.4.11) | base / elevated / highlight | **4,50 / 4,09 / 3,57:1** | ✅ (≥ 3) | contorno de botão secundário, chips, campos |
| borda sutil `#3A3A4F` | base / elevated | 1,70 / 1,54:1 | — | **só decorativa** (divisores); nunca indica estado |
| anel de foco azul | frame / base | **9,55 / 8,92:1** | ✅ (≥ 3) | `:focus-visible` |
| texto desabilitado (branco a 40% sobre elevated = `#76767D`) | elevated | 3,78:1 | isento (1.4.3 não se aplica a desabilitado) | sempre com `disabled`/`aria-disabled` |

Referência [OBS] do Spotify: branco sobre `#121212` 18,73:1; `#b3b3b3` sobre `#121212` 8,93:1; branco sobre o fim azul do gradiente anônimo (`#509bf5`) **2,86:1** (reprova) — por isso o nosso player não põe texto branco sobre acento.

---

## 5. Componentes

Notação de estados: **D** default · **H** hover (só `@media (hover:hover) and (pointer:fine)`) · **F** `:focus-visible` · **A** `:active` · **S** selecionado/atual · **X** desabilitado.
Todo foco visível usa `box-shadow: var(--focus-ring)` (ou `outline: 2px solid var(--color-focus-ring); outline-offset: 2px`). Nunca `outline: none` sem substituto.

### 5.1 Shell (layout)
- **Anatomia:** `<a class="skip-link">` → `<header class="topbar">` → `<nav class="sidebar" aria-label="Seções do site">` → `<main id="conteudo" tabindex="-1">` → `<aside class="player" aria-label="Faixa selecionada">` → `<nav class="tabbar" aria-label="Navegação principal (celular)">`. O `<footer>` fica **dentro** do `main`, depois das views (como no Spotify [OBS]).
- **Grid:** `grid-template-areas: "topbar topbar" "sidebar main" "player player"`; `grid-template-columns: var(--sidebar-w) 1fr`; `grid-template-rows: var(--topbar-h) 1fr var(--player-h)`; `height: 100dvh`; `padding/gap: 8px`. Só `main` tem `overflow-y: auto`.
- **Responsivo:** `md` troca a coluna por `--sidebar-w-rail`; `sm` vira `"topbar" "main" "player" "tabbar"` com uma coluna e a lateral some (`display:none`), e a navegação passa à barra de abas.

### 5.2 Barra lateral / navegação
- **Anatomia:** marca textual "Karol Sevilla · fã-site" (texto, não logo) → lista de links (ícone 24 + rótulo 16/700) → grupo "História" com Capítulos 1–3 indentados (14/500) → bloco "Links oficiais" (cartão `--color-bg-elevated`, raio 8, padding 16/20 [OBS]).
- **Estados:** D texto secundário; H texto primário + fundo `--color-bg-tinted`; F anel; A `scale(var(--press-scale))`; **S** (`aria-current="page"`) texto primário + barra de 3 px `--gradient-mariposa` à esquerda + ícone preenchido (não depende só de cor).
- **Rail (`md`):** só ícones de 24 em alvos de 48×48; rótulo em `aria-label` e `title`; tooltip CSS ao focar.
- **A11y:** `<nav aria-label>`; links reais (`<a href="#historia">`); `aria-current="page"` atualizado pelo roteador.

### 5.3 Barra superior (topbar)
- **Anatomia (≥ md):** botões circulares ‹ › (40×40, `--color-bg-frame` → `--color-bg-elevated` no hover) para etapa anterior/próxima da narrativa · título da view atual (16/700, aparece ao rolar) · à direita, botões pílula "Instagram" e "YouTube" (secundários) para os perfis oficiais.
- **sm:** 56 px fixa: marca textual à esquerda; à direita, botão "Fontes" (ícone, leva a `#creditos`).
- **Estados:** botões redondos H fundo `--color-bg-highlight` + `scale(1.04)` [OBS]; X (no início/fim da narrativa) `opacity: var(--opacity-disabled)` + `disabled`.
- **A11y:** `<header>`; botões com `aria-label="Etapa anterior: Capítulo 1"` (nome dinâmico).

### 5.4 Hero de artista
- **Anatomia:** fundo `--gradient-hero` sobre `--color-bg-base` (tinta ≤ 35%) · retrato circular 232 px (desktop) / 160 px (celular) — slot de imagem · sobretítulo "Atriz · cantora · compositora" (14/700, maiúsculas, `letter-spacing .08em`) · nome em `--text-hero` Fredoka 700 · tagline (16–18, secundário) · ações: primário "Começar a história" (→ `#historia`), secundário "Ouvir destaques" (→ `#musica`).
- **Variantes:** `hero--artist` (Início) e `hero--chapter` (capítulos: número grande "01" em Fredoka, título, período "1999–2014").
- **Responsivo:** desktop em linha (retrato + texto, alinhado embaixo, altura ~340 px); celular empilhado e centralizado.
- **A11y:** `h1` único por view; retrato com `alt` descritivo; gradiente é decorativo.

### 5.5 Cartão (capítulo / música / lição)
- **Anatomia:** `<article class="card">` → mídia 1:1 (raio 6) → título (16/700, 2 linhas com reticências) → subtítulo (14/400 secundário, 2 linhas) → botão flutuante opcional (48, círculo) no canto inferior direito da mídia. O link principal cobre o cartão (técnica do "link esticado": `a::after { position:absolute; inset:0 }`); o botão flutuante fica acima (`z-index`).
- **Variantes:** `card--chapter` (mídia com número do capítulo, botão "Ler"), `card--track` (capa; botão "Selecionar" que leva a faixa ao player), `card--lesson` (sem mídia: ícone de borboleta 32 + número + título; fundo `--color-bg-elevated`), `card--round` (retrato circular, para pessoas/fases).
- **Medidas:** largura `--card-w`, padding 12, gap 8 [OBS].
- **Estados:** D fundo transparente; H fundo `--card-bg-hover` e botão flutuante aparece (`opacity 0→1`, `translateY(8px)→0`, `--motion-enter`) com `--p-shadow-float`; F anel no link + botão sempre visível; A `scale(.97)` só no botão; S (faixa selecionada) título em `--color-accent`, ícone de "equalizador" estático e botão visível com `aria-pressed="true"`.
- **Toque:** sem hover → botão flutuante **sempre visível**.
- **A11y:** título é `h3`; o botão tem nome completo ("Selecionar Mariposas"); imagens decorativas `alt=""` quando o título já descreve.

### 5.6 Prateleira (shelf)
- **Anatomia:** `<section aria-labelledby>` → cabeçalho (h2 24/700 [OBS] + link "Ver tudo" 14/700 secundário) → lista horizontal `<ul class="shelf__list">` (`display:grid; grid-auto-flow:column; grid-auto-columns: var(--card-w); overflow-x:auto; scroll-snap-type:x mandatory`) → botões ‹ › nas bordas (só ≥ md, `aria-controls`).
- **sm:** gutter 16, gap 16, capas ~152 [OBS]; barra de rolagem escondida visualmente, mas rolagem por toque e teclado mantida.
- **A11y:** os botões ‹ › são complementares (o conteúdo também é acessível por Tab); nada gira sozinho.

### 5.7 Linha de faixa (track row)
- **Anatomia (grid):** `# | capa 40 + título/intérprete | origem (álbum/trilha) | ano | ações` → em `sm`: `capa | título/intérprete | ações`.
- **Variantes:** `--featured` (Mariposas e Más linda: selo rosa "Destaque" + linha de contexto); `--pending-link` (sem link oficial confirmado: texto terciário "Link oficial a confirmar").
- **Estados:** D transparente; H `--color-bg-highlight`, o número vira ícone de "selecionar"; F anel na linha inteira (o botão principal é a linha); A fundo `--color-bg-press`; **S** título em `--color-accent` + ícone e `aria-pressed="true"`.
- **A11y:** `<ol class="tracklist">` com `<li>`; cada linha contém **um** `<button class="track__select" aria-pressed>` cujo nome é "Mariposas — Karol Sevilla (como Luna), 2026"; links externos separados com `aria-label="Ouvir Mariposas no YouTube (abre em nova aba)"`. Setas ↑/↓ movem o foco entre as linhas (opcional, *roving tabindex*).

### 5.8 Linha do tempo (interativa)
- **Anatomia:** trilho horizontal (desktop) / vertical (celular) com linha de 2 px `--color-border-subtle` e trecho percorrido em `--gradient-mariposa` · marcos (ponto 14 px + ano em Fredoka 600 + rótulo curto) agrupados por capítulo (faixas coloridas "Capítulo 1/2/3") · painel de detalhe abaixo: ano, texto, etiqueta (Fato / Nas palavras dela / Nossa leitura), fontes [n] e link "Ler no Capítulo 2".
- **Estados do marco:** D ponto vazio contornado com `--color-border-strong`; H ponto `--color-accent-3`; F anel; **S** ponto cheio `--color-accent` 18 px, ano em primário e `aria-current="step"`.
- **Teclado:** padrão *tabs*: `role="tablist"` (rótulo "Linha do tempo") com `role="tab"` por marco e `role="tabpanel"` único; ←/→ (e ↑/↓ no vertical) movem e ativam, Home/End vão ao primeiro/último; *roving tabindex*.
- **Ligação com capítulos:** cada marco tem `data-chapter="1|2|3"`; ao ativar, o roteador pode levar a `#capitulo-n` e destacar o parágrafo correspondente (`id` do evento).
- **Movimento:** o trecho percorrido cresce com `transform: scaleX()` (`--motion-move`); com movimento reduzido, troca imediata.

### 5.9 Player honesto (barra inferior)
- **Anatomia (≥ md, 72 px):** fio de 2 px `--player-accent-line` no topo · esquerda: capa 48 (slot) + título 14/700 + "Karol Sevilla · *Soy Luna: Volver a rodar*, 2026" 12–14 secundário · centro: aviso fixo "Este site não toca áudio" com ícone de informação · direita: botões pílula pequenos para os **links oficiais disponíveis** da faixa (YouTube, Shazam, Spotify, Apple Music — só os confirmados na pesquisa) + botão "Detalhes" (vai à faixa em `#musica`).
- **Estado vazio:** "Escolha uma música em Universo musical" + botão "Ver músicas".
- **sm (56 px):** capa 40 + título + botão "Ouvir" que abre um *bottom sheet* com a lista de links oficiais (`<dialog>`), acima da barra de abas.
- **Proibido:** botão play/pause, barra de progresso, tempo, volume, "tocando agora", ondas animadas que sugiram áudio.
- **A11y:** `<aside aria-label="Faixa selecionada">`; região interna `aria-live="polite"` que anuncia "Selecionada: Mariposas"; links externos com `target="_blank" rel="noopener noreferrer"` e aviso "(abre em nova aba)" no nome acessível; o player não cobre o foco (o `main` recebe `scroll-padding-bottom: calc(var(--player-h) + 16px)`).

### 5.10 Botões
| Variante | Visual | Uso |
|---|---|---|
| Primário | pílula 48, fundo `--color-accent`, texto tinta 16/700, padding 0 32 [OBS forma] | uma ação principal por view |
| Secundário | pílula 48, transparente, borda 1 px `--color-border-strong`, texto primário | ações paralelas, links oficiais |
| Pequeno | pílula 36, 14/700, padding 0 16 | player, chips de ação |
| Ícone | círculo 40–48, fundo `--color-bg-elevated` | navegação ‹ ›, fechar |
| Flutuante (FAB) | círculo 48, fundo `--color-accent`, ícone tinta, sombra `--p-shadow-float` | "Selecionar" no cartão |
| Texto | sem fundo, 14/700 secundário → primário | "Ver tudo" |

Estados: H primário → `--color-accent-hover`, secundário → borda `--color-text-primary` + `scale(1.04)` [OBS]; F anel; A `scale(.97)` (`--motion-press`); X `opacity .4`, `cursor: not-allowed`, atributo `disabled`. Transições só em `background-color, border-color, color, transform` (nunca `transition: all`).

### 5.11 Chips / filtros
- Pílula de 32 px visível, alvo de 44 px (padding vertical extra ou `::before` invisível), fundo `--color-bg-tinted`, texto 14/500 primário.
- Uso: filtrar faixas ("Todas", "Trilha *Volver a rodar*", "Carreira solo", "*Imperfecta*") e lições.
- Estados: H `--color-bg-highlight`; **S** fundo `--color-text-primary`, texto tinta + ícone de check; F anel.
- A11y: grupo `role="group" aria-label="Filtrar músicas"` com `<button aria-pressed>`; o número de resultados é anunciado num `aria-live="polite"`.

### 5.12 Etiquetas de fonte e classificação
- Pílula 24 px, 12/700, maiúsculas: **Fato** (borda azul), **Nas palavras dela** (borda rosa), **Nossa leitura** (borda lilás, itálico), **A validar** (âmbar). Sempre com texto (a cor não é o único indicador).
- Referências `[8]` como `<a href="#fonte-8" class="ref">` com `aria-label="Fonte 8"`.

### 5.13 Rodapé
- Dentro do `main`, fundo `--color-bg-base`, divisor `--color-border-subtle`. Colunas (empilham no `sm`): **Fontes** (lista numerada `<ol>` com `id="fonte-n"`, data de acesso), **Links oficiais** (YouTube, Instagram; os não confirmados aparecem como "a confirmar"), **Créditos de imagem** (arquivo, autor, licença), **Sobre o site** (aviso de não afiliação, primeira versão em `primeira-versao/`).
- Texto 14 secundário; links azul → rosa no hover (herança do site original).

### 5.14 Placeholder de imagem pendente
- Caixa com a proporção do slot (`aspect-ratio`), fundo `--gradient-mariposa` a 18% sobre `--color-bg-elevated`, grão sutil opcional, ícone de borboleta (SVG 32, `aria-hidden`) centralizado e legenda "Imagem pendente" (12/700, âmbar) + descrição curta do que vai ali ("Retrato de Karol, 2021").
- `role="img"` com `aria-label="Imagem pendente: retrato de Karol Sevilla"`; quando a URL autorizada entrar, troca-se por `<img>` com `alt`, `width`/`height` e `loading="lazy"` (exceto o hero).

---

## 6. Arquitetura e navegação

### 6.1 Escolha: SPA leve em página única, views por hash
**Decisão:** um único `index.html` com todas as views como `<section class="view" id="...">`, alternadas por `location.hash`.

| Critério | SPA por hash | Páginas separadas |
|---|---|---|
| Player e lateral persistentes (essência da referência [OBS]) | ✅ o estado da faixa continua ao trocar de view | ❌ recarrega; seria preciso guardar estado em storage |
| GitHub Pages sem build | ✅ nenhum 404: o hash nunca vai ao servidor | ✅, mas duplica topbar/lateral/player em cada HTML |
| Links profundos e voltar/avançar | ✅ `#capitulo-2` funciona e entra no histórico | ✅ |
| Sem JS | ✅ todas as views ficam visíveis em sequência (página longa) e os links de âncora rolam até a seção | ✅ |
| Manutenção por autor iniciante | ✅ um HTML, um CSS, dois JS | ❌ repetição de código |
| SEO básico | ⚠️ um único título/descrição; mitigado com `document.title` dinâmico e conteúdo real no HTML (não injetado por JS) | ✅ |

**Rotas:** `#inicio` (padrão), `#historia`, `#capitulo-1`, `#capitulo-2`, `#capitulo-3`, `#musica`, `#licoes`, `#creditos`. Âncoras internas de fontes (`#fonte-12`) levam à view `#creditos` e rolam até o item.

### 6.2 Mapa do site

```
Início (#inicio)
├─ Hero (artista) ─ CTA "Começar a história" → #historia
├─ Prateleira "A história em 3 capítulos" → #capitulo-1..3
├─ Prateleira "Destaques musicais" (Mariposas, Más linda, Otro Mood…) → seleciona no player / #musica
└─ Prateleira "Para refletir" (cartões editoriais das lições) → #licoes
História (#historia)
├─ Linha do tempo interativa (1999 → 2026), marcos agrupados por capítulo
└─ Cartões dos 3 capítulos
   ├─ Capítulo 1 — O começo de um sonho (#capitulo-1)
   ├─ Capítulo 2 — O caminho até o reconhecimento (#capitulo-2)
   └─ Capítulo 3 — A evolução, a identidade e a superação (#capitulo-3)
       (cada capítulo: hero de capítulo, texto com etiquetas, fotos contextualizadas,
        "Anterior / Próximo capítulo")
Universo musical (#musica)
├─ Destaque duplo: Mariposas · Más linda (trilha Soy Luna: Volver a rodar, 2026)
├─ Filtros (chips) + lista de faixas confirmadas:
│  Otro Mood, Cenicienta, Miedo de sentir, Dime dime (c/ Luis Fonsi), Tus besos, Imperfecta (álbum)
└─ Aviso: "Este site não toca áudio" + links oficiais
O que Karol tem a nos ensinar? (#licoes)
├─ 6 lições (cartões com base factual e fontes)
└─ Conclusão
Créditos (#creditos) = rodapé expandido: fontes, links oficiais, créditos de imagem, aviso de não afiliação
```

Fluxo narrativo dos botões ‹ › da topbar: Início → História → Cap. 1 → Cap. 2 → Cap. 3 → Música → Lições → Créditos.

### 6.3 Dados das faixas (links só da pesquisa)

| Faixa | Contexto (factual) | Links oficiais disponíveis |
|---|---|---|
| **Mariposas** (destaque) | *Soy Luna: Volver a rodar (BSO)*, 08/07/2026, faixa 9; Karol como Luna; coautoria de Karol (créditos completos a validar) | YouTube áudio oficial `https://www.youtube.com/watch?v=2KVWI5c4PPw`; Shazam `https://www.shazam.com/song/6781474378/mariposas` |
| **Más linda** (destaque, só fatos) | mesma trilha, 08/07/2026, faixa 3; Karol como Luna | Shazam `https://www.shazam.com/song/6781474355/m%C3%A1s-linda`; YouTube `tzAXoT9LTU8` / `vJ1FhZPRC5Q` (**canal oficial a confirmar** → exibir com etiqueta "A validar") |
| Otro Mood | single, 01/08/2024 | YouTube `https://www.youtube.com/watch?v=DSOi6436aCQ`; Spotify `https://open.spotify.com/intl-es/track/3sBi1AWJPDLGGugGfhRR1v`; Apple Music `https://music.apple.com/mx/album/otro-mood-single/1759632240` |
| Cenicienta | single, jul./2024 (Festival Tecate) | sem link na pesquisa → "Link oficial a confirmar" + canal `https://www.youtube.com/@KarolSevillaOF` |
| Miedo de sentir | single, fev./2023, composição de Karol e Rodrigo Dávila | YouTube `https://www.youtube.com/watch?v=tEJg-fMGk8s` |
| Dime dime (com Luis Fonsi) | 11/03/2022 | sem link na pesquisa → "a confirmar" + canal |
| Tus besos | jan./2021, primeiro single pop urbano | sem link na pesquisa → "a confirmar" + canal |
| *Imperfecta* (álbum) | 22/05/2026, 8 faixas, KIVA Music | Apple Music `https://music.apple.com/es/album/imperfecta/1895675218`; Spotify ("Imperfecto") `https://open.spotify.com/track/0m05zUbXfkkyn984Mg82LZ` |

---

## 7. Wireframes (ASCII)

### 7.1 Início — desktop (≥ 1280)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ (‹)(›)                                         [Instagram] [YouTube]          │ 64
├────────────────┬─────────────────────────────────────────────────────────────┤
│ Karol Sevilla  │ ░░░░ gradiente hero (azul 35% → base) ░░░░░░░░░░░░░░░░░░░░░ │
│ · fã-site      │  ( retrato )  ATRIZ · CANTORA · COMPOSITORA                  │
│                │  ( 232 px  )  Karol Sevilla            ← Fredoka 72          │
│ ▌⌂ Início      │               De Luna Valente a Imperfecta…                  │
│  ⏱ História    │               [Começar a história] [Ouvir destaques]         │
│    Capítulo 1  │                                                              │
│    Capítulo 2  │ A história em 3 capítulos                         Ver tudo  │
│    Capítulo 3  │ ┌──────┐ ┌──────┐ ┌──────┐                                   │
│  ♪ Música      │ │  01  │ │  02  │ │  03  │                                   │
│  ✦ Lições      │ └──────┘ └──────┘ └──────┘                                   │
│  ⓘ Créditos    │ Destaques musicais                               Ver tudo   │
│ ┌────────────┐ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ›              │
│ │Links       │ │ │Mari- │ │Más   │ │Otro  │ │Miedo │ │Imper-│                │
│ │oficiais    │ │ │posas◉│ │linda │ │Mood  │ │de s. │ │fecta │                │
│ └────────────┘ │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                │
│                │ Para refletir                                    Ver tudo   │
│                │ [✦ 1 Aceitar…] [✦ 2 Pedir pausa…] [✦ 3 …] ›                   │
│                │ ── rodapé curto (aviso de não afiliação · Créditos) ──        │
├────────────────┴─────────────────────────────────────────────────────────────┤
│▔▔▔▔▔▔▔▔▔▔ fio mariposa ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│[capa] Mariposas            ⓘ Este site não toca áudio   [YouTube][Shazam][Detalhes]│ 72
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Início — celular (390)
```
┌──────────────────────────────┐
│ Karol Sevilla · fã-site   [ⓘ]│ 56
├──────────────────────────────┤
│        ( retrato 160 )       │
│ ATRIZ · CANTORA · COMPOSITORA│
│      Karol Sevilla           │ Fredoka 40
│ De Luna Valente a Imperfecta…│
│ [  Começar a história      ] │ largura total
│ [  Ouvir destaques         ] │
│ A história em 3 capítulos  › │
│ ┌────┐ ┌────┐ ┌──            │ gutter 16 / gap 16
│ │ 01 │ │ 02 │ │ 0            │
│ └────┘ └────┘ └──            │
│ Destaques musicais         › │
│ ┌────┐ ┌────┐ ┌──            │
│ Para refletir              › │
├──────────────────────────────┤
│[capa] Mariposas       [Ouvir]│ 56 mini-player
├──────────────────────────────┤
│ ⌂     ⏱      ♪      ✦     ⓘ  │ 64 + safe area
│Início Hist. Música Lições Créd│ rótulos 12
└──────────────────────────────┘
```

### 7.3 História — desktop
```
│ (sidebar) │ História                                   ← h1 Fredoka 56          │
│           │ Da Cidade do México para o mundo.                                   │
│           │ ●───●───●───●═══◉═══●───●───●───●───●───●   ← tablist (← →)         │
│           │1999 2008 2015 2016 2018 2021 2022 2024 2026                        │
│           │ └Cap.1┘ └─────Cap.2──────┘ └──────Cap.3──────┘                       │
│           │ ┌───────────────────────────────────────────────────────────────┐   │
│           │ │ 2018  [FATO]  Soy Luna Live: 49 shows na Europa [9]            │   │
│           │ │ Texto curto…                        → Ler no Capítulo 2        │   │
│           │ └───────────────────────────────────────────────────────────────┘   │
│           │ Os capítulos                                                        │
│           │ [01 O começo…] [02 O caminho…] [03 A evolução…]                     │
```
**Celular:** linha do tempo vertical (marcos à esquerda, ano + rótulo à direita); o painel de detalhe abre logo abaixo do marco ativo.

### 7.4 Capítulo (ex.: #capitulo-2) — desktop e celular
```
│ ░ hero--chapter: "02" (Fredoka 120, lilás) · O caminho até o reconhecimento · 2015–2024 ░ │
│ [imagem editorial 16:9 — pendente]                                                       │
│ Parágrafo (máx. 68ch) … [FATO] [5]                                                       │
│ Parágrafo … [NAS PALAVRAS DELA] [6][7]                                                   │
│ ┌ figura 4:5 ┐  legenda contextualizada + crédito                                         │
│ ▌ Nossa leitura: … (bloco com borda lilás, itálico)                                      │
│ [‹ Capítulo 1]                                         [Capítulo 3 ›]                    │
```
No celular: tudo em uma coluna, figuras em largura total, botões ‹ › empilhados.

### 7.5 Universo musical — desktop
```
│ Universo musical                                          ← h1                      │
│ Mariposas e Más linda: as canções da volta de Luna (2026).                          │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐                     │
│ │[capa 1:1] MARIPOSAS  ◉Sel.  │ │[capa 1:1] MÁS LINDA  ◉Sel.  │ ← destaque duplo     │
│ │Trilha Volver a rodar · f. 9 │ │Trilha Volver a rodar · f. 3 │                     │
│ │Coautoria de Karol [40][42]  │ │Intérprete: Karol como Luna  │                     │
│ │[YouTube] [Shazam]           │ │[Shazam] [YouTube — A VALIDAR]│                    │
│ └─────────────────────────────┘ └─────────────────────────────┘                     │
│ (Todas)(Trilha 2026)(Carreira solo)(Imperfecta)              ← chips                 │
│ #  Faixa                      Origem              Ano    Ações                       │
│ 1  [▢] Otro Mood              Single              2024   [YouTube][Spotify][Apple]   │
│ 2  [▢] Cenicienta             Single              2024   Link oficial a confirmar    │
│ …                                                                                    │
│ ⓘ Este site não toca áudio. Os botões abrem as plataformas oficiais em nova aba.     │
```
**Celular:** destaques empilhados; linhas `capa | título/ano | [⋯]`, onde [⋯] abre a folha de links.

### 7.6 Lições — desktop / celular
```
│ O que Karol tem a nos ensinar?                                                │
│ [NOSSA LEITURA] Lições formuladas por nós, cada uma ancorada em um fato.      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ← grid 3 col (2 em md,   │
│ │✦ 01          │ │✦ 02          │ │✦ 03          │      1 em sm)              │
│ │Aceitar a     │ │Pedir pausa   │ │A gente é     │                            │
│ │oportunidade… │ │também é…     │ │maior que…    │                            │
│ │Base factual: │ │…             │ │…             │                            │
│ │… [5]         │ │[33][34][55]  │ │[33]          │                            │
│ └──────────────┘ └──────────────┘ └──────────────┘                            │
│ (04)(05)(06)                                                                   │
│ Conclusão — bloco largo com fio mariposa à esquerda                            │
```

### 7.7 Créditos — desktop / celular
```
│ Créditos e fontes                                                             │
│ ┌ aviso ┐ Site de fã, sem vínculo oficial com Karol Sevilla, Disney ou gravadoras. │
│ Fontes (1–84, <ol>, data de acesso) │ Links oficiais │ Créditos de imagem │ Sobre │
```
Celular: as colunas viram seções empilhadas com `<details>` (Fontes recolhida por padrão).

---

## 8. Arquitetura de JavaScript

Sem módulos ES (para funcionar até abrindo o arquivo direto, `file://`): dois scripts clássicos com `defer`.

```
index.html
assets/css/tokens.css      ← seção 3
assets/css/style.css       ← base, shell, componentes, utilitários
assets/js/data.js          ← window.KS_DATA = { faixas, marcos, licoes, fontes, links }
assets/js/app.js           ← IIFE com os módulos abaixo
assets/img/                ← só imagens autorizadas
```

| Módulo (função em `app.js`) | Responsabilidade |
|---|---|
| `state` | `{ view: 'inicio', faixaId: null, marcoId: null, filtro: 'todas' }` + `setState(patch)` que chama os renders afetados |
| `router` | lê `location.hash` (`hashchange` + carga inicial); valida contra a lista de views (hash inválido → `#inicio`); mostra a view (`hidden` nas outras), atualiza `aria-current`, `document.title` ("Capítulo 2 · Karol Sevilla — fã-site"), botões ‹ ›, rola o `main` ao topo e move o foco para o `h1` da view (`tabindex="-1"`) |
| `player` | `selecionarFaixa(id)`: atualiza a barra, `aria-pressed` em todas as instâncias da faixa (cartão, linha), anuncia na região `aria-live`; persiste o id em `sessionStorage` (com `try/catch`) |
| `timeline` | *roving tabindex*, teclas ←/→/↑/↓/Home/End, atualiza o painel e `marcoId`; liga ao capítulo |
| `shelves` | botões ‹ › chamam `scrollBy({ left: ±largura visível, behavior })`, com `behavior: 'auto'` se `prefers-reduced-motion`; desabilita a seta no início/fim (`scroll` + `requestAnimationFrame`) |
| `filters` | `aria-pressed` nos chips; mostra/oculta linhas; anuncia "4 músicas" |
| `sheet` | abre/fecha o `<dialog>` de links no celular (`showModal`, Esc, foco devolvido ao gatilho) |
| `enhance` | adiciona a classe `js` ao `<html>`; sem ela, o CSS mostra todas as views em sequência |

**Diretrizes para o Agente 3**
1. **Conteúdo no HTML, não no JS.** Textos dos capítulos, lições e fontes ficam no `index.html` (SEO, funciona sem JS). `data.js` guarda só dados de interação (links de faixas, metadados dos marcos).
2. Delegação de eventos (`main.addEventListener('click', …)` com `closest('[data-faixa]')`).
3. Nada de `innerHTML` com dados externos; usar `textContent`.
4. Links externos: `target="_blank" rel="noopener noreferrer"`.
5. `<meta name="viewport" content="width=device-width, initial-scale=1">` (sem bloquear zoom); `lang="pt-BR"`; `<meta name="description">`; `<meta name="theme-color" content="#07070D">`.
6. Ícones: SVG inline de um único conjunto aberto (Lucide, ISC) com `stroke-width: 2`, 24 px, `aria-hidden="true"` quando acompanham texto. Borboleta: SVG próprio simples.
7. `scroll-padding-top` e `scroll-padding-bottom` no `main` iguais às barras fixas.
8. Teste de fumaça: abrir cada hash diretamente, Voltar/Avançar do navegador, Tab do início ao fim, emular `prefers-reduced-motion`.

---

## 9. Política de imagens

- **Sem URLs fictícias, de hotlink ou de fontes sem licença** (o primeiro site usava Google Images e Fandom — não reutilizar).
- Licença aberta conhecida (pesquisa): arquivos *Sedal 2021* no Wikimedia Commons (CC BY 3.0, **a confirmar na página do arquivo**). Imagens da Disney, de clipes ou de redes sociais **não** têm licença aberta.
- Cada slot no HTML segue o padrão:

```html
<!-- IMAGEM retrato-hero: substituir pela URL direta de uma imagem autorizada; proporção 1:1 -->
<div class="img-pending" style="aspect-ratio: 1 / 1" role="img" aria-label="Imagem pendente: retrato de Karol Sevilla">
  <svg class="img-pending__icon" aria-hidden="true">…borboleta…</svg>
  <span class="img-pending__label">Imagem pendente</span>
  <span class="img-pending__desc">Retrato de Karol Sevilla</span>
</div>
```

| Slot (id) | Onde | Proporção | Sugestão / observação |
|---|---|---|---|
| `retrato-hero` | Hero do Início | 1:1 (círculo) | Commons *Sedal 2021 4* (CC BY 3.0, conferir) |
| `retrato-sidebar` (opcional) | Marca na lateral | 1:1, 40 px | mesmo arquivo |
| `capitulo-1-capa` | Cartão e hero do Capítulo 1 | 1:1 (cartão) e 16:9 (hero) | Infância / início na TV — sem imagem aberta conhecida |
| `capitulo-2-capa` | Capítulo 2 | 1:1 e 16:9 | Fase *Soy Luna* — sem imagem aberta conhecida |
| `capitulo-3-capa` | Capítulo 3 | 1:1 e 16:9 | Fase adulta / *Imperfecta* — Commons *Sedal 2021 3* (conferir) |
| `cap1-figura-televisa` | Capítulo 1 (texto) | 4:5 | Primeiros trabalhos |
| `cap2-figura-soy-luna` | Capítulo 2 | 4:5 | Patins / Luna Valente |
| `cap2-figura-turne` | Capítulo 2 | 16:9 | Turnês 2017–2018 |
| `cap3-figura-volver-a-rodar` | Capítulo 3 | 4:5 | Retorno em 2026 |
| `capa-mariposas` | Música, player | 1:1 | Capa da trilha *Volver a rodar* (só com autorização) |
| `capa-mas-linda` | Música, player | 1:1 | Idem |
| `capa-otro-mood`, `capa-cenicienta`, `capa-miedo-de-sentir`, `capa-dime-dime`, `capa-tus-besos`, `capa-imperfecta` | Lista de faixas, prateleira | 1:1 | Capas oficiais (só com autorização); enquanto isso, placeholder com a inicial da faixa |
| `licoes-capa` (opcional) | Prateleira "Para refletir" | 1:1 | Ilustração própria de borboleta (pode ser SVG do projeto) |
| `og-image` | `<meta property="og:image">` | 1200×630 | Arte própria com tipografia (sem foto, se não houver licença) |

Ao ativar uma imagem: `width`/`height` reais (evita CLS), `loading="lazy"` e `decoding="async"` fora do hero, `alt` descritivo e linha correspondente em "Créditos de imagem".

---

## 10. Movimento e polimento (skill `emil-design-eng`)

| Interação | Frequência | Decisão |
|---|---|---|
| Hover em cartão/linha | dezenas de vezes | só cor de fundo (`--motion-hover`); o botão flutuante entra com `opacity` + `translateY(8px)` em 250 ms `--p-ease-out` |
| Pressionar botão | sempre | `scale(.97)` em 100 ms |
| Trocar de view | ocasional | *fade* de 200 ms no conteúdo (só `opacity`); sem deslizar |
| Selecionar faixa | ocasional | capa do player entra com `opacity` + `scale(.96→1)` em 200 ms; o fio mariposa faz um brilho único (`opacity`) |
| Linha do tempo | ocasional | trecho percorrido com `transform: scaleX` em 300 ms `--p-ease-in-out` |
| Navegação por teclado | muito frequente | **sem animação** |
| Folha de links (celular) | ocasional | `translateY(100%)→0` em 250 ms com `cubic-bezier(.32,.72,0,1)`; saída 200 ms |

Regras: nunca `transition: all`; animar só `transform` e `opacity`; hover dentro de `@media (hover:hover) and (pointer:fine)`; nada parte de `scale(0)`; saída mais rápida que a entrada; com `prefers-reduced-motion: reduce`, sem `transform` animado (mantém só `opacity`/cor curtas).

| Antes (observado/comum) | Depois (nosso) | Por quê |
|---|---|---|
| anel de foco padrão do navegador `auto 1px` [OBS] | anel 2 px azul + *offset* 2 px | visível em todos os fundos (≥ 8:1) |
| `transition: box-shadow .22s ease-in` na busca [OBS] | `--motion-hover` com curva *standard* | `ease-in` atrasa o início do feedback |
| botão play só aparece no hover [OBS] | sempre visível no toque e no foco | não depender de hover |
| texto branco sobre gradiente azul (2,86:1) [OBS] | texto tinta sobre acento; branco só sobre tinta ≤ 22–35% | AA |

---

## 11. Acessibilidade (skill `design:accessibility-review`, WCAG 2.1 AA)

| Critério | Como o design system atende |
|---|---|
| 1.1.1 Conteúdo não textual | `alt` nos retratos; placeholders com `role="img"` + `aria-label`; ícones decorativos `aria-hidden` |
| 1.3.1 Info e relações | landmarks (`header`, `nav`×2 com rótulos distintos, `main`, `aside`, `footer`); h1 por view; listas para faixas, lições e fontes |
| 1.4.3 Contraste | tabela da seção 4 (todos os pares de texto ≥ 4,5:1) |
| 1.4.4 / 1.4.10 Redimensionar / reflow | unidades `rem`; layout de 1 coluna a 320 px; sem rolagem horizontal; testar zoom de 200% |
| 1.4.11 Contraste não textual | borda forte 3,57–4,50:1; anel de foco ≥ 8:1; pontos da linha do tempo com contorno forte |
| 1.4.12 Espaçamento de texto | sem alturas fixas em blocos de texto |
| 2.1.1 Teclado | tudo é `<a>`/`<button>`/`<dialog>` nativo; linha do tempo com setas |
| 2.4.1 Pular blocos | link "Pular para o conteúdo" → `#conteudo` |
| 2.4.3 Ordem do foco | topbar → lateral → main → player (ordem do DOM = ordem visual); no celular, a barra de abas vem por último |
| 2.4.7 Foco visível / 2.4.11 (boa prática) | `--focus-ring`; `scroll-padding` evita foco escondido sob as barras fixas |
| 2.5.5 / 2.5.8 Alvo | mínimo 44×44 em botões, abas e chips (área ampliada) |
| 3.2.1 No foco | foco não troca de view; só ativação (Enter/clique) |
| 4.1.2 Nome, função, valor | `aria-pressed` (faixa, chips), `aria-current` (navegação, marco), `aria-live="polite"` (player, filtros), rótulos dinâmicos nos botões ‹ › |
| 2.2.2 Pausar, parar, ocultar | nenhum carrossel automático, nenhum áudio/vídeo automático |

---

## 12. Skill `ui-ux-pro-max`: o que veio, o que foi adotado e o que foi descartado

Buscas executadas (`python3 /home/user/Projetos/.claude/skills/ui-ux-pro-max/scripts/search.py`):
1. `"music streaming fan biography dark editorial" --design-system -p "Karol Sevilla"`
2. `"rounded friendly display editorial" --domain typography -n 4`
3. `"dreamy pink blue night" --domain color -n 4` e `"music entertainment dark" --domain color -n 3`
4. `"Fredoka Quicksand rounded" --domain google-fonts -n 4`
5. `"timeline stepper keyboard" --domain ux -n 2`
6. Leitura do checklist de `references/pro-rules.md`.

| Recomendação da skill | Decisão | Motivo |
|---|---|---|
| Estilo "Dark Mode (OLED)"; exige contraste 4,5, teclado, foco visível, movimento reduzido | **Adotado** | Coincide com o observado e com o PRD |
| Padrão "Feature-Rich Showcase" (hero → grade de cartões → CTA repetido) | **Adotado em parte** | O Início usa hero + prateleiras; o CTA repetido de conversão foi descartado (não há conversão comercial) |
| Paleta "Music Streaming": fundo `#0F0F23`, primária `#1E1B4B`, **acento `#22C55E` (verde "play")** | **Descartado o verde**; fundo azulado **adaptado** (`#07070D`/`#11111A`) | Verde remete ao Spotify (proibido); a identidade vem da paleta do autor |
| Paletas "Short Video Editor"/"Baby Tracker": rosa `#EC4899` + azul | **Descartado** | O azul `#69B9FF` e o rosa `#FF69B4` do autor têm prioridade e passam em AA |
| Tipografia "Righteous + Poppins" (música) | **Descartado** | Righteous é retrô/anos 70 e Poppins é larga demais para UI densa |
| "Soft Rounded" (Varela Round + Nunito Sans) e "Nunito + DM Sans" | **Ideia adotada, fontes trocadas** | Display arredondada sim (patins); escolhemos Fredoka (variável, pesos 300–700, eixo de largura) e Figtree (mais próxima da sans observada) |
| Fredoka e Quicksand no banco Google Fonts | **Fredoka adotada** | Confirmada como variável `wght 300–700`, `wdth 75–125` |
| UX: navegação por teclado completa, *skip link* | **Adotado** (seções 5.8 e 11) | |
| Checklist de pré-entrega: sem emoji como ícone, conjunto único de ícones, alvos ≥ 44, estados de pressionado sem mexer no layout, tokens semânticos, contraste no escuro, áreas seguras, reduced motion, foco não encoberto por barras fixas, cor não é o único indicador, carrossel sem rotação automática | **Adotado** — itens viram critérios (F19–F24 no documento de engenharia reversa e seção 11) | Itens de app nativo (Dynamic Type, gestos de voltar) não se aplicam ao site |
| Dial de densidade/motion (GSAP) | **Descartado** | Sem bibliotecas; movimento em CSS puro |

---

## 13. Rastreabilidade das skills
- `reverse-engineer-anything` (REA): evidências em `SPOTIFY_REVERSE_ENGINEERING.md` §0.
- `design:design-system`: estrutura de tokens, documentação de componentes (variantes, estados, a11y).
- `design-system` (três camadas): seção 3 (primitivo → semântico → componente). Scripts de geração/validação não usados (exigem `tokens.json`; o CSS foi escrito direto).
- `brand`: seção 1.3 (voz e tom). Scripts de sincronização não usados (criariam `assets/design-tokens.*` concorrentes).
- `design:accessibility-review`: seções 4 e 11.
- `anthropic-skills:emil-design-eng`: seções 5 e 10.
- `ui-ux-pro-max`: seção 12.
