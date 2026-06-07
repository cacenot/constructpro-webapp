import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { useTenantConfig } from '@/hooks/use-tenant-config'

interface IndexType {
  code: string
}

/**
 * Dados de referência compartilhados pelo formulário de proposta (criação e edição):
 * índices de correção e os limites do tenant (parcelas/mês e teto de comissão).
 * Corretor e imobiliária são buscados sob demanda pelos autocompletes.
 */
export function useProposalData() {
  const { client } = useApiClient()

  const indexTypesQuery = useQuery({
    queryKey: ['index-types'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/index-types/', {
        params: { query: { page: 1, page_size: 100 } },
      })
      if (error) throw new Error('Falha ao carregar índices de correção')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: tenantConfig } = useTenantConfig()
  const tc = tenantConfig as
    | { max_installments_per_month?: number; max_commission_rate?: { ppm?: number } }
    | undefined
  const maxInstallmentsPerMonth = tc?.max_installments_per_month ?? 2
  // Teto da soma corretor + imobiliária, em % (PPM ÷ 10.000). 0 = sem teto configurado.
  const maxCommissionRate = (tc?.max_commission_rate?.ppm ?? 0) / 10000

  return {
    indexTypes: (indexTypesQuery.data?.items ?? []) as IndexType[],
    indexTypesLoading: indexTypesQuery.isLoading,
    maxInstallmentsPerMonth,
    maxCommissionRate,
  }
}
