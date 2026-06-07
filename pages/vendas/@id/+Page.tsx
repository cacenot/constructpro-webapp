import { type components, useSale } from '@cacenot/construct-pro-api-client'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApproveSaleDialog } from '@/components/vendas/approve-sale-dialog'
import { DealActions } from '@/components/vendas/deal-actions'
import { DealCockpit } from '@/components/vendas/deal-cockpit'
import { DealCommissionPanel } from '@/components/vendas/deal-commission-panel'
import { DealContractPanel } from '@/components/vendas/deal-contract-panel'
import { DealCorrectionPanel } from '@/components/vendas/deal-correction-panel'
import { DealFinancialPanel } from '@/components/vendas/deal-financial-panel'
import { DealPaymentsPanel } from '@/components/vendas/deal-payments-panel'
import { DealSchedulePanel } from '@/components/vendas/deal-schedule-panel'
import { DealValuesPanel } from '@/components/vendas/deal-values-panel'
import { SignContractDialog } from '@/components/vendas/sign-contract-dialog'
import { type ContractDetailResponse, useContractDetail } from '@/hooks/use-contract-detail'
import { getDealStage, getLiveContractId, getPrimaryAction } from '@/lib/deal-state'

type Sale = components['schemas']['SaleResponse']

interface FinancialState {
  contractDetail?: ContractDetailResponse
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function FinancialSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

function FinancialError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="size-7 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Não foi possível carregar a saúde financeira</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            O contrato existe, mas os dados financeiros ao vivo falharam ao carregar.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  )
}

function DealDossier({ sale, financial }: { sale: Sale; financial: FinancialState }) {
  const stage = getDealStage(sale)
  const hasBroker = !!sale.broker_id
  const {
    contractDetail,
    isLoading: isContractLoading,
    isError: isContractError,
    onRetry,
  } = financial

  // O cronograma usa o plano ao vivo do contrato quando existe; senão, o da proposta.
  const scheduleSummary = contractDetail?.installment_summary ?? sale.installment_summary
  const schedules = scheduleSummary?.schedules ?? []
  const scheduleTotalCount = scheduleSummary?.total_count ?? 0
  const scheduleTotalCents = scheduleSummary?.total_amount?.cents ?? sale.amount.cents

  const schedule = schedules.length > 0 && (
    <DealSchedulePanel
      schedules={schedules}
      totalCount={scheduleTotalCount}
      totalAmountCents={scheduleTotalCents}
    />
  )
  const values = <DealValuesPanel sale={sale} />
  const contract = <DealContractPanel sale={sale} />
  const commission = hasBroker ? <DealCommissionPanel sale={sale} /> : null

  // Dossiê do financiamento ao vivo (vendas fechadas com contrato materializado)
  if (stage === 'closed') {
    const fin = contractDetail?.financial_summary
    const correction = contractDetail?.correction_summary
    const payment = contractDetail?.payment_summary

    return (
      <div className="min-w-0 space-y-6">
        {isContractError ? (
          <FinancialError onRetry={onRetry} />
        ) : isContractLoading && !fin ? (
          <FinancialSkeleton />
        ) : (
          <>
            {fin && (
              <DealFinancialPanel
                financial={fin}
                timeline={contractDetail?.balance_timeline}
                status={contractDetail?.status}
              />
            )}
            {(correction || payment) && (
              <div className="grid gap-6 lg:grid-cols-2">
                {correction && <DealCorrectionPanel correction={correction} />}
                {payment && <DealPaymentsPanel payment={payment} />}
              </div>
            )}
          </>
        )}
        {schedule}
        <div className="grid gap-6 lg:grid-cols-2">
          {values}
          {contract}
        </div>
        {commission}
      </div>
    )
  }

  // Dossiê da proposta (proposal / awaiting_close / lost)
  return (
    <div className="min-w-0 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {values}
        {contract}
      </div>
      {schedule}
      {commission}
    </div>
  )
}

function SaleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="space-y-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

export default function SaleDetailPage() {
  const pageContext = usePageContext()
  const saleId = Number(pageContext.routeParams?.id)

  const [signOpen, setSignOpen] = useState(false)
  const [payEntryOpen, setPayEntryOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)

  const { data: sale, isLoading, error } = useSale(saleId)

  const contractId = sale ? getLiveContractId(sale) : undefined
  const {
    data: contractDetail,
    isLoading: isContractLoading,
    isError: isContractError,
    refetch: refetchContract,
  } = useContractDetail(contractId)

  // Atalho de teclado da ação primária (desktop): A=aprovar, S=assinar, E=receber.
  const primaryAction = useMemo(() => (sale ? getPrimaryAction(sale) : null), [sale])
  useEffect(() => {
    if (!primaryAction) return
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (approveOpen || signOpen || payEntryOpen) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (event.key.toLowerCase() !== primaryAction?.key) return
      event.preventDefault()
      if (primaryAction?.kind === 'approve') setApproveOpen(true)
      else if (primaryAction?.kind === 'sign') setSignOpen(true)
      else setPayEntryOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [primaryAction, approveOpen, signOpen, payEntryOpen])

  if (isLoading) {
    return (
      <AppLayout>
        <SaleDetailSkeleton />
      </AppLayout>
    )
  }

  if (error || !sale) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Proposta não encontrada</p>
          <Button variant="link" onClick={() => navigate('/vendas')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  const financial: FinancialState = {
    contractDetail,
    isLoading: isContractLoading,
    isError: isContractError,
    onRetry: () => refetchContract(),
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          onClick={() => navigate('/vendas')}
        >
          <ArrowLeft className="size-4" />
          Voltar para Vendas
        </Button>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <DealCockpit
            sale={sale}
            contractDetail={contractDetail}
            isContractLoading={isContractLoading}
            isContractError={isContractError}
            actions={
              <DealActions
                sale={sale}
                contractDetail={contractDetail}
                onApprove={() => setApproveOpen(true)}
                onSign={() => setSignOpen(true)}
                onPayEntry={() => setPayEntryOpen(true)}
              />
            }
          />
          <DealDossier sale={sale} financial={financial} />
        </div>
      </div>

      <ApproveSaleDialog open={approveOpen} onOpenChange={setApproveOpen} saleId={saleId} />
      <SignContractDialog open={signOpen} onOpenChange={setSignOpen} saleId={saleId} />
      <PayInstallmentDialog open={payEntryOpen} onOpenChange={setPayEntryOpen} saleId={saleId} />
    </AppLayout>
  )
}
