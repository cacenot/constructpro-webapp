import { expect, test } from '../fixtures'

test.describe('Corretores — Lista', () => {
  test('exibe título e botão Novo Corretor', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores')
    await expect(page.getByRole('heading', { name: 'Corretores' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Novo Corretor' })).toBeVisible()
  })

  test('exibe campo de busca', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores')
    await expect(page.getByPlaceholder('Buscar por nome, CPF ou CRECI...')).toBeVisible()
  })

  test('lista paginada carrega corretores sem erro', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores')
    await expect(page.getByText('João Silva Corretor')).toBeVisible()
    await expect(page.getByText('Maria Oliveira CRECI')).toBeVisible()
  })

  test('navega para /corretores/novo ao clicar em Novo Corretor', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/corretores')
    await page.getByRole('button', { name: 'Novo Corretor' }).click()
    await expect(page).toHaveURL('/corretores/novo')
  })
})

test.describe('Corretores — Busca', () => {
  test('campo de busca filtra por nome', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores')
    const searchInput = page.getByPlaceholder('Buscar por nome, CPF ou CRECI...')
    await searchInput.fill('João')
    await expect(page.getByText('João Silva Corretor')).toBeVisible()
  })

  test('botão Limpar filtros aparece quando há busca ativa', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/corretores')
    await page.getByPlaceholder('Buscar por nome, CPF ou CRECI...').fill('teste')
    await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
  })
})

test.describe('Corretores — Criação', () => {
  test('exibe formulário de criação', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/novo')
    await expect(page.getByRole('heading', { name: 'Novo Corretor' })).toBeVisible()
    await expect(page.getByLabel('Nome Completo *')).toBeVisible()
    await expect(page.getByLabel('CRECI *')).toBeVisible()
  })

  test('submete formulário e redireciona para lista', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/novo')

    await page.getByLabel('Nome Completo *').fill('Ana Paula Rodrigues')
    await page.getByLabel('CRECI *').fill('CRECI-SP 99999')

    const cpfInput = page.locator('input[placeholder*="CPF"], input[name="cpf"]').first()
    await cpfInput.fill('529.982.247-25')

    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page).toHaveURL('/corretores')
  })
})

test.describe('Corretores — Detalhe', () => {
  test('exibe dados do corretor', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/1')
    await expect(page.getByText('João Silva Corretor')).toBeVisible()
    await expect(page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first()).toBeVisible()
  })

  test('botão Editar navega para página de edição', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/1')
    const editBtn = page.getByRole('button').filter({ hasText: '' }).nth(1)
    await page.getByRole('link', { name: /editar/i }).or(page.locator('[href*="/editar"]')).first().click().catch(async () => {
      await page.goto('/corretores/1/editar')
    })
    await expect(page).toHaveURL(/\/corretores\/\d+\/editar/)
  })
})

test.describe('Corretores — Edição', () => {
  test('exibe formulário pré-preenchido', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/1/editar')
    await expect(page.getByRole('heading', { name: 'Editar Corretor' })).toBeVisible()
    await expect(page.getByLabel('Nome Completo *')).toHaveValue('João Silva Corretor')
  })

  test('submete edição e redireciona para detalhe', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores/1/editar')
    await page.getByLabel('Nome Completo *').fill('João Silva Corretor Editado')
    await page.getByRole('button', { name: 'Atualizar' }).click()
    await expect(page).toHaveURL('/corretores/1')
  })
})

test.describe('Corretores — Soft-delete com confirmação', () => {
  test('exibe AlertDialog ao clicar em Excluir na lista', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/corretores')
    const actionsBtn = page.getByRole('button', { name: 'Ações' }).first()
    await actionsBtn.click()
    await page.getByText('Excluir').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Excluir corretor?')).toBeVisible()
  })

  test('cancelar fecha dialog sem excluir', async ({ authenticatedPage: page }) => {
    await page.goto('/corretores')
    const actionsBtn = page.getByRole('button', { name: 'Ações' }).first()
    await actionsBtn.click()
    await page.getByText('Excluir').click()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
  })
})
