#!/usr/bin/env node
// Comando do Escritório do Paulo.
//   node bin/escritorio.mjs iniciar [--abrir] [--porta 4310]   abre o escritório nesta máquina
//   node bin/escritorio.mjs tarefas                             lista as tarefas
//   node bin/escritorio.mjs tarefa "Título" --agente karol [--descricao "…"] [--depende T-0001,T-0002] [--projeto "Nome"] [--iniciar]
//   node bin/escritorio.mjs pedido "O que você quer" [--auto]   manda o pedido para a Sabrina planejar
//   node bin/escritorio.mjs plano arquivo.json [--auto]         cria as tarefas de um plano
//   node bin/escritorio.mjs ganchos instalar|remover|estado     liga o Claude Code ao escritório
//   node bin/escritorio.mjs figurinhas <arquivo.zip | pasta>   instala as suas figurinhas (ficam fora do git)
//   node bin/escritorio.mjs autoiniciar instalar|remover|estado  abre o escritório sozinho quando o computador liga
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
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
const NOSSOS = /ganchos\/(enviar|iniciar)\.mjs/;

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
      .map(grupo => ({ ...grupo, hooks: (grupo.hooks || []).filter(h => !NOSSOS.test(String(h.command || ''))) }))
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

// ---------- início automático com o computador ----------
const ROTULO = 'com.paulomarcelli.escritorio';
function planoDeAutoinicio() {
  const casa = os.homedir();
  const no = process.execPath; // caminho absoluto do Node que está rodando agora
  const bin = path.join(PASTA_PROJETO, 'bin', 'escritorio.mjs');
  const registro = path.join(PASTA_PROJETO, 'dados', 'escritorio.log');
  const caminhos = process.env.PATH || ''; // para o escritório achar o comando "claude" depois
  if (process.platform === 'darwin') {
    const arquivo = path.join(casa, 'Library', 'LaunchAgents', `${ROTULO}.plist`);
    const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const conteudo = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${ROTULO}</string>
  <key>ProgramArguments</key><array><string>${xml(no)}</string><string>${xml(bin)}</string><string>iniciar</string></array>
  <key>WorkingDirectory</key><string>${xml(PASTA_PROJETO)}</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(caminhos)}</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>StandardOutPath</key><string>${xml(registro)}</string>
  <key>StandardErrorPath</key><string>${xml(registro)}</string>
</dict>
</plist>
`;
    return {
      sistema: 'macOS (LaunchAgent)', arquivo, conteudo,
      ligar: () => { spawnSync('launchctl', ['unload', arquivo], { stdio: 'ignore' }); return spawnSync('launchctl', ['load', '-w', arquivo], { encoding: 'utf8' }); },
      desligar: () => spawnSync('launchctl', ['unload', '-w', arquivo], { encoding: 'utf8' }),
    };
  }
  if (process.platform === 'win32') {
    const pastaInicio = path.join(process.env.APPDATA || path.join(casa, 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const arquivo = path.join(pastaInicio, 'Escritorio do Paulo.vbs');
    const aspas = s => String(s).replace(/"/g, '""');
    const conteudo = `' Abre o Escritorio do Paulo quando o Windows inicia, sem janela.\r\nSet s = CreateObject("WScript.Shell")\r\ns.CurrentDirectory = "${aspas(PASTA_PROJETO)}"\r\ns.Run """${aspas(no)}"" ""${aspas(bin)}"" iniciar", 0, False\r\n`;
    return {
      sistema: 'Windows (pasta Inicializar)', arquivo, conteudo,
      ligar: () => spawnSync('wscript', [arquivo], { encoding: 'utf8' }),
      desligar: () => ({ status: 0 }),
    };
  }
  const arquivo = path.join(casa, '.config', 'systemd', 'user', 'escritorio-do-paulo.service');
  const conteudo = `[Unit]
Description=Escritório do Paulo (painel local dos agentes)

[Service]
WorkingDirectory=${PASTA_PROJETO}
Environment=PATH=${caminhos}
ExecStart="${no}" "${bin}" iniciar
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`;
  return {
    sistema: 'Linux (systemd do usuário)', arquivo, conteudo,
    ligar: () => { spawnSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'ignore' }); return spawnSync('systemctl', ['--user', 'enable', '--now', 'escritorio-do-paulo.service'], { encoding: 'utf8' }); },
    desligar: () => spawnSync('systemctl', ['--user', 'disable', '--now', 'escritorio-do-paulo.service'], { encoding: 'utf8' }),
  };
}

