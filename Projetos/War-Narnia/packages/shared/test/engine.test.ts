import { describe, expect, it } from 'vitest';
import {
  OBJECTIVES,
  RULES,
  abandon,
  applyAction,
  computeReinforcements,
  createGame,
  createScriptedRng,
  createSeededRng,
  currentPlayer,
  getPlayerView,
  isValidTradeSet,
  legalActions,
  nextTradeValue,
  skipTurn,
} from '../src/engine';
import { NARNIA_MAP, territoriesOfRegion } from '../src/map';
import type { GameState, Objective, PlayerId, TerritoryCard } from '../src/types';
import { act, expectRuleError, makePlayers, newGame, placeAllAndEnd, toRound2, withTerritories } from './helpers';

const ALL = NARNIA_MAP.territories.map((t) => t.id);
const objById = (id: string) => structuredClone(OBJECTIVES.find((o) => o.id === id)!);
const hardObjective: Objective = objById('obj-telmar-ilhas');

/** Estado na rodada 2, jogador da vez já na fase de ataque, com objetivos "inofensivos". */
function attackPhase(n = 3, seed = 1): GameState {
  let s = toRound2(newGame(n, seed));
  s = placeAllAndEnd(s);
  for (const p of s.turnOrder) s.private[p]!.objective = structuredClone(hardObjective);
  return s;
}

function others(s: GameState): PlayerId[] {
  return s.turnOrder.filter((p) => p !== currentPlayer(s));
}

function card(id: string, symbol: TerritoryCard['symbol'], territory: string | null = null): TerritoryCard {
  return { id, symbol, territory };
}

describe('createGame', () => {
  it('distribui territórios, objetivos e baralho', () => {
    for (let n = 2; n <= 6; n++) {
      const { state, events } = createGame(makePlayers(n), createSeededRng(n), 0);
      const counts = state.turnOrder.map((p) => ALL.filter((t) => state.territories[t]!.owner === p).length);
      expect(counts.reduce((a, b) => a + b)).toBe(42);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      // sobras vão para os primeiros da ordem
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
      expect(ALL.every((t) => state.territories[t]!.armies === 1)).toBe(true);
      const objIds = state.turnOrder.map((p) => state.private[p]!.objective.id);
      expect(new Set(objIds).size).toBe(n);
      for (const p of state.players) {
        const o = state.private[p.id]!.objective;
        if (o.kind === 'destroy-player') {
          expect(o.targetColor).not.toBe(p.color);
          expect(state.players.some((q) => q.color === o.targetColor)).toBe(true);
        }
      }
      expect(state.deck).toHaveLength(44);
      expect(state.deck.filter((c) => c.symbol === 'coringa')).toHaveLength(2);
      expect(state.round).toBe(1);
      expect(state.phase).toBe('reinforce');
      expect(state.version).toBe(1);
      expect(events.map((e) => e.type)).toEqual(['game-started', 'turn-started']);
      const cur = currentPlayer(state);
      expect(state.reinforcements).toEqual(computeReinforcements(state, cur));
    }
  });

  it('rejeita quantidade inválida de jogadores e cores repetidas', () => {
    expectRuleError(() => createGame(makePlayers(1), createSeededRng(1)), 'INVALID_COUNT');
    const seven = [...makePlayers(6), { id: 'p7', name: 'X', color: 'azul' as const }];
    expectRuleError(() => createGame(seven, createSeededRng(1)), 'INVALID_COUNT');
    const dup = makePlayers(2).map((p) => ({ ...p, color: 'azul' as const }));
    expectRuleError(() => createGame(dup, createSeededRng(1)), 'INVALID_COUNT');
  });

  it('objetivo de destruir a própria cor ou cor ausente vira o alternativo', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = newGame(2, seed);
      for (const p of s.players) {
        const o = s.private[p.id]!.objective;
        if (o.id.startsWith('obj-destruir-') && o.id.endsWith('-alt')) {
          expect(o.kind).toBe('conquer-count');
          expect(o.count).toBe(RULES.conquerCountTarget);
        }
      }
    }
  });
});

