import { endOfMonth, format, parseISO, subDays } from 'date-fns'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import type { CustomerFilterValue } from '@/components/ui/customer-filter'
import { computeDateRangePreset, type DateRangeValue } from '@/components/ui/date-range-filter'
import {
  type InstallmentListSummary,
  type InstallmentSummaryItemResponse,
  type InstallmentsQuery,
  useInstallmentsSummary,
} from './use-installments'

const PAGE_SIZE = 10
const DEFAULT_SORT = 'due_date:asc'
// Sem filtro de vencimento por padrão: o console abre sobre a carteira inteira
// (Pulso e Aging agregam toda a base). O usuário recorta a partir daí.
const DEFAULT_DUE_PRESET = ''
const DEFAULT_TAB = 'resumo'

/** Faixas de envelhecimento da inadimplência (espelham InstallmentAging do backend). */
export type AgingBucketKey = 'not_due' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_plus'

// Parcelas com saldo em aberto (não pagas, não canceladas) — o recorte que o
// aging mede. Usado no cross-filter de uma faixa para a tabela.
const OPEN_STATUSES = 'scheduled,invoiced,partial'

/** Traduz a faixa de aging em intervalo de vencimento (due_date) relativo a hoje. */
function agingDueRange(bucket: AgingBucketKey): { min: string; max: string } {
  const today = new Date()
  const fmt = (date: Date) => format(date, 'yyyy-MM-dd')
  switch (bucket) {
    case 'not_due':
      return { min: fmt(today), max: '' }
    case 'd1_30':
      return { min: fmt(subDays(today, 30)), max: fmt(subDays(today, 1)) }
    case 'd31_60':
      return { min: fmt(subDays(today, 60)), max: fmt(subDays(today, 31)) }
    case 'd61_90':
      return { min: fmt(subDays(today, 90)), max: fmt(subDays(today, 61)) }
    case 'd90_plus':
      return { min: '', max: fmt(subDays(today, 91)) }
  }
}

export interface InstallmentsTableFilters {
  statusFilter: string[]
  kindFilter: string[]
  paymentMethodFilter: string[]
  dueDateRange: DateRangeValue | null
  paidAtRange: DateRangeValue | null
  customerFilter: CustomerFilterValue | null
  projectFilter: number | null
  setStatusFilter: (value: string[]) => void
  setKindFilter: (value: string[]) => void
  setPaymentMethodFilter: (value: string[]) => void
  setDueDateRange: (value: DateRangeValue | null) => void
  setPaidAtRange: (value: DateRangeValue | null) => void
  setCustomerFilter: (value: CustomerFilterValue | null) => void
  setProjectFilter: (value: number | null) => void
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

export interface InstallmentsTableView {
  tab: string
  setTab: (value: string) => void
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
  view: InstallmentsTableView
  queryParams: InstallmentsQuery
  applyAgingBucket: (bucket: AgingBucketKey) => void
  applyMonthFilter: (monthIso: string) => void
  applyProjectFilter: (projectId: number) => void
  selectedInstallmentId: string
  setSelectedInstallmentId: (id: string) => void
}

const installmentsQueryParsers = {
  status: parseAsString.withDefault(''),
  kind: parseAsString.withDefault(''),
  method: parseAsString.withDefault(''),
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
  tab: parseAsString.withDefault(DEFAULT_TAB),
  page: parseAsInteger.withDefault(1),
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
  const [queryState, setQueryState] = useQueryStates(installmentsQueryParsers, {
    history: 'push',
  })

  const {
    status,
    kind,
    method,
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
    tab,
    page,
    parcela,
  } = queryState

  const statusFilter = useMemo(() => csvToArray(status), [status])
  const kindFilter = useMemo(() => csvToArray(kind), [kind])
  const paymentMethodFilter = useMemo(() => csvToArray(method), [method])
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

  const queryParams = useMemo(() => {
    const params: InstallmentsQuery = { page, page_size: PAGE_SIZE }

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
    if (customer > 0) params.customer_id = customer
    if (project > 0) params.project_id = project
    if (sort) params.sort_by = [sort]

    return params
  }, [
    page,
    statusFilter,
    kindFilter,
    paymentMethodFilter,
    dueDateRange,
    paidAtRange,
    customer,
    project,
    sort,
  ])

  const { data, isLoading } = useInstallmentsSummary(queryParams)

  const installments = data?.items ?? []
  const total = data?.total ?? 0
  const summary = data?.summary ?? null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasActiveFilters = !!(
    statusFilter.length > 0 ||
    kindFilter.length > 0 ||
    paymentMethodFilter.length > 0 ||
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
      page: 1,
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
        setQueryState({ [presetKey]: '', [minKey]: '', [maxKey]: '', page: 1 })
      } else {
        setQueryState({
          [presetKey]: value.preset,
          [minKey]: value.preset === 'custom' ? value.min : '',
          [maxKey]: value.preset === 'custom' ? value.max : '',
          page: 1,
        })
      }
    }

  // Cross-filter: clicar numa faixa de aging recorta a aba Parcelas para as
  // parcelas em aberto daquela idade (intervalo de vencimento + status abertos).
  const applyAgingBucket = (bucket: AgingBucketKey) => {
    const { min, max } = agingDueRange(bucket)
    setQueryState({
      tab: 'parcelas',
      status: OPEN_STATUSES,
      duePreset: 'custom',
      dueMin: min,
      dueMax: max,
      page: 1,
    })
  }

  // Cross-filter: clicar num mês do fluxo de caixa recorta a aba Parcelas para
  // todas as parcelas que vencem naquele mês (sem recorte de status: recebidas
  // e a receber, para reconciliar com as duas barras do gráfico).
  const applyMonthFilter = (monthIso: string) => {
    const start = parseISO(monthIso)
    setQueryState({
      tab: 'parcelas',
      status: '',
      duePreset: 'custom',
      dueMin: format(start, 'yyyy-MM-dd'),
      dueMax: format(endOfMonth(start), 'yyyy-MM-dd'),
      page: 1,
    })
  }

  // Cross-filter: clicar num empreendimento recorta a aba Parcelas para a carteira
  // daquele projeto (dimensão ortogonal, não mexe nos demais filtros ativos).
  const applyProjectFilter = (projectId: number) => {
    setQueryState({ tab: 'parcelas', project: projectId, page: 1 })
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
      paymentMethodFilter,
      dueDateRange,
      paidAtRange,
      customerFilter,
      projectFilter,
      setStatusFilter: (value) => setQueryState({ status: arrayToCsv(value), page: 1 }),
      setKindFilter: (value) => setQueryState({ kind: arrayToCsv(value), page: 1 }),
      setPaymentMethodFilter: (value) => setQueryState({ method: arrayToCsv(value), page: 1 }),
      setDueDateRange: setDateRange('duePreset', 'dueMin', 'dueMax'),
      setPaidAtRange: setDateRange('paidPreset', 'paidMin', 'paidMax'),
      setCustomerFilter: (value) => {
        if (!value) {
          setQueryState({ customer: 0, customerName: '', page: 1 })
        } else {
          setQueryState({ customer: value.id, customerName: value.full_name, page: 1 })
        }
      },
      setProjectFilter: (value) => setQueryState({ project: value ?? 0, page: 1 }),
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
    view: {
      tab,
      setTab: (value: string) => setQueryState({ tab: value }),
    },
    queryParams,
    applyAgingBucket,
    applyMonthFilter,
    applyProjectFilter,
    selectedInstallmentId: parcela,
    setSelectedInstallmentId: (id: string) => setQueryState({ parcela: id }),
  }
}
