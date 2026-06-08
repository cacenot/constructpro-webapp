import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { InstallmentDetailDrawer } from '@/components/financeiro/installment-detail-drawer'
import { InstallmentsAgingBlock } from '@/components/financeiro/installments-aging-block'
import { InstallmentsFilters } from '@/components/financeiro/installments-filters'
import { InstallmentsPagination } from '@/components/financeiro/installments-pagination'
import { InstallmentsTable } from '@/components/financeiro/installments-table'
import { InstallmentsVitalsStrip } from '@/components/financeiro/installments-vitals-strip'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
} from '@/hooks/use-installments'
import { installmentKeys } from '@/hooks/use-installments'
import { useInstallmentsTable } from '@/hooks/use-installments-table'
import { handleApiError, throwApiError } from '@/lib/api-error'

// Revela o conteúdo ao trocar de aba: fade + slide-up sutil, 200ms, ease-out.
// Mesmo padrão do detalhe de empreendimento. Neutralizado em reduced-motion.
const TAB_CONTENT_MOTION = 'mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-out'

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
    view,
    applyAgingBucket,
    selectedInstallmentId,
    setSelectedInstallmentId,
  } = useInstallmentsTable()

  const { client } = useApiClient()
  const queryClient = useQueryClient()

  type Installment = InstallmentSummaryItemResponse | InstallmentDetailResponse

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  const issueBoletoMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const { data: response, error } = await client.POST(
        '/api/v1/installments/{installment_id}/boleto',
        {
          params: { path: { installment_id: installmentId } },
        }
      )

      if (error) throwApiError(error, 'Falha ao emitir boleto')

      return response
    },
    onSuccess: () => {
      toast.success('Boleto emitido com sucesso')
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
    },
    onError: (error) => handleApiError(error, 'Erro ao emitir boleto'),
  })

  const handlePayInstallment = (installment: Installment) => {
    setSelectedInstallment(installment)
    setPayDialogOpen(true)
  }

  const handleIssueBoleto = (installment: Installment) => {
    issueBoletoMutation.mutate(installment.id)
  }

  const handleViewDetails = (installment: InstallmentSummaryItemResponse) => {
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
            Acompanhe parcelas, recebimentos e vencimentos da carteira.
          </p>
        </div>

        <InstallmentsVitalsStrip summary={summary} isLoading={isLoading} />

        <Tabs value={view.tab} onValueChange={view.setTab}>
          <TabsList variant="line">
            <TabsTrigger value="resumo">
              <LayoutDashboard className="size-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="parcelas">
              <ReceiptText className="size-4" />
              Parcelas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className={TAB_CONTENT_MOTION}>
            <InstallmentsAgingBlock
              summary={summary}
              isLoading={isLoading}
              onSelectBucket={applyAgingBucket}
            />
          </TabsContent>

          <TabsContent value="parcelas" className={TAB_CONTENT_MOTION}>
            <div className="space-y-6">
              <InstallmentsFilters
                {...filters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />

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
          </TabsContent>
        </Tabs>
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
