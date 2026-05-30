import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@cacenot/construct-pro-api-client', () => ({
  useApiClient: vi.fn(),
}))

vi.mock('nuqs', () => ({
  parseAsString: {
    withDefault: vi.fn(() => ({ withDefault: vi.fn() })),
  },
  parseAsInteger: {
    withDefault: vi.fn(() => ({ withDefault: vi.fn() })),
  },
  useQueryStates: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useAgenciesTable } from './use-agencies-table'

const mockUseApiClient = vi.mocked(useApiClient)
const mockUseQuery = vi.mocked(useQuery)
const mockUseQueryStates = vi.mocked(useQueryStates)

const mockSetQueryState = vi.fn()

describe('useAgenciesTable', () => {
  beforeEach(() => {
    mockUseApiClient.mockReturnValue({
      client: { GET: vi.fn() } as unknown as ReturnType<typeof useApiClient>['client'],
    })

    mockUseQueryStates.mockReturnValue([
      { search: '', page: 1 },
      mockSetQueryState,
    ] as unknown as ReturnType<typeof useQueryStates>)

    mockUseQuery.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
    } as unknown as ReturnType<typeof useQuery>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retorna interface correta com dados vazios', async () => {
    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.total).toBe(0)
      expect(result.current.hasActiveFilters).toBe(false)
      expect(typeof result.current.handleClearFilters).toBe('function')
      expect(typeof result.current.filters.setSearch).toBe('function')
      expect(typeof result.current.pagination.setPage).toBe('function')
    })
  })

  it('retorna dados quando query tem resultados', async () => {
    const agencies = [
      { id: 1, legal_name: 'Imobiliária Teste', cnpj: '11222333000181', creci_j: 'CRECI-J SP 1' },
    ]
    mockUseQuery.mockReturnValue({
      data: { items: agencies, total: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useQuery>)

    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      expect(result.current.data).toEqual(agencies)
      expect(result.current.total).toBe(1)
    })
  })

  it('hasActiveFilters é true quando há busca ativa', async () => {
    mockUseQueryStates.mockReturnValue([
      { search: 'imob', page: 1 },
      mockSetQueryState,
    ] as unknown as ReturnType<typeof useQueryStates>)

    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      expect(result.current.hasActiveFilters).toBe(true)
    })
  })

  it('handleClearFilters reseta search e page para valores default', async () => {
    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      result.current.handleClearFilters()
    })

    expect(mockSetQueryState).toHaveBeenCalledWith({ search: '', page: 1 })
  })

  it('isLoading é true quando query está carregando', async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useQuery>)

    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })
  })

  it('paginação calcula totalPages corretamente', async () => {
    mockUseQuery.mockReturnValue({
      data: { items: [], total: 25 },
      isLoading: false,
    } as unknown as ReturnType<typeof useQuery>)

    const { result } = renderHook(() => useAgenciesTable())

    await waitFor(() => {
      expect(result.current.pagination.totalPages).toBe(3)
      expect(result.current.pagination.pageSize).toBe(10)
    })
  })
})
