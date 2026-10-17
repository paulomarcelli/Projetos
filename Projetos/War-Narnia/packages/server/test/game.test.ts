// Testes de partida por socket real. Rodam com o dublê de contrato (sempre) e com o
// motor real de @war/shared (quando ele existir).
import { afterEach, describe, expect, it } from 'vitest';
import type { EngineApi, GameAction, PlayerView } from '@war/shared';
import { loadEngine } from '../src/engine.js';
import { contractDouble } from './helpers/contract-double.js';
import { boot, cleanupDir, connect, errCode, ok, waitFor, type Client, type SessionAck } from './helpers/harness.js';
import type { ServerConfig } from '../src/config.js';

const realEngine = loadEngine();
const engines: [string, EngineApi][] = [['dublê de contrato', contractDouble]];
if (realEngine) engines.push(['motor real', realEngine]);

type Booted = Awaited<ReturnType<typeof boot>>;

describe.each(engines)('partida (%s)', (_label, engine) => {
  let booted: Booted[] = [];
  let clients: Client[] = [];

  afterEach(async () => {
    for (const c of clients) c.close();
    for (const b of booted) {
      await b.server.close().catch(() => undefined);
      cleanupDir(b.dataDir);
    }
    booted = [];
    clients = [];
  });

  async function setup(config: Partial<ServerConfig> = {}, dataDir?: string) {
    const b = await boot({ engine, config, dataDir });
    booted.push(b);
    return b;
  }
  async function client(b: Booted) {
    const c = await connect(b.server);
    clients.push(c);
    return c;
  }

  /** Cria sala com N jogadores e inicia; devolve clientes e sessões. */
  async function startGame(b: Booted, n = 2) {
    const cs: Client[] = [];
    const ss: SessionAck[] = [];
    for (let i = 0; i < n; i++) {
      const c = await client(b);
      const s = i === 0 ? ok(await c.call('room:create', { name: `J${i}` })) : ok(await c.call('room:join', { code: ss[0]!.roomCode, name: `J${i}` }));
      cs.push(c);
      ss.push(s);
    }
    ok(await cs[0]!.call('room:start', {}));
    for (const c of cs) await waitFor(() => c.lastView() !== undefined);
    const view = cs[0]!.lastView()!;
    const curIdx = ss.findIndex((s) => s.playerId === view.currentPlayer);
    return { cs, ss, code: ss[0]!.roomCode, cur: curIdx, other: (curIdx + 1) % n };
  }

  /** Uma ação simples e válida para o jogador da vez no início do turno. */
  function simpleAction(v: PlayerView): GameAction {
    const mine = Object.entries(v.territories).find(([, t]) => t.owner === v.me)![0];
    return { type: 'place', territory: mine, count: 1 };
  }

  let seq = 0;
  const aid = () => `a${++seq}-${Date.now()}`;

  it('cada jogador recebe só a própria visão; nada privado de outro vaza', async () => {
    const b = await setup();
    const { cs, ss, code } = await startGame(b, 3);
    const v = cs[0]!.lastView()!;
    expect(v.me).toBe(ss[0]!.playerId);
    expect(v.myObjective).not.toBeNull();
    // Gera tráfego: uma ação do jogador da vez.
    const curC = cs[ss.findIndex((s) => s.playerId === v.currentPlayer)]!;
    ok(await curC.call('game:action', { clientActionId: aid(), expectedVersion: curC.lastView()!.version, action: simpleAction(curC.lastView()!) }));
    for (const c of cs) await waitFor(() => c.lastView()!.version === v.version + 1);
    ok(await cs[0]!.call('game:sync', {}));

    const game = b.server.manager.getRoom(code)!.game!;
    for (let i = 0; i < cs.length; i++) {
      const traffic = JSON.stringify(cs[i]!.received) + JSON.stringify(cs[i]!.acks);
      expect(traffic).not.toContain('"private"');
      expect(traffic).not.toContain('"deck"');
      for (let j = 0; j < ss.length; j++) {
        if (i === j) continue;
        const other = game.private[ss[j]!.playerId]!;
        expect(traffic).not.toContain(ss[j]!.token);
        expect(traffic).not.toContain(JSON.stringify(other.objective.description));
        expect(traffic).not.toContain(`"id":${JSON.stringify(other.objective.id)}`);
      }
      // Estrutural: objetivo e cartas recebidos são sempre os próprios.
      const mine = game.private[ss[i]!.playerId]!;
      for (const [ev, p] of cs[i]!.received) {
        if (ev !== 'game:state') continue;
        const pv = p as PlayerView;
        expect(pv.me).toBe(ss[i]!.playerId);
        expect(pv.myObjective?.id).toBe(mine.objective.id);
        expect(pv.myCards.map((c) => c.id).sort()).toEqual(mine.cards.map((c) => c.id).sort());
        if (pv.currentPlayer !== pv.me) expect(pv.reinforcements).toBeNull();
      }
    }
  });

  it('ação fora de turno é recusada (RULE_ERROR / NOT_YOUR_TURN)', async () => {
    const b = await setup();
    const { cs, other } = await startGame(b);
    const v = cs[other]!.lastView()!;
    const r = await cs[other]!.call('game:action', { clientActionId: aid(), expectedVersion: v.version, action: { type: 'end-turn' } });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('RULE_ERROR');
      expect(r.error.ruleCode).toBe('NOT_YOUR_TURN');
    }
  });

  it('ação de um jogador aparece para o outro (game:events antes de game:state)', async () => {
    const b = await setup();
    const { cs, cur, other } = await startGame(b);
    const v = cs[cur]!.lastView()!;
    const before = cs[other]!.received.length;
    const action = simpleAction(v);
    const r = ok(await cs[cur]!.call('game:action', { clientActionId: aid(), expectedVersion: v.version, action }));
    expect(r.version).toBe(v.version + 1);
    await waitFor(() => cs[other]!.lastView()!.version === r.version);
    const fresh = cs[other]!.received.slice(before).map(([e]) => e);
    expect(fresh.indexOf('game:events')).toBeGreaterThanOrEqual(0);
    expect(fresh.indexOf('game:events')).toBeLessThan(fresh.indexOf('game:state'));
    const ov = cs[other]!.lastView()!;
    if (action.type === 'place') expect(ov.territories[action.territory]!.armies).toBe(v.territories[action.territory]!.armies + 1);
  });

  it('versão antiga → STALE_VERSION e reenvio da visão', async () => {
    const b = await setup();
    const { cs, cur } = await startGame(b);
    const v = cs[cur]!.lastView()!;
    const n = cs[cur]!.received.length;
    const r = await cs[cur]!.call('game:action', { clientActionId: aid(), expectedVersion: v.version - 1, action: simpleAction(v) });
    expect(errCode(r)).toBe('STALE_VERSION');
    await waitFor(() => cs[cur]!.received.slice(n).some(([e]) => e === 'game:state'));
  });

  it('clientActionId repetido → DUPLICATE_ACTION, sem aplicar duas vezes', async () => {
    const b = await setup();
    const { cs, cur, code } = await startGame(b);
    const v = cs[cur]!.lastView()!;
    const id = aid();
    ok(await cs[cur]!.call('game:action', { clientActionId: id, expectedVersion: v.version, action: simpleAction(v) }));
    const r = await cs[cur]!.call('game:action', { clientActionId: id, expectedVersion: v.version + 1, action: simpleAction(v) });
    expect(errCode(r)).toBe('DUPLICATE_ACTION');
    expect(b.server.manager.getRoom(code)!.game!.version).toBe(v.version + 1);
  });

  it('jogador da vez desconectado → turno pulado após a carência', async () => {
    const b = await setup({ graceMs: 250, abandonMs: 60_000 });
    const { cs, ss, cur, other } = await startGame(b);
    cs[cur]!.close();
    await cs[other]!.next('room:notice', (n) => n.message.includes('desconectou'));
    const ev = await cs[other]!.next('game:events', (es) => es.some((e) => e.type === 'turn-skipped'), 3000);
    expect(ev.find((e) => e.type === 'turn-skipped')).toMatchObject({ player: ss[cur]!.playerId, reason: 'disconnected' });
    await waitFor(() => cs[other]!.lastView()!.currentPlayer === ss[other]!.playerId);
  });

  it('reconexão recupera o estado (resume → ack e depois game:state)', async () => {
    const b = await setup();
    const { cs, ss, cur, code } = await startGame(b);
    const v = cs[cur]!.lastView()!;
    ok(await cs[cur]!.call('game:action', { clientActionId: aid(), expectedVersion: v.version, action: simpleAction(v) }));
    cs[cur]!.close();
    const again = await client(b);
    const res = ok(await again.call('room:resume', { code, token: ss[cur]!.token }));
    expect(res.room.status).toBe('playing');
    await waitFor(() => again.lastView() !== undefined);
    expect(again.lastView()!.version).toBe(v.version + 1);
    expect(again.lastView()!.me).toBe(ss[cur]!.playerId);
    const synced = ok(await again.call('game:sync', {}));
    expect(synced?.version).toBe(v.version + 1);
    // Continua jogando de onde parou.
    const v2 = again.lastView()!;
    ok(await again.call('game:action', { clientActionId: aid(), expectedVersion: v2.version, action: simpleAction(v2) }));
  });

  it('reinício do servidor carrega a sala do disco e a partida continua', async () => {
    const b1 = await setup();
    const { cs, ss, cur, code } = await startGame(b1);
    const v = cs[cur]!.lastView()!;
    const id = aid();
    ok(await cs[cur]!.call('game:action', { clientActionId: id, expectedVersion: v.version, action: simpleAction(v) }));
    for (const c of cs) c.close();
    await b1.server.close();
    booted = booted.filter((x) => x !== b1);

    const b2 = await setup({}, b1.dataDir);
    const a = await client(b2);
    ok(await a.call('room:resume', { code, token: ss[cur]!.token }));
    await waitFor(() => a.lastView() !== undefined);
    const v2 = a.lastView()!;
    expect(v2.version).toBe(v.version + 1);
    // A deduplicação também sobrevive ao reinício.
    expect(errCode(await a.call('game:action', { clientActionId: id, expectedVersion: v2.version, action: simpleAction(v2) }))).toBe('DUPLICATE_ACTION');
    ok(await a.call('game:action', { clientActionId: aid(), expectedVersion: v2.version, action: simpleAction(v2) }));
  });

  it('timers são recriados após reinício (pulo de turno a partir do horário salvo)', async () => {
    const b1 = await setup({ graceMs: 600, abandonMs: 60_000 });
    const { cs, ss, cur, other, code } = await startGame(b1);
    cs[cur]!.close();
    await waitFor(() => b1.server.manager.getRoom(code)!.players.find((p) => p.id === ss[cur]!.playerId)!.connected === false);
    cs[other]!.close();
    await b1.server.close();
    booted = booted.filter((x) => x !== b1);

    const b2 = await setup({ graceMs: 600, abandonMs: 60_000 }, b1.dataDir);
    const o = await client(b2);
    ok(await o.call('room:resume', { code, token: ss[other]!.token }));
    await waitFor(() => o.lastView()?.currentPlayer === ss[other]!.playerId, 4000);
  });

  it('desconectado além do limite de abandono → engine.abandon', async () => {
    const b = await setup({ graceMs: 100, abandonMs: 400 });
    const { cs, ss, cur, other, code } = await startGame(b, 3);
    cs[other]!.close();
    await cs[cur]!.next('game:events', (es) => es.some((e) => e.type === 'player-left'), 4000);
    await waitFor(() => cs[cur]!.lastView()!.players.find((p) => p.id === ss[other]!.playerId)!.eliminated);
    expect(b.server.manager.getRoom(code)!.players.find((p) => p.id === ss[other]!.playerId)!.abandoned).toBe(true);
  });

  it('room:leave durante a partida chama abandon e o jogador não pode voltar', async () => {
    const b = await setup();
    const { cs, ss, cur, other, code } = await startGame(b, 3);
    ok(await cs[other]!.call('room:leave', {}));
    await waitFor(() => cs[cur]!.lastView()!.players.find((p) => p.id === ss[other]!.playerId)!.eliminated);
    const back = await client(b);
    expect(errCode(await back.call('room:resume', { code, token: ss[other]!.token }))).toBe('INVALID_TOKEN');
    expect(errCode(await cs[other]!.call('game:sync', {}))).toBe('NOT_IN_ROOM');
  });
});

