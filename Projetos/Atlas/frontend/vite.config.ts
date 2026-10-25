/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const API = process.env.ATLAS_API ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": { target: API, changeOrigin: true } } },
  preview: { port: 4173, proxy: { "/api": { target: API, changeOrigin: true } } },
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: "jsdom", setupFiles: ["./src/teste/setup.ts"], globals: true, css: false },
});
