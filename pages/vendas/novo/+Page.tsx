import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { SaleForm } from '@/components/vendas/sale-form'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { SaleFormData } from '@/schemas/sale.schema'

export default function SaleNewPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const { data: result, error } = await client.POST('/api/v1/sales', {
        body: {
          unit_id: data.unit_id,
          customer_id: data.customer_id,
          index_type_code: data.index_type_code,
          installment_schedules: data.installment_schedules.map((schedule) => ({
            kind: schedule.kind,
            payment_method: schedule.payment_method,
            quantity: schedule.quantity,
            amount_cents: schedule.amount_cents,
            specific_date: schedule.specific_date ?? undefined,
            recurrence_type: schedule.recurrence_type ?? undefined,
            recurrence_day: schedule.recurrence_day ?? undefined,
            recurrence_month: schedule.recurrence_month ?? undefined,
            start_date: schedule.start_date ?? undefined,
          })),
        },
      })

      if (error) throwApiError(error, 'Falha ao cadastrar venda')

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const handleBack = () => {
    navigate('/vendas')
  }

  const handleSubmit = async (data: SaleFormData) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Venda cadastrada com sucesso!')
      navigate('/vendas')
    } catch (error) {
      handleApiError(error, 'Erro ao cadastrar venda')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <SaleForm
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
