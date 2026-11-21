// Render dos planos do estilo realista (v2): cada plano do spec vira uma sequência de JPEG no Blender
// (out/blender/<video>/<plano>/0001.jpg…, retoma de onde parou) e depois um MP4 em public/blender/<video>/<plano>.mp4,
// que a composição do Remotion usa por baixo das camadas 2D.
//
// Uso: node scripts/render-v2.mjs <video> [--planos P1,P3] [--amostras 24] [--limpar] [--so-codificar]
//   --limpar        apaga os quadros antigos do plano antes (use depois de mudar a cena)
//   --so-codificar  só junta os quadros já renderizados em MP4
// Depois: npx remotion render <video> out/<video>.mp4 --codec=h264 --crf=18
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(nome);
  return i === -1 ? padrao : args[i + 1];
};
const video = args[0];
if (!video || video.startsWith("--")) {
  console.error("Uso: node scripts/render-v2.mjs <video> [--planos P1,P3] [--amostras 24] [--limpar] [--so-codificar]");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(path.join("blender", `${video}.spec.json`), "utf8"));
const pedidos = opcao("--planos", spec.planos.map((p) => p.id).join(",")).split(",");
const amostras = opcao("--amostras", "24");

function acharBlender() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const base = "C:/Program Files/Blender Foundation";
  if (existsSync(base)) {
    for (const v of readdirSync(base).filter((d) => d.startsWith("Blender")).sort().reverse()) {
      if (existsSync(path.join(base, v, "blender.exe"))) return path.join(base, v, "blender.exe");
    }
  }
  return "blender";
}

const rodar = (cmd, a) =>
  new Promise((ok, falha) => {
    const p = spawn(cmd, a, { stdio: ["ignore", "pipe", "pipe"] });
    const linha = (b) => b.toString().split("\n").filter((l) => /MONTADO|SEQ|FIM|Error|Traceback/.test(l)).forEach((l) => console.log(l.trim()));
    p.stdout.on("data", linha);
    p.stderr.on("data", linha);
    p.on("close", (c) => (c === 0 ? ok() : falha(new Error(`${cmd} saiu com ${c}`))));
  });

const blender = acharBlender();
const t0 = Date.now();
for (const id of pedidos) {
  const quadrosDir = path.join("out", "blender", video, id);
  if (args.includes("--limpar") && existsSync(quadrosDir)) rmSync(quadrosDir, { recursive: true });
  if (!args.includes("--so-codificar")) {
    const t = Date.now();
    await rodar(blender, ["-b", "--factory-startup", "-P", "blender/render.py", "--", video, id, "--sequencia", "--amostras", amostras]);
    console.log(`${id}: Blender em ${((Date.now() - t) / 60000).toFixed(1)} min`);
  }
  // Confere: o número de quadros tem de bater com o do plano (o Remotion conta igual), senão sai quadro preto no corte.
  const info = JSON.parse(readFileSync(path.join("out", "blender", video, `${id}.json`), "utf8"));
  const feitos = readdirSync(quadrosDir).filter((f) => /^\d{4}\.jpg$/.test(f)).length;
  if (feitos !== info.quadros) {
    console.error(`${id}: ${feitos} quadros renderizados, o plano pede ${info.quadros}. Rode de novo (retoma de onde parou).`);
    process.exit(1);
  }
  const saida = path.join("public", "blender", video);
  mkdirSync(saida, { recursive: true });
  // Sem quadro B (-bf 0), faixa de cor de vídeo (os JPEG vêm em faixa cheia) e um quadro-chave por segundo: com B-frames
  // e yuvj420p o Remotion falhou com "No frame found at position" (21/11/2026).
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", "30", "-i", path.join(quadrosDir, "%04d.jpg"),
    "-vf", "scale=out_range=tv,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-bf", "0", "-g", "30",
    "-color_range", "tv", "-movflags", "+faststart", path.join(saida, `${id}.mp4`),
  ]);
  console.log(`${id}: ${feitos} quadros -> ${path.join(saida, `${id}.mp4`)}`);
}
console.log(`Pronto em ${((Date.now() - t0) / 60000).toFixed(1)} min. Agora: npx remotion render ${video} out/${video}.mp4 --codec=h264 --crf=18`);
