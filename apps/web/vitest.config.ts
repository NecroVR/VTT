import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        // Disable CSS generation for tests
        css: 'injected',
      },
    }),
    svelteTesting(),
  ],
  resolve: {
    alias: {
      '$app/environment': new URL('./src/test/mocks/$app/environment.ts', import.meta.url).pathname,
      '$app/navigation': new URL('./src/test/mocks/$app/navigation.ts', import.meta.url).pathname,
      '$app/stores': new URL('./src/test/mocks/$app/stores.ts', import.meta.url).pathname,
      '$lib': new URL('./src/lib', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.{test,spec}.{ts,svelte}', 'src/lib/**/*.{test,spec}.{ts,svelte}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,svelte}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,svelte}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/app.html',
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
