# Design System — Cenicienta

Estilo **Dark Mode (OLED)**: fundo preto, cartões cinza, rosa só onde importa, brilho mínimo.
Todos os valores vivem como variáveis em `:root` no `style.css`. **Nunca use valores soltos** (`17px`, `#333`): use os tokens.

## 1. Cores
| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#000` | fundo da página |
| `--cor-superficie` | `#1a1a1a` | cartões (`.card`) |
| `--cor-superficie-2` | `#262626` | coisas dentro do cartão (itens da ficha) |
| `--cor-texto` | `#fff` | texto principal (21:1) |
| `--cor-texto-suave` | `#b8b8b8` | texto secundário (≥ 8:1 sobre `#1a1a1a`) |
| `--cor-texto-sobre-destaque` | `#000` | texto em cima do rosa (7.9:1) |
| `--cor-destaque` | `#ff69b4` rosa | títulos, botão primário, item ativo |
| `--cor-destaque-2` | `#69b9ff` azul | links, ícones, rótulos da ficha |
| `--cor-borda` / `--cor-borda-forte` | branco 12% / 28% | divisórias / contornos de botões e campos |
| `--cor-foco` | azul | anel de foco (`:focus-visible`, 3px) |
| `--cor-erro` / `--cor-sucesso` | `#ff6b6b` / `#5ee0a0` | validação, toast |

## 2. Espaçamento (base 4px)
| Token | px | Quando usar |
|---|---|---|
| `--esp-1` | 4 | entre ícone e texto bem juntos, padding vertical de chip |
| `--esp-2` | 8 | gap de botões/links em grupo, rótulo → campo |
| `--esp-3` | 12 | padding vertical de botões e campos |
| `--esp-4` | 16 | parágrafos, gutter lateral no celular |
| `--esp-5` | 24 | padding horizontal de botões, entre campos do formulário |
| `--esp-6` | 32 | padding do `.card`, gap entre cartões/colunas |
| `--esp-7` | 48 | padding das seções no celular, rodapé |
| `--esp-8` | 64 | padding vertical das seções no computador |
| `--esp-9` | 96 | respiro abaixo do texto do hero |
| `--esp-10` | 128 | reservado para separações muito grandes |

Regra: **dentro** do componente 1–5, **entre** componentes 5–7, **entre seções** 7–10.

## 3. Tipografia
- Títulos: **Righteous** (`--fonte-titulo`), sempre rosa; `h2` com `--brilho-texto`.
- Texto: **Poppins** 400/500/600 (`--fonte-texto`), base 16–17px, `line-height` 1.65.
- Escala fluida com `clamp()`: `--fs-xs` 12–13 · `--fs-sm` 14–15 · `--fs-base` 16–17 · `--fs-md` 18–20 · `--fs-lg` 20–24 · `--fs-xl` 26–36 (h2) · `--fs-2xl` 32–48 · `--fs-display` 52–112 (h1).
- Linha de leitura máxima: `--largura-leitura: 68ch` (já aplicada em `p`).
- Hierarquia: um único `h1` (hero) → `h2` por seção → `h3` dentro da seção.

## 4. Outros tokens
- Raios: `--raio-sm` 6 · `--raio-md` 12 · `--raio-lg` 20 · `--raio-pilula`.
- Sombras: `--sombra-1`, `--sombra-2`; brilhos: `--brilho-texto`, `--brilho-caixa`.
- Layout: `--largura-conteudo` 1120px, `--gutter` 16px, `--altura-header` 64px (56px ≤768), `--toque-min` 44px.
- Camadas: `--z-header` 100 · `--z-menu` 110 · `--z-topo` 120 · `--z-toast` 130 · `--z-skip` 200.
- Movimento: `--dur-rapida` 150ms · `--dur-media` 250ms · `--dur-lenta` 600ms · `--ease-saida` (entrar) · `--ease-entrada` (sair).
- Breakpoints: `1024px`, `768px`, `480px` (testar em 375, 768, 1024, 1440).

