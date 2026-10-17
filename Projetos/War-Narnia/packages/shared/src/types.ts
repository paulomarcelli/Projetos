/**
 * CONTRATO COMPARTILHADO — modelo de dados do jogo.
 *
 * Dono: Tech Lead. Alterações precisam ser combinadas entre os agentes
 * (ver docs/ARCHITECTURE.md, seção "Contratos").
 *
 * O motor de regras (packages/shared/src/engine) implementa as funções
 * descritas em `engine-api.ts` usando estes tipos. O servidor guarda o
 * `GameState` completo; o cliente só recebe `PlayerView`.
 */

/* ------------------------------------------------------------------ */
/* Mapa                                                                */
/* ------------------------------------------------------------------ */

export type RegionId =
  | 'narnia'
  | 'norte'
  | 'arquelandia'
  | 'calormania'
  | 'telmar'
  | 'ilhas';

/** Identificador estável do território (slug, ex.: "cair-paravel"). */
export type TerritoryId = string;

export interface Region {
  id: RegionId;
  name: string;
  /** Exércitos extras por turno para quem domina a região inteira. */
  bonus: number;
  /** Cor de identificação da região no mapa (hex). */
  color: string;
}

/** Tipo de ligação entre dois territórios. */
export type ConnectionKind = 'land' | 'sea';

export interface Connection {
  a: TerritoryId;
  b: TerritoryId;
  kind: ConnectionKind;
  /** Por que essa ligação existe (fronteira visível no mapa, rota marítima etc.). */
  note: string;
}

export interface Territory {
  id: TerritoryId;
  name: string;
  region: RegionId;
  /**
   * Posição do marcador de exércitos sobre a arte do mapa, em pixels da
   * imagem `packages/client/public/assets/mapa-narnia.webp` (2000 x 888).
   */
  anchor: { x: number; y: number };
  /** Símbolo da carta de território (para trocas). */
  cardSymbol: CardSymbol;
}

export interface MapData {
  regions: Region[];
  territories: Territory[];
  connections: Connection[];
  /** Tamanho da arte de referência das coordenadas `anchor`. */
  artSize: { width: number; height: number };
}

/* ------------------------------------------------------------------ */
/* Cartas e objetivos                                                  */
/* ------------------------------------------------------------------ */

export type CardSymbol = 'espada' | 'escudo' | 'coroa';

export interface TerritoryCard {
  id: string;
  /** `null` = coringa. */
  territory: TerritoryId | null;
  symbol: CardSymbol | 'coringa';
}

export type ObjectiveKind =
  | 'conquer-regions' // conquistar regiões específicas (+ opcionalmente "mais uma à escolha")
  | 'conquer-count' // conquistar N territórios
  | 'conquer-count-min-armies' // conquistar N territórios com pelo menos K exércitos em cada
  | 'destroy-player'; // eliminar um jogador (cor); se impossível, vira objetivo alternativo

export interface Objective {
  id: string;
  kind: ObjectiveKind;
  /** Texto exibido ao dono do objetivo. */
  description: string;
  regions?: RegionId[];
  /** Exige conquistar mais uma região qualquer além das listadas. */
  plusAnyRegion?: boolean;
  count?: number;
  minArmies?: number;
  /** Para destroy-player: cor alvo. */
  targetColor?: PlayerColor;
  /** Objetivo usado quando o alvo de destroy-player não existe ou é o próprio jogador. */
  fallback?: Objective;
}

/* ------------------------------------------------------------------ */
/* Jogadores e estado                                                  */
/* ------------------------------------------------------------------ */

export type PlayerColor = 'vermelho' | 'azul' | 'verde' | 'amarelo' | 'preto' | 'branco';

export type PlayerId = string;

export interface PlayerPublic {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  /** Saiu da partida (eliminado ou abandonou). */
  eliminated: boolean;
  /** Quantidade de cartas na mão (o conteúdo é privado). */
  cardCount: number;
  /** Conexão atual (preenchido pelo servidor, não pelo motor). */
  connected?: boolean;
}

export interface PlayerPrivate {
  objective: Objective;
  cards: TerritoryCard[];
}

export type Phase =
  | 'reinforce' // distribuir exércitos (e trocar cartas)
  | 'attack' // atacar (opcional)
  | 'occupy' // mover exércitos para o território recém-conquistado
  | 'fortify' // remanejamento estratégico
  | 'game-over';

export interface TerritoryState {
  owner: PlayerId;
  armies: number;
}

/** Combate pendente depois de uma conquista, aguardando a ocupação. */
export interface PendingOccupation {
  from: TerritoryId;
  to: TerritoryId;
  min: number;
  max: number;
}

