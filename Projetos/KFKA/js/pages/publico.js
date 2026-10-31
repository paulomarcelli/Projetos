/* =========================================================
   KFKA — Páginas públicas: início, login, recuperação, 404
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  const logo = (dark) => `<a class="logo" href="#/" style="color:${dark ? '#fff' : 'var(--ink)'}">${K.mark()}<span><span class="word">KFKA</span><small>Acompanhamento Escolar</small></span></a>`;
  const footer = () => `<footer class="public-footer">${logo(true)}<span>Projeto Interdisciplinar · 2º ADS · FECAP 2026 · protótipo de interface com dados fictícios</span><span class="row" style="flex-wrap:wrap"><a href="#/design">Design system</a><a href="#/marca">Marca</a><a href="#/mapa">Mapa de navegação</a><a href="#/documentacao">Pesquisa e requisitos</a><a href="#/privacidade">Privacidade</a></span></footer>`;
  K.actions['scroll-to'] = (el) => { const t = document.getElementById(el.dataset.target); t && t.scrollIntoView({ behavior: 'smooth' }); };

  /* ---------- Página inicial institucional ----------
     Motion design com função (explicar o produto), não decoração:
     1. Hero: o texto entra em sequência; o mock CONTA o fluxo editorial — cada nota passa
        de Rascunho → Enviado → Em revisão → Publicado, e só então a família recebe o aviso e
        registra ciência. Toca uma vez (~4 s) e fica parado no estado final.
     2. "Como funciona": a linha que liga as etapas se desenha da esquerda para a direita
        quando a seção entra na tela; cada etapa acende na sua vez.
     3. "Três perfis": abas que trocam uma prévia do que cada perfil vê (troca curta, 220 ms).
     4. As demais seções só se revelam ao rolar (opacidade + 12px), uma vez.
     Tudo usa transform/opacity e os tokens de movimento: com "menos movimento", --enter-y e
     --enter-scale zeram, o hero já nasce no estado final e nada se desloca. */
  const reduzir = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('menos-movimento');
  const NOTAS = [['Matemática', '8,5'], ['Língua Portuguesa', '8,0'], ['Ciências', '9,0']];
  const FLUXO = ['rascunho', 'enviado', 'revisao', 'publicado'];
  const mockApp = (inicial) => `
    <div class="mock" aria-hidden="true">
      <div class="mock-bar"><i></i><i></i><i></i><span>kfka.app/familia</span></div>
      <div class="mock-body">
        <div class="mock-side"><b>KFKA</b><span class="on">Início</span><span>Relatórios</span><span>Histórico</span></div>
        <div class="mock-main">
          <b class="mock-title">Relatórios de Lucas</b>
          ${NOTAS.map(([d, m], i) => `<div class="mock-row" data-linha="${i}"><span>${d}</span><span class="mono">${m}</span><span class="mock-st">${K.status(inicial)}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
  // Timers da história do hero: limpos a cada nova montagem (navegar e voltar reinicia sem sobrepor).
  let timers = [];
  const depois = (ms, fn) => timers.push(setTimeout(fn, ms));
  function contarHistoria(root) {
    timers.forEach(clearTimeout); timers = [];
    const arte = K.qs('.hero-art', root);
    if (!arte) return;
    if (reduzir()) { arte.classList.add('historia-fim'); return; }
    const linhas = K.qsa('.mock-row', arte);
    // Cada linha avança pelo fluxo; as linhas começam com 350 ms de defasagem entre si.
    linhas.forEach((ln, i) => FLUXO.slice(1).forEach((st, k) => depois(900 + i * 350 + k * 520, () => {
      if (!ln.isConnected) return;
      const cel = K.qs('.mock-st', ln);
      cel.innerHTML = K.status(st);
      cel.classList.remove('troca'); void cel.offsetWidth; cel.classList.add('troca');
      if (st === 'publicado') ln.classList.add('publicada');
    })));
    const fimDasNotas = 900 + (linhas.length - 1) * 350 + 2 * 520;
    depois(900 + 2 * 520 + 200, () => K.qs('.fc-1', arte)?.classList.add('is-on'));
    depois(fimDasNotas + 350, () => { K.qs('.fc-2', arte)?.classList.add('is-on'); K.qs('.phone', arte)?.classList.add('tem-novo'); });
    depois(fimDasNotas + 1300, () => arte.classList.add('historia-fim'));
  }

  // Prévias da seção de perfis: o que cada perfil vê, em miniatura (sem dados reais).
  const PERFIS = [
    { id: 'coordenacao', ic: 'shield', cor: 'var(--sun)', titulo: 'Coordenação', sub: 'Revisa e publica', href: '#/admin/painel',
      itens: ['Cadastros e vínculos de turma', 'Períodos dos quatro bimestres', 'Revisão, publicação e devolução', 'Relatórios e auditoria'],
      previa: () => `<div class="pv-head"><b>Fila de revisão</b>${K.status('revisao')}</div>${[['Lucas Souza', 'Ciências · 6º A'], ['Júlia Souza', 'Matemática · 4º B'], ['Rafael Lima', 'Geografia · 6º A']].map(([n, d], i) => `<div class="pv-row">${K.avatar(n, ['#5FD4A8', '#F8B4C8', '#74C0FC'][i], 'sm')}<span class="grow"><b>${n}</b><small>${d}</small></span><span class="pv-btn">Publicar</span></div>`).join('')}` },
    { id: 'professor', ic: 'book', cor: 'var(--sky)', titulo: 'Professor', sub: 'Registra o bimestre', href: '#/professor/painel',
      itens: ['Turmas e alunos atribuídos', 'Média, descrição e tags', 'Rascunho, prévia e envio', 'Ajustes após devolução'],
      previa: () => `<div class="pv-head"><b>Lucas · Ciências</b>${K.status('rascunho')}</div><div class="pv-media"><small>Média</small><b class="mono">9,0</b></div><div class="pv-tags"><span class="tag t-verde">Participativo</span><span class="tag t-azul">Colabora em grupo</span><span class="tag t-amarelo">Curioso</span></div><p class="pv-texto">Participou com curiosidade do projeto sobre o ciclo da água…</p><span class="pv-btn pv-btn-azul">Enviar para revisão</span>` },
    { id: 'familia', ic: 'family', cor: 'var(--mint)', titulo: 'Família', sub: 'Acompanha e responde', href: '#/familia/selecionar',
      itens: ['Somente alunos vinculados', 'Só relatórios já publicados', 'Filtro por bimestre e disciplina', 'Ciência, observação e PDF'],
      previa: () => `<div class="pv-head"><b>Ciências · 3º bimestre</b>${K.status('publicado')}</div><div class="pv-media"><small>Média</small><b class="mono">9,0</b></div><p class="pv-texto">Participou com curiosidade do projeto sobre o ciclo da água e ajudou os colegas a registrar as medições.</p><span class="pv-btn pv-btn-verde">${I('check', 'icon-sm')} Li e estou ciente</span>` },
  ];
  const painelPerfil = (p) => `<div class="perfil-painel" role="tabpanel" id="painel-perfil" aria-labelledby="aba-${p.id}">
      <div class="perfil-texto"><ul class="checklist">${p.itens.map((x) => `<li>${I('check', 'icon-sm')}${x}</li>`).join('')}</ul><a class="btn btn-secondary" href="${p.href}">Ver a demonstração ${I('chevron-right', 'icon-sm')}</a></div>
      <div class="perfil-previa" aria-hidden="true">${p.previa()}</div></div>`;
  K.actions['perfil-aba'] = (el) => {
    const p = PERFIS.find((x) => x.id === el.dataset.perfil);
    K.qsa('[data-action="perfil-aba"]').forEach((b) => { const on = b === el; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    const alvo = K.qs('#painel-perfil');
    if (alvo) alvo.outerHTML = painelPerfil(p);
  };

  K.views.home = {
    title: 'Início',
    render: () => {
      const inicial = reduzir() ? 'publicado' : 'rascunho';
      return `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header class="public-header">${logo(true)}
        <nav aria-label="Seções da página"><a href="#/" data-action="scroll-to" data-target="como-funciona">Como funciona</a><a href="#/" data-action="scroll-to" data-target="perfis">Perfis</a><a href="#/" data-action="scroll-to" data-target="seguranca">Segurança</a></nav>
        ${K.temaToggle()}<a class="btn btn-ghost-light hide-mobile" href="#/criar-conta">Criar conta</a><a class="btn btn-light" href="#/entrar">${I('user')} Entrar</a>
      </header>
      <main id="conteudo">
        <section class="hero">
          <!-- Os caminhos do símbolo K desenhados no fundo: céu (professor), menta (família) e o
               sol (publicação) que surge quando os dois caminhos terminam de se encontrar. -->
          <svg class="hero-arcos" viewBox="0 0 600 600" fill="none" stroke-linecap="round" aria-hidden="true"><path pathLength="1" d="M244 300C320 300 368 214 470 112" stroke="#74C0FC" stroke-width="56"/><path pathLength="1" d="M244 300C320 300 368 386 470 488" stroke="#5FD4A8" stroke-width="56"/><circle cx="242" cy="300" r="48" fill="#FFC94A"/></svg>
          <div class="hero-copy">
            <h1 id="page-title" tabindex="-1" class="entra" style="--i:0">A escola e a família acompanhando o aluno juntas.</h1>
            <p class="entra" style="--i:1">A cada bimestre do Ensino Fundamental, o professor registra o desenvolvimento de cada aluno, a coordenação revisa e publica, e a família acompanha tudo em um só lugar.</p>
            <div class="row entra" style="--i:2"><a class="btn btn-primary btn-lg" href="#/entrar">Acessar minha conta ${I('chevron-right')}</a><a class="btn btn-ghost-light btn-lg" href="#/" data-action="scroll-to" data-target="como-funciona">Ver como funciona</a></div>
            <ul class="hero-points entra" style="--i:3"><li>${I('message')} Comunicação escola–família</li><li>${I('clock')} Quatro bimestres organizados</li><li>${I('shield')} Dados protegidos (LGPD)</li></ul>
          </div>
          <div class="hero-art entra" style="--i:2">${mockApp(inicial)}
            <div class="phone" aria-hidden="true"><div class="phone-notch"></div><div class="phone-screen">
              <div class="ph-head">${K.avatar('Lucas Souza', '#5FD4A8', 'sm')}<div><b>Lucas · 6º A</b><small>3º bimestre</small></div></div>
              <div class="ph-new"><small>Novo relatório</small><b>Ciências</b><span class="nota ok sm">9,0</span></div>
              <div class="ph-bubble">Participou com curiosidade do projeto sobre o ciclo da água…</div>
              <span class="ph-btn">${I('check', 'icon-sm')} Li e estou ciente</span>
              <div class="ph-tabs"><i class="on"></i><i></i><i></i><i></i></div></div></div>
            <div class="float-card fc-1" aria-hidden="true">${K.avatar('Lucas Souza', '#5FD4A8', 'sm')}<div><small>Média · Matemática</small><b class="mono">8,5</b></div><span class="tag t-verde">+0,5</span></div>
            <div class="float-card fc-2" aria-hidden="true"><span class="ico ico-teal" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${I('bell', 'icon-sm')}</span><div><b>Novo relatório publicado</b><small>Ciências · agora</small></div></div>
          </div>
        </section>

        <section class="section" id="como-funciona" data-revelar>
          <div class="section-head revela"><h2>Um fluxo claro, do registro à família</h2><p>Cada relatório passa por etapas visíveis para todos. Ninguém fica sem saber em que ponto ele está.</p></div>
          <ol class="steps-grid">
            ${[['calendar', 'ico-blue', 'A escola abre o bimestre', 'A coordenação organiza turmas e vínculos e define o período de digitação.', 'rascunho'], ['edit', 'ico-teal', 'O professor registra', 'Descrição, média e tags de cada aluno, salvas como rascunho e enviadas para revisão.', 'enviado'], ['review', 'ico-warn', 'A coordenação revisa', 'Ajusta com histórico, devolve com comentários ou publica.', 'revisao'], ['file', 'ico-ok', 'A família acompanha', 'Consulta o relatório publicado, marca como lido e imprime.', 'publicado']].map(([ic, tone, t, d, s], i) => `
              <li style="--i:${i}"><span class="flow-dot ${tone}" aria-hidden="true">${I(ic, 'icon-sm')}</span><span class="sr-only">Etapa ${i + 1}: </span><h3>${t}</h3><p class="text-2">${d}</p>${K.status(s)}</li>`).join('')}
          </ol>
        </section>

        <section class="section section-paper" id="perfis" data-revelar>
          <div class="section-head revela"><h2>Três perfis, um só produto</h2><p>Cada pessoa vê exatamente o que precisa, e nada além disso.</p></div>
          <div class="perfis revela">
            <div class="perfis-abas" role="tablist" aria-label="Perfis" aria-orientation="vertical">
              ${PERFIS.map((p, i) => `<button type="button" role="tab" id="aba-${p.id}" aria-controls="painel-perfil" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-action="perfil-aba" data-perfil="${p.id}"><span class="role-ico sm" style="background:${p.cor}">${I(p.ic)}</span><span><b>${p.titulo}</b><small>${p.sub}</small></span></button>`).join('')}
            </div>
            ${painelPerfil(PERFIS[0])}
          </div>
        </section>

        <section class="section" id="seguranca" data-revelar>
          <div class="card card-dark security revela">
            <div class="grow stack-sm"><h2><span class="sec-lock" aria-hidden="true">${I('lock')}</span>Segurança e LGPD desde o primeiro clique</h2><p style="color:rgba(255,255,255,.75)">Proteção especial aos dados de crianças e adolescentes. A família só vê relatórios publicados dos alunos vinculados a ela.</p></div>
            <ul class="checklist sec-list">${['Acesso separado por perfil', 'Sessões que expiram sozinhas', 'Toda alteração fica na auditoria'].map((x, i) => `<li style="--i:${i}">${I('check', 'icon-sm')}${x}</li>`).join('')}</ul>
          </div>
        </section>
        <section class="section" style="padding-top:0" data-revelar><div class="cta-final revela"><h2>Pronto para acompanhar de perto?</h2><p>Entre com a sua conta ou crie a de coordenação, professor ou responsável.</p><div class="row cta-acoes"><a class="btn btn-light btn-lg" href="#/entrar">Acessar minha conta ${I('chevron-right')}</a><a class="btn btn-ghost-light btn-lg" href="#/criar-conta">Criar conta</a></div></div></section>
      </main>${footer()}`;
    },
    mount: (root) => {
      contarHistoria(root);
      K.revelar(root);
      // Inclinação leve do mock seguindo o ponteiro (só mouse/trackpad, só transform, máx. ±4°).
      // Dá profundidade ao produto sem animar nada sozinho; desligada com "menos movimento".
      const arte = K.qs('.hero-art', root);
      if (arte && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduzir()) {
        let raf = 0;
        arte.addEventListener('pointermove', (e) => {
          const r = arte.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => { arte.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`); arte.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`); });
        });
        arte.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); arte.style.setProperty('--rx', '0deg'); arte.style.setProperty('--ry', '0deg'); });
      }
      // Abas dos perfis: setas movem e ativam (padrão WAI-ARIA).
      const abas = K.qs('.perfis-abas', root);
      abas && abas.addEventListener('keydown', (e) => {
        const bs = K.qsa('[role="tab"]', abas); const i = bs.indexOf(document.activeElement);
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (i < 0 || !d) return; e.preventDefault();
        const alvo = bs[(i + d + bs.length) % bs.length]; alvo.focus(); K.actions['perfil-aba'](alvo);
      });
    }
  };

  /* ---------- Login: primeiro o perfil (padrão inspirado no Seesaw), depois credenciais ---------- */
  const authArt = () => `
    <div class="auth-art">${logo(true)}
      <h2 style="color:#fff;font-size:clamp(2rem,3.4vw,3rem);line-height:1.08">A escola e a família<br>na mesma página.</h2>
      <p style="color:rgba(255,255,255,.75);max-width:44ch">Relatórios bimestrais revisados pela escola, publicados com segurança e acessíveis de qualquer tela.</p>
      <div class="auth-card">${K.avatar('Lucas Souza', '#5FD4A8')}<div class="grow"><b>Lucas Souza · 6º A</b><small>Matemática · 3º bimestre</small></div>${K.status('publicado')}</div>
      <ul class="checklist auth-list">${['A coordenação revisa antes de publicar', 'A família registra ciência e pode responder', 'Só os responsáveis vinculados veem o aluno'].map((x) => `<li>${I('check', 'icon-sm')}${x}</li>`).join('')}</ul>
      <span class="auth-blob"></span></div>`;
  // Os três perfis do KFKA. "nome" entra nas frases ("conta de professor"); "destino" é a tela inicial.
  const ROLES = {
    administrador: { ic: 'shield', cor: 'var(--sun)', cor_hex: '#FFC94A', titulo: 'Sou da coordenação', sub: 'Administro a escola', nome: 'coordenação', pill: 'Coordenação', destino: '#/admin/painel' },
    professor: { ic: 'book', cor: 'var(--sky)', cor_hex: '#74C0FC', titulo: 'Sou professor', sub: 'Registro o acompanhamento das turmas', nome: 'professor', pill: 'Professor', destino: '#/professor/painel' },
    responsavel: { ic: 'family', cor: 'var(--mint)', cor_hex: '#5FD4A8', titulo: 'Sou responsável', sub: 'Acompanho meus filhos', nome: 'responsável', pill: 'Responsável', destino: '#/familia/selecionar' },
  };
  const papel = (k) => ROLES[k] || ROLES.responsavel;
  const pilula = (r) => `<span class="role-pill-light"><span class="role-ico xs" style="background:${r.cor}">${I(r.ic, 'icon-sm')}</span>${r.pill}</span>`;
  const escolhaDePerfil = (base) => `<div class="stack-sm">${Object.entries(ROLES).map(([k, r]) => `<a class="role-option" href="#/${base}/${k}"><span class="role-ico sm" style="background:${r.cor}">${I(r.ic)}</span><span class="grow"><b>${r.titulo}</b><small>${r.sub}</small></span>${I('chevron-right')}</a>`).join('')}</div>`;
  const telaAuth = (corpo) => `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}<main class="auth-form" id="conteudo">${K.temaToggle()}<div class="stack-lg">${corpo}</div></main></div>`;

  K.views.entrar = {
    title: 'Entrar',
    render: () => telaAuth(`
        <div class="stack-sm"><span class="only-mobile">${logo(false)}</span><h1 id="page-title" tabindex="-1">Como você acessa o KFKA?</h1><p class="text-2">Escolha seu perfil para continuar. Se você tiver mais de um perfil, pode trocar depois de entrar.</p></div>
        ${escolhaDePerfil('entrar')}
        <p class="auth-rodape">Ainda não tem conta? <a href="#/criar-conta">Criar conta</a><span aria-hidden="true">·</span><a href="#/">Voltar ao início</a></p>`)
  };

  // Tentativas de senha por e-mail (só nesta aba): na terceira, o acesso fica bloqueado por 15 min.
  const tentativas = {};
  K.views.login = {
    title: 'Entrar',
    render: (p, q) => {
      const r = papel(p.perfil);
      return telaAuth(`
        <a href="#/entrar" class="voltar">${I('chevron-left', 'icon-sm')} Trocar perfil</a>
        <div class="stack-sm">${pilula(r)}<h1 id="page-title" tabindex="-1">Bem-vindo de volta</h1><p class="text-2">Entre com o e-mail da sua conta.</p></div>
        <div class="alert danger" id="login-alert" role="alert" hidden></div>
        <form class="stack" id="login-form" novalidate>
          ${K.field({ id: 'email', label: 'E-mail', type: 'email', value: q.email || '', required: true, icon: 'mail', placeholder: 'nome@email.com', attrs: 'autocomplete="email" autocapitalize="off" spellcheck="false"' })}
          ${K.field({ id: 'senha', label: 'Senha', type: 'password', required: true, icon: 'lock', attrs: 'autocomplete="current-password"' })}
          <div class="row-between"><label class="check"><input type="checkbox" checked> Lembrar de mim</label><a href="#/recuperar-senha" style="font-weight:700">Esqueci minha senha</a></div>
          <button class="btn btn-primary btn-lg btn-block" type="submit">Entrar ${I('chevron-right')}</button>
        </form>
        <p class="auth-rodape">Ainda não tem conta? <a href="#/criar-conta/${p.perfil in ROLES ? p.perfil : 'responsavel'}">Criar conta de ${r.nome}</a></p>
        <div class="alert info">${I('shield')}<div>Conexão segura. Seus dados e os dos alunos são protegidos conforme a LGPD.</div></div>`);
    },
    mount: (root, p, q) => {
      const perfil = p.perfil in ROLES ? p.perfil : 'responsavel';
      const f = K.qs('#login-form', root);
      const alerta = K.qs('#login-alert', root);
      const avisar = (titulo, texto) => { alerta.innerHTML = `${I('alert')}<div><b>${titulo}</b>${texto}</div>`; alerta.hidden = false; };
      (q.email ? K.qs('#senha', f) : K.qs('#email', f)).focus();
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        alerta.hidden = true;
        if (!K.validate(f)) return;
        const email = K.qs('#email', f).value.trim(), senha = K.qs('#senha', f).value;
        if ((tentativas[email] || 0) >= 3) return avisar('Acesso bloqueado por 15 minutos', 'Foram 3 tentativas com a senha errada. Use “Esqueci minha senha” para criar uma nova.');
        const res = K.api.entrar(perfil, email, senha);
        if (res.erro === 'sem-conta') return avisar('Não encontramos uma conta com este e-mail', `Confira o endereço ou <a href="#/criar-conta/${perfil}">crie sua conta de ${ROLES[perfil].nome}</a>.`);
        if (res.erro === 'outro-perfil') return avisar(`Este e-mail é de uma conta de ${ROLES[res.perfil].nome}`, `<a href="#/entrar/${res.perfil}?email=${encodeURIComponent(email)}">Entrar como ${ROLES[res.perfil].nome}</a>`);
        if (res.erro === 'senha') {
          tentativas[email] = (tentativas[email] || 0) + 1;
          const resta = 3 - tentativas[email];
          const campo = K.qs('#senha', f);
          campo.closest('.field').classList.add('has-error'); campo.setAttribute('aria-invalid', 'true');
          campo.closest('.field').querySelector('.error-msg span').textContent = resta ? `Senha incorreta. ${resta === 1 ? 'Resta 1 tentativa' : `Restam ${resta} tentativas`} antes do bloqueio de 15 minutos.` : 'Senha incorreta. O acesso foi bloqueado por 15 minutos.';
          campo.select(); return;
        }
        delete tentativas[email];
        K.sessao = res.conta;
        K.toast(`Olá, ${K.esc(res.conta.nome.trim().split(/\s+/)[0])}!`, `Você entrou como ${ROLES[perfil].nome}.`, 'ok', false);
        K.go(ROLES[perfil].destino);
      });
    }
  };

  /* ---------- Criar conta: primeiro o perfil, depois um formulário de uma coluna ----------
     Campos de cada perfil, rótulos sempre visíveis, validação ao sair do campo (e de novo enquanto
     o erro é corrigido), senha com mostrar/ocultar e medidor de força. Sem confirmar senha: o
     botão de mostrar resolve o erro de digitação com um campo a menos. */
  K.views.criarConta = {
    title: 'Criar conta',
    render: () => telaAuth(`
        <div class="stack-sm"><span class="only-mobile">${logo(false)}</span><h1 id="page-title" tabindex="-1">Para quem é a conta?</h1><p class="text-2">O KFKA tem três perfis. Cada um vê só o que precisa.</p></div>
        ${escolhaDePerfil('criar-conta')}
        <p class="auth-rodape">Já tem conta? <a href="#/entrar">Entrar</a><span aria-hidden="true">·</span><a href="#/">Voltar ao início</a></p>`)
  };
  const CONVITE = { pattern: '^[A-Z0-9]{4}-?[A-Z0-9]{4}$', msg: 'O código tem 8 letras ou números, como AURO-7K2P.' };
  const campoConvite = (txt) => K.field({ id: 'convite', label: 'Código de convite', required: true, icon: 'link', placeholder: 'AURO-7K2P', hint: txt, attrs: `autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" data-pattern="${CONVITE.pattern}" data-msg-pattern="${CONVITE.msg}"` });
  const CADASTRO = {
    administrador: {
      intro: 'Para coordenadores e diretores. Você cria o espaço da escola e depois cadastra turmas, professores e responsáveis.',
      campos: () => `${K.field({ id: 'escola', label: 'Nome da escola', required: true, icon: 'cap', placeholder: 'Ex.: Escola Municipal Aurora', attrs: 'autocomplete="organization" data-minlen="3"' })}
        ${K.field({ id: 'cargo', label: 'Seu cargo', required: true, options: [['', 'Selecione'], 'Coordenação pedagógica', 'Direção', 'Secretaria escolar'] })}`,
      sub: (f) => K.qs('#cargo', f).value,
      pronto: (f) => `O espaço da <b>${K.esc(K.qs('#escola', f).value.trim())}</b> está criado e você é a pessoa administradora. O próximo passo é abrir o bimestre e cadastrar as turmas.`,
    },
    professor: {
      intro: 'Use o código de convite que a coordenação da sua escola enviou por e-mail.',
      campos: () => `${campoConvite('Ele liga a sua conta à escola. Não recebeu? Fale com a coordenação.')}
        ${K.field({ id: 'disciplina', label: 'Disciplina principal', required: true, options: [['', 'Selecione'], ...K.data.disciplinas.map((d) => [d.id, d.nome])] })}`,
      sub: (f) => K.qs('#disciplina', f).selectedOptions[0].textContent,
      pronto: () => 'A coordenação vai confirmar as suas turmas e disciplinas. Até lá, você já pode entrar e conhecer o painel.',
    },
    responsavel: {
      intro: 'Use o código de convite que a escola enviou no comunicado do aluno.',
      campos: () => `${campoConvite('Está no comunicado da escola. Um código por aluno.')}
        <fieldset class="field"><legend>Parentesco<span class="req" aria-hidden="true">*</span></legend>
          <div class="opcoes">${['Mãe', 'Pai', 'Avó ou avô', 'Outro responsável'].map((o, i) => `<label class="opcao"><input type="radio" name="parentesco" value="${o}" required ${i === 0 ? 'data-validate data-msg-req="Escolha o parentesco."' : ''}><span>${o}</span></label>`).join('')}</div>
          <span class="error-msg" role="alert">${I('alert', 'icon-sm')}<span></span></span></fieldset>`,
      sub: (f) => `Responsável · ${(K.qsa('[name="parentesco"]', f).find((r) => r.checked) || {}).value || ''}`,
      pronto: () => 'A escola vai confirmar o vínculo com o aluno do código informado. Você recebe um e-mail quando o primeiro relatório for publicado.',
    },
  };
  const caixa = (id, texto, attrs = '') => `<div class="field"><label class="check check-longo"><input type="checkbox" id="${id}" required data-validate ${attrs}><span>${texto}</span></label><span class="error-msg" role="alert">${I('alert', 'icon-sm')}<span></span></span></div>`;
  K.views.cadastro = {
    title: 'Criar conta',
    render: (p) => {
      const perfil = p.perfil in ROLES ? p.perfil : 'responsavel', r = ROLES[perfil], c = CADASTRO[perfil];
      return telaAuth(`
        <a href="#/criar-conta" class="voltar">${I('chevron-left', 'icon-sm')} Trocar perfil</a>
        <div class="stack-sm">${pilula(r)}<h1 id="page-title" tabindex="-1">Criar conta de ${r.nome}</h1><p class="text-2">${c.intro}</p></div>
        <form class="stack cadastro" id="cadastro-form" novalidate>
          <h2 class="form-secao">Seus dados</h2>
          ${K.field({ id: 'nome', label: 'Nome completo', required: true, icon: 'user', attrs: 'autocomplete="name" data-minlen="3"' })}
          ${K.field({ id: 'cemail', label: 'E-mail', type: 'email', required: true, icon: 'mail', placeholder: 'nome@email.com', attrs: 'autocomplete="email" autocapitalize="off" spellcheck="false"' })}
          <h2 class="form-secao">${perfil === 'administrador' ? 'A escola' : 'Vínculo com a escola'}</h2>
          ${c.campos()}
          <h2 class="form-secao">Senha</h2>
          ${K.field({ id: 'csenha', label: 'Crie uma senha', type: 'password', required: true, icon: 'lock', hint: 'Pelo menos 8 caracteres. Misture letras, números e um símbolo.', attrs: 'autocomplete="new-password" data-minlen="8" aria-describedby="csenha-hint forca-txt"' })}
          <div class="forca"><div class="strength" aria-hidden="true"><span></span><span></span><span></span><span></span></div><span id="forca-txt" class="forca-txt" aria-live="polite"></span></div>
          ${caixa('termos', 'Li e aceito os <a href="#/privacidade">termos de uso e a política de privacidade</a>.', 'data-msg-req="Aceite os termos para criar a conta."')}
          ${perfil === 'responsavel' ? caixa('lgpd', 'Autorizo a escola a tratar os dados de acompanhamento dos alunos vinculados a mim, conforme a LGPD.', 'data-msg-req="Sem esta autorização a família não consegue ver os relatórios."') : ''}
          <button class="btn btn-primary btn-lg btn-block" type="submit">Criar conta ${I('chevron-right')}</button>
        </form>
        <p class="auth-rodape">Já tem conta? <a href="#/entrar/${perfil}">Entrar</a></p>`);
    },
    mount: (root, p) => {
      const perfil = p.perfil in ROLES ? p.perfil : 'responsavel', r = ROLES[perfil], c = CADASTRO[perfil];
      const f = K.qs('#cadastro-form', root);
      // Valida ao sair de um campo já mexido; enquanto há erro, revalida a cada mudança (o erro some ao corrigir).
      f.addEventListener('input', (e) => { const el = e.target; el.dataset.mexeu = '1'; if (el.closest('.has-error')) K.checar(el.name === 'parentesco' ? K.qs('[name="parentesco"][data-validate]', f) : el); });
      f.addEventListener('change', (e) => { if (e.target.type === 'radio' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') K.checar(e.target.type === 'radio' ? K.qs('[name="parentesco"][data-validate]', f) : e.target); });
      f.addEventListener('focusout', (e) => { const el = e.target; if (el.matches('[data-validate]') && el.dataset.mexeu && el.type !== 'radio' && el.type !== 'checkbox') K.checar(el); });
      // Código de convite em maiúsculas, com o hífen no lugar
      const conv = K.qs('#convite', f);
      conv && conv.addEventListener('input', () => { const v = conv.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); conv.value = v.length > 4 ? `${v.slice(0, 4)}-${v.slice(4)}` : v; });
      const s = K.qs('#csenha', f), txt = K.qs('#forca-txt', f);
      s.addEventListener('input', () => {
        const v = s.value, n = v ? (v.length >= 8) + /\d/.test(v) + /[^\w\s]/.test(v) + (/[A-Z]/.test(v) && /[a-z]/.test(v)) : 0;
        K.qsa('.strength span', f).forEach((b, i) => b.classList.toggle('on', i < n));
        f.querySelector('.strength').dataset.nivel = n;
        txt.textContent = v ? ['Senha muito fraca', 'Senha fraca', 'Senha média', 'Senha boa', 'Senha forte'][n] : '';
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!K.validate(f)) return;
        const email = K.qs('#cemail', f).value.trim();
        const res = K.api.criarConta({ perfil, nome: K.qs('#nome', f).value.trim().replace(/\s+/g, ' '), email, sub: c.sub(f), cor: r.cor_hex, senha: s.value });
        if (res.erro) {
          const campo = K.qs('#cemail', f);
          campo.closest('.field').classList.add('has-error'); campo.setAttribute('aria-invalid', 'true');
          campo.closest('.field').querySelector('.error-msg span').textContent = 'Já existe uma conta com este e-mail. Use “Entrar” ou outro endereço.';
          campo.focus(); return;
        }
        // Sucesso no lugar do formulário: o momento final do cadastro merece um pouco de celebração.
        const main = K.qs('.auth-form .stack-lg', root);
        main.innerHTML = `<div class="sucesso stack-lg">
          <span class="sucesso-ico" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16" pathLength="1"/></svg></span>
          <div class="stack-sm">${pilula(r)}<h1 id="page-title" tabindex="-1">Conta criada</h1><p class="text-2">${c.pronto(f)}</p></div>
          <a class="btn btn-primary btn-lg btn-block" href="#/entrar/${perfil}?email=${encodeURIComponent(email)}">Entrar agora ${I('chevron-right')}</a>
          <p class="text-2" style="font-size:14px;margin:0">Enviamos uma confirmação para <b>${K.esc(email)}</b>.</p></div>`;
        K.qs('#page-title', main).focus();
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
      return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}<main class="auth-form" id="conteudo">${K.temaToggle()}<div class="stack-lg">
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
  K.views.privacidade = { title: 'Privacidade', render: () => `<header class="public-header">${logo(true)}<span class="grow"></span>${K.temaToggle()}<a class="btn btn-light" href="#/entrar">Entrar</a></header><main id="conteudo" class="section"><div class="card stack" style="max-width:760px;margin:0 auto"><h1 id="page-title" tabindex="-1">Privacidade e proteção de dados</h1><p class="text-2">Resumo demonstrativo. O KFKA coleta apenas dados necessários ao acompanhamento escolar, restringe o acesso por perfil e registra consentimento do responsável. A família visualiza somente relatórios publicados dos alunos vinculados à sua conta. Toda alteração administrativa fica registrada com usuário, data/hora, estado anterior e posterior.</p><a class="btn btn-secondary" href="#/">${I('chevron-left', 'icon-sm')} Voltar</a></div></main>${footer()}` };
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
    render: () => `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="auth">${authArt()}<main class="auth-form" id="conteudo">${K.temaToggle()}<div class="stack-lg">
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
  K.route('/criar-conta', K.views.criarConta);
  K.route('/criar-conta/:perfil', K.views.cadastro);
  K.route('/recuperar-senha', K.views.recuperar);
  K.route('/privacidade', K.views.privacidade);
  K.route('/acesso-negado', K.views.negado);
  K.route('/sessao-expirada', K.views.sessao);
})(window.KFKA);
