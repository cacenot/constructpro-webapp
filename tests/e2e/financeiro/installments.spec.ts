import { expect, test } from '../fixtures'

test.describe('Financeiro — Parcelas', () => {
  test('exibe o título da página', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
  })

  test('exibe os filtros de vencimento e status', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    // DateRangeFilter "Vencimento" e MultiSelectFilter "Status" ficam na barra de filtros.
    // Uso de .first() pois "Vencimento" pode aparecer também como cabeçalho de coluna.
    await expect(page.getByRole('button', { name: /Vencimento/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Status/ }).first()).toBeVisible()
  })

  test('exibe as colunas da tabela de parcelas', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    // Colunas reais do redesign: Cliente, Unidade, Valor, Vencimento, Status.
    // "Contrato" não existe mais — a tabela usa InstallmentSummaryItemResponse.
    await expect(page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('exibe itens na tabela com dados do mock', async ({ authenticatedPage: page }) => {
    await page.goto('/financeiro')
    // O mock de summary (branch base) retorna 2 summaryItem não-overdue.
    await expect(page.getByRole('row').nth(1)).toBeVisible()
  })
})
