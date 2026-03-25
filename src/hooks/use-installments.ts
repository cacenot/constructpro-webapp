import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type InstallmentResponse = components['schemas']['InstallmentResponse']
type InstallmentDetailResponse = components['schemas']['InstallmentDetailResponse']
type InstallmentSummaryItemResponse = components['schemas']['InstallmentSummaryItemResponse']
type PaginatedInstallmentsResponse = components['schemas']['PaginatedResponse_InstallmentResponse_']
type InstallmentListSummary = components['schemas']['InstallmentListSummary']

interface InstallmentsQuery {
  page?: number | null
  page_size?: number | null
  contract_id?: string | null
  kind?: string[] | null
  status?: string[] | null
  payment_method?: string[] | null
  'due_date[min]'?: string | null
  'due_date[max]'?: string | null
  customer_id?: number | null
  sort_by?: string[] | null
}

export const installmentKeys = {
  all: ['installments'] as const,
  lists: () => ['installments', 'list'] as const,
  list: (filters: InstallmentsQuery) => ['installments', 'list', filters] as const,
  summaries: () => ['installments', 'summary'] as const,
  summary: (filters: InstallmentsQuery) => ['installments', 'summary', filters] as const,
  details: () => ['installments', 'detail'] as const,
  detail: (id: string) => ['installments', 'detail', id] as const,
}

export function useInstallments(params?: InstallmentsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.list(params ?? {}),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar parcelas')
      }

      return data
    },
  })
}

export function useInstallment(installmentId: string) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.detail(installmentId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/{installment_id}', {
        params: { path: { installment_id: installmentId } },
      })

      if (error) {
        throw new Error('Falha ao carregar parcela')
      }

      return data
    },
    enabled: !!installmentId,
  })
}

export function useInstallmentsSummary(params?: InstallmentsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.summary(params ?? {}),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/summary', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar resumo de parcelas')
      }

      return data
    },
  })
}

export type {
  InstallmentsQuery,
  InstallmentResponse,
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
  PaginatedInstallmentsResponse,
  InstallmentListSummary,
}
