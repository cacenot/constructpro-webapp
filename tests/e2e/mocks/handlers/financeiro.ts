import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio Financeiro (Parcelas).
 */
export async function registerFinanceiroHandlers(page: Page) {
  // GET /api/v1/installments — listagem paginada (regex cobre query params)
  await page.route(/\/api\/v1\/installments(?:[?]|$)/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()

    const installments = [
      factory.installment({ id: 1, status: 'scheduled', due_date: '2026-06-10' }),
      factory.installment({ id: 2, status: 'overdue', due_date: '2026-04-10' }),
      factory.installment({ id: 3, status: 'paid', due_date: '2026-03-10', paid_at: '2026-03-08T14:00:00Z', paid_amount_cents: 500000 }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(installments, 3)),
    })
  })

  // GET /api/v1/installments/summary — resumo financeiro
  await page.route('**/api/v1/installments/summary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_amount_cents: 1500000,
        paid_amount_cents: 500000,
        overdue_amount_cents: 500000,
        pending_amount_cents: 500000,
      }),
    })
  })

  // GET /api/v1/installments/:id — detalhe de parcela
  await page.route(/\/api\/v1\/installments\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        factory.installment({ id: 1, status: 'scheduled', due_date: '2026-06-10' })
      ),
    })
  })

  // POST /api/v1/installments/:id/pay — pagar parcela
  await page.route('**/api/v1/installments/*/pay', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        factory.installment({
          id: 1,
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount_cents: 500000,
        })
      ),
    })
  })
}
