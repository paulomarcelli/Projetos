#!/usr/bin/env node
// Gancho de início de sessão do Claude Code: se o Escritório não estiver aberto neste computador, abre em segundo
// plano. Regras: nunca atrapalhar a sessão. Não escreve nada na tela (o que um gancho de início escreve vai para a
// conversa), sai sempre com código 0 e não faz nada em sessões do Claude na nuvem (lá não é o computador do Paulo).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sair = () => process.exit(0);
setTimeout(sair, 2500).unref();
process.stdin.resume();
process.stdin.on('data', () => {});

if (process.env.CLAUDE_CODE_REMOTE === 'true' || process.env.ESCRITORIO_SEM_AUTOINICIO) sair();

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pasta = path.resolve(aqui, '..');
let porta = 4310;
try {
  porta = Number(process.env.ESCRITORIO_PORTA) || JSON.parse(fs.readFileSync(path.join(pasta, 'escritorio.config.json'), 'utf8')).porta || 4310;
} catch {
  // sem config: porta padrão
}

// O Escritório não pertence a esta sessão: tira as variáveis que a identificam.
function semSessao(env) {
  const limpo = { ...env };
  for (const chave of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SSE_PORT', 'CLAUDE_PROJECT_DIR', 'ESCRITORIO_EXEC_ID', 'ESCRITORIO_TAREFA']) delete limpo[chave];
  return limpo;
}

const req = http.get({ host: '127.0.0.1', port: porta, path: '/api/estado', timeout: 500 }, res => {
  res.resume();
  sair(); // já está aberto
});
req.on('timeout', () => req.destroy(new Error('sem resposta')));
req.on('error', () => {
  try {
    fs.mkdirSync(path.join(pasta, 'dados'), { recursive: true });
    const registro = fs.openSync(path.join(pasta, 'dados', 'escritorio.log'), 'a');
    const filho = spawn(process.execPath, [path.join(pasta, 'bin', 'escritorio.mjs'), 'iniciar'], {
      cwd: pasta,
      detached: true,
      stdio: ['ignore', registro, registro],
      env: semSessao(process.env),
      windowsHide: true,
    });
    filho.unref();
  } catch {
    // não conseguiu abrir: a sessão segue normalmente
  }
  setTimeout(sair, 150);
});
