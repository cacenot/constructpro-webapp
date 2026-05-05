import { expect, test } from '../fixtures'

test.describe('Clientes — Criação', () => {
  test('exibe a seleção de tipo de pessoa', async ({ authenticatedPage: page }) => {
    await page.goto('/clientes/novo')
    await expect(page.getByRole('heading', { name: 'Novo Cliente' })).toBeVisible()
    await expect(page.getByText('Pessoa Física')).toBeVisible()
    await expect(page.getByText('Pessoa Jurídica')).toBeVisible()
  })

  test('exibe o formulário PF ao selecionar Pessoa Física', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes/novo')
    await page.getByText('Pessoa Física').click()

    await expect(page.getByLabel('Nome completo')).toBeVisible()
    await expect(page.getByLabel('CPF')).toBeVisible()
  })

  test('exibe o formulário PJ ao selecionar Pessoa Jurídica', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes/novo')
    await page.getByText('Pessoa Jurídica').click()

    await expect(page.getByLabel('Razão Social')).toBeVisible()
    await expect(page.getByLabel('CNPJ')).toBeVisible()
  })

  test('mostra erros de validação ao submeter formulário PF vazio', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes/novo')
    await page.getByText('Pessoa Física').click()
    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page.getByText(/nome completo é obrigatório/i).first()).toBeVisible()
  })

  test('cria cliente PF e redireciona para /clientes', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes/novo')
    await page.getByText('Pessoa Física').click()

    await page.getByLabel('Nome completo').fill('Novo Cliente Teste')
    await page.getByLabel('CPF').fill('529.982.247-25')
    await page.locator('input[type="tel"]').fill('11999998888')
    // Preenche e-mail diretamente pelo name para evitar ambiguidade de seletores
    await page.locator('input[name="email"]').fill('novo@teste.com')

    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page).toHaveURL('/clientes')
    await expect(page.getByText('Cliente cadastrado com sucesso!')).toBeVisible()
  })

  test('botão voltar retorna para seleção de tipo quando formulário está aberto', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/clientes/novo')
    await page.getByText('Pessoa Física').click()
    await expect(page.getByLabel('Nome completo')).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar' }).click()

    await expect(page.getByText('Pessoa Física')).toBeVisible()
    await expect(page.getByText('Pessoa Jurídica')).toBeVisible()
  })
})
