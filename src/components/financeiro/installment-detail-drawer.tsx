import {
  translateInstallmentKind,
  translateLedgerEntryKind,
  translatePaymentMethod,
  translatePaymentStatus,
} from '@cacenot/construct-pro-api-client/enums'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Banknote,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Receipt,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { InstallmentDetailResponse } from '@/hooks/use-installments'
import { useInstallment } from '@/hooks/use-installments'
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

interface InstallmentDetailDrawerProps {
  installmentId: string
  open: boolean
  onClose: () => void
  onPayInstallment: (installment: InstallmentDetailResponse) => void
  onIssueBoleto: (installment: InstallmentDetailResponse) => void
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
        <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function InstallmentDetailContent({
  installment,
  onPayInstallment,
  onIssueBoleto,
}: {
  installment: InstallmentDetailResponse
  onPayInstallment: (installment: InstallmentDetailResponse) => void
  onIssueBoleto: (installment: InstallmentDetailResponse) => void
}) {
  const dueDate = parseISO(installment.due_date)
  const isOverdue =
    isPast(dueDate) && installment.status !== 'paid' && installment.status !== 'canceled'
  const hasCorrectionDiff = installment.current_amount_cents !== installment.base_amount_cents
  const canPay = installment.status !== 'paid' && installment.status !== 'canceled'
  const canIssueBoleto =
    (installment.status === 'scheduled' || installment.status === 'invoiced') &&
    installment.payment_method === 'boleto'

  const payments = installment.payments ?? []
  const ledgerEntries = (installment.ledger_entries ?? []).sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  )

  return (
    <div className="flex flex-col gap-0 overflow-y-auto flex-1">
      {/* Ações */}
      {(canPay || canIssueBoleto) && (
        <>
          <div className="px-4 py-3 flex gap-2">
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

      {/* Valores */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Valores
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor atual</span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(installment.current_amount_cents / 100)}
            </span>
          </div>
          {hasCorrectionDiff && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor base</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(installment.base_amount_cents / 100)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pago</span>
            <span className="text-sm font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatCurrency(Number(installment.paid_amount))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Restante</span>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(Number(installment.remaining_amount))}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Dados básicos */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Dados da parcela
        </p>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem
            icon={Receipt}
            label="Tipo"
            value={translateInstallmentKind(installment.kind, 'pt-BR')}
          />
          <DetailItem
            icon={CreditCard}
            label="Forma de pagamento"
            value={PAYMENT_METHOD_LABELS[installment.payment_method] ?? installment.payment_method}
          />
          <DetailItem
            icon={Calendar}
            label="Vencimento"
            value={
              <span className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                <br />
                <span className="text-xs font-normal">
                  {formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })}
                </span>
              </span>
            }
          />
          {installment.installment_number != null && (
            <DetailItem icon={Hash} label="Nº da parcela" value={installment.installment_number} />
          )}
        </div>
      </div>

      {/* Pagamentos */}
      {payments.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Pagamentos
            </p>
            <div className="flex flex-col gap-3">
              {payments.map((payment) => {
                const allocations = payment.installment_allocations ?? []
                const isSplitPayment = allocations.length > 1

                return (
                  <div key={payment.id} className="rounded-lg border p-3 flex flex-col gap-2">
                    {/* Header: método + status + data */}
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
                              'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                            payment.status === 'pending' &&
                              'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                            payment.status === 'canceled' &&
                              'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
                            payment.status === 'refunded' &&
                              'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                          )}
                        >
                          {translatePaymentStatus(payment.status ?? 'confirmed', 'pt-BR')}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(payment.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    {/* Valor total */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Valor total</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(payment.amount_cents / 100)}
                      </span>
                    </div>

                    {/* Alocações (se pagamento dividido) */}
                    {isSplitPayment && (
                      <div className="flex flex-col gap-1.5 border-t pt-2">
                        <span className="text-xs text-muted-foreground font-medium">Alocações</span>
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
                                {formatCurrency(alloc.amount_cents / 100)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Boleto */}
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
                            className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Movimentações
            </p>
            <div className="flex flex-col gap-2">
              {ledgerEntries.map((entry) => {
                const isPositive = entry.amount_cents > 0
                return (
                  <div key={entry.id} className="rounded-lg border p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {translateLedgerEntryKind(entry.kind, 'pt-BR')}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          isPositive
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {formatCurrency(entry.amount_cents / 100)}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(entry.occurred_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>

                    {/* Detalhes de correção */}
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
                        {entry.variation_ppm != null && (
                          <span>
                            Variação:{' '}
                            <strong className="tabular-nums">
                              {(entry.variation_ppm / 10000).toFixed(2).replace('.', ',')}%
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Nota */}
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

      {/* Informações */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Informações
        </p>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem
            icon={FileText}
            label="Contrato"
            value={
              <Badge variant="secondary" className="tabular-nums font-mono text-xs">
                #{installment.contract_id}
              </Badge>
            }
          />
          <DetailItem
            icon={Banknote}
            label="Status"
            value={
              installment.status ? <InstallmentStatusBadge status={installment.status} /> : '—'
            }
          />
          <DetailItem
            label="Criado em"
            value={format(parseISO(installment.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          />
          {installment.updated_at && (
            <DetailItem
              label="Atualizado em"
              value={format(parseISO(installment.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function InstallmentDetailDrawer({
  installmentId,
  open,
  onClose,
  onPayInstallment,
  onIssueBoleto,
}: InstallmentDetailDrawerProps) {
  const { data: installment, isLoading } = useInstallment(installmentId)

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()} direction="right">
      <DrawerContent className="sm:max-w-md flex flex-col" aria-describedby={undefined}>
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              {isLoading ? (
                <>
                  <DrawerTitle className="sr-only">Detalhes da parcela</DrawerTitle>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </>
              ) : installment ? (
                <>
                  <DrawerTitle className="text-lg leading-tight flex items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums font-mono text-xs">
                      #{installment.contract_id}
                      {installment.installment_number != null &&
                        `-${installment.installment_number}`}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {translateInstallmentKind(installment.kind, 'pt-BR')}
                    </span>
                  </DrawerTitle>
                  {installment.status && <InstallmentStatusBadge status={installment.status} />}
                </>
              ) : (
                <DrawerTitle className="sr-only">Detalhes da parcela</DrawerTitle>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 mt-0.5">
                <X className="size-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {isLoading ? (
          <DrawerSkeleton />
        ) : installment ? (
          <InstallmentDetailContent
            installment={installment}
            onPayInstallment={onPayInstallment}
            onIssueBoleto={onIssueBoleto}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
