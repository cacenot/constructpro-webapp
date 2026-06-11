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
import type { UnitSummaryResponse } from '@/hooks/use-units-table'

const mockNavigate = vi.mocked(navigate)

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
  data: [] as UnitSummaryResponse[],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
  onViewDetails: vi.fn(),
  selectedId: null,
  sort: 'id:desc',
  onSort: vi.fn(),
  total: 0,
  hasNextPage: false,
  isFetchingNextPage: false,
  onReachEnd: vi.fn(),
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
    it('exibe linhas skeleton quando isLoading=true e não há dados', () => {
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
    it('exibe "Nenhuma unidade cadastrada." e CTA de cadastro', async () => {
      renderTable({ data: [], hasActiveFilters: false })
      expect(screen.getByText('Nenhuma unidade cadastrada.')).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /cadastrar unidade/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/unidades/novo')
    })
  })

  describe('empty state — com filtros', () => {
    it('exibe mensagem de filtros e botão Limpar filtros', async () => {
      const onClearFilters = vi.fn()
      renderTable({ data: [], hasActiveFilters: true, onClearFilters })
      expect(
        screen.getByText('Nenhuma unidade encontrada com os filtros aplicados.')
      ).toBeDefined()
      await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })
  })

  describe('linguagem de rows (§2.4)', () => {
    it('âncora: nome + categoria traduzida como subtítulo', () => {
      renderTable({ data: [makeUnit()] })
      expect(screen.getByText('Apto 101')).toBeDefined()
      expect(screen.getByText('Apartamento')).toBeDefined()
    })

    it('ID em mono e preço formatado pela MoneyCell', () => {
      renderTable({ data: [makeUnit()] })
      expect(screen.getByText('#00001')).toBeDefined()
      expect(screen.getByText('R$ 450.000,00')).toBeDefined()
    })

    it('exibe o badge de status (semáforo) da unidade', () => {
      renderTable({ data: [makeUnit({ status: 'available' })] })
      expect(screen.getByText('Disponível')).toBeDefined()
    })

    it('empreendimento vazio cai no — do MutedCell', () => {
      renderTable({ data: [makeUnit({ project_name: '' })] })
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('ordenação', () => {
    it('exibe os cabeçalhos ordenáveis (ID, Nome, Área, Preço)', () => {
      renderTable({ data: [makeUnit()] })
      expect(screen.getByRole('button', { name: /^ID$/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /^Nome$/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /^Área$/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /^Preço$/i })).toBeDefined()
    })

    it('clicar no cabeçalho Nome chama onSort com o campo + direção', async () => {
      const onSort = vi.fn()
      renderTable({ data: [makeUnit()], sort: 'id:desc', onSort })
      await userEvent.click(screen.getByRole('button', { name: /^Nome$/i }))
      expect(onSort).toHaveBeenCalledWith('name:asc')
    })
  })

  describe('interações de linha', () => {
    it('clicar na linha abre o detalhe (chama onViewDetails)', async () => {
      const onViewDetails = vi.fn()
      const unit = makeUnit()
      renderTable({ data: [unit], onViewDetails })
      await userEvent.click(screen.getByText('Apto 101'))
      expect(onViewDetails).toHaveBeenCalledWith(unit)
    })

    it('menu de ações mostra Ver detalhes, Editar, Nova venda e Excluir', async () => {
      renderTable({ data: [makeUnit()] })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Ver detalhes')).toBeDefined()
      expect(screen.getByText('Editar')).toBeDefined()
      expect(screen.getByText('Nova venda')).toBeDefined()
      expect(screen.getByText('Excluir')).toBeDefined()
    })

    it('"Ver detalhes" no menu de ações chama onViewDetails', async () => {
      const onViewDetails = vi.fn()
      const unit = makeUnit()
      renderTable({ data: [unit], onViewDetails })
      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      await userEvent.click(await screen.findByText('Ver detalhes'))
      expect(onViewDetails).toHaveBeenCalledWith(unit)
    })

    it('endLabel exibe o total no fim da lista', () => {
      renderTable({ data: [makeUnit()], total: 1, hasNextPage: false })
      expect(screen.getByText(/Fim da lista · 1 unidade$/)).toBeDefined()
    })
  })
})
