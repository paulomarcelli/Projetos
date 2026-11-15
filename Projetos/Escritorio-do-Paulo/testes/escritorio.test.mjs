// Testes do Escritório do Paulo. Rodar: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../servidor/tarefas.mjs';
import { lerCabecalho, carregarEquipe } from '../servidor/equipe.mjs';
import { traduzirFerramenta, ajustarParaRevisao, resumirIntegracoes } from '../servidor/atividade.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaProjeto = path.resolve(aqui, '..');
const raizRepo = path.resolve(pastaProjeto, '..', '..');
process.env.ESCRITORIO_CLAUDE_BIN = path.join(aqui, 'claude-falso.mjs');
process.env.ESCRITORIO_FALSO_ATRASO = '20';
const { criarServidor } = await import('../servidor/index.mjs');

const equipeReal = carregarEquipe(raizRepo, path.join(pastaProjeto, 'equipe.json'));
const ids = equipeReal.map(a => a.id);
const espera = ms => new Promise(r => setTimeout(r, ms));

async function abrir(config = {}) {
  const pastaDados = fs.mkdtempSync(path.join(os.tmpdir(), 'escritorio-'));
  const escritorio = criarServidor({ pastaDados, raizRepo, config: { porta: 0, paralelas: 3, ...config } });
  const porta = await escritorio.ouvir(0);
  const base = `http://127.0.0.1:${porta}`;
  const api = async (metodo, caminho, corpo, cabecalhos) => {
    const r = await fetch(base + caminho, { method: metodo, headers: cabecalhos || (corpo ? { 'Content-Type': 'application/json' } : undefined), body: corpo ? JSON.stringify(corpo) : undefined });
    return { status: r.status, dados: await r.json().catch(() => null) };
  };
  const ate = async (condicao, ms = 8000) => {
    const fim = Date.now() + ms;
    while (Date.now() < fim) {
      const { dados } = await api('GET', '/api/estado');
      if (condicao(dados)) return dados;
      await espera(15);
    }
    throw new Error('A condição esperada não aconteceu a tempo.');
  };
  return { escritorio, base, api, ate, pastaDados, porta };
}

