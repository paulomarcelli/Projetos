// Pilha: os objetos infláveis caem quando a seção chega, quicam como balão (pouco peso, muito ar),
// rolam no chão e dá para pegar, arrastar e arremessar. Física própria de círculos, sem biblioteca.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';

const NAMES = ['obj-nuvem', 'obj-raio', 'obj-anel', 'obj-gota', 'obj-piao'];
// tamanhos em fração do lado de referência (vw): alguns grandes, a maioria média, uns pequenos
const SIZES = [1, 0.8, 1.05, 0.7, 0.9, 0.62, 0.85, 0.55, 0.95, 0.68, 0.78, 0.5, 0.88, 0.6, 0.72, 0.52];

export function fisica({ section, reduced }) {
  const area = section.querySelector('.pilha');
  const mobile = innerWidth < 720;
  const count = mobile ? 10 : SIZES.length;
  const unit = (mobile ? 24 : 13) * innerWidth / 100;
  const bodies = Array.from({ length: count }, (_, i) => {
    const name = NAMES[i % NAMES.length];
    const img = new Image();
    img.src = `img/${name}.webp`;
    img.alt = '';
    area.appendChild(img);
    const w = unit * SIZES[i];
    img.style.width = `${w}px`;
    const b = { img, w, h: w, r: w * 0.42, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, grab: false };
    // proporção real da imagem: as altas (raio, gota, pião) não podem atravessar o chão
    img.decode().then(() => {
      b.h = (w * img.naturalHeight) / img.naturalWidth;
      b.r = Math.sqrt(b.w * b.h) * 0.4;
    }).catch(() => {});
    return b;
  });
  let W = 0, H = 0, started = false;
  const measure = () => { W = area.clientWidth; H = area.clientHeight; };
  measure();
  addEventListener('resize', measure);

  function drop() {
    started = true;
    bodies.forEach((b, i) => {
      b.x = W * (0.08 + 0.84 * ((i * 0.618) % 1));
      b.y = -b.r - (i % 6) * H * 0.18 - Math.floor(i / 6) * H * 0.5;
      b.vx = gsap.utils.random(-120, 120);
      b.vy = 0;
      b.a = gsap.utils.random(-0.6, 0.6);
      b.va = gsap.utils.random(-1.5, 1.5);
    });
  }
  function place() {
    for (const b of bodies) {
      b.img.style.visibility = started || reduced ? '' : 'hidden';
      b.img.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0) rotate(${b.a}rad)`;
    }
  }


  if (reduced) {
    bodies.forEach((b, i) => { b.x = W * (0.1 + 0.8 * (i / (bodies.length - 1))); b.y = H - b.r; });
    place();
    return;
  }
  place();
  // cai quando a pilha está quase toda na tela; voltando para cima, os objetos somem e caem de novo
  ScrollTrigger.create({
    trigger: area,
    start: 'top 30%',
    onEnter: drop,
    onLeaveBack: () => { started = false; place(); },
  });

  // pegar e arremessar
  const ptr = { x: 0, y: 0, body: null, vx: 0, vy: 0 };
  const local = (e) => { const r = area.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  area.addEventListener('pointerdown', (e) => {
    const [x, y] = local(e);
    const hit = bodies.find((b) => Math.hypot(b.x - x, b.y - y) < b.r);
    if (!hit) return;
    ptr.body = hit; hit.grab = true; ptr.x = x; ptr.y = y;
    area.setPointerCapture(e.pointerId);
  });
  area.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    ptr.x = x; ptr.y = y;
  });
  const release = () => { if (ptr.body) ptr.body.grab = false; ptr.body = null; };
  area.addEventListener('pointerup', release);
  area.addEventListener('pointercancel', release);

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(area);
  const G = 1500, REST = 0.42, STEPS = 4;
  gsap.ticker.add((t, dtMs) => {
    if (!visible || !started) return;
    const dt = Math.min(0.033, dtMs / 1000) / STEPS;
    for (let s = 0; s < STEPS; s++) {
      for (const b of bodies) {
        if (b.grab) {
          // segue o dedo por uma mola forte; ao soltar, leva a velocidade junto
          b.vx = (ptr.x - b.x) * 18; b.vy = (ptr.y - b.y) * 18;
        } else {
          b.vy += G * dt;
          b.vx *= 1 - 0.25 * dt; b.vy *= 1 - 0.25 * dt; // ar
        }
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        // paredes e chão (o teto fica aberto para a queda)
        // meia altura da caixa girada: a ponta mais baixa da imagem encosta no chão, nada passa dele
        const half = 0.5 * (Math.abs(b.w * Math.sin(b.a)) + Math.abs(b.h * Math.cos(b.a))) * 0.9;
        const floor = H - Math.max(b.r, half);
        if (b.y > floor) {
          b.y = floor; if (b.vy > 0) b.vy *= -REST; b.vx *= 0.985;
          // rola só quando desliza de verdade; o tremor da pilha não vira giro
          b.va = Math.abs(b.vx) > 40 ? b.vx / b.r : b.va * 0.8;
        }
        if (b.x < b.r) { b.x = b.r; if (b.vx < 0) b.vx *= -REST; }
        if (b.x > W - b.r) { b.x = W - b.r; if (b.vx > 0) b.vx *= -REST; }
      }
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], c = bodies[j];
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
        if (d >= min || d === 0) continue;
        const nx = dx / d, ny = dy / d, over = min - d;
        const ma = a.grab ? 0 : a.r * a.r, mc = c.grab ? 0 : c.r * c.r, mt = ma + mc || 1;
        a.x -= nx * over * (ma / mt); a.y -= ny * over * (ma / mt);
        c.x += nx * over * (mc / mt); c.y += ny * over * (mc / mt);
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) {
          const imp = (-(1 + REST) * rv) / ((ma ? 1 / ma : 0) + (mc ? 1 / mc : 0) || 1);
          if (ma) { a.vx -= (imp / ma) * nx; a.vy -= (imp / ma) * ny; }
          if (mc) { c.vx += (imp / mc) * nx; c.vy += (imp / mc) * ny; }
          // giro de raspão só em impacto de verdade; encostado, o atrito freia o giro
          if (rv < -120) {
            const tang = (c.vx - a.vx) * -ny + (c.vy - a.vy) * nx;
            a.va -= tang / a.r * 0.12; c.va += tang / c.r * 0.12;
          }
        }
        if (!a.grab) a.va *= 0.97;
        if (!c.grab) c.va *= 0.97;
      }
    }
    const k = Math.exp(-Math.min(0.033, dtMs / 1000) * 1.2);
    for (const b of bodies) {
      b.va *= k;
      // dorme quando quase parado: sem tremedeira nem giro eterno na pilha
      const sp = Math.hypot(b.vx, b.vy);
      if (!b.grab && sp < 60) b.va *= 0.85;
      if (!b.grab && Math.abs(b.va) < 0.03) b.va = 0;
    }
    place();
  });
}
