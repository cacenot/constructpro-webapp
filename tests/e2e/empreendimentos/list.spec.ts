import { expect, test } from '../fixtures'

test.describe('Empreendimentos — Listagem', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos')
    await expect(page.getByRole('heading', { name: 'Empreendimentos' })).toBeVisible()
    await expect(
      page.getByText('Gerencie seus projetos imobiliários e acompanhe o progresso.')
    ).toBeVisible()
  })

  test('exibe o botão Novo Empreendimento', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos')
    await expect(page.getByRole('button', { name: 'Novo Empreendimento' })).toBeVisible()
  })

  test('exibe o campo de busca', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos')
    await expect(
      page.getByPlaceholder('Buscar por nome, localização...')
    ).toBeVisible()
  })

  test('exibe os empreendimentos mockados como cards', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos')
    await expect(page.getByText('Residencial Ipiranga')).toBeVisible()
    await expect(page.getByText('Tower Park')).toBeVisible()
  })

  test('navega para /empreendimentos/novo ao clicar em Novo Empreendimento', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/empreendimentos')
    await page.getByRole('button', { name: 'Novo Empreendimento' }).click()
    await expect(page).toHaveURL('/empreendimentos/novo')
  })
})
