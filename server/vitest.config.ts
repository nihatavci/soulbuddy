import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Disable CSS processing so Vite doesn't walk up to the monorepo root's
  // postcss.config.mjs (which requires autoprefixer not installed here).
  css: {
    postcss: {},
  },
  test: {
    environment: 'node',
  },
});
