import type { components } from '@cacenot/construct-pro-api-client/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'

type CustomerFinancialSummary = components['schemas']['CustomerFinancialSummary']

interface CustomerPaymentProgressProps {
  data: CustomerFinancialSummary
}

export function CustomerPaymentProgress({ data }: CustomerPaymentProgressProps) {
  const progressValue = Number(data.payment_progress_percentage)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Progresso de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="tabular-nums text-3xl font-bold">{progressValue.toFixed(1)}%</span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(data.total_paid_cents / 100)} de{' '}
            {formatCurrency(data.total_principal_cents / 100)}
          </span>
        </div>
        <Progress value={progressValue} className="h-3" />
      </CardContent>
    </Card>
  )
}
