import type { paths } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type CustomerDetailResponse =
  paths['/api/v1/customers/{customer_id}/detail']['get']['responses']['200']['content']['application/json']

export const customerDetailKeys = {
  all: ['customers'] as const,
  details: () => ['customers', 'detail'] as const,
  detail: (id: number) => ['customers', 'detail', id] as const,
}

export function useCustomerDetail(customerId: number) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: customerDetailKeys.detail(customerId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/customers/{customer_id}/detail', {
        params: { path: { customer_id: customerId } },
      })
      if (error) throw new Error('Falha ao carregar detalhes do cliente')
      return data
    },
    enabled: !!customerId,
  })
}

export type { CustomerDetailResponse }
