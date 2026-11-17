#!/usr/bin/env node
// Claude de simulação, só para os testes: emite eventos no mesmo formato do `claude -p --output-format stream-json`
// (o formato foi copiado de uma execução real). Não chama modelo nenhum. O escritório marca na tela quando está
// usando este arquivo, para ninguém confundir com uma execução de verdade.
const args = process.argv.slice(2);
if (args.includes('--version')) {
  console.log('0.0.0 (simulação)');
  process.exit(0);
}
const valor = nome => {
  const i = args.indexOf(nome);
  return i === -1 ? null : args[i + 1];
};
const agente = valor('--agent') || 'agente';
const prompt = valor('-p') || '';
const atraso = Number(process.env.ESCRITORIO_FALSO_ATRASO || 25);
const espera = ms => new Promise(r => setTimeout(r, ms));
const emitir = objeto => process.stdout.write(JSON.stringify(objeto) + '\n');
let n = 0;
const id = () => `toolu_falso_${agente}_${(n += 1)}`;

const ferramenta = async (nome, entrada, pai = null) => {
  const uso = id();
  emitir({ type: 'assistant', parent_tool_use_id: pai, message: { content: [{ type: 'tool_use', id: uso, name: nome, input: entrada }] } });
  await espera(atraso);
  emitir({ type: 'user', parent_tool_use_id: pai, message: { content: [{ type: 'tool_result', tool_use_id: uso, content: 'ok' }] } });
  await espera(atraso / 2);
  return uso;
};

emitir({ type: 'system', subtype: 'init', model: 'modelo-de-simulacao', session_id: 'sessao-falsa', mcp_servers: [{ name: 'plugin:figma:figma', status: process.env.ESCRITORIO_FALSO_FIGMA || 'needs-auth' }] });
await espera(atraso);

if (process.env.ESCRITORIO_FALSO_LIMITE) {
  emitir({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected' } });
  emitir({ type: 'result', subtype: 'success', is_error: false, result: '', duration_ms: 1, total_cost_usd: 0, num_turns: 0 });
  process.exit(1);
}

emitir({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'thinking', thinking: '' }] } });
await espera(atraso);
await ferramenta('Read', { file_path: '/repo/agentes/PROTOCOLO.md' });

if (/FALHAR/.test(prompt)) {
  emitir({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'Falha simulada para o teste.', duration_ms: 120, total_cost_usd: 0.001, num_turns: 1 });
  process.exit(1);
}

if (/DEMORAR/.test(prompt)) await espera(60_000);

const chamar = /CHAMAR:(\w+)/.exec(prompt)?.[1];
if (chamar) {
  const uso = id();
  emitir({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: uso, name: 'Agent', input: { subagent_type: chamar, description: 'Parte do trabalho', prompt: 'Faça a sua parte.' } }] } });
  await espera(atraso);
  const interno = id();
  emitir({ type: 'assistant', parent_tool_use_id: uso, message: { content: [{ type: 'tool_use', id: interno, name: 'Write', input: { file_path: '/repo/docs/parte.md' } }] } });
  await espera(atraso * 2);
  emitir({ type: 'user', parent_tool_use_id: uso, message: { content: [{ type: 'tool_result', tool_use_id: interno, content: 'ok' }] } });
  await espera(atraso);
  emitir({ type: 'user', parent_tool_use_id: null, message: { content: [{ type: 'tool_result', tool_use_id: uso, content: 'feito' }] } });
  await espera(atraso);
}

let resultado;
if (/Pedido do Paulo/.test(prompt)) {
  const semJson = /SEMPLANO/.test(prompt);
  resultado = semJson
    ? 'Vou pensar no plano e respondo depois.'
    : [
        'Plano do projeto:',
        '```json',
        JSON.stringify({
          projeto: 'Painel de teste',
          tarefas: [
            { chave: 'arq', agente: 'karol', titulo: 'Arquitetura', descricao: 'Definir a estrutura.', dependeDe: [] },
            { chave: 'front', agente: 'karol', titulo: 'Implementar a tela', descricao: 'Fazer a tela.', dependeDe: ['arq'] },
            { chave: 'qa', agente: 'sabrina', titulo: 'Testar', descricao: 'Conferir tudo.', dependeDe: ['front'], tipo: 'revisao' },
          ],
        }),
        '```',
      ].join('\n');
} else {
  await ferramenta('Grep', { pattern: 'tarefa' });
  await ferramenta('Edit', { file_path: `/repo/docs/${agente}.md` });
  await ferramenta('Bash', { command: 'npm test', description: 'Rodando os testes' });
  resultado = `Trabalho de ${agente} feito.\n\nENTREGA\nResumo: simulação de ${agente}.\nArquivos: docs/${agente}.md\nConferido: testes simulados.\nPendências: nenhuma.\nPróximo: o próximo agente.`;
}
emitir({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'text', text: resultado }] } });
await espera(atraso);
emitir({ type: 'result', subtype: 'success', is_error: false, result: resultado, duration_ms: 1500, total_cost_usd: 0.0123, num_turns: 4 });
