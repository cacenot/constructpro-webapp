import { expect, test } from '@playwright/test'

// Reseta o storageState do projeto (login.spec.ts não usa auth pré-existente)
test.use({ storageState: { cookies: [], origins: [] } })

/**
 * Spec: Página de Login (Auth v2 — AuthShell blueprint)
 *
 * Testa apenas a UI do formulário (validações client-side).
 * Firebase auth é interceptado para prevenir chamadas reais de rede.
 */
test.describe('Página de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepta Firebase para que signIn falhe rápido (sem rede real)
    await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'INVALID_EMAIL', status: 'INVALID_ARGUMENT' },
        }),
      })
    })
    await page.route('https://securetoken.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'fake', id_token: 'fake', expires_in: '3600' }),
      })
    })

    await page.goto('/login')
    // Aguarda o botão estar habilitado (onAuthStateChanged resolvido, loading=false)
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  test('exibe o título da página', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })

  test('exibe os campos email e senha', async ({ page }) => {
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
  })

  test('exibe o botão Entrar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('mostra erro de validação quando campos estão vazios', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Zod valida e react-hook-form exibe mensagens
    await expect(page.getByText('E-mail inválido')).toBeVisible()
    await expect(page.getByText(/mínimo 6 caracteres/i)).toBeVisible()
  })

  test('mostra erro de email inválido', async ({ page }) => {
    await page.getByLabel('E-mail').fill('nao-e-email')
    await page.getByLabel('Senha', { exact: true }).fill('Senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail inválido')).toBeVisible()
  })

  test('mostra erro de senha curta', async ({ page }) => {
    await page.getByLabel('E-mail').fill('user@test.com')
    await page.getByLabel('Senha', { exact: true }).fill('123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText(/mínimo 6 caracteres/i)).toBeVisible()
  })

  test('exibe link para recuperação de senha', async ({ page }) => {
    await expect(page.getByRole('link', { name: /esqueceu a senha/i })).toBeVisible()
  })

  test('navega para /recuperar-senha ao clicar no link', async ({ page }) => {
    await page.getByRole('link', { name: /esqueceu a senha/i }).click()

    await expect(page).toHaveURL('/recuperar-senha')
    await expect(page.getByRole('heading', { name: 'Esqueceu a senha?' })).toBeVisible()
    await expect(page.getByText(/informe seu e-mail e enviaremos um link/i)).toBeVisible()
  })

  test('página de recuperação valida email vazio', async ({ page }) => {
    await page.goto('/recuperar-senha')
    await page.getByRole('button', { name: 'Enviar link de redefinição' }).click()

    await expect(page.getByText('E-mail inválido')).toBeVisible()
  })

  test('página de recuperação volta para o login', async ({ page }) => {
    await page.goto('/recuperar-senha')
    await page.getByRole('link', { name: /voltar para o login/i }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })
})
