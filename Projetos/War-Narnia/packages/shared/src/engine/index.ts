// Motor de regras: API pública.
export { RULES, nextTradeValue, baseReinforcement } from './rules-config';
export { createSeededRng, createScriptedRng, mathRandomRng, shuffle } from './rng';
export { OBJECTIVES, PLAYER_COLORS, isObjectiveComplete, ownedRegions, territoryCount } from './objectives';
export {
  engine,
  createGame,
  applyAction,
  getPlayerView,
  skipTurn,
  abandon,
  legalActions,
  validTrades,
  isValidTradeSet,
  computeReinforcements,
  totalReinforcements,
  currentPlayer,
} from './game';
