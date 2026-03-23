import type { paths } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { type UseQueryOptions, useQuery } from '@tanstack/react-query'

type ProjectDetailResponse =
  paths['/api/v1/projects/{project_id}/detail']['get']['responses']['200']['content']['application/json']

type ProjectSummaryQuery = paths['/api/v1/projects/summary']['get']['parameters']['query']
type ProjectSummaryResponse =
  paths['/api/v1/projects/summary']['get']['responses']['200']['content']['application/json']

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => ['projects', 'list'] as const,
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
export function useProject(projectId: number) {
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

/**
 * Hook para listar empreendimentos com payload leve (tela de listagem)
 */
export function useProjectsSummary(params?: ProjectSummaryQuery) {
  const { client } = useApiClient()

  return useQuery<ProjectSummaryResponse>({
    queryKey: [...projectKeys.lists(), 'summary', params ?? {}] as const,
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects/summary', {
        params: { query: params },
      })
      if (error) throw new Error('Falha ao carregar empreendimentos')
      return data as ProjectSummaryResponse
    },
  })
}

export type { ProjectDetailResponse, ProjectSummaryResponse }
