import { useApiClient } from '@cacenot/construct-pro-api-client'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import type { CustomerFilterValue } from '@/components/ui/customer-filter'
import { computeDateRangePreset, type DateRangeValue } from '@/components/ui/date-range-filter'
import { useInfiniteTable } from './use-infinite-table'
import {
  type InstallmentListSummary,
  type InstallmentSummaryItemResponse,
  type InstallmentsQuery,
  installmentKeys,
} from './use-installments'

const PAGE_SIZE = 20
const DEFAULT_SORT = 'due_date:asc'
// Sem filtro de vencimento por padrão: o console abre sobre a carteira inteira
// (o Pulso agrega toda a base; os deep-links do dashboard chegam por cima deste default).
// O usuário recorta a partir daí.
const DEFAULT_DUE_PRESET = ''

export interface InstallmentsTableFilters {
  statusFilter: string[]
  kindFilter: string[]
  paymentMethodFilter: string[]
  overdueOnly: boolean
  dueDateRange: DateRangeValue | null
  paidAtRange: DateRangeValue | null
  customerFilter: CustomerFilterValue | null
  projectFilter: number | null
  setStatusFilter: (value: string[]) => void
  setKindFilter: (value: string[]) => void
  setPaymentMethodFilter: (value: string[]) => void
  setOverdueOnly: (value: boolean) => void
  setDueDateRange: (value: DateRangeValue | null) => void
  setPaidAtRange: (value: DateRangeValue | null) => void
  setCustomerFilter: (value: CustomerFilterValue | null) => void
  setProjectFilter: (value: number | null) => void
}

export interface InstallmentsTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseInstallmentsTableReturn {
  data: InstallmentSummaryItemResponse[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  summary: InstallmentListSummary | null
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: InstallmentsTableFilters
  sort: InstallmentsTableSort
  selectedInstallmentId: string
  setSelectedInstallmentId: (id: string) => void
}

const installmentsQueryParsers = {
  status: parseAsString.withDefault(''),
  kind: parseAsString.withDefault(''),
  method: parseAsString.withDefault(''),
  overdue: parseAsString.withDefault(''),
  duePreset: parseAsString.withDefault(DEFAULT_DUE_PRESET),
  dueMin: parseAsString.withDefault(''),
  dueMax: parseAsString.withDefault(''),
  paidPreset: parseAsString.withDefault(''),
  paidMin: parseAsString.withDefault(''),
  paidMax: parseAsString.withDefault(''),
  customer: parseAsInteger.withDefault(0),
  customerName: parseAsString.withDefault(''),
  project: parseAsInteger.withDefault(0),
  sort: parseAsString.withDefault(DEFAULT_SORT),
  parcela: parseAsString.withDefault(''),
}

function csvToArray(s: string): string[] {
  return s ? s.split(',').filter(Boolean) : []
}
function arrayToCsv(arr: string[]): string {
  return arr.join(',')
}

function buildDateRange(preset: string, min: string, max: string): DateRangeValue | null {
  if (!preset) return null
  if (preset === 'custom') {
    return { preset: 'custom', min, max }
  }
  return computeDateRangePreset(preset)
}

export function useInstallmentsTable(): UseInstallmentsTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(installmentsQueryParsers, {
    history: 'push',
  })

  const {
    status,
    kind,
    method,
    overdue,
    duePreset,
    dueMin,
    dueMax,
    paidPreset,
    paidMin,
    paidMax,
    customer,
    customerName,
    project,
    sort,
    parcela,
  } = queryState

  const statusFilter = useMemo(() => csvToArray(status), [status])
  const kindFilter = useMemo(() => csvToArray(kind), [kind])
  const paymentMethodFilter = useMemo(() => csvToArray(method), [method])
  const overdueOnly = overdue === 'true'
  const dueDateRange = useMemo(
    () => buildDateRange(duePreset, dueMin, dueMax),
    [duePreset, dueMin, dueMax]
  )
  const paidAtRange = useMemo(
    () => buildDateRange(paidPreset, paidMin, paidMax),
    [paidPreset, paidMin, paidMax]
  )
  const customerFilter: CustomerFilterValue | null = useMemo(
    () => (customer > 0 && customerName ? { id: customer, full_name: customerName } : null),
    [customer, customerName]
  )
  const projectFilter = project > 0 ? project : null

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: InstallmentsQuery = {}

    if (statusFilter.length > 0)
      params.status = statusFilter as NonNullable<InstallmentsQuery['status']>
    if (kindFilter.length > 0) params.kind = kindFilter as NonNullable<InstallmentsQuery['kind']>
    if (paymentMethodFilter.length > 0)
      params.payment_method = paymentMethodFilter as NonNullable<
        InstallmentsQuery['payment_method']
      >

