import { expect, test } from '../fixtures'

test.describe('Financeiro — Parcelas', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
    await expect(
      page.getByText('Acompanhe parcelas, recebimentos e vencimentos.')
    ).toBeVisible()
  })

  test('exibe os cards de resumo financeiro', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    await expect(page.getByText('Total Emitido')).toBeVisible()
    await expect(page.getByText('Recebido')).toBeVisible()
    await expect(page.getByText('Em Atraso')).toBeVisible()
    await expect(page.getByText('A Receber')).toBeVisible()
  })

  test('exibe os filtros de vencimento e status', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    await expect(page.getByRole('button', { name: /Vencimento/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Status/ })).toBeVisible()
  })

  test('exibe as colunas da tabela de parcelas', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    await expect(page.getByRole('columnheader', { name: 'Contrato' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Vencimento' })).toBeVisible()
  })
})
