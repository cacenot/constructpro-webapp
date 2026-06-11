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
  // ProjectSummaryResponse: sold_count/total_units/sold_percentage (string)/total_vgv
  await page.route('**/api/v1/projects/summary*', async (route) => {
    const { money } = factory
    const projects = [
      {
        ...factory.project({ id: 1, name: 'Residencial Ipiranga' }),
        sold_count: 6,
        total_units: 10,
        sold_percentage: '60.00',
        total_vgv: money(420_000_000),
      },
      {
        ...factory.project({ id: 2, name: 'Tower Park', status: 'finished' }),
        // 50% (≠ 25% do hero mockado — getByText('25%') do spec do hero é strict)
        sold_count: 4,
        total_units: 8,
        sold_percentage: '50.00',
        total_vgv: money(360_000_000),
      },
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
