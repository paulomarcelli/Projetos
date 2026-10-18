// Utilidades para testes do motor (não usadas em produção).
import type { NewPlayer, Rng } from '../src/engine-api';
import { RuleError, type GameAction, type GameState, type PlayerColor, type PlayerId } from '../src/types';
import { NARNIA_MAP } from '../src/map';
import { applyAction, createGame, currentPlayer } from '../src/engine/game';
import { createSeededRng } from '../src/engine/rng';

const COLORS: PlayerColor[] = ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco'];

export function makePlayers(n: number): NewPlayer[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Jogador ${i + 1}`, color: COLORS[i]! }));
}

export function newGame(n = 3, seed = 1): GameState {
  return createGame(makePlayers(n), createSeededRng(seed), 0).state;
}

export function act(state: GameState, action: GameAction, rng: Rng = createSeededRng(99), player?: PlayerId) {
  return applyAction(state, player ?? currentPlayer(state), action, rng, 0).state;
}

/** Distribui todo o reforço do jogador da vez no primeiro território possível e encerra o reforço. */
export function placeAllAndEnd(state: GameState): GameState {
  let s = state;
  const me = currentPlayer(s);
  while (s.reinforcements.free > 0 || Object.keys(s.reinforcements.byRegion).length > 0) {
    const region = Object.keys(s.reinforcements.byRegion)[0];
    const target = NARNIA_MAP.territories.find(
      (t) => s.territories[t.id]!.owner === me && (region ? t.region === region : true),
    )!;
    const avail = s.reinforcements.free + (s.reinforcements.byRegion[target.region] ?? 0);
    s = act(s, { type: 'place', territory: target.id, count: avail });
  }
  return act(s, { type: 'end-reinforce' });
}

/** Joga a 1ª rodada inteira (só distribuição) e devolve o estado no início da rodada 2. */
export function toRound2(state: GameState): GameState {
  let s = state;
  while (s.round === 1) s = placeAllAndEnd(s);
  return s;
}

/** Cópia profunda com territórios alterados. */
export function withTerritories(
  state: GameState,
  changes: Record<string, { owner?: PlayerId; armies?: number }>,
): GameState {
  const s = structuredClone(state);
  for (const [id, c] of Object.entries(changes)) Object.assign(s.territories[id]!, c);
  return s;
}

export function expectRuleError(fn: () => unknown, code: RuleError['code']): void {
  try {
    fn();
  } catch (e) {
    if (e instanceof RuleError && e.code === code) return;
    throw new Error(`esperava RuleError ${code}, veio ${e instanceof RuleError ? e.code : String(e)}`);
  }
  throw new Error(`esperava RuleError ${code}, mas nada foi lançado`);
}
