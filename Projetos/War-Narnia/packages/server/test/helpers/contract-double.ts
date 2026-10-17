// DUBLÊ DE CONTRATO (só para testes do servidor) — NÃO é o motor de regras.
// Implementa EngineApi de forma mínima e determinística para exercitar o
// pipeline do servidor (versão, repetição, sigilo, timers, persistência)
// enquanto o motor real do Agente 2 não existe. Territórios fictícios "z1..zN".
import { RuleError, type ActionResult, type EngineApi, type GameEvent, type GameState, type PlayerView } from '@war/shared';

/** Marcadores secretos: não podem aparecer no tráfego de outro jogador. */
export const secretObjective = (pid: string) => `OBJ-SECRETO-${pid}`;
export const secretCard = (pid: string) => `CARTA-SECRETA-${pid}`;

const clone = <T>(v: T): T => structuredClone(v);
const cur = (s: GameState) => s.turnOrder[s.currentIndex]!;

function nextTurn(s: GameState, now: number, events: GameEvent[]): void {
  events.push({ type: 'turn-ended', at: now, player: cur(s) });
  const n = s.turnOrder.length;
  for (let i = 1; i <= n; i++) {
    const idx = (s.currentIndex + i) % n;
    const p = s.players.find((x) => x.id === s.turnOrder[idx])!;
    if (!p.eliminated) {
      if (idx <= s.currentIndex) s.round++;
      s.currentIndex = idx;
      break;
    }
  }
  s.phase = 'reinforce';
  s.reinforcements = { free: 3, byRegion: {} };
  events.push({ type: 'turn-started', at: now, player: cur(s), round: s.round, reinforcements: 3 });
}

function checkWinner(s: GameState, now: number, events: GameEvent[]): void {
  const alive = s.players.filter((p) => !p.eliminated);
  const owners = new Set(Object.values(s.territories).map((t) => t.owner));
  const winner = alive.length === 1 ? alive[0]!.id : owners.size === 1 ? [...owners][0]! : null;
  if (winner) {
    s.winner = winner;
    s.phase = 'game-over';
    events.push({ type: 'game-over', at: now, winner, objective: s.private[winner]!.objective.description });
  }
}

function finish(s: GameState, events: GameEvent[]): ActionResult {
  s.version++;
  s.log = [...s.log, ...events].slice(-20);
  return { state: s, events };
}

export const contractDouble: EngineApi = {
  createGame(players, _rng, now = Date.now()) {
    const territories: GameState['territories'] = {};
    const n = players.length * 2;
    for (let i = 0; i < n; i++) territories[`z${i + 1}`] = { owner: players[i % players.length]!.id, armies: 1 };
    const priv: GameState['private'] = {};
    for (const p of players) {
      priv[p.id] = {
        objective: { id: `o-${p.id}`, kind: 'conquer-count', count: n, description: secretObjective(p.id) },
        cards: [{ id: secretCard(p.id), territory: null, symbol: 'coringa' }],
      };
    }
    const s: GameState = {
      version: 0,
      players: players.map((p) => ({ ...p, eliminated: false, cardCount: 1 })),
      private: priv,
      turnOrder: players.map((p) => p.id),
      currentIndex: 0,
      round: 1,
      phase: 'reinforce',
      territories,
      reinforcements: { free: 3, byRegion: {} },
      pendingOccupation: null,
      conqueredThisTurn: false,
      tradeCount: 0,
      deck: [],
      discard: [],
      movedThisTurn: {},
      winner: null,
      log: [],
    };
    const events: GameEvent[] = [
      { type: 'game-started', at: now, turnOrder: s.turnOrder },
      { type: 'turn-started', at: now, player: cur(s), round: 1, reinforcements: 3 },
    ];
    return finish(s, events);
  },

  applyAction(state, player, action, rng, now = Date.now()) {
    if (state.winner) throw new RuleError('GAME_OVER', 'Partida encerrada.');
    if (cur(state) !== player) throw new RuleError('NOT_YOUR_TURN', 'Não é a sua vez.');
    const s = clone(state);
    const events: GameEvent[] = [];
    switch (action.type) {
      case 'place': {
        const t = s.territories[action.territory];
        if (!t) throw new RuleError('INVALID_TERRITORY', 'Território inválido.');
        if (t.owner !== player) throw new RuleError('NOT_OWNER', 'Território não é seu.');
        if (action.count > s.reinforcements.free) throw new RuleError('INVALID_COUNT', 'Exércitos insuficientes.');
        t.armies += action.count;
        s.reinforcements.free -= action.count;
        events.push({ type: 'placed', at: now, player, territory: action.territory, count: action.count });
        break;
      }
      case 'attack': {
        // Conquista imediata (dublê): o dado só decide quem "rolou".
        const from = s.territories[action.from];
        const to = s.territories[action.to];
        if (!from || !to) throw new RuleError('INVALID_TERRITORY', 'Território inválido.');
        if (from.owner !== player || to.owner === player) throw new RuleError('NOT_ENEMY', 'Ataque inválido.');
        const die = rng.int(1, 6);
        const loser = to.owner;
        events.push({ type: 'attack', at: now, attacker: player, defender: loser, from: action.from, to: action.to, attackDice: [die], defenseDice: [1], attackerLosses: 0, defenderLosses: 1 });
        to.owner = player;
        events.push({ type: 'conquered', at: now, player, territory: action.to, from: loser });
        if (!Object.values(s.territories).some((t) => t.owner === loser)) {
          s.players.find((p) => p.id === loser)!.eliminated = true;
          events.push({ type: 'player-eliminated', at: now, player: loser, by: player });
        }
        checkWinner(s, now, events);
        break;
      }
      case 'end-turn':
        nextTurn(s, now, events);
        break;
      default:
        throw new RuleError('WRONG_PHASE', 'Ação não suportada pelo dublê.');
    }
    return finish(s, events);
  },

  getPlayerView(state, player): PlayerView {
    const mine = player ? state.private[player] : undefined;
    const isCur = player === cur(state);
    return {
      version: state.version,
      me: player,
      players: clone(state.players),
      turnOrder: [...state.turnOrder],
      currentPlayer: cur(state),
      round: state.round,
      phase: state.phase,
      territories: clone(state.territories),
      reinforcements: isCur ? clone(state.reinforcements) : null,
      reinforcementsTotal: state.reinforcements.free,
      pendingOccupation: null,
      conqueredThisTurn: state.conqueredThisTurn,
      nextTradeValue: 4,
      myObjective: mine ? clone(mine.objective) : null,
      myCards: mine ? clone(mine.cards) : [],
      movedThisTurn: {},
      winner: state.winner,
      winnerObjective: state.winner ? state.private[state.winner]!.objective.description : null,
      log: clone(state.log),
    };
  },

  skipTurn(state, player, reason, now = Date.now()) {
    if (cur(state) !== player || state.winner) return { state, events: [] };
    const s = clone(state);
    const events: GameEvent[] = [{ type: 'turn-skipped', at: now, player, reason }];
    nextTurn(s, now, events);
    return finish(s, events);
  },

  abandon(state, player, now = Date.now()) {
    const s = clone(state);
    const p = s.players.find((x) => x.id === player);
    if (!p || p.eliminated) return { state, events: [] };
    p.eliminated = true;
    const events: GameEvent[] = [{ type: 'player-left', at: now, player }];
    checkWinner(s, now, events);
    return finish(s, events);
  },
};
