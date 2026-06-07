import type { paths } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { extractApiErrorMessage } from '@/lib/api-error'

type ContractDetailResponse =
  paths['/api/v1/contracts/{contract_id}']['get']['responses']['200']['content']['application/json']

export const contractDetailKeys = {
  all: ['contracts'] as const,
  details: () => ['contracts', 'detail'] as const,
  detail: (id: number) => ['contracts', 'detail', id] as const,
}

/**
 * Busca o detalhe financeiro ao vivo de um contrato (saldo devedor, parcelas,
 * correção, pagamentos, timeline). Só dispara quando há um contractId válido —
 * propostas sem contrato materializado passam `undefined` e o hook fica ocioso.
 */
export function useContractDetail(contractId: number | undefined) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: contractDetailKeys.detail(contractId ?? 0),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/contracts/{contract_id}', {
        params: { path: { contract_id: contractId as number } },
      })
      if (error) {
        throw new Error(
          extractApiErrorMessage(error, 'Falha ao carregar dados financeiros do contrato')
        )
      }
      return data
    },
    enabled: !!contractId,
  })
}

export type { ContractDetailResponse }
