import type { components } from '@cacenot/construct-pro-api-client'
import { Building2, DollarSign, Receipt, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency } from '@/lib/utils'

type ProjectUnitSummary = components['schemas']['ProjectUnitSummary']
type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface ProjectVitalsStripProps {
  unitSummary?: ProjectUnitSummary | null
  financialSummary?: ProjectFinancialSummary | null
}

export function ProjectVitalsStrip({ unitSummary, financialSummary }: ProjectVitalsStripProps) {
  const soldPct =
    unitSummary && unitSummary.total_units > 0
      ? ((unitSummary.sold_count / unitSummary.total_units) * 100).toFixed(1)
      : null

  const paymentProgress = financialSummary
    ? Number(financialSummary.payment_progress_percentage)
    : null

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {/* Total Unidades */}
      <Card>
        <CardContent className="flex items-start justify-between pt-5 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Unidades</p>
            <p className="tabular-nums text-2xl font-bold">{unitSummary?.total_units ?? '—'}</p>
          </div>
          <Building2 className="size-4 text-muted-foreground/50" />
        </CardContent>
      </Card>

      {/* Unidades Vendidas */}
      <Card>
        <CardContent className="flex items-start justify-between pt-5 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Vendidas</p>
            <p className="tabular-nums text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {unitSummary?.sold_count ?? '—'}
            </p>
            {soldPct && (
              <p className="tabular-nums text-xs text-muted-foreground">{soldPct}% do total</p>
            )}
          </div>
          <ShoppingCart className="size-4 text-muted-foreground/50" />
        </CardContent>
      </Card>

      {/* VGV Total */}
      <Card>
        <CardContent className="flex items-start justify-between pt-5 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">VGV Total</p>
            <p className="tabular-nums text-2xl font-bold">
              {unitSummary ? formatCurrency(unitSummary.total_vgv_cents / 100) : '—'}
            </p>
          </div>
          <DollarSign className="size-4 text-muted-foreground/50" />
        </CardContent>
      </Card>

      {/* Receita Recebida */}
      <Card>
        <CardContent className="flex items-start justify-between pt-5 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Receita Recebida</p>
            <p
              className={cn(
                'tabular-nums text-2xl font-bold',
                financialSummary && financialSummary.total_paid_cents > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : ''
              )}
            >
              {financialSummary ? formatCurrency(financialSummary.total_paid_cents / 100) : '—'}
            </p>
          </div>
          <Receipt className="size-4 text-muted-foreground/50" />
        </CardContent>
      </Card>

      {/* Progresso de Pagamento */}
      <Card className="col-span-2 lg:col-span-1">
        <CardContent className="flex items-start justify-between pt-5 pb-4">
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Progresso Pagamento</p>
            <p className="tabular-nums text-2xl font-bold">
              {paymentProgress != null ? `${paymentProgress.toFixed(1)}%` : '—'}
            </p>
            {paymentProgress != null && <Progress value={paymentProgress} className="h-1.5" />}
          </div>
          <TrendingUp className="size-4 shrink-0 text-muted-foreground/50" />
        </CardContent>
      </Card>
    </div>
  )
}
