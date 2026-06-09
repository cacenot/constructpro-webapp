import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { InstallmentDetailDrawer } from '@/components/financeiro/installment-detail-drawer'
import { InstallmentDetailPanel } from '@/components/financeiro/installment-detail-panel'
import { InstallmentsAgingBlock } from '@/components/financeiro/installments-aging-block'
import { InstallmentsByProjectBlock } from '@/components/financeiro/installments-by-project-block'
import { InstallmentsCashflowBlock } from '@/components/financeiro/installments-cashflow-block'
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
import { installmentKeys, useInstallmentsFinancialSummary } from '@/hooks/use-installments'
import { useInstallmentsTable } from '@/hooks/use-installments-table'
import { useMediaQuery } from '@/hooks/use-media-query'
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
    queryParams,
    applyAgingBucket,
    applyMonthFilter,
    applyProjectFilter,
    selectedInstallmentId,
    setSelectedInstallmentId,
  } = useInstallmentsTable()

  const { client } = useApiClient()
  const queryClient = useQueryClient()

  // Pulso nivel-ledger (contratos): reconcilia com os filtros de projeto/cliente.
  const { data: financialSummary, isLoading: isFinancialSummaryLoading } =
    useInstallmentsFinancialSummary({
      project_id: filters.projectFilter,
      customer_id: filters.customerFilter?.id ?? null,
    })

  // Master-detail: painel inline ao lado da tabela em telas largas; abaixo de
  // lg o mesmo painel abre como drawer overlay (não cabe lado a lado).
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const detailOpen = !!selectedInstallmentId

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

        {/* Pulso. 5º vital "Contratos" (financial-summary) ligado: contratos
            ativos + inadimplência derivada (overdue_contracts), reconciliando
            com a carteira. construct-pro-api #140 resolveu a contagem. */}
        <InstallmentsVitalsStrip
          summary={summary}
          financialSummary={financialSummary}
          isLoading={isLoading || isFinancialSummaryLoading}
          withContracts
        />

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
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <InstallmentsAgingBlock
                  summary={summary}
                  isLoading={isLoading}
                  onSelectBucket={applyAgingBucket}
                />
              </div>
              <div className="lg:col-span-7">
                <InstallmentsCashflowBlock
                  projectId={filters.projectFilter}
                  customerId={filters.customerFilter?.id ?? null}
                  onSelectMonth={applyMonthFilter}
                />
              </div>
              <div className="lg:col-span-12">
                <InstallmentsByProjectBlock
                  baseParams={queryParams}
                  onSelectProject={applyProjectFilter}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parcelas" className={TAB_CONTENT_MOTION}>
            <div className="space-y-6">
              <InstallmentsFilters
                {...filters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
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

                {/* Painel inline (master-detail) só em telas largas; abaixo de lg
                    o mesmo painel vira drawer (ver abaixo). */}
                {detailOpen && isDesktop && (
                  <aside className="w-full shrink-0 lg:w-[27rem]">
                    <Card className="sticky top-6 flex max-h-[calc(100vh-6rem)] flex-col gap-0 overflow-hidden p-0 shadow-sm">
                      <InstallmentDetailPanel
                        installmentId={selectedInstallmentId}
                        onClose={handleCloseDrawer}
                        onSelectInstallment={setSelectedInstallmentId}
                        onPayInstallment={handlePayInstallment}
                        onIssueBoleto={handleIssueBoleto}
                      />
                    </Card>
                  </aside>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile/tablet: o painel da parcela abre como drawer overlay. */}
      {!isDesktop && (
        <InstallmentDetailDrawer
          installmentId={selectedInstallmentId}
          open={detailOpen}
          onClose={handleCloseDrawer}
          onSelectInstallment={setSelectedInstallmentId}
          onPayInstallment={handlePayInstallment}
          onIssueBoleto={handleIssueBoleto}
        />
      )}

      <PayInstallmentDialog
        installment={selectedInstallment}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
      />
    </AppLayout>
  )
}