describe('parâmetros', () => {
  it('sequência de trocas 4,6,8,10,12,15,20,25...', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(nextTradeValue)).toEqual([4, 6, 8, 10, 12, 15, 20, 25, 30]);
  });
  it('reforço mínimo 3 e metade dos territórios + bônus por região', () => {
    const s = newGame(2, 3);
    const p = s.turnOrder[0]!;
    const s2 = withTerritories(s, Object.fromEntries(ALL.map((t) => [t, { owner: p }])));
    expect(computeReinforcements(s2, p)).toEqual({
      free: 21,
      byRegion: { narnia: 5, norte: 4, arquelandia: 3, calormania: 5, telmar: 4, ilhas: 3 },
    });
    const few = withTerritories(s, Object.fromEntries(ALL.map((t, i) => [t, { owner: i < 3 ? p : s.turnOrder[1]! }])));
    expect(computeReinforcements(few, p).free).toBe(3);
  });
});

describe('reforço', () => {
  it('não muta o estado de entrada', () => {
    const s = newGame();
    const before = JSON.stringify(s);
    const mine = ALL.find((t) => s.territories[t]!.owner === currentPlayer(s))!;
    const after = act(s, { type: 'place', territory: mine, count: 1 });
    expect(JSON.stringify(s)).toBe(before);
    expect(after.version).toBe(s.version + 1);
    expect(after.territories[mine]!.armies).toBe(2);
  });

  it('valida turno, dono e quantidade', () => {
    const s = newGame();
    const cur = currentPlayer(s);
    const mine = ALL.find((t) => s.territories[t]!.owner === cur)!;
    const theirs = ALL.find((t) => s.territories[t]!.owner !== cur)!;
    expectRuleError(() => applyAction(s, others(s)[0]!, { type: 'end-reinforce' }, createSeededRng(1)), 'NOT_YOUR_TURN');
    expectRuleError(() => act(s, { type: 'place', territory: theirs, count: 1 }), 'NOT_OWNER');
    expectRuleError(() => act(s, { type: 'place', territory: 'atlantida', count: 1 }), 'INVALID_TERRITORY');
    expectRuleError(() => act(s, { type: 'place', territory: mine, count: 0 }), 'INVALID_COUNT');
    expectRuleError(() => act(s, { type: 'place', territory: mine, count: 1.5 }), 'INVALID_COUNT');
    expectRuleError(() => act(s, { type: 'place', territory: mine, count: 999 }), 'INVALID_COUNT');
    expectRuleError(() => act(s, { type: 'end-reinforce' }), 'MUST_PLACE_ALL');
    expectRuleError(() => act(s, { type: 'end-turn' }), 'WRONG_PHASE');
    expectRuleError(() => act(s, { type: 'fortify', from: mine, to: mine, count: 1 }), 'WRONG_PHASE');
  });

  it('bônus de região só pode ser colocado na própria região', () => {
    let s = toRound2(newGame(2, 5));
    const cur = currentPlayer(s);
    const other = others(s)[0]!;
    const changes: Record<string, { owner: string }> = {};
    for (const t of ALL) changes[t] = { owner: territoriesOfRegion('ilhas').includes(t) || t === 'tashbaan' ? cur : other };
    s = withTerritories(s, changes);
    for (const p of s.turnOrder) s.private[p]!.objective = structuredClone(hardObjective);
    s.reinforcements = computeReinforcements(s, cur);
    expect(s.reinforcements).toEqual({ free: 4, byRegion: { ilhas: 3 } });
    // fora da região: só os 4 livres
    expectRuleError(() => act(s, { type: 'place', territory: 'tashbaan', count: 5 }), 'INVALID_COUNT');
    s = act(s, { type: 'place', territory: 'tashbaan', count: 4 });
    expect(s.reinforcements).toEqual({ free: 0, byRegion: { ilhas: 3 } });
    expectRuleError(() => act(s, { type: 'place', territory: 'tashbaan', count: 1 }), 'INVALID_COUNT');
    s = act(s, { type: 'place', territory: 'avra', count: 3 });
    expect(s.reinforcements).toEqual({ free: 0, byRegion: {} });
    expect(act(s, { type: 'end-reinforce' }).phase).toBe('attack');
  });

  it('1ª rodada: sem ataque, o turno passa sozinho e a rodada 2 começa no primeiro', () => {
    let s = newGame(3, 7);
    const first = currentPlayer(s);
    expectRuleError(
      () => act(s, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 1 }),
      'ATTACK_NOT_ALLOWED_YET',
    );
    s = placeAllAndEnd(s);
    expect(currentPlayer(s)).toBe(s.turnOrder[1]);
    expect(s.phase).toBe('reinforce');
    s = toRound2(s);
    expect(s.round).toBe(2);
    expect(currentPlayer(s)).toBe(first);
  });
});

