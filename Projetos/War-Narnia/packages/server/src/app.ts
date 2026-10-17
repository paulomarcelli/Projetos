// Monta Express + HTTP + Socket.IO tipado. Usado pelo index.ts e pelos testes.
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { Server } from 'socket.io';
import type { EngineApi } from '@war/shared';
import { loadConfig, type ServerConfig } from './config.js';
import { loadEngine } from './engine.js';
import { log } from './log.js';
import { RoomManager } from './rooms/manager.js';
import { registerHandlers, type IoServer } from './socket/handlers.js';
import { FileRoomStore } from './store/file-store.js';
import type { RoomStore } from './store/room-store.js';

export interface StartOptions {
  config?: Partial<ServerConfig>;
  /** Injeta um motor (testes). Padrão: o motor de @war/shared. */
  engine?: EngineApi | null;
  store?: RoomStore;
}

export interface RunningServer {
  port: number;
  url: string;
  io: IoServer;
  manager: RoomManager;
  config: ServerConfig;
  close(): Promise<void>;
}

/** Origem permitida? Sem Origin (clientes não-navegador) ou mesma origem: sim. */
function originAllowed(origin: string | undefined, host: string | undefined, allowed: string[]): boolean {
  if (!origin) return true;
  if (allowed.includes('*') || allowed.includes(origin)) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function startServer(opts: StartOptions = {}): Promise<RunningServer> {
  const config: ServerConfig = { ...loadConfig(), ...opts.config };
  const engine = opts.engine === undefined ? loadEngine() : opts.engine;
  if (!engine) log.warn('motor de regras indisponível: partidas não podem começar');

  const store = opts.store ?? new FileRoomStore(config.dataDir);
  const manager = new RoomManager(config, store, engine);
  await manager.init();

  const app = express();
  app.disable('x-powered-by');
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, engine: Boolean(engine) });
  });

  const indexHtml = path.join(config.clientDist, 'index.html');
  if (existsSync(indexHtml)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    // Fallback de SPA: qualquer GET que não seja da API vai para o index.html.
    app.get(/^\/(?!socket\.io\/|healthz).*/, (_req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    log.info('build do cliente não encontrado; servindo só a API', { dir: config.clientDist });
  }

  const httpServer = http.createServer(app);
  const io: IoServer = new Server(httpServer, {
    maxHttpBufferSize: config.maxPayloadBytes,
    cors: config.allowedOrigins.length ? { origin: config.allowedOrigins, credentials: false } : undefined,
    allowRequest: (req, cb) => cb(null, originAllowed(req.headers.origin, req.headers.host, config.allowedOrigins)),
  });
  registerHandlers(io, manager, config);

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(config.port, () => resolve());
  });
  const port = (httpServer.address() as AddressInfo).port;
  log.info('servidor ouvindo', { port });

  return {
    port,
    url: `http://localhost:${port}`,
    io,
    manager,
    config,
    async close() {
      await manager.close();
      await new Promise<void>((resolve) => {
        io.close(() => resolve()); // fecha também o httpServer
      });
    },
  };
}
