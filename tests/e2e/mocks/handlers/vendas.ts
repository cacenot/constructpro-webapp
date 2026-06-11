import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Vendas.
 */
export async function registerVendasHandlers(page: Page) {
  // GET /api/v1/sales/summary — listagem paginada + bloco agregado (rota específica antes da geral)
  await page.route(/\/api\/v1\/sales\/summary/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const { money } = factory
    // SaleSummaryResponse embute customer/unit (com project) — fixtures coerentes p/ dashboard.
    const embed = (saleId: number) => ({
      customer: {
        id: saleId,
        full_name: `Maria Compradora ${saleId}`,
        cpf_cnpj: '12345678901',
      },
      unit: {
        id: saleId,
        name: `Apto 10${saleId}`,
        price: money(50_000_000),
        project: { id: 2, name: 'Tower Park' },
      },
    })
    const sales = [
      { ...factory.sale({ id: 1, status: 'proposal' }), ...embed(1) },
      { ...factory.sale({ id: 2, status: 'pending_signature' }), ...embed(2) },
      { ...factory.sale({ id: 3, status: 'closed' }), ...embed(3) },
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...factory.paginated(sales, 3),
        summary: {
          pipeline: {
            proposal: { count: 8, amount: money(240_000_000) },
            pending_signature: { count: 3, amount: money(94_000_000) },
            pending_payment: { count: 2, amount: money(61_000_000) },
            total_open_count: 13,
            total_open_amount: money(395_000_000),
          },
          month: {
            reference: '2026-06',
            closed_count: 3,
            closed_amount: money(119_500_000),
            lost_count: 1,
          },
        },
      }),
    })
  })

  // POST /api/v1/sales/:id/approve — aprovar venda
  await page.route(/\/api\/v1\/sales\/\d+\/approve/, async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 1, status: 'pending_signature' })),
    })
  })

  // GET + PATCH /api/v1/sales/:id — venda por ID
  // Regex sem âncora $ para tolerar query params
  await page.route(/\/api\/v1\/sales\/\d+(?:[?/]|$)/, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(factory.sale({ id: 1, status: 'proposal' })),
      })
      return
    }
    if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(factory.sale({ id: 1, status: 'proposal' })),
      })
      return
    }
    return route.continue()
  })

  // POST /api/v1/sales — criação
  await page.route(/\/api\/v1\/sales(?:[?]|$)/, async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(factory.sale({ id: 99, status: 'proposal' })),
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
