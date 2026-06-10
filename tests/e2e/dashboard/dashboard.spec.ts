import { expect, test } from '../fixtures'

test.describe('Dashboard — Início', () => {
  test('exibe o hero com os 5 vitais da carteira', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Carteira a receber')).toBeVisible()
    await expect(page.getByText('Inadimplência')).toBeVisible()
    await expect(page.getByText('Recebido no mês')).toBeVisible()
    await expect(page.getByText('A receber no mês')).toBeVisible()
    await expect(page.getByText('Contratos ativos')).toBeVisible()
    // Inadimplência calculada: 13.491.000 / 53.991.000 ≈ 24,98% → formatPercent(1 casa) → '25%'
    await expect(page.getByText('25%')).toBeVisible()
  })

  test('exibe a seção financeiro com aging e maiores atrasos', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Parcelas vencidas')).toBeVisible()
    await expect(page.getByText('1-30 dias')).toBeVisible()
    await expect(page.getByText('90+ dias')).toBeVisible()
    await expect(page.getByText('Maiores atrasos')).toBeVisible()
    await expect(page.getByText('João Silva')).toBeVisible()
    await expect(page.getByText('Recebimento', { exact: true })).toBeVisible()
  })

  test('faixa de aging deep-linka o financeiro filtrado', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /1-30 dias/ }).click()
    await expect(page).toHaveURL(/\/financeiro\?.*duePreset=custom/)
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
  })
})
