// HUD da câmera: a leitura de zoom (× e mm) e a linha do gráfico seguem a rolagem. As lentes de 3× e 5×
// acendem por tempo quando o zoom passa por elas. Distâncias focais equivalentes: 23, 67 e 111 mm.
import { gsap } from 'gsap';

export const focal = (z) => 23 + (z - 1) * 22; // as três lentes caem numa reta: 22 mm por "×"

export function cameraHud(root) {
  const zoomEl = root.querySelector('.zoom');
  const mmEl = root.querySelector('.mm');
  const line = root.querySelector('.chart__line');
  const dot = root.querySelector('.chart__dot');
  const p3 = root.querySelector('.chart__p3');
  const p5 = root.querySelector('.chart__p5');
  let last = '', on3 = false, on5 = false;
  // gráfico: x = zoom (0 a 5×), y = distância focal (0 a 120 mm)
  const X = (z) => 40 + (z / 5) * 400, Y = (mm) => 150 - (mm / 120) * 130;
  return function update(p) {
    const z = 1 + Math.min(1, Math.max(0, p)) * 4;
    const txt = z.toFixed(1).replace('.', ',');
    if (txt !== last) { zoomEl.textContent = txt; mmEl.textContent = String(Math.round(focal(z))); last = txt; }
    line.setAttribute('stroke-dashoffset', String(1000 - p * 1000));
    dot.setAttribute('cx', String(X(z)));
    dot.setAttribute('cy', String(Y(focal(z))));
    const a = z >= 3, e = z >= 4.98;
    if (a !== on3) { on3 = a; gsap.to(p3, { opacity: a ? 1 : 0.18, duration: a ? 0.6 : 0.3, ease: a ? 'expo.out' : 'power3.in', overwrite: true }); }
    if (e !== on5) { on5 = e; gsap.to(p5, { opacity: e ? 1 : 0.18, duration: e ? 0.6 : 0.3, ease: e ? 'expo.out' : 'power3.in', overwrite: true }); }
  };
}
