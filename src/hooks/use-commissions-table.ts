import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import { computeDateRangePreset, type DateRangeValue } from '@/components/ui/date-range-filter'
import { useInfiniteTable } from './use-infinite-table'

export type CommissionItem = components['schemas']['CommissionReportItemResponse']
export type CommissionSummary = components['schemas']['CommissionTotals']

const PAGE_SIZE = 50

export interface BrokerFilterValue {
  id: number
  full_name: string
}

export interface AgencyFilterValue {
  id: number
  name: string
}

export interface CommissionsTableFilters {
  brokerFilter: BrokerFilterValue | null
  agencyFilter: AgencyFilterValue | null
  periodRange: DateRangeValue | null
  setBrokerFilter: (value: BrokerFilterValue | null) => void
  setAgencyFilter: (value: AgencyFilterValue | null) => void
  setPeriodRange: (value: DateRangeValue | null) => void
}

export interface UseCommissionsTableReturn {
  data: CommissionItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  summary: CommissionSummary | null
  summaryLoading: boolean
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: CommissionsTableFilters
}

interface CommissionsFilterQuery {
  broker_id?: number | null
  agency_id?: number | null
  'closed_at[min]'?: string | null
  'closed_at[max]'?: string | null
}

const commissionsQueryParsers = {
  brokerId: parseAsInteger.withDefault(0),
  brokerName: parseAsString.withDefault(''),
  agencyId: parseAsInteger.withDefault(0),
  agencyName: parseAsString.withDefault(''),
  periodPreset: parseAsString.withDefault(''),
  periodMin: parseAsString.withDefault(''),
  periodMax: parseAsString.withDefault(''),
}

function buildPeriodRange(preset: string, min: string, max: string): DateRangeValue | null {
  if (!preset) return null
  if (preset === 'custom') return { preset: 'custom', min, max }
  return computeDateRangePreset(preset)
}

export function useCommissionsTable(): UseCommissionsTableReturn {
  const { client } = useApiClient()

  const [queryState, setQueryState] = useQueryStates(commissionsQueryParsers, {
    history: 'push',
  })

  const { brokerId, brokerName, agencyId, agencyName, periodPreset, periodMin, periodMax } =
    queryState

  const brokerFilter: BrokerFilterValue | null = useMemo(
    () => (brokerId > 0 && brokerName ? { id: brokerId, full_name: brokerName } : null),
    [brokerId, brokerName]
  )

  const agencyFilter: AgencyFilterValue | null = useMemo(
    () => (agencyId > 0 && agencyName ? { id: agencyId, name: agencyName } : null),
    [agencyId, agencyName]
  )

  const periodRange = useMemo(
    () => buildPeriodRange(periodPreset, periodMin, periodMax),
    [periodPreset, periodMin, periodMax]
  )

  // Parâmetros de filtro (sem page) — compartilhados pela lista (infinite) e pelo
  // resumo. O backend não embute o `summary` na listagem (é endpoint próprio,
  // não paginado), então a tabela e os cards de totais consultam em paralelo
  // sobre o mesmo recorte.
  const filterParams = useMemo(() => {
    const params: CommissionsFilterQuery = {}
    if (brokerId > 0) params.broker_id = brokerId
    if (agencyId > 0) params.agency_id = agencyId
    if (periodRange?.min) params['closed_at[min]'] = periodRange.min
    if (periodRange?.max) params['closed_at[max]'] = periodRange.max
    return params
  }, [brokerId, agencyId, periodRange])

  const fetchPage = useCallback(
    async (page: number) => {
      const { data, error } = await client.GET('/api/v1/commissions', {
        params: { query: { ...filterParams, page, page_size: PAGE_SIZE } },
      })
      if (error) throw new Error('Falha ao carregar comissões')
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
  } = useInfiniteTable<CommissionItem>({
    queryKey: ['commissions', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['commissions-summary', filterParams],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/commissions/summary', {
        params: { query: filterParams },
      })
      if (error) throw new Error('Falha ao buscar resumo de comissões')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const summary = summaryData?.totals ?? null

  const hasActiveFilters = brokerId > 0 || agencyId > 0 || !!periodPreset

  const handleClearFilters = () => {
    setQueryState({
      brokerId: 0,
      brokerName: '',
      agencyId: 0,
      agencyName: '',
      periodPreset: '',
      periodMin: '',
      periodMax: '',
    })
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
    summaryLoading,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      brokerFilter,
      agencyFilter,
      periodRange,
      setBrokerFilter: (value) => {
        if (!value) setQueryState({ brokerId: 0, brokerName: '' })
        else setQueryState({ brokerId: value.id, brokerName: value.full_name })
      },
      setAgencyFilter: (value) => {
        if (!value) setQueryState({ agencyId: 0, agencyName: '' })
        else setQueryState({ agencyId: value.id, agencyName: value.name })
      },
      setPeriodRange: (value) => {
        if (!value) {
          setQueryState({ periodPreset: '', periodMin: '', periodMax: '' })
        } else {
          setQueryState({
            periodPreset: value.preset,
            periodMin: value.preset === 'custom' ? value.min : '',
            periodMax: value.preset === 'custom' ? value.max : '',
          })
        }
      },
    },
  }
}
