import type { Page } from '@playwright/test'
import * as factory from '../factory'
import { MOCK_USER } from '../firebase-auth'

/**
 * Registra handlers de rede para Configurações (membros, perfil, tenant).
 */
export async function registerConfiguracoesHandlers(page: Page) {
  // GET /api/v1/users/me — perfil do usuário logado
  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: MOCK_USER.uid,
        email: MOCK_USER.email,
        full_name: MOCK_USER.displayName,
        display_name: MOCK_USER.displayName,
        cpf: '52998224725',
        is_superuser: true,
        tenants: [
          {
            id: MOCK_USER.tenantId,
            name: 'Construtora Teste',
            roles: [{ name: 'admin', id: 'role-admin' }],
          },
        ],
      }),
    })
  })

  // PATCH /api/v1/users/me — atualizar perfil
  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: MOCK_USER.uid,
        email: MOCK_USER.email,
        full_name: body.full_name ?? MOCK_USER.displayName,
        display_name: body.display_name ?? MOCK_USER.displayName,
        cpf: '52998224725',
        is_superuser: true,
      }),
    })
  })

  // GET /api/v1/users — listagem de membros
  await page.route('**/api/v1/users*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const url = route.request().url()
    // evita interceptar /users/me
    if (url.includes('/me')) return route.continue()

    const members = [
      factory.user({ id: MOCK_USER.uid, email: MOCK_USER.email, full_name: MOCK_USER.displayName, is_superuser: true }),
      factory.user({ id: 'user-2', email: 'vendas@construtora.dev', full_name: 'Equipe Vendas', roles: [{ name: 'viewer', id: 'r2' }] }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(members, 2)),
    })
  })

  // POST /api/v1/users — criar membro
  await page.route('**/api/v1/users', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.user({ email: body.email, full_name: body.full_name })),
    })
  })

  // DELETE /api/v1/users/:id/roles/:role — remover role
  await page.route('**/api/v1/users/*/roles/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.continue()
    await route.fulfill({ status: 204, body: '' })
  })

  // POST /api/v1/users/:id/roles — adicionar role
  await page.route('**/api/v1/users/*/roles', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ name: 'viewer' }) })
  })

  // GET /api/v1/tenant-config — configuração do tenant
  await page.route('**/api/v1/tenant-config*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: MOCK_USER.tenantId,
        name: 'Construtora Teste Ltda',
        logo_url: null,
      }),
    })
  })

  // PATCH /api/v1/tenant-config — atualizar configuração
  await page.route('**/api/v1/tenant-config', async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: MOCK_USER.tenantId, name: 'Construtora Teste Ltda', ...body }),
    })
  })
}
