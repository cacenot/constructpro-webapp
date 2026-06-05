import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/api-error'

/** Corpo parcial do PATCH — cada seção envia apenas os campos que edita. */
export type TenantConfigUpdateBody = components['schemas']['TenantConfigUpdate']

/**
 * Mutation de atualização parcial da config do tenant (`PATCH /tenant-config`).
 * O backend tem semântica de PATCH (só os campos enviados são gravados) e valida
 * cross-field contra o estado mesclado, então cada seção salva isoladamente.
 */
export function useTenantConfigUpdate() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: TenantConfigUpdateBody) => {
      const response = await client.PATCH('/api/v1/tenant-config', { body })
      if (!response.data) {
        throw new Error('Erro ao salvar configurações da organização')
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Configurações da organização salvas com sucesso')
      queryClient.invalidateQueries({ queryKey: ['tenant-config'] })
    },
    onError: (err: Error) => handleApiError(err, 'Erro ao salvar configurações da organização'),
  })
}
