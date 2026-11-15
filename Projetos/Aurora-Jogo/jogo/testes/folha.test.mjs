// A folha de sprites da Aurora adulta (arte/sprites/aurora_folha.json, gerada por ferramentas/montar_folha_nova.py).
// `topos` = y do topo do desenho em cada quadro da célula; os pés ficam em `base`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const meta = JSON.parse(readFileSync(new URL('../../arte/sprites/aurora_folha.json', import.meta.url), 'utf8'));
const altura = (nome, i) => meta.base - meta.animacoes[nome].topos[i];
const EM_PE = altura('parada', 0);

test('correndo: todos os quadros na mesma escala (ela não "diminui" ao correr)', () => {
  // antes da correção, 4 dos 7 quadros vinham ~17% menores (a fileira de baixo da folha do Figma) e um deles sem os
  // pés: a altura caía de 320 para 258 px da célula
  const alturas = meta.animacoes.correndo.topos.map((_, i) => altura('correndo', i));
  for (const [i, h] of alturas.entries()) {
    assert.ok(h >= EM_PE * 0.94, `quadro ${i}: ${h} px, menos de 94% da altura parada (${EM_PE} px)`);
    assert.ok(h <= EM_PE * 1.03, `quadro ${i}: ${h} px, maior que parada (${EM_PE} px)`);
  }
  const sobeDesce = Math.max(...alturas) - Math.min(...alturas);
  assert.ok(sobeDesce <= EM_PE * 0.06, `a cabeça sobe e desce ${sobeDesce} px na corrida (máx ${(EM_PE * 0.06).toFixed(0)})`);
});

test('poses em pé (parada, dano, gestos) têm a mesma altura', () => {
  for (const [nome, i] of [['dano', 0], ['gesto', 0], ['arrumar_cabelo', 0], ['sentar', 0]]) {
    assert.ok(Math.abs(altura(nome, i) - EM_PE) <= EM_PE * 0.04, `${nome}: ${altura(nome, i)} px contra ${EM_PE} px parada`);
  }
});
