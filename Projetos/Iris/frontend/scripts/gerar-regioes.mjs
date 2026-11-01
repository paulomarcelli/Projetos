// Gera src/components/relations/geo/regioes.ts: código ISO 3166-1 numérico → região geopolítica do Iris.
// Fonte: pacote world-countries (região e sub-região da ONU), cruzado com os países do
// mapa world-atlas 110m. Rode com `npm run gerar-regioes` só se mudar as regras abaixo.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const paises = require("world-countries/countries.json");
const mapa = JSON.parse(readFileSync(require.resolve("world-atlas/countries-110m.json"), "utf8"));

function regiao(p) {
  const { region: r, subregion: s, ccn3 } = p;
  if (ccn3 === "643") return "eurasia"; // Rússia
  if (s === "Central Asia") return "eurasia";
  if (s === "South America") return "america-sul";
  if (r === "Americas") return "america-norte";
  if (r === "Europe") return "europa";
  if (s === "Northern Africa" || s === "Western Asia") return "mena";
  if (r === "Africa") return "africa";
  if (s === "Southern Asia") return "asia-sul";
  if (s === "Eastern Asia" || s === "South-Eastern Asia") return "asia-pacifico";
  if (r === "Oceania") return "asia-pacifico";
  return null;
}

const porCodigo = new Map(paises.map((p) => [p.ccn3, p]));
const ids = mapa.objects.countries.geometries.map((g) => g.id).filter(Boolean);
const saida = {};
const sem = [];
for (const id of ids) {
  const p = porCodigo.get(id);
  const r = p ? regiao(p) : null;
  if (r) saida[id] = r;
  else sem.push(id);
}
const linhas = Object.entries(saida)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  "${k}": "${v}",`)
  .join("\n");
writeFileSync(
  "src/components/relations/geo/regioes.ts",
  `// Gerado por scripts/gerar-regioes.mjs. Não edite à mão.\n` +
    `import type { RegiaoId } from "./regioes-def";\n\n` +
    `export const REGIAO_POR_PAIS: Record<string, RegiaoId> = {\n${linhas}\n};\n`,
);
console.log(`${Object.keys(saida).length} países mapeados; sem região: ${sem.join(", ") || "nenhum"}`);
