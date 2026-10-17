// Testes de sala/lobby por socket real (não dependem do motor de regras).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LIMITS } from '@war/shared';
import { CODE_ALPHABET } from '../src/rooms/model.js';
import { contractDouble } from './helpers/contract-double.js';
import { boot, cleanupDir, tmpDataDir as tmpDir, connect, errCode, ok, waitFor, type Client } from './helpers/harness.js';

type Booted = Awaited<ReturnType<typeof boot>>;
let booted: Booted[] = [];
let clients: Client[] = [];

async function setup(opts: Parameters<typeof boot>[0] = {}) {
  const b = await boot({ engine: null, ...opts });
  booted.push(b);
  return b;
}
async function client(b: Booted) {
  const c = await connect(b.server);
  clients.push(c);
  return c;
}

afterEach(async () => {
  for (const c of clients) c.close();
  for (const b of booted) {
    await b.server.close();
    cleanupDir(b.dataDir);
  }
  booted = [];
  clients = [];
});

describe('lobby', () => {
  it('GET /healthz responde', async () => {
    const { server } = await setup();
    const res = await fetch(`${server.url}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, engine: false });
  });

  it('serve o build do cliente com fallback de SPA', async () => {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const dist = path.join(tmpDir(), 'dist');
    mkdirSync(dist, { recursive: true });
    writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>WAR</title>');
    writeFileSync(path.join(dist, 'app.js'), 'console.log(1)');
    const { server } = await setup({ config: { clientDist: dist } });
    expect(await (await fetch(`${server.url}/sala/ABCDE`)).text()).toContain('<title>WAR</title>');
    expect(await (await fetch(`${server.url}/app.js`)).text()).toContain('console.log');
    expect((await fetch(`${server.url}/healthz`)).headers.get('content-type')).toContain('json');
    cleanupDir(path.dirname(dist));
  });

  it('cria sala com código válido, anfitrião e token só no ack', async () => {
    const b = await setup();
    const a = await client(b);
    const r = ok(await a.call('room:create', { name: '  Lúcia  ' }));
    expect(r.roomCode).toHaveLength(LIMITS.roomCodeLength);
    expect([...r.roomCode].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
    expect(r.token.length).toBeGreaterThanOrEqual(32);
    expect(r.room.hostId).toBe(r.playerId);
    expect(r.room.players[0]).toMatchObject({ name: 'Lúcia', isHost: true, connected: true, color: 'vermelho' });
    const up = await waitForRoom(a);
    expect(JSON.stringify(up)).not.toContain(r.token);
  });

  it('entrar, cores automáticas únicas, room:update para todos e sem tokens alheios', async () => {
    const b = await setup();
    const [a, bb, c] = [await client(b), await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'Pedro' }));
    const rb = ok(await bb.call('room:join', { code: ra.roomCode.toLowerCase(), name: 'Susana' }));
    const rc = ok(await c.call('room:join', { code: ra.roomCode, name: 'Edmundo' }));
    expect(new Set(rc.room.players.map((p) => p.color)).size).toBe(3);
    await waitFor(() => a.lastRoom()?.players.length === 3);
    for (const [cl, mine] of [[a, ra.token], [bb, rb.token], [c, rc.token]] as const) {
      const all = JSON.stringify(cl.received);
      for (const t of [ra.token, rb.token, rc.token]) if (t !== mine) expect(all).not.toContain(t);
    }
  });

  it('cor duplicada é recusada; cor livre é aceita', async () => {
    const b = await setup();
    const [a, bb] = [await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'Pedro' }));
    ok(await bb.call('room:join', { code: ra.roomCode, name: 'Susana' }));
    expect(errCode(await bb.call('room:set-color', { color: 'vermelho' }))).toBe('BAD_REQUEST');
    const room = ok(await bb.call('room:set-color', { color: 'branco' }));
    expect(room.players.find((p) => p.name === 'Susana')?.color).toBe('branco');
    expect(errCode(await bb.call('room:set-color', { color: 'roxo' as never }))).toBe('BAD_REQUEST');
  });

  it('nome inválido → INVALID_NAME', async () => {
    const b = await setup();
    const a = await client(b);
    expect(errCode(await a.call('room:create', { name: '   ' }))).toBe('INVALID_NAME');
    expect(errCode(await a.call('room:create', { name: 'x'.repeat(21) }))).toBe('INVALID_NAME');
    expect(errCode(await a.call('room:create', { name: 'ab\u0007c' }))).toBe('INVALID_NAME');
    expect(errCode(await a.call('room:create', { name: 'a‮b' }))).toBe('INVALID_NAME');
    expect(errCode(await a.call('room:create', { name: 123 as never }))).toBe('BAD_REQUEST');
    ok(await a.call('room:create', { name: 'x'.repeat(20) }));
  });

  it('sala inexistente e sala cheia', async () => {
    const b = await setup();
    const host = await client(b);
    const r = ok(await host.call('room:create', { name: 'H' }));
    const x = await client(b);
    expect(errCode(await x.call('room:join', { code: 'ZZZZZ', name: 'X' }))).toBe('ROOM_NOT_FOUND');
    for (let i = 1; i < LIMITS.maxPlayers; i++) ok(await (await client(b)).call('room:join', { code: r.roomCode, name: `J${i}` }));
    expect(errCode(await x.call('room:join', { code: r.roomCode, name: 'Sobra' }))).toBe('ROOM_FULL');
  });

  it('início só pelo anfitrião e com jogadores suficientes', async () => {
    const b = await setup({ engine: contractDouble });
    const [a, bb, late] = [await client(b), await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'A' }));
    expect(errCode(await a.call('room:start', {}))).toBe('NOT_ENOUGH_PLAYERS');
    ok(await bb.call('room:join', { code: ra.roomCode, name: 'B' }));
    expect(errCode(await bb.call('room:start', {}))).toBe('NOT_HOST');
    ok(await a.call('room:start', {}));
    await waitFor(() => a.lastRoom()?.status === 'playing');
    expect(errCode(await a.call('room:start', {}))).toBe('ROOM_ALREADY_STARTED');
    expect(errCode(await late.call('room:join', { code: ra.roomCode, name: 'Tarde' }))).toBe('ROOM_ALREADY_STARTED');
    expect(errCode(await bb.call('room:set-color', { color: 'verde' }))).toBe('ROOM_ALREADY_STARTED');
  });

  it('sem motor, room:start responde INTERNAL sem derrubar o servidor', async () => {
    const b = await setup();
    const [a, bb] = [await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'A' }));
    ok(await bb.call('room:join', { code: ra.roomCode, name: 'B' }));
    const r = await a.call('room:start', {});
    expect(errCode(r)).toBe('INTERNAL');
    expect(ok(await a.call('game:sync', {}))).toBeNull();
  });

  it('resume com token válido, token inválido e conexão marcada', async () => {
    const b = await setup();
    const [a, bb] = [await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'A' }));
    ok(await bb.call('room:join', { code: ra.roomCode, name: 'B' }));
    a.close();
    await waitFor(() => bb.lastRoom()?.players.find((p) => p.id === ra.playerId)?.connected === false);
    const a2 = await client(b);
    expect(errCode(await a2.call('room:resume', { code: ra.roomCode, token: 'x'.repeat(32) }))).toBe('INVALID_TOKEN');
    expect(errCode(await a2.call('room:resume', { code: 'QQQQQ', token: ra.token }))).toBe('ROOM_NOT_FOUND');
    const res = ok(await a2.call('room:resume', { code: ra.roomCode, token: ra.token }));
    expect(res.playerId).toBe(ra.playerId);
    await waitFor(() => bb.lastRoom()?.players.find((p) => p.id === ra.playerId)?.connected === true);
  });

  it('várias abas do mesmo jogador: só fica offline quando todas fecham', async () => {
    const b = await setup();
    const [a, bb] = [await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'A' }));
    ok(await bb.call('room:join', { code: ra.roomCode, name: 'B' }));
    const tab2 = await client(b);
    ok(await tab2.call('room:resume', { code: ra.roomCode, token: ra.token }));
    a.close();
    await new Promise((r) => setTimeout(r, 150));
    expect(b.server.manager.getRoom(ra.roomCode)!.players[0]!.connected).toBe(true);
    tab2.close();
    await waitFor(() => b.server.manager.getRoom(ra.roomCode)!.players[0]!.connected === false);
  });

  it('sair no lobby remove o jogador e transfere o anfitrião; sala vazia some', async () => {
    const b = await setup();
    const [a, bb] = [await client(b), await client(b)];
    const ra = ok(await a.call('room:create', { name: 'A' }));
    const rb = ok(await bb.call('room:join', { code: ra.roomCode, name: 'B' }));
    ok(await a.call('room:leave', {}));
    await waitFor(() => bb.lastRoom()?.players.length === 1);
    expect(bb.lastRoom()!.hostId).toBe(rb.playerId);
    expect(errCode(await a.call('room:start', {}))).toBe('NOT_IN_ROOM');
    expect(errCode(await a.call('room:resume', { code: ra.roomCode, token: ra.token }))).toBe('INVALID_TOKEN');
    ok(await bb.call('room:leave', {}));
    expect(b.server.manager.getRoom(ra.roomCode)).toBeUndefined();
    await waitFor(() => !existsSync(path.join(b.dataDir, `${ra.roomCode}.json`)));
  });

  it('payloads inválidos → BAD_REQUEST; ações sem sala → NOT_IN_ROOM', async () => {
    const b = await setup();
    const a = await client(b);
    expect(errCode(await a.call('room:join', { code: 5 } as never))).toBe('BAD_REQUEST');
    expect(errCode(await a.call('game:action', { clientActionId: 'x', expectedVersion: 0, action: { type: 'voar' } } as never))).toBe('BAD_REQUEST');
    expect(errCode(await a.call('game:action', { clientActionId: 'x', expectedVersion: 0, action: { type: 'attack', from: 'a', to: 'b', dice: 4 } }))).toBe('BAD_REQUEST');
    expect(errCode(await a.call('game:action', { clientActionId: 'x', expectedVersion: 0, action: { type: 'end-turn', extra: 1 } } as never))).toBe('BAD_REQUEST');
    expect(errCode(await a.call('game:action', { clientActionId: 'x', expectedVersion: 0, action: { type: 'end-turn' } }))).toBe('NOT_IN_ROOM');
    expect(errCode(await a.call('game:sync', {}))).toBe('NOT_IN_ROOM');
  });

  it('limite de taxa por socket → RATE_LIMITED', async () => {
    const b = await setup({ config: { maxActionsPerSecond: 5 } });
    const a = await client(b);
    const results = await Promise.all(
      Array.from({ length: 9 }, (_, i) => a.call('game:action', { clientActionId: `r${i}`, expectedVersion: 0, action: { type: 'end-turn' } })),
    );
    const codes = results.map(errCode);
    expect(codes.filter((c) => c === 'RATE_LIMITED').length).toBe(4);
    expect(codes.filter((c) => c === 'NOT_IN_ROOM').length).toBe(5);
  });

  it('payload acima do limite derruba só aquela conexão', async () => {
    const b = await setup({ config: { maxPayloadBytes: 2048 } });
    const a = await client(b);
    const gone = new Promise<void>((r) => a.socket.once('disconnect', () => r()));
    a.socket.emit('room:create', { name: 'x'.repeat(10_000) }, () => undefined);
    await gone;
    const c2 = await client(b);
    ok(await c2.call('room:create', { name: 'Ok' }));
  });

  it('origem cruzada não permitida é recusada; permitida por ALLOWED_ORIGINS', async () => {
    const b = await setup({ config: { allowedOrigins: ['http://localhost:5173'] } });
    const { io } = await import('socket.io-client');
    const tryOrigin = (origin: string) =>
      new Promise<boolean>((resolve) => {
        const s = io(b.server.url, { transports: ['polling'], reconnection: false, forceNew: true, extraHeaders: { Origin: origin } });
        s.once('connect', () => (s.close(), resolve(true)));
        s.once('connect_error', () => (s.close(), resolve(false)));
      });
    expect(await tryOrigin('http://evil.example')).toBe(false);
    expect(await tryOrigin('http://localhost:5173')).toBe(true);
  });

  it('persistência: arquivo JSON por sala e reinício carrega o lobby', async () => {
    const b1 = await setup();
    const a = await client(b1);
    const ra = ok(await a.call('room:create', { name: 'A' }));
    await b1.server.manager.close();
    const file = path.join(b1.dataDir, `${ra.roomCode}.json`);
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    expect(saved.players[0].token).toBe(ra.token);
    a.close();
    await b1.server.close();
    booted = booted.filter((x) => x !== b1);

    const b2 = await setup({ dataDir: b1.dataDir });
    const a2 = await client(b2);
    const res = ok(await a2.call('room:resume', { code: ra.roomCode, token: ra.token }));
    expect(res.room.status).toBe('lobby');
    expect(res.room.players[0]!.connected).toBe(true);
  });

  it('limpeza remove salas antigas e sem ninguém conectado', async () => {
    const b = await setup({ config: { roomTtlMs: 50 } });
    const a = await client(b);
    const ra = ok(await a.call('room:create', { name: 'A' }));
    expect(await b.server.manager.cleanup()).toBe(0); // ainda conectado
    a.close();
    await waitFor(() => b.server.manager.getRoom(ra.roomCode)!.players[0]!.connected === false);
    await new Promise((r) => setTimeout(r, 80));
    expect(await b.server.manager.cleanup()).toBe(1);
    expect(b.server.manager.getRoom(ra.roomCode)).toBeUndefined();
  });
});

async function waitForRoom(c: Client) {
  await waitFor(() => c.lastRoom() !== undefined);
  return c.lastRoom()!;
}
