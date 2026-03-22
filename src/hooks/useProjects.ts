import { useApiClient } from '@cacenot/construct-pro-api-client'
import type { paths } from '@cacenot/construct-pro-api-client/schema'
import { type UseQueryOptions, useQuery } from '@tanstack/react-query'

type ProjectDetailResponse =
  paths['/api/v1/projects/{project_id}/detail']['get']['responses']['200']['content']['application/json']

export const projectKeys = {
  all: ['projects'] as const,
  details: () => ['projects', 'detail'] as const,
  detail: (id: number) => ['projects', 'detail', id] as const,
}

/**
 * Hook para buscar projetos usando a API client tipada
 * Exemplo de integração com TanStack Query e @cacenot/construct-pro-api-client
 */
export function useProjectsList(options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects')
      if (error) {
        throw new Error(`Failed to fetch projects: ${error}`)
      }
      return data
    },
    ...options,
  })
}

/**
 * Hook para buscar um projeto específico por ID
 */
export function useProject(projectId: string) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects/{project_id}', {
        params: { path: { project_id: projectId } },
      })
      if (error) {
        throw new Error(`Failed to fetch project: ${error}`)
      }
      return data
    },
    enabled: Boolean(projectId),
  })
}

/**
 * Hook para buscar detalhes completos de um empreendimento com analytics
 */
export function useProjectDetail(projectId: number) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects/{project_id}/detail', {
        params: { path: { project_id: projectId } },
      })
      if (error) throw new Error('Falha ao carregar detalhes do empreendimento')
      return data
    },
    enabled: !!projectId,
  })
}

export type { ProjectDetailResponse }
