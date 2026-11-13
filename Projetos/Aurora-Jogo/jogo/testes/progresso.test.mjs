// Testes da progressão (skill `rpg`) e do salvamento (skill `save-systems`)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  novoProgresso, derivados, custoNivel, evoluir, serializar, desserializar, VERSAO_SAVE,
} from '../src/progresso.js';

test('começa no nível 1, sem moedas, com vida e mana calculadas dos atributos', () => {
  const p = novoProgresso();
  assert.equal(p.nivel, 1);
  assert.equal(p.moedas, 0);
  const d = derivados(p);
  assert.ok(d.vidaMax > 0 && d.manaMax > 0 && d.danoLamina > 0 && d.danoFlecha > 0);
});

test('cada nível custa mais que o anterior (curva cúbica)', () => {
  for (let n = 1; n < 30; n++) assert.ok(custoNivel(n + 1) > custoNivel(n), `nível ${n}`);
});

test('evoluir gasta moedas, sobe o nível e o atributo escolhido', () => {
  const p = { ...novoProgresso(), moedas: 1000 };
  const vidaAntes = derivados(p).vidaMax;
  const r = evoluir(p, 'vigor');
  assert.equal(r.ok, true);
  assert.equal(r.progresso.nivel, 2);
  assert.equal(r.progresso.atributos.vigor, p.atributos.vigor + 1);
  assert.equal(r.progresso.moedas, 1000 - custoNivel(1));
  assert.ok(derivados(r.progresso).vidaMax > vidaAntes);
});

test('sem moedas suficientes não evolui', () => {
  const p = novoProgresso();
  const r = evoluir(p, 'forca');
  assert.equal(r.ok, false);
  assert.equal(r.progresso, p);
});

test('atributo desconhecido é recusado', () => {
  const p = { ...novoProgresso(), moedas: 9999 };
  assert.equal(evoluir(p, 'sorte').ok, false);
});

test('salvar e carregar devolve o mesmo progresso, com versão', () => {
  const p = { ...novoProgresso(), moedas: 321, fogueira: 'fogueira_2' };
  const texto = serializar(p);
  assert.equal(JSON.parse(texto).versao, VERSAO_SAVE);
  assert.deepEqual(desserializar(texto), p);
});

test('save corrompido ou de versão mais nova é recusado sem quebrar o jogo', () => {
  assert.equal(desserializar('{"versao": 1, "niv'), null);
  assert.equal(desserializar(JSON.stringify({ versao: VERSAO_SAVE + 1, nivel: 50 })), null);
  assert.equal(desserializar(''), null);
});
