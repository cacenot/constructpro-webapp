import { useApiClient, useSale } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
          // Toggle ON: usa global. Toggle OFF: envia null (PATCH aceita optional)
          index_type_code: data.same_index_for_all ? (data.index_type_code ?? undefined) : null,
          installment_schedules: data.installment_schedules.map((s) => ({
            kind: s.kind,
            payment_method: s.payment_method,
            quantity: s.quantity,
            amount: s.amount,
            specific_date: s.specific_date ?? undefined,
            recurrence_type: s.recurrence_type ?? undefined,
            recurrence_day: s.recurrence_day ?? undefined,
            recurrence_month: s.recurrence_month ?? undefined,
            start_date: s.start_date ?? undefined,
            // Per-group index quando toggle OFF, apenas para grupos não-entry
            ...(!data.same_index_for_all && s.kind !== 'entry' && s.index_type_code
              ? { index_type_code: s.index_type_code }
              : {}),
            // asset_proposal para entradas via bem; API aceita asset_proposal; client não reflete ainda
            ...(s.payment_method === 'asset' && s.asset_proposal
              ? {
                  asset_proposal: s.asset_proposal as {
                    type: string
                    asset_metadata: Record<string, unknown>
                  },
                }
              : {}),
          })),
          broker_id: data.broker_id ?? null,
          commission_broker_rate:
            data.broker_id && data.commission_broker_rate
              ? String(data.commission_broker_rate)
              : null,
          agency_id: data.agency_id ?? null,
          commission_agency_rate:
            data.agency_id && data.commission_agency_rate
              ? String(data.commission_agency_rate)
              : null,
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
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
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
