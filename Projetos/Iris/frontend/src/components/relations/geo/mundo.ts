/**
 * Geometria do mapa-múndi (Natural Earth 1:110m). Os contornos já vêm projetados do build (scripts/gerar-mapa.mjs →
 * contornos.json): projetar e recortar os países no navegador travava a abertura do primeiro mapa. Aqui sobra só a
 * projeção, barata, para converter longitude/latitude no mesmo quadro.
 */
import { geoNaturalEarth1 } from "d3-geo";
import contornos from "./contornos.json";
import { REGIAO_POR_PAIS } from "./regioes";
import type { RegiaoId } from "./regioes-def";

export const LARGURA = 960;
export const ALTURA = 470;

export interface PaisDesenhado {
  id: string;
  d: string;
  regiao: RegiaoId | null;
}

let cache: ReturnType<typeof calcular> | null = null;

export function prepararMapa() {
  cache ??= calcular();
  return cache;
}

function calcular() {
  // mesmo quadro de scripts/gerar-mapa.mjs
  const projecao = geoNaturalEarth1().fitExtent(
    [
      [8, 8],
      [LARGURA - 8, ALTURA - 8],
    ],
    { type: "Sphere" } as never,
  );
  const paises: PaisDesenhado[] = contornos.paises.map((p) => ({ ...p, regiao: REGIAO_POR_PAIS[p.id] ?? null }));
  return {
    paises,
    /** Projeta longitude/latitude no mesmo quadro 960×470 dos países. */
    projetar: (lon: number, lat: number) => projecao([lon, lat]) ?? [0, 0],
    esfera: contornos.esfera,
    grade: contornos.grade,
  };
}
