// Gerência de salas: lobby, partida, conexões, timers de desconexão/abandono e persistência.
// Independe do Socket.IO: fala com a rede pela interface `Transport`.
import {
  LIMITS,
  type ActionResult,
  type EngineApi,
  type GameAction,
  type GameEvent,
  type PlayerColor,
  type PlayerId,
  type PlayerView,
  type RoomSummary,
  type ServerToClient,
  type Session,
} from '@war/shared';
import type { ServerConfig } from '../config.js';
import { isRuleError } from '../engine.js';
import { ServerError } from '../errors.js';
import { errInfo, log, shortId } from '../log.js';
import { cryptoRng } from '../rng.js';
import type { RoomStore } from '../store/room-store.js';
import { normalizeName } from '../validation.js';
import {
  MAX_RECENT_ACTIONS,
  currentPlayerId,
  firstFreeColor,
  generatePlayerId,
  generateRoomCode,
  generateToken,
  isGameOver,
  toSummary,
  tokenEquals,
  type StoredPlayer,
  type StoredRoom,
} from './model.js';

type Emit = <E extends keyof ServerToClient>(event: E, ...args: Parameters<ServerToClient[E]>) => void;

/** Ponte com a camada de rede. */
export interface Transport {
  /** Emite para todos os sockets do canal da sala. */
  toRoom(code: string): { emit: Emit };
  /** Emite para um socket específico. */
  toSocket(socketId: string): { emit: Emit };
  joinChannel(socketId: string, code: string): void;
  leaveChannel(socketId: string, code: string): void;
}

export type SessionResult = Session & { room: RoomSummary };

interface Binding {
  code: string;
  playerId: PlayerId;
}

const channel = (code: string) => `room:${code}`;

export class RoomManager {
  private rooms = new Map<string, StoredRoom>();
  /** socket → (sala, jogador). */
  private bindings = new Map<string, Binding>();
  /** sala → jogador → sockets. */
  private sockets = new Map<string, Map<PlayerId, Set<string>>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private transport: Transport | null = null;

  constructor(
    private readonly cfg: ServerConfig,
    private readonly store: RoomStore,
    private readonly engine: EngineApi | null,
    private readonly now: () => number = Date.now,
  ) {}

  setTransport(t: Transport): void {
    this.transport = t;
  }

  /* ------------------------------------------------------------ */
  /* Ciclo de vida                                                 */
  /* ------------------------------------------------------------ */

