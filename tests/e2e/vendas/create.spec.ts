import { expect, test } from '../fixtures'

test.describe('Vendas — Criação', () => {
  test('exibe o formulário de nova proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/novo')
    await expect(page.getByRole('heading', { name: 'Nova proposta' })).toBeVisible()
    // Seções do workbench v2 (PR #33)
    await expect(page.getByText('Unidade e cliente')).toBeVisible()
    await expect(page.getByText('Plano de pagamento')).toBeVisible()
  })

  test('exibe o resumo da proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/novo')
    await expect(page.getByRole('heading', { name: 'Resumo' })).toBeVisible()
  })
})
