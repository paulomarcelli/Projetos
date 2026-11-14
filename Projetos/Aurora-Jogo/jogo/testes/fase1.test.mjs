// Verificações da Fase 1 (skill level-design: medidas reais, alcance do caminho, retornos e ritmo)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizar, problemasDeRitmo, saltosQueFalham } from '../src/nivel.js';
import { medirPulo } from '../ferramentas/medir_pulo.mjs';
import { CONST, criarCorpo, passo } from '../src/fisica.js';

const fase = normalizar(JSON.parse(readFileSync(new URL('../fases/fase1.json', import.meta.url), 'utf8')));
const PULO = medirPulo();

test('todo id do caminho e dos retornos existe e é único', () => {
  const ids = fase.solidos.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'id repetido');
  for (const id of [...fase.caminho, ...fase.retornos.flatMap((r) => [r.de, r.para])]) assert.ok(fase.porId[id], `sem sólido ${id}`);
});

test('vãos e subidas do caminho principal cabem no pulo medido (vão ≤ 70% do alcance, subida ≤ topo - meio bloco)', () => {
  const maxVao = PULO.distancia * 0.7, maxSubida = PULO.altura - CONST.BLOCO / 2;
  for (let i = 0; i + 1 < fase.caminho.length; i++) {
    const a = fase.porId[fase.caminho[i]], b = fase.porId[fase.caminho[i + 1]];
    const vao = b.x >= a.x + a.w ? b.x - (a.x + a.w) : (a.x >= b.x + b.w ? a.x - (b.x + b.w) : 0);
    const subida = a.y - b.y;
    assert.ok(vao <= maxVao, `${a.id} → ${b.id}: vão de ${vao} px (máx ${maxVao.toFixed(0)})`);
    assert.ok(subida <= maxSubida, `${a.id} → ${b.id}: subida de ${subida} px (máx ${maxSubida.toFixed(0)})`);
  }
});

test('um jogador robô faz todos os saltos do caminho e dos retornos com a física do jogo', () => {
  assert.deepEqual(saltosQueFalham(fase), []);
});

test('ritmo em dente de serra: começa ensinando, sem 3 trechos intensos seguidos e descanso antes do clímax', () => {
  assert.deepEqual(problemasDeRitmo(fase.batidas), []);
  const climax = fase.batidas.findIndex((b) => b.tipo === 'climax');
  assert.ok(climax > 0 && fase.batidas[climax - 1].tipo === 'descanso');
});

test('fogueiras, criaturas, alvos e o cervo estão em cima de um chão', () => {
  const temChao = (x, y) => fase.solidos.some((s) => Math.abs(s.y - y) < 1 && x >= s.x && x <= s.x + s.w);
  for (const f of fase.fogueiras) assert.ok(temChao(f.x, f.y), `fogueira ${f.id}`);
  for (const s of fase.sombras) {
    assert.ok(temChao(s.x - s.limite, s.y) && temChao(s.x + s.limite, s.y), `sombra em ${s.x} sai do chão na patrulha`);
  }
  for (const a of fase.alvos) assert.ok(temChao(a.x, a.y), `alvo em ${a.x}`);
  assert.ok(temChao(fase.cervo.x, fase.cervo.y), 'cervo');
  assert.ok(temChao(fase.inicio.x, fase.inicio.y), 'início');
});

test('galho (umaVia): atravessa subindo e segura caindo', () => {
  const mundo = [{ x: -500, y: 600, w: 1000, h: 100 }, { x: -200, y: 450, w: 400, h: 18, umaVia: true }];
  const c = criarCorpo(0, 600 - CONST.ALTURA);
  const nada = { esquerda: false, direita: false, pular: false, pularSegurado: false, esquiva: false, podeSaltoDuplo: false };
  for (let i = 0; i < 5; i++) passo(c, nada, mundo);
  passo(c, { ...nada, pular: true, pularSegurado: true }, mundo);
  let passou = false;
  for (let i = 0; i < 80; i++) { passo(c, { ...nada, pularSegurado: true }, mundo); if (c.y + CONST.ALTURA < 450) passou = true; }
  assert.ok(passou, 'não atravessou o galho por baixo');
  assert.equal(Math.round(c.y + CONST.ALTURA), 450, 'não ficou em pé no galho');
});

test('bolsas de moedas em cima de um chão e pingentes presos embaixo de uma rocha', () => {
  const temChao = (x, y) => fase.solidos.some((s) => Math.abs(s.y - y) < 1 && x >= s.x && x <= s.x + s.w);
  for (const b of fase.bolsas ?? []) assert.ok(temChao(b.x, b.y), `bolsa em ${b.x}`);
  for (const p of fase.pingentes ?? []) {
    assert.ok(fase.solidos.some((s) => Math.abs(s.y + s.h - p.y) < 1 && p.x >= s.x && p.x <= s.x + s.w), `pingente em ${p.x} sem teto`);
  }
});

test('rotas altas ensinam o Salto da Lua: fora do pulo normal, dentro do pulo duplo', () => {
  // saliência A5 (acima de A3) e arco T1 (acima de D1): altura maior que o pulo normal e menor que os dois pulos somados
  const duplo = PULO.altura * (1 + CONST.PULO_DUPLO * CONST.PULO_DUPLO) * 0.9;
  for (const [de, para] of [['A3', 'A5'], ['D1', 'T1']]) {
    const subida = fase.porId[de].y - fase.porId[para].y;
    assert.ok(subida > PULO.altura - CONST.BLOCO / 2, `${para} dá para alcançar sem o Salto da Lua (${subida} px)`);
    assert.ok(subida < duplo, `${para} alto demais até para o Salto da Lua (${subida} px, máx ${duplo.toFixed(0)})`);
  }
});
