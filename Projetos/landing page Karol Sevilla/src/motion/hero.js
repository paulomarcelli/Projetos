// Hero: o nome chapado (letras posicionadas pelas medidas do Blender, para casar com a imagem inflada)
// e a tinta pintada pelo cursor: traço fino que engrossa quando a mão desacelera, respingos quando ela acelera.
// Só interação: nada roda sozinho, e a tinta evapora quando o cursor para.
import { gsap } from 'gsap';
import { createInk } from './ink.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export function hero({ section, image, caixa }) {
  const word = section.querySelector('.hero__word');
  const canvas = section.querySelector('.hero__ink');
  const ink = createInk(canvas);
  ink?.setImage(image);

  // ---- letras: cada uma no lugar da letra correspondente do Blender
  const spans = [...word.querySelectorAll('span')];
  const u = caixa.unidades;
  const box = { L: 0, T: 0, W: 1, H: 1 };
  const ctx = document.createElement('canvas').getContext('2d');
  function layout() {
    // --gutter é um clamp(): o valor em px vem de um elemento que usa a margem (a frase do topo)
    const ref = section.querySelector('.hero__frase');
    const gutter = (ref && parseFloat(getComputedStyle(ref).left)) || 20;
    const r = section.getBoundingClientRect();
    // px por unidade do Blender: ocupa a largura entre as margens, mas em tela larga e baixa
    // (notebook) a altura do nome fica limitada, e o nome se centraliza
    const s = Math.min((r.width - gutter * 2) / (u.x1 - u.x0), (r.height * 0.42) / (u.y1 - u.y0));
    const esquerda = (r.width - (u.x1 - u.x0) * s) / 2;
    ctx.font = '400 200px "Archivo Black"';
    const S = caixa.letras[0];
    const mS = ctx.measureText(S.ch);
    const porAltura = (200 * (S.y1 - S.y0) * s) / (mS.actualBoundingBoxAscent + mS.actualBoundingBoxDescent);
    const porLargura = Math.min(...caixa.letras.map((l) => {
      const m = ctx.measureText(l.ch);
      return (200 * (l.x1 - l.x0) * s) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    }));
    const size = Math.min(porAltura, porLargura);
    const k = size / 200;
    const H = (u.y1 - u.y0) * s;
    const isMobile = r.width < 720;
    const inkTop = r.height * (isMobile ? 0.56 : 0.5) - H / 2;
    const baseline = inkTop + u.y1 * s;
    const fA = mS.fontBoundingBoxAscent, fD = mS.fontBoundingBoxDescent;
    const baseOffset = (size - (fA + fD) * k) / 2 + fA * k; // baseline dentro da caixa com line-height 1

    word.style.fontSize = `${size}px`;
    caixa.letras.forEach((l, i) => {
      const m = ctx.measureText(l.ch);
      const sobra = (l.x1 - l.x0) * s - (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k;
      const x = esquerda + (l.x0 - u.x0) * s + sobra / 2 + m.actualBoundingBoxLeft * k;
      spans[i].style.transform = `translate(${x}px, ${baseline - baseOffset}px)`;
    });
    Object.assign(box, { L: esquerda, T: inkTop, W: (u.x1 - u.x0) * s, H });
    ink?.resize();
  }

  // ---- cursor → tinta com massa
  // O corpo da tinta é uma massa presa ao cursor por uma mola (passa do ponto quando o mouse para).
  // A carga cresce enquanto o mouse anda e define o tamanho da mancha; na freada, o momento do corpo
  // vira gotas que voam com a velocidade dele, deslizam com atrito deixando rastro e empoçam.
  const target = { x: 0, y: 0, on: false };
  const body = { x: 0, y: 0, vx: 0, vy: 0, load: 0, prevSpeed: 0 };
  const drops = [];
  const stamps = [];
  function toLocal(e) {
    const r = section.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  section.addEventListener('pointermove', (e) => {
    const [x, y] = toLocal(e);
    if (!target.on) { body.x = x; body.y = y; body.vx = body.vy = 0; }
    target.x = x; target.y = y; target.on = true;
  });
  section.addEventListener('pointerleave', () => (target.on = false));
  section.addEventListener('pointerdown', (e) => {
    const [x, y] = toLocal(e);
    // pingo: a carga enche de uma vez e a coroa sai em todas as direções
    const unit = box.H / 200;
    body.load = Math.min(1, body.load + 0.6);
    for (let i = 0; i < 14; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(500, 1500) * unit;
      fling(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(4, 11) * unit);
    }
  });

  function fling(x, y, vx, vy, r) {
    if (drops.length > 40) drops.shift();
    drops.push({ x, y, vx, vy, r, px: x, py: y });
  }

  function stroke(dt) {
    const unit = box.H / 200; // tudo proporcional à altura do nome (200 = nome com ~200 px de altura)
    if (target.on) {
      // mola subamortecida: a tinta chega depois do cursor e passa um pouco
      const k = 140, c = 13;
      body.vx += ((target.x - body.x) * k - body.vx * c) * dt;
      body.vy += ((target.y - body.y) * k - body.vy * c) * dt;
    } else {
      body.vx *= Math.exp(-dt * 6);
      body.vy *= Math.exp(-dt * 6);
    }
    const px = body.x, py = body.y;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    const speed = Math.hypot(body.vx, body.vy);

    // carga: sobe rápido com a velocidade, esvazia devagar (a mancha guarda o embalo)
    const want = Math.min(1, speed / unit / 1500);
    body.load += (want - body.load) * (1 - Math.exp(-dt * (want > body.load ? 7 : 1.1)));

    const r = (10 + 74 * Math.pow(body.load, 0.85)) * unit;
    if (body.load > 0.02) {
      // corpo contínuo entre o quadro anterior e este, e uma cauda que estica com a velocidade
      stamps.push({ ax: px, ay: py, bx: body.x, by: body.y, r });
      const tail = Math.min(0.045, 20 / Math.max(speed, 1));
      stamps.push({ ax: body.x, ay: body.y, bx: body.x - body.vx * tail, by: body.y - body.vy * tail, r: r * 0.8 });
    }

    // freada: quando a velocidade cai à metade do pico recente, o embalo vira gotas para a frente
    body.peak = Math.max((body.peak || 0) * Math.exp(-dt * 2.5), speed);
    if (body.peak / unit > 900 && speed < body.peak * 0.5 && body.load > 0.2) {
      const v0 = body.peak;
      const n = Math.min(9, Math.round(3 + (v0 / unit / 500) * body.load));
      const dir = Math.atan2(body.vy, body.vx);
      const ux = Math.cos(dir), uy = Math.sin(dir);
      for (let i = 0; i < n; i++) {
        const a = dir + rnd(-0.6, 0.6), v = v0 * rnd(0.45, 1.1);
        fling(body.x + ux * r * 0.7, body.y + uy * r * 0.7, Math.cos(a) * v, Math.sin(a) * v, rnd(5, 16) * unit * (0.4 + body.load));
      }
      body.peak = speed;
    }
    // em alta velocidade, gotas soltas escapam pela frente e pelos lados
    if (speed / unit > 1600 && Math.random() < 0.35 * body.load) {
      const a = Math.atan2(body.vy, body.vx) + rnd(-0.9, 0.9);
      fling(body.x, body.y, Math.cos(a) * speed * rnd(0.7, 1.2), Math.sin(a) * speed * rnd(0.7, 1.2), rnd(2, 6) * unit);
    }

    // gotas: voam, freiam no atrito, deixam rastro e empoçam
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.px = d.x; d.py = d.y;
      d.x += d.vx * dt; d.y += d.vy * dt;
      const f = Math.exp(-dt * 7);
      d.vx *= f; d.vy *= f;
      const v = Math.hypot(d.vx, d.vy);
      stamps.push({ ax: d.px, ay: d.py, bx: d.x, by: d.y, r: d.r * (0.45 + 0.4 * Math.min(1, 300 * unit / Math.max(v, 1))) });
      if (v < 40 * unit) {
        stamps.push({ ax: d.x, ay: d.y, r: d.r * 1.15 });
        drops.splice(i, 1);
      }
    }
  }

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(section);
  let last = performance.now();
  const t0 = last;
  function tick() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!ink || !visible) return;
    stroke(dt);
    const bb = caixa;
    const imgW = box.W / (bb.x1 - bb.x0), imgH = box.H / (bb.y1 - bb.y0);
    ink.step({
      stamps: stamps.splice(0, 64),
      time: (now - t0) / 1000,
      dt,
      rect: { x: box.L - bb.x0 * imgW, y: box.T - bb.y0 * imgH, w: imgW, h: imgH },
    });
  }

  layout();
  addEventListener('resize', layout);
  gsap.ticker.add(tick);
  return { layout };
}