## 5. Componentes (em `style.css`)
| Classe | O que é | Estados prontos |
|---|---|---|
| `.btn` + `.btn--primario` / `--secundario` / `--icone` / `--bloco` | botão ou link-botão (≥44px) | hover, active, focus-visible, disabled, `.is-loading` |
| `.card` (+ `.card--leitura`) | cartão cinza | — |
| `.chip` | etiqueta pequena azul | — |
| `dl.ficha` > `.ficha__item` (`--largo`) | ficha técnica `dt`/`dd` | 2 colunas → 1 no celular |
| `.social` > `.social__link` | rede social com ícone + rótulo | hover, active, focus-visible |
| `.campo` > `.campo__rotulo`, `.campo__input`, `.campo__ajuda`, `.campo__erro`, `.campo__contador` | campo de formulário | hover, focus-visible, disabled, inválido |
| `.mural__lista` > `.mensagem` | item do mural | `.is-new`; `.mural__vazio` some sozinho se a lista tiver itens |
| `.toast` (+ `--sucesso`, `--erro`) | aviso fixo embaixo, centralizado | `.is-shown` |
| `.topo` | voltar ao topo (fixo, canto inferior direito) | `.is-visible` |
| `.video-toggle` | pausar/tocar vídeo | `aria-pressed` troca o ícone |
| `.menu-toggle` + `#menu-principal` | menu do celular (painel abaixo do header) | ver contrato |

## 6. CONTRATO de classes e estados (Agentes 2 e 3)
O **JS coloca/tira** as classes; o **CSS** só reage a elas. Use exatamente estes nomes.

| Gancho | Quem coloca | Significado |
|---|---|---|
| `html.js` | `script.js` (1ª linha) | JS ativo. **Só esconda conteúdo sob `html.js`.** Sem ela tudo aparece. |
| `html.reduz-movimento` | opcional (JS) | espelho da media query; a fonte da verdade é `@media (prefers-reduced-motion: reduce)` |
| `[data-reveal]` + `.is-visible` | `script.js` (IntersectionObserver) | bloco entra ao rolar. Estado escondido/animação: `motion.css` |
| `[data-reveal-stagger]` | HTML | filhos entram em sequência; o Agente 3 define `--i` (índice) em cada filho |
| `.site-header.is-scrolled` | Agente 2 | header fica sólido depois de rolar |
| `body.menu-aberto` + `.menu-toggle[aria-expanded="true"]` + `#menu-principal.is-open` | Agente 2 | menu mobile aberto (os três juntos) |
| `.toast.is-shown` (+ `.toast--erro` / `.toast--sucesso`) | Agente 2 | mostra o aviso |
| `.btn.is-loading` | Agente 2 | botão enviando |
| `.campo.is-invalid` + `[aria-invalid="true"]` no input | Agente 2 | campo com erro (texto em `.campo__erro`) |
| `.topo.is-visible` | Agente 2 | mostra o botão de topo |
| `.video-toggle[aria-pressed="true"]` | Agente 2 | vídeo **pausado** (`false` = tocando) |
| `.mensagem` / `.mensagem.is-new` | Agente 2 | item do mural / recém-adicionado (animação: Agente 3) |
| `.nav__link[aria-current="true"]` | Agente 2 (opcional) | seção atual no menu |

Visibilidade base já está no `style.css` (ex.: `.toast` e `.topo` com `opacity:0; visibility:hidden`); **transições** ficam no `motion.css`.

## 7. Divisão de arquivos (Fase B)
| Agente | Arquivos |
|---|---|
| 1 — UI/UX | `style.css`, `docs/DESIGN_SYSTEM.md` |
| 2 — Funcionalidades | `index.html`, `script.js`, `components.css` (componentes novos + responsividade deles) |
| 3 — Motion | `motion.css`, `motion.js` |

Ordem no `<head>`: `style.css` → `components.css` → `motion.css`; scripts com `defer`: `script.js` → `motion.js`.

## 8. Acessibilidade (checklist)
Contraste ≥ 4.5:1 · foco visível em tudo · alvos ≥ 44×44px · `skip-link` · `.sr-only` para texto só de leitor de tela · ícones com `aria-hidden="true"` · links externos avisam "abre em nova aba" · sem rolagem horizontal · rolagem suave desligada com reduced motion.
