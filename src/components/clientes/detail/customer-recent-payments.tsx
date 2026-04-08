import type { components } from '@cacenot/construct-pro-api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatId } from '@/lib/utils'

type RecentPaymentEntry = components['schemas']['RecentPaymentEntry']

interface CustomerRecentPaymentsProps {
  payments: RecentPaymentEntry[]
}

const METHOD_LABELS: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  card: 'Cartão',
}

function formatPaymentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CustomerRecentPayments({ payments }: CustomerRecentPaymentsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Últimos Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
          </div>
        ) : (
          <div className="space-y-0">
            {payments.map((payment, index) => (
              <div key={`${payment.contract_id}-${payment.paid_at}`} className="flex gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className="mt-1.5 size-2.5 shrink-0 rounded-full bg-emerald-500" />
                  {index < payments.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-5">
                  <div className="flex items-baseline justify-between">
                    <p className="tabular-nums text-sm font-semibold">
                      {formatCurrency(payment.amount_cents / 100)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Contrato {formatId(payment.contract_id)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                      {METHOD_LABELS[payment.method] ?? payment.method}
                    </span>
                    <span>{formatPaymentDate(payment.paid_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
