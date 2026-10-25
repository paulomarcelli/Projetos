/* =========================================================
   KFKA — Páginas públicas: início, login, recuperação, 404
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  const logo = (dark) => `<a class="logo" href="#/" style="color:${dark ? '#fff' : 'var(--ink)'}">${K.mark()}<span><span class="word">KFKA</span><small>Acompanhamento Escolar</small></span></a>`;
  const footer = () => `<footer class="public-footer">${logo(true)}<span>Projeto Interdisciplinar · 2º ADS · FECAP 2026 · protótipo de interface com dados fictícios</span><span class="row" style="flex-wrap:wrap"><a href="#/design">Design system</a><a href="#/marca">Marca</a><a href="#/mapa">Mapa de navegação</a><a href="#/documentacao">Pesquisa e requisitos</a><a href="#/privacidade">Privacidade</a></span></footer>`;
  K.actions['scroll-to'] = (el) => { const t = document.getElementById(el.dataset.target); t && t.scrollIntoView({ behavior: 'smooth' }); };

  /* ---------- Página inicial institucional ---------- */
  const mockApp = () => `
    <div class="mock" aria-hidden="true">
      <div class="mock-bar"><i></i><i></i><i></i><span>kfka.app/familia</span></div>
      <div class="mock-body">
        <div class="mock-side"><b>KFKA</b><span class="on">Início</span><span>Relatórios</span><span>Histórico</span></div>
        <div class="mock-main">
          <b class="mock-title">Relatórios de Lucas</b>
          ${[['Matemática', '8,5', 'publicado'], ['Língua Portuguesa', '8,0', 'publicado'], ['Ciências', '9,0', 'publicado']].map(([d, m, s]) => `<div class="mock-row"><span>${d}</span><span class="mono">${m}</span>${K.status(s)}</div>`).join('')}
        </div>
      </div>
    </div>`;
  K.views.home = {
    title: 'Início',
    render: () => `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header class="public-header">${logo(true)}
        <nav aria-label="Seções da página"><a href="#/" data-action="scroll-to" data-target="como-funciona">Como funciona</a><a href="#/" data-action="scroll-to" data-target="perfis">Perfis</a><a href="#/" data-action="scroll-to" data-target="seguranca">Segurança</a></nav>
        <a class="btn btn-light" href="#/entrar">${I('user')} Entrar</a>
      </header>
      <main id="conteudo">
        <section class="hero">
          <div class="hero-copy">
            <span class="hero-pill"><i></i>Ensino Fundamental · acompanhamento bimestral</span>
            <h1 id="page-title" tabindex="-1">A escola e a família acompanhando o aluno juntas.</h1>
            <p>Professores registram o desenvolvimento de cada aluno a cada bimestre, a coordenação revisa e publica, e os responsáveis acompanham tudo em um só lugar — de forma clara e segura.</p>
            <div class="row"><a class="btn btn-primary btn-lg" href="#/entrar">Acessar minha conta ${I('chevron-right')}</a><a class="btn btn-ghost-light btn-lg" href="#/" data-action="scroll-to" data-target="como-funciona">Ver como funciona</a></div>
            <ul class="hero-points"><li>${I('message')} Comunicação escola–família</li><li>${I('clock')} Quatro bimestres organizados</li><li>${I('shield')} Dados protegidos (LGPD)</li></ul>
          </div>
          <div class="hero-art">${mockApp()}
            <div class="phone" aria-hidden="true"><div class="phone-notch"></div><div class="phone-screen">
              <div class="ph-head">${K.avatar('Lucas Souza', '#5FD4A8', 'sm')}<div><b>Lucas · 6º A</b><small>3º bimestre</small></div></div>
              <div class="ph-new"><small>Novo relatório</small><b>Ciências</b><span class="nota ok sm">9,0</span></div>
              <div class="ph-bubble">Participou com curiosidade do projeto sobre o ciclo da água…</div>
              <span class="ph-btn">${I('check', 'icon-sm')} Li e estou ciente</span>
              <div class="ph-tabs"><i class="on"></i><i></i><i></i><i></i></div></div></div>
            <div class="float-card fc-1">${K.avatar('Lucas Souza', '#5FD4A8', 'sm')}<div><small>Média · Matemática</small><b class="mono">8,5</b></div><span class="tag t-verde">+0,5</span></div>
            <div class="float-card fc-2"><span class="ico ico-teal" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${I('bell', 'icon-sm')}</span><div><b>Novo relatório publicado</b><small>Ciências · há 2 min</small></div></div>
          </div>
        </section>

        <section class="section" id="como-funciona">
          <div class="section-head"><h2>Um fluxo claro, do registro à família</h2><p>Cada relatório passa por etapas visíveis para todos. Ninguém fica sem saber em que ponto ele está.</p></div>
          <ol class="steps-grid">
            ${[['calendar', 'ico-blue', 'A escola abre o bimestre', 'A coordenação organiza turmas e vínculos e define o período de digitação.', 'rascunho'], ['edit', 'ico-teal', 'O professor registra', 'Descrição, média e tags de cada aluno, salvas como rascunho e enviadas para revisão.', 'enviado'], ['review', 'ico-warn', 'A coordenação revisa', 'Ajusta com histórico, devolve com comentários ou publica.', 'revisao'], ['file', 'ico-ok', 'A família acompanha', 'Consulta o relatório publicado, marca como lido e imprime.', 'publicado']].map(([ic, tone, t, d, s], i) => `
              <li><span class="flow-dot ${tone}" aria-hidden="true">${I(ic, 'icon-sm')}</span><span class="sr-only">Etapa ${i + 1}: </span><h3>${t}</h3><p class="text-2">${d}</p>${K.status(s)}</li>`).join('')}
          </ol>
        </section>

        <section class="section section-paper" id="perfis">
          <div class="section-head"><h2>Três perfis, um só produto</h2><p>Cada pessoa vê exatamente o que precisa — e nada além disso.</p></div>
          <div class="grid-3">
            ${[['shield', 'var(--sun)', 'Coordenação', 'Administrador', ['Cadastros e vínculos de turma', 'Períodos dos quatro bimestres', 'Revisão, publicação e devolução', 'Relatórios e exportação'], '#/admin/painel'],
              ['book', 'var(--sky)', 'Sala de aula', 'Professor', ['Turmas e alunos atribuídos', 'Registro com média e tags', 'Rascunho, prévia e envio', 'Ajustes após devolução'], '#/professor/painel'],
              ['family', 'var(--mint)', 'Família', 'Responsável', ['Somente alunos vinculados', 'Relatórios publicados', 'Filtro por bimestre e disciplina', 'Marcar como lido e imprimir'], '#/familia/selecionar']].map(([ic, c, eb, t, items, href], i) => `
              <article class="card role-card ${i === 1 ? 'card-dark' : ''}"><div class="role-top"><span class="role-ico sm" style="background:${c}">${I(ic)}</span><div><h3 style="font-family:var(--font-display);font-size:26px">${t}</h3><p class="${i === 1 ? '' : 'text-2'}" style="font-weight:600;font-size:14px;margin-top:4px;${i === 1 ? 'color:var(--sky)' : ''}">${eb}</p></div></div>
              <ul class="checklist">${items.map((x) => `<li>${I('check', 'icon-sm')}${x}</li>`).join('')}</ul><a class="btn ${i === 1 ? 'btn-light' : 'btn-secondary'}" href="${href}">Ver demonstração ${I('chevron-right', 'icon-sm')}</a></article>`).join('')}
          </div>
        </section>

        <section class="section" id="seguranca">
          <div class="card card-dark security">
            <div class="grow stack-sm"><h2><span class="sec-lock" aria-hidden="true">${I('lock')}</span>Segurança e LGPD desde o primeiro clique</h2><p style="color:rgba(255,255,255,.75)">Proteção especial aos dados de crianças e adolescentes. A família só vê relatórios publicados dos alunos vinculados a ela.</p></div>
            <ul class="checklist sec-list">${['Acesso separado por perfil', 'Sessões que expiram sozinhas', 'Toda alteração fica na auditoria'].map((x) => `<li>${I('check', 'icon-sm')}${x}</li>`).join('')}</ul>
          </div>
        </section>
        <section class="section" style="padding-top:0"><div class="cta-final"><h2>Pronto para acompanhar de perto?</h2><p>Entre com o e-mail cadastrado pela escola.</p><a class="btn btn-light btn-lg" href="#/entrar">Acessar minha conta ${I('chevron-right')}</a></div></section>
      </main>${footer()}`
  };

  /* ---------- Login: primeiro o perfil (padrão inspirado no Seesaw), depois credenciais ---------- */
  const authArt = () => `
    <div class="auth-art">${logo(true)}
      <h2 style="color:#fff;font-size:clamp(2rem,3.4vw,3rem);line-height:1.08">A escola e a família<br>na mesma página.</h2>
      <p style="color:rgba(255,255,255,.75);max-width:44ch">Relatórios bimestrais revisados pela escola, publicados com segurança e acessíveis de qualquer tela.</p>
      <div class="auth-card">${K.avatar('Lucas Souza', '#5FD4A8')}<div class="grow"><b>Lucas Souza · 6º A</b><small>Matemática · 3º bimestre</small></div>${K.status('publicado')}</div>
      <span class="auth-blob"></span></div>`;
  const ROLES = { administrador: ['shield', 'var(--sun)', 'Sou da coordenação', 'Administrador da escola', 'marina.rocha@aurora.edu.br', '#/admin/painel'], professor: ['book', 'var(--sky)', 'Sou professor', 'Registro o acompanhamento das turmas', 'carlos.lima@aurora.edu.br', '#/professor/painel'], responsavel: ['family', 'var(--mint)', 'Sou responsável', 'Acompanho meus filhos', 'ana.souza@email.com', '#/familia/selecionar'] };
  K.views.entrar = {
    title: 'Entrar',
    render: () => `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}
      <main class="auth-form" id="conteudo"><div class="stack-lg">
        <div class="stack-sm"><span class="only-mobile">${logo(false)}</span><h1 id="page-title" tabindex="-1">Como você acessa o KFKA?</h1><p class="text-2">Escolha seu perfil para continuar. Se você tiver mais de um perfil, pode trocar depois de entrar.</p></div>
        <div class="stack-sm">${Object.entries(ROLES).map(([k, [ic, c, t, s]]) => `<a class="role-option" href="#/entrar/${k}"><span class="role-ico sm" style="background:${c}">${I(ic)}</span><span class="grow"><b>${t}</b><small>${s}</small></span>${I('chevron-right')}</a>`).join('')}</div>
        <p class="muted" style="font-size:13px">Primeiro acesso? A escola envia o convite para o e-mail cadastrado. <a href="#/">Voltar ao início</a></p>
      </div></main></div>`
  };
  K.views.login = {
    title: 'Entrar',
    render: (p, q) => {
      const r = ROLES[p.perfil] || ROLES.responsavel;
      return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}
      <main class="auth-form" id="conteudo"><div class="stack-lg">
        <a href="#/entrar" class="row" style="font-weight:700;text-decoration:none;gap:6px">${I('chevron-left', 'icon-sm')} Trocar perfil</a>
        <div class="stack-sm"><span class="role-pill-light"><span class="role-ico xs" style="background:${r[1]}">${I(r[0], 'icon-sm')}</span>${r[2].replace('Sou ', '').replace(/^./, (c) => c.toUpperCase())}</span><h1 id="page-title" tabindex="-1">Bem-vindo de volta</h1><p class="text-2">Entre com o e-mail cadastrado pela escola.</p></div>
        <div class="alert danger" id="login-alert" role="alert" hidden>${I('alert')}<div><b>E-mail ou senha incorretos</b>Restam 2 tentativas antes do bloqueio temporário de 15 minutos. (simulação)</div></div>
        <form class="stack" id="login-form" novalidate>
          ${K.field({ id: 'email', label: 'E-mail', type: 'email', value: r[4], required: true, icon: 'mail', attrs: 'autocomplete="email"' })}
          ${K.field({ id: 'senha', label: 'Senha', type: 'password', required: true, icon: 'lock', hint: 'Demonstração: qualquer senha com 6+ caracteres entra; menos que isso mostra o erro.', attrs: 'autocomplete="current-password"' })}
          <div class="row-between"><label class="check"><input type="checkbox" checked> Lembrar de mim</label><a href="#/recuperar-senha" style="font-weight:700">Esqueci minha senha</a></div>
          <button class="btn btn-primary btn-lg btn-block" type="submit">Entrar ${I('chevron-right')}</button>
        </form>
        <div class="alert info">${I('shield')}<div>Conexão segura. Seus dados e os dos alunos são protegidos conforme a LGPD.</div></div>
      </div></main></div>`;
    },
    mount: (root, p) => {
      const r = ROLES[p.perfil] || ROLES.responsavel;
      K.qs('#login-form', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        if (!K.validate(f)) return;
        if (K.qs('#senha', f).value.length < 6) { K.qs('#login-alert').hidden = false; K.qs('#senha').closest('.field').classList.add('has-error'); K.qs('#senha').closest('.field').querySelector('.error-msg span').textContent = 'Senha incorreta.'; return; }
        K.toast('Login simulado', 'Entrando com dados fictícios.', 'info');
        K.go(r[5]);
      });
    }
  };

  /* ---------- Recuperação de senha (3 passos, demonstrativa) ---------- */
  K.views.recuperar = {
    title: 'Recuperar senha',
    render: (p, q) => {
      const step = Number(q.passo || 1);
      const st = (n, t) => `<span class="step ${n < step ? 'done' : n === step ? 'current' : ''}"><span class="n">${n < step ? '✓' : n}</span>${t}</span>`;
      const body = step === 1 ? `<form class="stack" id="rec-form" novalidate>${K.field({ id: 'remail', label: 'E-mail cadastrado', type: 'email', required: true, icon: 'mail', placeholder: 'nome@email.com' })}<button class="btn btn-primary btn-lg btn-block" type="submit">${I('send')} Enviar link de redefinição</button></form>`
        : step === 2 ? `<div class="alert success">${I('check')}<div><b>Link enviado (simulação)</b>Se o e-mail estiver cadastrado, você receberá um link válido por 30 minutos. Confira também a caixa de spam.</div></div><a class="btn btn-secondary btn-lg btn-block" href="#/recuperar-senha?passo=3">Já recebi — criar nova senha</a><button class="link-btn" data-action="noop" type="button">Reenviar em 00:45</button>`
          : `<form class="stack" id="nova-form" novalidate>${K.field({ id: 'nsenha', label: 'Nova senha', type: 'password', required: true, icon: 'lock', attrs: 'data-minlen="8"', hint: 'Mínimo de 8 caracteres, com número e símbolo.' })}<div class="strength" aria-hidden="true"><span></span><span></span><span></span><span></span></div>${K.field({ id: 'csenha', label: 'Confirmar nova senha', type: 'password', required: true, icon: 'lock' })}<button class="btn btn-primary btn-lg btn-block" type="submit">${I('check')} Salvar e entrar</button></form>`;
      return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}<main class="auth-form" id="conteudo"><div class="stack-lg">
        <a href="#/entrar" class="row" style="font-weight:700;text-decoration:none;gap:6px">${I('chevron-left', 'icon-sm')} Voltar ao login</a>
        <div class="stepper">${st(1, 'E-mail')}<span class="step-line"></span>${st(2, 'Verificação')}<span class="step-line"></span>${st(3, 'Nova senha')}</div>
        <div class="stack-sm"><h1 id="page-title" tabindex="-1">${step === 1 ? 'Esqueceu a senha?' : step === 2 ? 'Verifique seu e-mail' : 'Crie uma nova senha'}</h1><p class="text-2">${step === 1 ? 'Informe o e-mail cadastrado. Enviaremos um link seguro.' : step === 2 ? 'Enviamos as instruções para o e-mail informado.' : 'Use uma senha que você não utilize em outros serviços.'}</p></div>
        ${body}</div></main></div>`;
    },
    mount: (root) => {
      const f1 = K.qs('#rec-form', root);
      f1 && f1.addEventListener('submit', (e) => { e.preventDefault(); if (K.validate(f1)) K.go('#/recuperar-senha?passo=2'); });
      const f3 = K.qs('#nova-form', root);
      if (f3) {
        const s = K.qs('#nsenha', f3);
        s.addEventListener('input', () => { const v = s.value; const sc = (v.length >= 8) + /\d/.test(v) + /[^\w]/.test(v) + /[A-Z]/.test(v); K.qsa('.strength span', f3).forEach((b, i) => b.classList.toggle('on', i < sc)); });
        f3.addEventListener('submit', (e) => {
          e.preventDefault(); if (!K.validate(f3)) return;
          if (K.qs('#csenha').value !== s.value) { const fl = K.qs('#csenha').closest('.field'); fl.classList.add('has-error'); fl.querySelector('.error-msg span').textContent = 'As senhas não coincidem.'; return; }
          K.toast('Senha alterada (simulação)', 'Agora é só entrar com a nova senha.'); K.go('#/entrar');
        });
      }
    }
  };

  /* ---------- Privacidade (resumo LGPD) e 404 ---------- */
  K.views.privacidade = { title: 'Privacidade', render: () => `<header class="public-header">${logo(true)}<a class="btn btn-light" href="#/entrar" style="margin-left:auto">Entrar</a></header><main id="conteudo" class="section"><div class="card stack" style="max-width:760px;margin:0 auto"><h1 id="page-title" tabindex="-1">Privacidade e proteção de dados</h1><p class="text-2">Resumo demonstrativo. O KFKA coleta apenas dados necessários ao acompanhamento escolar, restringe o acesso por perfil e registra consentimento do responsável. A família visualiza somente relatórios publicados dos alunos vinculados à sua conta. Toda alteração administrativa fica registrada com usuário, data/hora, estado anterior e posterior.</p><a class="btn btn-secondary" href="#/">${I('chevron-left', 'icon-sm')} Voltar</a></div></main>${footer()}` };
  K.views.notFound = {
    title: 'Página não encontrada',
    render: () => `<main id="conteudo" class="section" style="min-height:80vh;display:grid;place-items:center">${K.empty({ icon: 'search', title: '<span id="page-title" tabindex="-1">Não encontramos esta página</span>', text: 'O link pode estar desatualizado ou o relatório foi movido. Use os atalhos abaixo para voltar.', actions: `<a class="btn btn-secondary" href="javascript:history.back()">${I('chevron-left', 'icon-sm')} Voltar</a><a class="btn btn-primary" href="#/">${I('home', 'icon-sm')} Página inicial</a>` })}</main>`
  };
  // Bloco de acesso negado para uso DENTRO da área logada (sem <main> duplicado)
  K.deny = (role) => {
    const txt = role === 'professor' ? 'Este conteúdo pertence a outra turma ou professor. Você só acessa as turmas e disciplinas atribuídas pela coordenação.' : 'Este relatório não está disponível para a sua conta. A família vê apenas relatórios publicados dos alunos vinculados a ela.';
    const home = role === 'professor' ? '#/professor/painel' : '#/familia/painel';
    return `<div style="min-height:60vh;display:grid;place-items:center">${K.empty({ icon: 'lock', title: '<span id="page-title" tabindex="-1">Acesso não permitido</span>', text: txt, actions: `<a class="btn btn-primary" href="${home}">${I('home', 'icon-sm')} Voltar ao início</a>` })}</div>`;
  };
  // Sessão expirada (RNF segurança: sessões com expiração)
  K.views.sessao = {
    title: 'Sessão expirada',
    render: () => `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}<main class="auth-form" id="conteudo"><div class="stack-lg">
      <span class="ico ico-warn" style="width:64px;height:64px;border-radius:18px">${I('clock', 'icon-lg')}</span>
      <div class="stack-sm"><h1 id="page-title" tabindex="-1">Sua sessão expirou</h1><p class="text-2">Por segurança, encerramos o acesso após 30 minutos sem atividade. Nada do que estava salvo foi perdido.</p></div>
      <a class="btn btn-primary btn-lg btn-block" href="#/entrar">Entrar novamente ${I('chevron-right')}</a>
      <div class="alert info">${I('shield')}<div>Em computadores compartilhados, sempre use “Sair” ao terminar.</div></div></div></main></div>`
  };
  K.views.negado = {
    title: 'Acesso negado',
    render: () => `<main id="conteudo" class="section" style="min-height:80vh;display:grid;place-items:center">${K.empty({ icon: 'lock', title: '<span id="page-title" tabindex="-1">Esta área não faz parte do seu perfil</span>', text: 'Você entrou como Responsável. Telas de cadastro e revisão são exclusivas da coordenação. Relatórios de outros alunos ou ainda não publicados não ficam disponíveis para a família.', actions: `<a class="btn btn-secondary" href="#/entrar">${I('swap', 'icon-sm')} Trocar de perfil</a><a class="btn btn-primary" href="#/familia/painel">${I('home', 'icon-sm')} Ir para o meu início</a>` })}</main>`
  };

  K.route('/', K.views.home);
  K.route('/entrar', K.views.entrar);
  K.route('/entrar/:perfil', K.views.login);
  K.route('/recuperar-senha', K.views.recuperar);
  K.route('/privacidade', K.views.privacidade);
  K.route('/acesso-negado', K.views.negado);
  K.route('/sessao-expirada', K.views.sessao);
})(window.KFKA);
