/*
 * Fases em dados (fases/*.json) e as verificações da skill level-design. Não depende de nada gráfico:
 * o jogo usa normalizar(); os testes (testes/fase1.test.mjs) usam as verificações.
 *  - problemasDeRitmo: o ritmo sobe em dente de serra, começa ensinando e tem descanso antes do clímax;
 *  - tentarSalto: um "jogador robô" corre, pula na beirada e se guia no ar até a plataforma seguinte, com a
 *    física do jogo e a fase inteira (paredes e tetos contam). Cada salto do caminho e de cada retorno tem que dar certo.
 */
import { CONST, criarCorpo, passo } from './fisica.js';

export const FUNDO = 1100;   // y até onde vão os blocos sem altura definida

/** Completa os sólidos (altura até o fundo) e indexa por id. */
export function normalizar(fase) {
  const solidos = fase.solidos.map((s) => ({ ...s, h: s.h ?? Math.max(1, FUNDO - s.y) }));
  const porId = Object.fromEntries(solidos.map((s) => [s.id, s]));
  return { ...fase, solidos, porId };
}

/** Lista de problemas no ritmo (vazia = passou). Mesmo critério do padrão 2 da skill level-design. */
export function problemasDeRitmo(batidas, alto = 0.7, maxSeguidas = 2) {
  const p = [];
  let seguidas = 0;
  batidas.forEach((b, i) => {
    seguidas = b.intensidade >= alto ? seguidas + 1 : 0;
    if (seguidas > maxSeguidas) p.push(`${b.trecho}: ${seguidas} trechos intensos seguidos`);
    if (b.tipo === 'climax' && (i === 0 || batidas[i - 1].tipo !== 'descanso')) p.push(`${b.trecho}: sem descanso antes do clímax`);
  });
  if (batidas.length && batidas[0].tipo !== 'ensina') p.push(`${batidas[0].trecho}: a fase não começa ensinando`);
  return p;
}

const nada = { esquerda: false, direita: false, pular: false, pularSegurado: false, esquiva: false, podeSaltoDuplo: false };

/**
 * Tenta ir da plataforma A para a B com um pulo normal (sem o Salto da Lua).
 * Devolve { ok, onde } (onde = id do sólido em que pousou, ou 'abismo').
 */
export function tentarSalto(fase, idA, idB) {
  const A = fase.porId[idA], B = fase.porId[idB], L = CONST.LARGURA;
  const dir = B.x + B.w / 2 >= A.x + A.w / 2 ? 1 : -1;
  // ponto de impulso: a beirada de A na direção de B, ou um pouco antes de B se B estiver por cima de A
  const borda = dir > 0 ? Math.min(A.x + A.w - 4, B.x - 30 + L) : Math.max(A.x + 4, B.x + B.w + 30 - L);
  const impulso = dir > 0 ? Math.max(A.x + L + 4, borda) : Math.min(A.x + A.w - L - 4, borda);
  const xInicial = dir > 0 ? Math.max(A.x + 2, impulso - L - 220) : Math.min(A.x + A.w - L - 2, impulso + 220);
  const c = criarCorpo(xInicial, A.y - CONST.ALTURA);
  passo(c, nada, fase.solidos);
  let pulou = false;
  for (let t = 0; t < 400; t++) {
    const frente = dir > 0 ? c.x + L : c.x;
    const centro = c.x + L / 2, alvo = B.x + B.w / 2;
    let entrada;
    if (!pulou) {
      // pula na beirada — ou antes, se bater numa parede (um degrau em cima do próprio chão)
      const chegou = (dir > 0 ? frente >= impulso : frente <= impulso) || (t > 5 && c.noChao && Math.abs(c.vx) < 1);
      entrada = { ...nada, direita: dir > 0, esquerda: dir < 0, pular: chegou, pularSegurado: chegou };
      if (chegou) pulou = true;
    } else {
      // no ar: segura o pulo e se guia para o meio de B
      const falta = alvo - centro;
      entrada = { ...nada, pularSegurado: true, direita: falta > 24, esquerda: falta < -24 };
    }
    passo(c, entrada, fase.solidos);
    if (c.y > fase.abismo) return { ok: false, onde: 'abismo' };
    if (pulou && c.noChao && t > 2) {
      const pe = c.y + CONST.ALTURA;
      const onde = fase.solidos.find((s) => Math.abs(s.y - pe) < 1 && c.x + L > s.x && c.x < s.x + s.w);
      if (onde && onde.id === idA && t < 8) continue;   // ainda nem saiu de A
      return { ok: onde?.id === idB, onde: onde?.id ?? '?' };
    }
  }
  return { ok: false, onde: 'tempo' };
}

/** Confere o caminho principal e os retornos. Devolve a lista de saltos que falharam. */
export function saltosQueFalham(fase) {
  const falhas = [];
  for (let i = 0; i + 1 < fase.caminho.length; i++) {
    const r = tentarSalto(fase, fase.caminho[i], fase.caminho[i + 1]);
    if (!r.ok) falhas.push(`${fase.caminho[i]} → ${fase.caminho[i + 1]} (caiu em ${r.onde})`);
  }
  for (const v of fase.retornos ?? []) {
    const r = tentarSalto(fase, v.de, v.para);
    if (!r.ok) falhas.push(`retorno ${v.de} → ${v.para} (caiu em ${r.onde})`);
  }
  return falhas;
}
