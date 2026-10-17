// Utilitários de teste: sobe o servidor numa porta aleatória e cria clientes socket.io reais
// que gravam TODOS os payloads recebidos (para checar vazamento).
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { io as ioc, type Socket } from 'socket.io-client';
import type { Ack, ClientToServer, EngineApi, PlayerView, RoomSummary, ServerToClient, Session } from '@war/shared';
import { startServer, type RunningServer } from '../../src/app.js';
import type { ServerConfig } from '../../src/config.js';

export type TestSocket = Socket<ServerToClient, ClientToServer>;

export function tmpDataDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'war-rooms-'));
}

export async function boot(opts: { dataDir?: string; config?: Partial<ServerConfig>; engine?: EngineApi | null } = {}) {
  const dataDir = opts.dataDir ?? tmpDataDir();
  const server = await startServer({
    engine: opts.engine,
    config: { port: 0, dataDir, cleanupIntervalMs: 0, clientDist: path.join(dataDir, 'sem-cliente'), ...opts.config },
  });
  return { server, dataDir };
}

export function cleanupDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export interface Client {
  socket: TestSocket;
  /** Todos os eventos recebidos, na ordem: [nome, payload]. */
  received: [string, unknown][];
  /** Respostas (acks) recebidas. */
  acks: unknown[];
  call<E extends keyof ClientToServer>(event: E, payload: Parameters<ClientToServer[E]>[0]): Promise<AckOf<E>>;
  /** Espera o próximo evento que satisfaça o predicado. */
  next<E extends keyof ServerToClient>(event: E, pred?: (p: Parameters<ServerToClient[E]>[0]) => boolean, ms?: number): Promise<Parameters<ServerToClient[E]>[0]>;
  lastView(): PlayerView | undefined;
  lastRoom(): RoomSummary | undefined;
  close(): void;
}

type AckOf<E extends keyof ClientToServer> = Parameters<Parameters<ClientToServer[E]>[1]>[0];

export async function connect(server: RunningServer): Promise<Client> {
  const socket: TestSocket = ioc(server.url, { transports: ['websocket'], reconnection: false, forceNew: true });
  const received: [string, unknown][] = [];
  const acks: unknown[] = [];
  const waiters: { event: string; pred: (p: unknown) => boolean; resolve: (p: unknown) => void }[] = [];
  socket.onAny((event: string, payload: unknown) => {
    received.push([event, payload]);
    for (const w of [...waiters]) {
      if (w.event === event && w.pred(payload)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(payload);
      }
    }
  });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  const client: Client = {
    socket,
    received,
    acks,
    call(event, payload) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`sem ack para ${event}`)), 5000);
        (socket.emit as (...a: unknown[]) => void)(event, payload, (r: unknown) => {
          clearTimeout(timer);
          acks.push(r);
          resolve(r as never);
        });
      });
    },
    next(event, pred = () => true, ms = 5000) {
      return new Promise((resolve, reject) => {
        const w = { event, pred: pred as (p: unknown) => boolean, resolve: resolve as (p: unknown) => void };
        waiters.push(w);
        setTimeout(() => {
          const i = waiters.indexOf(w);
          if (i >= 0) {
            waiters.splice(i, 1);
            reject(new Error(`timeout esperando ${event}`));
          }
        }, ms);
      });
    },
    lastView() {
      return [...received].reverse().find(([e]) => e === 'game:state')?.[1] as PlayerView | undefined;
    },
    lastRoom() {
      return [...received].reverse().find(([e]) => e === 'room:update')?.[1] as RoomSummary | undefined;
    },
    close() {
      socket.disconnect();
    },
  };
  return client;
}

export function ok<T>(r: Ack<T>): T {
  if (!r.ok) throw new Error(`ack com erro: ${r.error.code} ${r.error.message}`);
  return r.data;
}

export function errCode(r: Ack<unknown>): string | undefined {
  return r.ok ? undefined : r.error.code;
}

export type SessionAck = Session & { room: RoomSummary };

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera uma condição (polling curto). */
export async function waitFor(cond: () => boolean, ms = 5000): Promise<void> {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error('timeout em waitFor');
    await delay(20);
  }
}
