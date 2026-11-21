// Rodada de conferência dos quadros do estilo realista (v2): renderiza os quadros-chave no Blender, põe as camadas 2D
// do Remotion por cima (um bundle só) e monta a folha de contato com o rótulo de cada quadro.
//
// Uso: node scripts/conferencia-v2.mjs <video> <plano:t,t> [plano:t ...] [--so-remotion] [--amostras 24] [--escala 100]
// Ex.: node scripts/conferencia-v2.mjs ultima-pessoa P1:1.0,3.6 P2:20.5 P7:60.0
// Saída: out/conferencia/<video>/<plano>-<t>.jpg e out/conferencia/<video>/folha.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(nome);
  if (i === -1) return padrao;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const soRemotion = args.includes("--so-remotion");
if (soRemotion) args.splice(args.indexOf("--so-remotion"), 1);
const amostras = opcao("--amostras", "24");
const escala = opcao("--escala", "100");
const [video, ...pedidos] = args;
if (!video || pedidos.length === 0) {
  console.error("Uso: node scripts/conferencia-v2.mjs <video> <plano:t,t> [plano:t ...] [--so-remotion]");
  process.exit(1);
}
const lista = pedidos.map((p) => {
  const [plano, ts] = p.split(":");
  return { plano, tempos: ts.split(",").map(Number) };
});

function acharBlender() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const base = "C:/Program Files/Blender Foundation";
  if (existsSync(base)) {
    const versoes = readdirSync(base).filter((d) => d.startsWith("Blender")).sort().reverse();
    for (const v of versoes) if (existsSync(path.join(base, v, "blender.exe"))) return path.join(base, v, "blender.exe");
  }
  return "blender";
}

if (!soRemotion) {
  const blender = acharBlender();
  for (const { plano, tempos } of lista) {
    const t0 = Date.now();
    const r = spawnSync(
      blender,
      ["-b", "--factory-startup", "-P", "blender/render.py", "--", video, plano, "--tempos", tempos.join(","), "--escala", escala, "--amostras", amostras, "--para-remotion"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    const linhas = (r.stdout + r.stderr).split("\n").filter((l) => /MONTADO|QUADRO|Error|Traceback/.test(l));
    console.log(linhas.join("\n"));
    if (r.status !== 0) process.exit(r.status ?? 1);
    console.log(`Blender ${plano}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}

const pasta = path.join("out", "conferencia", video);
mkdirSync(pasta, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public"), enableCaching: true });
const inputProps = { fonte: "quadros" };
const composition = await selectComposition({ serveUrl, id: video, inputProps });
const arquivos = [];
for (const { plano, tempos } of lista) {
  for (const t of tempos) {
    const frame = Math.round(t * 30);
    const output = path.join(pasta, `${plano}-${t.toFixed(2)}s.jpg`);
    await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 92, inputProps, logLevel: "error" });
    arquivos.push({ output, rotulo: `${plano} · ${t.toFixed(1)} s` });
    console.log(output);
  }
}

// Folha: 4 por linha, 360 × 640 cada, com o rótulo em cima.
const fonte = "C\\:/Windows/Fonts/arialbd.ttf";
const c = Math.min(arquivos.length, 4);
const filtros = arquivos
  .map((a, i) => `[${i}]scale=360:640,pad=360:684:0:44:white,drawtext=fontfile='${fonte}':text='${a.rotulo}':x=10:y=10:fontsize=24:fontcolor=black[s${i}]`)
  .join(";");
const layout = arquivos.map((_, i) => `${(i % c) * 360}_${Math.floor(i / c) * 684}`).join("|");
const folha = path.join(pasta, "folha.jpg");
const filtro = arquivos.length === 1 ? filtros.replace("[s0]", "") : `${filtros};${arquivos.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${arquivos.length}:layout=${layout}:fill=white`;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...arquivos.flatMap((a) => ["-i", a.output]), "-filter_complex", filtro, "-q:v", "3", folha]);
console.log(folha);
