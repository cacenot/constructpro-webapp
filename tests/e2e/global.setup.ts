import * as fs from 'node:fs'
import * as path from 'node:path'
import { test as setup } from '@playwright/test'
import { config } from 'dotenv'

config()

const AUTH_FILE = '.playwright/auth-state.json'

/**
 * Global Setup — executa UMA VEZ antes de todos os testes.
 *
 * Faz login real no Firebase e salva o estado de autenticação (localStorage)
 * em `.playwright/auth-state.json`. Os demais testes reutilizam este estado
 * via `storageState` no playwright.config.ts, eliminando logins repetidos
 * (e o throttling do Firebase com múltiplos workers).
 *
 * Requer:
 *   - App rodando em http://localhost:3001 (gerenciado pelo webServer do playwright.config.ts)
 *   - VITE_FIREBASE_PERSISTENCE=local (setado em playwright.config.ts → Firebase usa localStorage)
 *   - E2E_TEST_EMAIL e E2E_TEST_PASSWORD no .env
 */
setup('autenticar usuário E2E', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL e E2E_TEST_PASSWORD devem estar definidos no .env para os testes E2E',
    )
  }

  await page.goto('/login', { waitUntil: 'load' })
  await page.locator('input[type="text"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Aguarda redirect para /dashboard (Firebase armazena tokens em localStorage antes disso)
  await page.waitForURL('**/dashboard', { timeout: 30_000 })

  // Salva storageState (inclui localStorage com os tokens Firebase)
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: AUTH_FILE })
})
