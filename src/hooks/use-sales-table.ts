import { type components, useSales } from '@cacenot/construct-pro-api-client'

type SaleResponse = components['schemas']['SaleResponse']

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

const PAGE_SIZE = 10

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

export interface SalesTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UseSalesTableReturn {
  data: SaleResponse[]
  isLoading: boolean
  total: number
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: SalesTableFilters
  pagination: SalesTablePagination
}

export function useSalesTable(): UseSalesTableReturn {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [onlyMySales, setOnlyMySales] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      search?: string
      status?: string[]
      user_id?: string
    } = { page, page_size: PAGE_SIZE }

    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = [statusFilter]
    if (onlyMySales && user) params.user_id = user.uid

    return params
  }, [page, debouncedSearch, statusFilter, onlyMySales, user])

  const { data, isLoading } = useSales(queryParams)

  const sales = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
    setPage(1)
  }

  return {
    data: sales,
    isLoading,
    total,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      statusFilter,
      periodFilter,
      onlyMySales,
      setSearch,
      setStatusFilter: (value) => {
        setStatusFilter(value)
        setPage(1)
      },
      setPeriodFilter: (value) => {
        setPeriodFilter(value)
        setPage(1)
      },
      setOnlyMySales: (value) => {
        setOnlyMySales(value)
        setPage(1)
      },
    },
    pagination: {
      page,
      totalPages,
      total,
      pageSize: PAGE_SIZE,
      isLoading,
      setPage,
    },
  }
}
