# PRD — Karol Sevilla: história, superação e música

> Briefing da skill `criar-sites-com-ia` (Etapa 1), preenchido a partir do prompt master do usuário (16/10/2026).
> Itens que o usuário não definiu estão marcados como `[a definir]`.

## 1. Visão geral
- **O que é:** um site editorial e interativo sobre a trajetória de Karol Sevilla, com navegação inspirada em players de música (referência: Spotify Web).
- **Para quem:** fãs de Karol Sevilla e de *Soy Luna*, e visitantes que querem conhecer a história dela.
- **Objetivo principal:** o visitante percorre a história (3 capítulos), conhece *Mariposas* e *Más Linda* e chega à seção "O que Karol tem a nos ensinar?". As ações externas são ouvir as músicas nas plataformas oficiais e seguir as redes oficiais.
- **Tipo:** site vitrine estático (sem login, sem backend, sem formulários).

## 2. Diferencial
É uma biografia apresentada como um "app de música": barra lateral de navegação, cartões, faixas e um player. Todo o conteúdo é verificável e tem fontes citadas; nenhuma informação é inventada.

## 3. Estrutura (telas e seções)
| Tela / seção | Conteúdo | Objetivo |
|---|---|---|
| Início | Hero da artista, introdução, atalhos para os capítulos, destaques musicais, cartões editoriais | Apresentar e distribuir a navegação |
| História | Linha do tempo interativa + Capítulos 1, 2 e 3 | Contar a trajetória com fontes |
| Universo musical | *Mariposas*, *Más Linda* e outras faixas; contexto; links oficiais | Aprofundar a música sem simular reprodução |
| O que Karol tem a nos ensinar? | Lições em cartões, cada uma ligada a um fato ou declaração | Reflexão final |
| Rodapé / Créditos | Fontes, links oficiais, créditos de imagem, aviso de não afiliação | Transparência |

## 4. Identidade visual
- **Estilo:** interface escura e densa de app de música, com identidade própria (sem o verde nem a marca do Spotify).
- **Paleta:** definida em `DESIGN_SYSTEM.md` (Agente 2).
- **Fontes:** definidas em `DESIGN_SYSTEM.md`.
- **Tom de voz:** caloroso, admirador e factual; em português do Brasil.

## 5. Referências
| Referência | O que aproveitar |
|---|---|
| https://open.spotify.com/intl-pt | Layout em três áreas (barra lateral, conteúdo principal, barra do player), cartões em grade, hierarquia tipográfica, estados de hover e foco. Não usar logotipo, nome, verde da marca nem textos. |
| Site atual do autor (`primeira-versao/`) | Paleta original (azul `#69b9ff`, rosa `#ff69b4`, preto), lista de músicas e links das redes oficiais |

## 6. Conteúdo
- Textos e fontes: `RESEARCH_KAROL_SEVILLA.md` (Agente 1).
- Imagens: fotos com licença aberta (Wikimedia Commons) quando houver; nos demais casos, espaços marcados no HTML para o autor colar URLs autorizadas `[a definir pelo autor]`.

## 7. Requisitos técnicos
- **Stack:** HTML + CSS + JavaScript puro, a mesma do projeto atual, sem build.
- **Responsivo:** sim (celular, tablet e desktop).
- **SEO importante?** Básico (checklist "Essencial" da skill).
- **Formulários / dados sensíveis?** Não.
- **Onde publicar:** GitHub Pages. O workflow `.github/workflows/pages.yml` já publica `Projetos/Site-Karol-Sevilla/` na raiz do site.

## 8. Fora do escopo
- Reprodução real de áudio (não há fonte de áudio autorizada).
- Login, playlists do usuário, busca no catálogo, qualquer integração com a API do Spotify.
- Reproduzir letras completas das músicas.

## 9. Decisões tomadas
- **Etapa 3 da skill (protótipo no Google Stitch):** pulada. O usuário pediu a implementação completa, e a skill permite seguir só com o PRD.
- **Caminho de geração:** Caminho A (Claude Code).
- **Site anterior:** preservado em `primeira-versao/`, porque é o primeiro projeto do autor. O novo site ocupa a raiz da pasta, que é o que o Pages publica.
- **Arquitetura multiagente:** Agente 1 (pesquisa), Agente 2 (engenharia reversa e design) e Agente 3 (implementação), em sequência, seguidos de auditoria cruzada.
