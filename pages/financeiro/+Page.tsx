import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { CarteiraCompositionBar } from '@/components/financeiro/carteira-composition-bar'
import { InstallmentDetailDrawer } from '@/components/financeiro/installment-detail-drawer'
import { InstallmentDetailPanel } from '@/components/financeiro/installment-detail-panel'
import { InstallmentsAgingBlock } from '@/components/financeiro/installments-aging-block'
import { InstallmentsByProjectBlock } from '@/components/financeiro/installments-by-project-block'
import { InstallmentsCashflowBlock } from '@/components/financeiro/installments-cashflow-block'
import { InstallmentsFilters } from '@/components/financeiro/installments-filters'
import { InstallmentsTable } from '@/components/financeiro/installments-table'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
} from '@/hooks/use-installments'
import { installmentKeys } from '@/hooks/use-installments'
import { useInstallmentsTable } from '@/hooks/use-installments-table'
import { useMediaQuery } from '@/hooks/use-media-query'
import { handleApiError, throwApiError } from '@/lib/api-error'

// Revela a aba ativa: fade + slide-up sutil, 200ms, ease-out. Neutralizado em
// reduced-motion pela regra global em globals.css.
const TAB_CONTENT_MOTION = 'animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-out'

export default function FinanceiroPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    summary,
    hasActiveFilters,
    handleClearFilters,
    filters,
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
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <h1 className="shrink-0 text-xl font-semibold tracking-tight">Financeiro</h1>

        <Tabs
          value={view.tab}
          onValueChange={view.setTab}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList variant="line" className="shrink-0">
            <TabsTrigger value="resumo">
              <LayoutDashboard className="size-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="parcelas">
              <ReceiptText className="size-4" />
              Parcelas
            </TabsTrigger>
          </TabsList>

          {/* Pulso da carteira, persistente nas duas abas. Filtro-scoped. */}
          <CarteiraCompositionBar summary={summary} isLoading={isLoading} className="shrink-0" />

          <TabsContent
            value="resumo"
            className={`min-h-0 flex-1 overflow-y-auto pb-2 ${TAB_CONTENT_MOTION}`}
          >
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

          <TabsContent
            value="parcelas"
            className={`flex min-h-0 flex-1 flex-col gap-4 ${TAB_CONTENT_MOTION}`}
          >
            <InstallmentsFilters
              {...filters}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
                <InstallmentsTable
                  data={data}
                  isLoading={isLoading}
                  isError={isError}
                  onRetry={refetch}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onViewDetails={handleViewDetails}
                  selectedId={selectedInstallmentId}
                  sort={sort.sort}
                  onSort={sort.setSort}
                  total={total}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onReachEnd={fetchNextPage}
                />
              </div>

              {/* Painel inline (master-detail) só em telas largas; abaixo de lg
                  o mesmo painel vira drawer (ver abaixo). */}
              {detailOpen && isDesktop && (
                <aside className="flex w-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:w-[27rem]">
                  <InstallmentDetailPanel
                    installmentId={selectedInstallmentId}
                    onClose={handleCloseDrawer}
                    onSelectInstallment={setSelectedInstallmentId}
                    onPayInstallment={handlePayInstallment}
                    onIssueBoleto={handleIssueBoleto}
                  />
                </aside>
              )}
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
