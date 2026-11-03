import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Em desenvolvimento, a interface chama /api/... e o Vite repassa para a API da F.R.E.Y.A.
// (mesma origem, sem CORS). FREYA_API_URL muda o destino; o padrão é o uvicorn local.
const API = process.env.FREYA_API_URL ?? "http://127.0.0.1:8000";
const servicosDaPrevia = fileURLToPath(new URL("./src/previa/servicos.ts", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Prévia estática (`npm run build:previa`): mesma interface, serviços lendo respostas reais capturadas,
  // tudo num pacote só (vira um único HTML em dist-previa/).
  ...(mode === "previa" && {
    resolve: { alias: [{ find: /^(\.\.\/)+services$/, replacement: servicosDaPrevia }] },
    build: { outDir: "dist-previa", assetsInlineLimit: 100_000_000, cssCodeSplit: false,
      rollupOptions: { input: "previa.html", output: { inlineDynamicImports: true } } },
  }),
  server: {
    port: 5173,
    proxy: { "/api": { target: API, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") } },
  },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"], css: false },
}));
