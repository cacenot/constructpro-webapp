import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../../helpers/wrapper'

import { CommissionTable } from '@/components/comissoes/commission-table'
import type { CommissionItem } from '@/hooks/use-commissions-table'

const makeMoney = (cents: number) => ({
  cents,
  decimal: (cents / 100).toFixed(2),
  brl: `R$ ${(cents / 100).toFixed(2)}`,
})

const makeRate = (formatted: string) => ({
  ppm: 50000,
  percentage: '5.0000',
  decimal: '0.050000',
  basis_points: 500,
  formatted,
})

const makeCommission = (overrides: Partial<CommissionItem> = {}): CommissionItem => ({
  id: 1,
  sale_id: 42,
  broker_id: 7,
  agency_id: 3,
  broker_rate: makeRate('5,00%'),
  agency_rate: makeRate('2,00%'),
  broker_amount: makeMoney(50000),
  agency_amount: makeMoney(20000),
  total_amount: makeMoney(70000),
  sale_amount_at_approval: makeMoney(100000000),
  created_at: '2026-01-10T00:00:00Z',
  broker: { id: 7, full_name: 'Maria Souza', creci: 'CRECI-SC 12345' },
  agency: { id: 3, legal_name: 'Imobiliária XYZ LTDA', trade_name: 'XYZ Imóveis', creci_j: 'J-999' },
  sale_closed_at: '2026-01-09T00:00:00Z',
  ...overrides,
})

const defaultProps = {
  data: [] as CommissionItem[],
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
      <CommissionTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('CommissionTable', () => {
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
    it('exibe "Nenhuma comissão no período."', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhuma comissão no período.')).toBeDefined()
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhuma comissão encontrada com esses filtros.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.5)', () => {
    it('âncora: corretor como título + imobiliária (nome fantasia) como subtítulo', () => {
      renderTable({ data: [makeCommission()] })
      expect(screen.getByText('Maria Souza')).toBeDefined()
      expect(screen.getByText('XYZ Imóveis')).toBeDefined()
    })

    it('subtítulo cai para razão social quando não há nome fantasia', () => {
      renderTable({
        data: [
          makeCommission({
            agency: {
              id: 3,
              legal_name: 'Imobiliária XYZ LTDA',
              trade_name: null,
              creci_j: 'J-999',
            },
          }),
        ],
      })
      expect(screen.getByText('Imobiliária XYZ LTDA')).toBeDefined()
    })

    it('link mono da venda renderiza com href para /vendas/:id', () => {
      renderTable({ data: [makeCommission({ sale_id: 42 })] })
      const link = screen.getByRole('link', { name: '#00042' })
      expect(link.getAttribute('href')).toBe('/vendas/42')
    })

    it('exibe as taxas formatadas de corretor e imobiliária', () => {
      renderTable({ data: [makeCommission()] })
      expect(screen.getByText('5,00%')).toBeDefined()
      expect(screen.getByText('2,00%')).toBeDefined()
    })

    it('MoneyCell formata a comissão total e o valor da venda em reais', () => {
      renderTable({ data: [makeCommission()] })
      // total_amount: 70000 cents → R$ 700,00; sale_amount: 100000000 cents → R$ 1.000.000,00
      // O separador pt-BR entre "R$" e o número é NBSP (U+00A0) → casa com \s.
      expect(screen.getByText(/R\$\s*700,00/)).toBeDefined()
      expect(screen.getByText(/R\$\s*1\.000\.000,00/)).toBeDefined()
    })

    it('taxa ausente cai no — do MutedCell', () => {
      renderTable({ data: [makeCommission({ broker_rate: null, agency_rate: null })] })
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('rodapé da lista', () => {
    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeCommission()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 comissão$/)).toBeDefined()
    })
  })
})
