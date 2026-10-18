/**
 * Motor de regras (implementa EngineApi de engine-api.ts).
 * Funções puras: clonam o estado recebido e devolvem um novo. Aleatoriedade só via `Rng`.
 */
import type { ActionResult, EngineApi, NewPlayer, Rng } from '../engine-api';
import {
  RuleError,
  type GameAction,
  type GameEvent,
  type GameState,
  type PlayerId,
  type PlayerView,
  type ReinforcementPool,
  type RegionId,
  type TerritoryCard,
  type TerritoryId,
} from '../types';
import { NARNIA_MAP, areAdjacent, getRegion, getTerritory } from '../map';
import { RULES, baseReinforcement, nextTradeValue } from './rules-config';
import { shuffle } from './rng';
import { OBJECTIVES, PLAYER_COLORS, isObjectiveComplete, ownedRegions, territoryCount } from './objectives';

/* ------------------------------------------------------------------ */
/* Contexto de uma operação                                            */
/* ------------------------------------------------------------------ */

interface Ctx {
  state: GameState;
  events: GameEvent[];
  now: number;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function emit(ctx: Ctx, e: GameEvent): void {
  ctx.events.push(e);
  ctx.state.log.push(e);
}

function finish(ctx: Ctx): ActionResult {
  const log = ctx.state.log;
  if (log.length > RULES.logSize) ctx.state.log = log.slice(log.length - RULES.logSize);
  ctx.state.version += 1;
  return { state: ctx.state, events: ctx.events };
}

function fail(code: ConstructorParameters<typeof RuleError>[0], message: string): never {
  throw new RuleError(code, message);
}

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

export function currentPlayer(state: GameState): PlayerId {
  return state.turnOrder[state.currentIndex]!;
}

function isAlive(state: GameState, id: PlayerId): boolean {
  return !state.players.find((p) => p.id === id)?.eliminated;
}

function alivePlayers(state: GameState): PlayerId[] {
  return state.turnOrder.filter((id) => isAlive(state, id));
}

export function totalReinforcements(pool: ReinforcementPool): number {
  let n = pool.free;
  for (const v of Object.values(pool.byRegion)) n += v ?? 0;
  return n;
}

/** Reforço que o jogador receberia no início do turno (sem trocas de cartas). */
export function computeReinforcements(state: GameState, player: PlayerId): ReinforcementPool {
  const byRegion: Partial<Record<RegionId, number>> = {};
  for (const r of ownedRegions(state, player)) byRegion[r] = getRegion(r)!.bonus;
  return { free: baseReinforcement(territoryCount(state, player)), byRegion };
}

/** 3 cartas formam troca válida? (3 iguais, 3 diferentes, ou com coringa). */
export function isValidTradeSet(cards: TerritoryCard[]): boolean {
  if (cards.length !== 3) return false;
  const symbols = cards.filter((c) => c.symbol !== 'coringa').map((c) => c.symbol);
  if (symbols.length < 3) return true;
  const distinct = new Set(symbols).size;
  return distinct === 1 || distinct === 3;
}

function syncCardCount(state: GameState, player: PlayerId): void {
  const pub = state.players.find((p) => p.id === player);
  if (pub) pub.cardCount = state.private[player]?.cards.length ?? 0;
}

function mustTrade(state: GameState, player: PlayerId): boolean {
  return (state.private[player]?.cards.length ?? 0) >= RULES.mustTradeAtHandSize;
}

function requireTerritory(id: unknown): TerritoryId {
  if (typeof id !== 'string' || !getTerritory(id)) fail('INVALID_TERRITORY', `Território inválido: ${String(id)}.`);
  return id;
}

function requireInt(n: unknown, what: string): number {
  if (typeof n !== 'number' || !Number.isInteger(n)) fail('INVALID_COUNT', `${what} precisa ser um número inteiro.`);
  return n;
}

function tname(id: TerritoryId): string {
  return getTerritory(id)?.name ?? id;
}

/* ------------------------------------------------------------------ */
/* Turnos                                                              */
/* ------------------------------------------------------------------ */

function startTurn(ctx: Ctx): void {
  const s = ctx.state;
  const player = currentPlayer(s);
  s.phase = 'reinforce';
  s.reinforcements = computeReinforcements(s, player);
  s.pendingOccupation = null;
  s.conqueredThisTurn = false;
  s.movedThisTurn = {};
  emit(ctx, {
    type: 'turn-started',
    at: ctx.now,
    player,
    round: s.round,
    reinforcements: totalReinforcements(s.reinforcements),
  });
}

function drawCard(state: GameState, player: PlayerId, rng: Rng): boolean {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return false;
    state.deck = shuffle(state.discard, rng);
    state.discard = [];
  }
  const card = state.deck.pop()!;
  state.private[player]!.cards.push(card);
  syncCardCount(state, player);
  return true;
}

