// Gera src/features/relacoes/geo/contornos.json: o contorno de cada país, o globo e a grade já projetados no quadro
// 960×470 (Natural Earth 1). Projetar e recortar os 177 países custava ~100 ms no primeiro mapa aberto (mais num
// celular), bem no clique da aba; agora isso acontece uma vez aqui. Rode com `npm run gerar-mapa` só se mudar a
// projeção, o quadro (LARGURA × ALTURA em geo/mundo.ts) ou os dados do world-atlas.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const mundo = require("world-atlas/countries-110m.json");
const LARGURA = 960;
const ALTURA = 470;
const ANTARTIDA = "010"; // fora de qualquer escopo

const projecao = geoNaturalEarth1().fitExtent(
  [
    [8, 8],
    [LARGURA - 8, ALTURA - 8],
  ],
  { type: "Sphere" },
);
const caminho = geoPath(projecao).digits(2);
const paises = feature(mundo, mundo.objects.countries)
  .features.filter((f) => String(f.id) !== ANTARTIDA)
  .map((f) => ({ id: String(f.id ?? ""), d: caminho(f) ?? "" }));

const saida = { paises, esfera: caminho({ type: "Sphere" }) ?? "", grade: caminho(geoGraticule10()) ?? "" };
writeFileSync(new URL("../src/features/relacoes/geo/contornos.json", import.meta.url), JSON.stringify(saida));
console.log(`${paises.length} países gravados em src/features/relacoes/geo/contornos.json`);
