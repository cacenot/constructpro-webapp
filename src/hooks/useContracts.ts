import { useApiClient } from '@cacenot/construct-pro-api-client'
import type { paths } from '@cacenot/construct-pro-api-client/schema'
import { useQuery } from '@tanstack/react-query'

type ContractsQuery = paths['/api/v1/contracts/']['get']['parameters']['query']
type ContractResponse =
  paths['/api/v1/contracts/{contract_id}']['get']['responses']['200']['content']['application/json']
type PaginatedContractsResponse =
  paths['/api/v1/contracts/']['get']['responses']['200']['content']['application/json']

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => ['contracts', 'list'] as const,
  list: (filters: ContractsQuery) => ['contracts', 'list', filters] as const,
  details: () => ['contracts', 'detail'] as const,
  detail: (id: number) => ['contracts', 'detail', id] as const,
}

/**
 * Hook to list contracts with pagination and filters
 */
export function useContracts(params?: ContractsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/contracts/', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar contratos')
      }

      return data
    },
  })
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

export type { ContractsQuery, ContractResponse, PaginatedContractsResponse }
