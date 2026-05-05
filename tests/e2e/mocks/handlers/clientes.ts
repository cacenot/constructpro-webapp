import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Clientes.
 */
export async function registerClientesHandlers(page: Page) {
  // GET /api/v1/customers — listagem paginada
  await page.route('**/api/v1/customers*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()

    const customers = [
      factory.customer({ id: 1, full_name: 'Maria das Dores', cpf_cnpj: '52998224725' }),
      factory.customer({ id: 2, full_name: 'João Silva', type: 'individual' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(customers, 2)),
    })
  })

  // GET /api/v1/customers/:id — detalhe do cliente
  await page.route('**/api/v1/customers/*/detail', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...factory.customer({ id: 1, full_name: 'Maria das Dores' }),
        contracts: [],
        sales: [],
      }),
    })
  })

  // GET /api/v1/customers/:id — cliente por ID (edição)
  await page.route(/\/api\/v1\/customers\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.customer({ id: 1, full_name: 'Maria das Dores' })),
    })
  })

  // POST /api/v1/customers — criação
  await page.route('**/api/v1/customers', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.customer({ id: 99, ...body })),
    })
  })

  // PATCH /api/v1/customers/:id — atualização
  await page.route(/\/api\/v1\/customers\/\d+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.customer({ id: 1, ...body })),
    })
  })
}
