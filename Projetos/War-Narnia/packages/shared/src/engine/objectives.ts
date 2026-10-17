// Objetivos secretos adaptados ao mapa de Nárnia e verificação de cumprimento.
import type { GameState, Objective, PlayerColor, PlayerId, RegionId } from '../types';
import { NARNIA_MAP, territoriesOfRegion } from '../map';
import { RULES } from './rules-config';

const REGION_NAME: Record<RegionId, string> = Object.fromEntries(
  NARNIA_MAP.regions.map((r) => [r.id, r.name]),
) as Record<RegionId, string>;

const COLOR_NAME: Record<PlayerColor, string> = {
  vermelho: 'vermelhos',
  azul: 'azuis',
  verde: 'verdes',
  amarelo: 'amarelos',
  preto: 'pretos',
  branco: 'brancos',
};

export const PLAYER_COLORS: PlayerColor[] = ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco'];

function regionsObjective(id: string, regions: RegionId[], plusAnyRegion = false): Objective {
  const names = regions.map((r) => REGION_NAME[r]).join(' e ');
  return {
    id,
    kind: 'conquer-regions',
    description: `Conquistar na totalidade ${names}${plusAnyRegion ? ' e mais uma região à sua escolha' : ''}.`,
    regions,
    ...(plusAnyRegion ? { plusAnyRegion: true } : {}),
  };
}

function countObjective(id: string): Objective {
  return {
    id,
    kind: 'conquer-count',
    description: `Conquistar ${RULES.conquerCountTarget} territórios à sua escolha.`,
    count: RULES.conquerCountTarget,
  };
}

/** Objetivo alternativo de "destruir cor" (mesmo texto do objetivo de contagem). */
export function destroyFallback(color: PlayerColor): Objective {
  return { ...countObjective(`obj-destruir-${color}-alt`) };
}

/**
 * Os 14 objetivos. Cada região aparece em exatamente 2 objetivos de região;
 * pares "puros" (14 territórios) e pares + 1 região à escolha (21 territórios).
 */
export const OBJECTIVES: Objective[] = [
  regionsObjective('obj-narnia-calormania', ['narnia', 'calormania']),
  regionsObjective('obj-norte-arquelandia', ['norte', 'arquelandia']),
  regionsObjective('obj-telmar-ilhas', ['telmar', 'ilhas']),
  regionsObjective('obj-calormania-arquelandia-mais1', ['calormania', 'arquelandia'], true),
  regionsObjective('obj-narnia-ilhas-mais1', ['narnia', 'ilhas'], true),
  regionsObjective('obj-norte-telmar-mais1', ['norte', 'telmar'], true),
  countObjective('obj-24-territorios'),
  {
    id: 'obj-18-territorios-2-exercitos',
    kind: 'conquer-count-min-armies',
    description: `Conquistar ${RULES.conquerMinArmiesCount} territórios e ocupar cada um deles com pelo menos ${RULES.conquerMinArmiesEach} exércitos.`,
    count: RULES.conquerMinArmiesCount,
    minArmies: RULES.conquerMinArmiesEach,
  },
  ...PLAYER_COLORS.map(
    (color): Objective => ({
      id: `obj-destruir-${color}`,
      kind: 'destroy-player',
      description: `Destruir totalmente os exércitos ${COLOR_NAME[color]}. Se eles não estiverem em jogo, forem os seus, ou se outro jogador os destruir, seu objetivo passa a ser conquistar ${RULES.conquerCountTarget} territórios.`,
      targetColor: color,
      fallback: destroyFallback(color),
    }),
  ),
];

/** Regiões totalmente dominadas pelo jogador. */
export function ownedRegions(state: GameState, player: PlayerId): RegionId[] {
  return NARNIA_MAP.regions
    .map((r) => r.id)
    .filter((r) => territoriesOfRegion(r).every((t) => state.territories[t]?.owner === player));
}

export function territoryCount(state: GameState, player: PlayerId): number {
  let n = 0;
  for (const t of Object.values(state.territories)) if (t.owner === player) n++;
  return n;
}

/**
 * O objetivo do jogador está cumprido agora?
 * `destroy-player` só é verificado aqui de forma passiva (alvo sem territórios e
 * eliminado por este jogador é tratado no momento da eliminação, em game.ts).
 */
export function isObjectiveComplete(state: GameState, player: PlayerId, objective: Objective): boolean {
  switch (objective.kind) {
    case 'conquer-regions': {
      const owned = ownedRegions(state, player);
      const required = objective.regions ?? [];
      if (!required.every((r) => owned.includes(r))) return false;
      if (objective.plusAnyRegion) return owned.some((r) => !required.includes(r));
      return true;
    }
    case 'conquer-count':
      return territoryCount(state, player) >= (objective.count ?? Infinity);
    case 'conquer-count-min-armies': {
      const min = objective.minArmies ?? 1;
      let n = 0;
      for (const t of Object.values(state.territories)) if (t.owner === player && t.armies >= min) n++;
      return n >= (objective.count ?? Infinity);
    }
    case 'destroy-player':
      return false;
  }
}
