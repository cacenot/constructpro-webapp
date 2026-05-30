import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

type AgencyResponse = components['schemas']['AgencyResponse']

export type { AgencyResponse }

const PAGE_SIZE = 10

export interface AgenciesTableFilters {
  search: string
  setSearch: (value: string) => void
}

export interface AgenciesTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UseAgenciesTableReturn {
  data: AgencyResponse[]
  isLoading: boolean
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: AgenciesTableFilters
  pagination: AgenciesTablePagination
}

const agenciesQueryParsers = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
}

export function useAgenciesTable(): UseAgenciesTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(agenciesQueryParsers, {
    history: 'push',
  })

  const { search, page } = queryState

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
    } = { page, page_size: PAGE_SIZE }

    if (debouncedSearch) params.search = debouncedSearch

    return params
  }, [page, debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['agencies', queryParams],
    queryFn: async () => {
      const { data: result, error } = await client.GET('/api/v1/agencies', {
        params: { query: queryParams },
      })
      if (error) throw new Error('Falha ao carregar imobiliárias')
      return result
    },
  })

  const agencies = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!debouncedSearch

  const handleClearFilters = () => {
    setQueryState({ search: '', page: 1 })
  }

  return {
    data: agencies,
    isLoading,
    total,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      setSearch: (value) => setQueryState({ search: value }),
    },
    pagination: {
      page,
      totalPages,
      total,
      pageSize: PAGE_SIZE,
      isLoading,
      setPage: (value) => setQueryState({ page: value }),
    },
  }
}
