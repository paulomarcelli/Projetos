// Helpers de consulta do mapa (pré-computados uma vez).
import type { RegionId, Territory, TerritoryId } from '../types';
import { NARNIA_MAP } from './narnia';

export { NARNIA_MAP, REGIONS, TERRITORIES, CONNECTIONS } from './narnia';

export const REGION_IDS: RegionId[] = NARNIA_MAP.regions.map((r) => r.id);

const byId = new Map<TerritoryId, Territory>(NARNIA_MAP.territories.map((t) => [t.id, t]));
const adjacency = new Map<TerritoryId, TerritoryId[]>(NARNIA_MAP.territories.map((t) => [t.id, []]));
for (const c of NARNIA_MAP.connections) {
  adjacency.get(c.a)?.push(c.b);
  adjacency.get(c.b)?.push(c.a);
}
const byRegion = new Map<RegionId, TerritoryId[]>(REGION_IDS.map((r) => [r, []]));
for (const t of NARNIA_MAP.territories) byRegion.get(t.region)?.push(t.id);

/** Território pelo id (undefined se não existir). */
export function getTerritory(id: TerritoryId): Territory | undefined {
  return byId.get(id);
}

/** Vizinhos (terra ou mar) de um território. */
export function neighbors(id: TerritoryId): TerritoryId[] {
  return adjacency.get(id) ?? [];
}

export function areAdjacent(a: TerritoryId, b: TerritoryId): boolean {
  return neighbors(a).includes(b);
}

/** Ids dos territórios de uma região. */
export function territoriesOfRegion(region: RegionId): TerritoryId[] {
  return byRegion.get(region) ?? [];
}

export function getRegion(id: RegionId) {
  return NARNIA_MAP.regions.find((r) => r.id === id);
}
