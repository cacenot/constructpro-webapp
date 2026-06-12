import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { SaleSummaryResponse } from '@/hooks/use-sales-summary'
import { useInfiniteTable } from './use-infinite-table'

const PAGE_SIZE = 50

export interface SalesTableFilters {
  search: string
  statusFilter: string
  periodFilter: string
  onlyMySales: boolean
  setSearch: (value: string) => void
  setStatusFilter: (value: string) => void
  setPeriodFilter: (value: string) => void
  setOnlyMySales: (value: boolean) => void
}

export interface UseSalesTableReturn {
  data: SaleSummaryResponse[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: SalesTableFilters
}

type SaleStatusFilter = 'closed' | 'pending_signature' | 'pending_payment' | 'lost' | 'proposal'

// Tipagem solta espelhando o contrato de `useSalesSummary`: `search`/`user_id` não
// constam da operação OpenAPI mas o backend os consome — passar como objeto tipado
// (não literal inline) é aceito pelo openapi-fetch, igual ao hook de summary.
interface SalesSummaryQuery {
  page?: number
  page_size?: number
  search?: string
  status?: SaleStatusFilter[]
  user_id?: string
}

export function useSalesTable(): UseSalesTableReturn {
  const { client } = useApiClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [onlyMySales, setOnlyMySales] = useState(false)

  // O input atualiza `search` a cada tecla (UI responsiva), mas a busca usa um valor
  // debounced para não refetchar a cada caractere.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: SalesSummaryQuery = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = [statusFilter as SaleStatusFilter]
    if (onlyMySales && user) params.user_id = user.uid
    return params
  }, [debouncedSearch, statusFilter, onlyMySales, user])

  const fetchPage = useCallback(
    async (page: number) => {
      const query: SalesSummaryQuery = { ...filterParams, page, page_size: PAGE_SIZE }
      const { data, error } = await client.GET('/api/v1/sales/summary', {
        params: { query },
      })
      if (error) throw new Error('Falha ao carregar vendas')
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
  } = useInfiniteTable<SaleSummaryResponse>({
    queryKey: ['sales-table', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const hasActiveFilters = !!(
    search ||
    statusFilter !== 'all' ||
    periodFilter !== 'all' ||
    onlyMySales
  )

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPeriodFilter('all')
    setOnlyMySales(false)
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
      statusFilter,
      periodFilter,
      onlyMySales,
      setSearch,
      setStatusFilter,
      setPeriodFilter,
      setOnlyMySales,
    },
  }
}
