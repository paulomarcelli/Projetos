# Una Noche Más: auditoria e direção de design

> Documento do coordenador. Todos os agentes leem antes de começar. Versão antiga preservada em `classic/` (mesmo HTML/CSS/JS, só os caminhos do vídeo e do favicon apontam para `../`).

## 1. Auditoria da versão antiga (o que existe)

**Conteúdo e recursos que DEVEM continuar** (textos literais, sem reescrever fatos):
- Hero com vídeo do clipe (começava aos 89 s), título "Una Noche Más" e menu com 3 âncoras: Sobre a Música, Compositores, Redes Sociais.
- "Sobre a Música": parágrafo sobre a parceria (single de 5/12/2024, 2º single de Alan, clipe < 3 min, Universal Music Group México), capa, botões **Ouvir no Spotify** (`https://open.spotify.com/intl-es/track/7nxvsuEtsUoFWx5H9jaF8A`) e **Assistir no YouTube** (`https://www.youtube.com/watch?v=pCgq0ZMoUg4`).
- "Compositores": cards de Karol Sevilla e Alan Navarro com foto, nome e texto (copiar os textos exatamente).
- "Redes Sociais": Instagram da Karol (`https://www.instagram.com/karolsevillaofc/?hl=pt`) e do Alan (`https://www.instagram.com/alannavarro/`).
- Revelação dos cards ao rolar. Favicon `nochemas.png`. Font Awesome 6.5.1 (cdnjs). Playfair Display.

**Problemas encontrados:**
1. Playfair Display é carregada mas nunca aplicada (todo o site usa a fonte padrão do navegador).
2. Títulos em `#2c4a5e` sobre preto: contraste **2,25:1** (reprova WCAG AA).
3. `<p>` dentro de `<p>` no card do Alan (HTML inválido).
4. Fotos dos compositores por hotlink (miniatura do Google e Fandom): baixa resolução, podem sumir a qualquer momento.
5. Vídeo de 37 MB (1080p com áudio) só para fundo; o JS pula para 89 s.
6. Sem header fixo, sem estados de foco, sem `prefers-reduced-motion`, menu sem adaptação no celular, tudo centralizado e com a mesma hierarquia.
7. A capa original (`nochemas.png`, 1000 px) só é usada como favicon; a capa exibida vem do CDN do Spotify.
8. Sem meta description/Open Graph; `lang="pt-br"`.

## 2. Direção: "colagem noturna"

A identidade mais forte do projeto está na **capa do single** (`nochemas.png`): fotos coladas com fita adesiva sobre papel escuro granulado, uma lua crescente, os símbolos **★** e **∞**, pequenos textos em fonte de máquina de escrever, e o título em rosa com um deslocamento azul (efeito cromático). O clipe tem noite azul-petróleo, jeans e couro. A reformulação transforma o site nessa capa: uma **página-colagem noturna**, editorial e cinematográfica, não uma landing genérica.

Princípios:
- **Fotos como objetos**: capa e retratos viram polaroids/recortes com fita (pseudo-elementos), leve rotação (±1,5–3°), sombra de papel. É a assinatura visual; usar com parcimônia (capa, 2 retratos).
- **Dueto**: a seção de compositores vira "Karol ∞ Alan", dois recortes frente a frente (assimetria leve), com o ∞ como ponte.
- **Tipografia**: Playfair Display (itálico 600–800) para display e títulos, com tamanhos grandes e expressivos; Inter para texto (16–18 px, line-height 1.65, até ~66ch); uma mono (**Space Mono** 400/700) só para rótulos curtos estilo capa (datas, créditos, "ALAN NAVARRO / KAROL SEVILLA", numeração de seções "01 · 02 · 03"), em maiúsculas com tracking.
- **Título cromático**: "Una Noche Más" em rosa com sombra deslocada em azul-jeans claro (como na capa), mais um leve brilho. Só no h1 e, discretamente, no logotipo.
- **Textura**: grão de filme sutil (SVG feTurbulence inline como background, opacidade ≤ 0,06, fixo, `pointer-events:none`) e vinheta no hero. Nada de glassmorphism genérico.
- **Espaço negativo e ritmo**: seções largas, alternando alinhamento (texto à esquerda / colagem à direita, depois invertido), numeração de seções em mono.
- **Contraste**: o azul-jeans original `#2c4a5e` continua como cor de superfície, botões e detalhes; para TEXTO azul use o tom claro derivado `#8fb3cf` (9,5:1 no preto).

## 3. Paleta (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--preto` | `#000000` | fundo base (original) |
| `--noite` | `#0b0d12` | fundo de seções/papel escuro (preto azulado da capa) |
| `--cinza` | `#1a1a1a` | cards (original) |
| `--azul` | `#2c4a5e` | azul-jeans original: botões, faixas, superfícies, deslocamento do título |
| `--azul-claro` | `#8fb3cf` | texto/títulos azuis (AA) |
| `--rosa` | `#ff69b4` | destaque, título, hover, foco (7,3:1 no `--noite`) |
| `--branco` | `#ffffff` | texto principal |
| `--texto-suave` | `#a7a9b4` | texto secundário (8,3:1) |
| `--papel` | `#ece6da` | borda das polaroids / fita (com opacidade) |

Texto sobre rosa: `--noite` (7,3:1). Texto sobre `--azul`: branco (9,3:1).

## 4. Recursos novos (reais, sem demonstrações falsas)

- Header fixo com logotipo e as mesmas 3 âncoras + menu mobile.
- Botão pausar/tocar vídeo (WCAG 2.2.2), vídeo leve (`assets/una-noche-mas-hero.webm` + `.mp4`, já começa no trecho dos 89 s) com poster.
- **Players dentro da página com "fachada"**: botões "Tocar prévia aqui" carregam o embed oficial do Spotify (`https://open.spotify.com/embed/track/7nxvsuEtsUoFWx5H9jaF8A`) e o player do YouTube (`https://www.youtube-nocookie.com/embed/pCgq0ZMoUg4`) **só quando a pessoa clica** (privacidade e desempenho). Os links externos originais continuam.
- Fotos com fallback (iniciais) se a imagem não carregar.
- Link para a versão clássica no rodapé (`classic/`) e créditos/licença da foto da Karol.

## 5. Assets locais (em `assets/`)

- `assets/img/capa-una-noche-mas.webp` (800 px, da `nochemas.png` original), `assets/img/og-una-noche-mas.jpg` (1200×630).
- `assets/img/karol-sevilla-2021-retrato.webp` (480×564). **Licença CC BY 3.0, crédito obrigatório:** "Foto: Karol Sevilla (YouTube), via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Karol_Sevilla_Sedal_2021_4.jpg), CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/deed.pt-br)".
- Foto do Alan: manter a URL original do projeto (`https://static.wikia.nocookie.net/wikipop/images/0/09/AlanNavarro.jpg/revision/latest?cb=20210521204152&path-prefix=es`) com `referrerpolicy="no-referrer"` e fallback de iniciais "AN"; não há foto local com licença conhecida.
- `assets/img/una-noche-mas-poster.webp` (poster do vídeo).
- Vídeo original `unanochemas.mp4` e `nochemas.png` ficam onde estão (a versão clássica usa).
