// Servidor local do Escritório do Paulo. Só escuta em 127.0.0.1: nada sai da máquina.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarMotor } from './motor.mjs';
import { ErroDeTarefa } from './tarefas.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const PASTA_PROJETO = path.resolve(aqui, '..');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

export function lerConfig(pastaProjeto = PASTA_PROJETO) {
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.join(pastaProjeto, 'escritorio.config.json'), 'utf8'));
  } catch {
    // sem arquivo: valores padrão
  }
  if (process.env.ESCRITORIO_PORTA) config.porta = Number(process.env.ESCRITORIO_PORTA);
  return { porta: 4310, permissao: 'acceptEdits', paralelas: 2, tempoMaximoMin: 30, concluidoPorMin: 10, semSinalMin: 15, ...config };
}

// A raiz do repositório é a pasta que tem .claude/agents, subindo a partir do projeto.
export function acharRaiz(inicio = PASTA_PROJETO) {
  let pasta = inicio;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(pasta, '.claude', 'agents'))) return pasta;
    const acima = path.dirname(pasta);
    if (acima === pasta) break;
    pasta = acima;
  }
  return path.resolve(inicio, '..', '..');
}

function lerCorpo(req, limite = 512 * 1024) {
  return new Promise((resolver, rejeitar) => {
    let tamanho = 0;
    const partes = [];
    req.on('data', parte => {
      tamanho += parte.length;
      if (tamanho > limite) {
        rejeitar(Object.assign(new Error('Pedido grande demais.'), { status: 413 }));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => {
      const texto = Buffer.concat(partes).toString('utf8');
      if (!texto) return resolver({});
      try {
        resolver(JSON.parse(texto));
      } catch {
        rejeitar(Object.assign(new Error('O corpo do pedido não é JSON válido.'), { status: 400 }));
      }
    });
    req.on('error', rejeitar);
  });
}

export function criarServidor(opcoes = {}) {
  const pastaProjeto = opcoes.pastaProjeto || PASTA_PROJETO;
  const config = { ...lerConfig(pastaProjeto), ...(opcoes.config || {}) };
  const raizRepo = opcoes.raizRepo || process.env.ESCRITORIO_RAIZ || acharRaiz(pastaProjeto);
  const pastaDados = opcoes.pastaDados || process.env.ESCRITORIO_DADOS || path.join(pastaProjeto, 'dados');
  const pastaWeb = path.join(pastaProjeto, 'web');
  const motor = criarMotor({ raizRepo, pastaProjeto, pastaDados, config });

  const responder = (res, status, corpo) => {
    const texto = JSON.stringify(corpo);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(texto);
  };

  // Proteções de um servidor local: só aceita pedidos endereçados a esta máquina, e só altera estado com JSON
  // vindo da própria página (um site aberto em outra aba não consegue criar nem iniciar tarefas).
  const hostLocal = host => /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(String(host || ''));
  function origemPermitida(req) {
    const origem = req.headers.origin;
    if (!origem) return true;
    try {
      return hostLocal(new URL(origem).host);
    } catch {
      return false;
    }
  }

  async function rotas(req, res) {
    const url = new URL(req.url, 'http://local');
    const caminho = decodeURIComponent(url.pathname);
    const metodo = req.method;

    if (!hostLocal(req.headers.host)) return responder(res, 403, { erro: 'O Escritório só atende nesta máquina.' });

    if (caminho.startsWith('/api/')) {
      if (metodo !== 'GET') {
        if (!origemPermitida(req)) return responder(res, 403, { erro: 'Origem não permitida.' });
        if (!String(req.headers['content-type'] || '').includes('application/json')) return responder(res, 415, { erro: 'Envie os dados em JSON.' });
      }
      const a = motor.acoes;
      const partes = caminho.split('/').filter(Boolean); // ['api', ...]

      if (metodo === 'GET' && caminho === '/api/estado') return responder(res, 200, motor.retrato());

      if (metodo === 'GET' && caminho === '/api/eventos') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write(`retry: 2000\nevent: estado\ndata: ${JSON.stringify(motor.retrato())}\n\n`);
        const sair = motor.assinar(dados => res.write(dados));
        const pulso = setInterval(() => res.write(': pulso\n\n'), 20_000);
        req.on('close', () => {
          clearInterval(pulso);
          sair();
        });
        return;
      }

      if (metodo === 'POST' && caminho === '/api/ganchos') {
        const corpo = await lerCorpo(req, 256 * 1024);
        return responder(res, 200, motor.receberGancho(corpo));
      }
      if (metodo === 'POST' && caminho === '/api/tarefas') return responder(res, 201, a.criarTarefa(await lerCorpo(req)));
      if (metodo === 'POST' && caminho === '/api/pedidos') return responder(res, 201, a.pedido(await lerCorpo(req)));
      if (metodo === 'POST' && caminho === '/api/planos') return responder(res, 201, a.plano(await lerCorpo(req)));
      if (metodo === 'POST' && caminho === '/api/fluxos') return responder(res, 201, a.fluxo(await lerCorpo(req)));

      if (partes[1] === 'tarefas' && partes[2]) {
        const id = partes[2];
        if (metodo === 'PATCH' && partes.length === 3) return responder(res, 200, a.editarTarefa(id, await lerCorpo(req)));
        if (metodo === 'DELETE' && partes.length === 3) return responder(res, 200, a.removerTarefa(id));
        if (metodo === 'POST' && partes[3] === 'iniciar') return responder(res, 200, { execId: a.iniciarTarefa(id) });
        if (metodo === 'POST' && partes[3] === 'cancelar') return responder(res, 200, a.cancelarExecucao(id));
        if (metodo === 'GET' && partes[3] === 'entrega') return responder(res, 200, a.entrega(id));
      }
      if (metodo === 'POST' && partes[1] === 'projetos' && partes[2]) return responder(res, 200, a.projeto(partes[2], await lerCorpo(req)));
      if (metodo === 'POST' && partes[1] === 'agentes' && partes[2] && partes[3] === 'visto') return responder(res, 200, a.reconhecer(partes[2]));

      return responder(res, 404, { erro: 'Rota não encontrada.' });
    }

    // Arquivos da interface
    if (metodo !== 'GET' && metodo !== 'HEAD') return responder(res, 405, { erro: 'Método não permitido.' });
    const relativo = caminho === '/' ? 'index.html' : caminho.replace(/^\/+/, '');
    const arquivo = path.resolve(pastaWeb, relativo);
    if (arquivo !== pastaWeb && !arquivo.startsWith(pastaWeb + path.sep)) return responder(res, 403, { erro: 'Caminho não permitido.' });
    fs.readFile(arquivo, (erro, dados) => {
      if (erro) return responder(res, 404, { erro: 'Arquivo não encontrado.' });
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(metodo === 'HEAD' ? undefined : dados);
    });
  }

  const servidor = http.createServer((req, res) => {
    rotas(req, res).catch(erro => {
      if (res.headersSent) return res.end();
      if (erro instanceof ErroDeTarefa) return responder(res, 422, { erro: erro.message });
      if (erro.status) return responder(res, erro.status, { erro: erro.message });
      console.error('[escritório] erro inesperado:', erro);
      responder(res, 500, { erro: 'Erro interno do Escritório.' });
    });
  });

  return {
    servidor,
    motor,
    config,
    raizRepo,
    pastaDados,
    ouvir(porta = config.porta) {
      return new Promise((resolver, rejeitar) => {
        servidor.once('error', rejeitar);
        servidor.listen(porta, '127.0.0.1', () => resolver(servidor.address().port));
      });
    },
    fechar() {
      motor.fechar();
      return new Promise(resolver => {
        servidor.closeAllConnections?.();
        servidor.close(() => resolver());
      });
    },
  };
}