/** Encerra o turno do jogador da vez e passa para o próximo vivo. Sem `rng`, não compra carta. */
function endTurn(ctx: Ctx, rng: Rng | null): void {
  const s = ctx.state;
  const player = currentPlayer(s);
  if (rng && s.conqueredThisTurn) {
    for (let i = 0; i < RULES.cardsPerConquestTurn; i++) {
      if (drawCard(s, player, rng)) emit(ctx, { type: 'card-drawn', at: ctx.now, player });
    }
  }
  emit(ctx, { type: 'turn-ended', at: ctx.now, player });
  s.reinforcements = { free: 0, byRegion: {} };
  s.pendingOccupation = null;
  s.conqueredThisTurn = false;
  s.movedThisTurn = {};

  const n = s.turnOrder.length;
  let idx = s.currentIndex;
  for (let step = 1; step <= n; step++) {
    const cand = (s.currentIndex + step) % n;
    if (isAlive(s, s.turnOrder[cand]!)) {
      idx = cand;
      break;
    }
  }
  if (idx <= s.currentIndex) s.round += 1;
  s.currentIndex = idx;
  startTurn(ctx);
}

/* ------------------------------------------------------------------ */
/* Vitória e eliminação                                                */
/* ------------------------------------------------------------------ */

function declareWinner(ctx: Ctx, winner: PlayerId): void {
  const s = ctx.state;
  s.winner = winner;
  s.phase = 'game-over';
  s.pendingOccupation = null;
  s.reinforcements = { free: 0, byRegion: {} };
  emit(ctx, {
    type: 'game-over',
    at: ctx.now,
    winner,
    objective: s.private[winner]?.objective.description ?? '',
  });
}

/** Verifica objetivos (jogador da vez primeiro) e "último sobrevivente". */
function checkVictory(ctx: Ctx): void {
  const s = ctx.state;
  if (s.phase === 'game-over') return;
  const alive = alivePlayers(s);
  const cur = currentPlayer(s);
  const order = [cur, ...alive.filter((p) => p !== cur)];
  for (const p of order) {
    if (!isAlive(s, p)) continue;
    if (isObjectiveComplete(s, p, s.private[p]!.objective)) return declareWinner(ctx, p);
  }
  if (alive.length === 1) declareWinner(ctx, alive[0]!);
}

function handleElimination(ctx: Ctx, victim: PlayerId, killer: PlayerId): void {
  const s = ctx.state;
  const vPub = s.players.find((p) => p.id === victim)!;
  vPub.eliminated = true;
  // Cartas do eliminado vão para quem o eliminou.
  const vPriv = s.private[victim]!;
  s.private[killer]!.cards.push(...vPriv.cards);
  vPriv.cards = [];
  syncCardCount(s, victim);
  syncCardCount(s, killer);
  emit(ctx, { type: 'player-eliminated', at: ctx.now, player: victim, by: killer });

  // Objetivos "destruir a cor": cumpre quem eliminou; os demais passam ao alternativo.
  let killerWins = false;
  for (const p of s.turnOrder) {
    const obj = s.private[p]!.objective;
    if (obj.kind !== 'destroy-player' || obj.targetColor !== vPub.color) continue;
    if (p === killer) killerWins = true;
    else if (obj.fallback) s.private[p]!.objective = obj.fallback;
  }
  if (killerWins) declareWinner(ctx, killer);
}

