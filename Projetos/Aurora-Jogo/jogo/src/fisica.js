/*
 * Física de plataforma da Aurora (passo fixo de 60 Hz, eixo y para baixo, unidades em px).
 * Números da skill `platformer`, calculados com jump_tuner.py:
 *   pulo de 3,2 blocos (bloco = 64 px) com topo em 0,38 s, queda 1,8x mais pesada,
 *   "pulo atrasado" (coyote) de 6 ticks, memória do botão de 7 ticks, integração de meio passo.
 * Não depende de nada gráfico: os testes rodam no Node.
 */
export const CONST = {
  BLOCO: 64,
  LARGURA: 44,
  ALTURA: 170,
  DT: 1 / 60,
  GRAV_SUBIDA: 2836.57,
  GRAV_QUEDA: 5105.82,
  VEL_PULO: -1077.89,
  CORTE_PULO: 0.5,          // soltar o botão subindo corta a velocidade (pulo variável)
  QUEDA_MAX: 1280,          // 20 blocos/s
  VEL_CORRIDA: 384,         // 6 blocos/s
  ACEL_CHAO: 4800,          // chega à velocidade máxima em 0,08 s
  DESACEL_CHAO: 6000,
  CONTROLE_AR: 0.65,
  COYOTE_TICKS: 6,
  BUFFER_TICKS: 7,
  PULO_DUPLO: 0.9,          // Salto da Lua: 90% da força do pulo
  ESQUIVA_VEL: 560,
  ESQUIVA_TICKS: 21,        // 0,35 s
  ESQUIVA_RECARGA: 30,
};
const NUNCA = -1e9;

export function criarCorpo(x, y) {
  return {
    x, y, vx: 0, vy: 0, direcao: 1, noChao: false, tick: 0,
    ultimoChao: NUNCA, ultimoAperto: NUNCA, seguravaPulo: false,
    saltoDuplo: false, esquiva: 0, recargaEsquiva: 0,
    // eventos do último passo (para a animação)
    pulou: false, pulouNoAr: false, aterrissou: false,
  };
}

function sobrepoe(c, r) {
  return c.x < r.x + r.w && c.x + CONST.LARGURA > r.x && c.y < r.y + r.h && c.y + CONST.ALTURA > r.y;
}

function moverX(c, dx, mundo) {
  c.x += dx;
  for (const r of mundo) {
    if (!sobrepoe(c, r)) continue;
    if (dx > 0) c.x = r.x - CONST.LARGURA; else if (dx < 0) c.x = r.x + r.w;
    c.vx = 0;
  }
}

function moverY(c, dy, mundo) {
  c.y += dy;
  let pousou = false;
  for (const r of mundo) {
    if (!sobrepoe(c, r)) continue;
    if (dy > 0) { c.y = r.y - CONST.ALTURA; pousou = true; } else if (dy < 0) c.y = r.y + r.h;
    c.vy = 0;
  }
  return pousou;
}

/** Avança um tick. entrada: { esquerda, direita, pular (apertou agora), pularSegurado, esquiva, podeSaltoDuplo } */
export function passo(c, entrada, mundo) {
  const K = CONST, dt = K.DT;
  c.tick += 1;
  c.pulou = c.pulouNoAr = c.aterrissou = false;
  if (c.recargaEsquiva > 0) c.recargaEsquiva -= 1;

  const eixo = (entrada.direita ? 1 : 0) - (entrada.esquerda ? 1 : 0);
  if (eixo !== 0 && c.esquiva === 0) c.direcao = eixo;

  // esquiva rolando: ignora o controle enquanto dura
  if (entrada.esquiva && c.noChao && c.esquiva === 0 && c.recargaEsquiva === 0) {
    c.esquiva = K.ESQUIVA_TICKS;
  }
  if (c.esquiva > 0) {
    c.esquiva -= 1;
    c.vx = c.direcao * K.ESQUIVA_VEL;
    if (c.esquiva === 0) c.recargaEsquiva = K.ESQUIVA_RECARGA;
  } else {
    const alvo = eixo * K.VEL_CORRIDA;
    const acel = (eixo !== 0 ? K.ACEL_CHAO : K.DESACEL_CHAO) * (c.noChao ? 1 : K.CONTROLE_AR);
    const dif = alvo - c.vx;
    c.vx += Math.sign(dif) * Math.min(Math.abs(dif), acel * dt);
  }

  // pulo: memória do botão + "pulo atrasado", e o pulo duplo no ar
  if (c.noChao && c.vy >= 0) c.ultimoChao = c.tick;
  if (entrada.pular) c.ultimoAperto = c.tick;
  const podePular = c.tick - c.ultimoAperto <= K.BUFFER_TICKS && c.tick - c.ultimoChao <= K.COYOTE_TICKS;
  if (podePular && c.esquiva === 0) {
    c.vy = K.VEL_PULO;
    c.ultimoAperto = c.ultimoChao = NUNCA;
    c.noChao = false;
    c.pulou = true;
    if (!entrada.pularSegurado) c.vy *= K.CORTE_PULO;
  } else if (entrada.pular && entrada.podeSaltoDuplo !== false && !c.noChao && !c.saltoDuplo && c.tick - c.ultimoChao > K.COYOTE_TICKS) {
    c.vy = K.VEL_PULO * K.PULO_DUPLO;
    c.saltoDuplo = true;
    c.ultimoAperto = NUNCA;
    c.pulouNoAr = true;
  }
  if (c.seguravaPulo && !entrada.pularSegurado && c.vy < 0) c.vy *= K.CORTE_PULO;
  c.seguravaPulo = entrada.pularSegurado;

  // gravidade com integração de meio passo (a altura do pulo não depende da taxa de quadros)
  const g = c.vy > 0 ? K.GRAV_QUEDA : K.GRAV_SUBIDA;
  const vyAntes = c.vy;
  c.vy = Math.min(c.vy + g * dt, K.QUEDA_MAX);

  moverX(c, c.vx * dt, mundo);
  const estavaNoChao = c.noChao;
  c.noChao = moverY(c, ((vyAntes + c.vy) / 2) * dt, mundo);
  if (c.noChao) {
    c.saltoDuplo = false;
    if (!estavaNoChao) c.aterrissou = true;
  }
  return c;
}
