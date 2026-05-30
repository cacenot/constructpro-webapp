import type { Page } from '@playwright/test'
import * as factory from '../factory'

export async function registerCorretoresHandlers(page: Page) {
  const brokers = [
    factory.broker({ id: 1, full_name: 'João Silva Corretor', creci: 'CRECI-SP 12345' }),
    factory.broker({ id: 2, full_name: 'Maria Oliveira CRECI', creci: 'CRECI-RJ 67890' }),
  ]

  // GET /api/v1/brokers — listagem paginada
  await page.route('**/api/v1/brokers*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const url = new URL(route.request().url())
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const filtered = search
      ? brokers.filter(
          (b) =>
            b.full_name.toLowerCase().includes(search) ||
            b.cpf.includes(search) ||
            b.creci.toLowerCase().includes(search)
        )
      : brokers
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(filtered)),
    })
  })

  // GET /api/v1/brokers/:id
  await page.route(/\/api\/v1\/brokers\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(brokers[0]),
    })
  })

  // POST /api/v1/brokers — criação
  await page.route('**/api/v1/brokers', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.broker({ id: 99, ...body })),
    })
  })

  // PATCH /api/v1/brokers/:id — atualização
  await page.route(/\/api\/v1\/brokers\/\d+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...brokers[0], ...body }),
    })
  })

  // DELETE /api/v1/brokers/:id — soft-delete
  await page.route(/\/api\/v1\/brokers\/\d+$/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.continue()
    await route.fulfill({
      status: 204,
      contentType: 'application/json',
      body: '',
    })
  })
}
