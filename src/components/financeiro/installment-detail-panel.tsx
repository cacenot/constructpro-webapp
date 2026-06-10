import {
  translateInstallmentKind,
  translateLedgerEntryKind,
  translatePaymentMethod,
  translatePaymentStatus,
} from '@cacenot/construct-pro-api-client/enums'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink, Receipt, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { LegendDot } from '@/components/ui/legend-dot'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useContractDetail } from '@/hooks/use-contract-detail'
import type {
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
} from '@/hooks/use-installments'
import { useInstallment, useInstallments } from '@/hooks/use-installments'
import { installmentDaysOverdue, isInstallmentOverdue } from '@/lib/installment-overdue'
import { cn, formatCurrency } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'
import { InstallmentStatusBadge } from './installment-status-badge'

const BOLETO_STATUS_LABELS: Record<string, string> = {
  saved: 'Salvo',
  registered: 'Registrado',
  settled: 'Liquidado',
  written_off: 'Baixado',
  rejected: 'Rejeitado',
  protested: 'Protestado',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Pendente',
  invoiced: 'Faturada',
  partial: 'Parcial',
  paid: 'Paga',
  canceled: 'Cancelada',
}

interface InstallmentDetailPanelProps {
  installmentId: string
  onClose: () => void
  onSelectInstallment: (id: string) => void
  onPayInstallment: (installment: InstallmentDetailResponse) => void
  onIssueBoleto: (installment: InstallmentDetailResponse) => void
}

function pctOf(rate: string | undefined): number {
  return Math.min(100, Math.max(0, Number(rate ?? 0) || 0))
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  )
}

/** Saldo devedor + progresso do contrato (não da parcela): o contexto que faltava. */
function ContractMiniSummary({ contractId }: { contractId: number }) {
  const { data: contract } = useContractDetail(contractId)
  const fin = contract?.financial_summary
  if (!fin) return null

  const outstanding = fin.outstanding_balance?.cents ?? 0
  const pct = pctOf(fin.payment_progress_percentage)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Saldo devedor do contrato</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(outstanding / 100)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {Math.round(pct)}% pago
        </span>
      </div>
    </div>
  )
}

/** Agenda do contrato como heatmap navegável: uma célula por parcela, cor por
 * status, atual com anel lima (seleção). Clicar troca a parcela do painel. */
