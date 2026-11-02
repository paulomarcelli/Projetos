// Rótulos de spec presos a pontos 3D projetados na tela (vista explodida). Posição e fio seguem o 3D a cada
// quadro; a entrada e a saída são por tempo: o texto sobe na máscara e o fio se desenha até o ponto.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { EASE } from './ease.js';

export function callouts({ root, svg, stage, reduced }) {
  const NS = 'http://www.w3.org/2000/svg';
  const items = [...root.querySelectorAll('.callout')].map((el) => {
    // máscara por linha (número e rótulo)
    [...el.children].forEach((c) => { const w = document.createElement('span'); w.className = 'lnm'; c.replaceWith(w); w.append(c); });
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('pathLength', '1000');
    path.setAttribute('stroke-dasharray', '1000');
    path.setAttribute('stroke-dashoffset', '1000');
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('opacity', '0');
    svg.append(path, dot);
    return { el, name: el.dataset.anchor, side: el.dataset.side, path, dot, lines: [...el.querySelectorAll('.lnm > *')], w: 0, h: 0 };
  });
  gsap.set(items.flatMap((it) => it.lines), { yPercent: 140 });
  const v = new THREE.Vector3(), s = { x: 0, y: 0, z: 0 };
  let liveUntil = 0;

  function measure() { items.forEach((it) => { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; }); }

  function enter(it, dir) {
    it.on = true; it.timer?.kill();
    gsap.set(it.el, { visibility: 'visible' });
    gsap.fromTo(it.lines, { yPercent: 140 * dir }, { yPercent: 0, duration: reduced ? 0 : 1, ease: EASE.out, stagger: 0.06, overwrite: true });
    gsap.fromTo(it.path, { attr: { 'stroke-dashoffset': 1000 } }, { attr: { 'stroke-dashoffset': 0 }, duration: reduced ? 0 : 1.1, ease: EASE.out, delay: reduced ? 0 : 0.1, overwrite: true });
    gsap.to(it.dot, { attr: { opacity: 1 }, duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.6, overwrite: true });
  }
  function leave(it, dir) {
    it.on = false;
    gsap.to(it.lines, { yPercent: -140 * dir, duration: reduced ? 0 : 0.4, ease: EASE.in, stagger: 0.03, overwrite: true });
    gsap.to(it.path, { attr: { 'stroke-dashoffset': -1000 }, duration: reduced ? 0 : 0.45, ease: EASE.in, overwrite: true });
    gsap.to(it.dot, { attr: { opacity: 0 }, duration: reduced ? 0 : 0.2, overwrite: true });
    it.timer = gsap.delayedCall(reduced ? 0 : 0.6, () => gsap.set(it.el, { visibility: 'hidden' }));
  }

  /** cada rótulo tem a própria janela [a, b) no progresso da seção: entram escalonados, saem juntos */
  function set(p, dir = 1, windows) {
    let any = false;
    items.forEach((it, i) => {
      const [a, b] = windows[i];
      const v = p >= a && p < b;
      if (v && !it.on) { if (!it.w) measure(); enter(it, dir); }
      else if (!v && it.on) leave(it, dir);
      if (it.on) any = true;
    });
    if (any) liveUntil = Infinity;
    else if (liveUntil === Infinity) liveUntil = performance.now() + 700;
  }

  function update() {
    if (performance.now() > liveUntil) return;
    const W = innerWidth, Hh = innerHeight, mob = W < 760;
    const gut = mob ? 14 : Math.max(16, W * 0.018) + W * 0.05;
    const top = mob ? 120 : 96, bottom = Hh - (mob ? 70 : 90);
    for (const it of items) {
      it.side = mob ? 'l' : it.el.dataset.side; // celular: todos na coluna da esquerda, o aparelho à direita
      stage.phone.anchorWorld(it.name, v);
      stage.project(v, s);
      it.sx = s.x; it.sy = s.y;
      it.ly = s.y - it.h - (mob ? 6 : 10);
    }
    // rótulos do mesmo lado nunca se encostam: empurra para baixo na ordem da tela
    const gap = mob ? 10 : 22;
    for (const side of ['l', 'r']) {
      const col = items.filter((it) => it.side === side).sort((a, b) => a.ly - b.ly);
      let floor = top;
      for (const it of col) { it.ly = Math.max(it.ly, floor); floor = it.ly + it.h + gap; }
    }
    for (const it of items) {
      const left = it.side === 'l';
      const lx = left ? gut : W - gut - it.w;
      const ly = Math.min(bottom - it.h, it.ly);
      it.el.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      const by = ly + it.h + (mob ? 3 : 5);
      const x0 = left ? lx : lx + it.w;
      const x1 = left ? lx + it.w + (mob ? 10 : 26) : lx - (mob ? 10 : 26);
      it.path.setAttribute('d', `M${x0} ${by} H${x1} L${it.sx} ${it.sy}`);
      it.dot.setAttribute('cx', it.sx); it.dot.setAttribute('cy', it.sy);
    }
  }
  addEventListener('resize', measure);
  return { set, update };
}
