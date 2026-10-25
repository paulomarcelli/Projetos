/* =========================================================
   KFKA — Núcleo do protótipo
   - Namespace global KFKA (scripts clássicos: funciona abrindo o
     index.html direto, sem servidor)
   - Ícones (sprite SVG), roteador por hash, utilitários de UI
   - Ações delegadas via [data-action] e componentes: modal, toast,
     dropdown, gaveta de navegação
   IMPORTANTE: tudo aqui é simulação local. Nenhum dado vai para servidor.
   ========================================================= */
window.KFKA = window.KFKA || {};
(function (K) {
  'use strict';

  /* ---------------- Ícones (traços no estilo "lucide") ---------------- */
  const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    family: '<circle cx="8" cy="6" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M3 21v-3a5 5 0 0 1 10 0v3"/><path d="M14 21v-2a3.5 3.5 0 0 1 7 0v2"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    review: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><path d="M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><path d="M12 3v12"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    send: '<path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    undo: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41z"/><circle cx="7" cy="7" r="1.5"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><path d="M12 2v10"/>',
    swap: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.6-10-8.6z"/>',
    map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><path d="M8 2v16M16 6v16"/>'
  };
  K.icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  K.ICON_NAMES = Object.keys(ICONS); // usado na página de iconografia
  function injectSprite() {
    const symbols = Object.entries(ICONS).map(([n, p]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${p}</symbol>`).join('');
    const holder = document.createElement('div');
    holder.style.display = 'none';
    holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;
    document.body.prepend(holder);
  }

  /* ---------------- Utilitários ---------------- */
  // Escapa texto para evitar injeção de HTML (prática que deve continuar com a API real)
  /* Símbolo da marca KFKA: um "K" formado por três traços que se encontram.
     Haste = a escola (base) · braço de cima = professor · braço de baixo = família.
     O ponto amarelo no centro é o momento da publicação, onde os três se encontram. */
  K.mark = (size = 38, bg = 'var(--ink)') => `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="KFKA"><rect width="40" height="40" rx="11" fill="${bg}"/><path d="M13 9.5v21" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/><path d="M17.5 20 27 11.5" stroke="#74C0FC" stroke-width="4.2" stroke-linecap="round"/><path d="M17.5 20 27 28.5" stroke="#5FD4A8" stroke-width="4.2" stroke-linecap="round"/><circle cx="17.5" cy="20" r="3.3" fill="#FFC94A"/></svg>`;
  K.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.fmtMedia = (m) => (m == null || m === '' ? '—' : Number(m).toFixed(1).replace('.', ','));
  // Iniciais: primeira + última palavra ("Maria José da Cruz" → MC), ignorando "da/de/do"
  // e espaços extras; Array.from evita cortar emoji ao meio; sem nome → "?"
  K.initials = (nome) => {
    const partes = String(nome || '').trim().split(/\s+/).filter((p) => p && !/^(d[aeo]s?|e|y)$/i.test(p));
    if (!partes.length) return '?';
    const ini = (p) => Array.from(p)[0] || '';
    return (ini(partes[0]) + (partes.length > 1 ? ini(partes[partes.length - 1]) : '')).toUpperCase();
  };
  // Plural correto em português: K.plural(1, 'aluno') → "1 aluno"; K.plural(3, 'aluno') → "3 alunos"
  K.plural = (n, um, varios = um + 's') => `${n} ${n === 1 ? um : varios}`;
  K.qs = (sel, root = document) => root.querySelector(sel);
  K.qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------------- Componentes em HTML ---------------- */
  const STATUS = {
    rascunho: { label: 'Rascunho', icon: 'pencil' },
    enviado: { label: 'Enviado para revisão', short: 'Enviado', icon: 'send' },
    revisao: { label: 'Em revisão', icon: 'review' },
    publicado: { label: 'Publicado', icon: 'check-circle' },
    devolvido: { label: 'Devolvido para ajustes', short: 'Devolvido', icon: 'undo' },
    cancelado: { label: 'Cancelado', icon: 'ban' },
    pendente: { label: 'Pendente', icon: 'clock' },
    lido: { label: 'Lido', icon: 'check' },
    'nao-lido': { label: 'Não lido', icon: 'eye' }
  };
  K.STATUS = STATUS;
  K.status = (s, short = false) => {
    const d = STATUS[s] || STATUS.pendente;
    return `<span class="status ${s}">${K.icon(d.icon)}${short && d.short ? d.short : d.label}</span>`;
  };
  K.avatar = (nome, cor = 'var(--sky)', size = '') => `<span class="avatar ${size}" style="background:${cor}" aria-hidden="true">${K.initials(nome)}</span>`;
  K.tag = (id) => {
    const t = K.data.tags.find((x) => x.id === id);
    // title: quando a tag é cortada com reticências, o nome completo aparece ao passar o mouse
    return t ? `<span class="tag ${t.tom}" title="${K.esc(t.nome)}">${K.esc(t.nome)}</span>` : '';
  };
  K.tags = (ids) => `<span class="tag-group">${(ids || []).map(K.tag).join('')}</span>`;
  K.crumbs = (items) => `<nav class="breadcrumbs" aria-label="Você está em">${items.map((it, i) => (it.href ? `<a href="${it.href}">${K.esc(it.label)}</a>` : `<span aria-current="page">${K.esc(it.label)}</span>`) + (i < items.length - 1 ? '<span class="sep" aria-hidden="true">/</span>' : '')).join('')}</nav>`;
  K.pageHead = ({ crumbs, title, lead, actions = '' }) => `
    <header class="page-head">
      <div class="stack-sm">${crumbs && crumbs.length > 1 ? K.crumbs(crumbs) : ''}<h1 id="page-title" tabindex="-1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>
      ${actions ? `<div class="actions">${actions}</div>` : ''}
    </header>`;
  /* Gráfico de linha para séries no tempo (média por bimestre).
     A linha é SVG esticado (viewBox 0–100); pontos e textos são HTML posicionados em %,
     assim não distorcem em nenhuma largura. Escala do eixo sempre rotulada. */
  K.lineChart = ({ points, label, height = 180 }) => {
    const vals = points.map((p) => p.value).filter((v) => v != null);
    const min = vals.length ? Math.max(0, Math.min(6, Math.floor(Math.min(...vals)) - 1)) : 0;
    const max = 10;
    const n = points.length;
    const x = (i) => ((i + 0.5) / n) * 100;
    const y = (v) => 100 - ((v - min) / (max - min)) * 100;
    // trechos contínuos (bimestre sem dado interrompe a linha)
    const segs = []; let cur = [];
    points.forEach((p, i) => { if (p.value == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(p.value)]); });
    if (cur.length) segs.push(cur);
    const line = segs.map((s) => 'M' + s.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join(' L')).join(' ');
    const area = segs.filter((s) => s.length > 1).map((s) => `M${s[0][0].toFixed(2)} 100 L` + s.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join(' L') + ` L${s[s.length - 1][0].toFixed(2)} 100 Z`).join(' ');
    const ticks = [max, (min + max) / 2, min];
    return `<figure class="lchart" role="img" aria-label="${K.esc(label)}">
      <div class="lchart-body">
        <div class="lchart-y" aria-hidden="true">${ticks.map((t) => `<span>${K.fmtMedia(t)}</span>`).join('')}</div>
        <div class="lchart-plot" style="height:${height}px" aria-hidden="true">
          ${ticks.map((t) => `<i class="lchart-grid" style="top:${y(t)}%"></i>`).join('')}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path class="lchart-area" d="${area}"/><path class="lchart-line" d="${line}" vector-effect="non-scaling-stroke"/></svg>
          ${points.map((p, i) => p.value == null ? '' : `<span class="lchart-pt${p.current ? ' is-current' : ''}" style="left:${x(i)}%;top:${y(p.value)}%"><b>${K.fmtMedia(p.value)}</b></span>`).join('')}
        </div>
        <div class="lchart-x" aria-hidden="true" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${points.map((p) => `<span class="${p.current ? 'is-current' : ''}${p.value == null ? ' is-empty' : ''}">${p.label}${p.value == null ? '<small>a publicar</small>' : ''}</span>`).join('')}</div>
      </div>
    </figure>`;
  };
  K.empty = ({ icon = 'inbox', title, text, actions = '' }) => `
    <div class="empty"><div class="art">${K.icon(icon)}</div><h2>${title}</h2><p>${text}</p>${actions ? `<div class="row" style="justify-content:center">${actions}</div>` : ''}</div>`;
  K.pagination = (from, to, total) => `
    <div class="pagination"><span>Mostrando ${from}–${to} de ${total}</span>
      <div class="pages" role="group" aria-label="Paginação (demonstrativa)">
        <button type="button" aria-label="Página anterior" data-action="noop">‹</button>
        <button type="button" aria-current="page">1</button><button type="button" data-action="noop">2</button><button type="button" data-action="noop">3</button>
        <button type="button" aria-label="Próxima página" data-action="noop">›</button>
      </div></div>`;
  K.bimTabs = (active, base, opts = {}) => `<div class="bim-tabs" role="group" aria-label="Bimestre">${K.data.bimestres.map((b) => {
      const off = opts.disableFuture && b.status === 'agendado';
      if (off) return `<span class="bim" aria-disabled="true"><b>${b.n}º bimestre</b><small>${b.rotulo}</small></span>`;
      return `<a class="bim" href="${base + (base.includes('?') ? '&' : '?') + 'bim=' + b.n}" ${b.n === active ? 'aria-current="page"' : ''}><b>${b.n}º bimestre</b><small>${b.rotulo}</small></a>`;
    }).join('')}</div>`;

  /* ---------------- Toasts ---------------- */
  K.toast = (title, text = '', kind = 'ok', sim = true) => {
    const map = { ok: ['var(--success)', 'check'], err: ['var(--danger)', 'alert'], info: ['var(--blue)', 'info'], warn: ['var(--warning)', 'alert'] };
    const [bg, ic] = map[kind] || map.ok;
    let box = K.qs('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ico" style="background:${bg}">${K.icon(ic, 'icon-sm')}</span><div><b>${title}</b>${text ? `<small>${text}</small>` : ''}${sim ? '<span class="sim">SIMULAÇÃO LOCAL · nada foi enviado a um servidor</span>' : ''}</div><button type="button" aria-label="Fechar aviso">${K.icon('x', 'icon-sm')}</button>`;
    // Saída pelo mesmo caminho da entrada, mais rápida (200ms) — depois remove do DOM
    const leave = () => { if (el.classList.contains('leaving')) return; el.classList.add('leaving'); setTimeout(() => el.remove(), 220); };
    el.querySelector('button').onclick = leave;
    box.appendChild(el);
    // Temporizador pausável (princípio do Sonner): não some enquanto o mouse está em cima
    // nem enquanto a aba está escondida — o usuário não perde o aviso.
    let restante = 5200, inicio = Date.now(), timer = setTimeout(leave, restante);
    const pausar = () => { clearTimeout(timer); restante -= Date.now() - inicio; };
    const retomar = () => { inicio = Date.now(); clearTimeout(timer); timer = setTimeout(leave, Math.max(restante, 1200)); };
    el.addEventListener('mouseenter', pausar);
    el.addEventListener('mouseleave', retomar);
    document.addEventListener('visibilitychange', () => (document.hidden ? pausar() : retomar()));
  };

  /* ---------------- Modal acessível ---------------- */
  let lastFocus = null;
  K.modal = (html, { size = '', onOpen } = {}) => {
    K.qsa('.overlay').forEach((o) => o.remove()); // troca de modal: sem animação de saída
    document.body.style.overflow = '';
    lastFocus = document.activeElement;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div>`;
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) K.closeModal(); });
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const first = ov.querySelector('[autofocus], input, textarea, select, button:not(.close), a[href]');
    (first || ov.querySelector('.modal')).focus();
    onOpen && onOpen(ov);
    return ov;
  };
  K.closeModal = () => {
    const ov = K.qs('.overlay:not(.closing)');
    if (!ov) return;
    // Saída animada (150ms, mais rápida que a entrada); o foco volta na hora para o gatilho
    ov.classList.add('closing');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
    setTimeout(() => ov.remove(), 160);
  };
  K.modalHead = (icon, tone, title, text) => `<div class="modal-head"><span class="ico ${tone}">${K.icon(icon)}</span><div><h2 id="modal-title">${title}</h2>${text ? `<p>${text}</p>` : ''}</div><button type="button" class="icon-btn close" data-action="close-modal" aria-label="Fechar">${K.icon('x')}</button></div>`;

  /* ---------------- Validação visual de formulários ---------------- */
  // Regras via atributos: required, data-min, data-max, type=email. Mostra mensagens claras.
  K.validate = (form) => {
    let firstBad = null;
    K.qsa('[data-validate]', form).forEach((input) => {
      const field = input.closest('.field');
      const v = (input.value || '').trim();
      let msg = '';
      if (input.required && !v) msg = input.dataset.msgReq || 'Preencha este campo.';
      else if (input.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) msg = 'Informe um e-mail válido, como nome@escola.edu.br.';
      else if (input.dataset.min && v) {
        const n = Number(v.replace(',', '.'));
        if (Number.isNaN(n) || n < Number(input.dataset.min) || n > Number(input.dataset.max)) msg = input.dataset.msgRange || `Use um valor entre ${input.dataset.min} e ${input.dataset.max}.`;
      }
      if (input.dataset.minlen && v && v.length < Number(input.dataset.minlen)) msg = `Escreva pelo menos ${input.dataset.minlen} caracteres (atual: ${v.length}).`;
      field && field.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const em = field && field.querySelector('.error-msg span');
      if (em) em.textContent = msg;
      if (msg && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  };
  // Campo padronizado com rótulo associado (acessibilidade)
  K.field = ({ id, label, type = 'text', value = '', placeholder = '', required = false, hint = '', icon = '', attrs = '', options = null, span = '' }) => {
    const req = required ? 'required data-validate' : 'data-validate';
    let control;
    if (options) control = `<select id="${id}" name="${id}" class="select" ${req} ${attrs}>${options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${K.esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${K.esc(l)}</option>`; }).join('')}</select>`;
    else if (type === 'textarea') control = `<textarea id="${id}" name="${id}" class="textarea" placeholder="${K.esc(placeholder)}" ${req} ${attrs}>${K.esc(value)}</textarea>`;
    else control = `<input id="${id}" name="${id}" type="${type}" class="input" value="${K.esc(value)}" placeholder="${K.esc(placeholder)}" ${req} ${attrs}>`;
    if (icon && !options && type !== 'textarea') control = `<div class="input-icon">${K.icon(icon)}${control}</div>`;
    return `<div class="field ${span}"><label for="${id}">${label}${required ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>${control}${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ''}<span class="error-msg" role="alert">${K.icon('alert', 'icon-sm')}<span></span></span></div>`;
  };

  /* ---------------- Roteador por hash ---------------- */
  const routes = [];
  K.route = (pattern, view) => {
    const keys = [];
    const rx = new RegExp('^' + pattern.replace(/\/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    routes.push({ pattern, rx, keys, view });
  };
  K.go = (hash) => { location.hash = hash; };
  K.current = { path: '/', query: {} };
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qstr = ''] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(qstr));
    return { path, query };
  }
  function render() {
    const { path, query } = parse();
    K.current = { path, query };
    const root = document.getElementById('app');
    let match = null;
    for (const r of routes) { const m = path.match(r.rx); if (m) { match = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; } }
    const view = match ? match.r.view : K.views.notFound;
    const params = match ? match.params : {};
    K.closeModal();
    const out = view.render(params, query);
    root.innerHTML = out;
    document.title = (view.title ? (typeof view.title === 'function' ? view.title(params, query) : view.title) + ' · ' : '') + 'KFKA — Acompanhamento Escolar';
    view.mount && view.mount(root, params, query);
    window.scrollTo(0, 0);
    // Move o foco para o título da página (leitores de tela anunciam a troca)
    const h = document.getElementById('page-title');
    if (h && K._navigated) h.focus({ preventScroll: true });
    K._navigated = true;
  }
  K.refresh = render;
  K.views = {};

  /* ---------------- Ações delegadas ---------------- */
  K.actions = {
    noop: () => K.toast('Interação demonstrativa', 'Este controle é ilustrativo neste protótipo.', 'info'),
    'close-modal': () => K.closeModal(),
    'toggle-nav': () => { const a = K.qs('.app'); a && a.classList.toggle('nav-open'); },
    'close-nav': () => { const a = K.qs('.app'); a && a.classList.remove('nav-open'); },
    'toggle-dropdown': (el) => {
      const dd = el.closest('.dropdown');
      const open = !dd.classList.contains('open');
      K.qsa('.dropdown.open').forEach((d) => d.classList.remove('open'));
      dd.classList.toggle('open', open);
      el.setAttribute('aria-expanded', String(open));
    },
    print: () => { window.print(); K.toast('Impressão', 'Se a janela não abrir (visualização incorporada), abra o index.html direto no navegador.', 'info', false); }
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!e.target.closest('.dropdown')) K.qsa('.dropdown.open').forEach((d) => { d.classList.remove('open'); const b = d.querySelector('[aria-expanded]'); b && b.setAttribute('aria-expanded', 'false'); });
    if (!el) return;
    const fn = K.actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { K.closeModal(); K.qsa('.dropdown.open').forEach((d) => d.classList.remove('open')); const a = K.qs('.app'); a && a.classList.remove('nav-open'); }
  });
  window.addEventListener('scroll', () => { const t = K.qs('.topbar'); t && t.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });
  window.addEventListener('hashchange', render);
  /* Alternador de dados para teste de design (skill break-ui).
     Só aparece quando a URL tem ?dados=... — fica fora do uso normal do protótipo. */
  const dataToggle = () => {
    const m = location.search.match(/[?&]dados=(\w+)/);
    if (!m) return;
    const bar = document.createElement('div');
    bar.className = 'data-toggle';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Conjunto de dados de teste');
    // Troca o conjunto recarregando a página (os dados são montados no carregamento)
    bar.innerHTML = [['demo', 'Dados de demonstração'], ['pior', 'Pior caso']].map(([v, l]) => `<a href="?dados=${v}${location.hash}" aria-current="${m[1] === v}">${l}</a>`).join('');
    document.body.appendChild(bar);
  };
  K.start = () => { injectSprite(); render(); dataToggle(); };
})(window.KFKA);