  async init(): Promise<void> {
    const t = this.now();
    for (const room of await this.store.loadAll()) {
      // Ninguém está conectado logo após o reinício: quem constava conectado
      // passa a contar a desconexão a partir de agora.
      for (const p of room.players) {
        if (p.connected || p.disconnectedAt === null) p.disconnectedAt = t;
        p.connected = false;
        p.recentActions ??= [];
        p.abandoned ??= false;
        p.left ??= false;
      }
      room.events ??= [];
      this.rooms.set(room.code, room);
      this.schedule(room);
    }
    log.info('salas carregadas', { count: this.rooms.size });
    if (this.cfg.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => void this.cleanup(), this.cfg.cleanupIntervalMs);
      this.cleanupTimer.unref();
    }
  }

  async close(): Promise<void> {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    await this.store.flush();
  }

  /** Remove salas finalizadas há mais que o TTL, ou inativas e sem ninguém conectado. */
  async cleanup(): Promise<number> {
    const t = this.now();
    let removed = 0;
    for (const room of [...this.rooms.values()]) {
      const anyoneOn = room.players.some((p) => p.connected);
      const finishedOld = room.status === 'finished' && (room.finishedAt ?? room.updatedAt) + this.cfg.roomTtlMs < t;
      const idleOld = !anyoneOn && room.updatedAt + this.cfg.roomTtlMs < t;
      if (finishedOld || idleOld) {
        await this.removeRoom(room);
        removed++;
      }
    }
    if (removed) log.info('limpeza de salas', { removed });
    return removed;
  }

  getRoom(code: string): StoredRoom | undefined {
    return this.rooms.get(code);
  }

  /* ------------------------------------------------------------ */
  /* Lobby                                                         */
  /* ------------------------------------------------------------ */

  async create(socketId: string, rawName: string): Promise<SessionResult> {
    const name = this.requireName(rawName);
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const t = this.now();
    const player = this.newPlayer(name, 'vermelho', t);
    const room: StoredRoom = {
      schema: 1,
      code,
      status: 'lobby',
      hostId: player.id,
      createdAt: t,
      updatedAt: t,
      startedAt: null,
      finishedAt: null,
      players: [player],
      game: null,
      events: [],
      turnStartedAt: null,
    };
    this.rooms.set(code, room);
    this.bind(socketId, room, player);
    await this.persist(room);
    this.broadcastRoom(room);
    log.info('sala criada', { room: code, player: shortId(player.id) });
    return this.sessionOf(room, player);
  }

  async join(socketId: string, code: string, rawName: string): Promise<SessionResult> {
    const room = this.requireRoom(code);
    const name = this.requireName(rawName);
    if (room.status !== 'lobby') throw new ServerError('ROOM_ALREADY_STARTED', 'A partida já começou. Só quem já estava na sala pode voltar.');
    if (room.players.length >= LIMITS.maxPlayers) throw new ServerError('ROOM_FULL', 'A sala está cheia.');
    const color = firstFreeColor(room);
    if (!color) throw new ServerError('ROOM_FULL', 'A sala está cheia.');
    const player = this.newPlayer(name, color, this.now());
    room.players.push(player);
    this.bind(socketId, room, player);
    await this.persist(room);
    this.broadcastRoom(room);
    log.info('jogador entrou', { room: code, player: shortId(player.id) });
    return this.sessionOf(room, player);
  }

  async resume(socketId: string, code: string, token: string): Promise<SessionResult> {
    const room = this.requireRoom(code);
    const player = room.players.find((p) => tokenEquals(p.token, token));
    if (!player || player.left) throw new ServerError('INVALID_TOKEN', 'Sessão inválida para esta sala.');
    this.bind(socketId, room, player);
    await this.persist(room);
    this.broadcastRoom(room);
    log.info('jogador retomou', { room: code, player: shortId(player.id) });
    return this.sessionOf(room, player);
  }

  async setColor(socketId: string, color: PlayerColor): Promise<RoomSummary> {
    const { room, player } = this.requireBinding(socketId);
    if (room.status !== 'lobby') throw new ServerError('ROOM_ALREADY_STARTED', 'Não é possível trocar de cor depois do início.');
    if (player.color !== color) {
      if (room.players.some((p) => p.id !== player.id && p.color === color)) {
        throw new ServerError('BAD_REQUEST', 'Essa cor já foi escolhida por outro jogador.');
      }
      player.color = color;
      await this.persist(room);
      this.broadcastRoom(room);
    }
    return toSummary(room);
  }

  async start(socketId: string): Promise<null> {
    const { room, player } = this.requireBinding(socketId);
    if (room.hostId !== player.id) throw new ServerError('NOT_HOST', 'Só o anfitrião pode iniciar a partida.');
    if (room.status !== 'lobby') throw new ServerError('ROOM_ALREADY_STARTED', 'A partida já começou.');
    if (room.players.length < LIMITS.minPlayers) {
      throw new ServerError('NOT_ENOUGH_PLAYERS', `São necessários pelo menos ${LIMITS.minPlayers} jogadores.`);
    }
    const engine = this.requireEngine();
    const t = this.now();
    const result = engine.createGame(
      room.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
      cryptoRng,
      t,
    );
    room.status = 'playing';
    room.startedAt = t;
    room.turnStartedAt = t;
    room.game = result.state;
    room.events = [];
    this.applyResult(room, result, { setGame: false });
    await this.persist(room);
    this.broadcastRoom(room);
    this.broadcastGame(room, result.events);
    this.schedule(room);
    log.info('partida iniciada', { room: room.code, players: room.players.length });
    return null;
  }

  async leave(socketId: string): Promise<null> {
    const { room, player } = this.requireBinding(socketId);
    const pid = player.id;
    // Desassocia todos os sockets desse jogador.
    for (const sid of [...(this.sockets.get(room.code)?.get(pid) ?? [])]) this.unbind(sid, false);

    if (room.status === 'lobby') {
      room.players = room.players.filter((p) => p.id !== pid);
      if (room.players.length === 0) {
        await this.removeRoom(room);
        log.info('sala vazia removida', { room: room.code });
        return null;
      }
      if (room.hostId === pid) room.hostId = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt)[0]!.id;
      await this.persist(room);
      this.broadcastRoom(room);
    } else {
      player.left = true;
      player.connected = false;
      player.disconnectedAt ??= this.now();
      if (room.status === 'playing' && !player.abandoned) {
        this.abandonPlayer(room, player, 'saiu da partida');
      }
      await this.persist(room);
      this.broadcastRoom(room);
      this.schedule(room);
    }
    log.info('jogador saiu', { room: room.code, player: shortId(pid) });
    return null;
  }

  /* ------------------------------------------------------------ */
  /* Jogo                                                          */
  /* ------------------------------------------------------------ */

  async action(
    socketId: string,
    p: { clientActionId: string; expectedVersion: number; action: GameAction },
  ): Promise<{ version: number }> {
    const { room, player } = this.requireBinding(socketId);
    if (!room.game) throw new ServerError('BAD_REQUEST', 'A partida ainda não começou.');
    const engine = this.requireEngine();

    const prev = player.recentActions.find((a) => a.id === p.clientActionId);
    if (prev) {
      this.sendView(socketId);
      throw new ServerError(
        'DUPLICATE_ACTION',
        prev.version !== null ? `Ação já processada (versão ${prev.version}).` : 'Ação já processada (foi recusada).',
      );
    }
    if (p.expectedVersion !== room.game.version) {
      this.sendView(socketId);
      throw new ServerError('STALE_VERSION', 'O estado mudou. Sincronizando.');
    }

    const record = (version: number | null) => {
      player.recentActions.push({ id: p.clientActionId, version });
      if (player.recentActions.length > MAX_RECENT_ACTIONS) player.recentActions.splice(0, player.recentActions.length - MAX_RECENT_ACTIONS);
    };

    let result: ActionResult;
    try {
      result = engine.applyAction(room.game, player.id, p.action, cryptoRng, this.now());
    } catch (e) {
      if (isRuleError(e)) {
        record(null);
        log.debug('ação recusada', { room: room.code, player: shortId(player.id), action: p.action.type, rule: e.code });
        throw new ServerError('RULE_ERROR', e.message, e.code);
      }
      throw e;
    }
    record(result.state.version);
    const wasPlaying = room.status === 'playing';
    this.applyResult(room, result);
    log.info('ação', { room: room.code, player: shortId(player.id), action: p.action.type, version: result.state.version });
    await this.persist(room);
    this.broadcastGame(room, result.events);
    if (wasPlaying && room.status !== 'playing') this.broadcastRoom(room);
    this.schedule(room);
    return { version: result.state.version };
  }

  sync(socketId: string): PlayerView | null {
    const { room, player } = this.requireBinding(socketId);
    if (!room.game) return null;
    return this.viewFor(room, player.id);
  }

  /** Envia o game:state atual a um socket (se houver partida). */
  sendView(socketId: string): void {
    const b = this.bindings.get(socketId);
    const room = b && this.rooms.get(b.code);
    if (!b || !room?.game || !this.transport) return;
    try {
      this.transport.toSocket(socketId).emit('game:state', this.viewFor(room, b.playerId));
    } catch (e) {
      log.error('falha ao montar view', { room: room.code, ...errInfo(e) });
    }
  }

  /* ------------------------------------------------------------ */
  /* Conexões                                                      */
  /* ------------------------------------------------------------ */

  async disconnect(socketId: string): Promise<void> {
    const b = this.bindings.get(socketId);
    if (!b) return;
    const room = this.rooms.get(b.code);
    const wentOffline = this.unbind(socketId, true);
    if (room && wentOffline) {
      await this.persist(room);
      this.broadcastRoom(room);
      this.schedule(room);
    }
  }

  private bind(socketId: string, room: StoredRoom, player: StoredPlayer): void {
    const old = this.bindings.get(socketId);
    if (old && (old.code !== room.code || old.playerId !== player.id)) {
      const oldRoom = this.rooms.get(old.code);
      if (this.unbind(socketId, true) && oldRoom) {
        void this.persist(oldRoom);
        this.broadcastRoom(oldRoom);
        this.schedule(oldRoom);
      }
    }
    this.bindings.set(socketId, { code: room.code, playerId: player.id });
    let byPlayer = this.sockets.get(room.code);
    if (!byPlayer) this.sockets.set(room.code, (byPlayer = new Map()));
    let set = byPlayer.get(player.id);
    if (!set) byPlayer.set(player.id, (set = new Set()));
    set.add(socketId);
    this.transport?.joinChannel(socketId, room.code);
    player.connected = true;
    player.disconnectedAt = null;
    this.schedule(room);
  }

  /** Desassocia um socket. Devolve true se o jogador ficou sem conexões. */
  private unbind(socketId: string, markOffline: boolean): boolean {
    const b = this.bindings.get(socketId);
    if (!b) return false;
    this.bindings.delete(socketId);
    this.transport?.leaveChannel(socketId, b.code);
    const byPlayer = this.sockets.get(b.code);
    const set = byPlayer?.get(b.playerId);
    set?.delete(socketId);
    if (set && set.size > 0) return false;
    byPlayer?.delete(b.playerId);
    const player = this.rooms.get(b.code)?.players.find((p) => p.id === b.playerId);
    if (player && markOffline) {
      player.connected = false;
      player.disconnectedAt = this.now();
      const room = this.rooms.get(b.code)!;
      if (room.status === 'playing') {
        this.transport?.toRoom(channel(room.code)).emit('room:notice', { kind: 'warning', message: `${player.name} desconectou.` });
      }
      log.info('jogador desconectou', { room: b.code, player: shortId(player.id) });
    }
    return true;
  }

  /* ------------------------------------------------------------ */
  /* Timers de desconexão e abandono                               */
  /* ------------------------------------------------------------ */

  private isActive(room: StoredRoom, p: StoredPlayer): boolean {
    if (p.left || p.abandoned) return false;
    const pub = room.game?.players.find((x) => x.id === p.id);
    return !pub?.eliminated;
  }

  /** Próximos prazos da sala (pulo de turno e abandonos). */
  private deadlines(room: StoredRoom): { skipAt: number | null; abandon: { player: StoredPlayer; at: number }[] } {
    const out = { skipAt: null as number | null, abandon: [] as { player: StoredPlayer; at: number }[] };
    if (room.status !== 'playing' || !room.game) return out;
    for (const p of room.players) {
      if (!p.connected && p.disconnectedAt !== null && this.isActive(room, p)) {
        out.abandon.push({ player: p, at: p.disconnectedAt + this.cfg.abandonMs });
      }
    }
    const cur = room.players.find((p) => p.id === currentPlayerId(room.game!));
    if (cur && !cur.connected && cur.disconnectedAt !== null && this.isActive(room, cur)) {
      out.skipAt = Math.max(cur.disconnectedAt, room.turnStartedAt ?? cur.disconnectedAt) + this.cfg.graceMs;
    }
    return out;
  }

  /** (Re)agenda o próximo prazo da sala. Seguro chamar várias vezes. */
  private schedule(room: StoredRoom): void {
    const old = this.timers.get(room.code);
    if (old) clearTimeout(old);
    this.timers.delete(room.code);
    const d = this.deadlines(room);
    const all = [...d.abandon.map((a) => a.at), ...(d.skipAt !== null ? [d.skipAt] : [])];
    if (all.length === 0) return;
    const wait = Math.max(0, Math.min(...all) - this.now());
    const timer = setTimeout(() => void this.tick(room.code), Math.min(wait, 2 ** 31 - 1));
    timer.unref();
    this.timers.set(room.code, timer);
  }

  private async tick(code: string): Promise<void> {
    this.timers.delete(code);
    const room = this.rooms.get(code);
    if (!room || room.status !== 'playing' || !room.game) return;
    try {
      const t = this.now();
      let changed = false;
      for (const a of this.deadlines(room).abandon) {
        if (a.at <= t && room.status === 'playing') {
          this.abandonPlayer(room, a.player, 'ficou desconectado por tempo demais');
          changed = true;
        }
      }
      const { skipAt } = this.deadlines(room);
      if (skipAt !== null && skipAt <= t && room.status === 'playing' && this.engine) {
        const pid = currentPlayerId(room.game)!;
        const p = room.players.find((x) => x.id === pid)!;
        const before = room.game.version;
        const res = this.engine.skipTurn(room.game, pid, 'disconnected', t);
        this.applyResult(room, res);
        // Se o motor não passou a vez, adia o próximo prazo (evita laço).
        if (room.game.version === before) room.turnStartedAt = t;
        this.broadcastGame(room, res.events);
        this.notice(room, 'warning', `Turno de ${p.name} pulado (desconectado).`);
        log.info('turno pulado', { room: code, player: shortId(pid), version: `${before}->${room.game.version}` });
        changed = true;
      }
      if (changed) {
        await this.persist(room);
        this.broadcastRoom(room);
      }
    } catch (e) {
      log.error('falha no timer da sala', { room: code, ...errInfo(e) });
      room.turnStartedAt = this.now(); // adia nova tentativa por uma carência
    } finally {
      // Evita laço apertado se algo falhou: o prazo é recalculado do estado.
      if (this.rooms.has(code)) this.schedule(room);
    }
  }

  /** Aplica engine.abandon (e pula o turno se era a vez dele). Não persiste. */
  private abandonPlayer(room: StoredRoom, player: StoredPlayer, why: string): void {
    const engine = this.engine;
    player.abandoned = true;
    if (!engine || !room.game || isGameOver(room.game)) return;
    try {
      const t = this.now();
      const res = engine.abandon(room.game, player.id, t);
      this.applyResult(room, res);
      const events = [...res.events];
      if (room.game && !isGameOver(room.game) && currentPlayerId(room.game) === player.id) {
        const skip = engine.skipTurn(room.game, player.id, 'abandoned', t);
        this.applyResult(room, skip);
        events.push(...skip.events);
      }
      this.broadcastGame(room, events);
      this.notice(room, 'warning', `${player.name} ${why} e deixou a partida.`);
      log.info('jogador abandonou', { room: room.code, player: shortId(player.id) });
    } catch (e) {
      log.error('falha ao aplicar abandono', { room: room.code, player: shortId(player.id), ...errInfo(e) });
    }
  }

  /* ------------------------------------------------------------ */
  /* Auxiliares                                                    */
  /* ------------------------------------------------------------ */

  /** Atualiza estado, histórico, início de turno e status (sem emitir). */
  private applyResult(room: StoredRoom, result: ActionResult, opts: { setGame?: boolean } = {}): void {
    const prevPlayer = room.game ? currentPlayerId(room.game) : null;
    if (opts.setGame !== false) room.game = result.state;
    room.events.push(...result.events);
    const t = this.now();
    if (result.events.some((e) => e.type === 'turn-started') || currentPlayerId(result.state) !== prevPlayer) {
      room.turnStartedAt = t;
    }
    if (isGameOver(result.state) && room.status === 'playing') {
      room.status = 'finished';
      room.finishedAt = t;
      log.info('partida finalizada', { room: room.code, winner: shortId(result.state.winner) });
    }
  }

  private viewFor(room: StoredRoom, pid: PlayerId): PlayerView {
    const engine = this.requireEngine();
    const view = engine.getPlayerView(room.game!, pid);
    const online = new Map(room.players.map((p) => [p.id, p.connected]));
    return { ...view, players: view.players.map((p) => ({ ...p, connected: online.get(p.id) ?? false })) };
  }

  /** game:events para a sala e depois game:state individual para cada socket. */
  private broadcastGame(room: StoredRoom, events: GameEvent[]): void {
    if (!this.transport || !room.game) return;
    if (events.length) this.transport.toRoom(channel(room.code)).emit('game:events', events);
    const byPlayer = this.sockets.get(room.code);
    if (!byPlayer) return;
    for (const [pid, set] of byPlayer) {
      let view: PlayerView;
      try {
        view = this.viewFor(room, pid);
      } catch (e) {
        log.error('falha ao montar view', { room: room.code, player: shortId(pid), ...errInfo(e) });
        continue;
      }
      for (const sid of set) this.transport.toSocket(sid).emit('game:state', view);
    }
  }

  private broadcastRoom(room: StoredRoom): void {
    this.transport?.toRoom(channel(room.code)).emit('room:update', toSummary(room));
  }

  private notice(room: StoredRoom, kind: 'info' | 'warning', message: string): void {
    this.transport?.toRoom(channel(room.code)).emit('room:notice', { kind, message });
  }

  private async persist(room: StoredRoom): Promise<void> {
    if (!this.rooms.has(room.code)) return;
    room.updatedAt = this.now();
    try {
      await this.store.save(room);
    } catch (e) {
      log.error('falha ao salvar sala', { room: room.code, ...errInfo(e) });
    }
  }

  private async removeRoom(room: StoredRoom): Promise<void> {
    const t = this.timers.get(room.code);
    if (t) clearTimeout(t);
    this.timers.delete(room.code);
    for (const set of this.sockets.get(room.code)?.values() ?? []) {
      for (const sid of [...set]) this.unbind(sid, false);
    }
    this.sockets.delete(room.code);
    this.rooms.delete(room.code);
    try {
      await this.store.delete(room.code);
    } catch (e) {
      log.error('falha ao apagar sala', { room: room.code, ...errInfo(e) });
    }
  }

  private newPlayer(name: string, color: PlayerColor, t: number): StoredPlayer {
    return {
      id: generatePlayerId(),
      name,
      color,
      token: generateToken(),
      joinedAt: t,
      connected: false,
      disconnectedAt: null,
      left: false,
      abandoned: false,
      recentActions: [],
    };
  }

  private sessionOf(room: StoredRoom, player: StoredPlayer): SessionResult {
    return { roomCode: room.code, playerId: player.id, token: player.token, room: toSummary(room) };
  }

  private requireName(raw: string): string {
    const name = normalizeName(raw);
    if (!name) throw new ServerError('INVALID_NAME', `O nome deve ter de 1 a ${LIMITS.nameMaxLength} caracteres visíveis.`);
    return name;
  }

  private requireRoom(code: string): StoredRoom {
    const room = this.rooms.get(code);
    if (!room) throw new ServerError('ROOM_NOT_FOUND', 'Sala não encontrada.');
    return room;
  }

  private requireBinding(socketId: string): { room: StoredRoom; player: StoredPlayer } {
    const b = this.bindings.get(socketId);
    const room = b && this.rooms.get(b.code);
    const player = room?.players.find((p) => p.id === b!.playerId);
    if (!room || !player) throw new ServerError('NOT_IN_ROOM', 'Você não está em uma sala.');
    return { room, player };
  }

  private requireEngine(): EngineApi {
    if (!this.engine) throw new ServerError('INTERNAL', 'Motor de regras indisponível.');
    return this.engine;
  }
}
