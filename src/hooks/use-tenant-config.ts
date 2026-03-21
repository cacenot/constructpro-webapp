import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook compartilhado para acessar a configuração do tenant atual.
 * Usa a chave canônica ['tenant-config'] — qualquer componente que chamar
 * este hook compartilha o mesmo cache do TanStack Query.
 */
export function useTenantConfig() {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['tenant-config'],
    queryFn: async () => {
      const response = await client.GET('/api/v1/tenant-config')
      if (!response.data) throw new Error('Erro ao carregar configurações da organização')
      return response.data
    },
  })
}
