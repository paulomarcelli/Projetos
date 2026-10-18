/**
 * PRÉ-VISUALIZAÇÃO — só em desenvolvimento (/?preview=1). Carregado por import
 * dinâmico dentro de `if (import.meta.env.DEV)` em main.tsx, então NÃO entra no
 * build de produção. Monta um estado de exemplo a partir de NARNIA_MAP e dos tipos,
 * sem servidor. Os "dados" de ataque aqui são uma sequência FIXA de exemplo
 * (não há sorteio no cliente).
 *
 * Parâmetros: tela=inicio|menu|sala|jogo  fase=reinforce|attack|occupy|fortify|game-over
 *             vez=eu|outro  sel=<id do território>  alvo=<id>
 */
import type { GameAction, GameEvent, Objective, Phase, PlayerColor, PlayerPublic, PlayerView, RoomSummary, TerritoryCard } from '@war/shared';
import { MAP, NEIGHBORS, TERRITORY_BY_ID } from '../game/map';
import { setBackend, applyEvents, type Backend } from '../net/api';
import { getState, resetState, setState, toast } from '../net/store';

const PLAYERS: { id: string; name: string; color: PlayerColor }[] = [
  { id: 'p1', name: 'Ana', color: 'vermelho' },
  { id: 'p2', name: 'Bruno', color: 'azul' },
  { id: 'p3', name: 'Clara', color: 'verde' },
  { id: 'p4', name: 'Davi', color: 'amarelo' },
  { id: 'p5', name: 'Eva', color: 'preto' },
  { id: 'p6', name: 'Fábio Augusto', color: 'branco' },
];
const ME = 'p1';
const T0 = Date.UTC(2026, 9, 17, 20, 0, 0);

/** Gerador determinístico só para espalhar números de exemplo (não é dado de jogo). */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

const SAMPLE_DICE: [number[], number[]][] = [
  [[6, 5, 2], [4, 4]],
  [[3, 3, 1], [5, 2]],
  [[6, 4], [6]],
  [[5, 5, 4], [3, 2]],
];
let diceIdx = 0;

const OBJECTIVE: Objective = {
  id: 'obj-exemplo',
  kind: 'conquer-regions',
  description: 'Conquistar na totalidade o Reino de Nárnia e Calormânia.',
  regions: ['narnia', 'calormania'],
};

function sampleRoom(): RoomSummary {
  return {
    code: 'K7Q2P',
    status: 'lobby',
    hostId: ME,
    minPlayers: 2,
    maxPlayers: 6,
    createdAt: T0,
    players: PLAYERS.slice(0, 3).map((p, i) => ({ ...p, isHost: p.id === ME, connected: i !== 2 })),
  };
}

function sampleView(phase: Phase, myTurn: boolean): PlayerView {
  const rnd = lcg(42);
  const territories: PlayerView['territories'] = {};
  MAP.territories.forEach((t, i) => {
    const owner = PLAYERS[i % PLAYERS.length]!.id;
    territories[t.id] = { owner, armies: 1 + Math.floor(rnd() * 7) };
  });
  // Casos extremos de legibilidade: 3 dígitos.
  const ids = MAP.territories.map((t) => t.id);
  if (ids[0]) territories[ids[0]] = { owner: ME, armies: 125 };
  if (ids[7]) territories[ids[7]]!.armies = 18;
  if (ids[13]) territories[ids[13]]!.armies = 999;

  const cards: TerritoryCard[] = [
    { id: 'c1', territory: ids[1] ?? null, symbol: 'espada' },
    { id: 'c2', territory: ids[8] ?? null, symbol: 'escudo' },
    { id: 'c3', territory: ids[15] ?? null, symbol: 'coroa' },
    { id: 'c4', territory: null, symbol: 'coringa' },
  ];

  const players: PlayerPublic[] = PLAYERS.map((p, i) => ({
    ...p,
    eliminated: false,
    cardCount: p.id === ME ? cards.length : i % 3,
    connected: p.id !== 'p5',
  }));
  const current = myTurn ? ME : 'p2';
  const view: PlayerView = {
    version: 10,
    me: ME,
    players,
    turnOrder: PLAYERS.map((p) => p.id),
    currentPlayer: current,
    round: 3,
    phase,
    territories,
    reinforcements: myTurn && phase === 'reinforce' ? { free: 5, byRegion: { narnia: 2 } } : null,
    reinforcementsTotal: phase === 'reinforce' ? 7 : 0,
    pendingOccupation: null,
    conqueredThisTurn: false,
    nextTradeValue: 8,
    myObjective: OBJECTIVE,
    myCards: cards,
    movedThisTurn: {},
    winner: null,
    winnerObjective: null,
    log: sampleLog(territories),
  };
  if (phase === 'occupy') {
    const from = MAP.territories.find((t) => territories[t.id]!.owner === ME && (NEIGHBORS.get(t.id) ?? []).length > 0);
    const to = from ? NEIGHBORS.get(from.id)![0]!.id : ids[1]!;
    if (from) territories[from.id]!.armies = 9;
    territories[to] = { owner: ME, armies: 0 };
    view.pendingOccupation = { from: from?.id ?? ids[0]!, to, min: 3, max: 8 };
    view.conqueredThisTurn = true;
  }
  if (phase === 'fortify') {
    const someMine = ids.filter((id) => territories[id]!.owner === ME);
    if (someMine[1]) view.movedThisTurn[someMine[1]] = 2;
  }
  if (phase === 'game-over') {
    view.winner = ME;
    view.winnerObjective = OBJECTIVE.description;
    view.currentPlayer = ME;
    players[4]!.eliminated = true;
  }
  return view;
}

