import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/*.d.ts',
        'src/migrate.ts', // Executable script, not a library
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 8, // Schema definition files don't have executable functions, only metadata
        lines: 95,
      },
    },
  },
});
