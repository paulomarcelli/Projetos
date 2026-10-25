/* =========================================================
   KFKA — Layout compartilhado da área logada (sidebar + topbar)
   Um único componente para os três perfis, com menus diferentes.
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  K.state = Object.assign(K.state || {}, { alunoSel: 'a1' }); // aluno selecionado pela família (estado local)

  const MENUS = {
    admin: [
      ['Visão geral', [['painel', 'Painel', 'grid']]],
      ['Estrutura escolar', [['alunos', 'Alunos', 'user'], ['professores', 'Professores', 'book'], ['responsaveis', 'Responsáveis', 'family'], ['turmas', 'Turmas', 'users'], ['disciplinas', 'Disciplinas e tags', 'tag'], ['vinculos', 'Vínculos', 'link'], ['periodos', 'Períodos letivos', 'calendar']]],
      ['Acompanhamento', [['revisao', 'Revisão', 'review', 'count'], ['relatorios', 'Relatórios gerenciais', 'chart'], ['auditoria', 'Histórico e auditoria', 'clock']]]
    ],
    professor: [
      ['Meu trabalho', [['painel', 'Início', 'home'], ['turmas', 'Minhas turmas', 'users'], ['registros', 'Meus registros', 'file', 'count'], ['novo', 'Novo acompanhamento', 'plus']]]
    ],
    familia: [
      ['Acompanhamento', [['painel', 'Início', 'home'], ['relatorios', 'Relatórios', 'file'], ['historico', 'Histórico por bimestre', 'clock']]]
    ]
  };
  const BASE = { admin: '#/admin/', professor: '#/professor/', familia: '#/familia/' };
  const ROLE_LABEL = { admin: 'Administrador', professor: 'Professor', familia: 'Responsável' };

  function who(role) {
    if (role === 'admin') { const s = K.data.sessao.admin; return { nome: s.nome, sub: s.cargo, cor: s.cor }; }
    if (role === 'professor') { const p = K.api.prof('p1'); return { nome: p.nome, sub: 'Matemática · Geografia', cor: p.cor }; }
    const r = K.api.resp('r1'); return { nome: r.nome, sub: 'Responsável', cor: '#5FD4A8' };
  }
  function counts(role) {
    if (role === 'admin') return K.api.relsFiltrados({ status: ['enviado', 'revisao'] }).length;
    if (role === 'professor') return K.api.relsFiltrados({ prof: 'p1', status: 'devolvido' }).length;
    return 0;
  }

  K.shell = (role, active, content, opts = {}) => {
    const u = who(role);
    const c = counts(role);
    const nav = MENUS[role].map(([label, items]) => `<div class="nav" role="list"><div class="nav-label">${label}</div>${items.map(([key, txt, ic, cnt]) =>
      `<a role="listitem" href="${key === 'novo' ? '#/professor/registro/novo' : BASE[role] + key}" ${active === key ? 'aria-current="page"' : ''} data-action-nav>${I(ic)}<span>${txt}</span>${cnt && c ? `<span class="count" aria-label="${c} pendentes">${c}</span>` : ''}</a>`).join('')}</div>`).join('');

    // Família: alunos vinculados na sidebar (seletor)
    let kids = '';
    if (role === 'familia') {
      const r = K.api.resp('r1');
      kids = `<div class="nav"><div class="nav-label">Meus alunos</div>${r.alunos.map((id) => { const a = K.api.aluno(id); const t = K.api.turma(a.turma); return `<a href="#/familia/painel?aluno=${a.id}" ${K.state.alunoSel === a.id ? 'aria-current="page"' : ''} data-action="pick-aluno" data-id="${a.id}">${K.avatar(a.nome, a.cor, 'sm')}<span>${a.nome.trim().split(/\s+/)[0]} <small style="opacity:.7">· ${t.nome}</small></span></a>`; }).join('')}<a href="#/familia/selecionar">${I('swap')}<span>Trocar aluno</span></a></div>`;
    }
    const notifs = K.data.notificacoes[role === 'familia' ? 'familia' : role].map(([ic, tone, t, s, w, href]) => `<a class="notif-item unread" href="${href || (role === 'professor' ? '#/professor/registros?status=devolvido' : '#/familia/relatorios')}"><span class="ico ${tone}">${I(ic, 'icon-sm')}</span><span><b>${t}</b><small>${s} · ${w}</small></span></a>`).join('');
    const periodo = role === 'familia' ? `<span class="hide-mobile filter-chip" style="cursor:default">${I('cap', 'icon-sm')} ${K.data.escola.nome} · ${K.data.escola.ano}</span>`
      : `<a class="hide-mobile filter-chip" href="${role === 'admin' ? '#/admin/periodos' : '#/professor/painel'}">${I('calendar', 'icon-sm')} 3º bimestre · digitação até 30/09</a>`;
    const search = role === 'familia' ? '' : `<form class="search" role="search" data-search="${role}"><label class="sr-only" for="gsearch">Buscar</label>${I('search')}<input id="gsearch" class="input" type="search" placeholder="${role === 'admin' ? 'Buscar aluno, professor, turma…' : 'Buscar aluno ou turma…'}"></form>`;

    return `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div class="demo-ribbon" role="note">${I('info', 'icon-sm')} Protótipo navegável · dados fictícios · ações são simuladas localmente <a href="#/">Início</a></div>
    <div class="app ${role === 'familia' ? 'has-tabbar' : ''}">
      <aside class="sidebar" aria-label="Menu principal">
        <a class="logo brand" href="${BASE[role]}painel" style="color:#fff">${K.mark()}<span><span class="word">KFKA</span><small>Acompanhamento Escolar</small></span></a>
        <span class="role-pill"><span class="dot" style="background:${role === 'admin' ? 'var(--sun)' : role === 'professor' ? 'var(--sky)' : 'var(--mint)'}"></span>Perfil ${ROLE_LABEL[role]}</span>
        <nav aria-label="Navegação do perfil">${nav}${kids}</nav>
        <div class="sidebar-foot">
          <div class="user-card">${K.avatar(u.nome, u.cor)}<div class="grow"><div class="name">${u.nome}</div><div class="sub">${u.sub}</div></div><a href="#/entrar" data-action="sair" aria-label="Sair">${I('logout')}</a></div>
        </div>
      </aside>
      <div class="scrim" data-action="close-nav"></div>
      <div class="main">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" data-action="toggle-nav" aria-label="Abrir menu">${I('menu')}</button>
          ${search}
          <span class="grow"></span>
          ${periodo}
          <div class="dropdown">
            <button type="button" class="icon-btn" data-action="toggle-dropdown" aria-haspopup="true" aria-expanded="false" aria-label="Notificações (${K.data.notificacoes[role].length} novas)">${I('bell')}<span class="badge-dot"></span></button>
            <div class="menu notif-panel" role="menu"><div class="row-between" style="padding:6px 8px 10px"><b style="font-family:var(--font-display);font-size:18px">Notificações</b><button type="button" class="link-btn" data-action="noop">Marcar como lidas</button></div>${notifs}</div>
          </div>
          <div class="dropdown">
            <button type="button" class="icon-btn" style="width:auto;padding:0 6px;gap:6px;border-radius:999px" data-action="toggle-dropdown" aria-haspopup="true" aria-expanded="false" aria-label="Menu da conta">${K.avatar(u.nome, u.cor, 'sm')}${I('chevron-down', 'icon-sm')}</button>
            <div class="menu" role="menu">
              <div style="padding:8px 12px 10px"><b>${u.nome}</b><div class="muted" style="font-size:12px">${u.sub}</div></div><hr>
              <a href="${BASE[role]}perfil" role="menuitem">${I('settings')} Meu perfil e preferências</a>
              <a href="#/entrar" role="menuitem">${I('swap')} Trocar de perfil</a><hr>
              <div class="menu-tema"><span id="tema-menu-l">Tema</span>${K.temaControl('tema-menu')}</div><hr>
              <a href="#/entrar" role="menuitem" class="danger" data-action="sair">${I('logout')} Sair</a><a href="#/sessao-expirada" role="menuitem">${I('clock')} Ver tela de sessão expirada</a>
            </div>
          </div>
        </header>
        <main id="conteudo" class="content" tabindex="-1">${content}</main>
      </div>
      ${role === 'familia' ? `<nav class="tabbar" aria-label="Navegação inferior">
        <a href="#/familia/painel" ${active === 'painel' ? 'aria-current="page"' : ''}>${I('home')}Início</a>
        <a href="#/familia/relatorios" ${active === 'relatorios' ? 'aria-current="page"' : ''}>${I('file')}Relatórios</a>
        <a href="#/familia/historico" ${active === 'historico' ? 'aria-current="page"' : ''}>${I('clock')}Histórico</a>
        <a href="#/familia/perfil" ${active === 'perfil' ? 'aria-current="page"' : ''}>${I('user')}Perfil</a></nav>` : ''}
    </div>`;
  };

  // Fecha a gaveta ao navegar (tablet/celular)
  document.addEventListener('click', (e) => { if (e.target.closest('.sidebar a')) { const a = K.qs('.app'); a && a.classList.remove('nav-open'); } });
  // Busca global: leva à lista correspondente com o termo
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-search]');
    if (!f) return;
    e.preventDefault();
    const q = encodeURIComponent(f.querySelector('input').value.trim());
    K.go(f.dataset.search === 'admin' ? `#/admin/alunos?q=${q}` : `#/professor/turmas/6A?q=${q}`);
  });
  // Logout simulado (RF01)
  K.actions.sair = () => { K.go('#/entrar'); K.toast('Você saiu da sua conta', 'Sessão encerrada neste navegador.', 'info'); };
  K.actions['pick-aluno'] = (el) => { K.state.alunoSel = el.dataset.id; K.go(el.getAttribute('href')); if (location.hash === el.getAttribute('href')) K.refresh(); };
})(window.KFKA);
