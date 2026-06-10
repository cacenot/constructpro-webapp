import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { CarteiraCompositionBar } from '@/components/financeiro/carteira-composition-bar'
import { InstallmentDetailDrawer } from '@/components/financeiro/installment-detail-drawer'
import { InstallmentDetailPanel } from '@/components/financeiro/installment-detail-panel'
import { InstallmentsFilters } from '@/components/financeiro/installments-filters'
import { InstallmentsTable } from '@/components/financeiro/installments-table'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import type {
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
} from '@/hooks/use-installments'
import { installmentKeys } from '@/hooks/use-installments'
import { useInstallmentsTable } from '@/hooks/use-installments-table'
import { useMediaQuery } from '@/hooks/use-media-query'
import { handleApiError, throwApiError } from '@/lib/api-error'

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
    selectedInstallmentId,
    setSelectedInstallmentId,
  } = useInstallmentsTable()

  const { client } = useApiClient()
  const queryClient = useQueryClient()

  // Master-detail: painel inline ao lado da tabela em telas largas; abaixo de
  // lg o mesmo painel abre como drawer overlay (não cabe lado a lado).
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const detailOpen = !!selectedInstallmentId

  // Presença do aside: ao fechar, segura o painel montado por um ciclo de animação
  // (detail-out) antes de desmontar; o conteúdo congela na última parcela vista.
  const [detailExiting, setDetailExiting] = useState(false)
  const lastInstallmentIdRef = useRef('')
  if (selectedInstallmentId) lastInstallmentIdRef.current = selectedInstallmentId
  const prevDetailOpenRef = useRef(detailOpen)
  useEffect(() => {
    const wasOpen = prevDetailOpenRef.current
    prevDetailOpenRef.current = detailOpen
    if (detailOpen) {
      setDetailExiting(false)
      return
    }
    if (wasOpen) {
      setDetailExiting(true)
      const timer = window.setTimeout(() => setDetailExiting(false), 220)
      return () => window.clearTimeout(timer)
    }
  }, [detailOpen])

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
    onSuccess: (_data, installmentId) => {
      toast.success('Boleto emitido com sucesso')
      // Emitir boleto muda status (→ invoiced) e gera boleto_url. A aba Parcelas
      // lê de `summary` (tabela) e o painel de `detail` — `lists()` (prefixo
      // distinto) não os alcança, então sem estas duas a UI ficava velha.
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.summaries() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.detail(installmentId) })
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

  // Estável: é o onRowClick da tabela — referência nova quebraria a memoização
  // por linha (DataTableRow) e voltaria a re-renderizar a lista inteira ao selecionar.
  const handleViewDetails = useCallback(
    (installment: InstallmentSummaryItemResponse) => {
      setSelectedInstallmentId(installment.id)
    },
    [setSelectedInstallmentId]
  )

  const handleCloseDrawer = useCallback(() => {
    setSelectedInstallmentId('')
  }, [setSelectedInstallmentId])

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <h1 className="shrink-0 text-xl font-semibold tracking-tight">Financeiro</h1>

        {/* Pulso da carteira — filtro-scoped, acompanha o recorte da tabela. */}
        <CarteiraCompositionBar summary={summary} isLoading={isLoading} className="shrink-0" />

        <InstallmentsFilters
          {...filters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* overflow-x-clip: o aside anima com translateX e não pode vazar do layout */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-clip lg:flex-row lg:items-stretch">
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

          {/* Painel inline (master-detail) só em telas largas; abaixo de lg o mesmo
              painel vira drawer (ver abaixo). Entra e sai deslizando pela borda
              direita (transform-only); na saída fica montado até o fim do detail-out. */}
          {(detailOpen || detailExiting) && isDesktop && (
            <aside
              className={`flex min-h-0 w-[27rem] shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm ${
                detailOpen ? 'animate-detail-in' : 'animate-detail-out'
              }`}
            >
              <div className="flex h-full w-[27rem] shrink-0 flex-col">
                <InstallmentDetailPanel
                  installmentId={detailOpen ? selectedInstallmentId : lastInstallmentIdRef.current}
                  onClose={handleCloseDrawer}
                  onSelectInstallment={setSelectedInstallmentId}
                  onPayInstallment={handlePayInstallment}
                  onIssueBoleto={handleIssueBoleto}
                />
              </div>
            </aside>
          )}
        </div>
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
