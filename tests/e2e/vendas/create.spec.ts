import { expect, test } from '../fixtures'

test.describe('Vendas — Criação', () => {
  test('exibe o formulário de nova proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/novo')
    await expect(page.getByRole('heading', { name: 'Nova Proposta' })).toBeVisible()
    await expect(page.getByText('Dados da Venda')).toBeVisible()
    await expect(page.getByText('Pagamento', { exact: true }).first()).toBeVisible()
  })

  test('exibe o card de Resumo Financeiro', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/novo')
    await expect(page.getByText('Resumo Financeiro')).toBeVisible()
  })
})
