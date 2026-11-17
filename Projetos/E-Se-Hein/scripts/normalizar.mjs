// Normaliza a voz para -14 LUFS (duas passadas do loudnorm) e grava uma CÓPIA em WAV.
// O original não é alterado. Uso: node scripts/normalizar.mjs <entrada> <saida.wav>
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) {
  console.error("Uso: node scripts/normalizar.mjs <entrada> <saida.wav>");
  process.exit(1);
}
if (!existsSync(entrada)) {
  console.error(`Áudio não encontrado: ${entrada}`);
  process.exit(1);
}
if (path.resolve(entrada) === path.resolve(saida)) {
  console.error("A saída precisa ser outro arquivo (o original fica intacto).");
  process.exit(1);
}

const ALVO = "I=-14:TP=-1.5:LRA=11";
// O vídeo sai em estéreo. Voz mono copiada nos dois canais mede ~3 LU a mais,
// então convertemos para estéreo ANTES de medir e normalizar.
const canais = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels", "-of", "csv=p=0", entrada], { encoding: "utf8" }).trim());
const ESTEREO = canais === 1 ? "pan=stereo|c0=c0|c1=c0," : "";

const medir = (arquivo, filtro) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", arquivo, "-af", `${filtro}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
  const bloco = r.stderr.slice(r.stderr.lastIndexOf("{"));
  return JSON.parse(bloco.slice(0, bloco.indexOf("}") + 1));
};

const m = medir(entrada, `${ESTEREO}loudnorm=${ALVO}`);
console.log(`Antes (em estéreo): ${m.input_i} LUFS, pico ${m.input_tp} dBTP`);

mkdirSync(path.dirname(saida), { recursive: true });
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", entrada,
  "-af", `${ESTEREO}loudnorm=${ALVO}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  "-ar", "48000", "-c:a", "pcm_s16le", saida,
]);

const depois = medir(saida, `loudnorm=${ALVO}`); // a saída já é estéreo
console.log(`Depois: ${depois.input_i} LUFS, pico ${depois.input_tp} dBTP -> ${saida}`);
