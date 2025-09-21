import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const toPath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: {
      '@portfolioforge/schemas': toPath('../../packages/schemas/src'),
      '@portfolioforge/ui': toPath('../../packages/ui/src'),
    },
  },
});
