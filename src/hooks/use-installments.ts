import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type InstallmentResponse = components['schemas']['InstallmentResponse']
type PaginatedInstallmentsResponse = components['schemas']['PaginatedResponse_InstallmentResponse_']

interface InstallmentsQuery {
  page?: number | null
  page_size?: number | null
  contract_id?: string | null
  kind?: string[] | null
  status?: string[] | null
  payment_method?: string[] | null
  'due_date[min]'?: string | null
  'due_date[max]'?: string | null
  sort_by?: string[] | null
}

export const installmentKeys = {
  all: ['installments'] as const,
  lists: () => ['installments', 'list'] as const,
  list: (filters: InstallmentsQuery) => ['installments', 'list', filters] as const,
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

export type { InstallmentsQuery, InstallmentResponse, PaginatedInstallmentsResponse }
