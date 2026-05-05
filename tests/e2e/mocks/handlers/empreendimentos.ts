import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Empreendimentos.
 */
export async function registerEmpreendimentosHandlers(page: Page) {
  // GET /api/v1/projects — listagem completa (sem paginação)
  await page.route('**/api/v1/projects', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()

    const projects = [
      factory.project({ id: 1, name: 'Residencial Ipiranga', status: 'construction' }),
      factory.project({ id: 2, name: 'Tower Park', status: 'finished' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    })
  })

  // GET /api/v1/projects/summary — listagem com filtros/paginação
  await page.route('**/api/v1/projects/summary*', async (route) => {
    const projects = [
      factory.project({ id: 1, name: 'Residencial Ipiranga' }),
      factory.project({ id: 2, name: 'Tower Park', status: 'finished' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(projects, 2)),
    })
  })

  // GET /api/v1/projects/:id — empreendimento por ID
  await page.route(/\/api\/v1\/projects\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.project({ id: 1, name: 'Residencial Ipiranga' })),
    })
  })

  // GET /api/v1/projects/:id/detail — detalhe com finanças
  await page.route('**/api/v1/projects/*/detail', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...factory.project({ id: 1, name: 'Residencial Ipiranga' }),
        units_summary: { total: 10, available: 8, reserved: 1, sold: 1 },
      }),
    })
  })

  // POST /api/v1/projects — criação (via página novo/)
  // Nota: Empreendimentos usam axios via src/lib/api.ts, não o OpenAPI client
  await page.route('**/api/v1/projects', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const body = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.project({ id: 99, ...body })),
    })
  })
}