/* ------------------------------------------------------------------ */
/* Criação                                                             */
/* ------------------------------------------------------------------ */

export function createGame(players: NewPlayer[], rng: Rng, now: number = Date.now()): ActionResult {
  if (players.length < RULES.minPlayers || players.length > RULES.maxPlayers)
    fail('INVALID_COUNT', `A partida precisa de ${RULES.minPlayers} a ${RULES.maxPlayers} jogadores.`);
  if (new Set(players.map((p) => p.id)).size !== players.length) fail('INVALID_COUNT', 'Ids de jogador repetidos.');
  if (new Set(players.map((p) => p.color)).size !== players.length) fail('INVALID_COUNT', 'Cores de jogador repetidas.');
  for (const p of players)
    if (!PLAYER_COLORS.includes(p.color)) fail('INVALID_COUNT', `Cor inválida: ${String(p.color)}.`);

  const turnOrder = shuffle(players.map((p) => p.id), rng);

  // Territórios em ordem aleatória, distribuídos um a um na ordem dos turnos (sobras para os primeiros).
  const territories: GameState['territories'] = {};
  shuffle(NARNIA_MAP.territories.map((t) => t.id), rng).forEach((id, i) => {
    territories[id] = { owner: turnOrder[i % turnOrder.length]!, armies: RULES.initialArmiesPerTerritory };
  });

  // Objetivos sorteados, sem repetir.
  const colors = new Set(players.map((p) => p.color));
  const objectives = shuffle(OBJECTIVES, rng);
  const priv: GameState['private'] = {};
  players.forEach((p, i) => {
    let obj = clone(objectives[i]!);
    if (obj.kind === 'destroy-player' && (obj.targetColor === p.color || !colors.has(obj.targetColor!)) && obj.fallback)
      obj = clone(obj.fallback);
    priv[p.id] = { objective: obj, cards: [] };
  });

  // Baralho: uma carta por território + coringas.
  const cards: TerritoryCard[] = NARNIA_MAP.territories.map((t) => ({
    id: `carta-${t.id}`,
    territory: t.id,
    symbol: t.cardSymbol,
  }));
  for (let i = 1; i <= RULES.jokers; i++) cards.push({ id: `carta-coringa-${i}`, territory: null, symbol: 'coringa' });

  const state: GameState = {
    version: 0,
    players: players.map((p) => ({ id: p.id, name: p.name, color: p.color, eliminated: false, cardCount: 0 })),
    private: priv,
    turnOrder,
    currentIndex: 0,
    round: 1,
    phase: 'reinforce',
    territories,
    reinforcements: { free: 0, byRegion: {} },
    pendingOccupation: null,
    conqueredThisTurn: false,
    tradeCount: 0,
    deck: shuffle(cards, rng),
    discard: [],
    movedThisTurn: {},
    winner: null,
    log: [],
  };
  const ctx: Ctx = { state, events: [], now };
  emit(ctx, { type: 'game-started', at: now, turnOrder });
  startTurn(ctx);
  return finish(ctx);
}

/* ------------------------------------------------------------------ */
/* Ações                                                               */
/* ------------------------------------------------------------------ */

function requirePhase(state: GameState, phase: GameState['phase'], what: string): void {
  if (state.phase !== phase) fail('WRONG_PHASE', `Não é possível ${what} na fase atual (${state.phase}).`);
}

function doPlace(ctx: Ctx, player: PlayerId, a: Extract<GameAction, { type: 'place' }>): void {
  const s = ctx.state;
  requirePhase(s, 'reinforce', 'colocar exércitos');
  if (mustTrade(s, player))
    fail('MUST_TRADE', `Você tem ${RULES.mustTradeAtHandSize} ou mais cartas: troque antes de distribuir.`);
  const id = requireTerritory(a.territory);
  const count = requireInt(a.count, 'A quantidade');
  if (s.territories[id]!.owner !== player) fail('NOT_OWNER', `${tname(id)} não é seu.`);
  if (count < 1) fail('INVALID_COUNT', 'Coloque pelo menos 1 exército.');
  const region = getTerritory(id)!.region;
  const regional = s.reinforcements.byRegion[region] ?? 0;
  if (count > s.reinforcements.free + regional)
    fail('INVALID_COUNT', `Você só pode colocar ${s.reinforcements.free + regional} exército(s) em ${tname(id)}.`);
  // Usa primeiro os exércitos exclusivos da região, depois os livres.
  const fromRegion = Math.min(regional, count);
  if (fromRegion > 0) {
    const left = regional - fromRegion;
    if (left > 0) s.reinforcements.byRegion[region] = left;
    else delete s.reinforcements.byRegion[region];
  }
  s.reinforcements.free -= count - fromRegion;
  s.territories[id]!.armies += count;
  emit(ctx, { type: 'placed', at: ctx.now, player, territory: id, count });
}

