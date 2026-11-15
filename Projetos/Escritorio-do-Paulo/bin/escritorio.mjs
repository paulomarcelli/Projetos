#!/usr/bin/env node
// Comando do Escritório do Paulo.
//   node bin/escritorio.mjs iniciar [--abrir] [--porta 4310]   abre o escritório nesta máquina
//   node bin/escritorio.mjs tarefas                             lista as tarefas
//   node bin/escritorio.mjs tarefa "Título" --agente peter [--descricao "…"] [--depende T-0001,T-0002] [--projeto "Nome"] [--iniciar]
//   node bin/escritorio.mjs pedido "O que você quer" [--auto]   manda o pedido para o Steve planejar
//   node bin/escritorio.mjs plano arquivo.json [--auto]         cria as tarefas de um plano
//   node bin/escritorio.mjs ganchos instalar|remover|estado     liga o Claude Code ao escritório
//   node bin/escritorio.mjs figurinhas <arquivo.zip | pasta>   instala as suas figurinhas (ficam fora do git)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';
import { criarServidor, lerConfig, acharRaiz, PASTA_PROJETO } from '../servidor/index.mjs';

const [, , comando = 'iniciar', ...resto] = process.argv;
const opcoes = {};
const livres = [];
for (let i = 0; i < resto.length; i += 1) {
  const item = resto[i];
  if (item.startsWith('--')) {
    const proximo = resto[i + 1];
    if (proximo === undefined || proximo.startsWith('--')) opcoes[item.slice(2)] = true;
    else {
      opcoes[item.slice(2)] = proximo;
      i += 1;
    }
  } else livres.push(item);
}

const config = lerConfig();
const porta = Number(opcoes.porta || config.porta);
const base = `http://127.0.0.1:${porta}`;

