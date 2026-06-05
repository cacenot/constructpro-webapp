import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type UserProfileResponse = components['schemas']['UserProfileResponse']

/**
 * Perfil do usuário autenticado (`/users/me`), com a chave canônica
 * ['users', 'me']. Compartilhado por páginas e pelo menu da conta — o cache
 * do TanStack Query garante uma única requisição.
 */
export function useProfile() {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async (): Promise<UserProfileResponse> => {
      const response = await client.GET('/api/v1/users/me')
      if (!response.data) {
        throw new Error('Erro ao carregar perfil')
      }
      return response.data as UserProfileResponse
    },
  })
}