async function principal() {
  if (comando === 'iniciar') {
    const escritorio = criarServidor(opcoes.porta ? { config: { porta } } : {});
    let portaReal;
    try {
      portaReal = await escritorio.ouvir(porta);
    } catch (erro) {
      if (erro.code === 'EADDRINUSE') {
        // Se quem está na porta é o próprio Escritório, está tudo certo (o início automático pode chamar duas vezes).
        const ja = await fetch(`${base}/api/estado`).then(r => r.json()).catch(() => null);
        if (ja?.sistema?.nome === 'Escritório do Paulo') {
          console.log(`O Escritório já está aberto em ${base}.`);
          process.exit(0);
        }
        console.error(`A porta ${porta} está em uso por outro programa. Use --porta ou mude "porta" no escritorio.config.json.`);
      } else console.error(erro.message);
      process.exit(1);
    }
    const endereco = `http://127.0.0.1:${portaReal}`;
    const r = escritorio.motor.retrato();
    console.log(`\n  Escritório do Paulo aberto em ${endereco}`);
    if (config.enderecoOnline) console.log(`  Também pelo endereço online (neste computador): ${config.enderecoOnline}${portaReal !== 4310 ? `?porta=${portaReal}` : ''}`);
    console.log('');
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
      // Ao abrir o Claude Code neste computador, abre o escritório se ele estiver fechado (nunca na nuvem).
      const abre = { type: 'command', command: `node "$CLAUDE_PROJECT_DIR/${relativo.replace('enviar.mjs', 'iniciar.mjs')}"`, timeout: 5 };
      hooks.SessionStart = [...(hooks.SessionStart || []), { hooks: [abre] }];
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

  if (comando === 'autoiniciar') {
    const acao = livres[0] || 'estado';
    const plano = planoDeAutoinicio();
    const existe = fs.existsSync(plano.arquivo);
    if (acao === 'estado') return console.log(existe ? `Início automático ligado (${plano.sistema}): ${plano.arquivo}` : 'Início automático desligado.');
    if (acao === 'remover') {
      if (existe) {
        plano.desligar();
        fs.rmSync(plano.arquivo, { force: true });
      }
      return console.log('Início automático desligado. O Escritório não abre mais sozinho quando o computador liga.');
    }
    if (acao !== 'instalar') return console.error('Use: autoiniciar instalar | remover | estado');
    if (process.env.CLAUDE_CODE_REMOTE === 'true') return console.error('Isto é uma sessão do Claude na nuvem: instale o início automático no seu computador.');
    fs.mkdirSync(path.dirname(plano.arquivo), { recursive: true });
    fs.mkdirSync(path.join(PASTA_PROJETO, 'dados'), { recursive: true });
    // No Windows o .vbs vai em UTF-16 com BOM, para caminhos com acento (ex.: "Área de Trabalho") funcionarem.
    if (process.platform === 'win32') fs.writeFileSync(plano.arquivo, `\ufeff${plano.conteudo}`, 'utf16le');
    else fs.writeFileSync(plano.arquivo, plano.conteudo);
    const r = plano.ligar();
    if (r && r.status && r.status !== 0) {
      console.error(`Arquivo criado em ${plano.arquivo}, mas não consegui ligar agora: ${(r.stderr || r.error?.message || '').trim()}`);
      return console.error('Ele vale a partir do próximo início do computador. Para abrir agora: node bin/escritorio.mjs iniciar');
    }
    console.log(`Início automático ligado (${plano.sistema}).`);
    console.log(`O Escritório abre sozinho quando o computador liga e volta se cair. Registro: ${path.join(PASTA_PROJETO, 'dados', 'escritorio.log')}`);
    return console.log(`Endereço: http://127.0.0.1:${porta} · online: ${config.enderecoOnline || ''}`);
  }

  console.error('Comandos: iniciar, tarefas, tarefa, pedido, plano, ganchos, figurinhas, autoiniciar');
  process.exit(1);
}

principal();
