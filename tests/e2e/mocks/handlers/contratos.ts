import type { Page } from '@playwright/test'
import * as factory from '../factory'

/**
 * Registra handlers de rede para o domínio de Contratos.
 */
export async function registerContratosHandlers(page: Page) {
  // GET /api/v1/contracts/ — listagem paginada
  await page.route('**/api/v1/contracts*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const url = route.request().url()

    // /contracts/:id — detalhe
    if (/\/contracts\/\d+/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(factory.contract({ id: 1, status: 'active' })),
      })
      return
    }

    // /contracts/ — listagem
    const contracts = [
      factory.contract({ id: 1, status: 'active' }),
      factory.contract({ id: 2, status: 'pending' }),
    ]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(factory.paginated(contracts, 2)),
    })
  })

  // POST /api/v1/contracts/:id/sign — assinar contrato
  await page.route('**/api/v1/contracts/*/sign', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        factory.contract({ id: 1, status: 'active', signed_at: new Date().toISOString() })
      ),
    })
  })
}
