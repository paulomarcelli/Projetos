/* =========================================================
   KFKA — Área do Professor
   Fluxo: painel → turma → aluno → novo acompanhamento → prévia →
   rascunho/envio → acompanhamento da revisão → ajuste após devolução
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon, A = K.api, D = K.data;
  const PID = 'p1';                              // professor logado (simulação)
  const PNOME = 'Carlos Lima';
  const S = (active, html) => K.shell('professor', active, html);
  const BIM = 3;                                 // bimestre com digitação aberta
  const editavel = (s) => s === 'rascunho' || s === 'devolvido';

  // Turmas/disciplinas atribuídas ao professor
  const minhas = () => A.vinculosDoProf(PID);
  const regDe = (alunoId, disc, bim = BIM) => A.registro(alunoId, disc, bim);
  // Botão de ação adequado ao estado do registro
  const acao = (a, disc, r) => {
    if (!r) return `<a class="btn btn-primary btn-sm" href="#/professor/registro/novo?aluno=${a.id}&disc=${disc}&bim=${BIM}">${I('plus', 'icon-sm')} Registrar</a>`;
    if (r.status === 'rascunho') return `<a class="btn btn-secondary btn-sm" href="#/professor/registro/${r.id}/editar">${I('pencil', 'icon-sm')} Continuar</a>`;
    if (r.status === 'devolvido') return `<a class="btn btn-danger btn-sm" href="#/professor/registro/${r.id}/editar">${I('undo', 'icon-sm')} Ajustar</a>`;
    return `<a class="btn btn-ghost btn-sm" href="#/professor/registros/${r.id}">${I('eye', 'icon-sm')} Ver</a>`;
  };
  const progresso = (turma, disc) => {
    const al = A.alunosDaTurma(turma).filter((a) => a.ativo);
    const st = { publicado: 0, revisao: 0, enviado: 0, rascunho: 0, devolvido: 0, pendente: 0 };
    al.forEach((a) => { const r = regDe(a.id, disc); st[r ? r.status : 'pendente']++; });
    return { total: al.length, st };
  };
  const COR = { publicado: 'var(--success)', revisao: 'var(--sun)', enviado: 'var(--teal)', rascunho: 'var(--st-rascunho)', devolvido: 'var(--danger)', pendente: 'var(--line-strong)' };
  const barra = ({ total, st }) => `<div class="stacked" role="img" aria-label="${Object.entries(st).filter(([, n]) => n).map(([k, n]) => `${K.STATUS[k].label}: ${n}`).join(', ')}">${Object.entries(st).map(([k, n]) => (n ? `<span style="width:${n / (total || 1) * 100}%;background:${COR[k]}"></span>` : '')).join('')}</div>`;

  /* ======================= PAINEL ======================= */
  const painel = {
    title: 'Início do professor',
    render: () => {
      const vs = minhas();
      const all = vs.flatMap((v) => A.alunosDaTurma(v.turma).filter((a) => a.ativo).map((a) => regDe(a.id, v.disc)));
      const feitos = all.filter((r) => r && r.status !== 'rascunho').length;
      const pct = Math.round(feitos / (all.length || 1) * 100);
      const dev = A.relsFiltrados({ prof: PID, status: 'devolvido' });
      const rasc = A.relsFiltrados({ prof: PID, status: 'rascunho' });
      const pend = all.filter((r) => !r).length;
      return S('painel', `
        ${K.pageHead({ crumbs: [{ label: 'Professor' }], title: 'Bom dia, Carlos', lead: 'Veja o que falta registrar no 3º bimestre e responda aos ajustes pedidos pela coordenação.', actions: `<a class="btn btn-primary" href="#/professor/registro/novo">${I('plus')} Novo acompanhamento</a>` })}
        <section class="card card-dark hero-prof" aria-label="Progresso do bimestre">
          <div class="ring" style="--p:${pct}" data-label="${pct}%" role="img" aria-label="${pct}% dos registros enviados"></div>
          <div class="grow stack-sm">
            <h2 style="font-size:24px">${feitos} de ${all.length} registros enviados</h2>
            <p style="color:var(--sky);font-weight:700;font-size:13px">3º bimestre · digitação aberta</p>
            <p style="color:rgba(255,255,255,.75)">O prazo termina em <b style="color:#fff">30/09 às 23:59</b>. Depois disso, só a coordenação pode reabrir.</p>
          </div>
          <div class="row"><a class="btn btn-light" href="#/professor/turmas">${I('users')} Minhas turmas</a></div>
        </section>
        <section class="grid-3" aria-label="Pendências">
          <a class="card tight card-link kpi" href="#/professor/registros?status=devolvido"><div class="kpi-top"><span class="ico ico-bad">${I('undo', 'icon-sm')}</span><span class="lbl">Devolvidos para ajustes</span></div><div class="val">${dev.length}</div></a>
          <a class="card tight card-link kpi" href="#/professor/registros?status=rascunho"><div class="kpi-top"><span class="ico ico-blue">${I('pencil', 'icon-sm')}</span><span class="lbl">Rascunhos em andamento</span></div><div class="val">${rasc.length}</div></a>
          <a class="card tight card-link kpi" href="#/professor/turmas/6A?disc=MAT"><div class="kpi-top"><span class="ico ico-warn">${I('clock', 'icon-sm')}</span><span class="lbl">Alunos sem registro</span></div><div class="val">${pend}</div></a>
        </section>
        ${dev.length ? `<section class="card"><div class="card-head"><div><h2>Precisa da sua atenção</h2><p>A coordenação devolveu estes registros com comentários</p></div></div>
          <div class="stack-sm">${dev.map((r) => { const a = A.aluno(r.aluno); const c = r.comentarios[r.comentarios.length - 1]; return `<div class="alert danger">${I('undo')}<div class="grow"><b>${a.nome} · ${A.disc(r.disc).nome} · ${A.turma(r.turma).nome}</b>${c ? `“${K.esc(c.texto)}” — ${c.quem}` : 'Devolvido para ajustes.'}</div><a class="btn btn-danger btn-sm" href="#/professor/registro/${r.id}/editar">Ajustar</a></div>`; }).join('')}</div></section>` : ''}
        <section class="stack">
          <div class="row-between"><h2 style="font-size:20px">Minhas turmas</h2><div class="legend">${['publicado', 'revisao', 'enviado', 'rascunho', 'devolvido', 'pendente'].map((k) => `<span><i style="background:${COR[k]}"></i>${K.STATUS[k].short || K.STATUS[k].label}</span>`).join('')}</div></div>
          <div class="grid-3">${vs.map((v) => { const t = A.turma(v.turma); const pg = progresso(v.turma, v.disc); const ok = pg.total - pg.st.pendente - pg.st.rascunho; return `<a class="card card-link turma-card" href="#/professor/turmas/${t.id}?disc=${v.disc}">
            <div class="row-between"><span class="turma-badge">${t.nome}</span><span class="tag t-neutro">${A.disc(v.disc).nome}</span></div>
            <div><b style="font-size:16px">${ok}/${pg.total} enviados</b><div class="muted" style="font-size:13px">${t.turno} · ${t.sala}</div></div>${barra(pg)}
            ${pg.st.devolvido ? `<small style="color:var(--st-devolvido);font-weight:700">${I('undo', 'icon-sm')} ${K.plural(pg.st.devolvido, 'devolvido')}</small>` : `<small class="muted">${pg.st.pendente} sem registro</small>`}</a>`; }).join('')}</div>
        </section>
        <section class="card"><div class="card-head"><div><h2>Retornos das famílias</h2><p>Ciência e observações dos responsáveis sobre seus relatórios</p></div></div>
          <div class="timeline">${A.relsFiltrados({ prof: PID, status: 'publicado' }).filter((r) => r.lido || r.observacao).sort((x, y) => (y.observacao ? 1 : 0) - (x.observacao ? 1 : 0)).slice(0, 4).map((r) => { const a = A.aluno(r.aluno); const resp = A.respDoAluno(a.id)[0]; const o = r.observacao; return `<div class="tl-item"><span class="tl-dot ${o ? 'ico-teal' : 'ico-ok'}">${I(o ? 'message' : 'check', 'icon-sm')}</span><div><b><a href="#/professor/registros/${r.id}">${o ? `${K.esc(o.quem)} enviou uma observação` : `${resp ? resp.nome : 'Responsável'} leu o relatório de ${a.nome.trim().split(/\s+/)[0]}`}</a></b><small>${a.nome} · ${A.disc(r.disc).nome} · ${r.bim}º bimestre</small>${o ? `<div class="tl-comment">“${K.esc(o.texto)}”</div>` : ''}</div></div>`; }).join('')}</div>
        </section>`);
    }
  };

  /* ======================= TURMAS ======================= */
  const turmas = {
    title: 'Minhas turmas',
    render: () => S('turmas', `
      ${K.pageHead({ crumbs: [{ label: 'Professor', href: '#/professor/painel' }, { label: 'Minhas turmas' }], title: 'Minhas turmas', lead: 'Turmas e disciplinas atribuídas a você pela coordenação no ano letivo de 2026.' })}
      <div class="grid-3">${minhas().map((v) => { const t = A.turma(v.turma); const pg = progresso(v.turma, v.disc); return `<article class="card turma-card">
        <div class="row-between"><span class="turma-badge lg">${t.nome}</span>${K.status(pg.st.devolvido ? 'devolvido' : pg.st.pendente ? 'pendente' : 'enviado', true)}</div>
        <div><h2 style="font-size:18px">${A.disc(v.disc).nome}</h2><p class="muted" style="font-size:13px">${t.ano} · ${t.turno} · ${t.sala} · ${K.plural(pg.total, 'aluno ativo', 'alunos ativos')}</p></div>
        ${barra(pg)}
        <a class="btn btn-secondary btn-block" href="#/professor/turmas/${t.id}?disc=${v.disc}">Abrir turma ${I('chevron-right', 'icon-sm')}</a></article>`; }).join('')}</div>`)
  };

  /* ======================= TURMA — DETALHE ======================= */
  const turmaDet = {
    title: (p) => `Turma ${p.id}`,
    render: (p, q) => {
      const t = A.turma(p.id);
      const vs = minhas().filter((v) => v.turma === p.id);
      if (!t || !vs.length) return S('', K.deny('professor'));
      const disc = vs.some((v) => v.disc === q.disc) ? q.disc : vs[0].disc;
      const al = A.alunosDaTurma(t.id);
      const pg = progresso(t.id, disc);
      return S('turmas', `
        ${K.pageHead({ crumbs: [{ label: 'Minhas turmas', href: '#/professor/turmas' }, { label: `${t.nome} · ${A.disc(disc).nome}` }], title: `${t.nome} · ${A.disc(disc).nome}`, lead: `${al.length} alunos · ${t.turno} · ${t.sala} · 3º bimestre`, actions: `<a class="btn btn-primary" href="#/professor/registro/novo?disc=${disc}">${I('plus')} Novo acompanhamento</a>` })}
        ${vs.length > 1 ? `<div class="segmented" role="group" aria-label="Disciplina">${vs.map((v) => `<a href="#/professor/turmas/${t.id}?disc=${v.disc}" ${v.disc === disc ? 'aria-current="page"' : ''}>${A.disc(v.disc).nome}</a>`).join('')}</div>` : ''}
        <section class="grid-4">${[['pendente', 'Sem registro'], ['rascunho', 'Rascunhos'], ['devolvido', 'Devolvidos'], ['publicado', 'Publicados']].map(([k, l]) => `<div class="card tight row"><span class="ico ${{ pendente: 'ico-warn', rascunho: 'ico-blue', devolvido: 'ico-bad', publicado: 'ico-ok' }[k]}" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center">${I(K.STATUS[k].icon)}</span><div><b class="mono" style="font-size:22px">${pg.st[k]}</b><div class="muted" style="font-size:12px;font-weight:700">${l}</div></div></div>`).join('')}</section>
        <section class="card">
          <div class="toolbar" role="search">
            <div class="search grow"><label class="sr-only" for="tq">Buscar aluno</label>${I('search')}<input id="tq" class="input" type="search" placeholder="Buscar aluno pelo nome" value="${K.esc(q.q || '')}"></div>
            <div class="segmented" role="group" aria-label="Filtrar por situação">${[['', 'Todos'], ['pendente', 'Sem registro'], ['rascunho', 'Rascunho'], ['devolvido', 'Devolvidos']].map(([v, l], i) => `<button type="button" data-f="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
          </div>
          <div class="table-wrap"><table class="table" id="t-turma"><thead><tr><th>Aluno</th><th>RA</th><th>Média</th><th>Status do registro</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody>
            ${al.map((a) => { const r = regDe(a.id, disc); const s = !a.ativo ? 'inativo' : r ? r.status : 'pendente'; return `<tr data-nome="${K.esc(a.nome.toLowerCase())}" data-s="${s}"><td class="cell-main"><a class="cell-person" href="#/professor/alunos/${a.id}">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b><small>${a.ativo ? t.nome : 'Inativo · transferido'}</small></span></a></td><td data-label="RA" class="mono">${a.ra}</td><td data-label="Média" class="mono">${r ? K.fmtMedia(r.media) : '—'}</td><td data-label="Status">${a.ativo ? K.status(r ? r.status : 'pendente') : K.status('cancelado', true)}</td><td class="actions">${a.ativo ? acao(a, disc, r) : ''}</td></tr>`; }).join('')}
          </tbody></table></div>
          <div id="turma-empty" hidden>${K.empty({ icon: 'search', title: 'Nenhum aluno encontrado', text: 'Ajuste a busca ou o filtro de situação para ver os alunos da turma.' })}</div>
        </section>`);
    },
    mount: (root) => {
      const tb = K.qs('#t-turma tbody', root); if (!tb) return;
      let f = '';
      const draw = () => {
        const term = K.qs('#tq').value.trim().toLowerCase(); let n = 0;
        K.qsa('tr', tb).forEach((tr) => { const ok = tr.dataset.nome.includes(term) && (!f || tr.dataset.s === f); tr.hidden = !ok; if (ok) n++; });
        K.qs('#turma-empty').hidden = n > 0; tb.closest('.table-wrap').hidden = !n;
      };
      K.qs('#tq').addEventListener('input', draw);
      K.qsa('[data-f]', root).forEach((b) => b.addEventListener('click', () => { f = b.dataset.f; K.qsa('[data-f]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
      draw();
    }
  };

  /* ======================= ALUNO ======================= */
  const aluno = {
    title: 'Aluno',
    render: (p) => {
      const a = A.aluno(p.id); if (!a) return K.views.notFound.render();
      const t = A.turma(a.turma);
      const discs = minhas().filter((v) => v.turma === a.turma).map((v) => v.disc);
      if (!discs.length) return S('', K.deny('professor'));
      const rs = A.relsFiltrados({ aluno: a.id }).filter((r) => discs.includes(r.disc));
      return S('turmas', `
        ${K.pageHead({ crumbs: [{ label: 'Minhas turmas', href: '#/professor/turmas' }, { label: t.nome, href: `#/professor/turmas/${t.id}?disc=${discs[0]}` }, { label: a.nome }], title: a.nome, lead: `${t.nome} · RA ${a.ra} · nascimento ${a.nasc}` })}
        <div class="grid-main-side">
          <section class="card">
            <div class="card-head"><div><h2>Acompanhamentos</h2><p>Registros seus para este aluno, por bimestre e disciplina</p></div></div>
            ${discs.map((d) => `<h3 class="eyebrow" style="margin-top:8px">${A.disc(d).nome}</h3>
              <div class="table-wrap"><table class="table"><thead><tr><th>Bimestre</th><th>Média</th><th>Tags</th><th>Status</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody>
              ${D.bimestres.filter((b) => b.status !== 'agendado').map((b) => { const r = rs.find((x) => x.disc === d && x.bim === b.n && x.status !== 'cancelado'); return `<tr><td class="cell-main"><b>${b.n}º bimestre</b></td><td data-label="Média" class="mono">${r ? K.fmtMedia(r.media) : '—'}</td><td data-label="Tags">${r ? K.tags(r.tags) : '<span class="muted">—</span>'}</td><td data-label="Status">${K.status(r ? r.status : 'pendente', true)}</td><td class="actions">${b.status === 'aberto' ? acao(a, d, r) : r ? `<a class="btn btn-ghost btn-sm" href="#/professor/registros/${r.id}">${I('eye', 'icon-sm')} Ver</a>` : '<span class="muted" style="font-size:12px">Período encerrado</span>'}</td></tr>`; }).join('')}
              </tbody></table></div>`).join('')}
          </section>
          <aside class="stack">
            <section class="card stack-sm" style="align-items:center;text-align:center">${K.avatar(a.nome, a.cor, 'xl')}<b style="font-size:18px">${a.nome}</b><span class="muted" style="font-size:13px">${t.nome} · ${t.turno}</span>${a.ativo ? '<span class="status publicado">Ativo</span>' : '<span class="status cancelado">Inativo</span>'}</section>
            <section class="card tight stack-sm"><h2 style="font-size:16px">Responsáveis</h2>${A.respDoAluno(a.id).map((r) => `<div class="row">${K.avatar(r.nome, '#9FE3D0', 'sm')}<span><b style="font-size:14px">${r.nome}</b><small class="muted"> · ${r.parentesco}</small></span></div>`).join('') || '<p class="muted">Nenhum responsável vinculado.</p>'}<small class="muted">Contatos são gerenciados pela coordenação.</small></section>
          </aside>
        </div>`);
    }
  };

  /* ======================= FORMULÁRIO DE ACOMPANHAMENTO ======================= */
  const form = {
    title: (p) => (p.id ? 'Editar acompanhamento' : 'Novo acompanhamento'),
    render: (p, q) => {
      const r = p.id ? A.rel(p.id) : null;
      if (p.id && (!r || r.prof !== PID)) return S('', K.deny('professor'));
      if (r && !editavel(r.status)) {
        return S('registros', `${K.pageHead({ crumbs: [{ label: 'Meus registros', href: '#/professor/registros' }, { label: 'Edição bloqueada' }], title: 'Este registro não pode ser editado agora' })}
          <div class="alert warning">${I('lock')}<div><b>Status: ${K.STATUS[r.status].label}</b>Registros enviados, em revisão ou publicados só podem ser alterados pela coordenação. Se precisar corrigir algo, peça a devolução.</div></div>
          <a class="btn btn-secondary" href="#/professor/registros/${r.id}">Ver registro</a>`);
      }
      const d0 = r || { aluno: q.aluno || '', disc: q.disc || '', bim: Number(q.bim) || BIM, media: '', tags: [], desc: '' };
      const turmaSel = d0.aluno ? A.aluno(d0.aluno).turma : '';
      const alunosOpts = [['', 'Selecione o aluno'], ...minhas().map((v) => v.turma).filter((x, i, arr) => arr.indexOf(x) === i).flatMap((tid) => A.alunosDaTurma(tid).filter((a) => a.ativo).map((a) => [a.id, `${a.nome} — ${A.turma(tid).nome}`]))];
      const discOpts = [['', 'Selecione a disciplina'], ...(turmaSel ? minhas().filter((v) => v.turma === turmaSel) : minhas()).map((v) => v.disc).filter((x, i, arr) => arr.indexOf(x) === i).map((d) => [d, A.disc(d).nome])];
      const ult = r && r.comentarios.length ? r.comentarios[r.comentarios.length - 1] : null;
      const crumbsLast = r ? (r.status === 'devolvido' ? 'Ajustar registro' : 'Editar rascunho') : 'Novo acompanhamento';
      return S(r ? 'registros' : 'novo', `
        ${K.pageHead({ crumbs: [{ label: 'Professor', href: '#/professor/painel' }, { label: crumbsLast }], title: r ? (r.status === 'devolvido' ? 'Ajustar após devolução' : 'Continuar rascunho') : 'Novo acompanhamento', lead: 'Registre a média e um relato pedagógico do bimestre. A família só verá depois da revisão e publicação pela coordenação.', actions: r ? K.status(r.status) : '' })}
        ${r && r.status === 'devolvido' && ult ? `<div class="alert danger">${I('undo')}<div><b>Comentário da coordenação · ${ult.quem} · ${ult.quando}</b>“${K.esc(ult.texto)}”</div></div>` : ''}
        <div class="grid-main-side${r ? "" : " sticky-side"}">
          <form id="reg-form" class="card stack-lg" novalidate>
            <fieldset class="form-section"><legend>1. Aluno e período</legend>
              <div class="form-grid">
                ${K.field({ id: 'f-aluno', label: 'Aluno', options: alunosOpts, value: d0.aluno, required: true, attrs: r ? 'disabled' : '' , span: 'span-2' })}
                ${K.field({ id: 'f-turma', label: 'Turma', value: turmaSel ? A.turma(turmaSel).nome : 'Preenchida ao escolher o aluno', attrs: 'readonly aria-readonly="true"' })}
                ${K.field({ id: 'f-disc', label: 'Disciplina', options: discOpts, value: d0.disc, required: true, attrs: r ? 'disabled' : '' })}
                ${K.field({ id: 'f-ano', label: 'Ano letivo', value: '2026', attrs: 'readonly aria-readonly="true"' })}
                ${K.field({ id: 'f-bim', label: 'Bimestre', options: D.bimestres.map((b) => [b.n, `${b.n}º bimestre · ${b.rotulo}`]), value: d0.bim, required: true, attrs: 'disabled', hint: 'Somente o 3º bimestre está aberto para digitação.' })}
              </div>
            </fieldset>
            <fieldset class="form-section"><legend>2. Desempenho</legend>
              <div class="form-grid">
                ${K.field({ id: 'f-media', label: 'Média do bimestre', value: d0.media === '' || d0.media == null ? '' : K.fmtMedia(d0.media), required: true, placeholder: 'Ex.: 8,5', attrs: 'inputmode="decimal" data-min="0" data-max="10" style="max-width:160px;font-family:var(--font-mono);font-size:20px"', hint: 'De 0 a 10, com até uma casa decimal.' })}
              </div>
              <div class="field"><span class="field-label" id="tags-lbl">Tags pedagógicas <small class="muted">(opcional, escolha quantas quiser)</small></span>
                <div class="tag-picker" role="group" aria-labelledby="tags-lbl">${D.tags.map((t) => `<label class="tag-option"><input type="checkbox" name="tags" value="${t.id}" ${d0.tags.includes(t.id) ? 'checked' : ''}><span>${K.esc(t.nome)}</span></label>`).join('')}</div>
                <span class="hint">Classificações pedagógicas, não diagnósticos. Ajudam a coordenação a gerar relatórios por perfil.</span></div>
            </fieldset>
            <fieldset class="form-section"><legend>3. Relato para a família</legend>
              ${K.field({ id: 'f-desc', label: 'Descrição do acompanhamento', type: 'textarea', value: d0.desc, required: true, attrs: 'data-minlen="60" maxlength="1200" rows="8"', placeholder: 'Conte como foi o bimestre: participação, conquistas, pontos de atenção e uma sugestão prática para casa.', hint: '<span id="desc-count">0</span>/1200 caracteres · mínimo 60. Escreva em linguagem acessível para a família.' })}
              <details class="tips"><summary>${I('sparkle', 'icon-sm')} Dicas para um bom relato</summary><ul><li>Comece por algo positivo e concreto.</li><li>Cite o conteúdo trabalhado (ex.: frações, mapas).</li><li>Aponte um ponto de atenção sem rótulos.</li><li>Termine com uma sugestão que a família possa apoiar.</li></ul></details>
            </fieldset>
            <div class="action-bar">
              <a class="btn btn-ghost" href="${r ? '#/professor/registros/' + r.id : '#/professor/painel'}">Cancelar</a><span class="grow"></span>
              <button type="button" class="btn btn-secondary" data-action="reg-rascunho">${I('save')} Salvar rascunho</button>
              <button type="button" class="btn btn-secondary" data-action="reg-previa">${I('eye')} Pré-visualizar</button>
              <button type="submit" class="btn btn-primary">${I('send')} ${r && r.status === 'devolvido' ? 'Reenviar para revisão' : 'Enviar para revisão'}</button>
            </div>
          </form>
          <aside class="stack">
            <section class="card tight stack-sm"><h2 style="font-size:16px">${I('info')} Como funciona</h2>${K.stepper(r ? r.status : 'rascunho')}<p class="muted" style="font-size:13px">Depois de enviado, o registro vai para a coordenação. Ela pode publicar para a família ou devolver com comentários.</p></section>
            ${r ? `<section class="card tight"><h2 style="font-size:16px">Histórico</h2>${K.timeline(r)}</section>` : ''}
            <section class="card tight stack-sm"><h2 style="font-size:16px">${I('shield')} Privacidade</h2><p class="muted" style="font-size:13px">Somente os responsáveis vinculados a este aluno verão o relato, e apenas após a publicação.</p></section>
          </aside>
        </div>`);
    },
    mount: (root, p) => {
      const f = K.qs('#reg-form', root); if (!f) return;
      const r = p.id ? A.rel(p.id) : null;
      const desc = K.qs('#f-desc'); const cnt = K.qs('#desc-count');
      const upd = () => { cnt.textContent = desc.value.length; };
      desc.addEventListener('input', upd); upd();
      // Ao escolher o aluno, atualiza turma e disciplinas possíveis
      const selA = K.qs('#f-aluno'), selD = K.qs('#f-disc');
      selA.addEventListener('change', () => {
        const a = A.aluno(selA.value); K.qs('#f-turma').value = a ? A.turma(a.turma).nome : '';
        if (a) { const ds = minhas().filter((v) => v.turma === a.turma).map((v) => v.disc); selD.innerHTML = '<option value="">Selecione a disciplina</option>' + ds.map((d) => `<option value="${d}">${A.disc(d).nome}</option>`).join(''); if (ds.length === 1) selD.value = ds[0]; }
      });
      const coletar = () => ({ id: r ? r.id : undefined, aluno: selA.value, disc: selD.value, turma: A.aluno(selA.value) ? A.aluno(selA.value).turma : '', prof: PID, bim: BIM, ano: 2026,
        media: Number(K.qs('#f-media').value.replace(',', '.')), tags: K.qsa('input[name=tags]:checked').map((c) => c.value), desc: desc.value.trim() });
      const duplicado = (d) => { const ex = regDe(d.aluno, d.disc); return ex && (!r || ex.id !== r.id) ? ex : null; };
      // Rascunho exige apenas aluno e disciplina
      K.actions['reg-rascunho'] = () => {
        const d = coletar();
        if (!d.aluno || !d.disc) { K.validate(K.qs('.form-section', f)); K.toast('Escolha aluno e disciplina', 'São necessários para salvar o rascunho.', 'err', false); return; }
        const ex = duplicado(d); if (ex) { K.toast('Já existe um registro', 'Abra o registro existente para este aluno e disciplina.', 'err', false); return; }
        if (isNaN(d.media) || K.qs('#f-media').value.trim() === '') d.media = null;
        const salvo = A.salvarRegistro({ ...d, status: r ? r.status : 'rascunho' });
        if (r) salvo.historico.push({ quem: PNOME, papel: 'Professor', quando: 'agora', acao: 'Rascunho atualizado', de: null, para: salvo.status });
        K.toast('Rascunho salvo nesta sessão', 'Fica disponível enquanto a página estiver aberta.');
        K.go(`#/professor/registro/${salvo.id}/editar`);
      };
      const validar = () => { if (!K.validate(f)) { K.toast('Revise os campos destacados', 'Há informações obrigatórias faltando ou fora da escala.', 'err', false); return null; } const d = coletar(); const ex = duplicado(d); if (ex) { K.toast('Já existe um registro', `${A.aluno(d.aluno).nome} já tem ${A.disc(d.disc).nome} no ${BIM}º bimestre.`, 'err', false); return null; } return d; };
      K.actions['reg-previa'] = () => {
        const d = validar(); if (!d) return;
        const salvo = A.salvarRegistro({ ...d, status: r ? r.status : 'rascunho' });
        K.go(`#/professor/registro/${salvo.id}/previa`);
      };
      f.addEventListener('submit', (e) => { e.preventDefault(); const d = validar(); if (!d) return; const salvo = A.salvarRegistro({ ...d, status: r ? r.status : 'rascunho' }); confirmarEnvio(salvo); });
    }
  };

  // Modal de confirmação do envio (reaproveitado no formulário e na prévia)
  function confirmarEnvio(r) {
    const a = A.aluno(r.aluno);
    K.modal(`${K.modalHead('send', 'ico-blue', r.status === 'devolvido' ? 'Reenviar para revisão?' : 'Enviar para revisão?', `${a.nome} · ${A.disc(r.disc).nome} · ${r.bim}º bimestre`)}
      <div class="publish-preview"><div class="row-between"><span class="eyebrow">Média</span><b class="mono" style="font-size:22px">${K.fmtMedia(r.media)}</b></div>${K.tags(r.tags)}</div>
      <div class="alert info">${I('lock')}<div>Depois de enviar, você <b>não poderá editar</b> até a coordenação concluir a revisão ou devolver o registro.</div></div>
      <div class="modal-foot"><button class="btn btn-secondary" data-action="close-modal">Voltar e revisar</button><button class="btn btn-primary" data-action="envio-ok">${I('send')} Confirmar envio</button></div>`);
    K.actions['envio-ok'] = () => { A.mudarStatus(r.id, 'enviado', PNOME, 'Professor'); K.closeModal(); K.toast('Enviado para revisão', 'A coordenação foi avisada (simulação).'); K.go(`#/professor/registros/${r.id}`); };
  }

  /* ======================= PRÉVIA ======================= */
  const previa = {
    title: 'Pré-visualização',
    render: (p) => {
      const r = A.rel(p.id); if (!r || r.prof !== PID) return S('', K.deny('professor'));
      const a = A.aluno(r.aluno);
      return S('registros', `
        ${K.pageHead({ crumbs: [{ label: 'Professor', href: '#/professor/painel' }, { label: 'Pré-visualização' }], title: 'Como a família verá', lead: 'Confira o texto e a média antes de enviar. Esta é a visão do responsável após a publicação.', actions: K.status(r.status) })}
        <div class="alert neutral">${I('eye')}<div>Pré-visualização local. Nada foi enviado ainda.</div></div>
        <article class="card report-doc" aria-label="Prévia do relatório">
          <header class="report-head"><div class="row">${K.avatar(a.nome, a.cor, 'lg')}<div><h2 style="font-size:24px">${a.nome}</h2><span class="muted" style="font-size:13px">${A.disc(r.disc).nome} · ${r.bim}º bimestre de ${r.ano} · ${A.turma(r.turma).nome} · Prof. ${PNOME}</span></div></div>
            <div class="media-box sm"><span class="eyebrow">Média</span><b class="media-val">${K.fmtMedia(r.media)}</b></div></header>
          ${K.tags(r.tags)}
          <div class="desc-text">${K.esc(r.desc)}</div>
        </article>
        <div class="action-bar"><a class="btn btn-secondary" href="#/professor/registro/${r.id}/editar">${I('pencil')} Voltar e editar</a><span class="grow"></span><button class="btn btn-primary" data-action="enviar-previa">${I('send')} Enviar para revisão</button></div>`);
    },
    mount: (root, p) => { const r = A.rel(p.id); if (!r) return; K.actions['enviar-previa'] = () => (editavel(r.status) ? confirmarEnvio(r) : K.toast('Registro já enviado', '', 'info', false)); }
  };

  /* ======================= MEUS REGISTROS ======================= */
  const registros = {
    title: 'Meus registros',
    render: (p, q) => {
      const st = q.status || '';
      const base = A.relsFiltrados({ prof: PID }).filter((r) => r.bim === BIM || st);
      const list = st ? base.filter((r) => r.status === st) : base;
      const n = (s) => A.relsFiltrados({ prof: PID, status: s }).length;
      return S('registros', `
        ${K.pageHead({ crumbs: [{ label: 'Professor', href: '#/professor/painel' }, { label: 'Meus registros' }], title: 'Meus registros', lead: 'Acompanhe em que etapa da revisão está cada registro que você criou.' })}
        <nav class="tabs" aria-label="Filtrar por status">${[['', 'Todos (3º bim)'], ['rascunho', 'Rascunhos'], ['enviado', 'Enviados'], ['revisao', 'Em revisão'], ['devolvido', 'Devolvidos'], ['publicado', 'Publicados']].map(([k, l]) => `<a href="#/professor/registros${k ? '?status=' + k : ''}" ${k === st ? 'aria-current="page"' : ''}>${l}${k ? ` <span class="count">${n(k)}</span>` : ''}</a>`).join('')}</nav>
        <section class="card">${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Aluno</th><th>Disciplina</th><th>Bimestre</th><th>Média</th><th>Status</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>
          ${list.map((r) => { const a = A.aluno(r.aluno); return `<tr><td class="cell-main"><div class="cell-person">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b><small>${A.turma(r.turma).nome}</small></span></div></td><td data-label="Disciplina">${A.disc(r.disc).nome}</td><td data-label="Bimestre">${r.bim}º</td><td data-label="Média" class="mono">${K.fmtMedia(r.media)}</td><td data-label="Status">${K.status(r.status)}</td><td class="actions">${editavel(r.status) ? `<a class="btn ${r.status === 'devolvido' ? 'btn-danger' : 'btn-secondary'} btn-sm" href="#/professor/registro/${r.id}/editar">${r.status === 'devolvido' ? 'Ajustar' : 'Continuar'}</a>` : ''}<a class="btn btn-ghost btn-sm" href="#/professor/registros/${r.id}">${I('eye', 'icon-sm')} Ver</a></td></tr>`; }).join('')}
          </tbody></table></div>` : K.empty({ icon: 'check-circle', title: st === 'devolvido' ? 'Nenhum registro devolvido' : 'Nada por aqui', text: st === 'devolvido' ? 'Ótimo! A coordenação não pediu ajustes nos seus registros.' : 'Não há registros com este status no momento.', actions: '<a class="btn btn-secondary" href="#/professor/registros">Ver todos</a>' })}</section>`);
    }
  };

  /* ======================= REGISTRO — DETALHE ======================= */
  const regDet = {
    title: 'Registro',
    render: (p) => {
      const r = A.rel(p.id); if (!r || r.prof !== PID) return S('', K.deny('professor'));
      const a = A.aluno(r.aluno);
      const msg = {
        rascunho: ['neutral', 'pencil', 'Rascunho', 'Só você vê este registro. Envie para revisão quando estiver pronto.'],
        enviado: ['info', 'send', 'Aguardando a coordenação', 'A revisão ainda não começou. Você será avisado quando houver retorno.'],
        revisao: ['warning', 'review', 'Em revisão pela coordenação', 'A edição está bloqueada enquanto a coordenação analisa.'],
        publicado: ['success', 'check-circle', 'Publicado para a família', r.lido ? 'O responsável registrou ciência deste relatório.' : 'O responsável ainda não abriu o relatório.'],
        devolvido: ['danger', 'undo', 'Devolvido para ajustes', 'Leia o comentário da coordenação, ajuste e reenvie.'],
        cancelado: ['neutral', 'ban', 'Registro cancelado', 'Este registro não será publicado.']
      }[r.status];
      return S('registros', `
        ${K.pageHead({ crumbs: [{ label: 'Meus registros', href: '#/professor/registros' }, { label: a.nome }], title: `${a.nome} · ${A.disc(r.disc).nome}`, lead: `${A.turma(r.turma).nome} · ${r.bim}º bimestre de ${r.ano}`, actions: K.status(r.status) })}
        ${K.stepper(r.status)}
        <div class="alert ${msg[0]}">${I(msg[1])}<div class="grow"><b>${msg[2]}</b>${msg[3]}</div>${editavel(r.status) ? `<a class="btn ${r.status === 'devolvido' ? 'btn-danger' : 'btn-primary'} btn-sm" href="#/professor/registro/${r.id}/editar">${r.status === 'devolvido' ? 'Ajustar registro' : 'Continuar edição'}</a>` : ''}</div>
        <div class="grid-main-side">
          <div class="stack">
            <section class="card stack">
              <div class="grid-2"><div class="media-box"><span class="eyebrow">Média do bimestre</span><b class="media-val">${K.fmtMedia(r.media)}</b></div><div class="stack-sm"><span class="eyebrow">Tags</span>${r.tags.length ? K.tags(r.tags) : '<span class="muted">Nenhuma tag</span>'}</div></div>
              <div class="stack-sm"><span class="eyebrow">Descrição</span><div class="desc-text">${K.esc(r.desc)}</div></div>
            </section>
            ${r.comentarios.length ? `<section class="card"><h2 style="font-size:18px">Comentários da coordenação</h2>${r.comentarios.map((c) => `<div class="comment">${K.avatar(c.quem, '#FFC94A', 'sm')}<div><b>${c.quem}</b> <small class="muted">· ${c.papel} · ${c.quando}</small><p>${K.esc(c.texto)}</p></div></div>`).join('')}</section>` : ''}
          </div>
          <aside class="stack">${K.retornoFamilia(r)}<section class="card"><h2 style="font-size:18px">${I('clock')} Histórico</h2>${K.timeline(r)}</section></aside>
        </div>`);
    }
  };

  /* ======================= PERFIL ======================= */
  const perfil = {
    title: 'Meu perfil',
    render: () => { const pr = A.prof(PID); return S('', `
      ${K.pageHead({ crumbs: [{ label: 'Professor', href: '#/professor/painel' }, { label: 'Meu perfil' }], title: 'Meu perfil e preferências' })}
      <div class="grid-2">
        <form id="pp" class="card stack" novalidate><div class="row">${K.avatar(pr.nome, pr.cor, 'xl')}<div><b style="font-size:20px">${pr.nome}</b><div class="muted">${pr.disc.map((d) => A.disc(d).nome).join(' · ')}</div></div></div>
          ${K.field({ id: 'pp-email', label: 'E-mail institucional', type: 'email', value: pr.email, required: true })}
          ${K.field({ id: 'pp-tel', label: 'Telefone', value: pr.tel })}
          <div class="form-actions"><button class="btn btn-primary">${I('save')} Salvar</button></div></form>
        <section class="card stack"><h2 style="font-size:18px">Avisos</h2>${[['Registro devolvido para ajustes', true], ['Registro publicado', true], ['Ciência das famílias', true], ['Lembrete de prazo do bimestre', true]].map(([l, on]) => `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''}><span class="track"></span>${l}</label>`).join('')}</section>
      </div>`); },
    mount: (root) => K.qs('#pp', root).addEventListener('submit', (e) => { e.preventDefault(); if (K.validate(e.target)) K.toast('Preferências salvas nesta sessão'); })
  };

  K.route('/professor', painel); K.route('/professor/painel', painel);
  K.route('/professor/turmas', turmas); K.route('/professor/turmas/:id', turmaDet);
  K.route('/professor/alunos/:id', aluno);
  K.route('/professor/registro/novo', form); K.route('/professor/registro/:id/editar', form); K.route('/professor/registro/:id/previa', previa);
  K.route('/professor/registros', registros); K.route('/professor/registros/:id', regDet);
  K.route('/professor/perfil', perfil);
})(window.KFKA);