function doTrade(ctx: Ctx, player: PlayerId, a: Extract<GameAction, { type: 'trade-cards' }>): void {
  const s = ctx.state;
  requirePhase(s, 'reinforce', 'trocar cartas');
  const ids = a.cardIds;
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3)
    fail('INVALID_CARDS', 'Escolha exatamente 3 cartas diferentes.');
  const hand = s.private[player]!.cards;
  const chosen = ids.map((id) => hand.find((c) => c.id === id));
  if (chosen.some((c) => !c)) fail('INVALID_CARDS', 'Uma das cartas não está na sua mão.');
  const cards = chosen as TerritoryCard[];
  if (!isValidTradeSet(cards))
    fail('INVALID_CARDS', 'A troca exige 3 símbolos iguais ou 3 diferentes (o coringa vale qualquer um).');

  const armies = nextTradeValue(s.tradeCount);
  s.tradeCount += 1;
  s.reinforcements.free += armies;
  const territoryBonus: TerritoryId[] = [];
  for (const c of cards) {
    if (c.territory && s.territories[c.territory]?.owner === player) {
      s.territories[c.territory]!.armies += RULES.cardTerritoryBonus;
      territoryBonus.push(c.territory);
    }
  }
  s.private[player]!.cards = hand.filter((c) => !ids.includes(c.id));
  s.discard.push(...cards);
  syncCardCount(s, player);
  emit(ctx, { type: 'cards-traded', at: ctx.now, player, armies, territoryBonus });
}

function doEndReinforce(ctx: Ctx, player: PlayerId): void {
  const s = ctx.state;
  requirePhase(s, 'reinforce', 'encerrar o reforço');
  if (mustTrade(s, player))
    fail('MUST_TRADE', `Você tem ${RULES.mustTradeAtHandSize} ou mais cartas: a troca é obrigatória.`);
  const left = totalReinforcements(s.reinforcements);
  if (left > 0) fail('MUST_PLACE_ALL', `Ainda faltam ${left} exército(s) para distribuir.`);
  if (RULES.noAttackFirstRound && s.round === 1) {
    endTurn(ctx, null); // 1ª rodada: só distribuição
  } else {
    s.phase = 'attack';
  }
}

function rollDice(rng: Rng, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(rng.int(1, RULES.diceSides));
  return out.sort((x, y) => y - x);
}