function sampleLog(territories: PlayerView['territories']): GameEvent[] {
  const ids = MAP.territories.map((t) => t.id);
  const a = ids[0]!;
  const b = (NEIGHBORS.get(a) ?? [])[0]?.id ?? ids[1]!;
  return [
    { type: 'game-started', at: T0, turnOrder: PLAYERS.map((p) => p.id) },
    { type: 'turn-started', at: T0 + 60_000, player: 'p2', round: 2, reinforcements: 6 },
    { type: 'placed', at: T0 + 70_000, player: 'p2', territory: ids[1]!, count: 6 },
    {
      type: 'attack',
      at: T0 + 90_000,
      attacker: ME,
      defender: territories[b]?.owner ?? 'p2',
      from: a,
      to: b,
      attackDice: [6, 5, 2],
      defenseDice: [4, 4],
      attackerLosses: 0,
      defenderLosses: 2,
    },
    { type: 'conquered', at: T0 + 95_000, player: 'p3', territory: ids[9]!, from: 'p4' },
    { type: 'fortified', at: T0 + 120_000, player: 'p3', from: ids[9]!, to: ids[2]!, count: 2 },
    { type: 'card-drawn', at: T0 + 121_000, player: 'p3' },
    { type: 'turn-skipped', at: T0 + 180_000, player: 'p5', reason: 'disconnected' },
    { type: 'turn-started', at: T0 + 200_000, player: ME, round: 3, reinforcements: 7 },
  ];
}

function bump(view: PlayerView, patch: Partial<PlayerView>, events: GameEvent[] = []) {
  if (events.length) applyEvents(events);
  setState({ view: { ...view, ...patch, version: view.version + 1 } });
}

