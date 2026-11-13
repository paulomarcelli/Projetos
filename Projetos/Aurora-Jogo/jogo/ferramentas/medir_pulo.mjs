// Mede o pulo REAL da física do jogo (skill level-design, padrão 1): corre até a velocidade máxima,
// pula segurando o botão e anota a altura máxima, a distância e o tempo no ar até voltar à mesma altura.
// Uso: node ferramentas/medir_pulo.mjs        (imprime JSON; usado também pelo teste da fase)
import { CONST, criarCorpo, passo } from '../src/fisica.js';

export function medirPulo({ segurar = true } = {}) {
  const chao = [{ x: -100000, y: 0, w: 200000, h: 100 }];
  const c = criarCorpo(0, -CONST.ALTURA - 1);
  const parado = { esquerda: false, direita: false, pular: false, pularSegurado: false, esquiva: false, podeSaltoDuplo: false };
  for (let i = 0; i < 30; i++) passo(c, parado, chao);                       // assenta no chão
  for (let i = 0; i < 40; i++) passo(c, { ...parado, direita: true }, chao); // velocidade máxima
  const x0 = c.x, y0 = c.y;
  let apex = 0, ticks = 0, saiu = false;
  passo(c, { ...parado, direita: true, pular: true, pularSegurado: true }, chao);
  while (ticks < 600) {
    passo(c, { ...parado, direita: true, pularSegurado: segurar }, chao);
    ticks += 1;
    apex = Math.max(apex, y0 - c.y);
    if (!c.noChao) saiu = true; else if (saiu) break;
  }
  return { altura: Math.round(apex * 10) / 10, distancia: Math.round(c.x - x0), tempo: Math.round(((ticks + 1) / 60) * 1000) / 1000 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify({ completo: medirPulo(), curto: medirPulo({ segurar: false }), bloco: CONST.BLOCO }));
}
