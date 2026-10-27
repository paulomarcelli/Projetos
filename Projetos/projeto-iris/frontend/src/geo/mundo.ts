/** Geometria do mapa-múndi (Natural Earth 1:110m), projetada uma vez e reaproveitada. */
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundoBruto from "world-atlas/countries-110m.json";
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
  const mundo = mundoBruto as unknown as Topology<{ countries: GeometryCollection }>;
  const paises = feature(mundo, mundo.objects.countries) as unknown as FeatureCollection<Geometry>;
  const projecao = geoNaturalEarth1().fitExtent(
    [
      [8, 8],
      [LARGURA - 8, ALTURA - 8],
    ],
    { type: "Sphere" } as never,
  );
  const caminho = geoPath(projecao);
  const desenhados: PaisDesenhado[] = paises.features
    .filter((f: Feature<Geometry>) => String(f.id) !== "010") // Antártida: fora de qualquer escopo
    .map((f: Feature<Geometry>) => ({
      id: String(f.id ?? ""),
      d: caminho(f) ?? "",
      regiao: REGIAO_POR_PAIS[String(f.id)] ?? null,
    }));
  return {
    paises: desenhados,
    /** Projeta longitude/latitude no mesmo quadro 960×470 dos países. */
    projetar: (lon: number, lat: number) => projecao([lon, lat]) ?? [0, 0],
    esfera: caminho({ type: "Sphere" } as never) ?? "",
    grade: caminho(geoGraticule10()) ?? "",
  };
}

