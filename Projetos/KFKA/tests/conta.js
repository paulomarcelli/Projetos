// Testes das telas de conta: criar conta (3 perfis), login com as mensagens de erro e saída.
const { chromium } = require('playwright'); const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  // Navegar sem recarregar: as contas criadas ficam na memória da página
  const go = async (h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(80); };
  const txt = () => p.textContent('body');
  const entrar = async (perfil, email, senha) => { await go(`/entrar/${perfil}`); await p.fill('#email', email); await p.fill('#senha', senha); await p.click('#login-form button[type=submit]'); await p.waitForTimeout(120); };
  await p.goto(BASE + '#/'); await p.waitForTimeout(80);

  // Vitrine sem demonstração e áreas só com login
  ok(!/Ver a demonstração/.test(await txt()) && (await p.$$('a[href="#/entrar/administrador"]')).length >= 1, 'vitrine leva ao login, sem "Ver a demonstração"');
  for (const [area, perfil] of [['/admin/revisao', 'administrador'], ['/professor/painel', 'professor'], ['/familia/relatorios?bim=3', 'responsavel']]) {
    await go(area); ok(p.url().includes(`#/entrar/${perfil}?volta=`) && /Entre para continuar/.test(await txt()), `${area} sem login leva ao login`);
  }
  await p.fill('#email', 'ana.souza@email.com'); await p.fill('#senha', 'kfka2026'); await p.click('#login-form button[type=submit]'); await p.waitForTimeout(150);
  ok(p.url().endsWith('#/familia/relatorios?bim=3'), 'depois do login volta para a tela pedida');
  await go('/admin/painel'); ok(/Esta área é de coordenação/.test(await txt()), 'conta de outro perfil não abre a área');
  await p.reload(); await p.waitForTimeout(150); await go('/familia/painel'); ok(/familia\/painel/.test(p.url()), 'F5 não desloga (sessão da aba)');
  await p.click('[data-action="sair"]').catch(() => {}); await p.waitForTimeout(80);

  // Login sem atalho de demonstração
  await go('/entrar/professor');
  ok(await p.inputValue('#email') === '', 'login começa com o e-mail vazio');
  ok(!/Demonstração: qualquer senha/.test(await txt()), 'login sem dica de demonstração');
  ok((await p.$$('a[href="#/criar-conta/professor"]')).length === 1, 'login leva a criar conta do mesmo perfil');

  // Criar conta: validação
  await go('/criar-conta'); ok((await p.$$('.role-option')).length === 3, 'criar conta mostra os 3 perfis');
  await go('/criar-conta/responsavel');
  await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(60);
  ok((await p.$$('#cadastro-form .field.has-error')).length >= 7, 'cadastro vazio aponta todos os obrigatórios');
  await p.fill('#convite', 'ab12'); await p.fill('#csenha', 'curta'); await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(60);
  ok(/8 letras ou números/.test(await txt()) && /pelo menos 8 caracteres/.test(await txt()), 'formato do convite e tamanho da senha');
  await p.fill('#convite', 'auro7k2p'); ok(await p.inputValue('#convite') === 'AURO-7K2P', 'convite em maiúsculas com hífen');
  await p.click('.ver-senha'); ok(await p.getAttribute('#csenha', 'type') === 'text', 'mostrar senha');

  // Criar conta: sucesso (responsável) e e-mail repetido
  await p.fill('#nome', 'Beatriz Nogueira'); await p.fill('#cemail', 'bia@email.com'); await p.click('label.opcao:nth-child(2)');
  await p.fill('#csenha', 'Aurora#2026'); await p.check('#termos'); await p.check('#lgpd');
  await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(120);
  ok(/Conta criada/.test(await txt()), 'cadastro de responsável concluído');
  await go('/criar-conta/professor'); await p.fill('#nome', 'Outra Pessoa'); await p.fill('#cemail', 'BIA@email.com'); await p.fill('#convite', 'AURO7K2P');
  await p.selectOption('#disciplina', 'MAT'); await p.fill('#csenha', 'Aurora#2026'); await p.check('#termos');
  await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(80);
  ok(/Já existe uma conta com este e-mail/.test(await txt()), 'não cria duas contas com o mesmo e-mail');
  await go('/criar-conta/administrador'); await p.fill('#nome', 'Rita Alves'); await p.fill('#cemail', 'rita@escola.edu.br'); await p.fill('#escola', 'Escola Estadual Horizonte');
  await p.selectOption('#cargo', 'Direção'); await p.fill('#csenha', 'Horizonte!26'); await p.check('#termos');
  await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(120);
  ok(/Escola Estadual Horizonte/.test(await txt()), 'cadastro de coordenação cita a escola');

  // Login: erros
  await entrar('professor', 'ninguem@aurora.edu.br', '12345678'); ok(/Não encontramos uma conta/.test(await txt()), 'e-mail sem conta');
  await entrar('professor', 'bia@email.com', 'Aurora#2026'); ok(/conta de responsável/.test(await txt()), 'e-mail de outro perfil');
  await entrar('responsavel', 'bia@email.com', 'errada99'); ok(/Restam 2 tentativas/.test(await txt()), 'senha errada conta as tentativas');
  await entrar('responsavel', 'bia@email.com', 'errada99'); await entrar('responsavel', 'bia@email.com', 'errada99');
  await entrar('responsavel', 'bia@email.com', 'Aurora#2026'); ok(/Acesso bloqueado/.test(await txt()), 'bloqueio depois de 3 erros');

  // Login: sucesso mostra quem entrou; sair limpa a sessão
  await entrar('administrador', 'rita@escola.edu.br', 'Horizonte!26');
  ok(p.url().endsWith('#/admin/painel') && /Olá, Rita/.test(await txt()), 'conta nova entra e é cumprimentada');
  ok(/Rita Alves/.test(await p.textContent('.user-card')), 'layout mostra a conta que entrou');
  await p.click('.user-card [data-action="sair"]'); await p.waitForTimeout(80);
  await go('/admin/painel'); ok(p.url().includes('#/entrar/administrador?volta='), 'depois de sair, a área volta a pedir login');
  await entrar('professor', 'carlos.lima@aurora.edu.br', 'kfka2026'); ok(/Carlos/.test(await txt()) && p.url().endsWith('#/professor/painel'), 'conta fictícia da escola entra');

  // Nome com HTML não vira marcação
  await go('/criar-conta/administrador'); await p.fill('#nome', '<img src=x onerror=alert(1)>'); await p.fill('#cemail', 'x@x.co'); await p.fill('#escola', 'Escola <b>X</b>');
  await p.selectOption('#cargo', 'Direção'); await p.fill('#csenha', 'Horizonte!26'); await p.check('#termos'); await p.click('#cadastro-form button[type=submit]'); await p.waitForTimeout(100);
  await entrar('administrador', 'x@x.co', 'Horizonte!26'); ok((await p.$$('.user-card img')).length === 0 && (await p.$$('.sucesso b b')).length === 0, 'textos digitados são escapados');

  ok(errs.length === 0, 'sem erros JS ' + errs.join(' | '));
  await b.close();
})();
