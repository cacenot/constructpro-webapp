import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { subDays, subYears } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteTable } from './use-infinite-table'

type ContractResponse = components['schemas']['ContractResponse']
type SaleResponse = components['schemas']['SaleResponse']
type ContractStatus = components['schemas']['ContractStatus']

/**
 * Linha enriquecida da tabela de contratos: o item da lista (`/api/v1/contracts`)
 * carrega só `sale_id`, então casamos cada contrato com sua venda (cliente,
 * empreendimento, unidade) buscada em paralelo. As colunas leem `row.original.sale`.
 */
export interface ContractTableRow extends ContractResponse {
  sale?: SaleResponse | null
}

export type { ContractResponse, SaleResponse }

const PAGE_SIZE = 20

export interface ContractsTableFilters {
  search: string
  statusFilter: string
  indexTypeFilter: string
  periodFilter: string
  onlyPendingContracts: boolean
  onlyOverdueContracts: boolean
  setSearch: (value: string) => void
  setStatusFilter: (value: string) => void
  setIndexTypeFilter: (value: string) => void
  setPeriodFilter: (value: string) => void
  setOnlyPendingContracts: (value: boolean) => void
  setOnlyOverdueContracts: (value: boolean) => void
}

export interface UseContractsTableReturn {
  data: ContractTableRow[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: ContractsTableFilters
}

// Tipagem solta espelhando o que `useContracts` envia hoje. `index_type_code` NÃO
// consta da operação OpenAPI de `/api/v1/contracts` (o item da lista nem carrega
// índice) — o backend ignora; mantido 1:1 com o comportamento anterior para não
// alterar a UI. Os demais campos (sale_id, status, signed_at[min], overdue) são
// parâmetros válidos do endpoint.
interface ContractsListQuery {
  page?: number
  page_size?: number
  sale_id?: number | null
  status?: ContractStatus[]
  index_type_code?: string
  overdue?: boolean
  'signed_at[min]'?: string
  'signed_at[max]'?: string
}

export function useContractsTable(): UseContractsTableReturn {
  const { client } = useApiClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [indexTypeFilter, setIndexTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [onlyPendingContracts, setOnlyPendingContracts] = useState(false)
  const [onlyOverdueContracts, setOnlyOverdueContracts] = useState(false)

  // O input atualiza `search` a cada tecla (UI responsiva), mas a busca usa um valor
  // debounced para não refetchar a cada caractere.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: ContractsListQuery = {}

    if (debouncedSearch) {
      const parsedSaleId = Number.parseInt(debouncedSearch, 10)
      if (!Number.isNaN(parsedSaleId)) params.sale_id = parsedSaleId
    }

    if (statusFilter !== 'all') params.status = [statusFilter as ContractStatus]
    if (onlyPendingContracts) params.status = ['pending']
    if (onlyOverdueContracts) params.overdue = true
    if (indexTypeFilter !== 'all') params.index_type_code = indexTypeFilter

    if (periodFilter !== 'all') {
      const now = new Date()
      if (periodFilter === '30d') params['signed_at[min]'] = subDays(now, 30).toISOString()
      else if (periodFilter === '90d') params['signed_at[min]'] = subDays(now, 90).toISOString()
      else if (periodFilter === 'year') params['signed_at[min]'] = subYears(now, 1).toISOString()
    }

    return params
  }, [
    debouncedSearch,
    statusFilter,
    indexTypeFilter,
    periodFilter,
    onlyPendingContracts,
    onlyOverdueContracts,
  ])

  const fetchPage = useCallback(
    async (page: number) => {
      const query: ContractsListQuery = { ...filterParams, page, page_size: PAGE_SIZE }
      const { data, error } = await client.GET('/api/v1/contracts', {
        params: { query },
      })
      if (error) throw new Error('Falha ao carregar contratos')

      const contracts = data?.items ?? []

      // O item da lista carrega só `sale_id`; buscamos as vendas da página para
      // enriquecer cada linha com cliente/empreendimento/unidade (subtítulo da âncora).
      const saleIds = Array.from(new Set(contracts.map((contract) => contract.sale_id)))
      const salesMap = new Map<number, SaleResponse>()
      if (saleIds.length > 0) {
        const { data: salesData } = await client.GET('/api/v1/sales', {
          params: { query: { page: 1, page_size: 100 } },
        })
        for (const sale of salesData?.items ?? []) salesMap.set(sale.id, sale)
      }

      const items: ContractTableRow[] = contracts.map((contract) => ({
        ...contract,
        sale: salesMap.get(contract.sale_id) ?? null,
      }))

      return { items, total: data?.total ?? 0 }
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
  } = useInfiniteTable<ContractTableRow>({
    queryKey: ['contracts-table', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const hasActiveFilters = !!(
    search ||
    statusFilter !== 'all' ||
    indexTypeFilter !== 'all' ||
    periodFilter !== 'all' ||
    onlyPendingContracts ||
    onlyOverdueContracts
  )

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setIndexTypeFilter('all')
    setPeriodFilter('all')
    setOnlyPendingContracts(false)
    setOnlyOverdueContracts(false)
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
      indexTypeFilter,
      periodFilter,
      onlyPendingContracts,
      onlyOverdueContracts,
      setSearch,
      setStatusFilter,
      setIndexTypeFilter,
      setPeriodFilter,
      setOnlyPendingContracts,
      setOnlyOverdueContracts,
    },
  }
}
