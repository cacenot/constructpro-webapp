import { formatCPF, useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { BrokerForm } from '@/components/corretores/broker-form'
import { Button } from '@/components/ui/button'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { BrokerCreateFormData } from '@/schemas/broker.schema'

export default function BrokerEditPage() {
  const pageContext = usePageContext()
  const brokerId = Number(pageContext.routeParams?.id)
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  const {
    data: broker,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brokers', brokerId],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/brokers/{broker_id}', {
        params: { path: { broker_id: brokerId } },
      })
      if (error) throw new Error('Falha ao carregar corretor')
      return data
    },
    enabled: !!brokerId,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: BrokerCreateFormData) => {
      const { data: response, error } = await client.PATCH('/api/v1/brokers/{broker_id}', {
        params: { path: { broker_id: brokerId } },
        body: {
          ...data,
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        },
      })
      if (error) throwApiError(error, 'Falha ao atualizar corretor')
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] })
      queryClient.invalidateQueries({ queryKey: ['brokers', brokerId] })
      toast.success('Corretor atualizado com sucesso!')
      navigate(`/corretores/${brokerId}`)
    },
    onError: (error) => handleApiError(error, 'Falha ao atualizar corretor'),
  })

  const handleSubmit = async (data: BrokerCreateFormData) => {
    await updateMutation.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !broker) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Corretor não encontrado</p>
          <Button variant="link" onClick={() => navigate('/corretores')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <BrokerForm
          initialData={{
            cpf: formatCPF(broker.cpf),
            full_name: broker.full_name,
            creci: broker.creci,
            email: broker.email ?? '',
            phone: broker.phone ?? '',
          }}
          onSubmit={handleSubmit}
          onBack={() => navigate(`/corretores/${brokerId}`)}
          backHref={`/corretores/${brokerId}`}
          isEdit
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
