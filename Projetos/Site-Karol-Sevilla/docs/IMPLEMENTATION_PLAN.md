# Plano de implementação — Agente 3

> 2026-10-16. Base: `PROJECT_BRIEF.md`, `RESEARCH_KAROL_SEVILLA.md` (versão 2, verificada), `SPOTIFY_REVERSE_ENGINEERING.md` (critérios F1–F24) e `DESIGN_SYSTEM.md`.
> Skills: `criar-sites-com-ia` (Etapa 4, Caminho A; Etapas 5 e 6), `ui-ux-pro-max`, `ui-styling` (só referências de acessibilidade), `emil-design-eng` (estados e movimento) e `reverse-engineer-anything` (validação).

## 1. Inventário do projeto atual

| Arquivo | Conteúdo | Destino |
|---|---|---|
| `index.html` | Primeiro site do autor: h1, parágrafo, imagem do Google Images, lista de 4 músicas, links do Instagram, YouTube e Facebook | `primeira-versao/index.html` (`git mv`) |
| `style.css` | Paleta `--azul #69b9ff`, `--rosa #ff69b4`, preto; comentários didáticos | `primeira-versao/style.css` |
| `script.js` | Um `addEventListener` por música; mostra mensagem e troca imagem (Fandom/Spotify CDN) | `primeira-versao/script.js` |
| `README.md` | Descrição do primeiro projeto | Reescrito para o site novo, com link para a primeira versão |
| `docs/` | PRD, estado, pesquisa, engenharia reversa, design system | Mantido. O workflow copia a pasta inteira; tudo bem |

O workflow `.github/workflows/pages.yml` copia `Projetos/Site-Karol-Sevilla/.` para a raiz do Pages. Por isso o site novo fica na raiz da pasta e a primeira versão em `/primeira-versao/`. Os caminhos do site antigo são relativos (`style.css`, `script.js`) e continuam funcionando depois da mudança.

## 2. Decisões

1. **Preservar o site antigo** em `primeira-versao/`, sem alterar o código (é o primeiro projeto do autor). O rodapé novo tem o link "Ver a primeira versão deste site".
2. **SPA leve por hash** (DESIGN_SYSTEM §6): um `index.html` com as views como `<section class="view">`. Sem JS, todas as views aparecem em sequência e as âncoras funcionam (melhoria progressiva).
3. **Conteúdo no HTML**, não no JS (SEO e funcionamento sem JS). O JS guarda só os dados de interação das faixas (links oficiais).
4. **Scripts clássicos com `defer`**, um por responsabilidade, todos registrando funções em `window.KS`. Não uso `type="module"` para o site abrir também por `file://`.
5. **Pesquisa v2 prevalece sobre o design system** onde eles divergem: "Una noche más" entra (parceria confirmada com Alan Navarro, [87]); os vídeos de "Más linda" são do canal DisneyMusicLAVEVO (confirmado, [46][47]); o Shazam não entra como "link oficial" (fonte sem ✓); "Imperfecto" no Spotify não entra (fonte [78] sem ✓).
6. **Linha do tempo como lista de links** (`<ol>` de `<a>`), e não como `tablist`. Motivo: o requisito é "clicar/Enter num marco leva ao trecho do capítulo", que é o comportamento nativo de um link. Um `tablist` ativaria um painel, não uma navegação. Com links, o Tab percorre os marcos; setas não são necessárias (não é um widget composto). O marco ativo recebe `aria-current="step"`.
7. **Fontes numeradas com a mesma numeração da pesquisa**. A lista de créditos mostra só as fontes citadas no site (`<li value="n" id="fonte-n">`).
8. **Imagens**: cópia local das 5 imagens recomendadas do Wikimedia Commons, convertidas para WebP com Pillow (só redimensionadas). Slots sem imagem livre usam `assets/img/pendente.svg` com a classe `is-pending` e o comentário padronizado. O `og:image` é uma composição própria (retrato CC BY 3.0 + título), registrada como obra adaptada.
9. **Player honesto**: mostra a faixa selecionada e os links oficiais confirmados; texto fixo "Este site não toca áudio". Sem play, progresso, tempo ou volume.

## 3. Estrutura de arquivos

