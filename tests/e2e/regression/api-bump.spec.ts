import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'

/**
 * Regressão: bump @cacenot/construct-pro-api-client 0.18.0 → 1.0.0
 *
 * Verifica que nenhuma rota existente quebrou após os breaking changes da API.
 * Cobre: ausência de TypeErrors de tipos removidos (monthly/yearly kinds), sem crash de render,
 * sem erro 500. Testes resilientes ao estado de autenticação — checam regressões de tipo,
 * não visibilidade de conteúdo autenticado.
 *
 * Para verificar tabelas com dados reais, executar com setup de auth:
 *   npx playwright test --project=setup && npx playwright test tests/e2e/regression/api-bump.spec.ts
 */

/**
 * Coleta erros de console, excluindo ruído esperado em ambiente de teste.
 */
function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (
      text.includes('ERR_BLOCKED_BY_CLIENT') ||
      text.includes('net::ERR_') ||
      text.includes('favicon') ||
      text.includes('CORS') ||
      text.includes('Access-Control-Allow-Origin') ||
      text.includes('api.costara.app')
    )
      return
    errors.push(text)
  })
  return errors
}

test.describe('Regressão — bump API client 1.0.0', () => {
  test('cenário 1: navega / sem TypeErrors de console', async ({ authenticatedPage: page }) => {
    const errors = collectConsoleErrors(page)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const typeErrors = errors.filter((e) => e.toLowerCase().includes('typeerror'))
    expect(typeErrors).toHaveLength(0)
  })

  test('cenário 2: navega /clientes — sem TypeError de tipo removido', async ({
    authenticatedPage: page,
  }) => {
    const errors = collectConsoleErrors(page)

    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')

    // Sem TypeError de campos removidos (monthly/yearly kinds, amount_cents→amount)
    const typeErrors = errors.filter((e) => e.toLowerCase().includes('typeerror'))
    expect(typeErrors).toHaveLength(0)

    // Página renderizou algo (login redirect ou tabela — não ficou em branco por crash)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('cenário 3: navega /empreendimentos — sem erro 500', async ({
    authenticatedPage: page,
  }) => {
    const serverErrors: number[] = []
    page.on('response', (res) => {
      if (res.url().includes('/api/')) serverErrors.push(res.status())
    })

    await page.goto('/empreendimentos')
    await page.waitForLoadState('networkidle')

    expect(serverErrors.filter((s) => s >= 500)).toHaveLength(0)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('cenário 4: navega /vendas — sem TypeError de tipo removido', async ({
    authenticatedPage: page,
  }) => {
    const errors = collectConsoleErrors(page)

    await page.goto('/vendas')
    await page.waitForLoadState('networkidle')

    // Sem TypeError de campos removidos (monthly/yearly kinds, InstallmentKind incompatível)
    const typeErrors = errors.filter((e) => e.toLowerCase().includes('typeerror'))
    expect(typeErrors).toHaveLength(0)

    await expect(page.locator('body')).not.toBeEmpty()
  })
})
