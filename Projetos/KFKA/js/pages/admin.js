/* =========================================================
   KFKA — Área do Administrador (coordenação)
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon, A = K.api, D = K.data;
  const S = (role, active, html) => K.shell('admin', active, html);
  const optTurmas = (all = true) => [...(all ? [['', 'Todas as turmas']] : [['', 'Selecione a turma']]), ...D.turmas.map((t) => [t.id, t.nome])];
  const optDisc = (all = true) => [...(all ? [['', 'Todas as disciplinas']] : [['', 'Selecione a disciplina']]), ...D.disciplinas.map((d) => [d.id, d.nome])];
  const optProf = (all = true) => [...(all ? [['', 'Todos os professores']] : [['', 'Selecione o professor']]), ...D.professores.filter((p) => p.ativo).map((p) => [p.id, p.nome])];
  const optBim = (all = true) => [...(all ? [['', 'Todos os bimestres']] : []), ...D.bimestres.map((b) => [b.n, b.n + 'º bimestre'])];
  const relLabel = (r) => `${A.aluno(r.aluno).nome} · ${A.disc(r.disc).nome} · ${A.turma(r.turma).nome}`;

  /* ======================= PAINEL ======================= */
  const painel = {
    title: 'Painel da coordenação',
    render: () => {
      const b3 = A.relsFiltrados({ bim: 3 });
      const cnt = (s) => b3.filter((r) => r.status === s).length;
      const fila = A.relsFiltrados({ status: ['enviado', 'revisao'] });
      const esperado = 128;
      const kpi = (ic, tone, val, lbl, delta, dc, href) => `<a class="card tight card-link kpi" href="${href}"><div class="kpi-top"><span class="ico ${tone}">${I(ic, 'icon-sm')}</span><span class="lbl">${lbl}</span></div><div class="val">${val}</div><span class="delta" style="color:${dc}">${delta}</span></a>`;
      const st = ['rascunho', 'enviado', 'revisao', 'publicado', 'devolvido'];
      const colors = { rascunho: 'var(--st-rascunho)', enviado: 'var(--teal)', revisao: 'var(--sun)', publicado: 'var(--success)', devolvido: 'var(--danger)' };
      const tot = st.reduce((s, k) => s + cnt(k), 0) || 1;
      const turmasProg = D.turmas.map((t) => { const rs = b3.filter((r) => r.turma === t.id); const p = rs.length ? Math.round(rs.filter((r) => r.status === 'publicado').length / rs.length * 100) : 0; return [t.nome, p, t.id]; });
      return S('admin', 'painel', `
        ${K.pageHead({ crumbs: [{ label: 'Coordenação' }], title: 'Olá, Marina', lead: 'Acompanhe o 3º bimestre em todas as turmas e revise o que os professores enviaram.', actions: `<a class="btn btn-secondary" href="#/admin/relatorios">${I('chart')} Relatórios</a><a class="btn btn-primary" href="#/admin/revisao">${I('review')} Revisar agora (${fila.length})</a>` })}
        <section class="grid-4" aria-label="Indicadores do 3º bimestre">
          ${kpi('review', 'ico-warn', fila.length, 'Aguardando revisão', 'ver fila', 'var(--warning)', '#/admin/revisao')}
          ${kpi('check-circle', 'ico-ok', cnt('publicado'), 'Publicados no 3º bimestre', 'para as famílias', 'var(--success)', '#/admin/relatorios?status=publicado')}
          ${kpi('undo', 'ico-bad', cnt('devolvido'), 'Devolvidos para ajustes', 'com os professores', 'var(--danger)', '#/admin/revisao?status=devolvido')}
          ${kpi('pencil', 'ico-blue', esperado - b3.length + cnt('rascunho'), 'Ainda não enviados', `de ${esperado} esperados`, 'var(--text-muted)', '#/admin/relatorios?bim=3')}
        </section>
        <section class="card card-dark period-banner" aria-label="Período atual">
          <span class="ico" style="background:rgba(255,255,255,.1);width:52px;height:52px;border-radius:14px;display:grid;place-items:center;color:var(--sky)">${I('calendar')}</span>
          <div class="grow"><div class="row"><h2 style="font-size:20px">3º bimestre · digitação aberta</h2><span class="tag" style="background:var(--mint);color:var(--ink)">ABERTO</span></div><p style="color:rgba(255,255,255,.75);font-size:14px">De 01/08 às 08:00 até 30/09 às 23:59 · restam 2 dias</p></div>
          <div style="min-width:220px" class="stack-sm"><small style="color:rgba(255,255,255,.75);font-weight:700">70% do período</small><div class="progress on-dark"><span style="width:70%"></span></div></div>
          <a class="btn btn-light" href="#/admin/periodos">${I('calendar')} Configurar períodos</a>
        </section>
        <div class="grid-main-side">
          <section class="card">
            <div class="card-head"><div><h2>Fila de revisão</h2><p>Registros enviados pelos professores aguardando você</p></div><a class="btn btn-ghost btn-sm" href="#/admin/revisao">Ver todos ${I('chevron-right', 'icon-sm')}</a></div>
            <div class="table-wrap"><table class="table"><thead><tr><th>Aluno</th><th>Disciplina</th><th>Professor</th><th>Status</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody>
              ${fila.slice(0, 6).map((r) => { const a = A.aluno(r.aluno); return `<tr><td class="cell-main"><div class="cell-person">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b><small>${A.turma(r.turma).nome} · ${r.bim}º bim</small></span></div></td><td data-label="Disciplina">${A.disc(r.disc).nome}</td><td data-label="Professor">${A.prof(r.prof).nome}</td><td data-label="Status">${K.status(r.status, true)}</td><td class="actions"><a class="btn btn-secondary btn-sm" href="#/admin/revisao/${r.id}">Revisar</a></td></tr>`; }).join('')}
            </tbody></table></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2>Status do 3º bimestre</h2><p>${tot} registros no fluxo</p></div></div>
            <div class="stacked" role="img" aria-label="Distribuição por status: ${st.map((k) => `${K.STATUS[k].label} ${cnt(k)}`).join(', ')}">${st.map((k) => `<span style="width:${cnt(k) / tot * 100}%;background:${colors[k]}"></span>`).join('')}</div>
            <ul class="stack-sm" style="list-style:none">${st.map((k) => `<li class="row-between">${K.status(k, true)}<b class="mono">${cnt(k)}</b></li>`).join('')}</ul>
          </section>
        </div>
        <div class="grid-2">
          <section class="card"><div class="card-head"><div><h2>Publicação por turma</h2><p>Percentual de registros publicados no 3º bimestre</p></div></div>
            ${turmasProg.map(([n, p, id]) => `<div class="bar-row"><a href="#/admin/turmas/${id}">${n}</a><div class="progress"><span style="width:${p}%;background:${p >= 60 ? 'var(--success)' : p >= 30 ? 'var(--teal)' : 'var(--sun)'}"></span></div><span class="v">${p}%</span></div>`).join('')}
          </section>
          <section class="card"><div class="card-head"><div><h2>Atividade recente</h2><p>Registrada na auditoria</p></div><a class="btn btn-ghost btn-sm" href="#/admin/auditoria">Auditoria ${I('chevron-right', 'icon-sm')}</a></div>
            <div class="timeline">${D.auditoria.slice(0, 4).map((x) => `<div class="tl-item"><span class="tl-dot ico-teal">${I('clock', 'icon-sm')}</span><div><b>${x.acao}</b><small>${x.registro} · ${x.quem} · ${x.quando}</small></div></div>`).join('')}</div>
          </section>
        </div>`);
    }
  };

  /* ======================= ALUNOS ======================= */
  const cadTabs = (active) => `<nav class="tabs" aria-label="Cadastros">${[['alunos', 'Alunos', D.alunos.length], ['professores', 'Professores', D.professores.length], ['responsaveis', 'Responsáveis', D.responsaveis.length]].map(([k, l, n]) => `<a href="#/admin/${k}" ${k === active ? 'aria-current="page"' : ''}>${l}<span class="n">${n}</span></a>`).join('')}</nav>`;
  const alunos = {
    title: 'Alunos',
    render: (p, q) => S('admin', 'alunos', `
      ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Alunos' }], title: 'Alunos', lead: 'Cadastre, edite, ative ou inative alunos e mantenha os vínculos com responsáveis.', actions: `<button class="btn btn-secondary" data-action="importar">${I('upload')} Importar planilha</button><a class="btn btn-primary" href="#/admin/alunos/novo">${I('plus')} Novo aluno</a>` })}
      <section class="card">
        ${cadTabs('alunos')}
        <div class="toolbar" role="search">
          <div class="search"><label class="sr-only" for="f-q">Buscar alunos</label>${I('search')}<input id="f-q" class="input" type="search" placeholder="Buscar por nome ou RA" value="${K.esc(q.q || '')}"></div>
          <label class="sr-only" for="f-turma">Turma</label><select id="f-turma" class="select" style="width:auto">${optTurmas().map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
          <label class="sr-only" for="f-sit">Situação</label><select id="f-sit" class="select" style="width:auto"><option value="">Todas as situações</option><option value="1">Ativos</option><option value="0">Inativos</option></select>
        </div>
        <div class="table-wrap"><table class="table" id="t-alunos"><thead><tr><th>Aluno</th><th>Turma</th><th>Responsáveis</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody></tbody></table></div>
        <div id="alunos-empty" hidden>${K.empty({ icon: 'search', title: 'Nenhum aluno encontrado', text: 'Revise o termo de busca ou limpe os filtros para ver todos os alunos.', actions: '<button class="btn btn-secondary" data-action="limpar-filtros">Limpar filtros</button>' })}</div>
        ${K.pagination(1, D.alunos.length, 486)}
      </section>`),
    mount: (root) => {
      const tb = K.qs('#t-alunos tbody', root);
      const draw = () => {
        const q = K.qs('#f-q').value.toLowerCase(), t = K.qs('#f-turma').value, s = K.qs('#f-sit').value;
        const list = D.alunos.filter((a) => (!q || a.nome.toLowerCase().includes(q) || a.ra.includes(q)) && (!t || a.turma === t) && (s === '' || String(Number(a.ativo)) === s));
        tb.innerHTML = list.map((a) => { const rs = A.respDoAluno(a.id); return `<tr><td class="cell-main"><div class="cell-person">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b><small class="mono">RA ${a.ra}</small></span></div></td><td data-label="Turma"><a href="#/admin/turmas/${a.turma}">${A.turma(a.turma).nome}</a></td>
          <td data-label="Responsáveis">${rs.length ? `<span class="avatar-stack" title="${rs.map((r) => r.nome).join(', ')}">${rs.map((r) => K.avatar(r.nome, '#C9E7F5', 'sm')).join('')}</span><span class="sr-only">${rs.map((r) => r.nome).join(', ')}</span>` : '<span class="status nao-lido">Sem responsável</span>'}</td>
          <td data-label="Situação"><label class="switch"><input type="checkbox" ${a.ativo ? 'checked' : ''} data-toggle-aluno="${a.id}"><span class="track"></span><span>${a.ativo ? 'Ativo' : 'Inativo'}</span></label></td>
          <td class="actions"><a class="btn btn-ghost btn-sm" href="#/admin/alunos/${a.id}/editar">${I('edit', 'icon-sm')} Editar</a></td></tr>`; }).join('');
        K.qs('#alunos-empty').hidden = list.length > 0;
        K.qs('#t-alunos').closest('.table-wrap').hidden = list.length === 0;
      };
      ['#f-q', '#f-turma', '#f-sit'].forEach((s) => K.qs(s).addEventListener('input', draw));
      tb.addEventListener('change', (e) => { const id = e.target.dataset.toggleAluno; if (!id) return; const a = A.aluno(id); a.ativo = e.target.checked; e.target.parentElement.querySelector('span:last-child').textContent = a.ativo ? 'Ativo' : 'Inativo'; K.toast(`${a.nome} ${a.ativo ? 'ativado' : 'inativado'}`, 'Alteração registrada na auditoria.'); });
      K.actions['limpar-filtros'] = () => { K.qs('#f-q').value = ''; K.qs('#f-turma').value = ''; K.qs('#f-sit').value = ''; draw(); };
      draw();
    }
  };
  K.actions.importar = () => K.modal(`${K.modalHead('upload', 'ico-ok', 'Importar alunos por planilha', 'Use o modelo .xlsx ou .csv. Interface demonstrativa — nenhum arquivo é processado.')}
    <div class="dropzone">${I('upload', 'icon-lg')}<b>Arraste o arquivo aqui ou clique para escolher</b><small>.xlsx ou .csv · até 5 MB</small></div>
    <div class="alert neutral">${I('sheet')}<div><b>alunos_6ano_2026.xlsx · 486 linhas</b>482 válidas · 4 com erro (turma inexistente ou RA duplicado)</div></div>
    <div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="importar-ok">${I('upload')} Importar 482 registros</button></div>`);
  K.actions['importar-ok'] = () => { K.closeModal(); K.toast('Importação simulada concluída', '482 registros seriam criados; 4 linhas com erro ignoradas.'); };

  const alunoForm = {
    title: (p) => (p.id ? 'Editar aluno' : 'Novo aluno'),
    render: (p) => {
      const a = p.id ? A.aluno(p.id) : { nome: '', ra: '2026-0' + (400 + D.alunos.length), turma: '', nasc: '', ativo: true };
      const rs = p.id ? A.respDoAluno(a.id) : [];
      return S('admin', 'alunos', `
        ${K.pageHead({ crumbs: [{ label: 'Alunos', href: '#/admin/alunos' }, { label: p.id ? a.nome : 'Novo aluno' }], title: p.id ? 'Editar aluno' : 'Novo aluno', lead: 'Campos com * são obrigatórios.' })}
        <form class="card stack-lg" id="aluno-form" novalidate style="max-width:880px">
          <section class="form-section"><header><h3>Dados pessoais</h3><p>Informações básicas de identificação.</p></header>
            <div class="form-grid">${K.field({ id: 'nome', label: 'Nome completo', value: a.nome, required: true, span: 'span-2', attrs: 'autocomplete="off"' })}${K.field({ id: 'nasc', label: 'Data de nascimento', value: a.nasc, required: true, placeholder: 'dd/mm/aaaa', icon: 'calendar' })}${K.field({ id: 'ra', label: 'RA (registro do aluno)', value: a.ra, hint: 'Gerado automaticamente.', attrs: 'readonly' })}</div></section>
          <section class="form-section"><header><h3>Matrícula</h3><p>Turma do ano letivo de 2026.</p></header>
            <div class="form-grid">${K.field({ id: 'turma', label: 'Turma', value: a.turma, required: true, options: optTurmas(false) })}<div class="field"><span class="field-label">Situação</span><label class="switch"><input type="checkbox" ${a.ativo ? 'checked' : ''}><span class="track"></span><span>Aluno ativo</span></label></div></div></section>
          <section class="form-section"><header><h3>Responsáveis autorizados</h3><p>Somente responsáveis vinculados poderão ver os relatórios publicados deste aluno.</p></header>
            <div class="tag-group" id="resp-list">${rs.map((r) => `<span class="pill-person">${K.avatar(r.nome, '#C9E7F5', 'sm')}${r.nome} · ${r.parentesco}<button type="button" aria-label="Remover vínculo com ${r.nome}" data-action="rm-chip">${I('x', 'icon-sm')}</button></span>`).join('') || '<span class="muted" id="no-resp">Nenhum responsável vinculado ainda.</span>'}</div>
            <div class="row"><label class="sr-only" for="add-resp">Adicionar responsável</label><select id="add-resp" class="select" style="max-width:340px"><option value="">Selecione um responsável cadastrado</option>${D.responsaveis.map((r) => `<option value="${r.id}">${r.nome} (${r.email})</option>`).join('')}</select><button type="button" class="btn btn-secondary" data-action="add-resp">${I('plus')} Vincular</button><a class="btn btn-ghost" href="#/admin/responsaveis/novo">Cadastrar novo responsável</a></div></section>
          <section class="form-section"><header><h3>Privacidade (LGPD)</h3></header><label class="check"><input type="checkbox" ${p.id ? 'checked' : ''}> Termo de consentimento assinado pelo responsável</label></section>
          <div class="form-actions">${p.id ? `<button type="button" class="btn btn-danger spacer" data-action="inativar-aluno">${I('power')} Inativar aluno</button>` : ''}<a class="btn btn-secondary" href="#/admin/alunos">Cancelar</a><button type="submit" class="btn btn-primary">${I('check')} Salvar aluno</button></div>
        </form>`);
    },
    mount: (root, p) => {
      K.actions['add-resp'] = () => { const s = K.qs('#add-resp'); if (!s.value) { K.toast('Selecione um responsável', 'Escolha na lista antes de vincular.', 'warn', false); return; } const r = A.resp(s.value); const nr = K.qs('#no-resp'); nr && nr.remove(); K.qs('#resp-list').insertAdjacentHTML('beforeend', `<span class="pill-person">${K.avatar(r.nome, '#C9E7F5', 'sm')}${r.nome} · ${r.parentesco}<button type="button" aria-label="Remover vínculo" data-action="rm-chip">${I('x', 'icon-sm')}</button></span>`); s.value = ''; };
      K.actions['rm-chip'] = (el) => el.closest('.pill-person').remove();
      K.actions['inativar-aluno'] = () => K.modal(`${K.modalHead('power', 'ico-bad', 'Inativar aluno?', 'O aluno deixa de aparecer nas listas do professor. Relatórios já publicados continuam disponíveis no histórico.')}<div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-danger" data-action="inativar-ok">Inativar</button></div>`);
      K.actions['inativar-ok'] = () => { K.closeModal(); K.toast('Aluno inativado (simulação)'); K.go('#/admin/alunos'); };
      K.qs('#aluno-form', root).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) { K.toast('Revise os campos destacados', 'Há informações obrigatórias faltando.', 'err', false); return; } K.toast(p.id ? 'Alterações salvas (simulação)' : 'Aluno cadastrado (simulação)', 'Os dados existem apenas nesta sessão do navegador.'); K.go('#/admin/alunos'); });
    }
  };

  /* ======================= PROFESSORES ======================= */
  const professores = {
    title: 'Professores',
    render: () => S('admin', 'professores', `
      ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Professores' }], title: 'Professores', lead: 'Cadastre professores e veja em quais turmas e disciplinas cada um está vinculado.', actions: `<a class="btn btn-primary" href="#/admin/professores/novo">${I('plus')} Novo professor</a>` })}
      <section class="card">${cadTabs('professores')}
        <div class="table-wrap"><table class="table"><thead><tr><th>Professor</th><th>Disciplinas</th><th>Turmas</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>
        ${D.professores.map((p) => { const v = A.vinculosDoProf(p.id); const ts = [...new Set(v.map((x) => A.turma(x.turma).nome))]; return `<tr><td class="cell-main"><div class="cell-person">${K.avatar(p.nome, p.cor, 'sm')}<span><b>${p.nome}</b><small>${p.email}</small></span></div></td><td data-label="Disciplinas"><span class="tag-group">${p.disc.map((d) => `<span class="tag t-neutro">${A.disc(d).nome}</span>`).join('')}</span></td><td data-label="Turmas">${ts.join(', ') || '<span class="muted">Sem vínculo</span>'}</td><td data-label="Situação">${p.ativo ? '<span class="status publicado">' + I('check') + 'Ativo</span>' : '<span class="status cancelado">' + I('ban') + 'Inativo</span>'}</td><td class="actions"><a class="btn btn-ghost btn-sm" href="#/admin/professores/${p.id}/editar">${I('edit', 'icon-sm')} Editar</a></td></tr>`; }).join('')}
        </tbody></table></div>${K.pagination(1, D.professores.length, D.professores.length)}</section>`)
  };
  const profForm = {
    title: (p) => (p.id ? 'Editar professor' : 'Novo professor'),
    render: (p) => {
      const pr = p.id ? A.prof(p.id) : { nome: '', email: '', tel: '', disc: [], ativo: true };
      const v = p.id ? A.vinculosDoProf(pr.id) : [];
      return S('admin', 'professores', `
        ${K.pageHead({ crumbs: [{ label: 'Professores', href: '#/admin/professores' }, { label: p.id ? pr.nome : 'Novo professor' }], title: p.id ? 'Editar professor' : 'Novo professor' })}
        <div class="grid-main-side">
        <form class="card stack-lg" id="prof-form" novalidate>
          <section class="form-section"><header><h3>Identificação</h3></header><div class="form-grid">${K.field({ id: 'pnome', label: 'Nome completo', value: pr.nome, required: true, span: 'span-2' })}${K.field({ id: 'pemail', label: 'E-mail institucional', type: 'email', value: pr.email, required: true, icon: 'mail', hint: 'Usado para login e recuperação de senha.' })}${K.field({ id: 'ptel', label: 'Telefone', value: pr.tel, placeholder: '(11) 90000-0000' })}</div></section>
          <section class="form-section"><header><h3>Disciplinas que leciona</h3><p>Selecione uma ou mais.</p></header><fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Disciplinas</legend><div class="tag-picker">${D.disciplinas.map((d) => `<label class="tag-option"><input type="checkbox" ${pr.disc.includes(d.id) ? 'checked' : ''}><span>${d.nome}</span></label>`).join('')}</div></fieldset></section>
          <section class="form-section"><header><h3>Acesso</h3></header><label class="switch"><input type="checkbox" ${pr.ativo ? 'checked' : ''}><span class="track"></span><span>Professor ativo</span></label>${!p.id ? '<div class="alert info">' + I('mail') + '<div>Ao salvar, um convite de primeiro acesso seria enviado ao e-mail informado (simulação).</div></div>' : ''}</section>
          <div class="form-actions"><a class="btn btn-secondary" href="#/admin/professores">Cancelar</a><button class="btn btn-primary" type="submit">${I('check')} Salvar professor</button></div>
        </form>
        <aside class="card"><h2 style="font-size:18px">Vínculos atuais</h2>${v.length ? `<ul class="stack-sm" style="list-style:none">${v.map((x) => `<li class="row-between"><span><b>${A.turma(x.turma).nome}</b> · ${A.disc(x.disc).nome}</span><a href="#/admin/turmas/${x.turma}" class="btn btn-ghost btn-sm">Ver</a></li>`).join('')}</ul>` : '<p class="muted">Sem vínculos. Use a tela de vínculos para associar turmas e disciplinas.</p>'}<a class="btn btn-secondary" href="#/admin/vinculos">${I('link')} Gerenciar vínculos</a></aside></div>`);
    },
    mount: (root, p) => K.qs('#prof-form', root).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) return; K.toast('Professor salvo (simulação)'); K.go('#/admin/professores'); })
  };

  /* ======================= RESPONSÁVEIS ======================= */
  const responsaveis = {
    title: 'Responsáveis',
    render: () => S('admin', 'responsaveis', `
      ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Responsáveis' }], title: 'Responsáveis e vínculos familiares', lead: 'Um responsável pode estar vinculado a mais de um aluno, e um aluno pode ter mais de um responsável.', actions: `<a class="btn btn-primary" href="#/admin/responsaveis/novo">${I('plus')} Novo responsável</a>` })}
      <section class="card">${cadTabs('responsaveis')}
        <div class="table-wrap"><table class="table"><thead><tr><th>Responsável</th><th>Alunos vinculados</th><th>Parentesco</th><th>Consentimento LGPD</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>
        ${D.responsaveis.map((r) => `<tr><td class="cell-main"><div class="cell-person">${K.avatar(r.nome, '#C9E7F5', 'sm')}<span><b>${r.nome}</b><small>${r.email}</small></span></div></td><td data-label="Alunos"><span class="tag-group">${r.alunos.map((id) => { const a = A.aluno(id); return `<span class="tag t-azul">${a.nome} · ${A.turma(a.turma).nome}</span>`; }).join('')}</span></td><td data-label="Parentesco">${r.parentesco}</td><td data-label="LGPD">${r.consentimento !== '—' ? `<span class="status publicado">${I('check')}Registrado ${r.consentimento}</span>` : `<span class="status nao-lido">${I('alert')}Pendente</span>`}</td><td class="actions"><a class="btn btn-ghost btn-sm" href="#/admin/responsaveis/${r.id}/editar">${I('edit', 'icon-sm')} Editar</a></td></tr>`).join('')}
        </tbody></table></div></section>`)
  };
  const respForm = {
    title: 'Responsável',
    render: (p) => {
      const r = p.id ? A.resp(p.id) : { nome: '', email: '', tel: '', alunos: [], parentesco: '' };
      return S('admin', 'responsaveis', `
        ${K.pageHead({ crumbs: [{ label: 'Responsáveis', href: '#/admin/responsaveis' }, { label: p.id ? r.nome : 'Novo responsável' }], title: p.id ? 'Editar responsável' : 'Novo responsável' })}
        <form class="card stack-lg" id="resp-form" novalidate style="max-width:880px">
          <section class="form-section"><header><h3>Contato</h3></header><div class="form-grid">${K.field({ id: 'rnome', label: 'Nome completo', value: r.nome, required: true, span: 'span-2' })}${K.field({ id: 'remail2', label: 'E-mail', type: 'email', value: r.email, required: true, icon: 'mail' })}${K.field({ id: 'rtel', label: 'Telefone', value: r.tel })}</div></section>
          <section class="form-section"><header><h3>Alunos vinculados</h3><p>Marque os alunos que este responsável pode acompanhar e informe o parentesco.</p></header>
            <div class="vinc-list">${D.alunos.slice(0, 10).map((a) => `<label class="vinc-item"><input type="checkbox" ${r.alunos.includes(a.id) ? 'checked' : ''}>${K.avatar(a.nome, a.cor, 'sm')}<span class="grow"><b>${a.nome}</b><small>${A.turma(a.turma).nome} · RA ${a.ra}</small></span></label>`).join('')}</div>
            <div class="form-grid">${K.field({ id: 'rpar', label: 'Parentesco', value: r.parentesco, required: true, options: [['', 'Selecione'], 'Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Responsável legal'] })}</div></section>
          <div class="form-actions"><a class="btn btn-secondary" href="#/admin/responsaveis">Cancelar</a><button class="btn btn-primary" type="submit">${I('check')} Salvar responsável</button></div></form>`);
    },
    mount: (root) => K.qs('#resp-form', root).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) return; K.toast('Responsável salvo (simulação)', 'Vínculos atualizados nesta sessão.'); K.go('#/admin/responsaveis'); })
  };

  /* ======================= TURMAS ======================= */
  const turmas = {
    title: 'Turmas',
    render: () => S('admin', 'turmas', `
      ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Turmas' }], title: 'Turmas', lead: 'Ano letivo 2026 · Ensino Fundamental II.', actions: `<button class="btn btn-primary" data-action="nova-turma">${I('plus')} Nova turma</button>` })}
      <div class="grid-3">${D.turmas.map((t) => { const n = A.alunosDaTurma(t.id).length; const v = D.vinculos.filter((x) => x.turma === t.id); return `<a class="card card-link tight" href="#/admin/turmas/${t.id}"><div class="row"><span class="turma-badge">${t.nome.trim().split(/\s+/)[0]}</span><div class="grow"><h3>Turma ${t.nome}</h3><small class="muted">${t.ano} · ${t.turno} · ${t.sala}</small></div>${I('chevron-right')}</div><div class="row" style="gap:18px"><span><b class="mono">${n}</b> <small class="muted">alunos</small></span><span><b class="mono">${v.length}</b> <small class="muted">disciplinas</small></span></div></a>`; }).join('')}</div>`)
  };
  K.actions['nova-turma'] = () => K.modal(`${K.modalHead('users', 'ico-blue', 'Nova turma', 'Ano letivo 2026')}<form class="stack" id="nt" novalidate><div class="form-grid">${K.field({ id: 'tn', label: 'Nome da turma', required: true, placeholder: 'Ex.: 6º C' })}${K.field({ id: 'tt', label: 'Turno', required: true, options: [['', 'Selecione'], 'Manhã', 'Tarde'] })}${K.field({ id: 'ta', label: 'Ano/série', required: true, options: [['', 'Selecione'], '6º ano', '7º ano', '8º ano', '9º ano'] })}${K.field({ id: 'ts', label: 'Sala', placeholder: 'Ex.: Sala 16' })}</div><div class="modal-foot"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Criar turma</button></div></form>`,
    { onOpen: (ov) => K.qs('#nt', ov).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) return; K.closeModal(); K.toast('Turma criada (simulação)'); }) });
  const turmaDet = {
    title: (p) => 'Turma ' + (A.turma(p.id) || {}).nome,
    render: (p) => {
      const t = A.turma(p.id); if (!t) return K.views.notFound.render();
      const al = A.alunosDaTurma(t.id); const v = D.vinculos.filter((x) => x.turma === t.id);
      return S('admin', 'turmas', `
        ${K.pageHead({ crumbs: [{ label: 'Turmas', href: '#/admin/turmas' }, { label: 'Turma ' + t.nome }], title: 'Turma ' + t.nome, lead: `${t.ano} · ${t.turno} · ${t.sala} · ${al.length} alunos`, actions: `<a class="btn btn-secondary" href="#/admin/vinculos?turma=${t.id}">${I('link')} Editar vínculos</a><a class="btn btn-primary" href="#/admin/relatorios?turma=${t.id}">${I('chart')} Relatórios da turma</a>` })}
        <div class="grid-main-side">
          <section class="card"><div class="card-head"><h2>Professor × disciplina</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>Disciplina</th><th>Professor</th><th>Registros no 3º bim</th></tr></thead><tbody>
            ${v.map((x) => { const pr = A.prof(x.prof); const rs = A.relsFiltrados({ turma: t.id, disc: x.disc, bim: 3 }); const pub = rs.filter((r) => r.status === 'publicado').length; return `<tr><td class="cell-main"><b>${A.disc(x.disc).nome}</b></td><td data-label="Professor"><div class="cell-person">${K.avatar(pr.nome, pr.cor, 'sm')}${pr.nome}</div></td><td data-label="Registros"><span class="mono">${rs.length}/${al.length}</span> <small class="muted">· ${pub} publicados</small></td></tr>`; }).join('')}
          </tbody></table></div></section>
          <section class="card"><div class="card-head"><h2>Alunos</h2><a class="btn btn-ghost btn-sm" href="#/admin/alunos/novo">${I('plus', 'icon-sm')} Adicionar</a></div><ul class="stack-sm" style="list-style:none">${al.map((a) => `<li class="row">${K.avatar(a.nome, a.cor, 'sm')}<a class="grow" href="#/admin/alunos/${a.id}/editar">${a.nome}</a>${a.ativo ? '' : '<span class="status cancelado">Inativo</span>'}</li>`).join('')}</ul></section>
        </div>`);
    }
  };

  /* ======================= DISCIPLINAS E TAGS ======================= */
  const disciplinas = {
    title: 'Disciplinas e tags',
    render: (p, q) => {
      const aba = q.aba === 'tags' ? 'tags' : 'disc';
      const tagUses = (id) => D.relatorios.filter((r) => r.tags.includes(id)).length;
      return S('admin', 'disciplinas', `
        ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Disciplinas e tags' }], title: 'Disciplinas e tags', lead: 'Disciplinas são classificadas por área. Tags classificam os acompanhamentos e alimentam os relatórios — não são diagnósticos.', actions: aba === 'disc' ? `<button class="btn btn-secondary" data-action="nova-area">${I('layers')} Nova área</button><button class="btn btn-primary" data-action="nova-disc">${I('plus')} Nova disciplina</button>` : `<button class="btn btn-primary" data-action="nova-tag">${I('plus')} Nova tag</button>` })}
        <nav class="tabs" aria-label="Seções"><a href="#/admin/disciplinas" ${aba === 'disc' ? 'aria-current="page"' : ''}>Áreas e disciplinas<span class="n">${D.disciplinas.length}</span></a><a href="#/admin/disciplinas?aba=tags" ${aba === 'tags' ? 'aria-current="page"' : ''}>Tags de acompanhamento<span class="n">${D.tags.length}</span></a></nav>
        ${aba === 'disc' ? `<div class="grid-2">${D.areas.map((ar) => `<section class="card tight"><div class="row"><span class="area-dot" style="background:${ar.cor}"></span><h2 style="font-size:18px">${ar.nome}</h2></div><ul class="stack-sm" style="list-style:none">${D.disciplinas.filter((d) => d.area === ar.id).map((d) => `<li class="row-between list-line"><span><b>${d.nome}</b> <span class="mono muted" style="font-size:12px">${d.id}</span></span><label class="switch"><input type="checkbox" ${d.ativa ? 'checked' : ''}><span class="track"></span><span class="sr-only">Disciplina ativa</span></label></li>`).join('')}</ul></section>`).join('')}</div>`
          : `<section class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Tag</th><th>Tipo</th><th>Usos</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>${D.tags.map((t) => `<tr><td class="cell-main">${K.tag(t.id)}</td><td data-label="Tipo">${t.tipo}</td><td data-label="Usos" class="mono">${tagUses(t.id)}</td><td class="actions"><button class="btn btn-ghost btn-sm" data-action="nova-tag">${I('edit', 'icon-sm')} Editar</button></td></tr>`).join('')}</tbody></table></div>
            <div class="alert info">${I('info')}<div>Use nomes que descrevem o que foi observado em sala (ex.: “Participação ativa”). Evite rótulos que pareçam diagnóstico ou que exponham o aluno.</div></div></section>`}`);
    }
  };
  K.actions['nova-disc'] = () => K.modal(`${K.modalHead('book', 'ico-blue', 'Nova disciplina', '')}<form class="stack" id="nd" novalidate>${K.field({ id: 'dn', label: 'Nome da disciplina', required: true })}${K.field({ id: 'da', label: 'Área', required: true, options: [['', 'Selecione'], ...D.areas.map((a) => [a.id, a.nome])] })}<div class="modal-foot"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Salvar</button></div></form>`, { onOpen: (ov) => K.qs('#nd', ov).addEventListener('submit', (e) => { e.preventDefault(); if (K.validate(e.target)) { K.closeModal(); K.toast('Disciplina criada (simulação)'); } }) });
  K.actions['nova-area'] = () => K.modal(`${K.modalHead('layers', 'ico-blue', 'Nova área de disciplina', 'Áreas agrupam as disciplinas nos relatórios (ex.: Linguagens).')}<form class="stack" id="nar" novalidate>${K.field({ id: 'arn', label: 'Nome da área', required: true, placeholder: 'Ex.: Ensino Religioso' })}<div class="field"><span class="field-label" id="arc-l">Cor de identificação</span><div class="row" role="radiogroup" aria-labelledby="arc-l">${['#E0186F', '#2A5CFF', '#26593F', '#8A5A12', '#0B7285'].map((c, i) => `<label class="color-opt"><input type="radio" name="arc" value="${c}" ${i === 4 ? 'checked' : ''}><span style="background:${c}"></span><span class="sr-only">Cor ${c}</span></label>`).join('')}</div></div><div class="modal-foot"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary">${I('save')} Salvar área</button></div></form>`, { onOpen: (ov) => K.qs('#nar', ov).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) return; K.closeModal(); K.toast('Área criada (simulação)', 'Aparece na lista após recarregar a demonstração.'); }) });
  K.actions['nova-tag'] = () => K.modal(`${K.modalHead('tag', 'ico-teal', 'Tag de acompanhamento', 'Classificação do registro, visível ao professor, à coordenação e à família.')}<form class="stack" id="ntg" novalidate>${K.field({ id: 'tgn', label: 'Nome da tag', required: true, placeholder: 'Ex.: Trabalho em grupo' })}${K.field({ id: 'tgt', label: 'Tipo', required: true, options: [['', 'Selecione'], 'Participação', 'Desempenho', 'Habilidade', 'Hábito de estudo', 'Atenção pedagógica', 'Frequência'] })}<fieldset style="border:0;padding:0;margin:0"><legend class="field-label">Tom visual</legend><div class="segmented" role="group">${['Teal', 'Azul', 'Verde', 'Alerta', 'Neutro'].map((t, i) => `<button type="button" aria-pressed="${i === 0}" data-action="seg">${t}</button>`).join('')}</div></fieldset><div class="modal-foot"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Salvar tag</button></div></form>`, { onOpen: (ov) => K.qs('#ntg', ov).addEventListener('submit', (e) => { e.preventDefault(); if (K.validate(e.target)) { K.closeModal(); K.toast('Tag salva (simulação)'); } }) });
  K.actions.seg = (el) => { K.qsa('button', el.parentElement).forEach((b) => b.setAttribute('aria-pressed', String(b === el))); };

  /* ======================= VÍNCULOS ======================= */
  const vinculos = {
    title: 'Vínculos',
    render: (p, q) => {
      const t = q.turma || '6A'; const v = D.vinculos.filter((x) => x.turma === t);
      return S('admin', 'vinculos', `
        ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Vínculos' }], title: 'Professor × turma × disciplina', lead: 'Cada disciplina da turma deve ter exatamente um professor responsável. O sistema impede vínculos duplicados ou incompatíveis.' })}
        <div class="segmented" role="group" aria-label="Turma">${D.turmas.map((x) => `<a href="#/admin/vinculos?turma=${x.id}" ${x.id === t ? 'aria-current="page"' : ''}>${x.nome}</a>`).join('')}</div>
        <section class="card"><div class="card-head"><div><h2>Turma ${A.turma(t).nome}</h2><p>${v.length} disciplinas vinculadas · ${A.alunosDaTurma(t).length} alunos</p></div></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Disciplina</th><th>Área</th><th>Professor responsável</th><th>Situação</th></tr></thead><tbody>
          ${v.map((x) => `<tr><td class="cell-main"><b>${A.disc(x.disc).nome}</b></td><td data-label="Área">${A.area(A.disc(x.disc).area).nome}</td><td data-label="Professor"><label class="sr-only" for="vp-${x.disc}">Professor de ${A.disc(x.disc).nome}</label><select id="vp-${x.disc}" class="select" style="min-width:200px">${optProf(false).map(([id, n]) => `<option value="${id}" ${id === x.prof ? 'selected' : ''}>${n}</option>`).join('')}</select></td><td data-label="Situação"><span class="status publicado">${I('check')}Vinculado</span></td></tr>`).join('')}
          </tbody></table></div>
          <form class="add-vinc" id="vinc-form" novalidate><b>Adicionar vínculo</b><div class="filters-panel">${K.field({ id: 'vd', label: 'Disciplina', required: true, options: optDisc(false) })}${K.field({ id: 'vprof', label: 'Professor', required: true, options: optProf(false) })}<button class="btn btn-primary" type="submit">${I('link')} Vincular</button></div><div id="vinc-alert"></div></form>
        </section>`);
    },
    mount: (root, p, q) => {
      const t = q.turma || '6A';
      K.qs('#vinc-form', root).addEventListener('submit', (e) => {
        e.preventDefault(); if (!K.validate(e.target)) return;
        const d = K.qs('#vd').value;
        const dup = D.vinculos.find((x) => x.turma === t && x.disc === d);
        const pr = A.prof(K.qs('#vprof').value);
        // Incompatível: professor não habilitado para a disciplina
        if (!dup && !pr.disc.includes(d)) { K.qs('#vinc-alert').innerHTML = `<div class="alert danger" role="alert">${I('ban')}<div><b>Vínculo incompatível</b>${pr.nome} não está habilitado(a) para ${A.disc(d).nome}. Disciplinas do professor: ${pr.disc.map((x) => A.disc(x).nome).join(', ')}.</div></div>`; return; }
        K.qs('#vinc-alert').innerHTML = dup ? `<div class="alert danger" role="alert">${I('alert')}<div><b>Vínculo duplicado</b>A turma ${A.turma(t).nome} já possui ${A.prof(dup.prof).nome} em ${A.disc(d).nome}. Altere o professor na tabela acima em vez de criar outro vínculo.</div></div>` : `<div class="alert success">${I('check')}<div><b>Vínculo criado (simulação)</b>${A.disc(d).nome} agora aparece para o professor selecionado.</div></div>`;
      });
      K.qsa('select[id^="vp-"]', root).forEach((s) => s.addEventListener('change', () => K.toast('Professor alterado (simulação)', 'Registrado na auditoria.')));
    }
  };

  /* ======================= PERÍODOS ======================= */
  const periodos = {
    title: 'Períodos letivos',
    render: () => S('admin', 'periodos', `
      ${K.pageHead({ crumbs: [{ label: 'Estrutura escolar' }, { label: 'Períodos letivos' }], title: 'Períodos letivos e bimestres', lead: 'Defina quando os professores podem registrar e editar acompanhamentos em cada um dos quatro bimestres.', actions: `<button class="btn btn-primary" data-action="salvar-periodos">${I('save')} Salvar alterações</button>` })}
      <section class="card"><div class="row-between"><h2>Ano letivo 2026</h2><div class="legend"><span><i style="background:var(--st-rascunho)"></i>Encerrado</span><span><i style="background:var(--teal)"></i>Aberto</span><span><i style="background:var(--sky)"></i>Agendado</span></div></div>
        <div class="year-line" aria-hidden="true"><span style="flex:3;background:var(--st-rascunho)"></span><span style="flex:2.3;background:var(--st-rascunho)"></span><span style="flex:.7;background:var(--line)"></span><span style="flex:2;background:var(--teal)"></span><span style="flex:2.3;background:var(--sky)"></span></div>
        <div class="months" aria-hidden="true">${['FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map((m) => `<span>${m}</span>`).join('')}</div></section>
      <div class="grid-2">${D.bimestres.map((b) => {
        const open = b.status === 'aberto'; const [di, hi] = b.ini.split(' '); const [df, hf] = b.fim.split(' ');
        const rs = A.relsFiltrados({ bim: b.n }); const enviados = rs.filter((r) => r.status !== 'rascunho').length;
        const badge = open ? `<span class="status publicado">${I('check')}Digitação aberta</span>` : b.status === 'encerrado' ? `<span class="status cancelado">${I('lock')}Encerrado</span>` : `<span class="status enviado">${I('clock')}Agendado</span>`;
        return `<section class="card ${open ? 'period-open' : ''}"><div class="row-between"><div><h2>${b.n}º bimestre</h2><small class="muted">${open ? 'Professores podem registrar e editar' : b.status === 'encerrado' ? 'Somente leitura para professores' : 'Abre automaticamente na data definida'}</small></div>${badge}</div>
          <div class="form-grid"><div class="field"><label for="i${b.n}">Abertura</label><div class="row" style="flex-wrap:nowrap"><input id="i${b.n}" class="input mono" value="${di}" aria-label="Data de abertura do ${b.n}º bimestre"><input class="input mono" style="width:100px" value="${hi}" aria-label="Hora de abertura"></div></div><div class="field"><label for="f${b.n}">Encerramento</label><div class="row" style="flex-wrap:nowrap"><input id="f${b.n}" class="input mono" value="${df}" aria-label="Data de encerramento do ${b.n}º bimestre"><input class="input mono" style="width:100px" value="${hf}" aria-label="Hora de encerramento"></div></div></div>
          <div class="stack-sm"><div class="row-between"><small class="muted" style="font-weight:700">Registros enviados</small><b class="mono">${enviados}</b></div><div class="progress"><span style="width:${Math.min(100, enviados / 1.28)}%"></span></div></div>
          ${b.status === 'encerrado' ? `<button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-action="reabrir">${I('undo', 'icon-sm')} Reabrir temporariamente</button>` : ''}</section>`;
      }).join('')}</div>
      <div class="alert warning">${I('alert')}<div><b>Fora do período, o registro fica bloqueado</b>Professores só registram ou editam acompanhamentos das turmas vinculadas e dentro da janela de digitação. Toda alteração de datas fica registrada na auditoria.</div></div>`)
  };
  K.actions['salvar-periodos'] = () => {
    const toDate = (v) => { const [d, m, y] = v.split('/').map(Number); return new Date(y, m - 1, d); };
    const ruim = D.bimestres.find((b) => { const i = K.qs('#i' + b.n), f = K.qs('#f' + b.n); return !/^\d{2}\/\d{2}\/\d{4}$/.test(i.value) || !/^\d{2}\/\d{2}\/\d{4}$/.test(f.value) || toDate(f.value) <= toDate(i.value); });
    if (ruim) { K.toast(`Revise o ${ruim.n}º bimestre`, 'Use datas no formato dd/mm/aaaa e encerramento depois da abertura.', 'err', false); K.qs('#i' + ruim.n).focus(); return; }
    K.toast('Períodos salvos (simulação)', 'Alteração registrada na auditoria.');
  };
  K.actions.reabrir = () => K.modal(`${K.modalHead('undo', 'ico-warn', 'Reabrir bimestre encerrado?', 'Os professores poderão editar registros não publicados até a nova data. Use apenas em casos excepcionais.')}${K.field({ id: 'ra', label: 'Reabrir até', value: '05/10/2026 23:59', required: true, icon: 'calendar' })}${K.field({ id: 'rm', label: 'Motivo (fica na auditoria)', type: 'textarea', required: true, placeholder: 'Ex.: professor afastado no período' })}<div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="reabrir-ok">Reabrir</button></div>`);
  K.actions['reabrir-ok'] = () => { if (!K.validate(K.qs('.modal'))) return; K.closeModal(); K.toast('Bimestre reaberto (simulação)'); };

  /* ======================= REVISÃO — LISTA ======================= */
  const revisao = {
    title: 'Revisão',
    render: (p, q) => {
      const status = q.status || 'fila';
      const counts = { fila: A.relsFiltrados({ status: ['enviado', 'revisao'] }).length, enviado: A.relsFiltrados({ status: 'enviado' }).length, revisao: A.relsFiltrados({ status: 'revisao' }).length, devolvido: A.relsFiltrados({ status: 'devolvido' }).length, publicado: A.relsFiltrados({ status: 'publicado', bim: 3 }).length };
      const chips = [['fila', 'Aguardando'], ['enviado', 'Enviados'], ['revisao', 'Em revisão'], ['devolvido', 'Devolvidos'], ['publicado', 'Publicados (3º bim)']];
      return S('admin', 'revisao', `
        ${K.pageHead({ crumbs: [{ label: 'Acompanhamento' }, { label: 'Revisão' }], title: 'Revisão e publicação', lead: 'Revise, ajuste com histórico, devolva para ajustes ou publique os registros enviados pelos professores.', actions: `<button class="btn btn-success" data-action="publicar-lote" id="btn-lote" disabled>${I('check')} Publicar selecionados</button>` })}
        <div class="row" role="group" aria-label="Filtrar por status">${chips.map(([k, l]) => `<a class="filter-chip" href="#/admin/revisao?status=${k}" aria-pressed="${k === status}">${l} <span class="n">${counts[k]}</span></a>`).join('')}</div>
        <section class="card">
          <div class="filters-panel">${K.field({ id: 'rf-t', label: 'Turma', options: optTurmas() })}${K.field({ id: 'rf-d', label: 'Disciplina', options: optDisc() })}${K.field({ id: 'rf-p', label: 'Professor', options: optProf() })}${K.field({ id: 'rf-b', label: 'Bimestre', options: optBim(), value: '' })}</div>
          <div class="table-wrap"><table class="table" id="t-rev"><thead><tr><th><span class="sr-only">Selecionar</span></th><th>Aluno</th><th>Disciplina</th><th>Professor</th><th>Bim.</th><th>Média</th><th>Status</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody></tbody></table></div>
          <div id="rev-empty" hidden>${K.empty({ icon: 'check-circle', title: 'Tudo revisado por aqui', text: 'Nenhum registro corresponde aos filtros. Quando um professor enviar um acompanhamento, ele aparecerá nesta fila.' })}</div>
        </section>`);
    },
    mount: (root, p, q) => {
      const status = q.status || 'fila';
      const base = status === 'fila' ? A.relsFiltrados({ status: ['enviado', 'revisao'] }) : A.relsFiltrados({ status, ...(status === 'publicado' ? { bim: 3 } : {}) });
      const tb = K.qs('#t-rev tbody', root);
      const draw = () => {
        const f = { turma: K.qs('#rf-t').value, disc: K.qs('#rf-d').value, prof: K.qs('#rf-p').value, bim: K.qs('#rf-b').value };
        const list = base.filter((r) => Object.entries(f).every(([k, v]) => !v || String(r[k]) === v));
        tb.innerHTML = list.map((r) => { const a = A.aluno(r.aluno); const can = ['enviado', 'revisao'].includes(r.status); return `<tr><td>${can ? `<input type="checkbox" class="sel" value="${r.id}" aria-label="Selecionar ${a.nome}" style="width:20px;height:20px;accent-color:var(--blue)">` : ''}</td><td class="cell-main"><div class="cell-person">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b><small>${A.turma(r.turma).nome}</small></span></div></td><td data-label="Disciplina">${A.disc(r.disc).nome}</td><td data-label="Professor">${A.prof(r.prof).nome}</td><td data-label="Bimestre">${r.bim}º</td><td data-label="Média" class="mono">${K.fmtMedia(r.media)}</td><td data-label="Status">${K.status(r.status, true)}</td><td class="actions"><a class="btn btn-secondary btn-sm" href="#/admin/revisao/${r.id}">${can ? 'Revisar' : 'Abrir'}</a></td></tr>`; }).join('');
        K.qs('#rev-empty').hidden = list.length > 0; tb.closest('.table-wrap').hidden = !list.length;
      };
      K.qsa('.filters-panel select', root).forEach((s) => s.addEventListener('change', draw));
      tb.addEventListener('change', () => { const n = K.qsa('.sel:checked').length; const b = K.qs('#btn-lote'); b.disabled = !n; b.innerHTML = `${I('check')} Publicar selecionados${n ? ` (${n})` : ''}`; });
      K.actions['publicar-lote'] = () => { const ids = K.qsa('.sel:checked').map((c) => c.value); K.modal(`${K.modalHead('check-circle', 'ico-ok', `Publicar ${K.plural(ids.length, 'registro')}?`, 'Após publicar, os responsáveis vinculados poderão ver os relatórios. A ação fica registrada na auditoria.')}<div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-success" data-action="lote-ok">${I('check')} Publicar</button></div>`); K.actions['lote-ok'] = () => { ids.forEach((id) => A.mudarStatus(id, 'publicado', 'Marina Rocha', 'Coordenação')); K.closeModal(); K.toast(`${ids.length} registro(s) publicado(s)`, 'Status atualizado nesta sessão.'); K.refresh(); }; };
      draw();
    }
  };

  /* ======================= REVISÃO — DETALHE ======================= */
  const timeline = (r) => `<div class="timeline">${r.historico.map((h) => { const fam = h.papel === 'Responsável'; const tone = fam ? 'ico-ok' : { publicado: 'ico-ok', devolvido: 'ico-bad', revisao: 'ico-warn', enviado: 'ico-teal', cancelado: 'ico-bad' }[h.para] || 'ico-blue'; const ic = fam ? (/Observa/.test(h.acao) ? 'message' : 'check') : (K.STATUS[h.para] || {}).icon || 'edit'; return `<div class="tl-item"><span class="tl-dot ${tone}">${I(ic, 'icon-sm')}</span><div><b>${h.acao}</b><small>${h.quem} · ${h.papel} · ${h.quando}</small>${h.de ? `<div class="tl-change">${K.STATUS[h.de] ? K.STATUS[h.de].short || K.STATUS[h.de].label : h.de} ${I('chevron-right', 'icon-sm')} <b>${K.STATUS[h.para] ? K.STATUS[h.para].short || K.STATUS[h.para].label : h.para}</b></div>` : ''}${h.coment ? `<div class="tl-comment">“${K.esc(h.coment)}”</div>` : ''}${h.textoAnterior ? `<details class="tl-version"><summary>Comparar versões</summary><div class="ver-old"><span class="eyebrow">Antes</span><p>${K.esc(h.textoAnterior)}</p></div><div class="ver-new"><span class="eyebrow">Depois</span><p>${K.esc(h.textoNovo)}</p></div></details>` : ''}</div></div>`; }).join('')}</div>`;
  K.timeline = timeline;
  // Retorno da família (ciência + observação), visível ao professor e à coordenação — RF12
  K.retornoFamilia = (r) => {
    if (r.status !== 'publicado') return '';
    const resp = A.respDoAluno(r.aluno)[0];
    const o = r.observacao;
    return `<section class="card stack-sm family-return" aria-label="Retorno da família"><div class="row-between"><h2 style="font-size:18px">${I('family')} Retorno da família</h2>${r.lido ? K.status('lido') : K.status('nao-lido')}</div>
      ${o ? `<div class="comment">${K.avatar(o.quem, '#5FD4A8', 'sm')}<div><b>${K.esc(o.quem)}</b> <small class="muted">· ${o.papel} · ${o.quando}</small><p>${K.esc(o.texto)}</p></div></div>` : `<p class="muted" style="font-size:14px">${r.lido ? `${resp ? resp.nome : 'O responsável'} registrou ciência e não deixou observação.` : 'O responsável ainda não abriu este relatório.'}</p>`}</section>`;
  };
  K.stepper = (s) => { const order = ['rascunho', 'enviado', 'revisao', 'publicado']; const idx = order.indexOf(s); const lab = ['Rascunho', 'Enviado', 'Em revisão', 'Publicado']; if (s === 'devolvido') return `<div class="stepper" aria-label="Etapa do fluxo: devolvido">${['Rascunho', 'Enviado', 'Em revisão'].map((l) => `<span class="step done"><span class="n">✓</span>${l}</span><span class="step-line"></span>`).join('')}<span class="step bad"><span class="n">!</span>Devolvido para ajustes</span></div>`; if (s === 'cancelado') return `<div class="stepper"><span class="step bad"><span class="n">×</span>Cancelado</span></div>`; return `<div class="stepper" aria-label="Etapa do fluxo: ${lab[idx]}">${lab.map((l, i) => `<span class="step ${i < idx || (i === idx && s === 'publicado') ? 'done' : i === idx ? 'current' : ''}"><span class="n">${i < idx || s === 'publicado' && i === idx ? '✓' : i + 1}</span>${l}</span>${i < 3 ? '<span class="step-line"></span>' : ''}`).join('')}</div>`; };
  const revDet = {
    title: 'Revisar registro',
    render: (p) => {
      const r = A.rel(p.id); if (!r) return K.views.notFound.render();
      const a = A.aluno(r.aluno); const pr = A.prof(r.prof); const editable = ['enviado', 'revisao'].includes(r.status);
      const outros = A.relsFiltrados({ status: ['enviado', 'revisao'] }).filter((x) => x.id !== r.id).slice(0, 4);
      return S('admin', 'revisao', `
        ${K.pageHead({ crumbs: [{ label: 'Revisão', href: '#/admin/revisao' }, { label: a.nome }], title: `${a.nome}`, lead: `${A.turma(r.turma).nome} · ${A.disc(r.disc).nome} · ${r.bim}º bimestre de ${r.ano} · Prof. ${pr.nome}`, actions: K.status(r.status) })}
        ${K.stepper(r.status)}
        ${r.status === 'enviado' ? `<div class="alert info">${I('info')}<div class="grow"><b>Registro aguardando início da revisão</b>Ao iniciar, o professor vê o status “Em revisão” e não pode mais editar.</div><button class="btn btn-primary btn-sm" data-action="iniciar-rev" data-id="${r.id}">Iniciar revisão</button></div>` : ''}
        ${r.status === 'publicado' ? `<div class="alert success">${I('check-circle')}<div><b>Publicado para a família</b>Visível para ${A.respDoAluno(a.id).map((x) => x.nome).join(' e ') || 'os responsáveis vinculados'}. ${r.lido ? 'Ciência registrada.' : 'Ainda não lido.'}</div></div>` : ''}
        <div class="grid-main-side">
          <div class="stack">
            <section class="card">
              <div class="grid-2">
                <div class="media-box"><span class="eyebrow">Média do bimestre</span>${editable ? `<label class="sr-only" for="rv-media">Média</label><input id="rv-media" class="media-input mono" value="${K.fmtMedia(r.media)}" inputmode="decimal" data-validate data-min="0" data-max="10">` : `<b class="media-val">${K.fmtMedia(r.media)}</b>`}<small class="muted">Escala da escola: 0 a 10, uma casa decimal</small></div>
                <div class="stack-sm"><span class="eyebrow">Tags do registro</span>${K.tags(r.tags)}<small class="muted">Classificações pedagógicas definidas pelo professor.</small></div>
              </div>
              <div class="stack-sm"><div class="row-between"><span class="eyebrow">Descrição do acompanhamento</span>${editable ? `<button class="btn btn-ghost btn-sm" data-action="editar-desc">${I('edit', 'icon-sm')} Ajustar texto</button>` : ''}</div>
                <div id="desc-view" class="desc-text">${K.esc(r.desc)}</div>
                <div id="desc-edit" hidden>${K.field({ id: 'rv-desc', label: 'Texto revisado', type: 'textarea', value: r.desc, required: true })}<small class="muted">Toda alteração da coordenação fica registrada com o texto anterior.</small></div></div>
            </section>
            ${K.retornoFamilia(r)}
            ${r.comentarios.length ? `<section class="card"><h2 style="font-size:18px">Comentários da revisão</h2>${r.comentarios.map((c) => `<div class="comment">${K.avatar(c.quem, '#FFC94A', 'sm')}<div><b>${c.quem}</b> <small class="muted">· ${c.papel} · ${c.quando}</small><p>${K.esc(c.texto)}</p></div></div>`).join('')}</section>` : ''}
            ${editable ? `<div class="action-bar"><button class="btn btn-danger" data-action="devolver" data-id="${r.id}">${I('undo')} Devolver para ajustes</button><button class="btn btn-ghost" data-action="cancelar-reg" data-id="${r.id}">${I('ban')} Cancelar registro</button><span class="grow"></span><button class="btn btn-secondary" data-action="salvar-rev" data-id="${r.id}">${I('save')} Salvar alteração</button><button class="btn btn-success" data-action="publicar" data-id="${r.id}">${I('send')} Publicar para a família</button></div>` : ''}
          </div>
          <aside class="stack">
            <section class="card"><h2 style="font-size:18px">${I('clock')} Histórico e auditoria</h2>${timeline(r)}</section>
            ${outros.length ? `<section class="card tight"><h2 style="font-size:16px">Próximos na fila</h2>${outros.map((o) => { const oa = A.aluno(o.aluno); return `<a class="row list-link" href="#/admin/revisao/${o.id}">${K.avatar(oa.nome, oa.cor, 'sm')}<span class="grow"><b>${oa.nome}</b><small class="muted"> · ${A.disc(o.disc).nome}</small></span>${I('chevron-right', 'icon-sm')}</a>`; }).join('')}</section>` : ''}
          </aside>
        </div>`);
    },
    mount: (root, p) => {
      const r = A.rel(p.id); if (!r) return;
      const after = (msg, txt) => { K.closeModal(); K.toast(msg, txt); K.refresh(); };
      K.actions['iniciar-rev'] = () => { A.mudarStatus(r.id, 'revisao', 'Marina Rocha', 'Coordenação'); after('Revisão iniciada', 'O professor verá o status “Em revisão”.'); };
      K.actions['editar-desc'] = () => { K.qs('#desc-view').hidden = true; K.qs('#desc-edit').hidden = false; K.qs('#rv-desc').focus(); };
      K.actions['salvar-rev'] = () => {
        const m = K.qs('#rv-media'); if (!K.validate(root)) { K.toast('Média fora da escala', 'Use um valor entre 0 e 10.', 'err', false); return; }
        const nova = Number(m.value.replace(',', '.')); const ta = K.qs('#rv-desc');
        if (nova !== r.media) { r.historico.push({ quem: 'Marina Rocha', papel: 'Coordenação', quando: 'agora', acao: 'Média alterada', de: K.fmtMedia(r.media), para: K.fmtMedia(nova) }); r.media = nova; }
        if (ta && ta.value !== r.desc) { const nv = r.historico.filter((h) => h.acao === 'Descrição ajustada').length + 1; r.historico.push({ quem: 'Marina Rocha', papel: 'Coordenação', quando: 'agora', acao: 'Descrição ajustada', de: 'v' + nv, para: 'v' + (nv + 1), textoAnterior: r.desc, textoNovo: ta.value }); r.desc = ta.value; }
        if (r.status === 'enviado') A.mudarStatus(r.id, 'revisao', 'Marina Rocha', 'Coordenação');
        after('Alterações salvas (simulação)', 'Estado anterior e posterior registrados no histórico.');
      };
      K.actions.publicar = () => K.modal(`${K.modalHead('send', 'ico-ok', 'Publicar para a família?', `${relLabel(r)} · ${r.bim}º bimestre`)}
        <div class="publish-preview"><div class="row-between"><span class="eyebrow">Média</span><b class="mono" style="font-size:22px">${K.fmtMedia(r.media)}</b></div>${K.tags(r.tags)}<p class="text-2" style="font-size:14px">${K.esc(r.desc).slice(0, 180)}…</p></div>
        <div class="alert info">${I('family')}<div>Ficará visível para: <b>${A.respDoAluno(r.aluno).map((x) => x.nome).join(', ') || 'responsáveis vinculados'}</b>. Eles receberão um aviso (simulação).</div></div>
        <div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Voltar</button><button class="btn btn-success" data-action="publicar-ok">${I('check')} Confirmar publicação</button></div>`);
      K.actions['publicar-ok'] = () => { A.mudarStatus(r.id, 'publicado', 'Marina Rocha', 'Coordenação'); after('Relatório publicado', 'A família já pode visualizar (nesta simulação).'); };
      K.actions.devolver = () => K.modal(`${K.modalHead('undo', 'ico-bad', 'Devolver para ajustes', `${relLabel(r)}`)}
        <form class="stack" id="dev-form" novalidate><fieldset style="border:0;padding:0;margin:0" class="stack-sm"><legend class="field-label">O que precisa ser ajustado?</legend>${['Descrição do acompanhamento', 'Média do bimestre', 'Tags selecionadas'].map((x, i) => `<label class="check"><input type="checkbox" ${i === 0 ? 'checked' : ''}> ${x}</label>`).join('')}</fieldset>
        ${K.field({ id: 'dev-msg', label: 'Comentário para o professor', type: 'textarea', required: true, attrs: 'data-minlen="15" maxlength="500"', placeholder: 'Explique o que ajustar de forma objetiva e respeitosa.', hint: 'Obrigatório. O professor verá esta mensagem junto ao registro.' })}
        <div class="alert neutral">${I('info')}<div>O registro volta ao professor com status “Devolvido para ajustes”. O histórico é mantido.</div></div>
        <div class="modal-foot"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-danger">${I('send')} Devolver ao professor</button></div></form>`,
        { onOpen: (ov) => K.qs('#dev-form', ov).addEventListener('submit', (e) => { e.preventDefault(); if (!K.validate(e.target)) return; A.mudarStatus(r.id, 'devolvido', 'Marina Rocha', 'Coordenação', K.qs('#dev-msg').value.trim()); after('Registro devolvido ao professor', 'O comentário ficou registrado no histórico.'); }) });
      K.actions['cancelar-reg'] = () => K.modal(`${K.modalHead('ban', 'ico-bad', 'Cancelar este registro?', 'Use quando o registro não deve ser publicado (ex.: aluno transferido). O histórico é mantido.')}${K.field({ id: 'can-msg', label: 'Motivo', type: 'textarea', required: true })}<div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Voltar</button><button class="btn btn-danger" data-action="cancelar-ok">Cancelar registro</button></div>`);
      K.actions['cancelar-ok'] = () => { if (!K.validate(K.qs('.modal'))) return; A.mudarStatus(r.id, 'cancelado', 'Marina Rocha', 'Coordenação', K.qs('#can-msg').value.trim()); after('Registro cancelado (simulação)'); };
    }
  };

  /* ======================= AUDITORIA ======================= */
  const auditoria = {
    title: 'Histórico e auditoria',
    render: (p, q) => {
      const f = q.tipo || '';
      const tipos = [['', 'Tudo'], ['Publicou', 'Publicações'], ['Devolveu', 'Devoluções'], ['Alterou', 'Alterações'], ['Inativou', 'Cadastros']];
      const list = D.auditoria.filter((x) => !f || x.acao.startsWith(f));
      return S('admin', 'auditoria', `
        ${K.pageHead({ crumbs: [{ label: 'Acompanhamento' }, { label: 'Auditoria' }], title: 'Histórico e auditoria', lead: 'Toda alteração registra usuário, data/hora, estado anterior e estado posterior. Os registros não podem ser editados.', actions: `<button class="btn btn-secondary" data-action="exportar" data-what="log de auditoria">${I('download')} Exportar log</button>` })}
        <div class="row" role="group" aria-label="Tipo de evento">${tipos.map(([k, l]) => `<a class="filter-chip" href="#/admin/auditoria${k ? '?tipo=' + k : ''}" aria-pressed="${k === f}">${l}</a>`).join('')}</div>
        <section class="card flush"><div class="table-wrap" style="border:0"><table class="table"><thead><tr><th>Data/hora</th><th>Usuário</th><th>Ação</th><th>Registro</th><th>Antes → depois</th></tr></thead><tbody>
        ${list.map((x) => `<tr><td class="cell-main mono">${x.quando}</td><td data-label="Usuário"><div class="cell-person">${K.avatar(x.quem, x.quem === 'Marina Rocha' ? '#FFC94A' : '#74C0FC', 'sm')}${x.quem}</div></td><td data-label="Ação"><b>${x.acao}</b></td><td data-label="Registro">${x.registro}</td><td data-label="Mudança"><span class="tl-change" style="margin:0">${x.de} ${I('chevron-right', 'icon-sm')} <b>${x.para}</b></span></td></tr>`).join('')}
        </tbody></table></div></section>
        <p class="muted row" style="font-size:13px">${I('lock', 'icon-sm')} Retenção de 5 anos · somente leitura.</p>`);
    }
  };

  /* ======================= RELATÓRIOS GERENCIAIS ======================= */
  const relatorios = {
    title: 'Relatórios gerenciais',
    render: (p, q) => S('admin', 'relatorios', `
      ${K.pageHead({ crumbs: [{ label: 'Acompanhamento' }, { label: 'Relatórios gerenciais' }], title: 'Relatórios gerenciais', lead: 'Consulte indicadores por turma, disciplina, professor, bimestre, aluno e tags.', actions: `<button class="btn btn-primary" data-action="exportar" data-what="relatório filtrado">${I('sheet')} Exportar dados</button>` })}
      <section class="card" aria-label="Filtros">
        <div class="filters-panel">
          ${K.field({ id: 'g-t', label: 'Turma', options: optTurmas(), value: q.turma || '' })}${K.field({ id: 'g-d', label: 'Disciplina', options: optDisc(), value: q.disc || '' })}${K.field({ id: 'g-p', label: 'Professor', options: optProf(), value: q.prof || '' })}${K.field({ id: 'g-b', label: 'Bimestre', options: optBim(), value: q.bim || '' })}
          ${K.field({ id: 'g-a', label: 'Aluno', options: [['', 'Todos os alunos'], ...D.alunos.map((a) => [a.id, a.nome])] })}${K.field({ id: 'g-s', label: 'Status', options: [['', 'Todos os status'], ...['rascunho', 'enviado', 'revisao', 'publicado', 'devolvido', 'cancelado'].map((s) => [s, K.STATUS[s].label])], value: q.status || '' })}
        </div>
        <fieldset style="border:0;padding:0;margin:0"><legend class="field-label">Tags (qualquer uma)</legend><div class="tag-picker" id="g-tags">${D.tags.map((t) => `<label class="tag-option"><input type="checkbox" value="${t.id}"><span>${t.nome}</span></label>`).join('')}</div></fieldset>
        <div class="row-between"><div class="active-filters" id="g-active" aria-live="polite"></div><button class="btn btn-ghost btn-sm" data-action="g-limpar">Limpar filtros</button></div>
      </section>
      <div id="g-out"></div>`),
    mount: (root) => {
      const draw = () => {
        const f = { turma: K.qs('#g-t').value, disc: K.qs('#g-d').value, prof: K.qs('#g-p').value, bim: K.qs('#g-b').value, aluno: K.qs('#g-a').value, status: K.qs('#g-s').value };
        const tg = K.qsa('#g-tags input:checked').map((i) => i.value);
        const list = D.relatorios.filter((r) => Object.entries(f).every(([k, v]) => !v || String(r[k]) === v) && (!tg.length || r.tags.some((t) => tg.includes(t))));
        const com = list.filter((r) => r.media != null);
        const avg = com.length ? com.reduce((s, r) => s + r.media, 0) / com.length : null;
        const pub = list.filter((r) => r.status === 'publicado');
        const lidos = pub.filter((r) => r.lido).length;
        const byDisc = D.disciplinas.map((d) => { const rs = com.filter((r) => r.disc === d.id); return [d.id, rs.length ? rs.reduce((s, r) => s + r.media, 0) / rs.length : null]; }).filter((x) => x[1] != null);
        const tagCount = D.tags.map((t) => [t, list.filter((r) => r.tags.includes(t.id)).length]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]);
        const maxT = tagCount.length ? tagCount[0][1] : 1;
        const act = Object.entries({ ...f }).filter(([, v]) => v).map(([k, v]) => ({ turma: () => A.turma(v).nome, disc: () => A.disc(v).nome, prof: () => A.prof(v).nome, bim: () => v + 'º bim', aluno: () => A.aluno(v).nome, status: () => K.STATUS[v].label }[k]()));
        K.qs('#g-active').innerHTML = act.length || tg.length ? 'Filtros ativos: ' + [...act, ...tg.map((t) => D.tags.find((x) => x.id === t).nome)].map((x) => `<span class="pill">${x}</span>`).join('') : 'Nenhum filtro aplicado — exibindo todos os registros.';
        K.qs('#g-out').innerHTML = !list.length ? `<section class="card">${K.empty({ icon: 'search', title: 'Nenhum registro com esses filtros', text: 'Tente remover algum filtro ou escolher outro bimestre.' })}</section>` : `
          <section class="grid-4">
            <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-blue">${I('chart', 'icon-sm')}</span><span class="lbl">Média dos registros filtrados</span></div><div class="val">${avg == null ? '—' : K.fmtMedia(avg)}</div></div>
            <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-teal">${I('file', 'icon-sm')}</span><span class="lbl">Registros encontrados</span></div><div class="val">${list.length}</div></div>
            <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-ok">${I('check-circle', 'icon-sm')}</span><span class="lbl">Publicados</span></div><div class="val">${pub.length}</div></div>
            <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-sun">${I('eye', 'icon-sm')}</span><span class="lbl">Lidos pelas famílias</span></div><div class="val">${pub.length ? Math.round(lidos / pub.length * 100) : 0}%</div></div>
          </section>
          <div class="grid-2">
            <section class="card"><div class="card-head"><div><h2>Média por disciplina</h2><p>Registros filtrados com média informada</p></div></div>
              <div class="vbars" role="img" aria-label="${byDisc.map(([d, m]) => `${A.disc(d).nome} ${K.fmtMedia(m)}`).join(', ')}">${byDisc.map(([d, m]) => `<div class="col"><span class="v">${K.fmtMedia(m)}</span><span class="b ${m < 7 ? 'warn' : ''}" style="height:${m * 14}px"></span><span class="l">${d}</span></div>`).join('')}</div>
              <p class="muted" style="font-size:12px">Barras amarelas: média abaixo de 7,0 (meta ilustrativa).</p></section>
            <section class="card"><div class="card-head"><div><h2>Tags mais usadas</h2><p>Quantidade de registros com cada tag</p></div></div>
              ${tagCount.length ? tagCount.slice(0, 7).map(([t, n]) => `<div class="bar-row"><span>${K.tag(t.id)}</span><div class="progress"><span style="width:${n / maxT * 100}%"></span></div><span class="v">${n}</span></div>`).join('') : '<p class="muted">Sem tags nos registros filtrados.</p>'}</section>
          </div>
          <section class="card"><div class="card-head"><div><h2>Registros</h2><p>${list.length} resultados</p></div></div>
            <div class="table-wrap"><table class="table"><thead><tr><th>Aluno</th><th>Turma</th><th>Disciplina</th><th>Bim.</th><th>Média</th><th>Status</th><th><span class="sr-only">Abrir</span></th></tr></thead><tbody>
            ${list.slice(0, 12).map((r) => { const a = A.aluno(r.aluno); return `<tr><td class="cell-main"><div class="cell-person">${K.avatar(a.nome, a.cor, 'sm')}<b>${a.nome}</b></div></td><td data-label="Turma">${A.turma(r.turma).nome}</td><td data-label="Disciplina">${A.disc(r.disc).nome}</td><td data-label="Bimestre">${r.bim}º</td><td data-label="Média" class="mono">${K.fmtMedia(r.media)}</td><td data-label="Status">${K.status(r.status, true)}</td><td class="actions"><a class="btn btn-ghost btn-sm" href="#/admin/revisao/${r.id}">Detalhe</a></td></tr>`; }).join('')}
            </tbody></table></div>${K.pagination(1, Math.min(12, list.length), list.length)}</section>`;
      };
      K.qsa('select, #g-tags input', root).forEach((el) => el.addEventListener('change', draw));
      K.actions['g-limpar'] = () => { K.qsa('.filters-panel select', root).forEach((s) => (s.value = '')); K.qsa('#g-tags input', root).forEach((i) => (i.checked = false)); draw(); };
      draw();
    }
  };
  // Exportação somente visual (sem gerar arquivo real)
  K.actions.exportar = (el) => {
    const what = el.dataset.what || 'dados';
    K.modal(`${K.modalHead('download', 'ico-ok', 'Exportar ' + what, 'Formato compatível com Excel. Interface demonstrativa — nenhum arquivo será gerado.')}
      <fieldset style="border:0;padding:0;margin:0" class="stack-sm"><legend class="field-label">Formato</legend>
        <label class="format-opt"><input type="radio" name="fmt" checked> <span class="ico ico-ok">${I('sheet')}</span><span class="grow"><b class="mono">.xlsx</b><small>Planilha do Excel</small></span></label>
        <label class="format-opt"><input type="radio" name="fmt"> <span class="ico ico-blue">${I('file')}</span><span class="grow"><b class="mono">.csv</b><small>Valores separados por vírgula</small></span></label></fieldset>
      <fieldset style="border:0;padding:0;margin:0" class="stack-sm"><legend class="field-label">Incluir</legend>${['Registros e status', 'Médias por turma e disciplina', 'Tags aplicadas', 'Ciência das famílias'].map((x, i) => `<label class="check"><input type="checkbox" ${i < 3 ? 'checked' : ''}> ${x}</label>`).join('')}</fieldset>
      <div class="alert info">${I('shield')}<div>Somente dados autorizados pela LGPD são exportados.</div></div>
      <div id="exp-progress" hidden class="stack-sm"><div class="progress"><span style="width:0%;transition:width 1.2s"></span></div><small class="muted">Gerando arquivo de demonstração…</small></div>
      <div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="exportar-ok">${I('download')} Gerar arquivo</button></div>`);
  };
  K.actions['exportar-ok'] = () => { const pg = K.qs('#exp-progress'); pg.hidden = false; requestAnimationFrame(() => (pg.querySelector('span').style.width = '100%')); setTimeout(() => { K.closeModal(); K.toast('Exportação simulada concluída', 'Na versão funcional, o download do arquivo começaria aqui.'); }, 1300); };

  /* ======================= PERFIL ======================= */
  const perfil = {
    title: 'Meu perfil',
    render: () => { const s = D.sessao.admin; return S('admin', '', `
      ${K.pageHead({ crumbs: [{ label: 'Conta' }], title: 'Meu perfil', lead: 'Dados pessoais, segurança e preferências de notificação.' })}
      <section class="card"><div class="row">${K.avatar(s.nome, s.cor, 'xl')}<div class="grow"><h2>${s.nome}</h2><p class="text-2">${s.cargo}</p><div class="row" style="margin-top:8px"><span class="tag t-alerta">Administrador</span><span class="tag t-azul">Também: Professor</span></div></div></div></section>
      <div class="grid-2">
        <form class="card stack" novalidate id="pf"><h2 style="font-size:18px">Dados pessoais</h2>${K.field({ id: 'pfn', label: 'Nome completo', value: s.nome, required: true })}${K.field({ id: 'pfe', label: 'E-mail institucional', type: 'email', value: s.email, required: true, icon: 'mail' })}<div class="form-actions"><button class="btn btn-primary" type="submit">Salvar</button></div></form>
        <section class="card stack"><h2 style="font-size:18px">Notificações</h2>${[['Novos envios para revisão', true], ['Resumo diário por e-mail', true], ['Prazos de bimestre', true], ['Observações de responsáveis', false]].map(([l, on]) => `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''}><span class="track"></span><span>${l}</span></label>`).join('')}<h2 style="font-size:18px;margin-top:8px">Sessões ativas</h2><div class="row-between"><span>Chrome · Windows · agora</span><span class="status publicado">Esta sessão</span></div><div class="row-between"><span>Celular · ontem 21:14</span><button class="link-btn" data-action="noop">Encerrar</button></div></section>
      </div>`); },
    mount: (root) => K.qs('#pf', root).addEventListener('submit', (e) => { e.preventDefault(); if (K.validate(e.target)) K.toast('Perfil atualizado (simulação)'); })
  };

  // Rotas
  K.route('/admin', painel); K.route('/admin/painel', painel);
  K.route('/admin/alunos', alunos); K.route('/admin/alunos/novo', alunoForm); K.route('/admin/alunos/:id/editar', alunoForm);
  K.route('/admin/professores', professores); K.route('/admin/professores/novo', profForm); K.route('/admin/professores/:id/editar', profForm);
  K.route('/admin/responsaveis', responsaveis); K.route('/admin/responsaveis/novo', respForm); K.route('/admin/responsaveis/:id/editar', respForm);
  K.route('/admin/turmas', turmas); K.route('/admin/turmas/:id', turmaDet);
  K.route('/admin/disciplinas', disciplinas); K.route('/admin/vinculos', vinculos); K.route('/admin/periodos', periodos);
  K.route('/admin/revisao', revisao); K.route('/admin/revisao/:id', revDet);
  K.route('/admin/auditoria', auditoria); K.route('/admin/relatorios', relatorios); K.route('/admin/perfil', perfil);
})(window.KFKA);