```
Site-Karol-Sevilla/
├── index.html                ← site novo (todas as views)
├── README.md
├── assets/
│   ├── css/tokens.css        ← tokens do DESIGN_SYSTEM §3 (primitivo → semântico → componente)
│   ├── css/main.css          ← base, shell, componentes, views, responsivo, movimento
│   ├── js/data.js            ← KS.faixas: dados das faixas e links oficiais
│   ├── js/player.js          ← seleção de faixa, barra do player, folha de links, filtros
│   ├── js/ui.js              ← prateleiras, imagens com erro, realce de trechos
│   ├── js/app.js             ← estado, roteador por hash, navegação, inicialização
│   └── img/                  ← WebP do Commons, pendente.svg, favicon.svg, og-image
├── primeira-versao/          ← site original (index.html, style.css, script.js)
└── docs/ (+ agents/seo.md, agents/seguranca.md, IMPLEMENTATION_PLAN.md, TEST_REPORT.md)
```

## 4. Componentes (DESIGN_SYSTEM §5)

Shell (grid) · barra lateral/trilho · barra superior · barra de abas (celular) · hero de artista e de capítulo · cartão (capítulo, faixa, lição) · prateleira com setas · linha de faixa · linha do tempo · player honesto + folha de links (`<dialog>`) · botões (primário, secundário, pequeno, ícone, FAB) · chips de filtro · etiquetas (Fato / Nas palavras dela / Nossa leitura) · referências [n] · rodapé · placeholder de imagem.

## 5. Estado

```js
KS.state = {
  view: 'inicio',     // view atual (rota)
  faixaId: null,      // faixa selecionada no player (guardada em sessionStorage)
  marcoId: null,      // último marco clicado na linha do tempo
  filtro: 'todas'     // filtro da lista de faixas
};
```

- **Rotas:** `#inicio`, `#historia`, `#capitulo-1..3`, `#musica`, `#licoes`, `#creditos`.
- **Âncoras internas** (`#cap2-teste`, `#fonte-33`, `#licao-3`, `#faixa-mariposas`): o roteador abre a view que contém o elemento, rola até ele e o realça.
- **Hash desconhecido:** volta para `#inicio` (com `history.replaceState`) e mostra uma mensagem de estado vazio.

## 6. Etapas verificáveis

| # | Etapa | Verificação |
|---|---|---|
| 1 | Mover o site antigo e criar as pastas | `git status` mostra os renames; `primeira-versao/index.html` abre com CSS e JS |
| 2 | Baixar e converter as imagens | `file assets/img/*`; dimensões conhecidas |
| 3 | Tokens + shell responsivo | F1–F10 medidos em 1440/1024/820/390/320 |
| 4 | Conteúdo das views com fontes | Leitura cruzada com a pesquisa; regras de conteúdo (busca por termos proibidos) |
| 5 | Roteador, player, linha do tempo, filtros, prateleiras | Playwright: hash direto, cliques, teclado, voltar/avançar |
| 6 | SEO e segurança | Checklists em `docs/agents/` |
| 7 | Relatório | `docs/TEST_REPORT.md` |

## 7. Estratégia de testes

- **Sintaxe:** `node --check` em cada JS; `html.parser` do Python com checagem de tags e ids duplicados; checagem de chaves no CSS.
- **Navegador:** REA (`capture_browser_scenario`, `inspect_web_page`, `inspect_web_event_listeners`) contra `http://127.0.0.1:8765/`; se o REA falhar, Playwright (Chromium em `/opt/pw-browsers`). Larguras 1440, 1024, 820, 390 e 320. Medir: erros de console, `scrollWidth`, caixas do shell, cartões, player, alvos ≥ 44 px, foco visível, `naturalWidth` das imagens.
- **Fluxos:** cada view por hash e por clique; marco da linha do tempo → trecho do capítulo; cartão/linha de faixa → player; filtros; voltar/avançar; Tab do início ao fim; `prefers-reduced-motion`; JS desligado.
- **Contraste:** cálculo WCAG dos pares usados.
- **Links externos:** `curl -I -L` (com GET quando HEAD falhar).
- **F1–F24:** cada critério com o valor medido.
- Capturas de tela ficam no scratchpad (`…/scratchpad/validation/`), fora do repositório.
