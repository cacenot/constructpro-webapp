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
  }
})

import { navigate } from 'vike/client/router'
import { BrokerTable } from '@/components/corretores/broker-table'
import type { BrokerResponse } from '@/hooks/use-brokers-table'

const mockNavigate = vi.mocked(navigate)

const makeBroker = (overrides: Partial<BrokerResponse> = {}): BrokerResponse => ({
  id: 1,
  full_name: 'Maria Souza',
  cpf: '12345678909',
  creci: 'CRECI-SC 12345',
  email: 'maria@imob.com',
  phone: '5547999998888',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const defaultProps = {
  data: [] as BrokerResponse[],
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
      <BrokerTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('BrokerTable', () => {
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
    it('exibe "Nenhum corretor cadastrado ainda."', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhum corretor cadastrado ainda.')).toBeDefined()
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhum corretor encontrado com esses filtros.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.2)', () => {
    it('âncora: nome + CPF formatado como subtítulo', () => {
      renderTable({ data: [makeBroker()] })
      expect(screen.getByText('Maria Souza')).toBeDefined()
      expect(screen.getByText('123.456.789-09')).toBeDefined()
    })

    it('exibe CRECI e telefone formatado', () => {
      renderTable({ data: [makeBroker()] })
      expect(screen.getByText('CRECI-SC 12345')).toBeDefined()
      expect(screen.getByText('(47) 99999-8888')).toBeDefined()
    })

    it('e-mail vazio cai no — do MutedCell', () => {
      renderTable({ data: [makeBroker({ email: null })] })
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('interações', () => {
    it('clicar na linha navega para o detalhe do corretor', async () => {
      renderTable({ data: [makeBroker({ id: 42 })] })
      await userEvent.click(screen.getByText('Maria Souza'))
      expect(mockNavigate).toHaveBeenCalledWith('/corretores/42')
    })

    it('menu de ações mostra Ver detalhes, Editar e Excluir', async () => {
      renderTable({ data: [makeBroker()] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Excluir')).toBeDefined()
    })

    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeBroker()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 corretor$/)).toBeDefined()
    })
  })
})
