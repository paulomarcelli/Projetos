// Monta uma chamada por etapa: todo o código-fonte + o driver, compactado com
// tree-shaking (só entra o que o driver usa). Saída em calls/out/*.js.
import { build } from "esbuild";
import fs from "fs";
const src = fs.readdirSync("src").filter((f) => f.endsWith(".ts") && !f.startsWith("90-")).sort().map((f) => fs.readFileSync(`src/${f}`, "utf8")).join("\n");
fs.mkdirSync("calls/out", { recursive: true });
for (const d of fs.readdirSync("calls").filter((f) => /^k\d+\.ts$/.test(f)).sort()) {
  const entry = `calls/out/_${d}`;
  fs.writeFileSync(entry, src + "\n" + fs.readFileSync(`calls/${d}`, "utf8"));
  const r = await build({ entryPoints: [entry], bundle: true, format: "esm", minify: true, treeShaking: true, target: "es2017", write: false, logLevel: "error" });
  const code = r.outputFiles[0].text + "\nreturn await globalThis.__run();\n";
  fs.writeFileSync(`calls/out/${d.replace(".ts", ".js")}`, code);
  fs.unlinkSync(entry);
  console.log(d, code.length, code.length > 49000 ? "ACIMA DO LIMITE" : "ok");
}