function doAttack(ctx: Ctx, player: PlayerId, a: Extract<GameAction, { type: 'attack' }>, rng: Rng): void {
  const s = ctx.state;
  if (RULES.noAttackFirstRound && s.round === 1)
    fail('ATTACK_NOT_ALLOWED_YET', 'Na primeira rodada ninguém ataca: apenas distribua seus exércitos.');
  requirePhase(s, 'attack', 'atacar');
  const from = requireTerritory(a.from);
  const to = requireTerritory(a.to);
  const src = s.territories[from]!;
  const dst = s.territories[to]!;
  if (src.owner !== player) fail('NOT_OWNER', `${tname(from)} não é seu.`);
  if (dst.owner === player) fail('NOT_ENEMY', `${tname(to)} já é seu.`);
  if (!areAdjacent(from, to)) fail('NOT_ADJACENT', `${tname(from)} não faz fronteira com ${tname(to)}.`);
  if (src.armies < RULES.minArmiesToAttack)
    fail('NOT_ENOUGH_ARMIES', `É preciso ter pelo menos ${RULES.minArmiesToAttack} exércitos em ${tname(from)} para atacar.`);
  const maxDice = Math.min(RULES.maxAttackDice, src.armies - 1);
  if (typeof a.dice !== 'number' || !Number.isInteger(a.dice) || a.dice < 1 || a.dice > maxDice)
    fail('INVALID_DICE', `Escolha de 1 a ${maxDice} dado(s).`);

  const defender = dst.owner;
  const attackDice = rollDice(rng, a.dice);
  const defenseDice = rollDice(rng, Math.min(RULES.maxDefenseDice, dst.armies));
  let attackerLosses = 0;
  let defenderLosses = 0;
  for (let i = 0; i < Math.min(attackDice.length, defenseDice.length); i++) {
    const atk = attackDice[i]!;
    const def = defenseDice[i]!;
    if (atk > def || (atk === def && !RULES.tieGoesToDefender)) defenderLosses++;
    else attackerLosses++;
  }
  src.armies -= attackerLosses;
  dst.armies -= defenderLosses;
  emit(ctx, {
    type: 'attack',
    at: ctx.now,
    attacker: player,
    defender,
    from,
    to,
    attackDice,
    defenseDice,
    attackerLosses,
    defenderLosses,
  });

  if (dst.armies > 0) return;
  // Conquista: o mínimo já é movido para manter "≥1 exército em cada território".
  const before = src.armies;
  const min = RULES.minOccupyArmies;
  const max = Math.max(min, Math.min(RULES.maxOccupyArmies, before - 1));
  dst.owner = player;
  dst.armies = min;
  src.armies -= min;
  s.conqueredThisTurn = true;
  s.pendingOccupation = { from, to, min, max };
  s.phase = 'occupy';
  emit(ctx, { type: 'conquered', at: ctx.now, player, territory: to, from: defender });
  if (territoryCount(s, defender) === 0) handleElimination(ctx, defender, player);
}

function doOccupy(ctx: Ctx, player: PlayerId, a: Extract<GameAction, { type: 'occupy' }>): void {
  const s = ctx.state;
  requirePhase(s, 'occupy', 'ocupar');
  const p = s.pendingOccupation!;
  const count = requireInt(a.count, 'A quantidade');
  if (count < p.min || count > p.max) fail('INVALID_COUNT', `Mova de ${p.min} a ${p.max} exército(s).`);
  const extra = count - p.min;
  s.territories[p.from]!.armies -= extra;
  s.territories[p.to]!.armies += extra;
  s.pendingOccupation = null;
  s.phase = 'attack';
  emit(ctx, { type: 'occupied', at: ctx.now, player, from: p.from, to: p.to, count });
}

function doFortify(ctx: Ctx, player: PlayerId, a: Extract<GameAction, { type: 'fortify' }>): void {
  const s = ctx.state;
  requirePhase(s, 'fortify', 'remanejar');
  const from = requireTerritory(a.from);
  const to = requireTerritory(a.to);
  if (from === to) fail('INVALID_TERRITORY', 'Origem e destino precisam ser diferentes.');
  const src = s.territories[from]!;
  const dst = s.territories[to]!;
  if (src.owner !== player || dst.owner !== player) fail('NOT_OWNER', 'Só é possível remanejar entre territórios seus.');
  if (!areAdjacent(from, to)) fail('NOT_ADJACENT', `${tname(from)} não faz fronteira com ${tname(to)}.`);
  const count = requireInt(a.count, 'A quantidade');
  if (count < 1) fail('INVALID_COUNT', 'Mova pelo menos 1 exército.');
  if (count > src.armies - 1) fail('NOT_ENOUGH_ARMIES', `Deixe pelo menos 1 exército em ${tname(from)}.`);
  const moved = s.movedThisTurn[from] ?? 0;
  if (count > src.armies - Math.max(1, moved))
    fail('ALREADY_MOVED', `Exércitos que chegaram a ${tname(from)} neste remanejamento não podem se mover de novo.`);
  src.armies -= count;
  dst.armies += count;
  s.movedThisTurn[to] = (s.movedThisTurn[to] ?? 0) + count;
  emit(ctx, { type: 'fortified', at: ctx.now, player, from, to, count });
}

