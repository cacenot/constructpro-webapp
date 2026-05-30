import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

type BrokerResponse = components['schemas']['BrokerResponse']

export type { BrokerResponse }

const PAGE_SIZE = 10

export interface BrokersTableFilters {
  search: string
  setSearch: (value: string) => void
}

export interface BrokersTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UseBrokersTableReturn {
  data: BrokerResponse[]
  isLoading: boolean
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: BrokersTableFilters
  pagination: BrokersTablePagination
}

const brokersQueryParsers = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
}

export function useBrokersTable(): UseBrokersTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(brokersQueryParsers, {
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
    queryKey: ['brokers', queryParams],
    queryFn: async () => {
      const { data: result, error } = await client.GET('/api/v1/brokers', {
        params: { query: queryParams },
      })
      if (error) throw new Error('Falha ao carregar corretores')
      return result
    },
  })

  const brokers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!debouncedSearch

  const handleClearFilters = () => {
    setQueryState({ search: '', page: 1 })
  }

  return {
    data: brokers,
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
