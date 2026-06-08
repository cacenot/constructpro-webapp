import {
  translateInstallmentKind,
  translateLedgerEntryKind,
  translatePaymentMethod,
  translatePaymentStatus,
} from '@cacenot/construct-pro-api-client/enums'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CreditCard, ExternalLink, Hash, Receipt, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useContractDetail } from '@/hooks/use-contract-detail'
import type { InstallmentDetailResponse } from '@/hooks/use-installments'
import { useInstallment, useInstallments } from '@/hooks/use-installments'
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
  scheduled: 'Agendada',
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

function isOpenOverdue(dueDate: string, status?: string): boolean {
  return isPast(parseISO(dueDate)) && status !== 'paid' && status !== 'canceled'
}

function pctOf(rate: string | undefined): number {
  return Math.min(100, Math.max(0, Number(rate ?? 0) || 0))
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  )
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
    <div className="bg-muted/30 px-4 py-4">
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
    <div className="px-4 py-4">
      <SectionLabel>
        Parcelas do contrato <span className="tabular-nums">({items.length})</span>
      </SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {items.map((inst) => {
          const overdue = isOpenOverdue(inst.due_date, inst.status)
          const isCurrent = inst.id === currentId
          const statusLabel = overdue ? 'Vencida' : (STATUS_LABEL[inst.status ?? ''] ?? '—')
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
            <button
              key={inst.id}
              type="button"
              aria-current={isCurrent ? 'true' : undefined}
              title={`Parcela ${inst.installment_number ?? '—'} · vence ${format(parseISO(inst.due_date), 'dd/MM/yyyy')} · ${formatCurrency(inst.current_amount.cents / 100)} · ${statusLabel}`}
              onClick={() => onSelect(inst.id)}
              className={cn(
                'flex size-7 items-center justify-center rounded-md text-[0.625rem] font-medium tabular-nums transition-colors',
                tone,
                isCurrent && 'ring-2 ring-primary'
              )}
            >
              {inst.installment_number ?? '·'}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-muted-foreground">
        <LegendDot className="bg-success" label="Paga" />
        <LegendDot className="bg-destructive" label="Vencida" />
        <LegendDot className="bg-warning" label="Parcial" />
        <LegendDot className="bg-muted-foreground/40" label="A vencer" />
      </div>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} />
      {label}
    </span>
  )
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
          <Skeleton key={i} className="size-7 rounded-md" />
        ))}
      </div>
    </div>
  )
}

function PanelHeader({
  installment,
  onClose,
}: {
  installment?: InstallmentDetailResponse
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {installment ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                #{installment.contract_id}
                {installment.installment_number != null && `-${installment.installment_number}`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {translateInstallmentKind(installment.kind, 'pt-BR')}
              </span>
            </div>
            {installment.status && <InstallmentStatusBadge status={installment.status} />}
          </>
        ) : (
          <Skeleton className="h-6 w-36" />
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
 * drawer no mobile. Busca a própria parcela, o resumo do contrato e a agenda de
 * parcelas (para navegação). Espelha GET /installments/{id} + /contracts/{id}.
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

  const dueDate = parseISO(installment.due_date)
  const isOverdue = isOpenOverdue(installment.due_date, installment.status)
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
        <ContractMiniSummary contractId={installment.contract_id} />
        <Separator />
        <ContractScheduleStrip
          contractId={installment.contract_id}
          currentId={installment.id}
          onSelect={onSelectInstallment}
        />

        {(canPay || canIssueBoleto) && (
          <>
            <Separator />
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
          </>
        )}

        <Separator />

        {/* Valores da parcela */}
        <div className="px-4 py-4">
          <SectionLabel>Valores</SectionLabel>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor atual</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(installment.current_amount.cents / 100)}
              </span>
            </div>
            {hasCorrectionDiff && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor base</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(installment.base_amount.cents / 100)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pago</span>
              <span className="text-sm font-medium text-success tabular-nums">
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

        {/* Dados da parcela */}
        <div className="px-4 py-4">
          <SectionLabel>Dados da parcela</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={Receipt}
              label="Tipo"
              value={translateInstallmentKind(installment.kind, 'pt-BR')}
            />
            <DetailItem
              icon={CreditCard}
              label="Forma de pagamento"
              value={
                PAYMENT_METHOD_LABELS[installment.payment_method] ?? installment.payment_method
              }
            />
            <DetailItem
              icon={Calendar}
              label="Vencimento"
              value={
                <span className={isOverdue ? 'text-destructive' : ''}>
                  {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  <br />
                  <span className="text-xs font-normal">
                    {formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })}
                  </span>
                </span>
              }
            />
            {installment.installment_number != null && (
              <DetailItem
                icon={Hash}
                label="Nº da parcela"
                value={installment.installment_number}
              />
            )}
          </div>
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
                                <span
                                  className={cn(
                                    'text-muted-foreground',
                                    isCurrentInstallment && 'text-foreground'
                                  )}
                                >
                                  {isCurrentInstallment
                                    ? 'Esta parcela'
                                    : `Parcela ${alloc.installment_id.slice(0, 8)}…`}
                                </span>
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
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={`/contratos/${installment.contract_id}`}>Ver contrato completo</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