export interface GameState {
  /** Versão monotônica: cada ação aceita incrementa 1. */
  version: number;
  players: PlayerPublic[];
  /** Dados privados por jogador. NUNCA enviar inteiro ao cliente. */
  private: Record<PlayerId, PlayerPrivate>;
  /** Ordem dos turnos. */
  turnOrder: PlayerId[];
  /** Índice em turnOrder do jogador da vez. */
  currentIndex: number;
  /** Rodada (começa em 1). */
  round: number;
  phase: Phase;
  territories: Record<TerritoryId, TerritoryState>;
  /** Exércitos ainda a distribuir pelo jogador da vez (por origem). */
  reinforcements: ReinforcementPool;
  pendingOccupation: PendingOccupation | null;
  /** Conquistou ao menos um território neste turno (dá direito a carta). */
  conqueredThisTurn: boolean;
  /** Número da próxima troca de cartas (define o valor). */
  tradeCount: number;
  deck: TerritoryCard[];
  discard: TerritoryCard[];
  /**
   * Exércitos que já se moveram no remanejamento deste turno, por território
   * de destino (não podem se mover de novo no mesmo turno).
   */
  movedThisTurn: Record<TerritoryId, number>;
  winner: PlayerId | null;
  /** Últimos eventos (o histórico completo fica no servidor). */
  log: GameEvent[];
}

export interface ReinforcementPool {
  /** Exércitos livres (podem ir para qualquer território próprio). */
  free: number;
  /** Exércitos que só podem ser colocados em territórios da região indicada. */
  byRegion: Partial<Record<RegionId, number>>;
}

/* ------------------------------------------------------------------ */
/* Ações (cliente pede, servidor valida no motor)                      */
/* ------------------------------------------------------------------ */

export type GameAction =
  | { type: 'place'; territory: TerritoryId; count: number }
  | { type: 'trade-cards'; cardIds: [string, string, string] }
  | { type: 'end-reinforce' }
  | { type: 'attack'; from: TerritoryId; to: TerritoryId; dice: number }
  | { type: 'occupy'; count: number }
  | { type: 'end-attack' }
  | { type: 'fortify'; from: TerritoryId; to: TerritoryId; count: number }
  | { type: 'end-turn' };

/* ------------------------------------------------------------------ */
/* Eventos (histórico e animações)                                     */
/* ------------------------------------------------------------------ */

export type GameEvent =
  | { type: 'game-started'; at: number; turnOrder: PlayerId[] }
  | { type: 'turn-started'; at: number; player: PlayerId; round: number; reinforcements: number }
  | { type: 'placed'; at: number; player: PlayerId; territory: TerritoryId; count: number }
  | { type: 'cards-traded'; at: number; player: PlayerId; armies: number; territoryBonus: TerritoryId[] }
  | {
      type: 'attack';
      at: number;
      attacker: PlayerId;
      defender: PlayerId;
      from: TerritoryId;
      to: TerritoryId;
      attackDice: number[];
      defenseDice: number[];
      attackerLosses: number;
      defenderLosses: number;
    }
  | { type: 'conquered'; at: number; player: PlayerId; territory: TerritoryId; from: PlayerId }
  | { type: 'occupied'; at: number; player: PlayerId; from: TerritoryId; to: TerritoryId; count: number }
  | { type: 'fortified'; at: number; player: PlayerId; from: TerritoryId; to: TerritoryId; count: number }
  | { type: 'card-drawn'; at: number; player: PlayerId }
  | { type: 'player-eliminated'; at: number; player: PlayerId; by: PlayerId }
  | { type: 'turn-ended'; at: number; player: PlayerId }
  | { type: 'turn-skipped'; at: number; player: PlayerId; reason: 'disconnected' | 'abandoned' }
  | { type: 'player-left'; at: number; player: PlayerId }
  | { type: 'game-over'; at: number; winner: PlayerId; objective: string };

/* ------------------------------------------------------------------ */
/* Visão por jogador (o que o servidor envia a cada cliente)           */
/* ------------------------------------------------------------------ */

export interface PlayerView {
  version: number;
  /** Quem está vendo (null = espectador). */
  me: PlayerId | null;
  players: PlayerPublic[];
  turnOrder: PlayerId[];
  currentPlayer: PlayerId;
  round: number;
  phase: Phase;
  territories: Record<TerritoryId, TerritoryState>;
  /** Só preenchido para o jogador da vez; os demais veem apenas o total. */
  reinforcements: ReinforcementPool | null;
  reinforcementsTotal: number;
  pendingOccupation: PendingOccupation | null;
  conqueredThisTurn: boolean;
  /** Valor em exércitos da próxima troca de cartas. */
  nextTradeValue: number;
  /** Apenas do próprio jogador. */
  myObjective: Objective | null;
  myCards: TerritoryCard[];
  movedThisTurn: Record<TerritoryId, number>;
  winner: PlayerId | null;
  /** Objetivo do vencedor, revelado só no fim. */
  winnerObjective: string | null;
  log: GameEvent[];
}

/* ------------------------------------------------------------------ */
/* Erros de regra                                                      */
/* ------------------------------------------------------------------ */

export type RuleErrorCode =
  | 'NOT_YOUR_TURN'
  | 'WRONG_PHASE'
  | 'INVALID_TERRITORY'
  | 'NOT_OWNER'
  | 'NOT_ADJACENT'
  | 'NOT_ENEMY'
  | 'NOT_ENOUGH_ARMIES'
  | 'INVALID_COUNT'
  | 'INVALID_DICE'
  | 'MUST_PLACE_ALL'
  | 'MUST_TRADE'
  | 'INVALID_CARDS'
  | 'ALREADY_MOVED'
  | 'GAME_OVER'
  | 'ATTACK_NOT_ALLOWED_YET';

export class RuleError extends Error {
  constructor(
    public readonly code: RuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RuleError';
  }
}
