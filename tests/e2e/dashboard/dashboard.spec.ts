import { expect, test } from '../fixtures'

test.describe('Dashboard — Início', () => {
  test('exibe o hero com os 5 vitais da carteira', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Carteira a receber')).toBeVisible()
    await expect(page.getByText('Inadimplência')).toBeVisible()
    await expect(page.getByText('Recebido no mês')).toBeVisible()
    await expect(page.getByText('A receber no mês')).toBeVisible()
    await expect(page.getByText('Contratos ativos')).toBeVisible()
    // Inadimplência calculada: 13.491.000 / 53.991.000 ≈ 24,98% → formatPercent(1 casa) → '25%'
    await expect(page.getByText('25%')).toBeVisible()
  })

  test('exibe a seção financeiro com aging e maiores atrasos', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Parcelas vencidas')).toBeVisible()
    await expect(page.getByText('1-30 dias')).toBeVisible()
    await expect(page.getByText('90+ dias')).toBeVisible()
    await expect(page.getByText('Maiores atrasos')).toBeVisible()
    await expect(page.getByText('João Silva')).toBeVisible()
    await expect(page.getByText('Recebimento', { exact: true })).toBeVisible()
    // Garante que o gráfico de cashflow renderizou barras de verdade (não só o título).
    await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible()
  })

  test('faixa de aging deep-linka o financeiro filtrado', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /1-30 dias/ }).click()
    await expect(page).toHaveURL(/\/financeiro\?.*duePreset=custom/)
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
  })

  test('exibe a seção vendas com funil e recentes', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Propostas', { exact: true })).toBeVisible()
    await expect(page.getByText('Fechadas no mês')).toBeVisible()
    await expect(page.getByText('VGV em negociação')).toBeVisible()
    // VGV do pipeline mockado: money(395_000_000) → R$ 3.950.000,00
    await expect(page.getByText('R$ 3.950.000,00')).toBeVisible()
    await expect(page.getByText('Recentes')).toBeVisible()
    // Recente vem do item mockado, com cliente embutido e link para o detalhe
    await expect(page.getByRole('link', { name: /Maria Compradora 1/ })).toBeVisible()
  })

  test('exibe a seção operacional com estoque e empreendimentos', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Disponíveis')).toBeVisible()
    await expect(page.getByText('Reservadas')).toBeVisible()
    // VGV disponível mockado: money(1_840_000_000) → R$ 18.400.000,00
    await expect(page.getByText('Estoque a vender:')).toBeVisible()
    await expect(page.getByText('R$ 18.400.000,00')).toBeVisible()
    // Projeto do mock com barra de progresso (6/10 vendidos → 60%)
    await expect(page.getByRole('link', { name: /Residencial Ipiranga/ })).toBeVisible()
    await expect(page.getByText('6/10')).toBeVisible()
  })
})
