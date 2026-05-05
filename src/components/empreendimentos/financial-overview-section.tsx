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
            className="bg-pipeline-fechado text-pipeline-fechado-fg border-pipeline-fechado-dot/30"
          >
            {data.active_contracts} ativos
          </Badge>
          <Badge
            variant="outline"
            className="bg-pipeline-reservado text-pipeline-reservado-fg border-pipeline-reservado-dot/30"
          >
            {data.settled_contracts} quitados
          </Badge>
          {data.defaulting_contracts > 0 && (
            <Badge
              variant="outline"
              className="bg-pipeline-perdido text-pipeline-perdido-fg border-pipeline-perdido-dot/30 font-semibold"
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
            <p className="text-sm text-success">Total Recebido</p>
            <p className="tabular-nums text-lg font-bold text-success">
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
                data.total_correction_cents > 0 ? 'text-warning' : 'text-muted-foreground'
              )}
            >
              Correções
            </p>
            <p
              className={cn(
                'tabular-nums text-lg font-bold',
                data.total_correction_cents > 0 && 'text-warning'
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
