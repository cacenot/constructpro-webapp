import { expect, test } from '../fixtures'

test.describe('Vendas — Listagem', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas')
    await expect(page.getByRole('heading', { name: 'Vendas' })).toBeVisible()
    await expect(
      page.getByText('Acompanhe o funil de vendas e gerencie propostas, reservas e contratos.')
    ).toBeVisible()
  })

  test('exibe o botão Nova Proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas')
    await expect(page.getByRole('button', { name: 'Nova Proposta' })).toBeVisible()
  })

  test('exibe os filtros de busca', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas')
    await expect(
      page.getByPlaceholder('Buscar por cliente, unidade, empreendimento...')
    ).toBeVisible()
  })

  test('exibe o total de vendas no endLabel da tabela', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas')
    await expect(page.getByText(/Fim da lista · 3 vendas/)).toBeVisible()
  })

  test('navega para /vendas/novo ao clicar em Nova Proposta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas')
    await page.getByRole('button', { name: 'Nova Proposta' }).click()
    await expect(page).toHaveURL('/vendas/novo')
  })
})
