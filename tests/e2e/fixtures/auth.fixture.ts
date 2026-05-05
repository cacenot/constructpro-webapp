import { test as base, type Page } from '@playwright/test'
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
    // storageState é carregado automaticamente pelo projeto 'chromium' do playwright.config.ts
    // (Firebase auth tokens em localStorage → SDK restaura o usuário sem novo login)
    // Só precisamos registrar os handlers de API e entregar a page.
    await registerAllApiHandlers(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
