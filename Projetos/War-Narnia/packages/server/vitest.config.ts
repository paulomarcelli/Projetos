import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Testes de socket/timers ficam mais estáveis em série.
    fileParallelism: false,
    env: { LOG_LEVEL: 'silent' },
  },
});
