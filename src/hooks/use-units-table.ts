import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteTable } from './use-infinite-table'

type UnitSummaryResponse = components['schemas']['UnitSummaryResponse']

export type { UnitSummaryResponse }

const PAGE_SIZE = 50
const DEFAULT_SORT = 'id:desc'

export interface UnitsTableFilters {
  search: string
  projectFilter: number | null
  setSearch: (value: string) => void
  setProjectFilter: (value: number | null) => void
}

export interface UseUnitsTableReturn {
  data: UnitSummaryResponse[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: UnitsTableFilters
  sort: string
  setSort: (value: string) => void
}

const unitsQueryParsers = {
  search: parseAsString.withDefault(''),
  project: parseAsInteger.withDefault(0),
  sort: parseAsString.withDefault(DEFAULT_SORT),
}

export function useUnitsTable(): UseUnitsTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(unitsQueryParsers, {
    history: 'push',
  })

  const { search, project: projectFilterRaw, sort } = queryState
  const projectFilter = projectFilterRaw === 0 ? null : projectFilterRaw

  // O input atualiza `search` a cada tecla (UI responsiva), mas a busca usa um valor
  // debounced para não refetchar a cada caractere.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: {
      search?: string
      project_id?: number
      sort_by?: string[]
    } = {}

    if (debouncedSearch) params.search = debouncedSearch
    if (projectFilter !== null) params.project_id = projectFilter
    if (sort) params.sort_by = [sort]

    return params
  }, [debouncedSearch, projectFilter, sort])

  const fetchPage = useCallback(
    async (page: number) => {
      const { data, error } = await client.GET('/api/v1/units/summary', {
        params: { query: { ...filterParams, page, page_size: PAGE_SIZE } },
      })
      if (error) throw new Error('Falha ao carregar unidades')
      return { items: data?.items ?? [], total: data?.total ?? 0 }
    },
    [client, filterParams]
  )

  const {
    rows,
    total,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTable<UnitSummaryResponse>({
    queryKey: ['units-summary', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const hasActiveFilters = !!(debouncedSearch || projectFilter !== null)

  const handleClearFilters = () => {
    setQueryState({ search: '', project: 0, sort: DEFAULT_SORT })
  }

  return {
    data: rows,
    isLoading,
    isError,
    refetch: () => {
      refetch()
    },
    total,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      fetchNextPage()
    },
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      projectFilter,
      setSearch: (value) => setQueryState({ search: value }),
      setProjectFilter: (value) => setQueryState({ project: value ?? 0 }),
    },
    sort,
    setSort: (value) => setQueryState({ sort: value }),
  }
}