test('a equipe tem os oito agentes reais, cada um com identidade no escritório', () => {
  assert.deepEqual(ids, ['steve', 'sofia', 'tony', 'stephen', 'peter', 'bruce', 'wanda', 'natasha']);
  for (const a of equipeReal) {
    assert.ok(a.descricao.length > 40, `${a.id} tem descrição`);
    assert.equal(a.semIdentidade, false, `${a.id} tem identidade no equipe.json`);
    assert.match(a.cor, /^#[0-9a-f]{6}$/i);
  }
  assert.deepEqual(equipeReal.find(a => a.id === 'sofia').skills, ['design-skills']);
  assert.ok(equipeReal.find(a => a.id === 'stephen').ferramentasDeclaradas.includes('WebSearch'));
});

test('o cabeçalho do agente aceita aspas, dois-pontos e aspas escapadas', () => {
  const { dados, corpo } = lerCabecalho('---\nname: ana\ndescription: "Diz \\"oi\\": sempre."\ntools: Read, Grep\n---\nTexto');
  assert.equal(dados.name, 'ana');
  assert.equal(dados.description, 'Diz "oi": sempre.');
  assert.equal(corpo, 'Texto');
});

test('tarefas: dependência inexistente, ciclo e exclusão com dependentes são recusados', () => {
  const e = { tarefas: [], seq: 0 };
  const a = T.criarTarefa(e, { titulo: 'A', agente: 'sofia' }, ids);
  const b = T.criarTarefa(e, { titulo: 'B', agente: 'peter', dependeDe: [a.id] }, ids);
  assert.equal(a.id, 'T-0001');
  assert.equal(T.pronta(e, a), true);
  assert.equal(T.pronta(e, b), false);
  assert.throws(() => T.criarTarefa(e, { titulo: 'C', dependeDe: ['T-9999'] }, ids), /não existe/);
  assert.throws(() => T.criarTarefa(e, { titulo: '  ' }, ids), /título/);
  assert.throws(() => T.criarTarefa(e, { titulo: 'X', agente: 'thor' }, ids), /Não existe o agente/);
  assert.throws(() => T.editarTarefa(e, a.id, { dependeDe: [b.id] }, ids), /ciclo/);
  assert.throws(() => T.removerTarefa(e, a.id), /depende/);
  a.status = 'erro';
  assert.equal(T.bloqueio(e, b).travada, true);
});

test('plano: a regra do Design System acrescenta a Sofia e prende o front-end nela', () => {
  const e = { tarefas: [], seq: 0 };
  const r = T.aplicarPlano(e, { projeto: 'Loja', tarefas: [{ chave: 'front', agente: 'peter', titulo: 'Tela' }, { chave: 'qa', agente: 'natasha', titulo: 'Testar', dependeDe: ['front'], tipo: 'revisao' }] }, equipeReal);
  const sofia = r.tarefas.find(t => t.agente === 'sofia');
  const peter = r.tarefas.find(t => t.agente === 'peter');
  assert.ok(sofia, 'a tarefa da Sofia foi criada');
  assert.ok(peter.dependeDe.includes(sofia.id));
  assert.equal(r.avisos.length, 2);
  assert.equal(r.tarefas.find(t => t.agente === 'natasha').tipo, 'revisao');
});

test('plano: se o front já depende da Sofia por outro caminho, nada é acrescentado', () => {
  const e = { tarefas: [], seq: 0 };
  const r = T.aplicarPlano(e, { projeto: 'P', tarefas: [{ chave: 'ds', agente: 'sofia', titulo: 'DS' }, { chave: 'arq', agente: 'tony', titulo: 'Arq', dependeDe: ['ds'] }, { chave: 'f', agente: 'peter', titulo: 'Tela', dependeDe: ['arq'] }] }, equipeReal);
  assert.equal(r.avisos.length, 0);
  assert.equal(r.tarefas.length, 3);
});

test('plano: agente desconhecido, chave repetida, dependência solta e ciclo são recusados', () => {
  const novo = () => ({ tarefas: [], seq: 0 });
  assert.throws(() => T.aplicarPlano(novo(), { tarefas: [{ chave: 'a', agente: 'thor', titulo: 'x' }] }, equipeReal), /não existe na equipe/);
  assert.throws(() => T.aplicarPlano(novo(), { tarefas: [{ chave: 'a', agente: 'tony', titulo: 'x' }, { chave: 'a', agente: 'tony', titulo: 'y' }] }, equipeReal), /repete/);
  assert.throws(() => T.aplicarPlano(novo(), { tarefas: [{ chave: 'a', agente: 'tony', titulo: 'x', dependeDe: ['z'] }] }, equipeReal), /não está no plano/);
  assert.throws(() => T.aplicarPlano(novo(), { tarefas: [{ chave: 'a', agente: 'tony', titulo: 'x', dependeDe: ['b'] }, { chave: 'b', agente: 'bruce', titulo: 'y', dependeDe: ['a'] }] }, equipeReal), /ciclo/);
  assert.throws(() => T.aplicarPlano(novo(), { tarefas: [] }, equipeReal), /não tem tarefas/);
});

test('o plano é lido de dentro da resposta do coordenador', () => {
  assert.equal(T.extrairPlano('Segue:\n```json\n{"projeto":"X","tarefas":[{"chave":"a"}]}\n```\nFim.').projeto, 'X');
  assert.equal(T.extrairPlano('{"projeto":"Y","tarefas":[]}').projeto, 'Y');
  assert.equal(T.extrairPlano('sem plano aqui'), null);
});

test('cada ferramenta vira o estado certo', () => {
  assert.equal(traduzirFerramenta('Read', { file_path: '/a/b/app.js' }).estado, 'pesquisando');
  assert.equal(traduzirFerramenta('Read', { file_path: '/a/b/app.js' }).texto, 'Lendo app.js');
  assert.equal(traduzirFerramenta('WebSearch', { query: 'x' }).estado, 'pesquisando');
  assert.equal(traduzirFerramenta('Edit', { file_path: 'x.css' }).estado, 'trabalhando');
  assert.equal(traduzirFerramenta('Bash', { command: 'npm test' }).estado, 'trabalhando');
  assert.equal(traduzirFerramenta('mcp__Figma__use_figma', {}).estado, 'trabalhando');
  assert.equal(traduzirFerramenta('mcp__Figma__get_screenshot', {}).estado, 'pesquisando');
  assert.equal(traduzirFerramenta('Agent', { subagent_type: 'sofia' }).estado, 'aguardando');
  assert.equal(ajustarParaRevisao('trabalhando', 'revisao'), 'revisao');
  assert.equal(ajustarParaRevisao('pensando', 'revisao'), 'pensando');
  assert.equal(resumirIntegracoes([{ name: 'plugin:figma:figma', status: 'needs-auth' }]).figma, 'precisa de autorização');
  assert.equal(resumirIntegracoes([]).figma, 'ausente');
});

test('fluxo de interface: Sofia trabalha primeiro, Peter aguarda, e a equipe conclui em ordem', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    const inicio = await api('GET', '/api/estado');
    assert.ok(inicio.dados.equipe.every(a => a.estado.estado === 'disponivel'), 'ninguém trabalha sem execução');
    assert.equal(inicio.dados.sistema.executor.simulacao, true);

    const criado = await api('POST', '/api/fluxos', { fluxo: 'interface', projeto: 'Vitrine', pedido: 'Uma vitrine de produtos', auto: true });
    assert.equal(criado.status, 201);
    assert.equal(criado.dados.tarefas.length, 4);

    const vistos = {};
    const fim = await ate(r => {
      for (const a of r.equipe) (vistos[a.id] ||= new Set()).add(a.estado.estado);
      return r.tarefas.every(t => t.status === 'concluida');
    });

    assert.ok(vistos.sofia.has('pesquisando') || vistos.sofia.has('trabalhando') || vistos.sofia.has('pensando'), 'Sofia apareceu em atividade');
    assert.ok(vistos.peter.has('aguardando'), 'Peter aguardou as tarefas anteriores');
    assert.ok(vistos.natasha.has('aguardando'), 'Natasha aguardou o front-end');
    assert.ok(!vistos.bruce.has('trabalhando') && !vistos.wanda.has('trabalhando'), 'quem não tem tarefa não aparece trabalhando');

    const ordem = fim.tarefas.map(t => t.concluidaEm);
    assert.ok(ordem[0] <= ordem[1] && ordem[1] <= ordem[2] && ordem[2] <= ordem[3], 'as tarefas terminaram na ordem das dependências');
    assert.equal(fim.projetos[0].concluidas, 4);
    const sofia = fim.equipe.find(a => a.id === 'sofia');
    assert.equal(sofia.estado.estado, 'concluido');
    assert.equal(sofia.metricas.concluidas, 1);
    assert.equal(sofia.metricas.custoUsd, 0.0123);
    assert.equal(sofia.integracoes.figma, 'precisa de autorização');
    assert.ok(sofia.trilha.some(p => p.texto === 'Lendo PROTOCOLO.md'));
    assert.match(fim.tarefas[0].entrega.resumo, /ENTREGA/);
    assert.ok(fim.historico.some(h => h.tipo === 'entrega'));

    const entrega = await api('GET', `/api/tarefas/${fim.tarefas[0].id}/entrega`);
    assert.match(entrega.dados.texto, /Resumo: simulação de sofia/);

    await api('POST', '/api/agentes/sofia/visto', {});
    const depois = await api('GET', '/api/estado');
    assert.equal(depois.dados.equipe.find(a => a.id === 'sofia').estado.estado, 'disponivel');
  } finally {
    await escritorio.fechar();
  }
});

