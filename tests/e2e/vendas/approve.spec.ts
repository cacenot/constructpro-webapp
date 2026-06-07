import { expect, test } from '../fixtures'

test.describe('Vendas — Detalhe e Aprovação', () => {
  test('exibe o detalhe da proposta', async ({ authenticatedPage: page }) => {
    await page.goto('/vendas/1')
    // Deal console: o h1 do cockpit é o ID da venda (formatId(1) → '#00001').
    await expect(page.getByRole('heading', { name: /#0*1/ })).toBeVisible()
  })

  test('exibe o botão Aprovar proposta quando status é proposal', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /#0*1/ })).toBeVisible()
    // Ação primária do deal console (o kbd "A" pode compor o nome acessível em ≥lg).
    await expect(page.getByRole('button', { name: /aprovar proposta/i })).toBeVisible()
  })

  test('abre o dialog de aprovação ao clicar em Aprovar proposta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /#0*1/ })).toBeVisible()
    await page.getByRole('button', { name: /aprovar proposta/i }).click()
    // Dialog de confirmação deve aparecer
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
