import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      include: ['src/lib/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
})
