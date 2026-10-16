# Agente de SEO — Site Karol Sevilla

> Criado a partir de `references/seo.md` da skill `criar-sites-com-ia` (Etapa 5). Fica em `docs/agents/` para não poluir a raiz publicada.

## Instruções do agente
Você é o revisor de SEO deste site estático (HTML + CSS + JS, GitHub Pages).
1. Leia `index.html` e os arquivos em `assets/`.
2. Para cada item do checklist abaixo, diga se está **ok**, o que **falta** e a **correção sugerida**, em ordem de impacto.
3. Não altere textos de conteúdo sem perguntar ao autor.
4. O site é uma página única com seções por `#`; a página tem um título e uma descrição globais, e o JS troca o `document.title` por seção.

### Checklist "Essencial" (obrigatório)
- `<title>` única e descritiva (50–60 caracteres).
- `<meta name="description">` (até ~155 caracteres).
- `<html lang="pt-BR">`.
- Um único `<h1>`; h2/h3 sem pular níveis.
- HTML semântico (`header`, `nav`, `main`, `section`, `footer`).
- Imagens com `alt` descritivo, comprimidas (WebP) e com `width`/`height`.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Links com texto claro (sem "clique aqui").

### Checklist "Para aparecer bem no Google" (opcional neste projeto)
- Open Graph (`og:title`, `og:description`, `og:image`).
- `sitemap.xml` e `robots.txt` na raiz.
- JSON-LD quando fizer sentido.
- Performance (lazy loading, CSS/JS mínimos).

---

## Resultado da revisão (2026-10-16, Agente 3)

Medido no navegador (Playwright, `docs/TEST_REPORT.md` §4) e por leitura do código.

| # | Item | Situação | Valor medido / evidência | Correção |
|---|---|---|---|---|
| 1 | `<title>` | ok | "Karol Sevilla: história, superação e música \| fã-site" (54 caracteres); por seção, o JS usa "Capítulo 2 · Karol Sevilla \| fã-site" | — |
| 2 | Meta description | ok | 145 caracteres | — |
| 3 | `lang` | ok | `pt-BR` | — |
| 4 | Um `<h1>` e hierarquia | ok | 1 `h1` ("Karol Sevilla"); títulos de seção em `h2`, subtítulos em `h3`; 0 saltos de nível | — |
| 5 | HTML semântico | ok | `header` 1, `nav` 6 (lateral, abas, linha do tempo e navegação entre capítulos), `main` 1, `aside` (player) 1, `footer` 1, `section`/`article` por view | — |
| 6 | Imagens | ok | 32 `<img>`, 0 sem `alt`, 0 sem `width`/`height`; fotos em WebP (12–56 KB); `loading="lazy"` em todas, menos o retrato do hero (`fetchpriority="high"`) | — |
| 7 | Viewport | ok | `width=device-width, initial-scale=1` (zoom liberado) | — |
| 8 | Texto dos links | ok, com ressalva | Os links "Ver tudo" ficam ao lado do título da prateleira; "Detalhes" no player tem `aria-label` com o nome da faixa; links externos têm `aria-label` completo | Baixo impacto: se quiser, trocar "Ver tudo" por "Ver todos os capítulos" etc. |
| 9 | Open Graph | ok | `og:type`, `og:locale`, `og:title`, `og:description`, `og:url`, `og:image` (1200×630, `assets/img/og-karol-sevilla.jpg`), `og:image:alt` | URLs absolutas supõem o endereço `https://paulomarcelli.github.io/Projetos/`. Se o endereço mudar, atualizar. |
| 10 | Favicon | ok | `assets/img/favicon.svg` (borboleta própria) | — |
| 11 | `sitemap.xml` / `robots.txt` | não feito (decisão) | O site é publicado como *project page* (`/Projetos/`); o `robots.txt` só vale na raiz do domínio (`paulomarcelli.github.io/robots.txt`), que fica fora deste repositório. O site é uma URL única, então o sitemap teria uma linha só. | Se o autor quiser indexação ativa: cadastrar a URL no Google Search Console. |
| 12 | JSON-LD | não feito (decisão) | Um `Person` sobre a artista poderia sugerir site oficial. | Manter sem JSON-LD. |
| 13 | Conteúdo em texto | ok | Todo o conteúdo está no HTML (22.733 caracteres visíveis sem JS), não em imagens nem injetado por JS | — |
| 14 | Performance | ok | Sem frameworks; 2 CSS (≈ 40 KB) e 3 JS (≈ 17 KB) sem minificação; fontes com `display=swap` e `preconnect` | Opcional: rodar o PageSpeed Insights depois de publicado. |

**Conclusão:** o checklist "Essencial" passou por inteiro. Dos itens opcionais, Open Graph está feito; sitemap, robots e JSON-LD ficaram de fora de propósito (motivos acima).
