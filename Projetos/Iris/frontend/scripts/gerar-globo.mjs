// Gera src/components/landing/globo/pontos.json: pontos sobre a terra firme, para o globo da landing. Uma esfera de
// Fibonacci (pontos igualmente espaçados) filtrada pelos países do world-atlas 110m; sai como [lon, lat, ...] com uma
// casa decimal. Rode com `npm run gerar-globo` só se mudar a densidade.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const mundo = require("world-atlas/countries-110m.json");
const terra = feature(mundo, mundo.objects.land);
const N = 9000;
const OURO = Math.PI * (3 - Math.sqrt(5));

const pontos = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const t = OURO * i;
  const lon = (Math.atan2(Math.sin(t) * r, Math.cos(t) * r) * 180) / Math.PI;
  const lat = (Math.asin(y) * 180) / Math.PI;
  if (lat < -60) continue; // sem Antártida: o globo fica mais legível
  if (geoContains(terra, [lon, lat])) pontos.push(+lon.toFixed(1), +lat.toFixed(1));
}
writeFileSync(new URL("../src/components/landing/globo/pontos.json", import.meta.url), JSON.stringify(pontos));
console.log(`${pontos.length / 2} pontos gravados em src/components/landing/globo/pontos.json`);
