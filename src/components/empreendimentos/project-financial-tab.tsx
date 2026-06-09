import type { components } from '@cacenot/construct-pro-api-client'
import { AlertTriangle, ArrowRight, FileText, TrendingUp } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { DetailPanel } from '@/components/empreendimentos/detail-panel'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface ProjectFinancialTabProps {
  project: ProjectDetailResponse
}

function CarteiraStrip({ data }: { data: ProjectFinancialSummary }) {
  const correction = data.total_correction.cents
  const vitals: Vital[] = [
    { label: 'Principal contratado', value: formatCurrency(data.total_principal.cents / 100) },
    {
      label: 'Recebido',
      value: formatCurrency(data.total_paid.cents / 100),
      tone: data.total_paid.cents > 0 ? 'success' : 'default',
    },
    { label: 'Saldo devedor', value: formatCurrency(data.total_outstanding.cents / 100) },
    {
      label: 'Correção monetária',
      value: `${correction > 0 ? '+' : ''}${formatCurrency(correction / 100)}`,
      tone: correction > 0 ? 'warning' : 'default',
    },
  ]
  return <VitalsStrip vitals={vitals} />
}

const PILL_BASE =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium'

function StatusPill({
  count,
  label,
  pill,
  dot,
}: {
  count: number
  label: string
  pill: string
  dot: string
}) {
  return (
    <span className={cn(PILL_BASE, pill)}>
      <span className={cn('size-1.5 rounded-full', dot)} />
      <span className="tabular-nums">{count}</span> {label}
    </span>
  )
}

function ContractsPanel({ data }: { data: ProjectFinancialSummary }) {
  return (
    <DetailPanel title="Contratos" icon={FileText}>
      <div className="flex flex-wrap gap-2">
        <StatusPill
          count={data.active_contracts}
          label="ativos"
          pill="border-pipeline-fechado-dot/30 bg-pipeline-fechado text-pipeline-fechado-fg"
          dot="bg-pipeline-fechado-dot"
        />
        <StatusPill
          count={data.settled_contracts}
          label="quitados"
          pill="border-pipeline-reservado-dot/30 bg-pipeline-reservado text-pipeline-reservado-fg"
          dot="bg-pipeline-reservado-dot"
        />
        {data.overdue_contracts > 0 && (
          <StatusPill
            count={data.overdue_contracts}
            label="inadimplentes"
            pill="border-pipeline-perdido-dot/30 bg-pipeline-perdido text-pipeline-perdido-fg"
            dot="bg-pipeline-perdido-dot"
          />
        )}
        <StatusPill
          count={data.total_contracts}
          label="no total"
          pill="border-border bg-muted text-muted-foreground"
          dot="bg-muted-foreground"
        />
      </div>
    </DetailPanel>
  )
}

function PaymentProgressPanel({ data }: { data: ProjectFinancialSummary }) {
  const progress = Number(data.payment_progress_percentage)
  return (
    <DetailPanel title="Progresso de pagamento" icon={TrendingUp}>
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {formatPercent(progress)}%
          </span>
          <span className="text-right text-sm tabular-nums text-muted-foreground">
            {formatCurrency(data.total_paid.cents / 100)} de{' '}
            {formatCurrency(data.total_principal.cents / 100)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </DetailPanel>
  )
}

function DefaultAlert({ data }: { data: ProjectFinancialSummary }) {
  const n = data.overdue_contracts
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="space-y-0.5">
        <p className="font-medium text-destructive">
          {n} {n === 1 ? 'contrato inadimplente' : 'contratos inadimplentes'}
        </p>
        <p className="text-sm text-muted-foreground">
          de {data.total_contracts} na carteira. Priorize a régua de cobrança para conter o atraso.
        </p>
      </div>
    </div>
  )
}

export function ProjectFinancialTab({ project }: ProjectFinancialTabProps) {
  const financial = project.financial_summary
  if (!financial) {
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
      <CarteiraStrip data={financial} />

      {financial.overdue_contracts > 0 && <DefaultAlert data={financial} />}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ContractsPanel data={financial} />
        <PaymentProgressPanel data={financial} />
      </div>

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