describe('ataque e conquista', () => {
  it('compara maior com maior e empate é da defesa', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 4 }, 'cair-paravel': { owner: foe, armies: 2 } });
    const r = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([1, 6, 5, 5, 5]), 0);
    const ev = r.events.find((e) => e.type === 'attack')!;
    expect(ev).toMatchObject({ attackDice: [6, 5, 1], defenseDice: [5, 5], attackerLosses: 1, defenderLosses: 1 });
    expect(r.state.territories.beruna!.armies).toBe(3);
    expect(r.state.territories['cair-paravel']!.armies).toBe(1);
    expect(r.state.phase).toBe('attack');
  });

  it('defesa rola até 3 dados conforme seus exércitos', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 2 }, 'cair-paravel': { owner: foe, armies: 9 } });
    const r = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 1 }, createSeededRng(3), 0);
    const ev = r.events.find((e) => e.type === 'attack')!;
    expect(ev.type === 'attack' && ev.defenseDice.length).toBe(3);
  });

  it('valida origem, alvo, adjacência e dados', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, {
      beruna: { owner: cur, armies: 3 },
      'cair-paravel': { owner: foe, armies: 2 },
      'how-de-aslan': { owner: cur, armies: 1 },
      tashbaan: { owner: foe, armies: 1 },
      'grande-rio': { owner: cur, armies: 5 },
    });
    expectRuleError(() => act(s, { type: 'attack', from: 'cair-paravel', to: 'beruna', dice: 1 }), 'NOT_OWNER');
    expectRuleError(() => act(s, { type: 'attack', from: 'beruna', to: 'how-de-aslan', dice: 1 }), 'NOT_ENEMY');
    expectRuleError(() => act(s, { type: 'attack', from: 'beruna', to: 'tashbaan', dice: 1 }), 'NOT_ADJACENT');
    expectRuleError(() => act(s, { type: 'attack', from: 'how-de-aslan', to: 'cair-paravel', dice: 1 }), 'NOT_ENOUGH_ARMIES');
    expectRuleError(() => act(s, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }), 'INVALID_DICE');
    expectRuleError(() => act(s, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 0 }), 'INVALID_DICE');
    expectRuleError(() => act(s, { type: 'attack', from: 'grande-rio', to: 'cair-paravel', dice: 4 }), 'NOT_ADJACENT');
  });

  it('conquista: território muda de dono, ocupação de 1 a 3 e volta ao ataque', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 5 }, 'cair-paravel': { owner: foe, armies: 1 } });
    const r = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0);
    const st = r.state;
    expect(st.phase).toBe('occupy');
    expect(st.territories['cair-paravel']).toEqual({ owner: cur, armies: 1 });
    expect(st.territories.beruna!.armies).toBe(4);
    expect(st.pendingOccupation).toEqual({ from: 'beruna', to: 'cair-paravel', min: 1, max: 3 });
    expect(st.conqueredThisTurn).toBe(true);
    expect(r.events.map((e) => e.type)).toEqual(['attack', 'conquered']);
    expectRuleError(() => act(st, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 1 }), 'WRONG_PHASE');
    expectRuleError(() => act(st, { type: 'end-turn' }), 'WRONG_PHASE');
    expectRuleError(() => act(st, { type: 'occupy', count: 4 }), 'INVALID_COUNT');
    expectRuleError(() => act(st, { type: 'occupy', count: 0 }), 'INVALID_COUNT');
    const o = act(st, { type: 'occupy', count: 3 });
    expect(o.territories.beruna!.armies).toBe(2);
    expect(o.territories['cair-paravel']!.armies).toBe(3);
    expect(o.phase).toBe('attack');
    expect(o.pendingOccupation).toBeNull();
  });

  it('ocupação máxima limitada por origem - 1', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 2 }, 'cair-paravel': { owner: foe, armies: 1 } });
    const st = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 1 }, createScriptedRng([6, 1]), 0).state;
    expect(st.pendingOccupation).toMatchObject({ min: 1, max: 1 });
    expect(st.territories.beruna!.armies).toBe(1);
  });

  it('fim do turno com conquista compra 1 carta; sem conquista não compra', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 5 }, 'cair-paravel': { owner: foe, armies: 1 } });
    let st = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0).state;
    st = act(st, { type: 'occupy', count: 1 });
    const r = applyAction(st, cur, { type: 'end-turn' }, createSeededRng(1), 0);
    expect(r.state.private[cur]!.cards).toHaveLength(1);
    expect(r.state.players.find((p) => p.id === cur)!.cardCount).toBe(1);
    expect(r.state.deck).toHaveLength(43);
    expect(r.events.map((e) => e.type)).toEqual(['card-drawn', 'turn-ended', 'turn-started']);
    expect(currentPlayer(r.state)).not.toBe(cur);
    const noConq = act(s0, { type: 'end-turn' });
    expect(noConq.private[cur]!.cards).toHaveLength(0);
  });

  it('reembaralha o descarte quando o baralho acaba', () => {
    const s0 = attackPhase();
    const cur = currentPlayer(s0);
    const s = structuredClone(s0);
    s.discard = s.deck.splice(0, s.deck.length);
    s.conqueredThisTurn = true;
    s.phase = 'fortify';
    const st = act(s, { type: 'end-turn' });
    expect(st.private[cur]!.cards).toHaveLength(1);
    expect(st.deck.length + st.discard.length).toBe(43);
    expect(st.discard).toHaveLength(0);
  });
});

