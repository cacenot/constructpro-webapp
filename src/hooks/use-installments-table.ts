import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import type { CustomerFilterValue } from '@/components/ui/customer-filter'
import { computeDateRangePreset, type DateRangeValue } from '@/components/ui/date-range-filter'
import {
  type InstallmentListSummary,
  type InstallmentSummaryItemResponse,
  useInstallmentsSummary,
} from './use-installments'

const PAGE_SIZE = 10
const DEFAULT_SORT = 'due_date:asc'
const DEFAULT_DUE_PRESET = 'thisMonth'

export interface InstallmentsTableFilters {
  statusFilter: string[]
  kindFilter: string[]
  dueDateRange: DateRangeValue | null
  customerFilter: CustomerFilterValue | null
  setStatusFilter: (value: string[]) => void
  setKindFilter: (value: string[]) => void
  setDueDateRange: (value: DateRangeValue | null) => void
  setCustomerFilter: (value: CustomerFilterValue | null) => void
}

export interface InstallmentsTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface InstallmentsTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseInstallmentsTableReturn {
  data: InstallmentSummaryItemResponse[]
  isLoading: boolean
  total: number
  summary: InstallmentListSummary | null
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: InstallmentsTableFilters
  pagination: InstallmentsTablePagination
  sort: InstallmentsTableSort
  selectedInstallmentId: string
  setSelectedInstallmentId: (id: string) => void
}

const installmentsQueryParsers = {
  status: parseAsString.withDefault(''),
  kind: parseAsString.withDefault(''),
  duePreset: parseAsString.withDefault(DEFAULT_DUE_PRESET),
  dueMin: parseAsString.withDefault(''),
  dueMax: parseAsString.withDefault(''),
  customer: parseAsInteger.withDefault(0),
  customerName: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(1),
  parcela: parseAsString.withDefault(''),
}

function statusToArray(s: string): string[] {
  return s ? s.split(',').filter(Boolean) : []
}
function arrayToStatus(arr: string[]): string {
  return arr.join(',')
}

function buildDueDateRange(preset: string, min: string, max: string): DateRangeValue | null {
  if (!preset) return null
  if (preset === 'custom') {
    return { preset: 'custom', min, max }
  }
  return computeDateRangePreset(preset)
}

export function useInstallmentsTable(): UseInstallmentsTableReturn {
  const [queryState, setQueryState] = useQueryStates(installmentsQueryParsers, {
    history: 'push',
  })

  const { status, kind, duePreset, dueMin, dueMax, customer, customerName, sort, page, parcela } =
    queryState

  const statusFilter = useMemo(() => statusToArray(status), [status])
  const kindFilter = useMemo(() => statusToArray(kind), [kind])
  const dueDateRange = useMemo(
    () => buildDueDateRange(duePreset, dueMin, dueMax),
    [duePreset, dueMin, dueMax]
  )
  const customerFilter: CustomerFilterValue | null = useMemo(
    () => (customer > 0 && customerName ? { id: customer, full_name: customerName } : null),
    [customer, customerName]
  )

  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      status?: string[]
      kind?: string[]
      'due_date[min]'?: string
      'due_date[max]'?: string
      customer_id?: number
      sort_by?: string[]
    } = { page, page_size: PAGE_SIZE }

    if (statusFilter.length > 0) params.status = statusFilter
    if (kindFilter.length > 0) params.kind = kindFilter

    const effectiveDueDate = dueDateRange
    if (effectiveDueDate?.min) params['due_date[min]'] = effectiveDueDate.min
    if (effectiveDueDate?.max) params['due_date[max]'] = effectiveDueDate.max
    if (customer > 0) params.customer_id = customer
    if (sort) params.sort_by = [sort]

    return params
  }, [page, statusFilter, kindFilter, dueDateRange, customer, sort])

  const { data, isLoading } = useInstallmentsSummary(queryParams)

  const installments = data?.items ?? []
  const total = data?.total ?? 0
  const summary = data?.summary ?? null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!(
    statusFilter.length > 0 ||
    kindFilter.length > 0 ||
    (duePreset && duePreset !== DEFAULT_DUE_PRESET) ||
    customer > 0
  )

  const handleClearFilters = () => {
    setQueryState({
      status: '',
      kind: '',
      duePreset: DEFAULT_DUE_PRESET,
      dueMin: '',
      dueMax: '',
      customer: 0,
      customerName: '',
      sort: DEFAULT_SORT,
      page: 1,
    })
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
      customerFilter,
      setStatusFilter: (value) => setQueryState({ status: arrayToStatus(value), page: 1 }),
      setKindFilter: (value) => setQueryState({ kind: arrayToStatus(value), page: 1 }),
      setDueDateRange: (value) => {
        if (!value) {
          setQueryState({ duePreset: '', dueMin: '', dueMax: '', page: 1 })
        } else {
          setQueryState({
            duePreset: value.preset,
            dueMin: value.preset === 'custom' ? value.min : '',
            dueMax: value.preset === 'custom' ? value.max : '',
            page: 1,
          })
        }
      },
      setCustomerFilter: (value) => {
        if (!value) {
          setQueryState({ customer: 0, customerName: '', page: 1 })
        } else {
          setQueryState({ customer: value.id, customerName: value.full_name, page: 1 })
        }
      },
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
    selectedInstallmentId: parcela,
    setSelectedInstallmentId: (id: string) => setQueryState({ parcela: id }),
  }
}
