import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/schemas/**', 'src/hooks/**', 'src/components/**'],
      exclude: ['src/components/ui/**'],
      reporter: ['text'],
    },
    server: {
      deps: {
        inline: ['@cacenot/construct-pro-api-client'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
