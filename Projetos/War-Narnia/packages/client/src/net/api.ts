/**
 * Camada de rede: cliente Socket.IO tipado com o contrato (protocol.ts).
 *
 * - Sessão {code, token} em localStorage só para reconectar (room:resume).
 * - Reconexão automática do Socket.IO; a cada nova conexão, room:resume + game:sync.
 * - Ações levam clientActionId (crypto.randomUUID) e expectedVersion.
 * - STALE_VERSION → pede game:sync e avisa o jogador.
 *
 * A interface `Backend` permite trocar o transporte (pré-visualização em dev).
 */
import { io, type Socket } from 'socket.io-client';
import type {
  Ack,
  ClientToServer,
  ErrorPayload,
  GameAction,
  GameEvent,
  PlayerColor,
  PlayerView,
  RoomSummary,
  ServerToClient,
  Session,
} from '@war/shared';
import { PROTOCOL_VERSION } from '@war/shared';
import { friendlyError, TIMEOUT_TEXT } from './errors';
import { clearSession, loadSession, saveSession } from './session';
import { getState, mergeEvents, resetState, setState, toast, type AttackEvent } from './store';

export interface Backend {
  createRoom(name: string): Promise<boolean>;
  joinRoom(code: string, name: string): Promise<boolean>;
  /** Tenta retomar a sessão salva. Devolve false se não houver ou falhar. */
  resume(): Promise<boolean>;
  setColor(color: PlayerColor): Promise<boolean>;
  startGame(): Promise<boolean>;
  leaveRoom(): Promise<void>;
  sendAction(action: GameAction): Promise<boolean>;
  sync(): Promise<void>;
  retryNow(): void;
}

const ACK_TIMEOUT_MS = 8000;

type ClientSocket = Socket<ServerToClient, ClientToServer>;

let socket: ClientSocket | null = null;
let leaving = false;

function newActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Contexto não seguro (http em IP da rede local): fallback com getRandomValues.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* ---------------- Atualizações de estado vindas do servidor ---------------- */

export function applyRoom(room: RoomSummary): void {
  setState((s) => {
    let screen = s.screen;
    if (room.status === 'lobby') screen = 'sala';
    else screen = 'jogo';
    return { room, screen };
  });
}

export function applyView(view: PlayerView | null): void {
  if (!view) return;
  setState((s) => {
    if (s.view && view.version < s.view.version) return {}; // nunca volta para estado velho
    return { view, history: mergeEvents(s.history, view.log), screen: 'jogo' };
  });
}

export function applyEvents(events: GameEvent[]): void {
  const attacks = events.filter((e): e is AttackEvent => e.type === 'attack');
  const last = attacks[attacks.length - 1];
  setState((s) => ({
    history: mergeEvents(s.history, events),
    ...(last ? { lastAttack: last, attackSeq: s.attackSeq + 1 } : {}),
  }));
}

function onSession(data: Session & { room: RoomSummary }): void {
  const session: Session = { roomCode: data.roomCode, playerId: data.playerId, token: data.token };
  saveSession({ code: data.roomCode, token: data.token });
  setState({ session });
  applyRoom(data.room);
}

/* ---------------- Socket ---------------- */

function ensureSocket(): ClientSocket {
  if (socket) return socket;
  setState({ conn: 'connecting' });
  const s: ClientSocket = io({
    path: '/socket.io',
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    query: { v: String(PROTOCOL_VERSION) },
  });

  s.on('connect', () => {
    setState({ conn: 'connected' });
    // Reconexão: o servidor não lembra deste socket; reapresentamos o token.
    if (getState().session && !leaving) void resumeWithSaved(true);
  });
  s.on('disconnect', (reason) => {
    if (leaving) return;
    // 'io client disconnect' = nós fechamos; o resto tenta reconectar sozinho.
    setState({ conn: reason === 'io client disconnect' ? 'idle' : 'reconnecting' });
  });
  s.on('connect_error', () => {
    const st = getState();
    setState({ conn: st.conn === 'connected' || st.conn === 'reconnecting' ? 'reconnecting' : 'offline' });
  });
  s.io.on('reconnect_attempt', () => setState({ conn: 'reconnecting' }));

  s.on('room:update', (room) => applyRoom(room));
  s.on('game:events', (events) => applyEvents(events));
  s.on('game:state', (view) => applyView(view));
  s.on('room:notice', (n) => toast(n.kind === 'warning' ? 'warning' : 'info', n.message));

  socket = s;
  return s;
}

type AckResult<T> = { ok: true; data: T } | { ok: false; error: ErrorPayload | null };

/** Emite com timeout e normaliza o ack. */
function request<T>(emit: (s: ClientSocket, cb: (err: Error | null, r: Ack<T>) => void) => void): Promise<AckResult<T>> {
  const s = ensureSocket();
  return new Promise((resolve) => {
    emit(s, (err, r) => {
      if (err) {
        resolve({ ok: false, error: null });
        return;
      }
      resolve(r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error });
    });
  });
}

