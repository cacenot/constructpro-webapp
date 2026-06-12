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
import { AgencyTable } from '@/components/imobiliarias/agency-table'
import type { AgencyResponse } from '@/hooks/use-agencies-table'

const mockNavigate = vi.mocked(navigate)

const makeAgency = (overrides: Partial<AgencyResponse> = {}): AgencyResponse => ({
  id: 1,
  legal_name: 'Imobiliária Horizonte Ltda',
  trade_name: 'Horizonte Imóveis',
  cnpj: '12345678000190',
  creci_j: 'CRECI-J SC 12345',
  email: 'contato@horizonte.com',
  phone: '5547999998888',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const defaultProps = {
  data: [] as AgencyResponse[],
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
      <AgencyTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('AgencyTable', () => {
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
    it('exibe "Nenhuma imobiliária cadastrada ainda."', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhuma imobiliária cadastrada ainda.')).toBeDefined()
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(screen.getByText('Nenhuma imobiliária encontrada com esses filtros.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.3)', () => {
    it('âncora: razão social + CNPJ formatado como subtítulo', () => {
      renderTable({ data: [makeAgency()] })
      expect(screen.getByText('Imobiliária Horizonte Ltda')).toBeDefined()
      expect(screen.getByText('12.345.678/0001-90')).toBeDefined()
    })

    it('exibe nome fantasia, CRECI-J e e-mail', () => {
      renderTable({ data: [makeAgency()] })
      expect(screen.getByText('Horizonte Imóveis')).toBeDefined()
      expect(screen.getByText('CRECI-J SC 12345')).toBeDefined()
      expect(screen.getByText('contato@horizonte.com')).toBeDefined()
    })

    it('nome fantasia vazio cai no — do MutedCell', () => {
      renderTable({ data: [makeAgency({ trade_name: null })] })
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('interações', () => {
    it('clicar na linha navega para o detalhe da imobiliária', async () => {
      renderTable({ data: [makeAgency({ id: 42 })] })
      await userEvent.click(screen.getByText('Imobiliária Horizonte Ltda'))
      expect(mockNavigate).toHaveBeenCalledWith('/imobiliarias/42')
    })

    it('menu de ações mostra Ver detalhes, Editar e Excluir', async () => {
      renderTable({ data: [makeAgency()] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Excluir')).toBeDefined()
    })

    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeAgency()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 imobiliária$/)).toBeDefined()
    })
  })
})