describe('eliminação e objetivos', () => {
  function eliminationSetup(objective: Objective, thirdObjective?: Objective) {
    const s0 = attackPhase(3, 11);
    const cur = currentPlayer(s0);
    const [a, b] = others(s0) as [string, string];
    const changes: Record<string, { owner: string; armies?: number }> = {};
    for (const t of ALL) if (s0.territories[t]!.owner === b) changes[t] = { owner: cur };
    changes.beruna = { owner: cur, armies: 5 };
    changes['cair-paravel'] = { owner: b, armies: 1 };
    const s = withTerritories(s0, changes);
    s.private[cur]!.objective = objective;
    if (thirdObjective) s.private[a]!.objective = thirdObjective;
    s.private[b]!.cards = [card('x1', 'espada'), card('x2', 'coroa')];
    s.players.find((p) => p.id === b)!.cardCount = 2;
    return { s, cur, a, b };
  }

  it('quem elimina recebe as cartas; objetivo de destruir de outro vira alternativo', () => {
    const { s, cur, a, b } = eliminationSetup(structuredClone(hardObjective));
    const color = s.players.find((p) => p.id === b)!.color;
    s.private[cur]!.objective = objById(`obj-destruir-${s.players.find((p) => p.id === a)!.color}`);
    s.private[a]!.objective = objById(`obj-destruir-${color}`);
    const r = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0);
    expect(r.events.map((e) => e.type)).toContain('player-eliminated');
    expect(r.state.players.find((p) => p.id === b)!.eliminated).toBe(true);
    expect(r.state.private[cur]!.cards.map((c) => c.id)).toEqual(['x1', 'x2']);
    expect(r.state.private[b]!.cards).toHaveLength(0);
    expect(r.state.private[a]!.objective.kind).toBe('conquer-count');
    expect(r.state.phase).toBe('occupy');
    // o eliminado é pulado na rotação
    let st = act(r.state, { type: 'occupy', count: 1 });
    st = act(st, { type: 'end-turn' });
    expect(currentPlayer(st)).not.toBe(b);
  });

  it('destruir a cor alvo dá vitória imediata', () => {
    const { s, cur, b } = eliminationSetup(structuredClone(hardObjective));
    const color = s.players.find((p) => p.id === b)!.color;
    s.private[cur]!.objective = objById(`obj-destruir-${color}`);
    const r = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0);
    expect(r.state.phase).toBe('game-over');
    expect(r.state.winner).toBe(cur);
    expect(r.events.at(-1)!.type).toBe('game-over');
    expectRuleError(() => act(r.state, { type: 'end-turn' }), 'GAME_OVER');
    const view = getPlayerView(r.state, others(r.state)[0]!);
    expect(view.winnerObjective).toBe(r.state.private[cur]!.objective.description);
  });

  it('conquistar regiões (+1 à escolha) e contagem vencem na hora', () => {
    const s0 = attackPhase(2, 4);
    const cur = currentPlayer(s0);
    const foe = others(s0)[0]!;
    const changes: Record<string, { owner: string; armies: number }> = {};
    for (const t of ALL) changes[t] = { owner: foe, armies: 1 };
    for (const t of [...territoriesOfRegion('telmar'), ...territoriesOfRegion('ilhas')]) changes[t] = { owner: cur, armies: 1 };
    changes['vale-telmarino'] = { owner: cur, armies: 5 };
    changes['mesa-de-pedra'] = { owner: foe, armies: 1 };
    // ilhas incompletas: falta Galma
    changes.galma = { owner: foe, armies: 1 };
    changes['campo-real'] = { owner: cur, armies: 5 };
    let s = withTerritories(s0, changes);
    s.private[cur]!.objective = objById('obj-telmar-ilhas');
    s.private[foe]!.objective = objById('obj-narnia-calormania');
    s = applyAction(s, cur, { type: 'attack', from: 'campo-real', to: 'galma', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0).state;
    expect(s.winner).toBe(cur);

    const c = withTerritories(s0, Object.fromEntries(ALL.map((t, i) => [t, { owner: i < 24 ? cur : foe, armies: 1 }])));
    c.private[cur]!.objective = objById('obj-24-territorios');
    c.private[foe]!.objective = objById('obj-narnia-calormania');
    expect(act(c, { type: 'end-attack' }).winner).toBe(cur);
  });

  it('18 territórios com 2 exércitos: cumpre ao remanejar', () => {
    const s0 = attackPhase(2, 4);
    const cur = currentPlayer(s0);
    const foe = others(s0)[0]!;
    const mine = ALL.filter((t) => s0.territories[t]!.owner === cur);
    const changes: Record<string, { armies: number }> = {};
    mine.forEach((t, i) => (changes[t] = { armies: i < 17 ? 2 : 1 }));
    let s = withTerritories(s0, changes);
    s.private[cur]!.objective = objById('obj-18-territorios-2-exercitos');
    s.private[foe]!.objective = structuredClone(hardObjective);
    s = act(s, { type: 'end-attack' });
    expect(s.winner).toBeNull();
    // dá 3 exércitos a um território com vizinho próprio e move 1
    const pair = NARNIA_MAP.connections.find(
      (c) => s.territories[c.a]!.owner === cur && s.territories[c.b]!.owner === cur && s.territories[c.b]!.armies === 1,
    );
    if (!pair) return; // distribuição sem par adequado (não ocorre com a semente 4)
    s.territories[pair.a]!.armies = 3;
    s = act(s, { type: 'fortify', from: pair.a, to: pair.b, count: 1 });
    expect(s.winner).toBe(cur);
  });
});

