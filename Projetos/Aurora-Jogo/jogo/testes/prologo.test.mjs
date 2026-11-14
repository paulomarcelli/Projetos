// Verificações do Prólogo (skill level-design + furtividade): ritmo, chão sob cada objeto, caminho alcançável,
// e que cada guarda patrulha em cima de um chão e tem um esconderijo no seu trecho.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizar, problemasDeRitmo, tentarSalto } from '../src/nivel.js';
import { CONST, criarCorpo, passo } from '../src/fisica.js';

const fase = normalizar(JSON.parse(readFileSync(new URL('../fases/prologo.json', import.meta.url))));
const chaoEm = (x, y) => fase.solidos.find((s) => s.tipo !== 'invisivel' && Math.abs(s.y - y) < 1 && x >= s.x && x <= s.x + s.w);

test('o ritmo começa ensinando, sobe aos poucos e descansa antes do clímax', () => {
  assert.deepEqual(problemasDeRitmo(fase.batidas), []);
});

test('velas, esconderijos, guardas e o altar estão sobre um chão', () => {
  for (const o of [...fase.velas, ...fase.esconderijos, ...fase.guardas, fase.altar]) {
    assert.ok(chaoEm(o.x, o.y), `sem chão em x=${o.x}, y=${o.y}`);
  }
});

test('cada guarda patrulha inteiro em cima de um chão', () => {
  for (const g of fase.guardas) {
    assert.ok(chaoEm(g.de, g.y) && chaoEm(g.ate, g.y), `guarda em ${g.x}: patrulha sem chão`);
  }
});

test('cada guarda tem um esconderijo ou uma galeria no trecho dele (dá para passar sem ser vista)', () => {
  for (const g of fase.guardas) {
    const esconde = fase.esconderijos.some((e) => e.x + e.w >= g.de - 200 && e.x <= g.ate + 200);
    const galeria = fase.solidos.some((s) => s.umaVia && s.x <= g.ate && s.x + s.w >= g.de);
    assert.ok(esconde || galeria, `guarda em ${g.x} sem como passar`);
  }
});

test('a galeria é alcançável pelos degraus', () => {
  // cada salto pousa no próximo degrau do caminho (ou num ainda mais adiante: subir dois de uma vez também vale)
  for (let i = 0; i < fase.caminho.length - 1; i++) {
    const r = tentarSalto(fase, fase.caminho[i], fase.caminho[i + 1]);
    assert.ok(fase.caminho.slice(i + 1).includes(r.onde), `${fase.caminho[i]} → ${fase.caminho[i + 1]}: caiu em ${r.onde}`);
  }
});

test('andando até o fim da galeria, a criança desce de volta ao chão e segue', () => {
  const gal = fase.porId.galeria;
  const c = criarCorpo(gal.x + gal.w - 120, gal.y - fase.personagem.altura, fase.personagem);
  for (let t = 0; t < 240; t++) passo(c, { direita: true }, fase.solidos);
  assert.ok(c.noChao && Math.abs(c.y + c.altura - 640) < 1, `parou em y=${c.y + c.altura}`);
  assert.ok(c.x > gal.x + gal.w, 'não passou da galeria');
});

test('as velas (pontos de retorno) ficam em ordem, antes de cada trecho com guarda', () => {
  const xs = fase.velas.map((v) => v.x);
  assert.deepEqual([...xs].sort((a, b) => a - b), xs);
  for (const g of fase.guardas) assert.ok(xs.some((x) => x < g.de), `nenhuma vela antes do guarda em ${g.x}`);
});
