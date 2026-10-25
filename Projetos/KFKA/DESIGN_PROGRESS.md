# KFKA — Progresso do design (protótipo navegável)

**Escopo:** só o design, em HTML, CSS e JS puros. Não há backend, banco, API, autenticação real, persistência, exportação real nem geração real de PDF. Toda ação é uma simulação local, e o toast mostra o selo "SIMULAÇÃO LOCAL".

## Status
- [x] Pesquisa do Seesaw (pt-BR, página de famílias, página de insights e login do app): veja `docs/PESQUISA_SEESAW.md`
- [x] Matriz requisito → tela → componente: em `docs/PESQUISA_SEESAW.md` e na rota `#/documentacao`
- [x] Design system vivo (tokens, tipografia, status, componentes): rota `#/design`
- [x] Páginas públicas: home, escolha de perfil, login por perfil, recuperação de senha em 3 passos, privacidade, 404 e acesso negado
- [x] Coordenação: painel, cadastros (alunos, professores, responsáveis), turmas, disciplinas e tags, vínculos, períodos, revisão (fila, lote e detalhe), relatórios gerenciais, auditoria e perfil
- [x] Professor: painel, turmas, turma, aluno, novo/editar acompanhamento, prévia, envio, meus registros, detalhe e ajuste após devolução
- [x] Família: seleção do aluno, painel por bimestre, relatórios com filtros, detalhe com ciência e observação, histórico, impressão A4 e perfil (tamanho do texto)
- [x] Responsividade: desktop (≥1024px), tablet (gaveta) e celular (tabelas em cartões, barra de abas, modal como folha inferior)
- [x] Acessibilidade: skip link, foco no título, `:focus-visible`, alvos de 44px, contraste AA e status com texto, cor e ícone
- [x] Testes automatizados com Playwright (pasta `tests/`)

## Revisão 1.1 — conferência com os PDFs + skill criar-sites-com-ia
- [x] Auditoria completa em `docs/AUDITORIA_REQUISITOS.md` e PRD em `docs/PRD.md`
- [x] Novo símbolo da marca e página `#/marca` (associações, brainstorm, caixa morfológica, moodboard, regras de uso)
- [x] Mapa de navegação clicável em `#/mapa`
- [x] Design System ampliado: justificativa da paleta, tabela de contraste, espaço/raios/sombras/grid, ícones, estados de interação
- [x] Lacunas corrigidas:
  - RF12: retorno da família visível ao professor e à coordenação
  - RF02: nova área
  - RF03: vínculo incompatível
  - RF04: validação das datas
  - RF07: comparar versões
  - RF09: botão "Baixar PDF" (geração simulada)
  - RF01: "Sair" e sessão expirada
- [x] Contraste AA corrigido (`--text-muted` #56707B), favicon, Open Graph e revisores em `agents/`
- [ ] Replicar as novidades no Figma (arquivo oficial da Entrega 2)
- [ ] Publicar no GitHub/hosting (aguarda a equipe)

## Testes (última execução)
- `node tests/crawl.js`: 277 rotas visitadas por links, nenhuma 404 e nenhum erro de JS. O único erro de console é a fonte do Google, bloqueada pela rede do ambiente de teste.
- `node tests/flows.js`: 36/36 PASS (inclui RF12, vínculo incompatível, nova área, datas, PDF, logout e um h1 por página de documentação). Cobre a visibilidade da família, ciência e observação, filtros, validações, o ciclo completo professor → revisão → devolução → ajuste → publicação, auditoria, bloqueio de edição, exportação e a gaveta no celular.
- `node tests/shots.js <pasta> <rotas…>`: capturas em 1366, 820 e 390px, com verificação de rolagem horizontal (nenhuma encontrada).

## Limitações conhecidas
- O estado vive só em memória: recarregar a página volta aos dados iniciais (intencional).
- Busca, paginação e algumas ações secundárias são demonstrativas e respondem com um toast "Interação demonstrativa".
- Fontes vêm do Google Fonts. Sem internet, a interface usa as fontes do sistema.
- O responsável logado é fixo (Ana Souza), assim como o professor (Carlos Lima) e a coordenadora (Marina Rocha).

## Próximos passos (fase funcional)
1. Trocar `KFKA.api` (em `js/data.js`) por chamadas `fetch()` para a API Node/Express + MySQL.
2. Levar as regras de visibilidade da família e de bloqueio de edição para o servidor.
3. Implementar a exportação (.xlsx/.csv) e a geração de PDF no backend.
