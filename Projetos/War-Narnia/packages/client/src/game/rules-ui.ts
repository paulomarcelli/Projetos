/**
 * Cálculos LOCAIS só para a experiência (habilitar botões, destacar alvos).
 * A autoridade é sempre o servidor: tudo aqui pode ser recusado por ele,
 * e a interface mostra a mensagem de erro que ele devolver.
 */
import type { PlayerView, TerritoryId } from '@war/shared';
import { NEIGHBORS, TERRITORY_BY_ID } from './map';
import { UI_RULES } from './rules-source';

export function isMyTurn(view: PlayerView | null): boolean {
  return !!view && view.me !== null && view.currentPlayer === view.me && view.phase !== 'game-over';
}

export function ownsTerritory(view: PlayerView, id: TerritoryId): boolean {
  return view.me !== null && view.territories[id]?.owner === view.me;
}

export function armiesOf(view: PlayerView, id: TerritoryId): number {
  return view.territories[id]?.armies ?? 0;
}

/** Quantos exércitos o jogador da vez pode pôr neste território agora. */
export function placeableOn(view: PlayerView, id: TerritoryId): number {
  if (!isMyTurn(view) || view.phase !== 'reinforce' || !view.reinforcements) return 0;
  if (!ownsTerritory(view, id)) return 0;
  const region = TERRITORY_BY_ID.get(id)?.region;
  const regional = region ? view.reinforcements.byRegion[region] ?? 0 : 0;
  return view.reinforcements.free + regional;
}

export function maxAttackDice(armies: number): number {
  return Math.max(0, Math.min(UI_RULES.maxAttackDice, armies - UI_RULES.minArmiesLeftBehind));
}

export function canAttackFrom(view: PlayerView, id: TerritoryId): boolean {
  return (
    isMyTurn(view) &&
    view.phase === 'attack' &&
    ownsTerritory(view, id) &&
    maxAttackDice(armiesOf(view, id)) > 0 &&
    attackTargets(view, id).length > 0
  );
}

/** Vizinhos inimigos (o território de origem precisa ser do jogador). */
export function attackTargets(view: PlayerView, from: TerritoryId): TerritoryId[] {
  if (!ownsTerritory(view, from)) return [];
  return (NEIGHBORS.get(from) ?? []).filter((n) => !ownsTerritory(view, n.id)).map((n) => n.id);
}

/** Exércitos que ainda podem sair no remanejamento (os que chegaram neste turno não saem de novo). */
export function movableFrom(view: PlayerView, from: TerritoryId): number {
  const armies = armiesOf(view, from);
  const arrived = view.movedThisTurn[from] ?? 0;
  return Math.max(0, armies - UI_RULES.minArmiesLeftBehind - arrived);
}

export function fortifyDestinations(view: PlayerView, from: TerritoryId): TerritoryId[] {
  if (!ownsTerritory(view, from)) return [];
  return (NEIGHBORS.get(from) ?? []).filter((n) => ownsTerritory(view, n.id)).map((n) => n.id);
}

export function totalReinforcements(view: PlayerView): number {
  if (view.reinforcements) {
    return view.reinforcements.free + Object.values(view.reinforcements.byRegion).reduce((a, b) => a + (b ?? 0), 0);
  }
  return view.reinforcementsTotal;
}

/** O jogador precisa trocar cartas antes de continuar (mão cheia). */
export function mustTrade(view: PlayerView): boolean {
  return isMyTurn(view) && view.phase === 'reinforce' && view.myCards.length >= UI_RULES.mustTradeAtCards;
}

export function territoriesOwnedBy(view: PlayerView, player: string): number {
  let n = 0;
  for (const t of Object.values(view.territories)) if (t.owner === player) n++;
  return n;
}

export function armiesOwnedBy(view: PlayerView, player: string): number {
  let n = 0;
  for (const t of Object.values(view.territories)) if (t.owner === player) n += t.armies;
  return n;
}
