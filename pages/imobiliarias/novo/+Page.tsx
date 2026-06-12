import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { AgencyForm } from '@/components/imobiliarias/agency-form'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { AgencyCreateFormData } from '@/schemas/agency.schema'

export default function AgencyNewPage() {
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  const createMutation = useMutation({
    mutationFn: async (data: AgencyCreateFormData) => {
      const { data: response, error } = await client.POST('/api/v1/agencies', {
        body: {
          ...data,
          cnpj: data.cnpj.replace(/\D/g, ''),
          trade_name: data.trade_name?.trim() || undefined,
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        },
      })
      if (error) throwApiError(error, 'Falha ao cadastrar imobiliária')
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] })
      toast.success('Imobiliária cadastrada com sucesso!')
      navigate('/imobiliarias')
    },
    onError: (error) => handleApiError(error, 'Falha ao cadastrar imobiliária'),
  })

  const handleSubmit = async (data: AgencyCreateFormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <AgencyForm
          onSubmit={handleSubmit}
          onBack={() => navigate('/imobiliarias')}
          backHref="/imobiliarias"
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
