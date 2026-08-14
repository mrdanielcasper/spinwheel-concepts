import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/mcp.ts', 'src/openapi.ts', 'src/**/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 80,
        lines: 80
      }
    }
  }
});