function reportError(error: ErrorPayload | null): void {
  toast('error', error ? friendlyError(error) : TIMEOUT_TEXT);
}

async function resumeWithSaved(silent: boolean): Promise<boolean> {
  const saved = loadSession();
  if (!saved) return false;
  const r = await request<Session & { room: RoomSummary }>((s, cb) =>
    s.timeout(ACK_TIMEOUT_MS).emit('room:resume', { code: saved.code, token: saved.token }, cb),
  );
  if (r.ok) {
    onSession(r.data);
    if (r.data.room.status !== 'lobby') await liveBackend.sync();
    return true;
  }
  if (r.error && (r.error.code === 'ROOM_NOT_FOUND' || r.error.code === 'INVALID_TOKEN' || r.error.code === 'NOT_IN_ROOM')) {
    clearSession();
    resetState({ conn: getState().conn, inviteCode: getState().inviteCode });
    if (!silent) toast('info', 'A partida salva não está mais disponível.');
  } else if (!silent) {
    reportError(r.error);
  }
  return false;
}

export const liveBackend: Backend = {
  async createRoom(name) {
    const r = await request<Session & { room: RoomSummary }>((s, cb) =>
      s.timeout(ACK_TIMEOUT_MS).emit('room:create', { name }, cb),
    );
    if (!r.ok) return reportError(r.error), false;
    onSession(r.data);
    return true;
  },

  async joinRoom(code, name) {
    const r = await request<Session & { room: RoomSummary }>((s, cb) =>
      s.timeout(ACK_TIMEOUT_MS).emit('room:join', { code, name }, cb),
    );
    if (!r.ok) return reportError(r.error), false;
    onSession(r.data);
    if (r.data.room.status !== 'lobby') await liveBackend.sync();
    return true;
  },

  async resume() {
    if (!loadSession()) return false;
    setState({ restoring: true });
    try {
      return await resumeWithSaved(false);
    } finally {
      setState({ restoring: false });
    }
  },

  async setColor(color) {
    const r = await request<RoomSummary>((s, cb) => s.timeout(ACK_TIMEOUT_MS).emit('room:set-color', { color }, cb));
    if (!r.ok) return reportError(r.error), false;
    applyRoom(r.data);
    return true;
  },

  async startGame() {
    const r = await request<null>((s, cb) => s.timeout(ACK_TIMEOUT_MS).emit('room:start', {}, cb));
    if (!r.ok) return reportError(r.error), false;
    return true;
  },

  async leaveRoom() {
    leaving = true;
    try {
      if (socket?.connected) {
        await request<null>((s, cb) => s.timeout(ACK_TIMEOUT_MS).emit('room:leave', {}, cb));
      }
    } finally {
      clearSession();
      socket?.disconnect();
      socket = null;
      leaving = false;
      resetState({ screen: 'inicio' });
      if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    }
  },

  async sendAction(action) {
    const st = getState();
    if (!st.view) return false;
    setState({ busy: true });
    try {
      const r = await request<{ version: number }>((s, cb) =>
        s
          .timeout(ACK_TIMEOUT_MS)
          .emit('game:action', { clientActionId: newActionId(), expectedVersion: st.view!.version, action }, cb),
      );
      if (r.ok) return true;
      if (r.error?.code === 'DUPLICATE_ACTION') return true;
      if (r.error?.code === 'STALE_VERSION') {
        await liveBackend.sync();
        toast('warning', friendlyError(r.error));
        return false;
      }
      reportError(r.error);
      return false;
    } finally {
      setState({ busy: false });
    }
  },

  async sync() {
    const r = await request<PlayerView | null>((s, cb) => s.timeout(ACK_TIMEOUT_MS).emit('game:sync', {}, cb));
    if (r.ok) applyView(r.data);
  },

  retryNow() {
    const s = ensureSocket();
    if (!s.connected) s.connect();
  },
};

/* ---------------- Backend ativo ---------------- */

let current: Backend = liveBackend;

export function setBackend(b: Backend): void {
  current = b;
}

export function api(): Backend {
  return current;
}

/** Envia ações em sequência (ex.: encerrar ataques e o turno), parando no 1º erro. */
export async function sendSequence(actions: GameAction[]): Promise<boolean> {
  for (const a of actions) {
    const before = getState().view?.version ?? -1;
    const ok = await current.sendAction(a);
    if (!ok) return false;
    // Espera o game:state da ação anterior para usar a versão nova.
    await waitForVersionAbove(before, 3000);
  }
  return true;
}

function waitForVersionAbove(v: number, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if ((getState().view?.version ?? -1) > v || Date.now() - start > ms) resolve();
      else window.setTimeout(tick, 40);
    };
    tick();
  });
}
