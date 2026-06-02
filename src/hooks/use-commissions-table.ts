import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import { computeDateRangePreset, type DateRangeValue } from '@/components/ui/date-range-filter'

export type CommissionItem = components['schemas']['CommissionReportItemResponse']
export type CommissionSummary = components['schemas']['CommissionTotals']

const PAGE_SIZE = 10

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

export interface CommissionsTablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading: boolean
  setPage: (page: number) => void
}

export interface UseCommissionsTableReturn {
  data: CommissionItem[]
  isLoading: boolean
  total: number
  summary: CommissionSummary | null
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: CommissionsTableFilters
  pagination: CommissionsTablePagination
}

interface CommissionsQuery {
  page?: number | null
  page_size?: number | null
  broker_id?: number | null
  agency_id?: number | null
  'closed_at[min]'?: string | null
  'closed_at[max]'?: string | null
}

interface CommissionsSummaryQuery {
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
  page: parseAsInteger.withDefault(1),
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

  const { brokerId, brokerName, agencyId, agencyName, periodPreset, periodMin, periodMax, page } =
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

  const listParams: CommissionsQuery = useMemo(() => {
    const params: CommissionsQuery = { page, page_size: PAGE_SIZE }
    if (brokerId > 0) params.broker_id = brokerId
    if (agencyId > 0) params.agency_id = agencyId
    if (periodRange?.min) params['closed_at[min]'] = periodRange.min
    if (periodRange?.max) params['closed_at[max]'] = periodRange.max
    return params
  }, [page, brokerId, agencyId, periodRange])

  const summaryParams: CommissionsSummaryQuery = useMemo(() => {
    const params: CommissionsSummaryQuery = {}
    if (brokerId > 0) params.broker_id = brokerId
    if (agencyId > 0) params.agency_id = agencyId
    if (periodRange?.min) params['closed_at[min]'] = periodRange.min
    if (periodRange?.max) params['closed_at[max]'] = periodRange.max
    return params
  }, [brokerId, agencyId, periodRange])

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['commissions', listParams],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/commissions', {
        params: { query: listParams },
      })
      if (error) throw new Error('Falha ao buscar comissões')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['commissions-summary', summaryParams],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/commissions/summary', {
        params: { query: summaryParams },
      })
      if (error) throw new Error('Falha ao buscar resumo de comissões')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const items = listData?.items ?? []
  const total = listData?.total ?? 0
  const summary = summaryData?.totals ?? null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isLoading = listLoading || summaryLoading

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
      page: 1,
    })
  }

  return {
    data: items,
    isLoading,
    total,
    summary,
    hasActiveFilters,
    handleClearFilters,
    filters: {
      brokerFilter,
      agencyFilter,
      periodRange,
      setBrokerFilter: (value) => {
        if (!value) setQueryState({ brokerId: 0, brokerName: '', page: 1 })
        else setQueryState({ brokerId: value.id, brokerName: value.full_name, page: 1 })
      },
      setAgencyFilter: (value) => {
        if (!value) setQueryState({ agencyId: 0, agencyName: '', page: 1 })
        else setQueryState({ agencyId: value.id, agencyName: value.name, page: 1 })
      },
      setPeriodRange: (value) => {
        if (!value) {
          setQueryState({ periodPreset: '', periodMin: '', periodMax: '', page: 1 })
        } else {
          setQueryState({
            periodPreset: value.preset,
            periodMin: value.preset === 'custom' ? value.min : '',
            periodMax: value.preset === 'custom' ? value.max : '',
            page: 1,
          })
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
  }
}
