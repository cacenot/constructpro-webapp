import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

/**
 * Bloco agregado do estoque de unidades (summary.by_status do /units/summary).
 * page_size=1: só o agregado interessa — os items ficam para a página /unidades.
 */
export function useUnitsInventory() {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['units-summary', 'inventory'] as const,
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/units/summary', {
        params: { query: { page: 1, page_size: 1 } },
      })
      if (error) throw new Error('Falha ao carregar estoque de unidades')
      return data
    },
  })
}
