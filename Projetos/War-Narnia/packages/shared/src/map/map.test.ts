import { describe, expect, it } from 'vitest';
import { NARNIA_MAP, REGION_IDS, areAdjacent, neighbors, territoriesOfRegion } from './index';

const { territories, regions, connections, artSize } = NARNIA_MAP;
const ids = new Set(territories.map((t) => t.id));

describe('mapa de Nárnia', () => {
  it('tem 42 territórios com ids e nomes únicos', () => {
    expect(territories).toHaveLength(42);
    expect(ids.size).toBe(42);
    expect(new Set(territories.map((t) => t.name)).size).toBe(42);
  });

  it('tem 6 regiões com 7 territórios cada e bônus da legenda', () => {
    expect(regions).toHaveLength(6);
    expect(REGION_IDS).toHaveLength(6);
    for (const r of regions) expect(territoriesOfRegion(r.id)).toHaveLength(7);
    const bonus = Object.fromEntries(regions.map((r) => [r.id, r.bonus]));
    expect(bonus).toEqual({ narnia: 5, norte: 4, arquelandia: 3, calormania: 5, telmar: 4, ilhas: 3 });
  });

  it('conexões referenciam ids existentes, sem laços nem duplicatas', () => {
    const seen = new Set<string>();
    for (const c of connections) {
      expect(ids.has(c.a), c.a).toBe(true);
      expect(ids.has(c.b), c.b).toBe(true);
      expect(c.a).not.toBe(c.b);
      const key = [c.a, c.b].sort().join('|');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      expect(c.note.length).toBeGreaterThan(5);
    }
  });

  it('adjacência é simétrica', () => {
    for (const t of territories)
      for (const n of neighbors(t.id)) expect(areAdjacent(n, t.id)).toBe(true);
  });

  it('todo território tem vizinho e o grafo é conexo', () => {
    for (const t of territories) expect(neighbors(t.id).length).toBeGreaterThan(0);
    const start = territories[0]!.id;
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) for (const n of neighbors(queue.shift()!)) if (!visited.has(n)) (visited.add(n), queue.push(n));
    expect(visited.size).toBe(42);
  });

  it('cada região liga-se a outra; ilhas ligadas ao continente por mar', () => {
    const regionOf = new Map(territories.map((t) => [t.id, t.region]));
    for (const r of REGION_IDS) {
      const external = connections.filter(
        (c) => (regionOf.get(c.a) === r) !== (regionOf.get(c.b) === r),
      );
      expect(external.length, r).toBeGreaterThan(0);
    }
    const islandLinks = connections.filter(
      (c) => (regionOf.get(c.a) === 'ilhas') !== (regionOf.get(c.b) === 'ilhas'),
    );
    expect(islandLinks.every((c) => c.kind === 'sea')).toBe(true);
  });

  it('âncoras dentro da arte 2000x888', () => {
    expect(artSize).toEqual({ width: 2000, height: 888 });
    for (const t of territories) {
      expect(t.anchor.x).toBeGreaterThanOrEqual(0);
      expect(t.anchor.x).toBeLessThanOrEqual(2000);
      expect(t.anchor.y).toBeGreaterThanOrEqual(0);
      expect(t.anchor.y).toBeLessThanOrEqual(888);
    }
  });

  it('14 cartas de cada símbolo', () => {
    for (const s of ['espada', 'escudo', 'coroa'] as const)
      expect(territories.filter((t) => t.cardSymbol === s)).toHaveLength(14);
  });
});
