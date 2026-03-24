import { translateInstallmentKind } from '@cacenot/construct-pro-api-client'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Banknote, Calendar, CreditCard, FileText, Hash, Receipt, X } from 'lucide-react'
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
import type { InstallmentResponse } from '@/hooks/use-installments'
import { useInstallment } from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'
import { InstallmentStatusBadge } from './installment-status-badge'

interface InstallmentDetailDrawerProps {
  installmentId: string
  open: boolean
  onClose: () => void
  onPayInstallment: (installment: InstallmentResponse) => void
  onIssueBoleto: (installment: InstallmentResponse) => void
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
  installment: InstallmentResponse
  onPayInstallment: (installment: InstallmentResponse) => void
  onIssueBoleto: (installment: InstallmentResponse) => void
}) {
  const dueDate = parseISO(installment.due_date)
  const isOverdue =
    isPast(dueDate) && installment.status !== 'paid' && installment.status !== 'canceled'
  const hasCorrectionDiff = installment.current_amount_cents !== installment.base_amount_cents
  const canPay = installment.status !== 'paid' && installment.status !== 'canceled'
  const canIssueBoleto =
    (installment.status === 'scheduled' || installment.status === 'invoiced') &&
    installment.payment_method === 'boleto'

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
              {installment.paid_amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Restante</span>
            <span className="text-sm font-medium tabular-nums">{installment.remaining_amount}</span>
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
      <DrawerContent className="sm:max-w-md flex flex-col">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              {isLoading ? (
                <>
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
              ) : null}
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
