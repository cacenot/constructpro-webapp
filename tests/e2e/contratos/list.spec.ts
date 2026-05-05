import { expect, test } from '../fixtures'

test.describe('Contratos — Listagem', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/contratos')
    await expect(page.getByRole('heading', { name: 'Contratos' })).toBeVisible()
    await expect(
      page.getByText('Gerencie contratos de financiamento e acompanhe o ciclo de vida dos contratos.')
    ).toBeVisible()
  })

  test('exibe o botão Novo Contrato', async ({ authenticatedPage: page }) => {
    await page.goto('/contratos')
    await expect(page.getByRole('button', { name: 'Novo Contrato' })).toBeVisible()
  })

  test('exibe o campo de busca de contratos', async ({ authenticatedPage: page }) => {
    await page.goto('/contratos')
    await expect(page.getByPlaceholder('Buscar por cliente, venda...')).toBeVisible()
  })

  test('exibe os filtros de status e índice', async ({ authenticatedPage: page }) => {
    await page.goto('/contratos')
    await expect(page.getByRole('combobox').filter({ hasText: /Status/i }).or(
      page.locator('[placeholder="Status"]')
    ).first()).toBeVisible()
  })
})
