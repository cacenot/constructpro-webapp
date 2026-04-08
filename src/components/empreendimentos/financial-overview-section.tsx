import type { components } from '@cacenot/construct-pro-api-client'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency } from '@/lib/utils'

type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface FinancialOverviewSectionProps {
  data: ProjectFinancialSummary
}

export function FinancialOverviewSection({ data }: FinancialOverviewSectionProps) {
  const progressValue = Number(data.payment_progress_percentage)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300"
          >
            {data.active_contracts} ativos
          </Badge>
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:text-blue-300"
          >
            {data.settled_contracts} quitados
          </Badge>
          {data.defaulting_contracts > 0 && (
            <Badge
              variant="outline"
              className="border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:text-red-300 font-semibold"
            >
              <AlertTriangle className="mr-1 size-3" />
              {data.defaulting_contracts} inadimplentes
            </Badge>
          )}
          <Badge variant="outline">{data.total_contracts} contratos</Badge>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Principal Contratado</p>
            <p className="tabular-nums text-lg font-bold">
              {formatCurrency(data.total_principal_cents / 100)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Total Recebido</p>
            <p className="tabular-nums text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.total_paid_cents / 100)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Saldo Devedor</p>
            <p className="tabular-nums text-lg font-bold">
              {formatCurrency(data.total_outstanding_cents / 100)}
            </p>
          </div>
          <div className="space-y-1">
            <p
              className={cn(
                'text-sm',
                data.total_correction_cents > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
              )}
            >
              Correções
            </p>
            <p
              className={cn(
                'tabular-nums text-lg font-bold',
                data.total_correction_cents > 0 && 'text-amber-600 dark:text-amber-400'
              )}
            >
              {data.total_correction_cents > 0 ? '+' : ''}
              {formatCurrency(data.total_correction_cents / 100)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Progresso de Pagamento</p>
            <span className="tabular-nums text-sm font-semibold">{progressValue.toFixed(1)}%</span>
          </div>
          <Progress value={progressValue} />
        </div>
      </CardContent>
    </Card>
  )
}
