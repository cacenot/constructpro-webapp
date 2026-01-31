import { formatCNPJ, formatCPF, useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { CustomerPFForm, CustomerPJForm } from '@/components/customers'
import { Button } from '@/components/ui/button'
import type { CustomerPFCreateFormData, CustomerPJCreateFormData } from '@/schemas/customer.schema'

export default function CustomerEditPage() {
  const pageContext = usePageContext()
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  // Get customer ID from URL params
  const customerId = Number(pageContext.routeParams?.id)

  // Fetch customer data
  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/customers/{customer_id}', {
        params: { path: { customer_id: customerId } },
      })

      if (error) {
        throw new Error('Erro ao carregar cliente')
      }

      return data
    },
    enabled: !!customerId,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CustomerPFCreateFormData | CustomerPJCreateFormData>) => {
      // Remove cpf_cnpj from update (can't be changed)
      const { cpf_cnpj, ...updateData } = data as CustomerPFCreateFormData

      const { data: response, error } = await client.PATCH('/api/v1/customers/{customer_id}', {
        params: { path: { customer_id: customerId } },
        body: updateData,
      })

      if (error) {
        throw new Error((error as { detail?: string }).detail || 'Erro ao atualizar cliente')
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] })
      toast.success('Cliente atualizado com sucesso!')
      navigate('/clientes')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar cliente')
    },
  })

  const handleBack = () => {
    navigate('/clientes')
  }

  const handleSubmitPF = async (data: CustomerPFCreateFormData) => {
    await updateMutation.mutateAsync(data)
  }

  const handleSubmitPJ = async (data: CustomerPJCreateFormData) => {
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

  if (error || !customer) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Cliente não encontrado</p>
          <Button variant="link" onClick={handleBack}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Format CPF/CNPJ for display
  const formattedCpfCnpj =
    customer.type === 'individual' ? formatCPF(customer.cpf_cnpj) : formatCNPJ(customer.cpf_cnpj)

  // Prepare initial data with formatted document
  const initialData = {
    ...customer,
    cpf_cnpj: formattedCpfCnpj,
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {customer.type === 'individual' ? (
          <CustomerPFForm
            initialData={initialData}
            onSubmit={handleSubmitPF}
            onBack={handleBack}
            isEdit
            isSubmitting={updateMutation.isPending}
          />
        ) : (
          <CustomerPJForm
            initialData={initialData}
            onSubmit={handleSubmitPJ}
            onBack={handleBack}
            isEdit
            isSubmitting={updateMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  )
}
