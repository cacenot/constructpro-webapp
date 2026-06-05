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
import { UnitsTable } from '@/components/unidades/units-table'
import type { UnitSummaryResponse, UnitsTableSort } from '@/hooks/use-units-table'

const mockNavigate = vi.mocked(navigate)

const mockSort: UnitsTableSort = {
  sort: 'id:desc',
  setSort: vi.fn(),
}

const makeUnit = (overrides: Partial<UnitSummaryResponse> = {}): UnitSummaryResponse => ({
  id: 1,
  name: 'Apto 101',
  project_id: 10,
  project_name: 'Residencial Costara',
  category: 'apartment',
  area: '72.5',
  price: { cents: 45000000, decimal: '450000.00', brl: 'R$ 450.000,00' },
  status: 'available',
  ...overrides,
})

const defaultProps = {
  data: [],
  isLoading: false,
  isFetching: false,
  isError: false,
  onRetry: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
  sort: mockSort,
  onRowClick: vi.fn(),
}

function renderTable(props: Partial<typeof defaultProps> = {}) {
  return render(
    <TestWrapper>
      <UnitsTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('UnitsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('estado de carregamento', () => {
    it('exibe linhas skeleton quando isLoading=true', () => {
      const { container } = renderTable({ isLoading: true })
      // Skeleton usa data-slot="skeleton"
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('não exibe linhas de dados durante o carregamento', () => {
      renderTable({ isLoading: true, data: [makeUnit()] })
      expect(screen.queryByText('Apto 101')).toBeNull()
    })
  })

  describe('estado de erro', () => {
    it('exibe mensagem de erro quando isError=true', () => {
      renderTable({ isError: true })
      expect(screen.getByText('Não foi possível carregar as unidades')).toBeDefined()
      expect(screen.getByText('Verifique sua conexão e tente novamente.')).toBeDefined()
    })

    it('exibe botão "Tentar novamente" no estado de erro', () => {
      renderTable({ isError: true })
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeDefined()
    })

    it('chama onRetry ao clicar no botão de retry', async () => {
      const onRetry = vi.fn()
      renderTable({ isError: true, onRetry })
      await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('desabilita retry e exibe "Tentando…" enquanto isFetching=true', () => {
      renderTable({ isError: true, isFetching: true })
      const btn = screen.getByRole('button', { name: /tentando/i })
      expect(btn).toBeDefined()
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
  })

  describe('empty state — sem filtros ativos', () => {
    it('exibe "Nenhuma unidade cadastrada" quando não há dados', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhuma unidade cadastrada')).toBeDefined()
    })

    it('exibe CTA "Cadastrar primeira unidade"', () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByRole('button', { name: /cadastrar primeira unidade/i })).toBeDefined()
    })

    it('navega para /unidades/novo ao clicar no CTA', async () => {
      renderTable({ data: [], hasActiveFilters: false })
      await userEvent.click(screen.getByRole('button', { name: /cadastrar primeira unidade/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/unidades/novo')
    })
  })

  describe('empty state — com filtros ativos', () => {
    it('exibe mensagem de filtros sem resultados', () => {
      renderTable({ data: [], hasActiveFilters: true })
      expect(screen.getByText('Nenhuma unidade encontrada com os filtros aplicados.')).toBeDefined()
    })

    it('exibe botão "Limpar filtros"', () => {
      renderTable({ data: [], hasActiveFilters: true })
      expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeDefined()
    })

    it('chama onClearFilters ao clicar em Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('renderização de dados', () => {
    it('exibe nome da unidade na tabela', () => {
      renderTable({ data: [makeUnit({ name: 'Apto 202' })] })
      expect(screen.getByText('Apto 202')).toBeDefined()
    })

    it('exibe múltiplas unidades', () => {
      renderTable({
        data: [makeUnit({ id: 1, name: 'Apto 101' }), makeUnit({ id: 2, name: 'Apto 202' })],
      })
      expect(screen.getByText('Apto 101')).toBeDefined()
      expect(screen.getByText('Apto 202')).toBeDefined()
    })

    it('linha tem aria-label descrevendo a unidade', () => {
      renderTable({ data: [makeUnit({ name: 'Apto 101' })] })
      expect(screen.getByRole('row', { name: /ver detalhes da unidade apto 101/i })).toBeDefined()
    })

    it('linha tem tabIndex=0 para operação por teclado', () => {
      renderTable({ data: [makeUnit({ name: 'Apto 101' })] })
      const row = screen.getByRole('row', { name: /ver detalhes da unidade/i })
      expect(row.getAttribute('tabIndex')).toBe('0')
    })
  })

  describe('interações de linha', () => {
    it('chama onRowClick ao clicar na linha', async () => {
      const onRowClick = vi.fn()
      const unit = makeUnit()
      renderTable({ data: [unit], onRowClick })
      const row = screen.getByRole('row', { name: /ver detalhes da unidade/i })
      await userEvent.click(row)
      expect(onRowClick).toHaveBeenCalledWith(unit)
    })

    it('chama onRowClick ao pressionar Enter na linha focada', async () => {
      const onRowClick = vi.fn()
      const unit = makeUnit()
      renderTable({ data: [unit], onRowClick })
      const row = screen.getByRole('row', { name: /ver detalhes da unidade/i })
      row.focus()
      await userEvent.keyboard('{Enter}')
      expect(onRowClick).toHaveBeenCalledWith(unit)
    })

    it('chama onRowClick ao pressionar Espaço na linha focada', async () => {
      const onRowClick = vi.fn()
      const unit = makeUnit()
      renderTable({ data: [unit], onRowClick })
      const row = screen.getByRole('row', { name: /ver detalhes da unidade/i })
      row.focus()
      await userEvent.keyboard(' ')
      expect(onRowClick).toHaveBeenCalledWith(unit)
    })
  })
})
