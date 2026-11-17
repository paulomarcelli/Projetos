// Transcreve um áudio com o whisper.cpp local (sem API paga) e grava as palavras com tempo.
// Uso: node scripts/transcrever.mjs <audio.(mp3|wav)> <saida.json>
// Na primeira vez, instala o whisper.cpp em ./whisper.cpp e baixa o modelo (fora do git).
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) {
  console.error("Uso: node scripts/transcrever.mjs <audio> <saida.json>");
  process.exit(1);
}
if (!existsSync(entrada)) {
  console.error(`Áudio não encontrado: ${entrada}`);
  process.exit(1);
}

const VERSAO = "1.5.5";
const MODELO = process.env.WHISPER_MODELO ?? "small";
const pasta = path.resolve("whisper.cpp");

await installWhisperCpp({ to: pasta, version: VERSAO, printOutput: false });
await downloadWhisperModel({ model: MODELO, folder: pasta, printOutput: false });

// O whisper.cpp só aceita WAV 16 kHz mono.
const tmp = mkdtempSync(path.join(tmpdir(), "esehein-"));
const wav = path.join(tmp, "voz-16k.wav");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", entrada, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav]);

const t0 = Date.now();
const resultado = await transcribe({
  inputPath: wav,
  whisperPath: pasta,
  whisperCppVersion: VERSAO,
  model: MODELO,
  tokenLevelTimestamps: true,
  language: "pt",
  splitOnWord: true,
});
const { captions } = toCaptions({ whisperCppOutput: resultado });
writeFileSync(saida, JSON.stringify({ modelo: MODELO, palavras: captions }, null, 2) + "\n");
console.log(`${captions.length} palavras em ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${saida}`);
