import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { BrokerForm } from '@/components/corretores/broker-form'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { BrokerCreateFormData } from '@/schemas/broker.schema'

export default function BrokerNewPage() {
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  const createMutation = useMutation({
    mutationFn: async (data: BrokerCreateFormData) => {
      const { data: response, error } = await client.POST('/api/v1/brokers', {
        body: {
          ...data,
          cpf: data.cpf.replace(/\D/g, ''),
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        },
      })
      if (error) throwApiError(error, 'Falha ao cadastrar corretor')
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] })
      toast.success('Corretor cadastrado com sucesso!')
      navigate('/corretores')
    },
    onError: (error) => handleApiError(error, 'Falha ao cadastrar corretor'),
  })

  const handleSubmit = async (data: BrokerCreateFormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <BrokerForm
          onSubmit={handleSubmit}
          onBack={() => navigate('/corretores')}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
