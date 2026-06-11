import { expect, test } from '../fixtures'

test.describe('Unidades — Listagem', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/unidades')
    await expect(page.getByRole('heading', { name: 'Unidades' })).toBeVisible()
    await expect(
      page.getByText('Gerencie as unidades dos seus empreendimentos e controle disponibilidade.')
    ).toBeVisible()
  })

  test('exibe o botão Nova Unidade', async ({ authenticatedPage: page }) => {
    await page.goto('/unidades')
    await expect(page.getByRole('button', { name: 'Nova Unidade' })).toBeVisible()
  })

  test('exibe os filtros de busca e empreendimento', async ({ authenticatedPage: page }) => {
    await page.goto('/unidades')
    await expect(page.getByPlaceholder('Buscar por nome...')).toBeVisible()
    // ProjectFilter (Popover+Command, trigger é um botão — overhaul #29)
    await expect(page.getByRole('button', { name: 'Empreendimento' })).toBeVisible()
  })

  test('exibe as unidades mockadas na tabela', async ({ authenticatedPage: page }) => {
    await page.goto('/unidades')
    await expect(page.getByText('Apto 101')).toBeVisible()
    await expect(page.getByText('Apto 102')).toBeVisible()
  })

  test('navega para /unidades/novo ao clicar em Nova Unidade', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/unidades')
    await page.getByRole('button', { name: 'Nova Unidade' }).click()
    await expect(page).toHaveURL('/unidades/novo')
  })
})
