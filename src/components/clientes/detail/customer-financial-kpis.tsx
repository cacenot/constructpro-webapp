import type { components } from '@cacenot/construct-pro-api-client'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type CustomerFinancialSummary = components['schemas']['CustomerFinancialSummary']

interface CustomerFinancialKpisProps {
  data: CustomerFinancialSummary
}

export function CustomerFinancialKpis({ data }: CustomerFinancialKpisProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground">Principal Contratado</p>
          <p className="tabular-nums mt-1 text-2xl font-bold">
            {formatCurrency(data.total_principal_cents / 100)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-success">Total Pago</p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-success">
            {formatCurrency(data.total_paid_cents / 100)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground">Saldo Devedor</p>
          <p className="tabular-nums mt-1 text-2xl font-bold">
            {formatCurrency(data.outstanding_balance_cents / 100)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p
            className={cn(
              'text-xs font-medium',
              data.total_correction_cents + data.total_adjustment_cents > 0
                ? 'text-warning'
                : 'text-muted-foreground'
            )}
          >
            Correções e Ajustes
          </p>
          <p
            className={cn(
              'tabular-nums mt-1 text-2xl font-bold',
              data.total_correction_cents + data.total_adjustment_cents > 0 && 'text-warning'
            )}
          >
            {data.total_correction_cents + data.total_adjustment_cents > 0 ? '+' : ''}
            {formatCurrency((data.total_correction_cents + data.total_adjustment_cents) / 100)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
