import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import {
  CustomerPFForm,
  CustomerPJForm,
  type CustomerTypeOption,
  CustomerTypeSelector,
} from '@/components/customers'
import { PageHeader } from '@/components/ui/page-header'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { CustomerPFCreateFormData, CustomerPJCreateFormData } from '@/schemas/customer.schema'

export default function CustomerNewPage() {
  const queryClient = useQueryClient()
  const { client } = useApiClient()
  const [customerType, setCustomerType] = useState<CustomerTypeOption | null>(null)

  const createMutation = useMutation({
    mutationFn: async (data: CustomerPFCreateFormData | CustomerPJCreateFormData) => {
      // Remove the mask from cpf_cnpj (send only digits)
      const cpfCnpjDigits = data.cpf_cnpj.replace(/\D/g, '')

      const { data: response, error } = await client.POST('/api/v1/customers', {
        body: {
          ...data,
          cpf_cnpj: cpfCnpjDigits,
        },
      })

      if (error) throwApiError(error, 'Erro ao cadastrar cliente')

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente cadastrado com sucesso!')
      navigate('/clientes')
    },
    onError: (error) => handleApiError(error, 'Erro ao cadastrar cliente'),
  })

  const handleBack = () => {
    if (customerType) {
      setCustomerType(null)
    } else {
      navigate('/clientes')
    }
  }

  const handleSubmitPF = async (data: CustomerPFCreateFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleSubmitPJ = async (data: CustomerPJCreateFormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {!customerType ? (
          <div className="space-y-6">
            <PageHeader
              title="Novo Cliente"
              description="Cadastre um novo cliente na sua base."
              backHref="/clientes"
            />
            <CustomerTypeSelector onSelect={setCustomerType} />
          </div>
        ) : customerType === 'individual' ? (
          <CustomerPFForm
            onSubmit={handleSubmitPF}
            onBack={handleBack}
            backHref="/clientes"
            isSubmitting={createMutation.isPending}
          />
        ) : (
          <CustomerPJForm
            onSubmit={handleSubmitPJ}
            onBack={handleBack}
            backHref="/clientes"
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  )
}
