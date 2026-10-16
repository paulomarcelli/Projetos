# Estado do projeto

_Atualizado em 2026-10-16 (UTC)_

## Progresso
| Fase | Status | Artefato |
|---|---|---|
| 0. Descoberta de skills | Concluída | Lidas: `criar-sites-com-ia` (SKILL, prd-template, seo, seguranca) e `reverse-engineer-anything` (REA) |
| 1. Pesquisa biográfica (Agente 1) | Concluída, com limitações | `RESEARCH_KAROL_SEVILLA.md`: 84 fontes, linha do tempo de 1999 a 2026, 3 capítulos, 6 lições, Mariposas e Más Linda. **Limitação:** as fontes foram lidas pelos trechos dos resultados de busca, porque o acesso direto às páginas foi bloqueado. 18 itens estão em "Precisa de validação". |
| 2. Engenharia reversa e design (Agente 2) | Bloqueada pela rede | `SPOTIFY_REVERSE_ENGINEERING.md`, `DESIGN_SYSTEM.md` |
| 3. Implementação (Agente 3) | Pendente | `IMPLEMENTATION_PLAN.md`, código |
| 4–5. Auditoria e testes | Pendente | `TEST_REPORT.md` |

## Decisões
Veja a seção 9 de `PROJECT_BRIEF.md`.

## Bloqueio atual
- `open.spotify.com`, `web.archive.org`, `archive.ph` e `*.spotify.com` são recusados pelo proxy do ambiente (HTTP 403), e o WebFetch também falha.
- O usuário escolheu **liberar o domínio** (`open.spotify.com`, `*.scdn.co`, `*.spotifycdn.com`) em vez de seguir sem acesso.
- As ferramentas MCP do REA (`mcp__rea__*`, rea-agents 6.5.0) estão carregadas na sessão. O CLI `npx -y rea-agents@6.5.0` também funciona.

## Próxima ação
1. Confirmar o acesso: `curl -sS -o /dev/null -w '%{http_code}' https://open.spotify.com/intl-pt`.
2. Agente 2: rodar `capture_browser_scenario`, `inspect_web_page` e `capture_web_screenshot` do REA em `https://open.spotify.com/intl-pt`, nas larguras de desktop (1440) e celular (390), e registrar os Evidence IDs.
3. Regras de conteúdo vindas da pesquisa:
   - "Una noche más" **não** foi confirmada como música da Karol, então não entra como faixa dela.
   - Não citar *La Casa de los Famosos*, "Quiero volver" nem "Juego de mentiras".
   - "Más linda" é apresentada só de forma factual, sem atribuir tema à música.