describe('cartas', () => {
  it('conjuntos válidos', () => {
    expect(isValidTradeSet([card('a', 'espada'), card('b', 'espada'), card('c', 'espada')])).toBe(true);
    expect(isValidTradeSet([card('a', 'espada'), card('b', 'escudo'), card('c', 'coroa')])).toBe(true);
    expect(isValidTradeSet([card('a', 'espada'), card('b', 'espada'), card('c', 'coroa')])).toBe(false);
    expect(isValidTradeSet([card('a', 'espada'), card('b', 'espada'), card('c', 'coringa')])).toBe(true);
    expect(isValidTradeSet([card('a', 'coringa'), card('b', 'coringa'), card('c', 'coroa')])).toBe(true);
  });

  it('troca soma exércitos, +2 no território da carta, contador global e descarte', () => {
    let s = toRound2(newGame(3, 2));
    const cur = currentPlayer(s);
    const mine = ALL.find((t) => s.territories[t]!.owner === cur)!;
    const theirs = ALL.find((t) => s.territories[t]!.owner !== cur)!;
    s = structuredClone(s);
    s.private[cur]!.cards = [card('k1', 'espada', mine), card('k2', 'espada', theirs), card('k3', 'espada')];
    s.tradeCount = 5;
    const freeBefore = s.reinforcements.free;
    const armiesBefore = s.territories[mine]!.armies;
    const r = applyAction(s, cur, { type: 'trade-cards', cardIds: ['k1', 'k2', 'k3'] }, createSeededRng(1), 0);
    expect(r.state.reinforcements.free).toBe(freeBefore + 15);
    expect(r.state.territories[mine]!.armies).toBe(armiesBefore + 2);
    expect(r.state.tradeCount).toBe(6);
    expect(r.state.discard.map((c) => c.id)).toEqual(['k1', 'k2', 'k3']);
    expect(r.events[0]).toMatchObject({ type: 'cards-traded', armies: 15, territoryBonus: [mine] });
    expect(getPlayerView(r.state, cur).nextTradeValue).toBe(20);
  });

  it('erros de troca e troca obrigatória com 5 cartas', () => {
    let s = toRound2(newGame(3, 2));
    const cur = currentPlayer(s);
    const mine = ALL.find((t) => s.territories[t]!.owner === cur)!;
    s = structuredClone(s);
    s.private[cur]!.cards = [card('a', 'espada'), card('b', 'espada'), card('c', 'coroa'), card('d', 'escudo'), card('e', 'escudo')];
    expectRuleError(() => act(s, { type: 'place', territory: mine, count: 1 }), 'MUST_TRADE');
    expectRuleError(() => act(s, { type: 'end-reinforce' }), 'MUST_TRADE');
    expectRuleError(() => act(s, { type: 'trade-cards', cardIds: ['a', 'b', 'c'] }), 'INVALID_CARDS');
    expectRuleError(() => act(s, { type: 'trade-cards', cardIds: ['a', 'a', 'c'] }), 'INVALID_CARDS');
    expectRuleError(() => act(s, { type: 'trade-cards', cardIds: ['a', 'b', 'zz'] }), 'INVALID_CARDS');
    const legal = legalActions(s);
    expect(legal.every((x) => x.type === 'trade-cards')).toBe(true);
    s = act(s, { type: 'trade-cards', cardIds: ['a', 'c', 'd'] });
    expect(s.private[cur]!.cards).toHaveLength(2);
    expect(act(s, { type: 'place', territory: mine, count: 1 }).territories[mine]!.armies).toBe(s.territories[mine]!.armies + 1);
    // fora do reforço não troca
    const atk = attackPhase();
    expectRuleError(() => act(atk, { type: 'trade-cards', cardIds: ['a', 'b', 'c'] }), 'WRONG_PHASE');
  });
});

