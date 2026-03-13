import { useMemo, useState } from 'react'
import type { DateRangeValue } from '@/components/ui/date-range-filter'
import {
  type InstallmentListSummary,
  type InstallmentResponse,
  useInstallmentsSummary,
} from './use-installments'

const PAGE_SIZE = 10

export interface InstallmentsTableFilters {
  statusFilter: string
  kindFilter: string
  dueDateRange: DateRangeValue | null
  setStatusFilter: (value: string) => void
  setKindFilter: (value: string) => void
  setDueDateRange: (value: DateRangeValue | null) => void
}

export interface InstallmentsTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UseInstallmentsTableReturn {
  data: InstallmentResponse[]
  isLoading: boolean
  total: number
  summary: InstallmentListSummary | null
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: InstallmentsTableFilters
  pagination: InstallmentsTablePagination
}

export function useInstallmentsTable(): UseInstallmentsTableReturn {
  const [statusFilter, setStatusFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')
  const [dueDateRange, setDueDateRange] = useState<DateRangeValue | null>(null)
  const [page, setPage] = useState(1)

  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      status?: string[]
      kind?: string[]
      'due_date[min]'?: string
      'due_date[max]'?: string
      sort_by?: string[]
    } = { page, page_size: PAGE_SIZE, sort_by: ['due_date:asc'] }

    if (statusFilter !== 'all') params.status = [statusFilter]
    if (kindFilter !== 'all') params.kind = [kindFilter]
    if (dueDateRange?.min) params['due_date[min]'] = dueDateRange.min
    if (dueDateRange?.max) params['due_date[max]'] = dueDateRange.max

    return params
  }, [page, statusFilter, kindFilter, dueDateRange])

  const { data, isLoading } = useInstallmentsSummary(queryParams)

  const installments = data?.items ?? []
  const total = data?.total ?? 0
  const summary = data?.summary ?? null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!(statusFilter !== 'all' || kindFilter !== 'all' || dueDateRange)

  const handleClearFilters = () => {
    setStatusFilter('all')
    setKindFilter('all')
    setDueDateRange(null)
    setPage(1)
  }

  return {
    data: installments,
    isLoading,
    total,
    summary,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      statusFilter,
      kindFilter,
      dueDateRange,
      setStatusFilter: (value) => {
        setStatusFilter(value)
        setPage(1)
      },
      setKindFilter: (value) => {
        setKindFilter(value)
        setPage(1)
      },
      setDueDateRange: (value) => {
        setDueDateRange(value)
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
