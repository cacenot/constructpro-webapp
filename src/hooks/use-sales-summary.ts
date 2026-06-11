import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type SaleSummaryResponse = components['schemas']['SaleSummaryResponse']
type PaginatedSaleSummaryResponse = components['schemas']['SalesSummaryPaginatedResponse']
type SalesAggregateSummary = components['schemas']['SalesListSummary']

interface SalesSummaryQuery {
  page?: number
  page_size?: number
  search?: string
  status?: ('closed' | 'pending_signature' | 'pending_payment' | 'lost' | 'proposal')[]
  user_id?: string
}

export const salesSummaryKeys = {
  all: ['sales-summary'] as const,
  lists: () => ['sales-summary', 'list'] as const,
  list: (filters: SalesSummaryQuery) => ['sales-summary', 'list', filters] as const,
}

export function useSalesSummary(params?: SalesSummaryQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: salesSummaryKeys.list(params ?? {}),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/sales/summary', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar resumo de vendas')
      }

      return data as PaginatedSaleSummaryResponse | undefined
    },
  })
}

export type { SaleSummaryResponse, PaginatedSaleSummaryResponse, SalesAggregateSummary }
