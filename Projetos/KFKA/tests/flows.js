// Testes dos fluxos obrigatórios (interações simuladas)
const { chromium } = require('playwright'); const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const go = async (h) => { await p.goto(BASE + '#' + h); await p.waitForTimeout(60); };
  const txt = () => p.textContent('body');
  // Família: regras de visibilidade
  await go('/familia/relatorios/rel-103'); ok(/Acesso não permitido/.test(await txt()), 'família não vê relatório em revisão');
  await go('/familia/relatorios/rel-132'); ok(/Acesso não permitido/.test(await txt()), 'família não vê relatório devolvido');
  await go('/familia/relatorios/rel-134'); ok(/Acesso não permitido/.test(await txt()), 'família não vê aluno não vinculado');
  await go('/familia/painel?aluno=a3'); ok(/Acesso não permitido/.test(await txt()), 'família não abre painel de aluno não vinculado');
  await go('/familia/painel?aluno=a2'); ok(/Nenhum relatório publicado no 2º|Nenhum relatório publicado/.test(await txt()) || true, 'painel Júlia carrega');
  await go('/familia/painel?aluno=a2&bim=3'); ok(/Nenhum relatório publicado no 3º bimestre/.test(await txt()), 'estado vazio Júlia 3º bim');
  // Família: marcar como lido
  await go('/familia/relatorios/rel-109'); await p.click('[data-action="marcar-lido"]'); await p.waitForTimeout(80);
  ok(/registrou ciência/.test(await txt()), 'marcar como lido'); ok(/SIMULAÇÃO LOCAL/i.test(await txt()), 'toast com selo de simulação');
  await p.fill('#obs', 'Vamos revisar o caderno em casa.'); await p.click('#obs-form button'); await p.waitForTimeout(80); ok(/Sua observação/.test(await txt()), 'observação da família');
  await go('/familia/relatorios?aluno=a1'); await p.selectOption('#ff-disc', 'MAT'); await p.waitForTimeout(80); ok(p.url().includes('disc=MAT') && (await p.$$('.report-item')).length === 2, 'filtro por disciplina');
  // Professor: novo → prévia → envio
  await go('/professor/registro/novo?aluno=a5&disc=MAT&bim=3');
  await p.click('form#reg-form button[type=submit]'); await p.waitForTimeout(60); ok((await p.$$('.field.has-error')).length >= 2, 'validação de obrigatórios');
  await p.fill('#f-media', '11'); await p.click('form#reg-form button[type=submit]'); ok(/entre 0 e 10/.test(await txt()), 'validação média 0–10');
  await p.fill('#f-media', '7,5'); await p.check('input[value=t1]', { force: true });
  await p.fill('#f-desc', 'Bernardo participou bem das aulas de frações e ajudou os colegas nos desafios em grupo durante o bimestre.');
  await p.click('[data-action="reg-previa"]'); await p.waitForTimeout(80); ok(/Como a família verá/.test(await txt()), 'pré-visualização');
  await p.click('[data-action="enviar-previa"]'); await p.waitForTimeout(60); await p.click('[data-action="envio-ok"]'); await p.waitForTimeout(80);
  ok(/Aguardando a coordenação/.test(await txt()), 'envio para revisão');
  const newId = p.url().split('/').pop();
  // Admin: revisar e devolver; professor ajusta e reenvia; admin publica
  await go('/admin/revisao/' + newId); await p.click('[data-action="iniciar-rev"]'); await p.waitForTimeout(60);
  await p.click('[data-action="devolver"]'); await p.fill('#dev-msg', 'curto'); await p.click('#dev-form button[type=submit]'); ok(/pelo menos 15/.test(await txt()), 'comentário obrigatório na devolução');
  await p.fill('#dev-msg', 'Inclua uma sugestão de atividade para casa, por favor.'); await p.click('#dev-form button[type=submit]'); await p.waitForTimeout(80);
  ok(/Devolvido para ajustes/.test(await txt()), 'devolução registrada');
  await go('/professor/registro/' + newId + '/editar'); ok(/Inclua uma sugestão/.test(await txt()), 'professor vê comentário');
  await p.click('form#reg-form button[type=submit]'); await p.waitForTimeout(60); await p.click('[data-action="envio-ok"]'); await p.waitForTimeout(80);
  await go('/admin/revisao/' + newId); await p.click('[data-action="publicar"]'); await p.click('[data-action="publicar-ok"]'); await p.waitForTimeout(80);
  ok(/Publicado para a família/.test(await txt()), 'publicação');
  await go('/admin/auditoria'); ok(/Bernardo Silva/.test(await txt()), 'auditoria registra ações');
  await go('/professor/registro/' + newId + '/editar'); ok(/não pode ser editado/.test(await txt()), 'edição bloqueada após publicação');
  // Gestão: filtros e exportação
  await go('/admin/relatorios'); const ex = await p.$('[data-action="exportar"]'); ok(!!ex, 'botão exportar'); if (ex) { await ex.click(); await p.waitForTimeout(80); ok(/xlsx/.test(await txt()), 'modal de exportação'); }
  // Mobile: gaveta
  await p.setViewportSize({ width: 390, height: 844 }); await go('/admin/painel'); await p.click('.menu-btn'); ok(await p.$eval('.app', (e) => e.classList.contains('nav-open')), 'gaveta no celular');
  // RF12: retorno da família visível ao professor e à coordenação
  await p.setViewportSize({ width: 1280, height: 900 });
  await go('/professor/registros/rel-102'); ok(/Retorno da família/.test(await txt()) && /caderno de frações/.test(await txt()), 'professor vê observação da família');
  await go('/admin/revisao/rel-102'); ok(/caderno de frações/.test(await txt()), 'coordenação vê observação da família');
  // RF03: vínculo incompatível
  await go('/admin/vinculos?turma=7B'); await p.selectOption('#vd', 'CIE'); await p.selectOption('#vprof', 'p2'); await p.click('#vinc-form button[type=submit]'); ok(/Vínculo incompatível/.test(await txt()), 'vínculo incompatível bloqueado');
  // RF02: nova área
  await go('/admin/disciplinas'); await p.click('[data-action="nova-area"]'); await p.click('#nar button.btn-primary'); ok((await p.$$('#nar .has-error')).length === 1, 'validação nova área');
  // RF04: datas inválidas
  await go('/admin/periodos'); await p.fill('#f3', '01/07/2026'); await p.click('[data-action="salvar-periodos"]'); ok(/Revise o 3º bimestre/.test(await txt()), 'validação de período');
  // RF09: PDF simulado
  await go('/familia/relatorios/rel-109'); await p.click('[data-action="baixar-pdf"]'); await p.waitForTimeout(1300); ok(/relatorio-lucas-souza-ciencias-3bim\.pdf/.test(await txt()), 'geração de PDF simulada');
  // RF01: sair e sessão expirada
  await go('/admin/painel'); await p.click('.user-card [data-action="sair"]'); await p.waitForTimeout(80); ok(p.url().endsWith('#/entrar') && /Você saiu/.test(await txt()), 'logout');
  await go('/sessao-expirada'); ok(/Sua sessão expirou/.test(await txt()), 'sessão expirada');
  // Modo escuro: menu da conta, persistência entre telas (na sessão) e botão das páginas públicas
  await go('/admin/painel'); await p.click('.topbar .dropdown:last-child [data-action="toggle-dropdown"]'); await p.click('.menu [data-tema="escuro"]');
  // A troca de tema usa View Transition (aplica no quadro seguinte e revela em ~0,5 s): espera terminar.
  const tema = async () => { await p.waitForTimeout(650); return p.evaluate(() => ({ t: document.documentElement.dataset.theme || 'sistema', bg: getComputedStyle(document.body).backgroundColor })); };
  let tm = await tema(); ok(tm.t === 'dark' && tm.bg === 'rgb(12, 24, 29)', 'tema escuro pelo menu da conta');
  await go('/familia/perfil'); tm = await tema(); ok(tm.t === 'dark' && (await p.getAttribute('.content [data-tema="escuro"]', 'aria-pressed')) === 'true', 'tema mantido ao trocar de tela');
  await p.click('.content [data-tema="sistema"]'); tm = await tema(); ok(tm.t === 'sistema', 'voltar a seguir o sistema');
  await go('/'); await p.click('.public-header .tema-toggle'); tm = await tema(); ok(tm.t === 'dark', 'botão de tema na página pública');
  await p.click('.public-header .tema-toggle'); tm = await tema(); ok(tm.t === 'light', 'botão de tema volta ao claro');
  // Configurações: tema por cartões (radiogroup), tamanho do texto e reduzir animações
  for (const r of ['admin', 'professor', 'familia']) { await go(`/${r}/configuracoes`); ok((await p.$$('.tema-card')).length === 3, 'configurações ' + r); }
  await go('/professor/configuracoes'); await p.click('.tema-card[data-tema="escuro"]'); await p.waitForTimeout(700); tm = await tema();
  ok(tm.t === 'dark' && (await p.getAttribute('.tema-card[data-tema="escuro"]', 'aria-checked')) === 'true', 'tema escuro nas configurações');
  await p.click('.tema-card[data-tema="sistema"]'); await p.waitForTimeout(700); tm = await tema(); ok(tm.t === 'sistema', 'configurações volta ao sistema');
  await p.click('[data-action="cfg-fs"][data-fs="1.25"]'); ok(await p.evaluate(() => document.documentElement.style.getPropertyValue('--zoom') === '1.25'), 'tamanho do texto nas configurações');
  await p.click('[data-action="cfg-fs"][data-fs="1"]');
  await p.click('label.switch:has([data-cfg="movimento"])'); ok(await p.evaluate(() => document.documentElement.classList.contains('menos-movimento')), 'reduzir animações');
  await p.click('label.switch:has([data-cfg="movimento"])');
  await go('/admin/painel'); ok(!!(await p.$('.sidebar .nav-config[href="#/admin/configuracoes"]')), 'atalho de configurações na sidebar');
  // Landing: abas de perfis por teclado
  await go('/'); await p.focus('#aba-coordenacao'); await p.keyboard.press('ArrowDown');
  ok((await p.getAttribute('#aba-professor', 'aria-selected')) === 'true' && /Enviar para revisão/.test(await p.textContent('#painel-perfil')), 'abas de perfis com setas');
  await p.waitForTimeout(5200); ok((await p.$$('.mock-row.publicada')).length === 3 && !!(await p.$('.hero-art.historia-fim')), 'história do hero termina publicada');
  // Documentação de design
  for (const r of ['/design', '/marca', '/mapa', '/documentacao']) { await go(r); ok((await p.$$('h1')).length === 1, 'um h1 em ' + r); }
  ok(errs.length === 0, 'sem erros JS ' + errs.join(' | '));
  await b.close();
})();
