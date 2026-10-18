/**
 * Simulação: centenas de partidas completas com bots que só escolhem ações de `legalActions`,
 * checando invariantes depois de cada ação e o sigilo de getPlayerView.
 */
import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/engine-api';
import {
  RULES,
  abandon,
  applyAction,
  createGame,
  createSeededRng,
  currentPlayer,
  getPlayerView,
  legalActions,
  skipTurn,
} from '../src/engine';
import { NARNIA_MAP, neighbors } from '../src/map';
import { RuleError, type GameAction, type GameState } from '../src/types';
import { makePlayers } from './helpers';
import { botAction, pick } from './bots';

const TOTAL_CARDS = NARNIA_MAP.territories.length + RULES.jokers;

function checkInvariants(s: GameState, prevVersion: number): void {
  const ids = new Set(s.players.map((p) => p.id));
  expect(s.version).toBe(prevVersion + 1);
  const owned = new Map<string, number>();
  for (const t of NARNIA_MAP.territories) {
    const ts = s.territories[t.id]!;
    expect(ids.has(ts.owner)).toBe(true);
    expect(Number.isInteger(ts.armies) && ts.armies >= 1).toBe(true);
    owned.set(ts.owner, (owned.get(ts.owner) ?? 0) + 1);
  }
  expect(Object.keys(s.territories)).toHaveLength(42);
  for (const p of s.players) {
    if (!owned.get(p.id)) expect(p.eliminated).toBe(true);
    expect(p.cardCount).toBe(s.private[p.id]!.cards.length);
  }
  // cartas conservadas
  const all = [...s.deck, ...s.discard, ...s.players.flatMap((p) => s.private[p.id]!.cards)].map((c) => c.id);
  expect(all).toHaveLength(TOTAL_CARDS);
  expect(new Set(all).size).toBe(TOTAL_CARDS);
  // fase coerente
  expect(s.phase === 'occupy').toBe(s.pendingOccupation !== null);
  expect(s.reinforcements.free).toBeGreaterThanOrEqual(0);
  for (const v of Object.values(s.reinforcements.byRegion)) expect(v).toBeGreaterThan(0);
  if (s.phase === 'game-over') {
    expect(s.winner).not.toBeNull();
  } else {
    expect(s.winner).toBeNull();
    expect(s.players.find((p) => p.id === currentPlayer(s))!.eliminated).toBe(false);
    if (s.phase !== 'reinforce') expect(s.reinforcements.free + Object.keys(s.reinforcements.byRegion).length).toBe(0);
  }
  expect(s.log.length).toBeLessThanOrEqual(RULES.logSize);
}

function checkPrivacy(s: GameState): void {
  for (const viewer of [...s.players.map((p) => p.id), null]) {
    const json = JSON.stringify(getPlayerView(s, viewer));
    for (const other of s.players) {
      if (other.id === viewer) continue;
      const priv = s.private[other.id]!;
      expect(json.includes(`"${priv.objective.id}"`)).toBe(false);
      for (const c of priv.cards) expect(json.includes(`"${c.id}"`)).toBe(false);
    }
    expect(json.includes('"private"')).toBe(false);
  }
}

interface SimResult {
  winner: string;
  turns: number;
  actions: number;
}

function simulate(seed: number, nPlayers: number, opts: { disruptions: boolean; privacyEvery: number }): SimResult {
  const rng = createSeededRng(seed);
  let s = createGame(makePlayers(nPlayers), rng, 0).state;
  let actions = 0;
  let turns = 0;
  const MAX_ACTIONS = 50_000;
  while (s.phase !== 'game-over') {
    if (actions++ > MAX_ACTIONS) throw new Error(`partida ${seed} travou (rodada ${s.round})`);
    const prev = s.version;
    const roll = opts.disruptions ? rng.int(0, 999) : 999;
    if (roll === 0) {
      s = skipTurn(s, currentPlayer(s), 'disconnected', 0).state;
    } else if (roll === 1 && s.round > 2) {
      const alive = s.players.filter((p) => !p.eliminated);
      s = abandon(s, pick(rng, alive).id, 0).state;
    } else {
      const action = botAction(s, rng);
      const turnBefore = currentPlayer(s);
      try {
        s = applyAction(s, currentPlayer(s), action, rng, 0).state;
      } catch (e) {
        if (e instanceof RuleError) throw new Error(`ação legal rejeitada (${e.code}): ${JSON.stringify(action)} — ${e.message}`);
        throw e;
      }
      if (s.phase !== 'game-over' && currentPlayer(s) !== turnBefore) turns++;
    }
    checkInvariants(s, prev);
    if (actions % opts.privacyEvery === 0 || s.phase === 'game-over') checkPrivacy(s);
  }
  return { winner: s.winner!, turns, actions };
}

describe('simulação de partidas completas', () => {
  it('220 partidas (2 a 6 jogadores) terminam com vencedor e sem violar invariantes', () => {
    const results: SimResult[] = [];
    for (let i = 0; i < 220; i++) {
      results.push(simulate(1000 + i, 2 + (i % 5), { disruptions: i % 4 === 0, privacyEvery: 25 }));
    }
    expect(results.every((r) => r.winner)).toBe(true);
    const avgTurns = results.reduce((a, r) => a + r.turns, 0) / results.length;
    const maxActions = Math.max(...results.map((r) => r.actions));
    console.info(`[simulação] 220 partidas; média de ${avgTurns.toFixed(1)} turnos; máx. ${maxActions} ações numa partida`);
  }, 600_000);

  it('rejeita ações de quem não é o jogador da vez em qualquer ponto', () => {
    const rng = createSeededRng(42);
    let s = createGame(makePlayers(4), rng, 0).state;
    for (let i = 0; i < 400 && s.phase !== 'game-over'; i++) {
      const other = s.turnOrder.find((p) => p !== currentPlayer(s))!;
      for (const a of legalActions(s).slice(0, 3)) {
        expect(() => applyAction(s, other, a, rng, 0)).toThrow(RuleError);
      }
      expect(legalActions(s, other)).toEqual([]);
      s = applyAction(s, currentPlayer(s), botAction(s, rng), rng, 0).state;
    }
  });
});