    if (dueDateRange?.min) params['due_date[min]'] = dueDateRange.min
    if (dueDateRange?.max) params['due_date[max]'] = dueDateRange.max
    if (paidAtRange?.min) params['paid_at[min]'] = paidAtRange.min
    if (paidAtRange?.max) params['paid_at[max]'] = paidAtRange.max

    // "Em atraso": filtro nativo do backend (construct-pro-api #145) — due_date < hoje
    // ∧ não-cancelada ∧ restante > 0, combinável com os demais filtros e reconciliando
    // com `overdue_count` do summary. O back é a verdade; sem fallback derivado.
    if (overdueOnly) params.overdue = true

    if (customer > 0) params.customer_id = customer
    if (project > 0) params.project_id = project
    if (sort) params.sort_by = [sort]

    return params
  }, [
    statusFilter,
    kindFilter,
    paymentMethodFilter,
    overdueOnly,
    dueDateRange,
    paidAtRange,
    customer,
    project,
    sort,
  ])

  const fetchPage = useCallback(
    async (page: number) => {
      const { data, error } = await client.GET('/api/v1/installments/summary', {
        params: { query: { ...filterParams, page, page_size: PAGE_SIZE } },
      })
      if (error) throw new Error('Falha ao carregar parcelas')
      return {
        items: data?.items ?? [],
        total: data?.total ?? 0,
        response: data?.summary ?? null,
      }
    },
    [client, filterParams]
  )

  const {
    rows,
    total,
    firstResponse,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteTable<InstallmentSummaryItemResponse, InstallmentListSummary | null>({
    queryKey: installmentKeys.summary(filterParams),
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const summary = firstResponse ?? null

  const hasActiveFilters = !!(
    statusFilter.length > 0 ||
    kindFilter.length > 0 ||
    paymentMethodFilter.length > 0 ||
    overdueOnly ||
    (duePreset && duePreset !== DEFAULT_DUE_PRESET) ||
    paidPreset ||
    customer > 0 ||
    project > 0
  )

  const handleClearFilters = () => {
    setQueryState({
      status: '',
      kind: '',
      method: '',
      overdue: '',
      duePreset: DEFAULT_DUE_PRESET,
      dueMin: '',
      dueMax: '',
      paidPreset: '',
      paidMin: '',
      paidMax: '',
      customer: 0,
      customerName: '',
      project: 0,
      sort: DEFAULT_SORT,
    })
  }

  const setDateRange =
    (
      presetKey: 'duePreset' | 'paidPreset',
      minKey: 'dueMin' | 'paidMin',
      maxKey: 'dueMax' | 'paidMax'
    ) =>
    (value: DateRangeValue | null) => {
      if (!value) {
        setQueryState({ [presetKey]: '', [minKey]: '', [maxKey]: '' })
      } else {
        setQueryState({
          [presetKey]: value.preset,
          [minKey]: value.preset === 'custom' ? value.min : '',
          [maxKey]: value.preset === 'custom' ? value.max : '',
        })
      }
    }

  // Estável (setQueryState do nuqs é estável): permite useCallback a jusante e
  // preserva a memoização por linha da tabela (DataTableRow).
  const setSelectedInstallmentId = useCallback(
    (id: string) => {
      setQueryState({ parcela: id })
    },
    [setQueryState]
  )

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
    summary,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      statusFilter,
      kindFilter,
      paymentMethodFilter,
      overdueOnly,
      dueDateRange,
      paidAtRange,
      customerFilter,
      projectFilter,
      setStatusFilter: (value) => setQueryState({ status: arrayToCsv(value) }),
      setKindFilter: (value) => setQueryState({ kind: arrayToCsv(value) }),
      setPaymentMethodFilter: (value) => setQueryState({ method: arrayToCsv(value) }),
      setOverdueOnly: (value) => setQueryState({ overdue: value ? 'true' : '' }),
      setDueDateRange: setDateRange('duePreset', 'dueMin', 'dueMax'),
      setPaidAtRange: setDateRange('paidPreset', 'paidMin', 'paidMax'),
      setCustomerFilter: (value) => {
        if (!value) {
          setQueryState({ customer: 0, customerName: '' })
        } else {
          setQueryState({ customer: value.id, customerName: value.full_name })
        }
      },
      setProjectFilter: (value) => setQueryState({ project: value ?? 0 }),
    },
    sort: {
      sort,
      setSort: (value) => setQueryState({ sort: value }),
    },
    selectedInstallmentId: parcela,
    setSelectedInstallmentId,
  }
}
