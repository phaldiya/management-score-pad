import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        include: ['src/lib/**', 'src/context/**'],
      },
    },
  }),
);
