// Física do cabelo (src/pesos.js, CorrenteCabelo): repouso, atraso da ponta, pouso, virar e estabilidade.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CorrenteCabelo } from '../src/pesos.js';

const rodar = (c, s, alvo = 0, dt = 1 / 60) => { for (let t = 0; t < s; t += dt) c.atualizar(dt, alvo); };
const ponta = (c) => c.deslocamento(1, 0);

test('parado e sem vento, o cabelo fica na pose desenhada', () => {
  const c = new CorrenteCabelo(); rodar(c, 2);
  assert.ok(Math.abs(ponta(c).dx) < 0.01 && Math.abs(ponta(c).dy) < 0.01);
});

test('o movimento desce como onda: no começo a ponta está mais atrasada que o meio', () => {
  const c = new CorrenteCabelo(); rodar(c, 0.06, 20);
  const meio = c.deslocamento(0.5, 0).dx / (20 * Math.pow(0.5, 1.25)), fim = ponta(c).dx / 20;
  assert.ok(meio > fim, `meio ${meio.toFixed(2)} deveria passar a ponta ${fim.toFixed(2)}`);
  rodar(c, 3, 20);
  assert.ok(Math.abs(ponta(c).dx - 20) < 2, 'depois de um tempo chega ao alvo');
});

test('ao pousar o cabelo cai (y para baixo), quica e volta', () => {
  const c = new CorrenteCabelo(); rodar(c, 0.5);
  c.empurrar(0, -1500 / (1 / 60), 1 / 60);       // parou de cair de uma vez: aceleração para cima
  let maior = 0;
  for (let t = 0; t < 0.4; t += 1 / 60) { c.atualizar(1 / 60, 0); maior = Math.max(maior, ponta(c).dy); }
  assert.ok(maior > 4, `a ponta desceu só ${maior.toFixed(1)} px`);
  rodar(c, 3);
  assert.ok(Math.abs(ponta(c).dy) < 0.5, 'volta ao normal');
});

test('caindo, o cabelo sobe (fica leve)', () => {
  const c = new CorrenteCabelo();
  for (let t = 0; t < 0.5; t += 1 / 60) { c.empurrar(0, 2800, 1 / 60); c.atualizar(1 / 60, 0); }
  assert.ok(ponta(c).dy < -2, `deveria subir: dy = ${ponta(c).dy.toFixed(1)}`);
});

test('ao virar, a ponta chicoteia para a frente e depois assenta', () => {
  const c = new CorrenteCabelo(); rodar(c, 1, -15);
  c.virar(1);
  let maior = -Infinity;
  for (let t = 0; t < 0.3; t += 1 / 60) { c.atualizar(1 / 60, -15); maior = Math.max(maior, ponta(c).dx); }
  assert.ok(maior > 0, 'passou para a frente');
  rodar(c, 3, -15);
  assert.ok(Math.abs(ponta(c).dx + 15) < 2);
});

test('estável com empurrões enormes (sem NaN, dentro do limite)', () => {
  const c = new CorrenteCabelo();
  for (let i = 0; i < 600; i++) {
    c.empurrar((Math.random() - 0.5) * 2e5, (Math.random() - 0.5) * 2e5, 1 / 60);
    c.atualizar(1 / 60, (Math.random() - 0.5) * 60);
    const p = ponta(c);
    assert.ok(Number.isFinite(p.dx) && Number.isFinite(p.dy) && Math.abs(p.dx) < 120 && Math.abs(p.dy) < 120);
  }
});
