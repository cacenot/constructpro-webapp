import { expect, test } from '../fixtures'

test.describe('Vendas — Detalhe e Aprovação', () => {
  test('exibe o detalhe da proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/1')
    // formatId(1) → '#0001'
    await expect(page.getByRole('heading', { name: /Proposta/ })).toBeVisible()
  })

  test('exibe o botão Aprovar Proposta quando status é proposal', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /Proposta/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprovar Proposta' })).toBeVisible()
  })

  test('abre o dialog de aprovação ao clicar em Aprovar Proposta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /Proposta/ })).toBeVisible()
    await page.getByRole('button', { name: 'Aprovar Proposta' }).click()
    // Dialog de confirmação deve aparecer
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
