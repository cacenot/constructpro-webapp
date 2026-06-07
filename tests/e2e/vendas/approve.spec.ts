import { expect, test } from '../fixtures'

// Tela /vendas/:id redesenhada como "deal console" (PR #31). A venda #1 do seed
// está em status `proposal`, então a ação primária é Aprovar.
test.describe('Vendas — Deal console e aprovação', () => {
  test('exibe o cockpit do negócio com o identificador da venda', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    // O cockpit usa formatId(1) → "#00001" como heading (não mais "Proposta {id}").
    await expect(page.getByRole('heading', { name: /00001/ })).toBeVisible()
  })

  test('em status proposal, oferece as ações Aprovar e Editar proposta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /00001/ })).toBeVisible()
    // Botões agora em minúsculo ("Aprovar proposta") + atalho kbd no nome acessível.
    await expect(page.getByRole('button', { name: /Aprovar proposta/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Editar proposta/ })).toBeVisible()
  })

  test('abre o dialog de aprovação ao clicar em Aprovar proposta', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /00001/ })).toBeVisible()
    await page.getByRole('button', { name: /Aprovar proposta/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  // Smoke do atalho de teclado da ação primária (A = aprovar) introduzido no redesign.
  test('o atalho de teclado "A" abre o dialog de aprovação', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/vendas/1')
    await expect(page.getByRole('heading', { name: /00001/ })).toBeVisible()
    await page.keyboard.press('a')
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
