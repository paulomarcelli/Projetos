// Gera videos/<tema>.json a partir do MP3 da Maia e do roteiro exato.
//
// Uso:
//   node scripts/preparar.mjs <tema> <voz.mp3> <roteiro.txt> [--titulo "..."] [--pergunta "..."] [--retranscrever]
//
// Passos: normaliza a voz (-14 LUFS) -> transcreve (whisper.cpp local) -> mede as pausas
// -> alinha com o roteiro -> monta os trechos -> grava o JSON (mantendo as cenas já escolhidas).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ajustarAoSilencio, alinhar, extrairPalavras, montarTrechos } from "./lib/alinhar.mjs";

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  if (i === -1) return undefined;
  const valor = args[i + 1];
  args.splice(i, 2);
  return valor;
};
const retranscrever = args.includes("--retranscrever");
if (retranscrever) args.splice(args.indexOf("--retranscrever"), 1);
const tituloOpcao = opcao("--titulo");
const perguntaOpcao = opcao("--pergunta");
const [tema, mp3, arquivoRoteiro] = args;

const falhar = (msg) => {
  console.error(msg);
  process.exit(1);
};
if (!tema || !mp3 || !arquivoRoteiro) {
  falhar('Uso: node scripts/preparar.mjs <tema> <voz.mp3> <roteiro.txt> [--titulo "..."] [--pergunta "..."]');
}
if (!/^[a-z0-9-]+$/.test(tema)) falhar("O tema só pode ter letras minúsculas, números e hífen (ex.: lua, buraco-negro).");
if (!existsSync(mp3)) falhar(`Áudio não encontrado: ${mp3}`);
if (!existsSync(arquivoRoteiro)) falhar(`Roteiro não encontrado: ${arquivoRoteiro}`);

const roteiro = readFileSync(arquivoRoteiro, "utf8").trim();
const palavrasRoteiro = extrairPalavras(roteiro);
if (palavrasRoteiro.length === 0) falhar("O roteiro está vazio.");

const node = process.execPath;
// fileURLToPath: no Windows, URL.pathname vira "/C:/..." e o caminho quebra.
const aqui = path.dirname(fileURLToPath(import.meta.url));

// 1. Voz normalizada (cópia em public/, o original fica intacto).
const audioRel = `audio/${tema}.wav`;
const audioAbs = path.resolve("public", audioRel);
execFileSync(node, [path.join(aqui, "normalizar.mjs"), mp3, audioAbs], { stdio: "inherit" });

// 2. Transcrição (guardada em .cache/ para não repetir).
mkdirSync(".cache", { recursive: true });
const cache = path.resolve(".cache", `${tema}.whisper.json`);
if (retranscrever || !existsSync(cache)) {
  execFileSync(node, [path.join(aqui, "transcrever.mjs"), mp3, cache], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
}
const { palavras: whisper } = JSON.parse(readFileSync(cache, "utf8"));

// 3. Pausas reais do áudio.
const sd = spawnSync("ffmpeg", ["-hide_banner", "-i", audioAbs, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], { encoding: "utf8" });
const silencios = [];
for (const m of sd.stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
  silencios.push({ inicioMs: Math.round(Number(m[1]) * 1000), fimMs: Math.round(Number(m[2]) * 1000) });
}
const duracaoAudio = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioAbs], { encoding: "utf8" }).trim(),
);

// 4. Alinhamento e trechos.
const palavras = ajustarAoSilencio(alinhar(palavrasRoteiro, whisper), silencios);
const trechosNovos = montarTrechos(palavras);

const destino = path.resolve("videos", `${tema}.json`);
const anterior = existsSync(destino) ? JSON.parse(readFileSync(destino, "utf8")) : null;
const trechos = trechosNovos.map((t, i) => {
  const velho = anterior?.trechos?.[i];
  return { ...t, cena: velho?.cena ?? "provisoria", ...(velho?.destaque ? { destaque: velho.destaque } : {}) };
});

const frases = roteiro.replace(/\[[^\]]*\]/g, "").split(/(?<=[?.!])\s+/).map((f) => f.trim());
const dados = {
  titulo: tituloOpcao ?? anterior?.titulo ?? frases[0],
  audio: audioRel,
  duracaoAudio: Math.round(duracaoAudio * 1000) / 1000,
  roteiro,
  pergunta: perguntaOpcao ?? anterior?.pergunta ?? frases.filter((f) => f.endsWith("?")).pop() ?? "",
  trechos,
  palavras,
};

// Grava num temporário e renomeia: se o processo cair no meio, o arquivo antigo continua inteiro.
mkdirSync(path.dirname(destino), { recursive: true });
writeFileSync(destino + ".tmp", JSON.stringify(dados, null, 2) + "\n");
renameSync(destino + ".tmp", destino);

const casadas = palavras.filter((p) => p.casou).length;
console.log(`\n${palavras.length} palavras do roteiro, ${casadas} com tempo direto da transcrição (${Math.round((100 * casadas) / palavras.length)} %).`);
console.log("Mapa de tempo:");
for (const t of trechos) console.log(`  ${t.inicio.toFixed(2).padStart(6)} – ${t.fim.toFixed(2).padStart(6)} s  [${t.cena}]  ${t.texto.slice(0, 60)}`);
console.log(`-> ${path.relative(process.cwd(), destino)}`);
