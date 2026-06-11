import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteTable } from './use-infinite-table'

type BrokerResponse = components['schemas']['BrokerResponse']

export type { BrokerResponse }

const PAGE_SIZE = 20

export interface BrokersTableFilters {
  search: string
  setSearch: (value: string) => void
}

export interface UseBrokersTableReturn {
  data: BrokerResponse[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: BrokersTableFilters
}

const brokersQueryParsers = {
  search: parseAsString.withDefault(''),
}

export function useBrokersTable(): UseBrokersTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(brokersQueryParsers, {
    history: 'push',
  })

  const { search } = queryState

  // O input atualiza `search` a cada tecla (UI responsiva), mas a busca usa um valor
  // debounced para não refetchar a cada caractere.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: { search?: string } = {}
    if (debouncedSearch) params.search = debouncedSearch
    return params
  }, [debouncedSearch])

  const fetchPage = useCallback(
    async (page: number) => {
      const { data, error } = await client.GET('/api/v1/brokers', {
        params: { query: { ...filterParams, page, page_size: PAGE_SIZE } },
      })
      if (error) throw new Error('Falha ao carregar corretores')
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
  } = useInfiniteTable<BrokerResponse>({
    queryKey: ['brokers', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const hasActiveFilters = !!debouncedSearch

  const handleClearFilters = () => {
    setQueryState({ search: '' })
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
      setSearch: (value) => setQueryState({ search: value }),
    },
  }
}
