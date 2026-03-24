import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { InstallmentDetailDrawer } from '@/components/financeiro/installment-detail-drawer'
import { InstallmentsFilters } from '@/components/financeiro/installments-filters'
import { InstallmentsPagination } from '@/components/financeiro/installments-pagination'
import { InstallmentsSummaryCards } from '@/components/financeiro/installments-summary-cards'
import { InstallmentsTable } from '@/components/financeiro/installments-table'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Card, CardContent } from '@/components/ui/card'
import type { InstallmentResponse } from '@/hooks/use-installments'
import { installmentKeys } from '@/hooks/use-installments'
import { useInstallmentsTable } from '@/hooks/use-installments-table'

export default function FinanceiroPage() {
  const {
    data,
    isLoading,
    summary,
    hasActiveFilters,
    handleClearFilters,
    filters,
    pagination,
    sort,
    selectedInstallmentId,
    setSelectedInstallmentId,
  } = useInstallmentsTable()

  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentResponse | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  const issueBoletoMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const { data: response, error } = await client.POST(
        '/api/v1/installments/{installment_id}/boleto',
        {
          params: { path: { installment_id: installmentId } },
        }
      )

      if (error) {
        throw new Error('Falha ao emitir boleto')
      }

      return response
    },
    onSuccess: () => {
      toast.success('Boleto emitido com sucesso')
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao emitir boleto')
    },
  })

  const handlePayInstallment = (installment: InstallmentResponse) => {
    setSelectedInstallment(installment)
    setPayDialogOpen(true)
  }

  const handleIssueBoleto = (installment: InstallmentResponse) => {
    issueBoletoMutation.mutate(installment.id)
  }

  const handleViewDetails = (installment: InstallmentResponse) => {
    setSelectedInstallmentId(installment.id)
  }

  const handleCloseDrawer = () => {
    setSelectedInstallmentId('')
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe parcelas, recebimentos e vencimentos.
          </p>
        </div>

        <InstallmentsSummaryCards summary={summary} isLoading={isLoading} />

        <InstallmentsFilters {...filters} />

        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-0">
            <InstallmentsTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onPayInstallment={handlePayInstallment}
              onIssueBoleto={handleIssueBoleto}
              onViewDetails={handleViewDetails}
              sort={sort.sort}
              onSort={sort.setSort}
            />
          </CardContent>
          <InstallmentsPagination {...pagination} />
        </Card>
      </div>

      <InstallmentDetailDrawer
        installmentId={selectedInstallmentId}
        open={!!selectedInstallmentId}
        onClose={handleCloseDrawer}
        onPayInstallment={handlePayInstallment}
        onIssueBoleto={handleIssueBoleto}
      />

      <PayInstallmentDialog
        installment={selectedInstallment}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
      />
    </AppLayout>
  )
}
