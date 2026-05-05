import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Vendas.
 */
export async function registerVendasHandlers(page: Page) {
  // GET /api/v1/sales/summary — listagem paginada
  // (O hook de vendas usa sales/summary via useApiClient do pacote)
  await page.route('**/api/v1/sales*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const url = route.request().url()

    if (url.includes('/summary')) {
      const sales = [
        factory.sale({ id: 1, status: 'proposal' }),
        factory.sale({ id: 2, status: 'pending_signature' }),
        factory.sale({ id: 3, status: 'closed' }),
      ]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(factory.paginated(sales, 3)),
      })
      return
    }

    // GET /api/v1/sales — listagem básica
    const sales = [
      factory.sale({ id: 1, status: 'proposal' }),
      factory.sale({ id: 2, status: 'closed' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(sales, 2)),
    })
  })

  // GET /api/v1/sales/:id — venda por ID
  await page.route(/\/api\/v1\/sales\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 1, status: 'proposal' })),
    })
  })

  // POST /api/v1/sales — criação
  await page.route('**/api/v1/sales', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 99, status: 'proposal' })),
    })
  })

  // POST /api/v1/sales/:id/approve — aprovar venda
  await page.route('**/api/v1/sales/*/approve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 1, status: 'pending_signature' })),
    })
  })

  // PATCH /api/v1/sales/:id — editar venda
  await page.route(/\/api\/v1\/sales\/\d+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 1, status: 'proposal' })),
    })
  })

  // GET /api/v1/index-types — tipos de índice (usado no formulário)
  await page.route('**/api/v1/index-types*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { code: 'IGPM', name: 'IGP-M' },
        { code: 'IPCA', name: 'IPCA' },
        { code: 'CUB', name: 'CUB' },
      ]),
    })
  })
}
