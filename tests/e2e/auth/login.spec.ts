import { expect, test } from '@playwright/test'

/**
 * Spec: Página de Login
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
        body: JSON.stringify({ error: { code: 400, message: 'INVALID_EMAIL', status: 'INVALID_ARGUMENT' } }),
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

  test('exibe o título e subtítulo corretos', async ({ page }) => {
    // CardTitle do shadcn renderiza como <div>, não <heading>
    // "Entrar" aparece também no botão — .first() seleciona o título do card
    await expect(page.getByText('Entrar').first()).toBeVisible()
    await expect(page.getByText('Acesse sua conta para continuar')).toBeVisible()
  })

  test('exibe os campos email e senha', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
  })

  test('exibe o botão Entrar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('mostra erro de validação quando campos estão vazios', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Zod valida e react-hook-form exibe mensagens
    await expect(page.getByText(/email inválido/i)).toBeVisible()
    await expect(page.getByText(/mínimo 6 caracteres/i)).toBeVisible()
  })

  test('mostra erro de email inválido', async ({ page }) => {
    await page.getByLabel('Email').fill('nao-e-email')
    await page.getByLabel('Senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('Email inválido')).toBeVisible()
  })

  test('mostra erro de senha curta', async ({ page }) => {
    await page.getByLabel('Email').fill('user@test.com')
    await page.getByLabel('Senha').fill('123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText(/mínimo 6 caracteres/i)).toBeVisible()
  })

  test('exibe link para recuperação de senha', async ({ page }) => {
    await expect(page.getByRole('button', { name: /esqueceu a senha/i })).toBeVisible()
  })

  test('abre dialog de recuperação de senha ao clicar no link', async ({ page }) => {
    await page.getByRole('button', { name: /esqueceu a senha/i }).click()

    await expect(page.getByText('Recuperar senha')).toBeVisible()
    await expect(
      page.getByText(/informe seu email e enviaremos um link/i)
    ).toBeVisible()
  })

  test('dialog de recuperação valida email vazio', async ({ page }) => {
    await page.getByRole('button', { name: /esqueceu a senha/i }).click()
    await page.getByRole('button', { name: 'Enviar' }).click()

    await expect(page.getByText('Email inválido')).toBeVisible()
  })

  test('fecha dialog de recuperação ao clicar em Cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /esqueceu a senha/i }).click()
    await expect(page.getByText('Recuperar senha')).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('Recuperar senha')).not.toBeVisible()
  })
})
