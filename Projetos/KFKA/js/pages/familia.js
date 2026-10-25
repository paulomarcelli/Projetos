/* =========================================================
   KFKA — Área do Responsável (família)
   Regra central: a família só vê alunos VINCULADOS à sua conta e
   somente relatórios PUBLICADOS (via KFKA.api.relsDaFamilia).
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon, A = K.api, D = K.data;
  const RID = 'r1';                                   // responsável logado (simulação)
  const S = (active, html) => K.shell('familia', active, html);
  const resp = () => A.resp(RID);
  const vinculado = (id) => resp().alunos.includes(id);
  // Resolve o aluno a partir da query (?aluno=) ou do estado; bloqueia não vinculados
  const alunoAtual = (q) => {
    if (q.aluno) { if (!vinculado(q.aluno)) return null; K.state.alunoSel = q.aluno; }
    return A.aluno(K.state.alunoSel);
  };
  const rels = (a) => A.relsDaFamilia(RID, a.id);
  const ultimoBim = (rs) => Math.max(0, ...rs.map((r) => r.bim));
  const tomMedia = (m) => (m >= 8 ? 'ok' : m >= 6 ? 'mid' : 'low');
  const negado = () => S('', K.deny('familia'));
  const seletorAluno = (a, base) => resp().alunos.length > 1 ? `<div class="segmented" role="group" aria-label="Aluno">${resp().alunos.map((id) => { const x = A.aluno(id); return `<a href="${base}${base.includes('?') ? '&' : '?'}aluno=${id}" ${id === a.id ? 'aria-current="page"' : ''}>${x.nome.trim().split(/\s+/)[0]} · ${A.turma(x.turma).nome}</a>`; }).join('')}</div>` : '';

  /* ======================= SELECIONAR ALUNO ======================= */
  const selecionar = {
    title: 'Escolha o aluno',
    render: () => `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div class="pick-screen" id="conteudo">
        <a class="logo" href="#/">${K.mark()}<span class="word">KFKA</span></a>
        <div class="stack-sm" style="text-align:center"><h1 id="page-title" tabindex="-1">Quem você quer acompanhar?</h1><p class="lead">Olá, ${resp().nome.trim().split(/\s+/)[0]}. Escolha um dos alunos vinculados à sua conta.</p></div>
        <div class="pick-grid">${resp().alunos.map((id) => { const a = A.aluno(id); const t = A.turma(a.turma); const novos = rels(a).filter((r) => !r.lido).length; return `<a class="pick-card" href="#/familia/painel?aluno=${a.id}" data-action="pick-aluno" data-id="${a.id}">
          <span class="pick-avatar" style="background:${a.cor}">${K.initials(a.nome)}</span><b>${a.nome.trim().split(/\s+/)[0]}</b><small>${t.nome} · ${t.turno}</small>${novos ? `<span class="status nao-lido">${I('bell')}${novos} novo${novos > 1 ? 's' : ''}</span>` : '<span class="status lido">' + I('check') + 'Tudo lido</span>'}</a>`; }).join('')}</div>
        <div class="alert neutral" style="max-width:520px">${I('shield')}<div>Você vê apenas os alunos vinculados pela escola à sua conta. Algum aluno faltando? Fale com a secretaria.</div></div>
        <a class="btn btn-ghost" href="#/entrar">${I('logout')} Sair</a>
      </div>`
  };

  /* ======================= PAINEL ======================= */
  const painel = {
    title: 'Início da família',
    render: (p, q) => {
      const a = alunoAtual(q); if (!a) return negado();
      const t = A.turma(a.turma);
      const rs = rels(a);
      const bim = Number(q.bim) || ultimoBim(rs) || 1;
      const doBim = rs.filter((r) => r.bim === bim);
      const novos = rs.filter((r) => !r.lido);
      const media = doBim.length ? doBim.reduce((s, r) => s + r.media, 0) / doBim.length : null;
      const ant = rs.filter((r) => r.bim === bim - 1);
      const mAnt = ant.length ? ant.reduce((s, r) => s + r.media, 0) / ant.length : null;
      return S('painel', `
        <header class="page-head"><div class="stack-sm"><h1 id="page-title" tabindex="-1">Acompanhamento de ${a.nome.trim().split(/\s+/)[0]}</h1><p class="lead">${t.nome} · ${t.turno} · ${D.escola.nome}</p></div>${seletorAluno(a, '#/familia/painel')}</header>
        ${novos.length ? `<section class="card new-report" aria-label="Novidade"><span class="ico ico-ok">${I('sparkle')}</span><div class="grow"><h2 style="font-size:20px">Novo relatório de ${A.disc(novos[0].disc).nome}</h2><p class="text-2">${novos[0].bim}º bimestre${novos.length > 1 ? ` · e mais ${K.plural(novos.length - 1, 'relatório')} aguardando sua leitura.` : ' · a escola acabou de publicar.'}</p></div><a class="btn btn-primary" href="#/familia/relatorios/${novos[0].id}">Ler agora ${I('chevron-right', 'icon-sm')}</a></section>` : ''}
        ${K.bimTabs(bim, `#/familia/painel?aluno=${a.id}`, { disableFuture: true })}
        ${doBim.length ? `
        <section class="grid-3">
          <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-blue">${I('chart', 'icon-sm')}</span><span class="lbl">Média geral do ${bim}º bimestre</span></div><div class="val">${K.fmtMedia(media)}</div>${mAnt != null ? `<span class="delta" style="color:${media >= mAnt ? 'var(--st-publicado)' : 'var(--st-devolvido)'}">${media >= mAnt ? '▲' : '▼'} ${K.fmtMedia(Math.abs(media - mAnt))} em relação ao ${bim - 1}º</span>` : ''}</div>
          <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-ok">${I('file', 'icon-sm')}</span><span class="lbl">Relatórios publicados</span></div><div class="val">${doBim.length}</div><span class="delta muted">de ${D.disciplinas.length} disciplinas</span></div>
          <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-warn">${I('eye', 'icon-sm')}</span><span class="lbl">Ainda não lidos</span></div><div class="val">${doBim.filter((r) => !r.lido).length}</div><a class="delta" href="#/familia/relatorios?aluno=${a.id}&bim=${bim}">ver lista</a></div>
        </section>
        <section class="stack"><h2 style="font-size:20px">Disciplinas no ${bim}º bimestre</h2>
          <div class="grid-4 disc-grid">${doBim.map((r) => { const ar = A.area(A.disc(r.disc).area); return `<a class="card card-link disc-card" href="#/familia/relatorios/${r.id}">
            <div class="row-between"><span class="area-dot" style="background:${ar.cor}" aria-hidden="true"></span>${r.lido ? K.status('lido', true) : K.status('nao-lido', true)}</div>
            <b>${A.disc(r.disc).nome}</b><span class="nota ${tomMedia(r.media)}"><span class="sr-only">Média </span>${K.fmtMedia(r.media)}</span>
            <small class="muted">Prof. ${A.prof(r.prof).nome}</small></a>`; }).join('')}</div>
          ${D.disciplinas.length > doBim.length ? `<p class="muted" style="font-size:13px">${I('info', 'icon-sm')} ${K.plural(D.disciplinas.length - doBim.length, 'disciplina')} ainda em preparação pela escola. Elas aparecem aqui assim que forem publicadas.</p>` : ''}
        </section>` : `<section class="card">${K.empty({ icon: 'book-open', title: `Nenhum relatório publicado no ${bim}º bimestre`, text: `Os professores de ${a.nome.trim().split(/\s+/)[0]} ainda estão finalizando os acompanhamentos. Você receberá um aviso assim que a coordenação publicar.`, actions: `<a class="btn btn-secondary" href="#/familia/historico?aluno=${a.id}">${I('clock')} Ver bimestres anteriores</a>` })}</section>`}
        <section class="card"><div class="card-head"><div><h2>Evolução da média geral</h2><p>Bimestres publicados em ${D.escola.ano}</p></div></div>
          <div class="vbars" role="img" aria-label="Médias por bimestre">${D.bimestres.map((b) => { const x = rs.filter((r) => r.bim === b.n); const m = x.length ? x.reduce((s, r) => s + r.media, 0) / x.length : null; return `<div class="col"><span class="v">${m != null ? K.fmtMedia(m) : '—'}</span><span class="b ${b.n === bim ? '' : 'light'}" style="height:${m != null ? m * 10 : 4}%"></span><span class="l">${b.n}º BIM</span></div>`; }).join('')}</div>
        </section>`);
    }
  };

  /* ======================= RELATÓRIOS (lista + filtros) ======================= */
  const relatorios = {
    title: 'Relatórios',
    render: (p, q) => {
      const a = alunoAtual(q); if (!a) return negado();
      const rs = rels(a);
      const f = { bim: q.bim || '', disc: q.disc || '', lido: q.lido || '' };
      const list = rs.filter((r) => (!f.bim || r.bim === Number(f.bim)) && (!f.disc || r.disc === f.disc) && (!f.lido || String(r.lido) === f.lido)).sort((x, y) => y.bim - x.bim);
      const discsDisp = [...new Set(rs.map((r) => r.disc))];
      return S('relatorios', `
        ${K.pageHead({ crumbs: [{ label: 'Início', href: '#/familia/painel' }, { label: 'Relatórios' }], title: `Relatórios de ${a.nome.trim().split(/\s+/)[0]}`, lead: 'Somente relatórios revisados e publicados pela coordenação aparecem aqui.', actions: seletorAluno(a, '#/familia/relatorios') })}
        <form class="card tight filters-panel" id="ff" aria-label="Filtros">
          <div class="form-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
            ${K.field({ id: 'ff-ano', label: 'Ano letivo', options: [['2026', '2026']], value: '2026' })}
            ${K.field({ id: 'ff-bim', label: 'Bimestre', options: [['', 'Todos'], ...D.bimestres.filter((b) => b.status !== 'agendado').map((b) => [b.n, b.n + 'º bimestre'])], value: f.bim })}
            ${K.field({ id: 'ff-disc', label: 'Disciplina', options: [['', 'Todas'], ...discsDisp.map((d) => [d, A.disc(d).nome])], value: f.disc })}
            ${K.field({ id: 'ff-lido', label: 'Leitura', options: [['', 'Todos'], ['false', 'Não lidos'], ['true', 'Lidos']], value: f.lido })}
          </div>
          ${f.bim || f.disc || f.lido ? `<div class="active-filters row">${f.bim ? `<span class="pill">${f.bim}º bimestre</span>` : ''}${f.disc ? `<span class="pill">${A.disc(f.disc).nome}</span>` : ''}${f.lido ? `<span class="pill">${f.lido === 'true' ? 'Lidos' : 'Não lidos'}</span>` : ''}<a class="link-btn" href="#/familia/relatorios?aluno=${a.id}">Limpar filtros</a></div>` : ''}
        </form>
        ${list.length ? `<div class="report-list">${list.map((r) => `<a class="card card-link report-item" href="#/familia/relatorios/${r.id}">
            <span class="nota ${tomMedia(r.media)}">${K.fmtMedia(r.media)}</span>
            <div class="grow stack-sm"><div class="row" style="gap:8px"><b style="font-size:16px">${A.disc(r.disc).nome}</b><span class="muted" style="font-size:13px">· ${r.bim}º bimestre · Prof. ${A.prof(r.prof).nome}</span></div><p class="text-2 clamp-2" style="font-size:14px">${K.esc(r.desc)}</p>${K.tags(r.tags)}</div>
            ${r.lido ? K.status('lido', true) : K.status('nao-lido', true)}</a>`).join('')}</div>`
          : `<section class="card">${K.empty({ icon: 'search', title: rs.length ? 'Nenhum relatório com esses filtros' : 'Ainda não há relatórios publicados', text: rs.length ? 'Tente outro bimestre ou disciplina.' : 'Quando a escola publicar, eles aparecerão aqui.', actions: rs.length ? `<a class="btn btn-secondary" href="#/familia/relatorios?aluno=${a.id}">Limpar filtros</a>` : '' })}</section>`}`);
    },
    mount: (root) => {
      const ff = K.qs('#ff', root); if (!ff) return;
      ff.addEventListener('change', () => {
        const ps = new URLSearchParams({ aluno: K.state.alunoSel });
        [['bim', '#ff-bim'], ['disc', '#ff-disc'], ['lido', '#ff-lido']].forEach(([k, s]) => { const v = K.qs(s).value; if (v) ps.set(k, v); });
        K.go('#/familia/relatorios?' + ps.toString());
      });
    }
  };

  /* ======================= RELATÓRIO — DETALHE ======================= */
  const detalhe = {
    title: 'Relatório',
    render: (p) => {
      const r = A.rel(p.id);
      // Bloqueio: não vinculado ou não publicado → acesso negado
      if (!r || !vinculado(r.aluno) || r.status !== 'publicado') return negado();
      const a = A.aluno(r.aluno); K.state.alunoSel = a.id;
      const hist = A.relsDaFamilia(RID, a.id).filter((x) => x.disc === r.disc).sort((x, y) => x.bim - y.bim);
      const ant = hist.find((x) => x.bim === r.bim - 1);
      const pub = (r.historico.find((h) => h.para === 'publicado') || {}).quando || '—';
      return S('relatorios', `
        ${K.pageHead({ crumbs: [{ label: 'Relatórios', href: `#/familia/relatorios?aluno=${a.id}` }, { label: `${A.disc(r.disc).nome} · ${r.bim}º bim` }], title: A.disc(r.disc).nome, lead: `${a.nome} · ${A.turma(r.turma).nome} · ${r.bim}º bimestre de ${r.ano} · publicado em ${pub}`, actions: `<button class="btn btn-secondary" data-action="baixar-pdf">${I('download')} Baixar PDF</button><a class="btn btn-secondary" href="#/familia/imprimir/${r.id}">${I('printer')} Ver para impressão</a>` })}
        <div class="grid-main-side">
          <div class="stack">
            <article class="card report-doc">
              <header class="report-head"><div class="row">${K.avatar(A.prof(r.prof).nome, A.prof(r.prof).cor)}<div><b>Prof. ${A.prof(r.prof).nome}</b><div class="muted" style="font-size:13px">${A.area(A.disc(r.disc).area).nome}</div></div></div>
                <div class="media-box sm"><span class="eyebrow">Média</span><b class="media-val">${K.fmtMedia(r.media)}</b>${ant ? `<small style="font-weight:700;color:${r.media >= ant.media ? 'var(--st-publicado)' : 'var(--st-devolvido)'}">${r.media >= ant.media ? '▲' : '▼'} ${K.fmtMedia(Math.abs(r.media - ant.media))} vs. ${ant.bim}º bim</small>` : ''}</div></header>
              <div class="stack-sm"><span class="eyebrow">Destaques</span>${K.tags(r.tags)}</div>
              <div class="stack-sm"><span class="eyebrow">O que o professor observou</span><div class="desc-text lg">${K.esc(r.desc)}</div></div>
            </article>
            <section class="card stack" id="ciencia">
              ${r.lido ? `<div class="alert success">${I('check-circle')}<div><b>Você registrou ciência deste relatório</b>A escola foi avisada (simulação local).</div></div>` : `<div class="row-between"><div><h2 style="font-size:18px">Confirme a leitura</h2><p class="text-2" style="font-size:14px">Avise a escola que você leu este relatório.</p></div><button class="btn btn-success" data-action="marcar-lido" data-id="${r.id}">${I('check')} Li e estou ciente</button></div>`}
              <form id="obs-form" class="stack-sm" novalidate>
                ${r.observacao ? `<div class="comment">${K.avatar(r.observacao.quem, '#5FD4A8', 'sm')}<div><b>Sua observação</b> <small class="muted">· ${r.observacao.quando}</small><p>${K.esc(r.observacao.texto)}</p><small class="muted">${I('eye', 'icon-sm')}Visível para o professor e a coordenação.</small></div></div>` : K.field({ id: 'obs', label: 'Observação para a escola (opcional)', type: 'textarea', attrs: 'data-minlen="10" maxlength="500" rows="3"', placeholder: 'Ex.: Vamos reforçar a revisão do caderno em casa.', hint: 'Será lida pela coordenação e pelo professor.' }) + `<div class="form-actions"><button class="btn btn-secondary">${I('message')} Enviar observação</button></div>`}
              </form>
            </section>
          </div>
          <aside class="stack">
            <section class="card"><h2 style="font-size:18px">Evolução em ${A.disc(r.disc).nome}</h2>
              <div class="vbars" style="height:160px" role="img" aria-label="Médias por bimestre">${D.bimestres.map((b) => { const x = hist.find((h) => h.bim === b.n); return `<div class="col"><span class="v">${x ? K.fmtMedia(x.media) : '—'}</span><span class="b ${b.n === r.bim ? '' : 'light'}" style="height:${x ? x.media * 10 : 4}%"></span><span class="l">${b.n}º</span></div>`; }).join('')}</div></section>
            <section class="card tight stack-sm"><h2 style="font-size:16px">Outros relatórios do ${r.bim}º bimestre</h2>${A.relsDaFamilia(RID, a.id).filter((x) => x.bim === r.bim && x.id !== r.id).map((x) => `<a class="row list-link" href="#/familia/relatorios/${x.id}"><span class="grow"><b>${A.disc(x.disc).nome}</b></span><span class="mono">${K.fmtMedia(x.media)}</span>${I('chevron-right', 'icon-sm')}</a>`).join('') || '<p class="muted">Nenhum outro publicado.</p>'}</section>
          </aside>
        </div>`);
    },
    mount: (root, p) => {
      const r = A.rel(p.id); if (!r || r.status !== 'publicado' || !vinculado(r.aluno)) return;
      K.actions['marcar-lido'] = () => { r.lido = true; r.historico.push({ quem: resp().nome, papel: 'Responsável', quando: 'agora', acao: 'Ciência registrada', de: null, para: null }); K.toast('Ciência registrada', 'O professor verá sua confirmação (simulação).'); K.refresh(); };
      const f = K.qs('#obs-form', root);
      f && f.addEventListener('submit', (e) => { e.preventDefault(); const t = K.qs('#obs'); if (!t) return; if (!t.value.trim()) { K.toast('Escreva sua observação', 'O campo está vazio.', 'err', false); t.focus(); return; } if (!K.validate(f)) return; r.observacao = { texto: t.value.trim(), quem: resp().nome, papel: 'Responsável', quando: 'agora' }; r.historico.push({ quem: resp().nome, papel: 'Responsável', quando: 'agora', acao: 'Observação enviada', de: null, para: null }); K.toast('Observação enviada', 'Registrada apenas nesta sessão de demonstração.'); K.refresh(); });
    }
  };

  /* ======================= HISTÓRICO ======================= */
  const historico = {
    title: 'Histórico por bimestre',
    render: (p, q) => {
      const a = alunoAtual(q); if (!a) return negado();
      const rs = rels(a);
      const bims = D.bimestres.filter((b) => b.status !== 'agendado');
      return S('historico', `
        ${K.pageHead({ crumbs: [{ label: 'Início', href: '#/familia/painel' }, { label: 'Histórico' }], title: `Histórico de ${a.nome.trim().split(/\s+/)[0]}`, lead: `Médias publicadas por disciplina e bimestre · ${D.escola.ano}`, actions: seletorAluno(a, '#/familia/historico') })}
        <section class="card flush"><div class="table-wrap"><table class="table hist-table"><caption class="sr-only">Médias por disciplina e bimestre</caption><thead><tr><th scope="col">Disciplina</th>${bims.map((b) => `<th scope="col">${b.n}º bim</th>`).join('')}<th scope="col">Tendência</th></tr></thead><tbody>
          ${D.disciplinas.map((d) => { const vals = bims.map((b) => rs.find((r) => r.disc === d.id && r.bim === b.n)); const nums = vals.filter(Boolean).map((r) => r.media); const tr = nums.length > 1 ? nums[nums.length - 1] - nums[0] : 0; return `<tr><th scope="row" class="cell-main"><span class="row" style="gap:8px"><span class="area-dot" style="background:${A.area(d.area).cor}" aria-hidden="true"></span>${d.nome}</span></th>${vals.map((r, i) => `<td data-label="${bims[i].n}º bim">${r ? `<a class="nota sm ${tomMedia(r.media)}" href="#/familia/relatorios/${r.id}" aria-label="${d.nome}, ${bims[i].n}º bimestre: ${K.fmtMedia(r.media)}">${K.fmtMedia(r.media)}</a>` : '<span class="muted" title="Ainda não publicado">—</span>'}</td>`).join('')}<td data-label="Tendência">${nums.length > 1 ? `<span class="trend ${tr > 0 ? 'up' : tr < 0 ? 'down' : ''}">${tr > 0 ? '▲ subiu' : tr < 0 ? '▼ caiu' : '● estável'}</span>` : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
        </tbody></table></div></section>
        <p class="muted" style="font-size:13px">${I('info', 'icon-sm')} “—” indica que o relatório ainda não foi publicado pela escola.</p>`);
    }
  };

  /* ======================= IMPRESSÃO / PDF ======================= */
  const imprimir = {
    title: 'Imprimir relatório',
    render: (p) => {
      const r = A.rel(p.id);
      if (!r || !vinculado(r.aluno) || r.status !== 'publicado') return negado();
      const a = A.aluno(r.aluno); const t = A.turma(r.turma);
      return `<div class="print-toolbar no-print"><a class="btn btn-secondary" href="#/familia/relatorios/${r.id}">${I('chevron-left')} Voltar</a><span class="grow"></span><span class="muted hide-mobile" style="font-size:13px">Use “Salvar como PDF” na janela de impressão do navegador.</span><button class="btn btn-secondary" data-action="baixar-pdf">${I('download')} Baixar PDF</button><button class="btn btn-primary" data-action="print">${I('printer')} Imprimir</button></div>
      <main class="print-page" id="conteudo">
        <header class="pp-head"><div class="logo">${K.mark()}<span><span class="word">KFKA</span><small>${D.escola.nome}</small></span></div><div style="text-align:right"><b>Relatório de acompanhamento</b><div class="muted">${r.bim}º bimestre · ${r.ano}</div></div></header>
        <h1 id="page-title" tabindex="-1" class="sr-only">Relatório para impressão</h1>
        <table class="pp-info"><tr><th>Aluno</th><td>${a.nome}</td><th>RA</th><td>${a.ra}</td></tr><tr><th>Turma</th><td>${t.nome} · ${t.turno}</td><th>Disciplina</th><td>${A.disc(r.disc).nome}</td></tr><tr><th>Professor</th><td>${A.prof(r.prof).nome}</td><th>Média</th><td><b>${K.fmtMedia(r.media)}</b> (escala 0–10)</td></tr></table>
        <h2>Destaques</h2><p>${r.tags.map((id) => D.tags.find((x) => x.id === id).nome).join(' · ') || '—'}</p>
        <h2>Observações do professor</h2><p class="pp-desc">${K.esc(r.desc)}</p>
        <footer class="pp-foot"><span>Documento demonstrativo · dados fictícios · gerado localmente pelo navegador</span><span>Ciência do responsável: ${r.lido ? 'registrada' : 'pendente'}</span></footer>
      </main>`;
    }
  };

  /* ======================= PERFIL ======================= */
  const perfil = {
    title: 'Meu perfil',
    render: () => S('perfil', `
      ${K.pageHead({ crumbs: [{ label: 'Início', href: '#/familia/painel' }, { label: 'Perfil' }], title: 'Meu perfil e preferências' })}
      <div class="grid-2">
        <section class="card stack"><div class="row">${K.avatar(resp().nome, '#5FD4A8', 'xl')}<div><b style="font-size:20px">${resp().nome}</b><div class="muted">${resp().email}</div></div></div>
          <h2 style="font-size:16px">Alunos vinculados</h2>${resp().alunos.map((id) => { const a = A.aluno(id); return `<div class="row">${K.avatar(a.nome, a.cor, 'sm')}<span><b>${a.nome}</b> <small class="muted">· ${A.turma(a.turma).nome}</small></span></div>`; }).join('')}
          <small class="muted">${I('lock', 'icon-sm')} Vínculos são definidos pela secretaria da escola.</small></section>
        <section class="card stack"><h2 style="font-size:16px">Leitura</h2>
          <div class="field"><span class="field-label" id="fs-l">Tamanho do texto</span><div class="segmented" role="group" aria-labelledby="fs-l">${[['1', 'Padrão'], ['1.12', 'Maior'], ['1.25', 'Grande']].map(([v, l]) => `<button type="button" data-fs="${v}" aria-pressed="${(K.state.zoom || '1') === v}">${l}</button>`).join('')}</div></div>
          <h2 style="font-size:16px">Avisos</h2>${[['Novo relatório publicado', true], ['Resposta da escola à minha observação', true], ['Resumo mensal por e-mail', false]].map(([l, on]) => `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''}><span class="track"></span>${l}</label>`).join('')}
          <a class="btn btn-ghost" href="#/privacidade">${I('shield')} Privacidade e LGPD</a></section>
      </div>`),
    mount: (root) => K.qsa('[data-fs]', root).forEach((b) => b.addEventListener('click', () => { K.state.zoom = b.dataset.fs; document.documentElement.style.setProperty('--zoom', b.dataset.fs); K.qsa('[data-fs]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); K.toast('Tamanho do texto ajustado', 'Vale apenas para esta sessão.'); }))
  };

  // RF09 — geração de PDF simulada: mostra o progresso, mas nenhum arquivo é criado
  K.actions['baixar-pdf'] = () => {
    K.modal(`${K.modalHead('file', 'ico-ok', 'Gerando o PDF do relatório', 'Formato A4 · com cabeçalho da escola e ciência do responsável')}<div class="stack-sm"><div class="progress"><span id="pdf-bar" style="width:0%;transition:width 1.1s ease"></span></div><small class="muted" id="pdf-msg">Montando o documento…</small></div><div class="alert neutral">${I('info')}<div>Protótipo: nenhum arquivo é baixado. Na versão funcional, o PDF será gerado pelo servidor.</div></div><div class="modal-foot"><button class="btn btn-primary" data-action="close-modal">Fechar</button></div>`);
    requestAnimationFrame(() => { const b = K.qs('#pdf-bar'); if (b) b.style.width = '100%'; });
    setTimeout(() => { const m = K.qs('#pdf-msg'); if (!m) return; const r = A.rel(K.current.path.split('/').pop()); const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-'); m.textContent = r ? `relatorio-${slug(A.aluno(r.aluno).nome)}-${slug(A.disc(r.disc).nome)}-${r.bim}bim.pdf · pronto (simulação)` : 'PDF pronto (simulação)'; }, 1150);
  };
  K.route('/familia', selecionar); K.route('/familia/selecionar', selecionar);
  K.route('/familia/painel', painel); K.route('/familia/relatorios', relatorios); K.route('/familia/relatorios/:id', detalhe);
  K.route('/familia/historico', historico); K.route('/familia/imprimir/:id', imprimir); K.route('/familia/perfil', perfil);
})(window.KFKA);