async function api(metodo, caminho, corpo) {
  let resposta;
  try {
    resposta = await fetch(base + caminho, { method: metodo, headers: corpo ? { 'Content-Type': 'application/json' } : undefined, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch {
    console.error(`O Escritório não está aberto em ${base}. Abra com: node ${path.relative(process.cwd(), path.join(PASTA_PROJETO, 'bin/escritorio.mjs'))} iniciar`);
    process.exit(2);
  }
  const dados = await resposta.json();
  if (!resposta.ok) {
    console.error(`Não deu certo: ${dados.erro || resposta.status}`);
    process.exit(1);
  }
  return dados;
}

const EVENTOS = ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'SubagentStart', 'SubagentStop', 'Stop'];
const MARCA = 'ganchos/enviar.mjs';

function arquivoDeGanchos() {
  return path.join(acharRaiz(), '.claude', 'settings.json');
}
function lerAjustes() {
  try {
    return JSON.parse(fs.readFileSync(arquivoDeGanchos(), 'utf8'));
  } catch {
    return {};
  }
}
function semOsNossos(ajustes) {
  const hooks = { ...(ajustes.hooks || {}) };
  for (const evento of Object.keys(hooks)) {
    hooks[evento] = (hooks[evento] || [])
      .map(grupo => ({ ...grupo, hooks: (grupo.hooks || []).filter(h => !String(h.command || '').includes(MARCA)) }))
      .filter(grupo => grupo.hooks.length);
    if (!hooks[evento].length) delete hooks[evento];
  }
  return hooks;
}


// Lê um .zip sem dependências: diretório central, cabeçalho local, dados guardados ou comprimidos (deflate).
function lerZip(arquivo) {
  const b = fs.readFileSync(arquivo);
  let fim = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i -= 1) if (b.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  if (fim < 0) throw new Error('Não parece um arquivo .zip.');
  const total = b.readUInt16LE(fim + 10);
  let p = b.readUInt32LE(fim + 16);
  const saida = [];
  for (let n = 0; n < total; n += 1) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('Zip corrompido.');
    const metodo = b.readUInt16LE(p + 10);
    const comprimido = b.readUInt32LE(p + 20);
    const tamNome = b.readUInt16LE(p + 28);
    const tamExtra = b.readUInt16LE(p + 30);
    const tamComent = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const nome = b.slice(p + 46, p + 46 + tamNome).toString('utf8');
    p += 46 + tamNome + tamExtra + tamComent;
    if (nome.endsWith('/')) continue;
    const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    const dados = b.slice(ini, ini + comprimido);
    if (metodo !== 0 && metodo !== 8) continue;
    saida.push({ nome, dados: metodo === 8 ? zlib.inflateRawSync(dados) : dados });
  }
  return saida;
}

async function principal() {
  if (comando === 'iniciar') {
    const escritorio = criarServidor(opcoes.porta ? { config: { porta } } : {});
    let portaReal;
    try {
      portaReal = await escritorio.ouvir(porta);
    } catch (erro) {
      if (erro.code === 'EADDRINUSE') console.error(`A porta ${porta} já está em uso. O Escritório já está aberto? Veja ${base} ou use --porta.`);
      else console.error(erro.message);
      process.exit(1);
    }
    const endereco = `http://127.0.0.1:${portaReal}`;
    const r = escritorio.motor.retrato();
    console.log(`\n  Escritório do Paulo aberto em ${endereco}\n`);
    console.log(`  Equipe: ${r.equipe.map(a => a.nome).join(', ') || 'nenhum agente em .claude/agents'}`);
    console.log(`  Claude Code: ${r.sistema.executor.disponivel ? r.sistema.executor.versao : `não encontrado (${r.sistema.executor.motivo || 'instale e entre na conta'})`}`);
    console.log(`  Ganchos: ${r.sistema.ganchos.instalados ? 'instalados' : 'não instalados (rode: ganchos instalar)'}`);
    if (r.sistema.executor.simulacao) console.log('  ATENÇÃO: usando um Claude de simulação (ESCRITORIO_CLAUDE_BIN). As execuções não são reais.');
    console.log('\n  Ctrl+C fecha o escritório.\n');
    if (opcoes.abrir) {
      const abrir = process.platform === 'darwin' ? ['open', [endereco]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', endereco]] : ['xdg-open', [endereco]];
      try {
        spawn(abrir[0], abrir[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
      } catch {
        // sem navegador disponível: o endereço já está na tela
      }
    }
    const encerrar = async () => {
      await escritorio.fechar();
      process.exit(0);
    };
    process.on('SIGINT', encerrar);
    process.on('SIGTERM', encerrar);
    return;
  }

  if (comando === 'tarefas') {
    const r = await api('GET', '/api/estado');
    if (!r.tarefas.length) return console.log('Nenhuma tarefa ainda.');
    const nome = { fila: 'na fila', andamento: 'em andamento', concluida: 'concluída', erro: 'com erro', cancelada: 'cancelada' };
    for (const t of r.tarefas) {
      const espera = t.bloqueadaPor.length && t.status === 'fila' ? ` · espera ${t.bloqueadaPor.join(', ')}` : '';
      console.log(`${t.id}  ${(nome[t.status] || t.status).padEnd(12)}  ${(t.agente || '—').padEnd(8)}  ${t.titulo}${espera}`);
    }
    return;
  }

  if (comando === 'tarefa') {
    if (!livres[0]) return console.error('Diga o título: tarefa "Título" --agente nome');
    const t = await api('POST', '/api/tarefas', {
      titulo: livres[0], descricao: opcoes.descricao === true ? '' : opcoes.descricao, agente: opcoes.agente === true ? null : opcoes.agente,
      projeto: opcoes.projeto === true ? null : opcoes.projeto, tipo: opcoes.tipo === true ? undefined : opcoes.tipo,
      dependeDe: typeof opcoes.depende === 'string' ? opcoes.depende.split(',').map(s => s.trim()).filter(Boolean) : [],
      iniciar: Boolean(opcoes.iniciar), origem: 'terminal',
    });
    return console.log(`Criada ${t.id}: ${t.titulo}`);
  }

  if (comando === 'pedido') {
    if (!livres[0]) return console.error('Escreva o pedido entre aspas.');
    const t = await api('POST', '/api/pedidos', { pedido: livres.join(' '), auto: Boolean(opcoes.auto) });
    return console.log(`Pedido enviado ao coordenador (${t.id}). Acompanhe em ${base}`);
  }

  if (comando === 'plano') {
    if (!livres[0]) return console.error('Informe o arquivo do plano (JSON).');
    const plano = JSON.parse(fs.readFileSync(path.resolve(livres[0]), 'utf8'));
    const r = await api('POST', '/api/planos', { plano, auto: Boolean(opcoes.auto), origem: 'terminal' });
    console.log(`Projeto "${r.projeto}": ${r.tarefas.length} tarefas criadas (${r.tarefas.map(t => t.id).join(', ')}).`);
    for (const aviso of r.avisos) console.log(`  · ${aviso}`);
    return;
  }

  if (comando === 'ganchos') {
    const acao = livres[0] || 'estado';
    const arquivo = arquivoDeGanchos();
    const ajustes = lerAjustes();
    const instalado = JSON.stringify(ajustes.hooks || {}).includes(MARCA);
    if (acao === 'estado') return console.log(instalado ? `Ganchos instalados em ${arquivo}` : 'Ganchos não instalados.');
    const hooks = semOsNossos(ajustes);
    if (acao === 'instalar') {
      const relativo = path.relative(acharRaiz(), path.join(PASTA_PROJETO, 'ganchos', 'enviar.mjs')).split(path.sep).join('/');
      const nosso = { type: 'command', command: `node "$CLAUDE_PROJECT_DIR/${relativo}"`, timeout: 3 };
      for (const evento of EVENTOS) {
        const grupo = evento === 'PreToolUse' || evento === 'PostToolUse' ? { matcher: '*', hooks: [nosso] } : { hooks: [nosso] };
        hooks[evento] = [...(hooks[evento] || []), grupo];
      }
    } else if (acao !== 'remover') {
      return console.error('Use: ganchos instalar | remover | estado');
    }
    const novo = { ...ajustes, hooks };
    if (!Object.keys(hooks).length) delete novo.hooks;
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify(novo, null, 2) + '\n');
    return console.log(acao === 'instalar' ? `Ganchos instalados em ${arquivo}. Valem a partir da próxima sessão do Claude Code.` : `Ganchos removidos de ${arquivo}.`);
  }

  if (comando === 'figurinhas') {
    const origem = livres[0];
    if (!origem) return console.error('Informe o .zip das figurinhas (ou a pasta com elas): figurinhas figurinhas-pessoais.zip');
    const destino = path.join(PASTA_PROJETO, 'web', 'avatares', 'pessoais');
    fs.mkdirSync(destino, { recursive: true });
    const ids = JSON.parse(fs.readFileSync(path.join(PASTA_PROJETO, 'equipe.json'), 'utf8')).ordem;
    if (!fs.existsSync(origem)) return console.error(`Não achei "${origem}". Confira o caminho do zip (ou da pasta) das figurinhas.`);
    let arquivos;
    try {
      arquivos = fs.statSync(origem).isDirectory()
        ? fs.readdirSync(origem).map(nome => ({ nome, dados: fs.readFileSync(path.join(origem, nome)) }))
        : lerZip(origem);
    } catch (erro) {
      return console.error(`Não consegui ler "${origem}": ${erro.message}`);
    }
    const instaladas = [];
    for (const { nome, dados } of arquivos) {
      const base = path.basename(nome).toLowerCase();
      const m = /^([a-z0-9-]+)\.(png|jpe?g|webp)$/.exec(base);
      if (!m || !ids.includes(m[1])) continue;
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) fs.rmSync(path.join(destino, `${m[1]}.${ext}`), { force: true });
      fs.writeFileSync(path.join(destino, base), dados);
      instaladas.push(m[1]);
    }
    if (!instaladas.length) return console.error(`Nenhuma figurinha reconhecida. Os arquivos precisam ter o nome do agente: ${ids.map(i => `${i}.png`).join(', ')}.`);
    const faltam = ids.filter(i => !instaladas.includes(i));
    console.log(`Figurinhas instaladas: ${instaladas.join(', ')}.${faltam.length ? ` Sem figurinha (fica o desenho): ${faltam.join(', ')}.` : ''}`);
    return console.log('Recarregue a página do Escritório. A pasta web/avatares/pessoais/ fica fora do git.');
  }

  console.error('Comandos: iniciar, tarefas, tarefa, pedido, plano, ganchos, figurinhas');
  process.exit(1);
}

principal();
