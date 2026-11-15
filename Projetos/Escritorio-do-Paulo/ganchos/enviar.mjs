#!/usr/bin/env node
// Gancho do Claude Code: repassa o evento ao Escritório do Paulo, se ele estiver aberto nesta máquina.
// Regras: nunca atrapalhar a conversa. Sai sempre com código 0, não escreve nada na tela e desiste em menos de
// meio segundo se o escritório estiver fechado. Só fala com 127.0.0.1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sair = () => process.exit(0);
setTimeout(sair, 1200).unref();

function porta() {
  if (process.env.ESCRITORIO_PORTA) return Number(process.env.ESCRITORIO_PORTA);
  try {
    const aqui = path.dirname(fileURLToPath(import.meta.url));
    return JSON.parse(fs.readFileSync(path.join(aqui, '..', 'escritorio.config.json'), 'utf8')).porta || 4310;
  } catch {
    return 4310;
  }
}

const cortar = (valor, max) => (typeof valor === 'string' && valor.length > max ? valor.slice(0, max) : valor);

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', pedaco => {
  entrada += pedaco;
  if (entrada.length > 2_000_000) sair();
});
process.stdin.on('error', sair);
process.stdin.on('end', () => {
  let p;
  try {
    p = JSON.parse(entrada);
  } catch {
    return sair();
  }
  // Só o necessário para o painel: nada de conteúdo de arquivo nem de resposta de ferramenta.
  const leve = {
    hook_event_name: p.hook_event_name,
    session_id: p.session_id,
    agent_id: p.agent_id,
    agent_type: p.agent_type,
    tool_name: p.tool_name,
    prompt: cortar(p.prompt, 2000),
    last_assistant_message: cortar(p.last_assistant_message, 8000),
    escritorio_exec: process.env.ESCRITORIO_EXEC_ID || undefined,
  };
  if (p.tool_input && typeof p.tool_input === 'object') {
    leve.tool_input = {};
    for (const chave of ['file_path', 'notebook_path', 'pattern', 'query', 'url', 'skill', 'description', 'command', 'subagent_type', 'prompt']) {
      if (p.tool_input[chave] !== undefined) leve.tool_input[chave] = cortar(p.tool_input[chave], chave === 'prompt' ? 2000 : 300);
    }
  }
  const corpo = JSON.stringify(leve);
  const req = http.request(
    { host: '127.0.0.1', port: porta(), path: '/api/ganchos', method: 'POST', timeout: 400, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(corpo) } },
    res => {
      res.resume();
      res.on('end', sair);
    },
  );
  req.on('timeout', () => {
    req.destroy();
    sair();
  });
  req.on('error', sair);
  req.end(corpo);
});
