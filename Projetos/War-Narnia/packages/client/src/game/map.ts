/**
 * Acesso aos dados do mapa. A ÚNICA fonte é `NARNIA_MAP` de @war/shared
 * (packages/shared/src/map/narnia.ts, Agente 2). Aqui só há índices derivados
 * para a interface (consultas rápidas por id e vizinhança).
 */
import { NARNIA_MAP } from '@war/shared';
import type { ConnectionKind, MapData, Region, RegionId, Territory, TerritoryId } from '@war/shared';

export const MAP: MapData = NARNIA_MAP;

export const TERRITORY_BY_ID: ReadonlyMap<TerritoryId, Territory> = new Map(MAP.territories.map((t) => [t.id, t]));
export const REGION_BY_ID: ReadonlyMap<RegionId, Region> = new Map(MAP.regions.map((r) => [r.id, r]));

export interface Neighbor {
  id: TerritoryId;
  kind: ConnectionKind;
}

export const NEIGHBORS: ReadonlyMap<TerritoryId, Neighbor[]> = (() => {
  const m = new Map<TerritoryId, Neighbor[]>();
  for (const t of MAP.territories) m.set(t.id, []);
  for (const c of MAP.connections) {
    m.get(c.a)?.push({ id: c.b, kind: c.kind });
    m.get(c.b)?.push({ id: c.a, kind: c.kind });
  }
  for (const list of m.values()) list.sort((x, y) => territoryName(x.id).localeCompare(territoryName(y.id), 'pt-BR'));
  return m;
})();

export function territoryName(id: TerritoryId): string {
  return TERRITORY_BY_ID.get(id)?.name ?? id;
}

export function regionOf(id: TerritoryId): Region | undefined {
  const t = TERRITORY_BY_ID.get(id);
  return t ? REGION_BY_ID.get(t.region) : undefined;
}

export function regionName(id: RegionId): string {
  return REGION_BY_ID.get(id)?.name ?? id;
}

export function areAdjacent(a: TerritoryId, b: TerritoryId): boolean {
  return NEIGHBORS.get(a)?.some((n) => n.id === b) ?? false;
}
