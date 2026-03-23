import { CreditCard } from 'lucide-react'
import { CustomerPaymentMethodChart } from '@/components/clientes/detail/customer-payment-method-chart'
import { CustomerRecentPayments } from '@/components/clientes/detail/customer-recent-payments'
import { Card, CardContent } from '@/components/ui/card'
import type { CustomerDetailResponse } from '@/hooks/useCustomerDetail'
import { formatCurrency } from '@/lib/utils'

interface CustomerPaymentsTabProps {
  customer: CustomerDetailResponse
}

export function CustomerPaymentsTab({ customer }: CustomerPaymentsTabProps) {
  const { payment_summary, recent_payments } = customer

  if (!payment_summary) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <CreditCard className="size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
        <p className="text-sm text-muted-foreground">
          Os pagamentos aparecerão quando forem confirmados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Pago</p>
            <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(payment_summary.total_paid_cents / 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground">Pagamentos</p>
            <p className="tabular-nums mt-1 text-2xl font-bold">{payment_summary.payment_count}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground">Último Pagamento</p>
            <p className="mt-1 text-2xl font-bold">
              {payment_summary.last_payment_date
                ? new Date(payment_summary.last_payment_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerPaymentMethodChart data={payment_summary} />
        <CustomerRecentPayments payments={recent_payments ?? []} />
      </div>
    </div>
  )
}