describe('partida completa até a vitória (dublê de contrato)', () => {
  it('ataques por socket até eliminar o adversário; objetivo do vencedor só no fim', async () => {
    const b = await boot({ engine: contractDouble });
    try {
      const a = await connect(b.server);
      const c = await connect(b.server);
      const ra = ok(await a.call('room:create', { name: 'Aslan' }));
      const rc = ok(await c.call('room:join', { code: ra.roomCode, name: 'Jadis' }));
      ok(await a.call('room:start', {}));
      await waitFor(() => a.lastView() !== undefined && c.lastView() !== undefined);
      const [me, them] = a.lastView()!.currentPlayer === ra.playerId ? [a, c] : [c, a];
      const myId = me === a ? ra.playerId : rc.playerId;
      const myObjective = JSON.stringify(b.server.manager.getRoom(ra.roomCode)!.game!.private[myId]!.objective.description);
      let n = 0;
      while (!me.lastView()!.winner) {
        const v = me.lastView()!;
        const from = Object.keys(v.territories).find((t) => v.territories[t]!.owner === myId)!;
        const to = Object.keys(v.territories).find((t) => v.territories[t]!.owner !== myId)!;
        expect(JSON.stringify(them.received)).not.toContain(myObjective);
        ok(await me.call('game:action', { clientActionId: `f${n++}`, expectedVersion: v.version, action: { type: 'attack', from, to, dice: 3 } }));
        await waitFor(() => me.lastView()!.version === v.version + 1);
      }
      await waitFor(() => them.lastView()?.winner === myId);
      expect(them.lastView()!.winnerObjective).toBeTruthy();
      await waitFor(() => them.lastRoom()?.status === 'finished');
      a.close();
      c.close();
    } finally {
      await b.server.close();
      cleanupDir(b.dataDir);
    }
  });
});

describe.skipIf(!realEngine)('partida completa até a vitória (motor real)', () => {
  it.todo('jogar só por sockets até a vitória usando legalActions do motor (aguardando o motor do Agente 2)');
});
