import { addMonths, format, startOfMonth } from 'date-fns'
import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio Financeiro (Parcelas).
 */
export async function registerFinanceiroHandlers(page: Page) {
  // GET /api/v1/installments — listagem paginada (regex cobre query params)
  // ATENÇÃO: regex não captura /summary, /financial-summary, /cashflow — ok.
  await page.route(/\/api\/v1\/installments(?:[?]|$)/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()

    const installments = [
      factory.installment({ id: 1, status: 'scheduled', due_date: '2026-06-10' }),
      factory.installment({ id: 2, status: 'overdue', due_date: '2026-04-10' }),
      factory.installment({
        id: 3,
        status: 'paid',
        due_date: '2026-03-10',
        paid_at: '2026-03-08T14:00:00Z',
        paid_amount_cents: 500000,
      }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(installments, 3)),
    })
  })

  // GET /api/v1/installments/:id — detalhe de parcela
  await page.route(/\/api\/v1\/installments\/[^/]+$/, async (route) => {
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

  // GET /api/v1/installments/financial-summary — resumo financeiro do portfolio
  await page.route('**/api/v1/installments/financial-summary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_contracts: 92,
        active_contracts: 89,
        settled_contracts: 3,
        overdue_contracts: 3,
        total_principal: factory.money(800_000_000),
        total_paid: factory.money(380_000_000),
        total_refunded: factory.money(0),
        total_outstanding: factory.money(421_843_000),
        total_correction: factory.money(1_843_000),
        payment_progress_percentage: 47.5,
      }),
    })
  })

  // GET /api/v1/installments/cashflow — cashflow 6m (ancorado na data real do teste)
  await page.route('**/api/v1/installments/cashflow*', async (route) => {
    const base = startOfMonth(new Date())
    const months = [-3, -2, -1, 0, 1, 2].map((offset) => {
      const month = addMonths(base, offset)
      const isPast = offset < 0
      const isCurrent = offset === 0
      return {
        month: format(month, 'yyyy-MM-dd'),
        received: factory.money(isPast ? 30_000_000 + offset * 1_000_000 : isCurrent ? 34_258_000 : 0),
        refunded: factory.money(0),
        correction: factory.money(0),
        due_projected: factory.money(offset >= 0 ? 41_820_000 : 0),
      }
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ months }),
    })
  })

  // GET /api/v1/installments/summary — resumo de parcelas (brancheia por overdue)
  // ATENÇÃO: registrado POR ÚLTIMO pois o Playwright dá precedência à rota mais recente.
  // A rota de lista acima (regex) não captura /summary (não é dígito após /installments/).
  await page.route('**/api/v1/installments/summary*', async (route) => {
    const url = new URL(route.request().url())
    const overdueOnly = url.searchParams.get('overdue') === 'true'

    const items = overdueOnly
      ? [
          summaryItem(),
          summaryItem({
            id: 'b9f7a2c4-0000-4000-8000-000000000002',
            customer: { id: 8, full_name: 'Maria Lopes', cpf_cnpj: '987.654.321-00' },
            days_overdue: 52,
            remaining_amount: factory.money(1_230_000),
            current_amount: factory.money(1_230_000),
          }),
          summaryItem({
            id: 'b9f7a2c4-0000-4000-8000-000000000003',
            customer: { id: 9, full_name: 'Pedro Martins', cpf_cnpj: '111.222.333-44' },
            days_overdue: 95,
            remaining_amount: factory.money(815_000),
            current_amount: factory.money(815_000),
          }),
        ]
      : [
          summaryItem({ id: 'b9f7a2c4-0000-4000-8000-000000000010', is_overdue: false, days_overdue: 0, status: 'invoiced' }),
          summaryItem({ id: 'b9f7a2c4-0000-4000-8000-000000000011', is_overdue: false, days_overdue: 0, status: 'scheduled' }),
        ]

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...factory.paginated(items, items.length),
        summary: fullSummary(),
      }),
    })
  })
}

// ─── Helpers de shape ─────────────────────────────────────────────────────────

/** Item do /installments/summary no shape atual (InstallmentSummaryItemResponse). */
function summaryItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b9f7a2c4-0000-4000-8000-000000000001',
    contract_id: 42,
    kind: 'regular',
    payment_method: 'boleto',
    due_date: '2026-05-05',
    base_amount: factory.money(1_500_000),
    current_amount: factory.money(1_842_000),
    paid_amount: factory.money(0),
    remaining_amount: factory.money(1_842_000),
    status: 'invoiced',
    installment_number: '3/36',
    is_overdue: true,
    days_overdue: 38,
    created_at: '2026-01-10T14:30:00Z',
    customer: { id: 7, full_name: 'João Silva', cpf_cnpj: '123.456.789-00' },
    project: { id: 3, name: 'Residencial Aurora' },
    unit: { id: 15, name: 'Apt 302-B' },
    boleto: null,
    payments: [],
    ...overrides,
  }
}

function aging() {
  return {
    not_due: { count: 41, amount: factory.money(40_500_000) },
    d1_30: { count: 5, amount: factory.money(8_245_000) },
    d31_60: { count: 2, amount: factory.money(2_876_000) },
    d61_90: { count: 1, amount: factory.money(1_420_000) },
    d90_plus: { count: 1, amount: factory.money(950_000) },
  }
}

function fullSummary() {
  return {
    total_current_amount: factory.money(72_000_000),
    total_base_amount: factory.money(70_000_000),
    total_paid_amount: factory.money(18_009_000),
    total_overdue_amount: factory.money(13_491_000),
    total_remaining_amount: factory.money(53_991_000),
    total_correction_amount: factory.money(2_000_000),
    scheduled_count: 30,
    invoiced_count: 10,
    partial_count: 3,
    paid_count: 5,
    canceled_count: 0,
    overdue_count: 9,
    entry_total: 1,
    regular_total: 40,
    balloon_total: 4,
    key_delivery_total: 1,
    extra_total: 3,
    aging: aging(),
  }
}
