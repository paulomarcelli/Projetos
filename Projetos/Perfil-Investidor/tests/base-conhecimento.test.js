// Testes da base de conhecimento (regras do domínio "perfil de investidor")
const test = require('node:test');
const assert = require('node:assert/strict');
const base = require('../js/base-conhecimento.js');

// Monta respostas escolhendo, para cada pergunta, a opção de MAIS pontos,
// exceto as perguntas indicadas em `trocas` ({ idPergunta: indiceDaOpcao }).
function respostas(trocas = {}) {
  const r = {};
  for (const p of base.perguntas) {
    const maisOusada = p.opcoes.reduce((iMax, o, i, ops) => (o.pontos > ops[iMax].pontos ? i : iMax), 0);
    r[p.id] = p.id in trocas ? trocas[p.id] : maisOusada;
  }
  return r;
}
function opcaoMaisCautelosa(p) {
  return p.opcoes.reduce((iMin, o, i, ops) => (o.pontos < ops[iMin].pontos ? i : iMin), 0);
}
const ids = (resultado) => resultado.trilha.map((t) => t.id);

test('a base tem 10 perguntas, cada uma com pelo menos 2 opções e texto', () => {
  assert.equal(base.perguntas.length, 10);
  for (const p of base.perguntas) {
    assert.ok(p.texto.length > 10, p.id);
    assert.ok(p.opcoes.length >= 2, p.id);
  }
});

test('respostas mais cautelosas → conservador', () => {
  const trocas = Object.fromEntries(base.perguntas.map((p) => [p.id, opcaoMaisCautelosa(p)]));
  const r = base.avaliar(respostas(trocas));
  assert.equal(r.fatos.perfil, 'conservador');
});

test('respostas mais ousadas → arrojado, sem alertas', () => {
  const r = base.avaliar(respostas());
  assert.equal(r.fatos.perfil, 'arrojado');
  assert.deepEqual(r.fatos.alertas, []);
  assert.ok(ids(r).includes('R03'));
});

test('respostas intermediárias → moderado', () => {
  const r = base.avaliar(respostas({
    objetivo: 2, prazo: 2, reserva: 0, dividas: 0, queda: 2,
    experiencia: 1, conhecimento: 1, renda: 1, estabilidade: 1, preferencia: 1,
  }));
  assert.equal(r.fatos.perfil, 'moderado');
  assert.ok(ids(r).includes('R02'));
});

test('sem reserva de emergência: no máximo conservador e alerta de reserva', () => {
  const semReserva = base.perguntas.find((p) => p.id === 'reserva').opcoes.findIndex((o) => o.fatos.reserva === 'nao');
  const r = base.avaliar(respostas({ reserva: semReserva }));
  assert.equal(r.fatos.perfilPreliminar, 'arrojado');
  assert.equal(r.fatos.perfil, 'conservador');
  assert.ok(r.fatos.alertas.some((a) => a.tipo === 'reserva'));
  assert.ok(ids(r).includes('R10'));
});

test('precisa do dinheiro em menos de 1 ano: no máximo conservador', () => {
  const curto = base.perguntas.find((p) => p.id === 'prazo').opcoes.findIndex((o) => o.fatos.prazo === 'curto');
  const r = base.avaliar(respostas({ prazo: curto }));
  assert.equal(r.fatos.perfil, 'conservador');
  assert.ok(ids(r).includes('R11'));
});

test('venderia tudo numa queda de 10%: no máximo moderado', () => {
  const vende = base.perguntas.find((p) => p.id === 'queda').opcoes.findIndex((o) => o.fatos.reacaoQueda === 'vende');
  const r = base.avaliar(respostas({ queda: vende }));
  assert.equal(r.fatos.perfil, 'moderado');
  assert.ok(ids(r).includes('R12'));
});

test('dívida cara gera alerta sem mudar o perfil', () => {
  const divida = base.perguntas.find((p) => p.id === 'dividas').opcoes.findIndex((o) => o.fatos.dividaCara === true);
  const r = base.avaliar(respostas({ dividas: divida }));
  assert.equal(r.fatos.perfil, 'arrojado');
  assert.ok(r.fatos.alertas.some((a) => a.tipo === 'divida'));
});

test('a explicação do perfil final avisa quando o perfil foi rebaixado por segurança', () => {
  const curto = base.perguntas.find((p) => p.id === 'prazo').opcoes.findIndex((o) => o.fatos.prazo === 'curto');
  const r = base.avaliar(respostas({ prazo: curto }));
  const final = r.trilha.find((t) => t.id === 'R20');
  assert.match(final.explicacao, /seguran/i);
});

test('cada perfil tem uma carteira de exemplo que soma 100%', () => {
  for (const perfil of base.NIVEIS) {
    const total = base.carteiras[perfil].reduce((s, item) => s + item.percentual, 0);
    assert.equal(total, 100, perfil);
  }
});

test('o resultado inclui a carteira do perfil final', () => {
  const r = base.avaliar(respostas());
  assert.deepEqual(r.fatos.carteira, base.carteiras.arrojado);
});

test('respostas incompletas geram erro claro', () => {
  assert.throws(() => base.avaliar({ objetivo: 0 }), /sem resposta/);
});