test('tarefa de revisão mostra o agente "em revisão"', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    const t = await api('POST', '/api/tarefas', { titulo: 'Revisar a tela', agente: 'natasha', tipo: 'revisao', iniciar: true });
    assert.equal(t.status, 201);
    const vistos = new Set();
    await ate(r => {
      vistos.add(r.equipe.find(a => a.id === 'natasha').estado.estado);
      return r.tarefas[0].status === 'concluida';
    });
    assert.ok(vistos.has('revisao'), `estados vistos: ${[...vistos].join(', ')}`);
    assert.ok(!vistos.has('trabalhando'));
  } finally {
    await escritorio.fechar();
  }
});

test('pedido ao Steve vira plano, e a regra do Design System entra sozinha', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    const pedido = await api('POST', '/api/pedidos', { pedido: 'Quero um painel novo', auto: false });
    assert.equal(pedido.status, 201);
    const r = await ate(x => x.tarefas[0].status === 'concluida');
    assert.equal(r.tarefas[0].tipo, 'plano');
    const doProjeto = r.tarefas.filter(t => t.projeto === 'Painel de teste' && t.tipo !== 'plano');
    assert.equal(doProjeto.length, 4, 'três do plano mais o Design System');
    const sofia = doProjeto.find(t => t.agente === 'sofia');
    assert.ok(doProjeto.find(t => t.agente === 'peter').dependeDe.includes(sofia.id));
    assert.ok(r.historico.some(h => h.tipo === 'regra'));
    assert.ok(doProjeto.every(t => t.status === 'fila'), 'sem "auto", nada começa sozinho');
    assert.ok(r.equipe.filter(a => a.id !== 'steve').every(a => a.estado.estado === 'disponivel'), 'tarefa planejada não é agente aguardando');

    const ligar = await api('POST', `/api/projetos/${encodeURIComponent('Painel de teste')}`, { auto: true });
    assert.equal(ligar.status, 200);
    await ate(x => x.tarefas.every(t => t.status === 'concluida'));
  } finally {
    await escritorio.fechar();
  }
});

