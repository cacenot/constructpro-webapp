import { useApiClient } from '@cacenot/construct-pro-api-client'
import { endOfMonth, format, parseISO, subDays } from 'date-fns'
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

export interface InstallmentsTableView {
  tab: string
  setTab: (value: string) => void
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
  tab: parseAsString.withDefault(DEFAULT_TAB),
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
    tab,
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

  // Parâmetros de filtro (sem page) — chave do infinite query e base do by-project.
  const filterParams = useMemo(() => {
    const params: InstallmentsQuery = {}
    const OPEN = ['scheduled', 'invoiced', 'partial']

    // Status: quando "Em atraso", restringe a parcelas em aberto (interseção com o
    // filtro do usuário, se houver) — base do fallback enquanto #145 não sobe.
    const statuses = overdueOnly
      ? statusFilter.length > 0
        ? statusFilter.filter((s) => OPEN.includes(s))
        : OPEN
      : statusFilter
    if (statuses.length > 0) params.status = statuses as NonNullable<InstallmentsQuery['status']>

    if (kindFilter.length > 0) params.kind = kindFilter as NonNullable<InstallmentsQuery['kind']>
    if (paymentMethodFilter.length > 0)
      params.payment_method = paymentMethodFilter as NonNullable<
        InstallmentsQuery['payment_method']
      >

    if (dueDateRange?.min) params['due_date[min]'] = dueDateRange.min
    if (dueDateRange?.max) params['due_date[max]'] = dueDateRange.max
    if (paidAtRange?.min) params['paid_at[min]'] = paidAtRange.min
    if (paidAtRange?.max) params['paid_at[max]'] = paidAtRange.max

    // "Em atraso": flag nativa (pós #145) + fallback por vencimento (≤ ontem),
    // respeitando um teto de data já informado pelo usuário.
    if (overdueOnly) {
      params.overdue = true
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
      const currentMax = params['due_date[max]']
      params['due_date[max]'] = currentMax && currentMax < yesterday ? currentMax : yesterday
    }

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

  // Cross-filter: clicar numa faixa de aging recorta a aba Parcelas para as
  // parcelas em aberto daquela idade (intervalo de vencimento + status abertos).
  const applyAgingBucket = (bucket: AgingBucketKey) => {
    const { min, max } = agingDueRange(bucket)
    setQueryState({
      tab: 'parcelas',
      status: OPEN_STATUSES,
      overdue: '',
      duePreset: 'custom',
      dueMin: min,
      dueMax: max,
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
      overdue: '',
      duePreset: 'custom',
      dueMin: format(start, 'yyyy-MM-dd'),
      dueMax: format(endOfMonth(start), 'yyyy-MM-dd'),
    })
  }

  // Cross-filter: clicar num empreendimento recorta a aba Parcelas para a carteira
  // daquele projeto (dimensão ortogonal, não mexe nos demais filtros ativos).
  const applyProjectFilter = (projectId: number) => {
    setQueryState({ tab: 'parcelas', project: projectId })
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
    view: {
      tab,
      setTab: (value: string) => setQueryState({ tab: value }),
    },
    queryParams: filterParams,
    applyAgingBucket,
    applyMonthFilter,
    applyProjectFilter,
    selectedInstallmentId: parcela,
    setSelectedInstallmentId: (id: string) => setQueryState({ parcela: id }),
  }
}
