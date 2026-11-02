// Tela de carga: a planta do Galaxy S26 Ultra vista de frente, em fios (o contorno do aparelho, a tela, o furo da
// câmera e o slot da S Pen, com as cotas). Uma grade de pixels da tela acende conforme a carga avança, e o contador
// mostra os KB que já chegaram de verdade: o pedaço do 3D é baixado aqui, por stream, e só depois importado (vem do
// cache); CSS e fontes contam quando o Resource Timing registra o fim. O progresso é 85% bytes e 15% montar a cena.
// Pronta, a planta deita em perspectiva até a pose do hero e pousa em cima da tela do 3D (three/blueprint.js);
// o contador rola para o [ 0 / 6 ] da abertura (as camadas que caem), que segue dali.
// Sem gsap nem three: este módulo vai no pedaço de entrada, que é pequeno.
// ?hd: espera tudo, sem limite. Rede lenta: passados SOFT s, as fontes deixam de segurar (o 3D segura sempre).
import { PHONE, SCREEN, PUNCH, SPEN, GRID } from '../three/dims.js';

const MIN = 0.6;         // s: com cache quente a varredura ainda acontece, sem piscar
const SOFT = 6;          // s
const STEPS = ['app', 'fontes', 'cena', 'shaders', 'quadro'];
const BYTES_W = 0.85;
const MORPH = 1;         // s: a planta deitando até o hero
const INK = '242,240,235', GLOW = '191,224,255', MUTED = '143,141,136';
const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outE = (t) => 1 - Math.pow(1 - t, 4);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const q = new URLSearchParams(location.search);
export const carga = createLoader({ hd: q.has('hd'), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches });

function createLoader({ hd, reduced }) {
  const root = document.documentElement;
  const el = document.querySelector('.intro');
  const cv = el.querySelector('.intro__plate');
  const ctx = cv.getContext('2d');
  const countEl = el.querySelector('.intro__count');
  const kbEl = el.querySelector('.intro__kb'), totEl = el.querySelector('.intro__tot');
  const [lineKb, lineKeys] = el.querySelectorAll('.intro__line');
  if (hd) el.querySelector('.intro__hd').hidden = false;

  // ---------- o que medir: o manifesto vem do build (vite.config.js); no dev não há, e o contador soma o que chegou
  let manifest = [];
  try { manifest = JSON.parse(document.getElementById('carga')?.textContent || '[]'); } catch {}
  const files = manifest.map((f) => ({ ...f, got: 0 }));
  const total = files.reduce((a, f) => a + f.b, 0);
  const byPath = new Map(files.filter((f) => f.k !== 'js').map((f) => [new URL(f.u, location.href).pathname, f]));
  let devBytes = 0;
  const seen = (list) => {
    for (const e of list) {
      const f = byPath.get(new URL(e.name).pathname);
      if (f) f.got = f.b;
      if (!total) devBytes += e.decodedBodySize || 0;
    }
  };
  seen(performance.getEntriesByType('resource'));
  const po = new PerformanceObserver((l) => seen(l.getEntries()));
  po.observe({ type: 'resource' });
  const loaded = () => files.reduce((a, f) => a + f.got, 0);

  async function pull(f) {
    try {
      const r = await fetch(f.u);
      if (!r.ok || !r.body) throw new Error(r.status);
      const rd = r.body.getReader();
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        f.got = Math.min(f.b, f.got + value.byteLength);
      }
    } catch { /* o import abaixo baixa de novo, sem progresso */ }
    f.got = f.b;
  }

  const steps = new Set();
  const t0 = performance.now();
  let softDone;
  const soft = hd ? new Promise(() => {}) : new Promise((r) => (softDone = r));
  if (!hd) setTimeout(softDone, SOFT * 1000);

  // ---------- a planta (mm → px). x para a direita, z para a frente, centro na área das teclas
  const plan = { cx: 0, cy: 0, s: 1 };
  let VW = 1, VH = 1, dpr = 1, narrow = false;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    VW = cv.clientWidth || innerWidth; VH = cv.clientHeight || innerHeight;
    cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    narrow = VW < 760 || VW / VH < 0.8;
    plan.s = Math.min((VH * (narrow ? 0.56 : 0.66)) / PHONE.l, (VW * 0.7) / PHONE.w);
    plan.cx = VW / 2;
    plan.cy = VH * (narrow ? 0.45 : 0.48);
  }
  layout();

  const rrect = (w, d, r, n = 6) => {
    const pts = [];
    const cs = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]];
    for (const [x, z, a0] of cs) for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; pts.push([x + r * Math.cos(a), z + r * Math.sin(a)]); }
    return pts;
  };
  const circle = (x, z, r, n = 28) => Array.from({ length: n }, (_, i) => [x + r * Math.cos((i / n) * Math.PI * 2), z + r * Math.sin((i / n) * Math.PI * 2)]);
  const outer = rrect(PHONE.w, PHONE.l, PHONE.r), inner = rrect(SCREEN.w, SCREEN.l, SCREEN.r), knob = circle(PUNCH.x, PUNCH.z, PUNCH.r * 1.6, 20);
  const pen = rrect(SPEN.w, 3, 1.2).map(([x, z]) => [x + SPEN.x, z + PHONE.l / 2 - 1.5]);
  // os pixels da tela: uma grade dentro dela, acendendo de cima para baixo (com um leve degrau por coluna)
  const KEYS = [];
  const step = GRID.cell, x0 = -((GRID.cols - 1) * step) / 2, z0 = -((GRID.rows - 1) * step) / 2;
  for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) KEYS.push({ x: x0 + c * step, z: z0 + r * step, row: r, col: c });
  const half = (step * GRID.gap) / 2;
  const rank = KEYS.map((k) => k.row / GRID.rows + k.col * 0.012);
  const order = KEYS.map((_, i) => i).sort((a, b) => rank[a] - rank[b]);
  const pos = new Array(KEYS.length);
  order.forEach((i, n) => (pos[i] = n / (KEYS.length - 1)));
  const lit = new Float32Array(KEYS.length);

  // ---------- desenho
  const o = [0, 0];
  let project = null, mt = 0; // na passagem: project(t, x, z, out) da câmera que deita
  const P = (x, z) => (project ? project(mt, x, z, o) : ((o[0] = plan.cx + x * plan.s), (o[1] = plan.cy + z * plan.s), o));
  function poly(pts, close, dash) {
    ctx.beginPath();
    let len = 0, px = 0, py = 0;
    pts.forEach(([x, z], i) => {
      const [sx, sy] = P(x, z);
      if (i) { ctx.lineTo(sx, sy); len += Math.hypot(sx - px, sy - py); } else ctx.moveTo(sx, sy);
      px = sx; py = sy;
    });
    if (close) ctx.closePath();
    if (dash < 1) { ctx.setLineDash([len * dash, len * 2]); }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const font = (px) => `400 ${px}px "Geist Mono Variable", ui-monospace, monospace`;
  function label(text, x, y, align, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.textAlign = align;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  // cotas e legenda da planta (só na planta; somem quando ela deita)
  function cotas(a) {
    if (a <= 0) return;
    const fs = narrow ? 9 : 10.5;
    ctx.font = font(fs);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${fs * 0.1}px`;
    ctx.textBaseline = 'middle';
    const w = (PHONE.w / 2) * plan.s, d = (PHONE.l / 2) * plan.s, g = narrow ? 12 : 18, tk = 4;
    const top = plan.cy - d - g, right = plan.cx + w + g;
    ctx.strokeStyle = `rgba(${INK},${0.16 * a})`;
    ctx.fillStyle = `rgba(${MUTED},${a})`;
    const gapH = ctx.measureText('78,1 mm').width / 2 + 8, gapV = ctx.measureText('163,6 mm').width / 2 + 8;
    ctx.beginPath();
    ctx.moveTo(plan.cx - w, top); ctx.lineTo(plan.cx - gapH, top); ctx.moveTo(plan.cx + gapH, top); ctx.lineTo(plan.cx + w, top);
    ctx.moveTo(plan.cx - w, top - tk); ctx.lineTo(plan.cx - w, top + tk); ctx.moveTo(plan.cx + w, top - tk); ctx.lineTo(plan.cx + w, top + tk);
    ctx.moveTo(right, plan.cy - d); ctx.lineTo(right, plan.cy - gapV); ctx.moveTo(right, plan.cy + gapV); ctx.lineTo(right, plan.cy + d);
    ctx.moveTo(right - tk, plan.cy - d); ctx.lineTo(right + tk, plan.cy - d); ctx.moveTo(right - tk, plan.cy + d); ctx.lineTo(right + tk, plan.cy + d);
    ctx.stroke();
    label('78,1 mm', plan.cx, top, 'center');
    label('163,6 mm', right, plan.cy, 'center', -Math.PI / 2);
    ctx.textBaseline = 'top';
    label('GALAXY S26 ULTRA · 6,9″ · 1440 × 3120', plan.cx - w, plan.cy + d + g, 'left');
    label('KAROL° · PROJETO DE FÃ, NÃO OFICIAL', plan.cx - w, plan.cy + d + g + fs * 1.8, 'left');
  }

  function draw(a, drawIn, cot) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    cotas(cot * clamp(drawIn * 1.4 - 0.4));
    ctx.strokeStyle = `rgba(${INK},0.34)`;
    poly(outer, true, outE(drawIn));
    ctx.strokeStyle = `rgba(${INK},0.2)`;
    poly(inner, true, outE(clamp(drawIn * 1.2 - 0.2)));
    poly(knob, true, outE(clamp(drawIn * 1.5 - 0.5)));
    poly(pen, true, outE(clamp(drawIn * 1.5 - 0.5)));
    const sq = [[-half, -half], [half, -half], [half, half], [-half, half]];
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i];
      const ap = reduced ? 1 : clamp(drawIn * 1.7 - pos[i] * 0.7);
      if (ap <= 0) continue;
      const l = lit[i];
      ctx.beginPath();
      sq.forEach(([dx, dz], j) => { const [x, y] = P(k.x + dx, k.z + dz); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.closePath();
      if (l > 0.01) { ctx.fillStyle = `rgba(${GLOW},${0.13 * l * ap})`; ctx.fill(); }
      ctx.strokeStyle = l > 0.01 ? `rgba(${GLOW},${(0.22 + 0.5 * l) * ap})` : `rgba(${INK},${0.22 * ap})`;
      ctx.stroke();
      if (l > 0.01) {
        // o subpixel aceso: um ponto no centro do pixel
        const [x, y] = P(k.x, k.z);
        ctx.fillStyle = `rgba(${INK},${0.8 * l * ap})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- laço
  let shown = 0, kbShown = 0, lastKb = '', lastTot = '', raf = 0, readyDone, fontsIn = false;
  let morph = null, fade = null;
  const ready = new Promise((r) => (readyDone = r));
  document.fonts.load(font(11)).then(() => { fontsIn = true; });
  setTimeout(() => (fontsIn = true), 900);
  let countShown = false;

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (root.classList.contains('no-intro')) { stop(); readyDone(); return; }
    const t = (now - t0) / 1000;
    const cap = reduced ? 1 : clamp(t / MIN);
    const stepsP = steps.size / STEPS.length;
    const allSteps = steps.size === STEPS.length;
    const giveUp = !hd && t > SOFT && allSteps; // rede lenta: as fontes que faltam não seguram mais
    const bytes = total ? (giveUp ? 1 : loaded() / total) : 1;
    const real = total ? BYTES_W * bytes + (1 - BYTES_W) * stepsP : stepsP;
    const target = Math.min(real, cap);
    shown += (target - shown) * (reduced ? 1 : 0.25);
    if (target >= 1 && shown > 0.985) shown = 1;
    const n = shown * KEYS.length;
    for (let j = 0; j < KEYS.length; j++) {
      const i = order[j];
      const want = j < Math.floor(n + 1e-6) ? 1 : 0;
      lit[i] += (want - lit[i]) * (reduced ? 1 : 0.3);
    }
    // contador: KB que chegaram (no dev, sem manifesto, o que o Resource Timing somou)
    const tot = total || devBytes;
    const kbT = total ? Math.min(loaded(), total * cap) : devBytes;
    kbShown += (kbT - kbShown) * (reduced ? 1 : 0.3);
    if (shown === 1) kbShown = kbT;
    const a = String(Math.round(kbShown / 1024)).padStart(4, '0'), b = String(Math.round(tot / 1024)).padStart(4, '0');
    if (a !== lastKb) { kbEl.textContent = a; lastKb = a; }
    if (b !== lastTot) { totEl.textContent = b; lastTot = b; }
    if (fontsIn && !countShown) { countShown = true; countEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 0 : 500, easing: 'ease-out' }); countEl.style.opacity = 1; }

    let drawIn = reduced ? 1 : clamp(t / 0.55), cot = 1, alpha = 1;
    if (morph) {
      const m = clamp((now - morph.t0) / 1000 / MORPH);
      mt = io(m);
      cot = 1 - clamp(m / 0.25);
      drawIn = 1;
      if (m >= 1 && morph.res) { morph.res(); morph.res = null; }
    }
    if (fade) {
      alpha = 1 - clamp((now - fade.t0) / 1000 / fade.d);
      if (alpha <= 0) { draw(0); stop(); fade.res(); return; }
    }
    draw(alpha, drawIn, cot);
    if (shown === 1 && !morph && t >= MIN) readyDone();
  }
  raf = requestAnimationFrame(tick);
  const onResize = () => { if (!morph) layout(); };
  addEventListener('resize', onResize);
  function stop() { cancelAnimationFrame(raf); po.disconnect(); removeEventListener('resize', onResize); cv.remove(); }

  return {
    plan,
    soft,
    ready,
    step(name) { steps.add(name); },
    /** baixa os pedaços de JS do manifesto contando os bytes e então importa (do cache) */
    load(importer) { return Promise.all(files.filter((f) => f.k === 'js').map(pull)).then(importer); },
    /** a planta deita até o hero; resolve quando os fios pousam nos switches do 3D. O contador rola para [ 00 / 75 ] */
    handoff(fn) {
      project = fn;
      root.classList.remove('is-loading');
      el.classList.remove('is-loading');
      lineKb.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-140%)' }], { duration: 420, easing: 'cubic-bezier(.32,0,.67,0)', fill: 'forwards' });
      lineKeys.animate([{ transform: 'translateY(140%)' }, { transform: 'translateY(0)' }], { duration: 950, delay: 300, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      return new Promise((res) => (morph = { t0: performance.now(), res }));
    },
    /** os fios somem enquanto o 3D aparece por baixo */
    fade(d = 0.7) { return new Promise((res) => (fade = { t0: performance.now(), d, res })); },
    /** prefers-reduced-motion: a tela de carga inteira sai por fusão */
    dissolve(d = 0.5) {
      root.classList.remove('is-loading');
      return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d * 1000, easing: 'ease', fill: 'forwards' }).finished.then(() => { stop(); el.remove(); });
    },
  };
}
