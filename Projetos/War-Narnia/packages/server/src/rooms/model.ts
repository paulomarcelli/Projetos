// Modelo persistido de uma sala e utilitários (código, token, resumo público).
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { LIMITS, type GameEvent, type GameState, type PlayerColor, type PlayerId, type RoomStatus, type RoomSummary } from '@war/shared';
import { PLAYER_COLORS } from '../validation.js';

/** Resultado de uma ação já processada (para repetição de clientActionId). */
export interface ProcessedAction {
  id: string;
  /** Versão resultante (sucesso) ou null se o motor recusou. */
  version: number | null;
}

export interface StoredPlayer {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  /** SEGREDO: só vai ao dono no ack; nunca em room:update nem em log. */
  token: string;
  joinedAt: number;
  connected: boolean;
  /** Momento em que ficou sem nenhuma conexão (null = conectado). */
  disconnectedAt: number | null;
  /** Saiu de vez (room:leave durante a partida). Não pode mais retomar. */
  left: boolean;
  /** Removido da partida por abandono (tempo desconectado ou saída). */
  abandoned: boolean;
  /** Últimos clientActionId processados (mais novo no fim). */
  recentActions: ProcessedAction[];
}

export interface StoredRoom {
  schema: 1;
  code: string;
  status: RoomStatus;
  hostId: PlayerId;
  createdAt: number;
  updatedAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  players: StoredPlayer[];
  game: GameState | null;
  /** Histórico completo de eventos da partida. */
  events: GameEvent[];
  /** Início do turno atual (base da carência de desconexão). */
  turnStartedAt: number | null;
}

export const MAX_RECENT_ACTIONS = 200;

// Alfabeto sem caracteres ambíguos (sem 0/O, 1/I/L).
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let s = '';
  for (let i = 0; i < LIMITS.roomCodeLength; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export const generateToken = (): string => randomBytes(24).toString('base64url');
export const generatePlayerId = (): string => 'p_' + randomBytes(8).toString('hex');

/** Comparação em tempo constante. */
export function tokenEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function firstFreeColor(room: StoredRoom): PlayerColor | null {
  const used = new Set(room.players.map((p) => p.color));
  return PLAYER_COLORS.find((c) => !used.has(c)) ?? null;
}

/** Resumo público da sala (sem tokens). */
export function toSummary(room: StoredRoom): RoomSummary {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    players: room.players.map((p) => ({ id: p.id, name: p.name, color: p.color, isHost: p.id === room.hostId, connected: p.connected })),
    minPlayers: LIMITS.minPlayers,
    maxPlayers: LIMITS.maxPlayers,
    createdAt: room.createdAt,
  };
}

export function currentPlayerId(game: GameState): PlayerId | null {
  return game.turnOrder[game.currentIndex] ?? null;
}

export function isGameOver(game: GameState): boolean {
  return game.phase === 'game-over' || game.winner !== null;
}
