/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O servidor (Agente 4) roda em http://localhost:3000. Em desenvolvimento,
// o Vite repassa o Socket.IO para lá; em produção o próprio Express serve o build.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true },
    },
  },
  build: { target: 'es2020', sourcemap: false },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    globals: false,
  },
});
