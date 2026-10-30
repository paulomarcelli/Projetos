// Rodapé: o nome gigante branco. Cada letra é empurrada para longe do cursor (mola) e encolhe
// quando ele chega perto; sem cursor, volta para o lugar. As letras sobem uma a uma quando o rodapé entra.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function contato({ section, reduced }) {
  const word = section.querySelector('.contato__word');
  const spans = [...word.querySelectorAll('span')];
  if (reduced) return;
  const L = spans.map((el) => ({ el, x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, rise: 1, cx: 0, cy: 0 }));
  const m = { x: -9999, y: -9999, on: false };

  // o nome ocupa a largura exata do rodapé, medido (a fonte larga não cabe em vw fixo)
  const fit = () => {
    word.style.fontSize = '100px';
    const room = word.clientWidth;
    let used = 0;
    spans.forEach((s) => (used += s.getBoundingClientRect().width));
    word.style.fontSize = `${(100 * room) / (used * 1.02)}px`;
  };
  const measure = () => L.forEach((l) => {
    const r = l.el.getBoundingClientRect();
    const w = word.getBoundingClientRect();
    l.cx = r.left - w.left + r.width / 2 - l.x;
    l.cy = r.top - w.top + r.height / 2 - l.y;
    l.w = r.width;
  });
  word.addEventListener('pointerenter', measure);
  section.addEventListener('pointermove', (e) => {
    const w = word.getBoundingClientRect();
    m.x = e.clientX - w.left; m.y = e.clientY - w.top; m.on = true;
  });
  section.addEventListener('pointerleave', () => (m.on = false));
  addEventListener('resize', () => { fit(); measure(); });
  fit();
  measure();

  ScrollTrigger.create({
    trigger: word,
    start: 'top 92%',
    onEnter: () => gsap.fromTo(L, { rise: 1 }, { rise: 0, duration: 1.3, ease: 'expo.out', stagger: 0.06, overwrite: true }),
    onLeaveBack: () => gsap.to(L, { rise: 1, duration: 0.4, ease: 'power3.in', overwrite: true }),
  });

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(word);
  gsap.ticker.add((t, dtMs) => {
    if (!visible) return;
    const dt = Math.min(0.05, dtMs / 1000);
    for (const l of L) {
      let tx = 0, ty = 0, ts = 1;
      if (m.on) {
        const dx = l.cx - m.x, dy = l.cy - m.y;
        const d = Math.hypot(dx, dy);
        const R = l.w * 1.6;
        if (d < R) {
          const f = Math.pow(1 - d / R, 2);
          tx = (dx / (d || 1)) * f * l.w * 0.9;
          ty = (dy / (d || 1)) * f * l.w * 0.6;
          ts = 1 - f * 0.55;
        }
      }
      // mola com um pouco de balanço: a letra é um balão, não um bloco
      const k = 90, c = 11;
      l.vx += ((tx - l.x) * k - l.vx * c) * dt; l.x += l.vx * dt;
      l.vy += ((ty - l.y) * k - l.vy * c) * dt; l.y += l.vy * dt;
      l.vs += ((ts - l.s) * k - l.vs * c) * dt; l.s += l.vs * dt;
      l.el.style.transform = `translate3d(${l.x}px, ${l.y + l.rise * 110}%, 0) scale(${l.s})`;
    }
  });
}