describe('remanejamento', () => {
  it('adjacente, deixa 1, não move de novo quem chegou, várias vezes', () => {
    const s0 = attackPhase();
    const cur = currentPlayer(s0);
    const foe = others(s0)[0]!;
    let s = withTerritories(s0, {
      beruna: { owner: cur, armies: 4 },
      'cair-paravel': { owner: cur, armies: 1 },
      'lantern-waste': { owner: cur, armies: 1 },
      tashbaan: { owner: foe, armies: 1 },
    });
    expectRuleError(() => act(s, { type: 'fortify', from: 'beruna', to: 'cair-paravel', count: 1 }), 'WRONG_PHASE');
    s = act(s, { type: 'end-attack' });
    expect(s.phase).toBe('fortify');
    expectRuleError(() => act(s, { type: 'fortify', from: 'beruna', to: 'lantern-waste', count: 1 }), 'NOT_ADJACENT');
    expectRuleError(() => act(s, { type: 'fortify', from: 'beruna', to: 'beruna', count: 1 }), 'INVALID_TERRITORY');
    expectRuleError(() => act(s, { type: 'fortify', from: 'beruna', to: 'cair-paravel', count: 4 }), 'NOT_ENOUGH_ARMIES');
    expectRuleError(() => act(s, { type: 'fortify', from: 'beruna', to: 'tashbaan', count: 1 }), 'NOT_OWNER');
    s = act(s, { type: 'fortify', from: 'beruna', to: 'cair-paravel', count: 2 });
    expect(s.movedThisTurn).toEqual({ 'cair-paravel': 2 });
    // os 2 que chegaram não podem seguir para Lantern Waste
    expectRuleError(() => act(s, { type: 'fortify', from: 'cair-paravel', to: 'lantern-waste', count: 2 }), 'ALREADY_MOVED');
    s = act(s, { type: 'fortify', from: 'beruna', to: 'cair-paravel', count: 1 });
    expect(s.territories.beruna!.armies).toBe(1);
    expect(s.territories['cair-paravel']!.armies).toBe(4);
    // o exército original de Cair Paravel ainda pode se mover
    s = act(s, { type: 'fortify', from: 'cair-paravel', to: 'lantern-waste', count: 1 });
    expect(s.territories['lantern-waste']!.armies).toBe(2);
    const next = act(s, { type: 'end-turn' });
    expect(next.movedThisTurn).toEqual({});
  });
});

