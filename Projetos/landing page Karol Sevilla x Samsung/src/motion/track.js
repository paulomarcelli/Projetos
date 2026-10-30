// O plano contínuo: uma lista de poses do palco 3D presas a pontos da rolagem. Entre duas poses a câmera,
// a separação das camadas, a lente que sai e a virada do aparelho são interpoladas pela posição da página
// (o Lenis já suaviza a rolagem; aqui não entra mola nenhuma). Rolar para cima desfaz exatamente o caminho.
import { BASE_POSE, POSE_KEYS } from '../three/scene.js';
import { LENSES } from '../three/dims.js';

const L = LENSES[0];
const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outQ = (t) => 1 - Math.pow(1 - t, 3);
const inQ = (t) => t * t * t;
const lin = (t) => t;
const EASES = { io, out: outQ, in: inQ, lin };

// [seção, progresso, pose, pose no celular, curva até aqui]
// progresso: seção presa → 0 quando o topo chega no topo da tela, 1 quando o fim chega no fim;
// hero → 0..1 pela própria altura; ficha → 0 quando o topo entra por baixo, 1 quando chega no topo.
// A virada (flip) só cresce: 0 tela para cima, 180 traseira para cima, 360 tela de novo...
const FRAMES = [
  ['hero', 0, { az: 38, el: 40, dist: 470, tx: 0, ty: 0, tz: 0, fov: 26, sx: 0.2, sy: 0.17, tilt: 1, glow: 1 },
    { az: 22, el: 56, dist: 520, sx: 0.04, sy: 0.02 }],
  ['hero', 0.5, { tilt: 0.6 }, {}],
  // 02 a tela: a câmera desce até rasar o vidro (metade de baixo); a frase entra no preto de cima
  ['mergulho', 0.12, { az: 14, el: 12, dist: 175, tx: -6, ty: 6, tz: 28, fov: 24, sx: -0.06, sy: -0.24, tilt: 0 },
    { az: 16, el: 15, dist: 120, tx: -4, ty: 6, tz: 30, sx: 0, sy: -0.2 }, 'io'],
  ['mergulho', 0.27, { az: 26, el: 11, dist: 168, tx: 4, tz: 20 },
    { az: 26, el: 14, dist: 116, tx: 2, tz: 22 }, 'lin'],
  // 03 por dentro: o plano abre enquanto as camadas já se soltam
  ['mergulho', 0.37, { az: 36, el: 22, dist: 600, tx: 0, ty: -6, tz: 0, fov: 26, sx: 0.08, sy: -0.04, ex: 0.42 },
    { az: 36, el: 26, dist: 760, sx: 0.2, sy: -0.06 }, 'io'],
  ['mergulho', 0.5, { az: 42, el: 22, dist: 620, ty: -8, ex: 1, sx: 0.07, sy: -0.05 },
    { az: 42, el: 25, dist: 760, sx: 0.2, sy: -0.08 }, 'io'],
  // leitura dos rótulos: o modelo nunca para (órbita lenta de ~9°, aproxima 6%, as camadas ainda se afastam 14%)
  ['mergulho', 0.86, { az: 51, el: 24, dist: 585, ex: 1.14 },
    { az: 51, el: 27, dist: 720, ex: 1.14 }, 'lin'],
  // 04 a câmera: recompõe virando de costas e mergulha na lente principal; a lente sai do corpo
  ['camera', 0.16, { az: 30, el: 32, dist: 130, tx: L.x, ty: 4, tz: -L.z, fov: 22, sx: -0.18, sy: -0.02, ex: 0, flip: 180, focus: 1, glow: 0 },
    { az: 30, el: 36, dist: 150, sx: 0, sy: 0.12 }, 'io'],
  ['camera', 0.34, { az: 36, el: 26, dist: 150, ty: 9, lift: 1 }, { dist: 165, ty: 9 }, 'io'],
  ['camera', 0.9, { az: 46, el: 26 }, {}, 'lin'],
  ['camera', 1, { az: 30, el: 40, dist: 430, tx: 0, ty: 0, tz: 0, fov: 26, sx: 0, sy: 0, lift: 0, focus: 0, glow: 0.6 },
    { dist: 380 }, 'io'],
  // 05 fotografe: de cima, chapado, à direita do texto; a tela vira a câmera
  ['fotografe', 0.24, { az: 0, el: 89, dist: 360, flip: 360, sx: 0.2, sy: 0, fov: 24, glow: 0.8 },
    { az: 0, el: 89, dist: 470, sx: 0, sy: -0.12 }, 'io'],
  ['fotografe', 1, { dist: 380 }, { dist: 490 }, 'lin'],
  // 06 a campanha: vira de costas de novo e gira devagar
  ['campanha', 0.3, { az: 24, el: 44, dist: 470, sx: 0.27, sy: 0.04, flip: 540, spin: -14, fov: 26, glow: 0 },
    { az: 22, el: 46, dist: 420, sx: 0, sy: -0.16, flip: 540, spin: -12 }, 'io'],
  ['campanha', 1, { spin: 10, az: 34 }, { spin: 8 }, 'lin'],
  // 07 ficha: desvira (completa a volta), encolhe e fica no alto à direita do título
  ['ficha', 1, { az: 34, el: 42, dist: 980, sx: 0.3, sy: 0.24, flip: 720, spin: 0, fov: 26, glow: 1 },
    { az: 30, el: 48, dist: 520, sx: 0, sy: 0.24, flip: 720, spin: 0 }, 'io'],
];

export function createTrack({ sections, mobile, reduced }) {
  const desk = [], mob = [];
  let pd = { ...BASE_POSE }, pm = { ...BASE_POSE };
  for (const [, , p, m] of FRAMES) {
    pd = { ...pd, ...p };
    pm = { ...pm, ...p, ...m };
    desk.push(pd); mob.push(pm);
  }
  let ys = FRAMES.map(() => 0);
  const ranges = {};

  function resolve() {
    const vh = innerHeight;
    for (const [name, el] of Object.entries(sections)) {
      const top = el.getBoundingClientRect().top + scrollY;
      const h = el.offsetHeight;
      if (name === 'hero') ranges[name] = [0, h];
      else if (name === 'ficha') ranges[name] = [top - vh, top];
      else ranges[name] = [top, top + h - vh];
    }
    ys = FRAMES.map(([name, p]) => { const [a, b] = ranges[name]; return a + (b - a) * p; });
  }

  const out = { ...BASE_POSE };
  function evaluate(y) {
    const P = mobile() ? mob : desk;
    let i = 0;
    while (i < ys.length - 1 && y >= ys[i + 1]) i++;
    let a = P[i], b = P[Math.min(i + 1, P.length - 1)], t = 0;
    if (y <= ys[0]) { a = b = P[0]; }
    else if (i >= ys.length - 1) { a = b = P[P.length - 1]; }
    else {
      t = (y - ys[i]) / Math.max(1, ys[i + 1] - ys[i]);
      t = EASES[FRAMES[i + 1][4] ?? 'io'](Math.min(1, Math.max(0, t)));
      if (reduced) t = t < 0.5 ? 0 : 1;
    }
    for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
    out.shift = Math.max(0, y - ys[ys.length - 1]);
    return out;
  }
  const progress = (name, y = scrollY) => {
    const [a, b] = ranges[name];
    return Math.min(1, Math.max(0, (y - a) / Math.max(1, b - a)));
  };
  const at = (name, p) => { const [a, b] = ranges[name]; return a + (b - a) * p; };
  return { resolve, evaluate, progress, at, ranges };
}
