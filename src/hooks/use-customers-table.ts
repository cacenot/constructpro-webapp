import { type CustomerResponse, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

export type { CustomerResponse }

const PAGE_SIZE = 10
const DEFAULT_SORT = 'id:desc'

export interface CustomersTableFilters {
  search: string
  typeFilter: string
  setSearch: (value: string) => void
  setTypeFilter: (value: string) => void
}

export interface CustomersTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface CustomersTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseCustomersTableReturn {
  data: CustomerResponse[]
  isLoading: boolean
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: CustomersTableFilters
  pagination: CustomersTablePagination
  sort: CustomersTableSort
}

const customersQueryParsers = {
  search: parseAsString.withDefault(''),
  type: parseAsString.withDefault('all'),
  sort: parseAsString.withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(1),
}

export function useCustomersTable(): UseCustomersTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(customersQueryParsers, {
    history: 'push',
  })

  const { search, type: typeFilter, sort, page } = queryState

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
      type?: string[]
      sort_by?: string[]
    } = { page, page_size: PAGE_SIZE }

    if (debouncedSearch) params.search = debouncedSearch
    if (typeFilter !== 'all') params.type = [typeFilter]
    if (sort) params.sort_by = [sort]

    return params
  }, [page, debouncedSearch, typeFilter, sort])

  const { data, isLoading } = useQuery({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      const { data: result, error } = await client.GET('/api/v1/customers', {
        params: { query: queryParams },
      })
      if (error) throw new Error('Falha ao carregar clientes')
      return result
    },
  })

  const customers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!(debouncedSearch || typeFilter !== 'all')

  const handleClearFilters = () => {
    setQueryState({ search: '', type: 'all', sort: DEFAULT_SORT, page: 1 })
  }

  return {
    data: customers,
    isLoading,
    total,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      typeFilter,
      setSearch: (value) => setQueryState({ search: value }),
      setTypeFilter: (value) => setQueryState({ type: value, page: 1 }),
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
