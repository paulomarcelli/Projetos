// Testes da física de plataforma (números da skill `platformer`, gerados pelo jump_tuner.py)
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCorpo, passo, CONST } from '../src/fisica.js';

const CHAO = [{ x: -1000, y: 600, w: 4000, h: 100 }];
const nada = { esquerda: false, direita: false, pular: false, pularSegurado: false, esquiva: false };
const comPulo = { ...nada, pular: true, pularSegurado: true };
const segurando = { ...nada, pularSegurado: true };

function noChao() {
  const c = criarCorpo(0, 600 - CONST.ALTURA);
  for (let i = 0; i < 5; i++) passo(c, nada, CHAO);
  return c;
}

test('fica parado no chão', () => {
  const c = noChao();
  assert.equal(c.noChao, true);
  assert.equal(Math.round(c.y + CONST.ALTURA), 600);
});

test('pulo segurado atinge ~3,2 blocos (204,8 px), com no máximo 3% de erro', () => {
  const c = noChao();
  const y0 = c.y; let menor = y0;
  passo(c, comPulo, CHAO);
  for (let i = 0; i < 60; i++) { passo(c, segurando, CHAO); menor = Math.min(menor, c.y); }
  const altura = y0 - menor;
  assert.ok(Math.abs(altura - 204.8) / 204.8 < 0.03, `altura ${altura.toFixed(1)}`);
});

test('toque rápido faz um pulo bem mais baixo (pulo variável)', () => {
  const c = noChao();
  const y0 = c.y; let menor = y0;
  passo(c, comPulo, CHAO);
  for (let i = 0; i < 60; i++) { passo(c, nada, CHAO); menor = Math.min(menor, c.y); }
  assert.ok(y0 - menor < 204.8 * 0.5, `altura ${(y0 - menor).toFixed(1)}`);
});

test('memória do botão: apertar pouco antes de tocar o chão ainda pula', () => {
  const c = criarCorpo(0, 600 - CONST.ALTURA - 40);
  let tocou = false;
  for (let i = 0; i < 120 && !tocou; i++) {
    const quasaChao = c.y + CONST.ALTURA > 600 - 18 && c.vy > 0;
    passo(c, quasaChao ? comPulo : nada, CHAO);
    if (quasaChao) { for (let k = 0; k < 12; k++) passo(c, segurando, CHAO); tocou = true; }
  }
  assert.ok(c.y + CONST.ALTURA < 600 - 40, 'deveria estar subindo de novo');
});

test('"pulo atrasado": logo depois de sair da borda ainda dá para pular', () => {
  const plataforma = [{ x: 0, y: 600, w: 200, h: 40 }];
  const c = criarCorpo(150, 600 - CONST.ALTURA);
  for (let i = 0; i < 3; i++) passo(c, nada, plataforma);
  let saiu = 0;
  for (let i = 0; i < 200 && saiu < 3; i++) {
    passo(c, { ...nada, direita: true }, plataforma);
    if (!c.noChao) saiu++;
  }
  const yAntes = c.y;
  passo(c, { ...comPulo, direita: true }, plataforma);
  for (let i = 0; i < 6; i++) passo(c, { ...segurando, direita: true }, plataforma);
  assert.ok(c.y < yAntes - 20, 'o pulo dentro da janela deveria subir');
});

test('não atravessa uma parede andando', () => {
  const mundo = [...CHAO, { x: 300, y: 300, w: 64, h: 300 }];
  const c = criarCorpo(100, 600 - CONST.ALTURA);
  for (let i = 0; i < 180; i++) passo(c, { ...nada, direita: true }, mundo);
  assert.ok(c.x + CONST.LARGURA <= 300 + 0.01, `x final ${c.x}`);
});

test('pulo duplo (Salto da Lua): um só no ar', () => {
  const c = noChao();
  passo(c, comPulo, CHAO);
  for (let i = 0; i < 15; i++) passo(c, segurando, CHAO);
  passo(c, nada, CHAO);
  passo(c, comPulo, CHAO);
  assert.equal(c.saltoDuplo, true);
  assert.ok(c.vy < 0);
  passo(c, nada, CHAO);
  const vy = c.vy;
  passo(c, comPulo, CHAO);
  assert.ok(c.vy >= vy, 'terceiro pulo no ar não deve acontecer');
});
