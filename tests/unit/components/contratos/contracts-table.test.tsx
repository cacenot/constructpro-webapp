import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../../helpers/wrapper'

vi.mock('vike/client/router', () => ({ navigate: vi.fn() }))

import { navigate } from 'vike/client/router'
import { ContractsTable } from '@/components/contratos/contracts-table'
import type { ContractTableRow } from '@/hooks/use-contracts-table'

const mockNavigate = vi.mocked(navigate)

const makeContract = (overrides: Partial<ContractTableRow> = {}): ContractTableRow => ({
  id: 123,
  sale_id: 456,
  principal_amount: { cents: 15_000_000, decimal: '150000.00', brl: 'R$ 150.000,00' },
  status: 'active',
  signed_at: '2026-03-15T00:00:00Z',
  document_url: null,
  is_overdue: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  sale: {
    id: 456,
    unit_id: 1,
    customer_id: 1,
    user_id: 'u1',
    amount: { cents: 15_000_000, decimal: '150000.00', brl: 'R$ 150.000,00' },
    unit_price: { cents: 15_000_000, decimal: '150000.00', brl: 'R$ 150.000,00' },
    status: 'closed',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    customer: { full_name: 'João da Silva' },
    unit: { name: 'Apto 101', project: { name: 'Residencial Aurora' } },
    // biome-ignore lint/suspicious/noExplicitAny: parcial de SaleResponse para o teste
  } as any,
  ...overrides,
})

const defaultProps = {
  data: [] as ContractTableRow[],
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
      <ContractsTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('ContractsTable', () => {
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
    it('exibe "Nenhum contrato cadastrado ainda."', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhum contrato cadastrado ainda.')).toBeDefined()
    })

    it('não exibe ação primária (contrato nasce de venda assinada)', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.queryByRole('button', { name: /novo contrato/i })).toBeNull()
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhum contrato encontrado com esses filtros.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.8)', () => {
    it('âncora: cliente + subtítulo Venda/empreendimento/unidade', () => {
      renderTable({ data: [makeContract()] })
      expect(screen.getByText('João da Silva')).toBeDefined()
      expect(
        screen.getByText('Venda #00456 · Residencial Aurora - Apto 101')
      ).toBeDefined()
    })

    it('ID como badge mono formatado', () => {
      renderTable({ data: [makeContract()] })
      expect(screen.getByText('#00123')).toBeDefined()
    })

    it('valor principal via MoneyCell (cents / 100)', () => {
      renderTable({ data: [makeContract()] })
      expect(screen.getByText(/150\.000,00/)).toBeDefined()
    })

    it('exibe o badge de status do contrato', () => {
      renderTable({ data: [makeContract({ status: 'active' })] })
      expect(screen.getByText('Ativo')).toBeDefined()
    })

    it('quando inadimplente, exibe status E badge de inadimplência (ambos)', () => {
      renderTable({ data: [makeContract({ status: 'active', is_overdue: true })] })
      expect(screen.getByText('Ativo')).toBeDefined()
      expect(screen.getByText('Inadimplente')).toBeDefined()
    })

    it('quando adimplente, não exibe badge de inadimplência', () => {
      renderTable({ data: [makeContract({ is_overdue: false })] })
      expect(screen.queryByText('Inadimplente')).toBeNull()
    })

    it('signed_at vazio cai no fallback "Aguardando"', () => {
      renderTable({ data: [makeContract({ signed_at: null })] })
      expect(screen.getByText('Aguardando')).toBeDefined()
    })
  })

  describe('ações condicionais', () => {
    it('menu mostra Ver detalhes, Editar e Ver venda relacionada', async () => {
      renderTable({ data: [makeContract()] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Ver venda relacionada')).toBeDefined()
    })

    it('contrato pending exibe "Registrar assinatura"', async () => {
      renderTable({ data: [makeContract({ status: 'pending' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Registrar assinatura')).toBeDefined()
    })

    it('contrato não-pending não exibe "Registrar assinatura"', async () => {
      renderTable({ data: [makeContract({ status: 'active' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      await screen.findByText('Ver detalhes')
      expect(screen.queryByText('Registrar assinatura')).toBeNull()
    })

    it('contrato com document_url exibe "Baixar documento"', async () => {
      renderTable({ data: [makeContract({ document_url: 'https://x/doc.pdf' })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Baixar documento')).toBeDefined()
    })

    it('contrato sem document_url não exibe "Baixar documento"', async () => {
      renderTable({ data: [makeContract({ document_url: null })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      await screen.findByText('Ver detalhes')
      expect(screen.queryByText('Baixar documento')).toBeNull()
    })

    it('"Ver venda relacionada" navega para a venda', async () => {
      renderTable({ data: [makeContract({ sale_id: 789 })] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      await userEvent.click(await screen.findByText('Ver venda relacionada'))
      expect(mockNavigate).toHaveBeenCalledWith('/vendas/789')
    })
  })

  describe('rodapé', () => {
    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeContract()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 contrato$/)).toBeDefined()
    })
  })
})
