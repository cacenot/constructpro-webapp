import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'

type UnitSummaryResponse = components['schemas']['UnitSummaryResponse']

import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

export type { UnitSummaryResponse }

const PAGE_SIZE = 10
const DEFAULT_SORT = 'id:desc'

export interface UnitsTableFilters {
  search: string
  projectFilter: number | null
  setSearch: (value: string) => void
  setProjectFilter: (value: number | null) => void
}

export interface UnitsTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UnitsTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseUnitsTableReturn {
  data: UnitSummaryResponse[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: UnitsTableFilters
  pagination: UnitsTablePagination
  sort: UnitsTableSort
}

const unitsQueryParsers = {
  search: parseAsString.withDefault(''),
  project: parseAsInteger.withDefault(0),
  sort: parseAsString.withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(1),
}

export function useUnitsTable(): UseUnitsTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(unitsQueryParsers, {
    history: 'push',
  })

  const { search, project: projectFilterRaw, sort, page } = queryState
  const projectFilter = projectFilterRaw === 0 ? null : projectFilterRaw

  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setQueryState({ page: 1 })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, setQueryState])

  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      search?: string
      project_id?: number
      sort_by?: string[]
    } = { page, page_size: PAGE_SIZE }

    if (debouncedSearch) params.search = debouncedSearch
    if (projectFilter !== null) params.project_id = projectFilter
    if (sort) params.sort_by = [sort]

    return params
  }, [page, debouncedSearch, projectFilter, sort])

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['units-summary', queryParams],
    queryFn: async () => {
      const { data: result, error } = await client.GET('/api/v1/units/summary', {
        params: { query: queryParams },
      })
      if (error) throw new Error('Falha ao carregar unidades')
      return result
    },
  })

  const units = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!(debouncedSearch || projectFilter !== null)

  const handleClearFilters = () => {
    setQueryState({ search: '', project: 0, sort: DEFAULT_SORT, page: 1 })
  }

  return {
    data: units,
    isLoading,
    isFetching,
    isError,
    refetch,
    total,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      projectFilter,
      setSearch: (value) => setQueryState({ search: value }),
      setProjectFilter: (value) => setQueryState({ project: value ?? 0, page: 1 }),
    },
    pagination: {
      page,
      totalPages,
      total,
      pageSize: PAGE_SIZE,
      isLoading,
      setPage: (value) => setQueryState({ page: value }),
    },
    sort: {
      sort,
      setSort: (value) => setQueryState({ sort: value, page: 1 }),
    },
  }
}