export function applyAction(
  state: GameState,
  player: PlayerId,
  action: GameAction,
  rng: Rng,
  now: number = Date.now(),
): ActionResult {
  if (state.phase === 'game-over') fail('GAME_OVER', 'A partida já terminou.');
  if (player !== currentPlayer(state)) fail('NOT_YOUR_TURN', 'Não é a sua vez.');
  const ctx: Ctx = { state: clone(state), events: [], now };
  switch (action?.type) {
    case 'place':
      doPlace(ctx, player, action);
      break;
    case 'trade-cards':
      doTrade(ctx, player, action);
      break;
    case 'end-reinforce':
      doEndReinforce(ctx, player);
      break;
    case 'attack':
      doAttack(ctx, player, action, rng);
      break;
    case 'occupy':
      doOccupy(ctx, player, action);
      break;
    case 'end-attack':
      requirePhase(ctx.state, 'attack', 'encerrar os ataques');
      ctx.state.phase = 'fortify';
      break;
    case 'fortify':
      doFortify(ctx, player, action);
      break;
    case 'end-turn':
      if (ctx.state.phase !== 'attack' && ctx.state.phase !== 'fortify')
        fail('WRONG_PHASE', ctx.state.phase === 'occupy' ? 'Conclua a ocupação antes de passar a vez.' : 'Termine o reforço antes de passar a vez.');
      endTurn(ctx, rng);
      break;
    default:
      fail('WRONG_PHASE', 'Ação desconhecida.');
  }
  checkVictory(ctx);
  return finish(ctx);
}

/* ------------------------------------------------------------------ */
/* Turno pulado e abandono                                             */
/* ------------------------------------------------------------------ */

/** Pula o turno: ocupação pendente fica com o mínimo já movido; reforço não colocado e carta do turno são perdidos. */
export function skipTurn(
  state: GameState,
  player: PlayerId,
  reason: 'disconnected' | 'abandoned',
  now: number = Date.now(),
): ActionResult {
  if (state.phase === 'game-over') fail('GAME_OVER', 'A partida já terminou.');
  if (player !== currentPlayer(state)) fail('NOT_YOUR_TURN', 'Só é possível pular o turno do jogador da vez.');
  const ctx: Ctx = { state: clone(state), events: [], now };
  emit(ctx, { type: 'turn-skipped', at: now, player, reason });
  endTurn(ctx, null);
  checkVictory(ctx);
  return finish(ctx);
}

/** O jogador sai da partida: continua dono dos territórios (atacáveis), mas não joga mais. */
export function abandon(state: GameState, player: PlayerId, now: number = Date.now()): ActionResult {
  if (!state.players.some((p) => p.id === player)) fail('NOT_OWNER', 'Jogador não pertence a esta partida.');
  const ctx: Ctx = { state: clone(state), events: [], now };
  const s = ctx.state;
  const pub = s.players.find((p) => p.id === player)!;
  if (s.phase === 'game-over' || pub.eliminated) return { state: s, events: [] };
  pub.eliminated = true;
  emit(ctx, { type: 'player-left', at: now, player });
  const wasCurrent = currentPlayer(s) === player;
  if (alivePlayers(s).length <= 1) {
    checkVictory(ctx);
  } else if (wasCurrent) {
    emit(ctx, { type: 'turn-skipped', at: now, player, reason: 'abandoned' });
    endTurn(ctx, null);
    checkVictory(ctx);
  } else {
    checkVictory(ctx);
  }
  return finish(ctx);
}

/* ------------------------------------------------------------------ */
/* Visão por jogador                                                   */
/* ------------------------------------------------------------------ */

