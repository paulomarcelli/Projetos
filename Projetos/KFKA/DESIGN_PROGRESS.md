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

## Revisão 1.2 — polimento de design
- [x] Evolução da média (família) virou gráfico de linha (`KFKA.lineChart`): eixo rotulado, bimestre atual destacado e bimestre sem dados marcado como "a publicar"
- [x] Botão de menu não aparece mais no desktop (conflito de cascata entre `layout.css` e `.icon-btn`)
- [x] Trilha de navegação só aparece quando tem 2 níveis ou mais
- [x] Formulário do professor no celular: a barra de ações deixa de ser fixa (ocupava quase meia tela) e mostra "Enviar" primeiro
- [x] Aviso de novo relatório: ícone visível sobre o fundo verde e alinhado ao título no celular
- [x] Relatórios gerenciais: espaçamento entre indicadores, gráficos e tabela
- [x] Testes: crawl, flows, pior caso

## Revisão 1.3 — modo escuro
- [x] Paleta escura em `css/tokens.css`, com contraste AA conferido (texto ≥ 4,5:1)
- [x] Segue o sistema por padrão; seletor Sistema / Claro / Escuro no menu da conta e no perfil da família; botão sol/lua nas páginas públicas, no login e na documentação
- [x] Novos tokens de papel: `--chrome`/`--chrome-deep` (fundos escuros da marca), `--strong` (item selecionado), `--on-pastel` (texto sobre céu/sol/menta), `--*-solid` (botões com texto branco)
- [x] Folha de impressão A4 continua clara (é "papel")
- [x] A escolha vale para a sessão (em memória, como o tamanho do texto); nada é salvo no navegador nesta fase
- [x] Testes: 5 novos em `flows.js` (41 no total), crawl e pior caso

## Revisão 1.4 — polimento (ui-ux-pro-max, ui-styling, animate, emil-design-eng)
- [x] Bug: faltava `[hidden] { display: none }`. O alerta "E-mail ou senha incorretos" aparecia no login sem erro algum, e os estados vazios das listas apareciam junto com a tabela
- [x] Troca de tema com revelação circular a partir do botão (View Transitions). É imediata com "menos movimento" ou em navegador sem suporte, e cliques durante a revelação não se perdem
- [x] Modo escuro: o botão claro sobre o fundo da marca vira vidro discreto (`--on-chrome-btn*`); antes era branco puro e ofuscava
- [x] Anel e barras de progresso se preenchem ao abrir a página (`clip-path` e `@property --p`, 700–900 ms, só com movimento permitido)
- [x] Painel do professor: "Minhas turmas" foi para a coluna de texto; a arte da marca no canto direito não passa mais por trás do botão
- [x] Login: o painel da marca ganhou três garantias do PRD (revisão antes de publicar, ciência da família, acesso só de vinculados)
- [x] Testes: crawl 277 rotas sem erro, flows 41/41 e pior caso sem quebras

## Testes (última execução)
- `node tests/crawl.js`: 277 rotas visitadas por links, nenhuma 404 e nenhum erro de JS. O único erro de console é a fonte do Google, bloqueada pela rede do ambiente de teste.
- `node tests/flows.js`: 41/41 PASS (inclui RF12, vínculo incompatível, nova área, datas, PDF, logout e um h1 por página de documentação). Cobre a visibilidade da família, ciência e observação, filtros, validações, o ciclo completo professor → revisão → devolução → ajuste → publicação, auditoria, bloqueio de edição, exportação e a gaveta no celular.
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
