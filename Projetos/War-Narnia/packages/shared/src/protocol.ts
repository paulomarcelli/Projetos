/**
 * CONTRATO DE REDE (Socket.IO) entre cliente e servidor.
 *
 * Dono: Tech Lead + Agente 4. O cliente (Agente 3) usa apenas estes eventos.
 * Toda resposta a pedido do cliente vem pelo callback (ack) do Socket.IO.
 *
 * Segurança:
 * - `token` é um segredo por jogador/sala (gerado pelo servidor). Só o dono o recebe,
 *   e o cliente guarda em localStorage APENAS para reconectar. Nunca aparece para outros.
 * - O estado do jogo só chega como `PlayerView` (filtrado por jogador).
 */
import type { GameAction, GameEvent, PlayerColor, PlayerId, PlayerView } from './types';

export const PROTOCOL_VERSION = 1;

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface LobbyPlayer {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  connected: boolean;
}

export interface RoomSummary {
  code: string;
  status: RoomStatus;
  hostId: PlayerId;
  players: LobbyPlayer[];
  minPlayers: number;
  maxPlayers: number;
  createdAt: number;
}

export type ServerErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_NAME'
  | 'INVALID_TOKEN'
  | 'NOT_IN_ROOM'
  | 'STALE_VERSION'
  | 'DUPLICATE_ACTION'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'RULE_ERROR'
  | 'INTERNAL';

export interface ErrorPayload {
  code: ServerErrorCode;
  message: string;
  /** Código do motor quando code === 'RULE_ERROR'. */
  ruleCode?: string;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: ErrorPayload };

export interface Session {
  roomCode: string;
  playerId: PlayerId;
  token: string;
}

/* ---------------- Cliente -> Servidor ---------------- */

export interface ClientToServer {
  'room:create': (p: { name: string }, ack: (r: Ack<Session & { room: RoomSummary }>) => void) => void;
  'room:join': (p: { code: string; name: string }, ack: (r: Ack<Session & { room: RoomSummary }>) => void) => void;
  /** Reconectar com o token salvo. */
  'room:resume': (p: { code: string; token: string }, ack: (r: Ack<Session & { room: RoomSummary }>) => void) => void;
  'room:set-color': (p: { color: PlayerColor }, ack: (r: Ack<RoomSummary>) => void) => void;
  'room:start': (p: Record<string, never>, ack: (r: Ack<null>) => void) => void;
  /** Sair de vez da sala/partida. */
  'room:leave': (p: Record<string, never>, ack: (r: Ack<null>) => void) => void;
  /**
   * Ação de jogo. `clientActionId` evita repetição (o servidor ignora ids repetidos);
   * `expectedVersion` evita agir sobre estado velho (STALE_VERSION).
   */
  'game:action': (
    p: { clientActionId: string; expectedVersion: number; action: GameAction },
    ack: (r: Ack<{ version: number }>) => void,
  ) => void;
  /** Pede o estado atual (por exemplo, depois de reconectar). */
  'game:sync': (p: Record<string, never>, ack: (r: Ack<PlayerView | null>) => void) => void;
}

/* ---------------- Servidor -> Cliente ---------------- */

export interface ServerToClient {
  /** Mudanças na sala (entrada, saída, conexão, cor, início). */
  'room:update': (room: RoomSummary) => void;
  /** Estado do jogo filtrado para quem recebe. Sempre a versão mais nova. */
  'game:state': (view: PlayerView) => void;
  /** Eventos novos (para histórico e animações). Chegam antes do game:state correspondente. */
  'game:events': (events: GameEvent[]) => void;
  /** Aviso não fatal (ex.: jogador desconectado, turno pulado). */
  'room:notice': (n: { kind: 'info' | 'warning'; message: string }) => void;
}

export const LIMITS = {
  minPlayers: 2,
  maxPlayers: 6,
  nameMaxLength: 20,
  roomCodeLength: 5,
  /** Tempo (ms) que o jogador da vez pode ficar desconectado antes de o turno ser pulado. */
  disconnectGraceMs: 60_000,
  /** Depois desse tempo desconectado, o jogador é considerado em abandono. */
  abandonAfterMs: 10 * 60_000,
  /** Ações por segundo por conexão. */
  maxActionsPerSecond: 10,
} as const;
