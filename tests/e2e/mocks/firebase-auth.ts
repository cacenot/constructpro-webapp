import type { Page } from '@playwright/test'

/**
 * Credenciais do usuário de teste real no Firebase.
 * Lidas do .env via dotenv (carregado em playwright.config.ts).
 */
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

/**
 * Autentica via Firebase real (sem mocks de rede) e aguarda o redirect
 * para o dashboard. As chamadas para a API do backend (/api/v1/...)
 * continuam sendo interceptadas pelos handlers de cada módulo.
 *
 * Fluxo:
 * 1. Navega para /login
 * 2. Preenche credenciais reais e clica em Entrar
 * 3. Firebase SDK autentica de verdade e persiste o estado
 * 4. AuthGuard detecta user → redireciona para /dashboard
 * 5. Fixture aguarda o redirect antes de ceder o controle ao teste
 */
export async function mockFirebaseAuth(page: Page): Promise<void> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      'E2E_TEST_EMAIL e E2E_TEST_PASSWORD devem estar definidos no .env para os testes E2E.'
    )
  }

  await page.goto('/login', { waitUntil: 'load' })

  // Campo email usa type="text" + inputMode="email" (corrigido no login page)
  await page.locator('input[type="text"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Aguarda o redirect pós-login (AuthGuard navega para /dashboard)
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}