test('plano fora do formato deixa a tarefa do Steve com erro, sem criar nada', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    await api('POST', '/api/pedidos', { pedido: 'SEMPLANO por favor' });
    const r = await ate(x => x.tarefas[0].status === 'erro');
    assert.equal(r.tarefas.length, 1);
    assert.match(r.tarefas[0].erro, /formato combinado/);
  } finally {
    await escritorio.fechar();
  }
});

test('erro numa tarefa: agente fica "com erro", a dependente trava e dá para tentar de novo', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    const a = (await api('POST', '/api/tarefas', { titulo: 'FALHAR de propósito', agente: 'bruce', auto: true })).dados;
    const b = (await api('POST', '/api/tarefas', { titulo: 'Depende da primeira', agente: 'peter', dependeDe: [a.id], auto: true })).dados;
    const r = await ate(x => x.tarefas[0].status === 'erro');
    assert.equal(r.equipe.find(x => x.id === 'bruce').estado.estado, 'erro');
    assert.match(r.tarefas[0].erro, /Falha simulada/);
    const dependente = r.tarefas.find(t => t.id === b.id);
    assert.equal(dependente.status, 'fila');
    assert.equal(dependente.travada, true);
    assert.equal(r.equipe.find(x => x.id === 'peter').estado.estado, 'aguardando');

    const direto = await api('POST', `/api/tarefas/${b.id}/iniciar`, {});
    assert.equal(direto.status, 422);
    assert.match(direto.dados.erro, /Ainda espera/);

    await api('PATCH', `/api/tarefas/${a.id}`, { titulo: 'Agora vai' });
    const denovo = await api('POST', `/api/tarefas/${a.id}/iniciar`, {});
    assert.equal(denovo.status, 200);
    await ate(x => x.tarefas.every(t => t.status === 'concluida'));
  } finally {
    await escritorio.fechar();
  }
});

test('um agente que chama outro aparece aguardando, e o chamado aparece trabalhando', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    await api('POST', '/api/tarefas', { titulo: 'Coordenar CHAMAR:sofia', agente: 'steve', iniciar: true });
    let cruzou = false;
    const r = await ate(x => {
      const steve = x.equipe.find(a => a.id === 'steve').estado;
      const sofia = x.equipe.find(a => a.id === 'sofia').estado;
      if (steve.estado === 'aguardando' && steve.esperando.includes('sofia') && sofia.estado === 'trabalhando') cruzou = true;
      return x.tarefas[0].status === 'concluida';
    });
    assert.ok(cruzou, 'Steve aguardou a Sofia enquanto ela trabalhava');
    assert.ok(r.historico.some(h => h.tipo === 'colaboracao'));
    assert.equal(r.equipe.find(a => a.id === 'sofia').metricas.execucoes, 1);
  } finally {
    await escritorio.fechar();
  }
});

test('cancelar devolve a tarefa para a fila e o agente fica disponível', async () => {
  const { escritorio, api, ate } = await abrir();
  try {
    const t = (await api('POST', '/api/tarefas', { titulo: 'DEMORAR bastante', agente: 'tony', iniciar: true })).dados;
    await ate(x => x.equipe.find(a => a.id === 'tony').estado.estado !== 'disponivel');
    const ocupado = await api('POST', '/api/tarefas', { titulo: 'Outra', agente: 'tony', iniciar: true });
    assert.equal(ocupado.status, 422);
    assert.match(ocupado.dados.erro, /já está em outra tarefa/);
    assert.equal((await api('DELETE', `/api/tarefas/${t.id}`, {})).status, 422);
    assert.equal((await api('POST', `/api/tarefas/${t.id}/cancelar`, {})).status, 200);
    const r = await ate(x => x.tarefas.find(y => y.id === t.id).status === 'fila');
    assert.equal(r.equipe.find(a => a.id === 'tony').estado.estado, 'disponivel');
    assert.equal(r.tarefas.find(y => y.id === t.id).auto, false);
  } finally {
    await escritorio.fechar();
  }
});

