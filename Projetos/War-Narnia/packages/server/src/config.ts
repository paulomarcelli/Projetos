// Configuração do servidor, lida do ambiente (com valores padrão do protocolo).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMITS } from '@war/shared';

const here = path.dirname(fileURLToPath(import.meta.url));

export interface ServerConfig {
  port: number;
  /** Pasta dos arquivos JSON das salas. */
  dataDir: string;
  /** Pasta do build do cliente (servida se existir). */
  clientDist: string;
  /** Origens extras permitidas (dev). Vazio = só mesma origem. */
  allowedOrigins: string[];
  graceMs: number;
  abandonMs: number;
  maxActionsPerSecond: number;
  /** Outros eventos (sala, sync) por segundo por conexão. */
  maxRequestsPerSecond: number;
  /** Tempo de vida de salas finalizadas/inativas. */
  roomTtlMs: number;
  cleanupIntervalMs: number;
  /** Tamanho máximo de uma mensagem Socket.IO (bytes). */
  maxPayloadBytes: number;
}

function num(v: string | undefined, fallback: number): number {
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: num(env.PORT, 3000),
    dataDir: env.WAR_DATA_DIR ? path.resolve(env.WAR_DATA_DIR) : path.resolve(here, '../data/rooms'),
    clientDist: env.WAR_CLIENT_DIST ? path.resolve(env.WAR_CLIENT_DIST) : path.resolve(here, '../../client/dist'),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    graceMs: num(env.WAR_GRACE_MS, LIMITS.disconnectGraceMs),
    abandonMs: num(env.WAR_ABANDON_MS, LIMITS.abandonAfterMs),
    maxActionsPerSecond: num(env.WAR_MAX_ACTIONS_PER_SECOND, LIMITS.maxActionsPerSecond),
    maxRequestsPerSecond: num(env.WAR_MAX_REQUESTS_PER_SECOND, 20),
    roomTtlMs: num(env.WAR_ROOM_TTL_MS, 24 * 60 * 60_000),
    cleanupIntervalMs: num(env.WAR_CLEANUP_INTERVAL_MS, 10 * 60_000),
    maxPayloadBytes: num(env.WAR_MAX_PAYLOAD_BYTES, 16 * 1024),
  };
}