describe('skipTurn e abandon', () => {
  it('skipTurn passa a vez, mantém a ocupação mínima e só vale para o jogador da vez', () => {
    const s0 = attackPhase();
    const [cur, foe] = [currentPlayer(s0), others(s0)[0]!];
    const s = withTerritories(s0, { beruna: { owner: cur, armies: 5 }, 'cair-paravel': { owner: foe, armies: 1 } });
    const st = applyAction(s, cur, { type: 'attack', from: 'beruna', to: 'cair-paravel', dice: 3 }, createScriptedRng([6, 6, 6, 1]), 0).state;
    expectRuleError(() => skipTurn(st, foe, 'disconnected', 0), 'NOT_YOUR_TURN');
    const r = skipTurn(st, cur, 'disconnected', 0);
    expect(r.events[0]).toMatchObject({ type: 'turn-skipped', player: cur, reason: 'disconnected' });
    expect(r.state.territories['cair-paravel']).toEqual({ owner: cur, armies: 1 });
    expect(r.state.pendingOccupation).toBeNull();
    expect(currentPlayer(r.state)).not.toBe(cur);
    expect(r.state.phase).toBe('reinforce');
    expect(r.state.private[cur]!.cards).toHaveLength(0); // carta do turno perdida
    expect(r.state.version).toBe(st.version + 1);
  });

  it('abandono: pulado nos turnos, territórios continuam e o último restante vence', () => {
    let s = toRound2(newGame(3, 8));
    const [p1, p2, p3] = s.turnOrder as [string, string, string];
    s = abandon(s, p2, 0).state;
    expect(s.players.find((p) => p.id === p2)!.eliminated).toBe(true);
    expect(ALL.some((t) => s.territories[t]!.owner === p2)).toBe(true);
    expect(currentPlayer(s)).toBe(p1);
    s = placeAllAndEnd(s);
    s = act(s, { type: 'end-turn' });
    expect(currentPlayer(s)).toBe(p3);
    // abandonar na própria vez passa a vez; com um só restante, ele vence
    const r = abandon(s, p3, 0);
    expect(r.state.phase).toBe('game-over');
    expect(r.state.winner).toBe(p1);
    expect(r.events.map((e) => e.type)).toEqual(['player-left', 'game-over']);
    // abandono repetido ou após o fim não muda nada
    expect(abandon(r.state, p3, 0).events).toHaveLength(0);
  });

  it('abandono do jogador da vez com mais gente na mesa passa a vez', () => {
    const s = toRound2(newGame(4, 9));
    const cur = currentPlayer(s);
    const r = abandon(s, cur, 0);
    expect(r.events.map((e) => e.type)).toEqual(['player-left', 'turn-skipped', 'turn-ended', 'turn-started']);
    expect(currentPlayer(r.state)).toBe(s.turnOrder[1]);
  });
});

describe('getPlayerView', () => {
  it('só mostra o próprio objetivo e cartas; reforço detalhado só para o da vez', () => {
    const s = structuredClone(newGame(3, 6));
    const [p1, p2] = s.turnOrder as [string, string];
    s.private[p2]!.cards = [card('segredo-1', 'espada')];
    const v1 = getPlayerView(s, p1);
    const v2 = getPlayerView(s, p2);
    expect(v1.myObjective!.id).toBe(s.private[p1]!.objective.id);
    expect(v1.reinforcements).not.toBeNull();
    expect(v2.reinforcements).toBeNull();
    expect(v2.reinforcementsTotal).toBe(v1.reinforcementsTotal);
    expect(JSON.stringify(v1)).not.toContain('segredo-1');
    expect(JSON.stringify(v1)).not.toContain(s.private[p2]!.objective.id);
    expect(v2.myCards.map((c) => c.id)).toEqual(['segredo-1']);
    expect(v1.winnerObjective).toBeNull();
    const spec = getPlayerView(s, null);
    expect(spec.me).toBeNull();
    expect(spec.myObjective).toBeNull();
    expect(spec.reinforcements).toBeNull();
    for (const p of s.turnOrder) expect(JSON.stringify(spec)).not.toContain(s.private[p]!.objective.id);
  });

  it('log limitado a ~50 eventos', () => {
    let s = toRound2(newGame(2, 1));
    for (let i = 0; i < 40; i++) s = act(placeAllAndEnd(s), { type: 'end-turn' });
    expect(s.log.length).toBeLessThanOrEqual(RULES.logSize);
    expect(getPlayerView(s, null).log.length).toBeLessThanOrEqual(RULES.logSize);
  });
});
