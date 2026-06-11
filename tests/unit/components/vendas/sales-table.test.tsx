import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../../helpers/wrapper'

vi.mock('vike/client/router', () => ({ navigate: vi.fn() }))

// Os três dialogs de ação dependem de api-client/Firebase; mockados como no-op —
// o que importa aqui é a casca da tabela + o menu de ações condicional ao status.
vi.mock('@/components/vendas/approve-sale-dialog', () => ({
  ApproveSaleDialog: () => null,
}))
vi.mock('@/components/vendas/sign-contract-dialog', () => ({
  SignContractDialog: () => null,
}))
vi.mock('@/components/financeiro/pay-installment-dialog', () => ({
  PayInstallmentDialog: () => null,
}))

import { navigate } from 'vike/client/router'
import { SalesTable } from '@/components/vendas/sales-table'
import type { SaleSummaryResponse } from '@/hooks/use-sales-summary'

const mockNavigate = vi.mocked(navigate)

const makeSale = (overrides: Partial<SaleSummaryResponse> = {}): SaleSummaryResponse => ({
  id: 1,
  status: 'proposal',
  amount: { cents: 50_000_000, decimal: '500000.00', brl: 'R$ 500.000,00' },
  created_at: '2026-01-01T00:00:00Z',
  closed_at: null,
  user: { id: 'u-1', display_name: 'Carlos Vendedor' },
  unit: {
    id: 10,
    name: 'Apto 101',
    price: { cents: 50_000_000, decimal: '500000.00', brl: 'R$ 500.000,00' },
    project: { id: 2, name: 'Tower Park' },
  },
  customer: { id: 5, full_name: 'Maria Compradora', cpf_cnpj: '12345678909' },
  ...overrides,
})

const defaultProps = {
  data: [] as SaleSummaryResponse[],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
  total: 0,
  hasNextPage: false,
  isFetchingNextPage: false,
  onReachEnd: vi.fn(),
}

function renderTable(props: Partial<typeof defaultProps> = {}) {
  return render(
    <TestWrapper>
      <SalesTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('SalesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('estado de carregamento', () => {
    it('exibe linhas skeleton quando isLoading=true', () => {
      const { container } = renderTable({ isLoading: true })
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('estado de erro', () => {
    it('exibe botão de retry e chama onRetry', async () => {
      const onRetry = vi.fn()
      renderTable({ isError: true, onRetry })
      await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
      expect(onRetry).toHaveBeenCalledOnce()
    })
  })

  describe('empty state — sem filtros', () => {
    it('exibe "Nenhuma venda registrada." e CTA Nova venda', async () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhuma venda registrada.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /nova venda/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/vendas/novo')
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhuma venda encontrada.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.6)', () => {
    it('âncora: unidade + empreendimento como subtítulo', () => {
      renderTable({ data: [makeSale()] })
      expect(screen.getByText('Apto 101')).toBeDefined()
      expect(screen.getByText('Tower Park')).toBeDefined()
    })

    it('coluna cliente: nome + CPF formatado', () => {
      renderTable({ data: [makeSale()] })
      expect(screen.getByText('Maria Compradora')).toBeDefined()
      expect(screen.getByText('123.456.789-09')).toBeDefined()
    })

    it('coluna vendedor + status badge', () => {
      renderTable({ data: [makeSale()] })
      expect(screen.getByText('Carlos Vendedor')).toBeDefined()
      // SaleStatusBadge traduz 'proposal' para pt-BR
      expect(screen.getByText('Proposta')).toBeDefined()
    })
  })

  describe('ações condicionais ao status', () => {
    it('venda em proposta mostra Editar e Aprovar proposta', async () => {
      renderTable({ data: [makeSale({ status: 'proposal' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Aprovar proposta')).toBeDefined()
      expect(screen.queryByText('Assinar contrato')).toBeNull()
    })

    it('venda pending_signature mostra Assinar contrato e Confirmar sinal', async () => {
      renderTable({ data: [makeSale({ status: 'pending_signature' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Assinar contrato')).toBeDefined()
      expect(screen.getByText('Confirmar sinal')).toBeDefined()
      expect(screen.queryByText('Aprovar proposta')).toBeNull()
      expect(screen.queryByText('Editar')).toBeNull()
    })

    it('venda pending_payment mostra apenas Confirmar sinal (sem assinar)', async () => {
      renderTable({ data: [makeSale({ status: 'pending_payment' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Confirmar sinal')).toBeDefined()
      expect(screen.queryByText('Assinar contrato')).toBeNull()
    })
  })

  describe('interações', () => {
    it('clicar na linha navega para o detalhe da venda', async () => {
      renderTable({ data: [makeSale({ id: 42 })] })
      await userEvent.click(screen.getByText('Apto 101'))
      expect(mockNavigate).toHaveBeenCalledWith('/vendas/42')
    })

    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeSale()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 venda$/)).toBeDefined()
    })
  })
})
