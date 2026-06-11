import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../../helpers/wrapper'

vi.mock('vike/client/router', () => ({ navigate: vi.fn() }))

vi.mock('@cacenot/construct-pro-api-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cacenot/construct-pro-api-client')>()
  return {
    ...original,
    useApiClient: vi.fn(() => ({
      client: { DELETE: vi.fn().mockResolvedValue({ error: null }) },
    })),
    getCustomerTypeOptions: () => [
      { value: 'individual', label: 'Pessoa Física' },
      { value: 'company', label: 'Pessoa Jurídica' },
    ],
  }
})

import { navigate } from 'vike/client/router'
import { CustomersTable } from '@/components/clientes/customers-table'
import type { CustomerResponse } from '@/hooks/use-customers-table'

const mockNavigate = vi.mocked(navigate)

const makeCustomer = (overrides: Partial<CustomerResponse> = {}): CustomerResponse => ({
  id: 1,
  type: 'individual',
  full_name: 'Maria das Dores',
  legal_name: null,
  cpf_cnpj: '52998224725',
  email: 'maria@exemplo.com',
  phone: '5511987654321',
  address: 'Rua das Flores, 100',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01310100',
  country: 'BR',
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-01-10T10:00:00Z',
  ...overrides,
})

const defaultProps = {
  data: [] as CustomerResponse[],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
  total: 0,
  hasNextPage: false,
  isFetchingNextPage: false,
  onReachEnd: vi.fn(),
  sort: '',
  onSort: vi.fn(),
}

function renderTable(props: Partial<typeof defaultProps> = {}) {
  return render(
    <TestWrapper>
      <CustomersTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('CustomersTable', () => {
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
    it('exibe "Nenhum cliente cadastrado."', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhum cliente cadastrado.')).toBeDefined()
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhum cliente encontrado com esses filtros.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows — âncora e documento', () => {
    it('exibe nome como âncora com CPF formatado como subtítulo', () => {
      renderTable({ data: [makeCustomer()] })
      expect(screen.getByText('Maria das Dores')).toBeDefined()
      expect(screen.getByText('529.982.247-25')).toBeDefined()
    })

    it('exibe o tipo do cliente como badge', () => {
      renderTable({ data: [makeCustomer({ type: 'individual' })] })
      expect(screen.getByText('Pessoa Física')).toBeDefined()
    })

    it('exibe "Pessoa Jurídica" para clientes PJ', () => {
      renderTable({ data: [makeCustomer({ type: 'company', cpf_cnpj: '11222333000181' })] })
      expect(screen.getByText('Pessoa Jurídica')).toBeDefined()
    })
  })

  describe('cabeçalho ordenável', () => {
    it('exibe header SortableHeader para ID e Nome', () => {
      renderTable({ data: [makeCustomer()] })
      expect(screen.getByRole('button', { name: /^ID/ })).toBeDefined()
      expect(screen.getByRole('button', { name: /^Nome/ })).toBeDefined()
    })

    it('chama onSort ao clicar no header Nome', async () => {
      const onSort = vi.fn()
      renderTable({ data: [makeCustomer()], onSort })
      await userEvent.click(screen.getByRole('button', { name: /^Nome/ }))
      expect(onSort).toHaveBeenCalledWith('full_name:asc')
    })
  })

  describe('interações', () => {
    it('clicar na linha navega para o detalhe do cliente', async () => {
      renderTable({ data: [makeCustomer({ id: 7 })] })
      await userEvent.click(screen.getByText('Maria das Dores'))
      expect(mockNavigate).toHaveBeenCalledWith('/clientes/7')
    })

    it('menu de ações mostra Ver detalhes, Editar e Nova venda', async () => {
      renderTable({ data: [makeCustomer()] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Nova venda')).toBeDefined()
    })

    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeCustomer()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 cliente$/)).toBeDefined()
    })

    it('endLabel usa plural para múltiplos clientes', () => {
      renderTable({
        data: [makeCustomer({ id: 1 }), makeCustomer({ id: 2, full_name: 'João Silva' })],
        total: 2,
        hasNextPage: false,
      })
      expect(screen.getByText(/Fim da lista · 2 clientes$/)).toBeDefined()
    })
  })
})
