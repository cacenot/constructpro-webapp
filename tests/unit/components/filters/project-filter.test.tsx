import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TestWrapper } from '../../helpers/wrapper'

vi.mock('@cacenot/construct-pro-api-client', () => ({
  useApiClient: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useQuery: vi.fn() }
})

import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { ProjectFilter } from '@/components/filters/project-filter'

const mockUseApiClient = vi.mocked(useApiClient)
const mockUseQuery = vi.mocked(useQuery)

const mockProjects = [
  { id: 1, name: 'Residencial Costara', city: 'São Paulo', state: 'SP' },
  { id: 2, name: 'Jardins Park', city: 'Campinas', state: 'SP' },
]

function setupQueryMocks({
  selectedData = null as { name: string } | null,
  selectedLoading = false,
  searchItems = mockProjects,
  searchTotal = mockProjects.length,
  searchLoading = false,
} = {}) {
  // Usa mockImplementation persistente distinguindo as queries pelo queryKey.
  // mockImplementationOnce se esgota no primeiro render; após click (re-render),
  // a query volta a ser chamada e precisa de resposta consistente.
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'project') {
      return { data: selectedData ?? undefined, isLoading: selectedLoading }
    }
    return { data: { items: searchItems, total: searchTotal }, isLoading: searchLoading }
  })
}

function renderFilter(props: Partial<React.ComponentProps<typeof ProjectFilter>> = {}) {
  const onChange = vi.fn()
  const result = render(
    <TestWrapper>
      <TooltipProvider>
        <ProjectFilter value={null} onChange={onChange} {...props} />
      </TooltipProvider>
    </TestWrapper>
  )
  return { ...result, onChange }
}

describe('ProjectFilter', () => {
  beforeEach(() => {
    mockUseApiClient.mockReturnValue({ client: { GET: vi.fn() } } as ReturnType<
      typeof useApiClient
    >)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('estado fechado — sem valor selecionado', () => {
    it('exibe o placeholder padrão "Empreendimento"', () => {
      setupQueryMocks()
      renderFilter()
      expect(screen.getByText('Empreendimento')).toBeDefined()
    })

    it('aceita placeholder customizado', () => {
      setupQueryMocks()
      renderFilter({ placeholder: 'Filtrar por projeto' })
      expect(screen.getByText('Filtrar por projeto')).toBeDefined()
    })

    it('não exibe o botão de limpar quando value=null', () => {
      setupQueryMocks()
      renderFilter({ value: null })
      expect(screen.queryByRole('button', { name: /limpar filtro/i })).toBeNull()
    })

    it('botão está desabilitado quando disabled=true', () => {
      setupQueryMocks()
      const { container } = renderFilter({ disabled: true })
      const btn = container.querySelector('button[disabled]')
      expect(btn).not.toBeNull()
    })
  })

  describe('estado com valor selecionado', () => {
    it('exibe "Carregando…" enquanto o nome é resolvido', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) =>
        queryKey[0] === 'project'
          ? { data: undefined, isLoading: true }
          : { data: { items: [], total: 0 }, isLoading: false }
      )
      renderFilter({ value: 1 })
      expect(screen.getByText('Carregando…')).toBeDefined()
    })

    it('exibe o nome do empreendimento após resolução', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) =>
        queryKey[0] === 'project'
          ? { data: { name: 'Residencial Costara' }, isLoading: false }
          : { data: { items: [], total: 0 }, isLoading: false }
      )
      renderFilter({ value: 1 })
      expect(screen.getByText('Residencial Costara')).toBeDefined()
    })

    it('exibe o botão de limpar quando value está definido', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) =>
        queryKey[0] === 'project'
          ? { data: { name: 'Residencial Costara' }, isLoading: false }
          : { data: { items: [], total: 0 }, isLoading: false }
      )
      renderFilter({ value: 1 })
      expect(screen.getByRole('button', { name: 'Limpar filtro de empreendimento' })).toBeDefined()
    })

    it('botão de limpar tem aria-label correto', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) =>
        queryKey[0] === 'project'
          ? { data: { name: 'Residencial Costara' }, isLoading: false }
          : { data: { items: [], total: 0 }, isLoading: false }
      )
      renderFilter({ value: 1 })
      const btn = screen.getByRole('button', { name: 'Limpar filtro de empreendimento' })
      expect(btn.getAttribute('aria-label')).toBe('Limpar filtro de empreendimento')
    })

    it('chama onChange(null) ao clicar em limpar', async () => {
      mockUseQuery.mockImplementation(() => ({
        data: { name: 'Residencial Costara' },
        isLoading: false,
      }))
      const { onChange } = renderFilter({ value: 1 })
      const clearBtn = screen.getByRole('button', { name: 'Limpar filtro de empreendimento' })
      await userEvent.click(clearBtn)
      expect(onChange).toHaveBeenCalledWith(null)
    })
  })

  describe('popover aberto — resultados de busca', () => {
    it('exibe os empreendimentos retornados pela query', async () => {
      setupQueryMocks({ searchItems: mockProjects, searchTotal: 2 })
      renderFilter()
      const trigger = screen.getByRole('button', { name: /empreendimento/i })
      await userEvent.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Residencial Costara')).toBeDefined()
        expect(screen.getByText('Jardins Park')).toBeDefined()
      })
    })

    it('exibe cidade e estado quando disponíveis', async () => {
      setupQueryMocks({ searchItems: mockProjects, searchTotal: 2 })
      renderFilter()
      await userEvent.click(screen.getByRole('button', { name: /empreendimento/i }))
      await waitFor(() => {
        expect(screen.getByText('São Paulo, SP')).toBeDefined()
      })
    })

    it('chama onChange com o id ao selecionar um item', async () => {
      setupQueryMocks({ searchItems: mockProjects, searchTotal: 2 })
      const { onChange } = renderFilter()
      await userEvent.click(screen.getByRole('button', { name: /empreendimento/i }))
      await waitFor(() => screen.getByText('Residencial Costara'))
      await userEvent.click(screen.getByText('Residencial Costara'))
      expect(onChange).toHaveBeenCalledWith(1)
    })

    it('exibe dica de resultados parciais quando total > items.length', async () => {
      setupQueryMocks({ searchItems: mockProjects, searchTotal: 50 })
      renderFilter()
      await userEvent.click(screen.getByRole('button', { name: /empreendimento/i }))
      await waitFor(() => {
        expect(screen.getByText(/mostrando os primeiros 2 de 50/i)).toBeDefined()
      })
    })

    it('não exibe dica de resultados parciais quando total === items.length', async () => {
      setupQueryMocks({ searchItems: mockProjects, searchTotal: 2 })
      renderFilter()
      await userEvent.click(screen.getByRole('button', { name: /empreendimento/i }))
      await waitFor(() => screen.getByText('Residencial Costara'))
      expect(screen.queryByText(/mostrando os primeiros/i)).toBeNull()
    })

    it('exibe spinner quando a busca está carregando', async () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) =>
        queryKey[0] === 'project'
          ? { data: undefined, isLoading: false }
          : { data: undefined, isLoading: true }
      )
      renderFilter()
      await userEvent.click(screen.getByRole('button', { name: /empreendimento/i }))
      // O conteúdo do Popover renderiza em portal (document.body), não em container
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeNull()
      })
    })
  })
})
