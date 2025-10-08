import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './reports/coverage',
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
      exclude: [
        'node_modules',
        'test',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './packages/core/src'),
      '@ai': path.resolve(__dirname, './packages/ai/src'),
      '@ui': path.resolve(__dirname, './packages/ui/src'),
    },
  },
});
