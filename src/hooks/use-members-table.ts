import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

export type UserResponse = components['schemas']['UserResponse']

const PAGE_SIZE = 10
const DEFAULT_SORT = 'created_at:desc'

export interface MembersTableFilters {
  search: string
  setSearch: (value: string) => void
}

export interface MembersTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface MembersTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseMembersTableReturn {
  data: UserResponse[]
  isLoading: boolean
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: MembersTableFilters
  pagination: MembersTablePagination
  sort: MembersTableSort
}

const membersQueryParsers = {
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(1),
}

export function useMembersTable(): UseMembersTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(membersQueryParsers, {
    history: 'push',
  })

  const { search, sort, page } = queryState

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
      sort_by?: string[]
    } = { page, page_size: PAGE_SIZE }

    if (debouncedSearch) params.search = debouncedSearch
    if (sort) params.sort_by = [sort]

    return params
  }, [page, debouncedSearch, sort])

  const { data, isLoading } = useQuery({
    queryKey: ['members', queryParams],
    queryFn: async () => {
      const { data: result, error } = await client.GET('/api/v1/users', {
        params: { query: queryParams },
      })
      if (error) throw new Error('Falha ao carregar membros')
      return result
    },
  })

  const members = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!debouncedSearch

  const handleClearFilters = () => {
    setQueryState({ search: '', sort: DEFAULT_SORT, page: 1 })
  }

  return {
    data: members,
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
    sort: {
      sort,
      setSort: (value) => setQueryState({ sort: value, page: 1 }),
    },
  }
}