test('limite de uso da conta vira erro claro', async () => {
  process.env.ESCRITORIO_FALSO_LIMITE = '1';
  const { escritorio, api, ate } = await abrir();
  try {
    await api('POST', '/api/tarefas', { titulo: 'Qualquer', agente: 'wanda', iniciar: true });
    const r = await ate(x => x.tarefas[0].status === 'erro');
    assert.match(r.tarefas[0].erro, /Limite de uso/);
  } finally {
    delete process.env.ESCRITORIO_FALSO_LIMITE;
    await escritorio.fechar();
  }
});

test('ganchos: um agente chamado numa conversa do Claude Code aparece no escritório', async () => {
  const { escritorio, api } = await abrir();
  try {
    const gancho = corpo => api('POST', '/api/ganchos', { session_id: 'sessao-1', ...corpo });
    await gancho({ hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'sofia', description: 'Revisar a capa', prompt: 'Sofia, revise a capa.' } });
    let r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas.length, 0, 'a chamada ainda não é execução');

    await gancho({ hook_event_name: 'SubagentStart', agent_id: 'ag1', agent_type: 'sofia' });
    r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas[0].titulo, 'Revisar a capa');
    assert.equal(r.tarefas[0].origem, 'claude-code');
    assert.equal(r.tarefas[0].status, 'andamento');
    assert.equal(r.equipe.find(a => a.id === 'sofia').estado.estado, 'pensando');

    await gancho({ hook_event_name: 'PreToolUse', agent_id: 'ag1', agent_type: 'sofia', tool_name: 'mcp__Figma__use_figma', tool_input: {} });
    r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.equipe.find(a => a.id === 'sofia').estado.estado, 'trabalhando');
    assert.equal(r.equipe.find(a => a.id === 'sofia').estado.atividade, 'Trabalhando no Figma');
    assert.equal(r.equipe.find(a => a.id === 'sofia').estado.fonte, 'gancho');

    await gancho({ hook_event_name: 'PostToolUse', agent_id: 'ag1', agent_type: 'sofia', tool_name: 'mcp__Figma__use_figma' });
    await gancho({ hook_event_name: 'SubagentStop', agent_id: 'ag1', agent_type: 'sofia', last_assistant_message: 'Capa revisada.\nENTREGA\nResumo: ok' });
    r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas[0].status, 'concluida');
    assert.match(r.tarefas[0].entrega.resumo, /Capa revisada/);
    assert.equal(r.equipe.find(a => a.id === 'sofia').estado.estado, 'concluido');
    assert.ok(r.sistema.ganchos.ultimoEvento > 0);
  } finally {
    await escritorio.fechar();
  }
});

test('ganchos: execução do próprio escritório, agente de fora da equipe e sessão comum são ignorados', async () => {
  const { escritorio, api } = await abrir();
  try {
    const a = await api('POST', '/api/ganchos', { hook_event_name: 'SubagentStart', session_id: 's', agent_id: 'x1', agent_type: 'sofia', escritorio_exec: 'e-123' });
    const b = await api('POST', '/api/ganchos', { hook_event_name: 'SubagentStart', session_id: 's', agent_id: 'x2', agent_type: 'Explore' });
    const c = await api('POST', '/api/ganchos', { hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Edit', tool_input: { file_path: 'a.js' } });
    assert.equal(a.dados.ignorado, true);
    assert.equal(b.dados.ignorado, true);
    assert.equal(c.dados.ignorado, true);
    const r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas.length, 0);
    assert.ok(r.equipe.every(x => x.estado.estado === 'disponivel'));
  } finally {
    await escritorio.fechar();
  }
});

test('ganchos: conversa aberta direto com um agente, citando uma tarefa da fila, usa essa tarefa', async () => {
  const { escritorio, api } = await abrir();
  try {
    const t = (await api('POST', '/api/tarefas', { titulo: 'Comparar bancos', agente: 'stephen' })).dados;
    const gancho = corpo => api('POST', '/api/ganchos', { session_id: 'sessao-direta', agent_type: 'stephen', ...corpo });
    await gancho({ hook_event_name: 'UserPromptSubmit', prompt: `Faça a ${t.id}, por favor.` });
    await gancho({ hook_event_name: 'PreToolUse', tool_name: 'WebSearch', tool_input: { query: 'sqlite vs postgres' } });
    let r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas.length, 1, 'não criou tarefa nova');
    assert.equal(r.tarefas[0].status, 'andamento');
    assert.equal(r.equipe.find(a => a.id === 'stephen').estado.estado, 'pesquisando');
    await gancho({ hook_event_name: 'Stop', last_assistant_message: 'Recomendo SQLite.' });
    r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas[0].status, 'concluida');
  } finally {
    await escritorio.fechar();
  }
});