function ContractScheduleStrip({
  contractId,
  currentId,
  onSelect,
}: {
  contractId: number
  currentId: string
  onSelect: (id: string) => void
}) {
  const { data } = useInstallments(
    { contract_id: contractId, page_size: 100, sort_by: ['due_date:asc'] },
    { enabled: !!contractId }
  )
  const items = data?.items ?? []
  if (items.length <= 1) return null

  return (
    <div>
      <SectionLabel>
        Parcelas do contrato <span className="tabular-nums">({items.length})</span>
      </SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {items.map((inst) => {
          const overdue = isInstallmentOverdue(inst)
          const isCurrent = inst.id === currentId
          const statusLabel = overdue ? 'Em atraso' : (STATUS_LABEL[inst.status ?? ''] ?? '—')
          const tone =
            inst.status === 'paid'
              ? 'bg-success/15 text-success'
              : overdue
                ? 'bg-destructive/15 text-destructive'
                : inst.status === 'partial'
                  ? 'bg-warning/15 text-warning'
                  : inst.status === 'canceled'
                    ? 'bg-muted text-muted-foreground/50 line-through'
                    : 'bg-muted text-muted-foreground'
          return (
            <HoverCard key={inst.id} openDelay={150} closeDelay={75}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={`Parcela ${inst.installment_number ?? '—'} · vence ${format(parseISO(inst.due_date), 'dd/MM/yyyy')} · ${formatCurrency(inst.current_amount.cents / 100)} · ${statusLabel}`}
                  onClick={() => onSelect(inst.id)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md text-[0.625rem] font-medium tabular-nums transition-colors sm:size-7',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    tone,
                    isCurrent && 'ring-2 ring-primary'
                  )}
                >
                  {inst.installment_number ?? '·'}
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="top" sideOffset={6} className="w-60 p-3">
                <ScheduleCellDetails inst={inst} />
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-muted-foreground">
        <LegendDot className="bg-success" label="Paga" />
        <LegendDot className="bg-destructive" label="Em atraso" />
        <LegendDot className="bg-warning" label="Parcial" />
        <LegendDot className="bg-muted-foreground/40" label="A vencer" />
      </div>
    </div>
  )
}

/** Conteúdo do popover de uma célula da agenda: a parcela em miniatura (valor,
 * status com glow, vencimento) + pago/restante quando há pagamento em aberto. */
function ScheduleCellDetails({ inst }: { inst: InstallmentSummaryItemResponse }) {
  const overdue = isInstallmentOverdue(inst)
  const days = installmentDaysOverdue(inst)
  const hasOpenPayment = inst.paid_amount.cents > 0 && inst.status !== 'paid'

  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Parcela {inst.installment_number ?? '—'}</span>
        <span className="text-xs text-muted-foreground">
          {translateInstallmentKind(inst.kind, 'pt-BR')}
        </span>
      </div>
      <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">
        {formatCurrency(inst.current_amount.cents / 100)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {inst.status && (
          <InstallmentStatusBadge status={inst.status} overdue={overdue} daysOverdue={days} />
        )}
        <span
          className={cn(
            'text-xs',
            overdue ? 'font-medium text-destructive' : 'text-muted-foreground'
          )}
        >
          Vence {format(parseISO(inst.due_date), 'dd/MM/yyyy')}
        </span>
      </div>
      {hasOpenPayment && (
        <div className="mt-2.5 space-y-1.5 border-t pt-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pago</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(inst.paid_amount.cents / 100)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Restante</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(inst.remaining_amount.cents / 100)}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
          <Skeleton key={i} className="size-7 rounded-md" />
        ))}
      </div>
    </div>
  )
}

/** Cabeçalho com a PARCELA em foco: valor em destaque, status (incl. Em atraso) e
 * vencimento; o contrato fica como metadado secundário (mono, acima). */
function PanelHeader({
  installment,
  onClose,
}: {
  installment?: InstallmentDetailResponse
  onClose: () => void
}) {
  const overdue = installment ? isInstallmentOverdue(installment) : false
  const days = installment ? installmentDaysOverdue(installment) : 0

  return (
    <div className="flex items-start justify-between gap-2 border-b p-4">
      <div className="flex min-w-0 flex-col gap-2">
        {installment ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums text-foreground/80">
                #{installment.contract_id}
                {installment.installment_number != null && `-${installment.installment_number}`}
              </span>
              <span aria-hidden>·</span>
              <span>{translateInstallmentKind(installment.kind, 'pt-BR')}</span>
              <span aria-hidden>·</span>
              <span>
                {PAYMENT_METHOD_LABELS[installment.payment_method] ?? installment.payment_method}
              </span>
            </div>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(installment.current_amount.cents / 100)}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {installment.status && (
                <InstallmentStatusBadge
                  status={installment.status}
                  overdue={overdue}
                  daysOverdue={days}
                />
              )}
              <span
                className={`text-xs ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
              >
                Vence{' '}
                {format(parseISO(installment.due_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                {/* O relativo só quando não vencida: em atraso o badge já traz os dias. */}
                {!overdue && (
                  <span className="text-muted-foreground">
                    {' '}
                    ·{' '}
                    {formatDistanceToNow(parseISO(installment.due_date), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                )}
              </span>
            </div>
          </>
        ) : (
          <Skeleton className="h-8 w-36" />
        )}
      </div>
      <Button variant="ghost" size="icon-sm" className="mt-0.5 shrink-0" onClick={onClose}>
        <X className="size-4" />
        <span className="sr-only">Fechar</span>
      </Button>
    </div>
  )
}

/**
 * Painel de detalhe da parcela, contextualizado no contrato. Conteúdo agnóstico
 * de container: renderiza inline (master-detail) em telas largas e dentro de um
 * drawer no mobile. A parcela é o foco (header + ações + valores); o contrato vem
 * como contexto abaixo (saldo + agenda navegável). Espelha GET /installments/{id}.
 */
export function InstallmentDetailPanel({
  installmentId,
  onClose,
  onSelectInstallment,
  onPayInstallment,
  onIssueBoleto,
}: InstallmentDetailPanelProps) {
  const { data: installment, isLoading } = useInstallment(installmentId)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader onClose={onClose} />
        <PanelSkeleton />
      </div>
    )
  }

  if (!installment) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader onClose={onClose} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <Receipt className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Parcela não encontrada.</p>
        </div>
      </div>
    )
  }

  const hasCorrectionDiff = installment.current_amount.cents !== installment.base_amount.cents
  const canPay = installment.status !== 'paid' && installment.status !== 'canceled'
  const canIssueBoleto =
    (installment.status === 'scheduled' || installment.status === 'invoiced') &&
    installment.payment_method === 'boleto'

  const payments = installment.payments ?? []
  const ledgerEntries = (installment.ledger_entries ?? []).sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  )

  return (
    <div className="flex h-full flex-col">
      <PanelHeader installment={installment} onClose={onClose} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Ação primária logo abaixo do foco. */}
        {(canPay || canIssueBoleto) && (
          <>
            <div className="flex gap-2 px-4 py-3">
              {canPay && (
                <Button size="sm" className="flex-1" onClick={() => onPayInstallment(installment)}>
                  Registrar pagamento
                </Button>
              )}
              {canIssueBoleto && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onIssueBoleto(installment)}
                >
                  Emitir boleto
                </Button>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Valores da parcela */}
        <div className="px-4 py-4">
          <SectionLabel>Valores da parcela</SectionLabel>
          <div className="space-y-4">
            {hasCorrectionDiff && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor base</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(installment.base_amount.cents / 100)}
                </span>
              </div>
            )}
            {/* Sem cor nos valores: a sinalização de atraso já mora no cabeçalho. */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pago</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(installment.paid_amount.cents / 100)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Restante</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(installment.remaining_amount.cents / 100)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contexto do contrato: saldo + agenda navegável (não é o foco). */}
        <div className="space-y-4 px-4 py-4">
          <ContractMiniSummary contractId={installment.contract_id} />
          <ContractScheduleStrip
            contractId={installment.contract_id}
            currentId={installment.id}
            onSelect={onSelectInstallment}
          />
        </div>

        {/* Pagamentos */}
        {payments.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-4">
              <SectionLabel>Pagamentos</SectionLabel>
              <div className="flex flex-col gap-3">
                {payments.map((payment) => {
                  const allocations = payment.installment_allocations ?? []
                  const isSplitPayment = allocations.length > 1

                  return (
                    <div key={payment.id} className="flex flex-col gap-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {translatePaymentMethod(payment.method, 'pt-BR')}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              payment.status === 'confirmed' &&
                                'border-success/30 bg-success/10 text-success',
                              payment.status === 'pending' &&
                                'border-warning/30 bg-warning/10 text-warning',
                              payment.status === 'canceled' &&
                                'border-destructive/30 bg-destructive/10 text-destructive',
                              payment.status === 'refunded' && 'border-info/30 bg-info/10 text-info'
                            )}
                          >
                            {translatePaymentStatus(payment.status ?? 'confirmed', 'pt-BR')}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(payment.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Valor total</span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(payment.amount.cents / 100)}
                        </span>
                      </div>

                      {isSplitPayment && (
                        <div className="flex flex-col gap-1.5 border-t pt-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Alocações
                          </span>
                          {allocations.map((alloc) => {
                            const isCurrentInstallment = alloc.installment_id === installment.id
                            return (
                              <div
                                key={`${alloc.payment_id}-${alloc.installment_id}`}
                                className={cn(
                                  'flex items-center justify-between text-xs',
                                  isCurrentInstallment && 'font-medium'
                                )}
                              >
                                {isCurrentInstallment ? (
                                  <span className="text-foreground">Esta parcela</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onSelectInstallment(alloc.installment_id)}
                                    className="rounded-sm text-left text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    Outra parcela
                                  </button>
                                )}
                                <span className="tabular-nums">
                                  {formatCurrency(alloc.amount.cents / 100)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {payment.boleto && (
                        <div className="flex flex-col gap-1.5 border-t pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Boleto</span>
                            <span>
                              {BOLETO_STATUS_LABELS[payment.boleto.status ?? ''] ??
                                payment.boleto.status}
                            </span>
                          </div>
                          {payment.boleto.boleto_url && (
                            <a
                              href={payment.boleto.boleto_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              Ver boleto
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Movimentações (Ledger) */}
        {ledgerEntries.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-4">
              <SectionLabel>Movimentações</SectionLabel>
              <div className="flex flex-col gap-2">
                {ledgerEntries.map((entry) => {
                  const isPositive = entry.amount.cents > 0
                  return (
                    <div key={entry.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {translateLedgerEntryKind(entry.kind, 'pt-BR')}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium tabular-nums',
                            isPositive ? 'text-destructive' : 'text-success'
                          )}
                        >
                          {isPositive ? '+' : ''}
                          {formatCurrency(entry.amount.cents / 100)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(entry.occurred_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                      {entry.kind === 'correction' && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {entry.index_type_code && (
                            <span>
                              Índice: <strong>{entry.index_type_code}</strong>
                            </span>
                          )}
                          {entry.reference_month && (
                            <span>Ref.: {format(parseISO(entry.reference_month), 'MM/yyyy')}</span>
                          )}
                          {entry.variation?.ppm != null && (
                            <span>
                              Variação:{' '}
                              <strong className="tabular-nums">
                                {((entry.variation?.ppm as number) / 10000)
                                  .toFixed(2)
                                  .replace('.', ',')}
                                %
                              </strong>
                            </span>
                          )}
                        </div>
                      )}
                      {entry.note && (
                        <p className="text-xs text-muted-foreground italic">{entry.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="px-4 py-4">
          <a
            href={`/contratos/${installment.contract_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver contrato completo
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
