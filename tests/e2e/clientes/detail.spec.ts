import { expect, test } from '../fixtures'

test.describe('Clientes — Detalhe', () => {
  test('exibe o nome do cliente no hero header', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes/1')
    await expect(page.getByText('Maria das Dores')).toBeVisible()
  })

  test('exibe as abas de navegação', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes/1')
    await expect(page.getByText('Maria das Dores')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Visão Geral' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Contratos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Pagamentos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Boletos' })).toBeVisible()
  })

  test('aba Visão Geral está selecionada por padrão', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes/1')
    await expect(page.getByText('Maria das Dores')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Visão Geral' })).toHaveAttribute(
      'data-state',
      'active'
    )
  })

  test('navega entre as abas sem erro', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes/1')
    await expect(page.getByText('Maria das Dores')).toBeVisible()

    await page.getByRole('tab', { name: 'Contratos' }).click()
    await expect(page.getByRole('tab', { name: 'Contratos' })).toHaveAttribute(
      'data-state',
      'active'
    )

    await page.getByRole('tab', { name: 'Pagamentos' }).click()
    await expect(page.getByRole('tab', { name: 'Pagamentos' })).toHaveAttribute(
      'data-state',
      'active'
    )
  })
})
