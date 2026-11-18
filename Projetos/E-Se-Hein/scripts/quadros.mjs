// Quadros soltos com um bundle só (mais rápido que `scripts/quadros.sh`, que empacota a cada quadro) e
// folha de contato. Uso: node scripts/quadros.mjs <composicao> <pasta> <quadro> [quadro...]
// Exemplo: NODE_USE_ENV_PROXY=1 node scripts/quadros.mjs sol out/quadros-sol 60 300 450
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [comp, pasta, ...lista] = process.argv.slice(2);
if (!comp || !pasta || lista.length === 0) {
  console.error("Uso: node scripts/quadros.mjs <composicao> <pasta> <quadro> [quadro...]");
  process.exit(1);
}
const quadros = lista.map(Number);
if (quadros.some((q) => !Number.isInteger(q) || q < 0)) {
  console.error("Os quadros precisam ser números inteiros a partir de 0.");
  process.exit(1);
}
mkdirSync(pasta, { recursive: true });

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public"), enableCaching: true });
const composition = await selectComposition({ serveUrl, id: comp });
console.log(`bundle pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s`);

const arquivos = [];
for (const frame of quadros) {
  if (frame >= composition.durationInFrames) {
    console.error(`quadro ${frame} fora do vídeo (${composition.durationInFrames} quadros)`);
    process.exit(1);
  }
  const t = Date.now();
  const output = path.join(pasta, `${comp}-${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: "png", logLevel: "error" });
  arquivos.push(output);
  console.log(`${output} (${((Date.now() - t) / 1000).toFixed(1)} s)`);
}

// Folha de contato: até 6 por linha, 270 × 480 cada.
const n = arquivos.length;
const c = Math.min(n, 6);
const escalas = arquivos.map((_, i) => `[${i}]scale=270:480[s${i}];`).join("");
const entradas = arquivos.map((_, i) => `[s${i}]`).join("");
const layout = arquivos.map((_, i) => `${(i % c) * 270}_${Math.floor(i / c) * 480}`).join("|");
const folha = path.join(pasta, `folha-${comp}.png`);
const filtro = n === 1 ? "[0]scale=270:480" : `${escalas}${entradas}xstack=inputs=${n}:layout=${layout}`;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...arquivos.flatMap((a) => ["-i", a]), "-filter_complex", filtro, folha]);
console.log(folha);
