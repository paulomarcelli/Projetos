// Testes da furtividade do Prólogo (skill game-ai: patrulha e percepção)
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarGuarda, atualizarGuarda, enxerga, atualizarAlerta, VISAO } from '../src/furtividade.js';

const CHAO_Y = 600;
const guarda = (dir = 1) => ({ ...criarGuarda({ x: 500, y: CHAO_Y, de: 300, ate: 900 }), dir });
// a menina: caixa de 32 × 126 com os pés no chão
const menina = (x, extra = {}) => ({ x, y: CHAO_Y - 126, w: 32, h: 126, ...extra });

test('vê a menina na frente, dentro do alcance', () => {
  assert.equal(enxerga(guarda(1), menina(700), []), true);
});

test('não vê quem está atrás dele', () => {
  assert.equal(enxerga(guarda(1), menina(300), []), false);
});

test('não vê além do alcance', () => {
  assert.equal(enxerga(guarda(1), menina(500 + VISAO.ALCANCE + 60), []), false);
});

test('agachada, só é vista bem mais perto', () => {
  const g = guarda(1);
  const x = 500 + VISAO.ALCANCE * 0.8;
  assert.equal(enxerga(g, menina(x), []), true);
  assert.equal(enxerga(g, menina(x, { agachada: true }), []), false);
});

test('escondida, não é vista nem bem na frente', () => {
  assert.equal(enxerga(guarda(1), menina(600, { escondida: true }), []), false);
});

test('uma parede entre os dois bloqueia a visão', () => {
  const parede = { x: 600, y: 300, w: 40, h: 300 };
  assert.equal(enxerga(guarda(1), menina(700), [parede]), false);
});

test('plataforma de uma via (galeria) não bloqueia a visão', () => {
  const galeria = { x: 550, y: 520, w: 300, h: 20, umaVia: true };
  assert.equal(enxerga(guarda(1), menina(700), [galeria]), true);
});

test('patrulha vai até a ponta, para olhando e volta', () => {
  const g = guarda(1);
  for (let i = 0; i < 60 * 12; i++) atualizarGuarda(g, 1 / 60);
  assert.ok(g.x >= g.de - 1 && g.x <= g.ate + 1);
  let virou = false, dir = g.dir;
  for (let i = 0; i < 60 * 20; i++) { atualizarGuarda(g, 1 / 60); if (g.dir !== dir) { virou = true; break; } }
  assert.equal(virou, true);
});

test('o alerta enche enquanto é vista e dispara; fora da vista, esvazia', () => {
  let a = 0;
  for (let i = 0; i < 6; i++) a = atualizarAlerta(a, true, 1 / 60, 0.5);
  assert.ok(a > 0 && a < 1, 'um instante de vista não basta');
  for (let i = 0; i < 6; i++) a = atualizarAlerta(a, false, 1 / 60, 0.5);
  const esvaziou = a;
  for (let i = 0; i < 120; i++) a = atualizarAlerta(a, true, 1 / 60, 0.2);
  assert.ok(esvaziou < 0.2 && a >= 1, `alerta ${a}`);
});
