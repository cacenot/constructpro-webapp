import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Unidades.
 */
export async function registerUnidadesHandlers(page: Page) {
  // GET /api/v1/units — listagem (autocomplete)
  await page.route('**/api/v1/units', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()

    const units = [
      factory.unit({ id: 1, name: 'Apto 101', project_id: 1 }),
      factory.unit({ id: 2, name: 'Apto 102', project_id: 1 }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(units),
    })
  })

  // GET /api/v1/units/summary — listagem paginada com filtros
  await page.route('**/api/v1/units/summary*', async (route) => {
    const units = [
      factory.unit({ id: 1, name: 'Apto 101', project_id: 1, status: 'available' }),
      factory.unit({ id: 2, name: 'Apto 102', project_id: 1, status: 'sold' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(units, 2)),
    })
  })

  // GET /api/v1/units/:id — unidade por ID
  await page.route(/\/api\/v1\/units\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.unit({ id: 1, name: 'Apto 101', project_id: 1 })),
    })
  })

  // POST /api/v1/units — criação
  await page.route('**/api/v1/units', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.unit({ id: 99, ...body })),
    })
  })

  // PATCH /api/v1/units/:id — atualização
  await page.route(/\/api\/v1\/units\/\d+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.unit({ id: 1, ...body })),
    })
  })
}
