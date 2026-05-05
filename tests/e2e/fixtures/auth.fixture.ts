import { test as base, type Page } from '@playwright/test'
import { mockFirebaseAuth } from '../mocks/firebase-auth'
import { registerClientesHandlers } from '../mocks/handlers/clientes'
import { registerConfiguracoesHandlers } from '../mocks/handlers/configuracoes'
import { registerContratosHandlers } from '../mocks/handlers/contratos'
import { registerEmpreendimentosHandlers } from '../mocks/handlers/empreendimentos'
import { registerFinanceiroHandlers } from '../mocks/handlers/financeiro'
import { registerUnidadesHandlers } from '../mocks/handlers/unidades'
import { registerVendasHandlers } from '../mocks/handlers/vendas'

export interface AuthFixtures {
  /**
   * Page com Firebase 100% mockado e todos os handlers de API registrados.
   * Use este fixture em todos os specs autenticados.
   */
  authenticatedPage: Page
}

/**
 * Registra todos os handlers de API em uma página.
 * Chamado automaticamente pelo fixture `authenticatedPage`.
 */
export async function registerAllApiHandlers(page: Page) {
  await Promise.all([
    registerConfiguracoesHandlers(page),
    registerClientesHandlers(page),
    registerEmpreendimentosHandlers(page),
    registerUnidadesHandlers(page),
    registerVendasHandlers(page),
    registerFinanceiroHandlers(page),
    registerContratosHandlers(page),
  ])
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 1. Seed do IndexedDB + interceptação de tokens Firebase
    await mockFirebaseAuth(page)

    // 2. Registra todos os handlers de API (antes de qualquer navegação)
    await registerAllApiHandlers(page)

    // 3. Fornece a page para o teste
    await use(page)
  },
})

export { expect } from '@playwright/test'
