// Testes do motor de inferência (rodar com: node --test tests/)
const test = require('node:test');
const assert = require('node:assert/strict');
const { inferir } = require('../js/motor.js');

test('dispara a regra quando a condição é verdadeira e adiciona o fato', () => {
  const regras = [{
    id: 'R1', nome: 'Chuva', se: (f) => f.nublado === true,
    entao: () => ({ levarGuardaChuva: true }), explicacao: 'Céu nublado pede guarda-chuva.',
  }];
  const r = inferir({ nublado: true }, regras);
  assert.equal(r.fatos.levarGuardaChuva, true);
  assert.equal(r.trilha.length, 1);
});

test('não dispara a regra quando a condição é falsa', () => {
  const regras = [{ id: 'R1', nome: 'Chuva', se: (f) => f.nublado === true, entao: () => ({ x: 1 }), explicacao: '' }];
  const r = inferir({ nublado: false }, regras);
  assert.equal(r.fatos.x, undefined);
  assert.deepEqual(r.trilha, []);
});

test('encadeia: uma regra usa o fato criado por outra', () => {
  const regras = [
    { id: 'B', nome: 'B', se: (f) => f.a === true, entao: () => ({ b: true }), explicacao: 'b' },
    { id: 'A', nome: 'A', se: (f) => f.inicio === true, entao: () => ({ a: true }), explicacao: 'a' },
  ];
  const r = inferir({ inicio: true }, regras);
  assert.equal(r.fatos.b, true);
  assert.deepEqual(r.trilha.map((t) => t.id), ['A', 'B']);
});

test('cada regra dispara no máximo uma vez e o motor termina', () => {
  let contador = 0;
  const regras = [{ id: 'R', nome: 'R', se: () => true, entao: () => ({ vezes: ++contador }), explicacao: '' }];
  const r = inferir({}, regras);
  assert.equal(r.fatos.vezes, 1);
  assert.equal(r.trilha.length, 1);
});

test('regras de maior prioridade rodam antes', () => {
  const regras = [
    { id: 'baixa', nome: 'baixa', prioridade: 1, se: () => true, entao: () => ({ ordem: 'baixa' }), explicacao: '' },
    { id: 'alta', nome: 'alta', prioridade: 10, se: () => true, entao: () => ({ ordem: 'alta' }), explicacao: '' },
  ];
  const r = inferir({}, regras);
  assert.deepEqual(r.trilha.map((t) => t.id), ['alta', 'baixa']);
});

test('a trilha guarda id, nome e explicação (texto ou função dos fatos)', () => {
  const regras = [{
    id: 'R7', nome: 'Saudação', se: (f) => !!f.nome, entao: () => ({ saudado: true }),
    explicacao: (f) => `Olá, ${f.nome}.`,
  }];
  const r = inferir({ nome: 'Ana' }, regras);
  assert.deepEqual(r.trilha[0], { id: 'R7', nome: 'Saudação', explicacao: 'Olá, Ana.' });
});

test('não altera os fatos iniciais recebidos', () => {
  const iniciais = { a: 1 };
  inferir(iniciais, [{ id: 'R', nome: 'R', se: () => true, entao: () => ({ b: 2 }), explicacao: '' }]);
  assert.deepEqual(iniciais, { a: 1 });
});
