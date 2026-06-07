import { type components, translatePaymentMethod } from '@cacenot/construct-pro-api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format-date'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'

type PaymentSummary = components['schemas']['ContractPaymentSummary']
type PaymentMethod = NonNullable<PaymentSummary['by_method']>[number]['method']

interface DealPaymentsPanelProps {
  payment: PaymentSummary
}

// Paleta de console, distinta e sem lima (lima é reservada à ação).
const PALETTE = [
  'var(--color-chart-2)',
  'var(--color-chart-4)',
  'var(--color-chart-3)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
]

function methodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? translatePaymentMethod(method, 'pt-BR')
}

export function DealPaymentsPanel({ payment }: DealPaymentsPanelProps) {
  const methods = [...(payment.by_method ?? [])].sort((a, b) => b.total.cents - a.total.cents)
  const totalCents = methods.reduce((sum, m) => sum + m.total.cents, 0)
  const hasBreakdown = methods.length > 0 && totalCents > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Total recebido</span>
          <span className="tabular-nums text-lg font-semibold">
            {formatCurrency(payment.total_paid.cents / 100)}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {payment.payment_count} {payment.payment_count === 1 ? 'pagamento' : 'pagamentos'}
            </span>
          </span>
        </div>

        {hasBreakdown ? (
          <div className="space-y-3">
            {/* Barra empilhada por método */}
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {methods.map((m, i) => (
                <div
                  key={m.method}
                  className="h-full"
                  style={{
                    width: `${(m.total.cents / totalCents) * 100}%`,
                    backgroundColor: PALETTE[i % PALETTE.length],
                  }}
                />
              ))}
            </div>
            {/* Legenda */}
            <ul className="space-y-1.5">
              {methods.map((m, i) => (
                <li key={m.method} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    {methodLabel(m.method)}
                    <span className="font-mono text-xs text-muted-foreground">×{m.count}</span>
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(m.total.cents / 100)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum pagamento recebido ainda.</p>
        )}

        {payment.last_payment_date && (
          <p className="border-t pt-3 text-sm text-muted-foreground">
            Último pagamento em{' '}
            <span className="tabular-nums text-foreground">
              {formatDate(payment.last_payment_date)}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
