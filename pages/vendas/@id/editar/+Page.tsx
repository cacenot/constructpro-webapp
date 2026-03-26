import { useApiClient, useSale } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { SaleEditForm } from '@/components/vendas/sale-edit-form'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { SaleEditFormData } from '@/schemas/sale.schema'

export default function SaleEditPage() {
  const pageContext = usePageContext()
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  const saleId = Number(pageContext.routeParams?.id)

  const { data: sale, isLoading, error } = useSale(saleId)

  const updateMutation = useMutation({
    mutationFn: async (data: SaleEditFormData) => {
      const { data: response, error: apiError } = await client.PATCH('/api/v1/sales/{sale_id}', {
        params: { path: { sale_id: saleId } },
        body: {
          index_type_code: data.index_type_code,
          installment_schedules: data.installment_schedules.map((s) => ({
            kind: s.kind,
            payment_method: s.payment_method,
            quantity: s.quantity,
            amount_cents: s.amount_cents,
            specific_date: s.specific_date ?? undefined,
            recurrence_type: s.recurrence_type ?? undefined,
            recurrence_day: s.recurrence_day ?? undefined,
            recurrence_month: s.recurrence_month ?? undefined,
            start_date: s.start_date ?? undefined,
          })),
        },
      })

      if (apiError) throwApiError(apiError, 'Erro ao atualizar proposta')

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      toast.success('Proposta atualizada com sucesso!')
      navigate('/vendas')
    },
    onError: (err) => handleApiError(err, 'Erro ao atualizar proposta'),
  })

  const handleSubmit = async (data: SaleEditFormData) => {
    await updateMutation.mutateAsync(data)
  }

  const handleBack = () => {
    navigate('/vendas')
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

  if (error || !sale) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Proposta não encontrada</p>
          <Button variant="link" onClick={handleBack}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <SaleEditForm
          sale={sale}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
