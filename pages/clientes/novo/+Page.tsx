import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

      if (error) {
        throw new Error((error as { detail?: string }).detail || 'Erro ao cadastrar cliente')
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente cadastrado com sucesso!')
      navigate('/customers')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cadastrar cliente')
    },
  })

  const handleBack = () => {
    if (customerType) {
      setCustomerType(null)
    } else {
      navigate('/customers')
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
            <div className="flex items-start gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1"
                    onClick={() => navigate('/customers')}
                  >
                    <ArrowLeft className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
                <p className="mt-1 text-muted-foreground">Cadastre um novo cliente na sua base.</p>
              </div>
            </div>
            <CustomerTypeSelector onSelect={setCustomerType} />
          </div>
        ) : customerType === 'individual' ? (
          <CustomerPFForm
            onSubmit={handleSubmitPF}
            onBack={handleBack}
            isSubmitting={createMutation.isPending}
          />
        ) : (
          <CustomerPJForm
            onSubmit={handleSubmitPJ}
            onBack={handleBack}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  )
}
