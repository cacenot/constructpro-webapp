import { expect, test } from '../fixtures'

/**
 * Regressão: bump @cacenot/construct-pro-api-client 0.18.0 → 1.0.0
 *
 * Verifica que nenhuma rota existente quebrou após os breaking changes da API.
 * Cobre: ausência de erros de console, tabelas visíveis, sem erro 500 ou de tipo.
 */

test.describe('Regressão — bump API client 1.0.0', () => {
  test('cenário 1: navega / sem erros de console', async ({ authenticatedPage: page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    // Aguarda render inicial
    await page.waitForLoadState('networkidle')

    // Filtra erros conhecidos/esperados do ambiente de teste
    const unexpectedErrors = consoleErrors.filter(
      (e) =>
        !e.includes('ERR_BLOCKED_BY_CLIENT') &&
        !e.includes('net::ERR_') &&
        !e.includes('favicon'),
    )
    expect(unexpectedErrors).toHaveLength(0)
  })

  test('cenário 2: navega /clientes — tabela visível', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    // Tabela renderizada sem crash de tipo
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('cenário 3: navega /empreendimentos — sem erro 500', async ({
    authenticatedPage: page,
  }) => {
    const responses: number[] = []
    page.on('response', (res) => {
      if (res.url().includes('/api/') || res.url().includes('/projects')) {
        responses.push(res.status())
      }
    })

    await page.goto('/empreendimentos')
    await page.waitForLoadState('networkidle')

    const serverErrors = responses.filter((s) => s >= 500)
    expect(serverErrors).toHaveLength(0)

    // Página renderizou sem crash — heading ou conteúdo presente
    await expect(page.locator('body')).toBeVisible()
  })

  test('cenário 4: navega /vendas — sem erro de tipo', async ({ authenticatedPage: page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/vendas')
    await page.waitForLoadState('networkidle')

    // Sem TypeError de campos removidos (monthly/yearly kinds)
    const typeErrors = consoleErrors.filter((e) => e.toLowerCase().includes('typeerror'))
    expect(typeErrors).toHaveLength(0)

    // Tabela de vendas visível
    await expect(page.getByRole('table')).toBeVisible()
  })
})
