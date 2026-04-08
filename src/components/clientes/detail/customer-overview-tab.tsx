import type { components } from '@cacenot/construct-pro-api-client'
import { Calendar } from 'lucide-react'
import { CustomerOverdueAlert } from '@/components/clientes/detail/customer-overdue-alert'
import { CustomerPaymentMethodChart } from '@/components/clientes/detail/customer-payment-method-chart'
import { CustomerRecentPayments } from '@/components/clientes/detail/customer-recent-payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { CustomerDetailResponse } from '@/hooks/useCustomerDetail'
import { cn, formatCurrency } from '@/lib/utils'

type CustomerFinancialSummary = components['schemas']['CustomerFinancialSummary']
type CustomerInstallmentOverview = components['schemas']['CustomerInstallmentOverview']

interface CustomerOverviewTabProps {
  customer: CustomerDetailResponse
}

function FinancialOverviewCard({
  financial,
  installment,
}: {
  financial: CustomerFinancialSummary
  installment?: CustomerInstallmentOverview | null
}) {
  const progressValue = Number(financial.payment_progress_percentage)
  const adjustmentTotal = financial.total_correction_cents + financial.total_adjustment_cents
  const hasAdjustments = adjustmentTotal > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumo financeiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Principal Contratado</p>
            <p className="tabular-nums mt-1 text-xl font-bold">
              {formatCurrency(financial.total_principal_cents / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Pago</p>
            <p className="tabular-nums mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(financial.total_paid_cents / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Saldo Devedor</p>
            <p className="tabular-nums mt-1 text-xl font-bold">
              {formatCurrency(financial.outstanding_balance_cents / 100)}
            </p>
          </div>
          <div>
            <p
              className={cn(
                'text-xs font-medium',
                hasAdjustments ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              )}
            >
              Correções e Ajustes
            </p>
            <p
              className={cn(
                'tabular-nums mt-1 text-xl font-bold',
                hasAdjustments && 'text-amber-600 dark:text-amber-400'
              )}
            >
              {hasAdjustments ? '+' : ''}
              {formatCurrency(adjustmentTotal / 100)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso de Pagamento</span>
            <span className="tabular-nums font-bold">{progressValue.toFixed(1)}%</span>
          </div>
          <Progress value={progressValue} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {formatCurrency(financial.total_paid_cents / 100)} de{' '}
            {formatCurrency(financial.total_principal_cents / 100)}
          </p>
        </div>

        {/* Next Due Date */}
        {installment?.next_due_date && installment.next_due_amount_cents != null && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
              <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próximo Vencimento</p>
              <p className="tabular-nums text-sm font-semibold">
                {formatCurrency(installment.next_due_amount_cents / 100)}
                <span className="ml-2 font-normal text-muted-foreground">
                  em{' '}
                  {new Date(installment.next_due_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CustomerOverviewTab({ customer }: CustomerOverviewTabProps) {
  const { financial_summary, installment_overview, payment_summary, recent_payments } = customer

  if (!financial_summary) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhum dado financeiro disponível.</p>
        <p className="text-sm text-muted-foreground">
          Os dados aparecerão quando houver contratos e parcelas registradas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {installment_overview && <CustomerOverdueAlert data={installment_overview} />}

      <FinancialOverviewCard financial={financial_summary} installment={installment_overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        {payment_summary && <CustomerPaymentMethodChart data={payment_summary} />}
        <CustomerRecentPayments payments={recent_payments ?? []} />
      </div>
    </div>
  )
}
