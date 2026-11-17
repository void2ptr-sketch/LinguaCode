import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    // Run tests sequentially to avoid race conditions from shared state
    // (localStorage, Angular service singletons, module caches)
    sequence: {
      concurrent: false,
    },
    include: ['**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/content-seed/**',
    ],
  },
});
