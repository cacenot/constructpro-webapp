import { expect, test } from '../fixtures'

test.describe('Empreendimentos — Criação', () => {
  test('exibe o formulário de novo empreendimento', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos/novo')
    await expect(page.getByRole('heading', { name: 'Novo Empreendimento' })).toBeVisible()
    await expect(page.getByText('Informações Básicas')).toBeVisible()
    await expect(page.getByText('Localização')).toBeVisible()
  })

  test('exibe os campos obrigatórios', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos/novo')
    await expect(page.getByLabel('Nome do Empreendimento *')).toBeVisible()
    await expect(page.getByLabel('CEP *')).toBeVisible()
    await expect(page.getByLabel('Cidade *')).toBeVisible()
  })

  test('mostra erros ao submeter formulário vazio', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos/novo')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.getByText(/nome é obrigatório/i).first()).toBeVisible()
  })

  test('cria empreendimento e redireciona para /empreendimentos', async ({
    authenticatedPage: page,
  }) => {
    // Mock BrasilAPI CEP — Cidade e UF são readonly, preenchidos pelo auto-fetch
    await page.route('https://brasilapi.com.br/api/cep/v2/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '01310100',
          state: 'SP',
          city: 'São Paulo',
          neighborhood: 'Bela Vista',
          street: 'Avenida Paulista',
        }),
      })
    })

    await page.goto('/empreendimentos/novo')

    await page.getByLabel('Nome do Empreendimento *').fill('Residencial Teste')

    // Status (Select)
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Em Construção' }).click()

    // Preenche CEP — auto-fill populará Cidade, UF, Logradouro, Bairro
    await page.getByLabel('CEP *').fill('01310100')
    // Aguarda cidade ser preenchida automaticamente
    await expect(page.locator('input[name="city"]')).not.toHaveValue('')

    // Número (único campo de endereço que não vem do CEP)
    await page.getByLabel('Número *').fill('1000')

    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page).toHaveURL('/empreendimentos')
    await expect(page.getByText('Empreendimento cadastrado com sucesso!')).toBeVisible()
  })

  test('botão Cancelar retorna para /empreendimentos', async ({ authenticatedPage: page }) => {
    await page.goto('/empreendimentos/novo')
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page).toHaveURL('/empreendimentos')
  })
})
