// Bots de teste: escolhem só ações de legalActions (usados na simulação e no QA).
import type { Rng } from '../src/engine-api';
import { currentPlayer, legalActions } from '../src/engine';
import { neighbors } from '../src/map';
import type { GameAction, GameState } from '../src/types';

export function pick<T>(rng: Rng, items: T[]): T {
  return items[rng.int(0, items.length - 1)]!;
}

/** Bot simples e aleatório (apenas ações legais). */
export function botAction(s: GameState, rng: Rng): GameAction {
  const legal = legalActions(s);
  if (legal.length === 0) throw new Error('sem ações legais fora do fim de jogo');
  const me = currentPlayer(s);
  const of = <K extends GameAction['type']>(t: K) => legal.filter((a): a is Extract<GameAction, { type: K }> => a.type === t);
  switch (s.phase) {
    case 'reinforce': {
      const trades = of('trade-cards');
      if (trades.length && (trades.length === legal.length || rng.int(0, 1) === 0)) return pick(rng, trades);
      const end = of('end-reinforce');
      if (end.length) return end[0]!;
      const places = of('place');
      const border = places.filter((a) => neighbors(a.territory).some((n) => s.territories[n]!.owner !== me));
      const pool = border.length ? border : places;
      if (rng.int(0, 4) === 0) return pick(rng, pool);
      // concentra tudo onde a vantagem sobre o vizinho inimigo mais fraco é maior
      const weakest = (t: string) =>
        Math.min(...neighbors(t).filter((n) => s.territories[n]!.owner !== me).map((n) => s.territories[n]!.armies), Infinity);
      const score = (a: (typeof pool)[number]) => s.territories[a.territory]!.armies + a.count - weakest(a.territory);
      return pool.reduce((best, a) => (score(a) > score(best) ? a : best));
    }
    case 'attack': {
      const attacks = of('attack');
      const good = attacks.filter(
        (a) => s.territories[a.from]!.armies > s.territories[a.to]!.armies && a.dice === Math.min(3, s.territories[a.from]!.armies - 1),
      );
      if (good.length && rng.int(0, 99) > 0) {
        if (rng.int(0, 2) === 0) return pick(rng, good);
        const diff = (a: (typeof good)[number]) => s.territories[a.from]!.armies - s.territories[a.to]!.armies;
        return good.reduce((best, a) => (diff(a) > diff(best) ? a : best));
      }
      if (attacks.length && rng.int(0, 19) === 0) return pick(rng, attacks);
      return rng.int(0, 1) === 0 ? { type: 'end-attack' } : { type: 'end-turn' };
    }
    case 'occupy':
      return rng.int(0, 3) === 0 ? pick(rng, legal) : legal[legal.length - 1]!;
    case 'fortify': {
      const moves = of('fortify');
      const isBorder = (t: string) => neighbors(t).some((n) => s.territories[n]!.owner !== me);
      // leva exércitos do interior para a fronteira
      const useful = moves.filter((a) => a.count > 1 && !isBorder(a.from) && isBorder(a.to));
      if (useful.length && rng.int(0, 4) > 0) return pick(rng, useful);
      if (moves.length && rng.int(0, 5) === 0) return pick(rng, moves);
      return { type: 'end-turn' };
    }
    default:
      throw new Error(`fase inesperada ${s.phase}`);
  }
}