const previewBackend: Backend = {
  async createRoom() {
    setState({ room: sampleRoom(), screen: 'sala', session: { roomCode: 'K7Q2P', playerId: ME, token: 'exemplo' } });
    return true;
  },
  async joinRoom() {
    return previewBackend.createRoom('');
  },
  async resume() {
    return false;
  },
  async setColor(color) {
    const room = getState().room;
    if (!room) return false;
    if (room.players.some((p) => p.color === color && p.id !== ME)) {
      toast('error', 'Essa cor já foi escolhida por outro jogador. Escolha outra.');
      return false;
    }
    setState({ room: { ...room, players: room.players.map((p) => (p.id === ME ? { ...p, color } : p)) } });
    return true;
  },
  async startGame() {
    const view = sampleView('reinforce', true);
    setState({ room: { ...getState().room!, status: 'playing' }, view, history: view.log, screen: 'jogo' });
    return true;
  },
  async leaveRoom() {
    resetState({ preview: true, conn: 'connected', screen: 'inicio' });
  },
  async sync() {},
  retryNow() {},
  async sendAction(action: GameAction) {
    const view = getState().view;
    if (!view) return false;
    setState({ busy: true });
    await new Promise((r) => setTimeout(r, 250));
    setState({ busy: false });
    const at = Date.now();
    const terr = { ...view.territories };
    switch (action.type) {
      case 'place': {
        const pool = view.reinforcements ?? { free: 0, byRegion: {} };
        const region = TERRITORY_BY_ID.get(action.territory)!.region;
        let left = action.count;
        const byRegion = { ...pool.byRegion };
        const reg = Math.min(left, byRegion[region] ?? 0);
        byRegion[region] = (byRegion[region] ?? 0) - reg;
        left -= reg;
        const free = pool.free - left;
        terr[action.territory] = { ...terr[action.territory]!, armies: terr[action.territory]!.armies + action.count };
        bump(view, { territories: terr, reinforcements: { free, byRegion }, reinforcementsTotal: view.reinforcementsTotal - action.count }, [
          { type: 'placed', at, player: ME, territory: action.territory, count: action.count },
        ]);
        return true;
      }
      case 'trade-cards': {
        const pool = view.reinforcements ?? { free: 0, byRegion: {} };
        bump(
          view,
          {
            myCards: view.myCards.filter((c) => !action.cardIds.includes(c.id)),
            reinforcements: { ...pool, free: pool.free + view.nextTradeValue },
            reinforcementsTotal: view.reinforcementsTotal + view.nextTradeValue,
            nextTradeValue: view.nextTradeValue + 2,
          },
          [{ type: 'cards-traded', at, player: ME, armies: view.nextTradeValue, territoryBonus: [] }],
        );
        return true;
      }
      case 'end-reinforce':
        bump(view, { phase: 'attack', reinforcements: null, reinforcementsTotal: 0 });
        return true;
      case 'attack': {
        const [ad, dd] = SAMPLE_DICE[diceIdx++ % SAMPLE_DICE.length]!;
        const attackDice = ad.slice(0, action.dice);
        const defenseDice = dd.slice(0, Math.min(3, terr[action.to]!.armies));
        const pairs = Math.min(attackDice.length, defenseDice.length);
        let aL = 0;
        let dL = 0;
        for (let i = 0; i < pairs; i++) attackDice[i]! > defenseDice[i]! ? dL++ : aL++;
        const defender = terr[action.to]!.owner;
        terr[action.from] = { ...terr[action.from]!, armies: terr[action.from]!.armies - aL };
        terr[action.to] = { ...terr[action.to]!, armies: Math.max(0, terr[action.to]!.armies - dL) };
        const ev: GameEvent[] = [
          { type: 'attack', at, attacker: ME, defender, from: action.from, to: action.to, attackDice, defenseDice, attackerLosses: aL, defenderLosses: dL },
        ];
        if (terr[action.to]!.armies === 0) {
          terr[action.to] = { owner: ME, armies: 0 };
          ev.push({ type: 'conquered', at, player: ME, territory: action.to, from: defender });
          const max = Math.min(3, terr[action.from]!.armies - 1);
          bump(view, { territories: terr, phase: 'occupy', conqueredThisTurn: true, pendingOccupation: { from: action.from, to: action.to, min: Math.min(action.dice, max), max: Math.max(1, terr[action.from]!.armies - 1) } }, ev);
        } else bump(view, { territories: terr }, ev);
        return true;
      }
      case 'occupy': {
        const occ = view.pendingOccupation!;
        terr[occ.from] = { ...terr[occ.from]!, armies: terr[occ.from]!.armies - action.count };
        terr[occ.to] = { owner: ME, armies: action.count };
        bump(view, { territories: terr, phase: 'attack', pendingOccupation: null }, [
          { type: 'occupied', at, player: ME, from: occ.from, to: occ.to, count: action.count },
        ]);
        return true;
      }
      case 'end-attack':
        bump(view, { phase: 'fortify' });
        return true;
      case 'fortify':
        terr[action.from] = { ...terr[action.from]!, armies: terr[action.from]!.armies - action.count };
        terr[action.to] = { ...terr[action.to]!, armies: terr[action.to]!.armies + action.count };
        bump(view, { territories: terr, movedThisTurn: { ...view.movedThisTurn, [action.to]: (view.movedThisTurn[action.to] ?? 0) + action.count } }, [
          { type: 'fortified', at, player: ME, from: action.from, to: action.to, count: action.count },
        ]);
        return true;
      case 'end-turn':
        bump(view, { phase: 'reinforce', currentPlayer: 'p2', movedThisTurn: {}, reinforcementsTotal: 6 }, [
          { type: 'turn-ended', at, player: ME },
          { type: 'turn-started', at: at + 1, player: 'p2', round: view.round, reinforcements: 6 },
        ]);
        return true;
    }
  },
};

export function startPreview(params: URLSearchParams): void {
  setBackend(previewBackend);
  const tela = params.get('tela') ?? 'jogo';
  const fase = (params.get('fase') ?? 'reinforce') as Phase;
  const myTurn = params.get('vez') !== 'outro';
  resetState({ preview: true, conn: 'connected' });
  if (tela === 'inicio') return;
  if (tela === 'menu') {
    setState({ screen: 'menu', inviteCode: params.get('sala') });
    return;
  }
  const room = sampleRoom();
  const session = { roomCode: room.code, playerId: ME, token: 'exemplo' };
  if (tela === 'sala') {
    setState({ screen: 'sala', room, session });
    return;
  }
  const view = sampleView(fase, myTurn);
  const lastAttack = view.log.find((e): e is Extract<GameEvent, { type: 'attack' }> => e.type === 'attack') ?? null;
  setState({
    screen: 'jogo',
    room: { ...room, status: fase === 'game-over' ? 'finished' : 'playing' },
    session,
    view,
    history: view.log,
    lastAttack: fase === 'attack' || !myTurn ? lastAttack : null,
    attackSeq: 1,
  });
}
