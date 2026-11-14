/*
 * Furtividade do Prólogo (skill `game-ai`: patrulha e percepção). Sem nada gráfico: testado em testes/furtividade.test.mjs.
 *  - patrulha: o soldado anda entre `de` e `ate`; em cada ponta para, olha por `pausa` segundos e volta;
 *  - visão: cone para a frente (alcance e abertura), bloqueado por paredes; galerias de uma via não bloqueiam;
 *    agachada, a menina só é vista bem mais perto; escondida (atrás de cortina, mesa, coluna), não é vista;
 *  - alerta: ser vista enche um medidor (mais rápido de perto); fora da vista ele esvazia. Cheio = pega.
 */
export const VISAO = {
  ALCANCE: 420,          // px
  ABERTURA: 0.45,        // rad (~26° para cima e para baixo do olhar)
  OLHOS: 110,            // altura dos olhos acima dos pés
  AGACHADA: 0.55,        // fração do alcance quando ela anda escondida
  TEMPO_ALERTA: 0.6,     // s para o alerta encher, vista a meia distância
  ESVAZIA: 1.5,          // por segundo, fora da vista
};

export function criarGuarda({ x, y, de, ate, vel = 70, pausa = 2.2, dir = 1 }) {
  return { x, y, de, ate, vel, pausa, dir, estado: 'andando', relogio: 0, t: 0 };
}

export function atualizarGuarda(g, dt) {
  g.t += dt;
  if (g.estado === 'olhando') {
    g.relogio -= dt;
    if (g.relogio <= 0) { g.dir *= -1; g.estado = 'andando'; }
    return g;
  }
  g.x += g.dir * g.vel * dt;
  const limite = g.dir > 0 ? g.ate : g.de;
  if ((g.dir > 0 && g.x >= limite) || (g.dir < 0 && g.x <= limite)) {
    g.x = limite; g.estado = 'olhando'; g.relogio = g.pausa;
  }
  return g;
}

/** O segmento (x0,y0)→(x1,y1) cruza o retângulo r? (Liang–Barsky) */
function cruza(x0, y0, x1, y1, r) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p, q] of [[-dx, x0 - r.x], [dx, r.x + r.w - x0], [-dy, y0 - r.y], [dy, r.y + r.h - y0]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

/** Ponto dos olhos do guarda e ponto do peito da menina (alvo: { x, y, w, h, agachada, escondida }). */
export function linhaDeVisao(g, alvo) {
  return { ox: g.x, oy: g.y - VISAO.OLHOS, ax: alvo.x + alvo.w / 2, ay: alvo.y + alvo.h * 0.35 };
}

export function enxerga(g, alvo, solidos) {
  if (alvo.escondida) return false;
  const { ox, oy, ax, ay } = linhaDeVisao(g, alvo);
  const dx = ax - ox, dy = ay - oy;
  if (Math.abs(dx) > 4 && Math.sign(dx) !== g.dir) return false;          // atrás dele
  const alcance = VISAO.ALCANCE * (alvo.agachada ? VISAO.AGACHADA : 1);
  if (Math.hypot(dx, dy) > alcance) return false;
  if (Math.abs(Math.atan2(dy, Math.abs(dx))) > VISAO.ABERTURA) return false;
  return !solidos.some((r) => !r.umaVia && cruza(ox, oy, ax, ay, r));
}

/** distancia01: 0 = encostado no guarda, 1 = no limite do alcance. Devolve o novo alerta (0..1). */
export function atualizarAlerta(alerta, visto, dt, distancia01 = 0.5) {
  if (visto) return Math.min(1, alerta + (dt / VISAO.TEMPO_ALERTA) * (1.6 - distancia01));
  return Math.max(0, alerta - VISAO.ESVAZIA * dt);
}
