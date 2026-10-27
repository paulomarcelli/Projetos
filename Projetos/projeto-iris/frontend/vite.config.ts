import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Em desenvolvimento, as chamadas à API passam pelo proxy do Vite: a interface e a API ficam
// na mesma origem e o backend não precisa de CORS. API_URL muda o destino (padrão: uvicorn local).
const API = process.env.API_URL ?? "http://127.0.0.1:8000";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // A prévia estática é servida de uma subpasta qualquer: caminhos relativos e pasta própria.
  base: mode === "previa" ? "./" : "/",
  build: { outDir: mode === "previa" ? "dist-previa" : "dist" },
  server: {
    port: 5173,
    proxy: {
      "^/documents(/|$|\\?)": { target: API, changeOrigin: true },
      "^/health(/|$)": { target: API, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
