import type { PlayerView } from '@war/shared';
import { NARNIA_MAP } from '@war/shared';

/** Visão mínima para testes: Ana (p1) dona de Cair Paravel com 5, Bruno (p2) no resto. */
export function makeView(patch: Partial<PlayerView> = {}): PlayerView {
  const territories: PlayerView['territories'] = {};
  for (const t of NARNIA_MAP.territories) territories[t.id] = { owner: 'p2', armies: 2 };
  territories['cair-paravel'] = { owner: 'p1', armies: 5 };
  return {
    version: 7,
    me: 'p1',
    players: [
      { id: 'p1', name: 'Ana', color: 'vermelho', eliminated: false, cardCount: 0, connected: true },
      { id: 'p2', name: 'Bruno', color: 'azul', eliminated: false, cardCount: 0, connected: true },
    ],
    turnOrder: ['p1', 'p2'],
    currentPlayer: 'p1',
    round: 2,
    phase: 'attack',
    territories,
    reinforcements: null,
    reinforcementsTotal: 0,
    pendingOccupation: null,
    conqueredThisTurn: false,
    nextTradeValue: 4,
    myObjective: null,
    myCards: [],
    movedThisTurn: {},
    winner: null,
    winnerObjective: null,
    log: [],
    ...patch,
  };
}
