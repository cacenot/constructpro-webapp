// DEFERIDO como débito técnico [EPIC2-T1] — execução pendente
// Spec criada para documentar cenários planejados
import { expect, test } from '@playwright/test'

test.describe('Imobiliárias — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: autenticar antes de cada teste
    await page.goto('/imobiliarias')
  })

  test('lista paginada carrega sem erro', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Imobiliárias' })).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('busca por razão social filtra resultados', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por razão social, CNPJ ou CRECI-J...')
    await searchInput.fill('Imobiliária Teste')
    await page.waitForTimeout(400)
    await expect(page.locator('table tbody tr')).not.toHaveCount(0)
  })

  test('busca por CNPJ filtra resultados', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por razão social, CNPJ ou CRECI-J...')
    await searchInput.fill('11.222.333')
    await page.waitForTimeout(400)
    await expect(page.locator('table tbody tr')).not.toHaveCount(0)
  })

  test('criação completa — fill form → submit → toast sucesso → redirect lista', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Nova Imobiliária' }).click()
    await expect(page).toHaveURL('/imobiliarias/novo')

    await page.getByLabel('CNPJ *').fill('11.222.333/0001-81')
    await page.getByLabel('Razão Social *').fill('Imobiliária E2E Teste Ltda')
    await page.getByLabel('CRECI-J *').fill('CRECI-J SP 99999')

    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page.getByText('Imobiliária cadastrada com sucesso!')).toBeVisible()
    await expect(page).toHaveURL('/imobiliarias')
  })

  test('edição — navegar detalhe → editar → submit → toast sucesso', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Ações' }).click()
    await page.getByRole('menuitem', { name: 'Ver detalhes' }).click()

    await expect(page).toHaveURL(/\/imobiliarias\/\d+$/)
    await page.getByRole('button', { name: 'Editar' }).click()

    await expect(page).toHaveURL(/\/imobiliarias\/\d+\/editar$/)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    await expect(page.getByText('Imobiliária atualizada com sucesso!')).toBeVisible()
  })

  test('soft-delete com confirmação → toast → redirect lista', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Ações' }).click()
    await page.getByRole('menuitem', { name: 'Excluir' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Excluir imobiliária?')).toBeVisible()

    await page.getByRole('button', { name: 'Excluir' }).click()

    await expect(page.getByText('Imobiliária removida com sucesso!')).toBeVisible()
    await expect(page).toHaveURL('/imobiliarias')
  })
})