export function getPlayerView(state: GameState, player: PlayerId | null): PlayerView {
  const cur = currentPlayer(state);
  const me = player && state.private[player] ? player : null;
  const priv = me ? state.private[me]! : null;
  const over = state.phase === 'game-over';
  return {
    version: state.version,
    me,
    players: clone(state.players),
    turnOrder: [...state.turnOrder],
    currentPlayer: cur,
    round: state.round,
    phase: state.phase,
    territories: clone(state.territories),
    reinforcements: me === cur && !over ? clone(state.reinforcements) : null,
    reinforcementsTotal: totalReinforcements(state.reinforcements),
    pendingOccupation: clone(state.pendingOccupation),
    conqueredThisTurn: state.conqueredThisTurn,
    nextTradeValue: nextTradeValue(state.tradeCount),
    myObjective: priv ? clone(priv.objective) : null,
    myCards: priv ? clone(priv.cards) : [],
    movedThisTurn: { ...state.movedThisTurn },
    winner: state.winner,
    winnerObjective: over && state.winner ? (state.private[state.winner]?.objective.description ?? null) : null,
    log: clone(state.log.slice(-RULES.logSize)),
  };
}

/* ------------------------------------------------------------------ */
/* Ações legais (bots, cliente e QA)                                   */
/* ------------------------------------------------------------------ */

function combinations3<T>(items: T[]): [T, T, T][] {
  const out: [T, T, T][] = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      for (let k = j + 1; k < items.length; k++) out.push([items[i]!, items[j]!, items[k]!]);
  return out;
}

/** Trocas válidas na mão do jogador. */
export function validTrades(state: GameState, player: PlayerId): [string, string, string][] {
  const hand = state.private[player]?.cards ?? [];
  return combinations3(hand)
    .filter((set) => isValidTradeSet(set))
    .map((set) => set.map((c) => c.id) as [string, string, string]);
}

/**
 * Ações legais do jogador da vez (lista vazia para os demais ou no fim do jogo).
 * Para `place` e `fortify` lista só as quantidades 1 e máxima, para não explodir a lista.
 */
export function legalActions(state: GameState, player?: PlayerId): GameAction[] {
  if (state.phase === 'game-over') return [];
  const cur = currentPlayer(state);
  if (player !== undefined && player !== cur) return [];
  const out: GameAction[] = [];
  const owned = Object.entries(state.territories).filter(([, t]) => t.owner === cur);
  switch (state.phase) {
    case 'reinforce': {
      for (const cardIds of validTrades(state, cur)) out.push({ type: 'trade-cards', cardIds });
      if (mustTrade(state, cur)) break;
      const total = totalReinforcements(state.reinforcements);
      if (total === 0) {
        out.push({ type: 'end-reinforce' });
        break;
      }
      for (const [id] of owned) {
        const avail = state.reinforcements.free + (state.reinforcements.byRegion[getTerritory(id)!.region] ?? 0);
        if (avail <= 0) continue;
        out.push({ type: 'place', territory: id, count: 1 });
        if (avail > 1) out.push({ type: 'place', territory: id, count: avail });
      }
      break;
    }
    case 'attack': {
      for (const [from, t] of owned) {
        if (t.armies < RULES.minArmiesToAttack) continue;
        const maxDice = Math.min(RULES.maxAttackDice, t.armies - 1);
        for (const c of NARNIA_MAP.connections) {
          const to = c.a === from ? c.b : c.b === from ? c.a : null;
          if (!to || state.territories[to]!.owner === cur) continue;
          for (let dice = 1; dice <= maxDice; dice++) out.push({ type: 'attack', from, to, dice });
        }
      }
      out.push({ type: 'end-attack' }, { type: 'end-turn' });
      break;
    }
    case 'occupy': {
      const p = state.pendingOccupation!;
      for (let n = p.min; n <= p.max; n++) out.push({ type: 'occupy', count: n });
      break;
    }
    case 'fortify': {
      for (const [from, t] of owned) {
        const movable = t.armies - Math.max(1, state.movedThisTurn[from] ?? 0);
        if (movable <= 0) continue;
        for (const c of NARNIA_MAP.connections) {
          const to = c.a === from ? c.b : c.b === from ? c.a : null;
          if (!to || state.territories[to]!.owner !== cur) continue;
          out.push({ type: 'fortify', from, to, count: 1 });
          if (movable > 1) out.push({ type: 'fortify', from, to, count: movable });
        }
      }
      out.push({ type: 'end-turn' });
      break;
    }
  }
  return out;
}

/** Implementação do contrato EngineApi. */
export const engine: EngineApi = { createGame, applyAction, getPlayerView, skipTurn, abandon };
