import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

export const contractKeys = {
  all: ['contracts'] as const,
  details: () => ['contracts', 'detail'] as const,
  detail: (id: number) => ['contracts', 'detail', id] as const,
}

/**
 * Hook to get a single contract by ID
 */
export function useContract(contractId: number) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: contractKeys.detail(contractId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/contracts/{contract_id}', {
        params: { path: { contract_id: contractId } },
      })

      if (error) {
        throw new Error('Falha ao carregar contrato')
      }

      return data
    },
  })
}
