import { config } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

config() // carrega .env para process.env

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Aumenta timeout padrão para assertions (auth+tenant podem levar 3-6s ao inicializar)
  expect: { timeout: 10_000 },
  projects: [
    {
      // Projeto de setup: faz login uma vez e salva o auth state
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },
    {
      // Projeto principal: todos os testes reutilizam o auth state salvo
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/auth-state.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      // Firebase usa localStorage (não IndexedDB) p/ o storageState do Playwright
      // capturar os tokens de auth. Sem isto, todo spec cai em /login.
      VITE_FIREBASE_PERSISTENCE: 'local',
    },
  },
})
