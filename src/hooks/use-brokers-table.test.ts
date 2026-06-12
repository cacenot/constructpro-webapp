import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@cacenot/construct-pro-api-client', () => ({
  useApiClient: vi.fn(),
}))

vi.mock('nuqs', () => ({
  parseAsString: {
    withDefault: vi.fn(() => ({ withDefault: vi.fn() })),
  },
  useQueryStates: vi.fn(),
}))

vi.mock('./use-infinite-table', () => ({
  useInfiniteTable: vi.fn(),
}))

import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQueryStates } from 'nuqs'
import { useBrokersTable } from './use-brokers-table'
import { useInfiniteTable } from './use-infinite-table'

const mockUseApiClient = vi.mocked(useApiClient)
const mockUseQueryStates = vi.mocked(useQueryStates)
const mockUseInfiniteTable = vi.mocked(useInfiniteTable)

const mockSetQueryState = vi.fn()

function infiniteReturn(overrides: Partial<ReturnType<typeof useInfiniteTable>> = {}) {
  return {
    rows: [],
    total: 0,
    firstResponse: undefined,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    error: null,
    refetch: vi.fn(),
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useInfiniteTable>
}

describe('useBrokersTable', () => {
  beforeEach(() => {
    mockUseApiClient.mockReturnValue({
      client: { GET: vi.fn() } as unknown as ReturnType<typeof useApiClient>['client'],
    })

    mockUseQueryStates.mockReturnValue([{ search: '' }, mockSetQueryState] as unknown as ReturnType<
      typeof useQueryStates
    >)

    mockUseInfiniteTable.mockReturnValue(infiniteReturn())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retorna a interface de scroll infinito (sem pagination)', async () => {
    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.total).toBe(0)
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.hasActiveFilters).toBe(false)
      expect(typeof result.current.fetchNextPage).toBe('function')
      expect(typeof result.current.handleClearFilters).toBe('function')
      expect(typeof result.current.filters.setSearch).toBe('function')
    })
    // A forma antiga (pagination) não existe mais.
    expect('pagination' in result.current).toBe(false)
  })

  it('expõe rows e total vindos do useInfiniteTable', async () => {
    const brokers = [{ id: 1, full_name: 'João Silva', cpf: '52998224725', creci: 'CRECI-SP 1234' }]
    mockUseInfiniteTable.mockReturnValue(infiniteReturn({ rows: brokers as never, total: 1 }))

    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      expect(result.current.data).toEqual(brokers)
      expect(result.current.total).toBe(1)
    })
  })

  it('hasActiveFilters é true quando há busca ativa', async () => {
    mockUseQueryStates.mockReturnValue([
      { search: 'joão' },
      mockSetQueryState,
    ] as unknown as ReturnType<typeof useQueryStates>)

    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      expect(result.current.hasActiveFilters).toBe(true)
    })
  })

  it('handleClearFilters reseta apenas a busca', async () => {
    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      result.current.handleClearFilters()
    })

    expect(mockSetQueryState).toHaveBeenCalledWith({ search: '' })
  })

  it('setSearch grava o termo de busca no query state', async () => {
    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      result.current.filters.setSearch('maria')
    })

    expect(mockSetQueryState).toHaveBeenCalledWith({ search: 'maria' })
  })

  it('isLoading reflete o estado do useInfiniteTable', async () => {
    mockUseInfiniteTable.mockReturnValue(infiniteReturn({ isLoading: true }))

    const { result } = renderHook(() => useBrokersTable())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })
  })
})
