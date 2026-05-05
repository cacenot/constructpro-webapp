import { expect, test } from '../fixtures'

test.describe('Clientes — Listagem', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
    await expect(page.getByText('Gerencie sua base de clientes e contatos.')).toBeVisible()
  })

  test('exibe o botão Novo Cliente', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    await expect(page.getByRole('button', { name: 'Novo Cliente' })).toBeVisible()
  })

  test('exibe os filtros de busca e tipo', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    await expect(
      page.getByPlaceholder('Buscar por nome, e-mail ou documento...')
    ).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('exibe os clientes mockados na tabela', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    await expect(page.getByText('Maria das Dores')).toBeVisible()
    await expect(page.getByText('João Silva')).toBeVisible()
  })

  test('exibe o total de clientes no cabeçalho do card', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    // Aguarda os dados carregarem (substituindo 'Carregando...')
    await expect(page.getByText('2 clientes')).toBeVisible()
  })

  test('exibe as colunas da tabela', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes')
    // Aguarda os dados carregarem antes de verificar colunas
    await expect(page.getByText('2 clientes')).toBeVisible()
    await expect(page.getByRole('button', { name: /^ID/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Nome/ })).toBeVisible()
  })

  test('navega para /clientes/novo ao clicar em Novo Cliente', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes')
    await page.getByRole('button', { name: 'Novo Cliente' }).click()
    await expect(page).toHaveURL('/clientes/novo')
  })
})
