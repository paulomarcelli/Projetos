/**
 * ÚNICO lugar com os números das regras. Espelhado em docs/RULES.md (seção "Parâmetros").
 * Referência: WAR clássico da Grow (ver docs/REA_WARGROW.md quando disponível).
 */
export const RULES = {
  minPlayers: 2,
  maxPlayers: 6,
  /** Exércitos em cada território no início. */
  initialArmiesPerTerritory: 1,

  /** Reforço do turno = max(minReinforcement, floor(territórios / territoriesPerArmy)) + bônus de regiões. */
  minReinforcement: 3,
  territoriesPerArmy: 2,

  /** Na 1ª rodada ninguém ataca: cada jogador só distribui e o turno passa sozinho. */
  noAttackFirstRound: true,

  /** Exércitos mínimos no território de origem para atacar. */
  minArmiesToAttack: 2,
  maxAttackDice: 3,
  maxDefenseDice: 3,
  diceSides: 6,
  /** Empate nos dados: vence a defesa. */
  tieGoesToDefender: true,

  /** Ocupação após conquista: move de minOccupy até min(maxOccupy, origem - 1). */
  minOccupyArmies: 1,
  maxOccupyArmies: 3,

  /** Valores das trocas em ordem (contador global); depois soma tradeIncrementAfter a cada troca. */
  tradeValues: [4, 6, 8, 10, 12, 15] as readonly number[],
  tradeIncrementAfter: 5,
  /** Exércitos extras colocados direto em CADA território das cartas trocadas que o jogador possui. */
  cardTerritoryBonus: 2,
  /** Com essa quantidade de cartas (ou mais) a troca é obrigatória no reforço. */
  mustTradeAtHandSize: 5,
  /** Coringas no baralho (além de uma carta por território). */
  jokers: 2,
  /** Carta comprada ao fim do turno se conquistou ao menos um território. */
  cardsPerConquestTurn: 1,

  /** Objetivo alternativo de "destruir cor" e objetivo de contagem. */
  conquerCountTarget: 24,
  conquerMinArmiesCount: 18,
  conquerMinArmiesEach: 2,

  /** Quantos eventos ficam em GameState.log / PlayerView.log. */
  logSize: 50,
} as const;

/** Valor em exércitos de uma troca, dado quantas trocas já aconteceram na partida (0 = primeira). */
export function nextTradeValue(tradeCount: number): number {
  const v = RULES.tradeValues;
  if (tradeCount < v.length) return v[tradeCount]!;
  return v[v.length - 1]! + RULES.tradeIncrementAfter * (tradeCount - v.length + 1);
}

/** Reforço base (sem bônus de região) para quem tem `territoryCount` territórios. */
export function baseReinforcement(territoryCount: number): number {
  return Math.max(RULES.minReinforcement, Math.floor(territoryCount / RULES.territoriesPerArmy));
}
