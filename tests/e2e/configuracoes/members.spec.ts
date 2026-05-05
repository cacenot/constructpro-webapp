import { expect, test } from '../fixtures'

test.describe('Configurações — Membros e Perfil', () => {
  test('exibe o título e subtítulo da página', async ({ authenticatedPage: page }) => {
    await page.goto('/configuracoes')
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()
    await expect(
      page.getByText('Gerencie suas informações pessoais e preferências de conta')
    ).toBeVisible()
  })

  test('exibe as abas Minha Conta, Membros e Organização', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/configuracoes')
    await expect(page.getByRole('tab', { name: 'Minha Conta' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Membros' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Organização' })).toBeVisible()
  })

  test('exibe a seção Informações Pessoais na aba Minha Conta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/configuracoes')
    await expect(page.getByRole('heading', { name: 'Informações Pessoais' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Segurança' })).toBeVisible()
  })

  test('navega para a aba Membros e exibe a seção de membros', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/configuracoes')
    await page.getByRole('tab', { name: 'Membros' }).click()
    await expect(page.getByRole('tab', { name: 'Membros' })).toHaveAttribute(
      'data-state',
      'active'
    )
  })

  test('navega para a aba Organização', async ({ authenticatedPage: page }) => {
    await page.goto('/configuracoes')
    await page.getByRole('tab', { name: 'Organização' }).click()
    await expect(page.getByRole('tab', { name: 'Organização' })).toHaveAttribute(
      'data-state',
      'active'
    )
  })
})