test('ganchos: execução sem sinal é encerrada como erro em vez de ficar trabalhando para sempre', async () => {
  const { escritorio, api } = await abrir({ semSinalMin: 0.00001 });
  try {
    await api('POST', '/api/ganchos', { hook_event_name: 'SubagentStart', session_id: 's', agent_id: 'z1', agent_type: 'peter' });
    await espera(5);
    escritorio.motor._interno.varrerSemSinal();
    const r = (await api('GET', '/api/estado')).dados;
    assert.equal(r.tarefas[0].status, 'erro');
    assert.equal(r.equipe.find(a => a.id === 'peter').estado.estado, 'erro');
  } finally {
    await escritorio.fechar();
  }
});

test('as tarefas ficam guardadas, e o que rodava quando o escritório fechou volta marcado com erro', async () => {
  const primeiro = await abrir();
  const t = (await primeiro.api('POST', '/api/tarefas', { titulo: 'DEMORAR muito', agente: 'bruce', iniciar: true })).dados;
  await primeiro.api('POST', '/api/tarefas', { titulo: 'Fica na fila', agente: 'wanda' });
  await primeiro.ate(x => x.tarefas[0].status === 'andamento');
  const guardado = JSON.parse(fs.readFileSync(path.join(primeiro.pastaDados, 'tarefas.json'), 'utf8'));
  assert.equal(guardado.tarefas.length, 2);
  await primeiro.escritorio.fechar();
  // simula a queda: no disco a tarefa ficou "em andamento"
  guardado.tarefas[0].status = 'andamento';
  fs.writeFileSync(path.join(primeiro.pastaDados, 'tarefas.json'), JSON.stringify(guardado));

  const segundo = criarServidor({ pastaDados: primeiro.pastaDados, raizRepo, config: { porta: 0 } });
  try {
    const r = segundo.motor.retrato();
    assert.equal(r.tarefas.find(x => x.id === t.id).status, 'erro');
    assert.match(r.tarefas.find(x => x.id === t.id).erro, /foi fechado/);
    assert.equal(r.tarefas[1].status, 'fila');
    assert.ok(r.equipe.every(a => !['trabalhando', 'pensando', 'pesquisando'].includes(a.estado.estado)));
  } finally {
    await segundo.fechar();
  }
});

test('segurança: só atende esta máquina, exige JSON e não sai da pasta da interface', async () => {
  const { escritorio, api, porta } = await abrir();
  try {
    const http = await import('node:http');
    const pedir = (caminho, cabecalhos) => new Promise(resolver => {
      http.get({ host: '127.0.0.1', port: porta, path: caminho, headers: cabecalhos }, res => {
        res.resume();
        resolver(res.statusCode);
      });
    });
    assert.equal(await pedir('/api/estado', { Host: 'site-malicioso.example' }), 403);
    assert.equal(await pedir('/api/estado', {}), 200);
    assert.equal(await pedir('/../escritorio.config.json', {}), 404);
    assert.equal(await pedir('/%2e%2e/%2e%2e/package.json', {}), 404);
    assert.equal(await pedir('/..%2f..%2fpackage.json', {}), 403);
    assert.equal(await pedir('/..%2fequipe.json', {}), 403);
    assert.equal(await pedir('/index.html', {}), 200);

    const semJson = await api('POST', '/api/tarefas', { titulo: 'x' }, { 'Content-Type': 'text/plain' });
    assert.equal(semJson.status, 415);
    const deFora = await api('POST', '/api/tarefas', { titulo: 'x' }, { 'Content-Type': 'application/json', Origin: 'https://site-malicioso.example' });
    assert.equal(deFora.status, 403);
    const invalido = await fetch(`http://127.0.0.1:${porta}/api/tarefas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' });
    assert.equal(invalido.status, 400);
    assert.equal((await api('GET', '/api/estado')).dados.tarefas.length, 0);
  } finally {
    await escritorio.fechar();
  }
});
