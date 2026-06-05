import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

export type IndexType = components['schemas']['IndexTypeResponse']

/**
 * Catálogo de índices econômicos (`/index-types`). Endpoint aberto a qualquer
 * usuário autenticado — alimenta o combobox de "Índices Econômicos" no tenant
 * config. Catálogo é dado de referência, muda raramente.
 */
export function useIndexTypes() {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['index-types', 'catalog'],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<IndexType[]> => {
      const response = await client.GET('/api/v1/index-types/', {
        params: { query: { page_size: 100, sort_by: ['code:asc'] } },
      })
      return response.data?.items ?? []
    },
  })
}
