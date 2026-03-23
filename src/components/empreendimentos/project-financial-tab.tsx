import type { components } from '@cacenot/construct-pro-api-client/schema'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { cn, formatCurrency } from '@/lib/utils'

type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface ProjectFinancialTabProps {
  project: ProjectDetailResponse
}

function ContractStatusBadges({ data }: { data: ProjectFinancialSummary }) {
  return (
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
          className="border-red-500/30 bg-red-500/10 font-semibold text-red-700 dark:border-red-400/30 dark:text-red-300"
        >
          <AlertTriangle className="mr-1 size-3" />
          {data.defaulting_contracts} inadimplentes
        </Badge>
      )}
      <Badge variant="outline">{data.total_contracts} contratos</Badge>
    </div>
  )
}

function FinancialKpiCards({ data }: { data: ProjectFinancialSummary }) {
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
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Total Recebido
          </p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.total_paid_cents / 100)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground">Saldo Devedor</p>
          <p className="tabular-nums mt-1 text-2xl font-bold">
            {formatCurrency(data.total_outstanding_cents / 100)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p
            className={cn(
              'text-xs font-medium',
              data.total_correction_cents > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            )}
          >
            Correcoes
          </p>
          <p
            className={cn(
              'tabular-nums mt-1 text-2xl font-bold',
              data.total_correction_cents > 0 && 'text-amber-600 dark:text-amber-400'
            )}
          >
            {data.total_correction_cents > 0 ? '+' : ''}
            {formatCurrency(data.total_correction_cents / 100)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentProgressCard({ data }: { data: ProjectFinancialSummary }) {
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

export function ProjectFinancialTab({ project }: ProjectFinancialTabProps) {
  if (!project.financial_summary) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhum contrato registrado neste empreendimento.</p>
        <p className="text-sm text-muted-foreground">
          Registre vendas e contratos para visualizar os indicadores financeiros.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ContractStatusBadges data={project.financial_summary} />
      <FinancialKpiCards data={project.financial_summary} />
      <PaymentProgressCard data={project.financial_summary} />

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => navigate('/contratos')}
        >
          Ver contratos
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
