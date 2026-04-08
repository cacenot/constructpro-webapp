import type { components } from '@cacenot/construct-pro-api-client'
import { ArrowRight } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { SalesPipelineSection } from '@/components/empreendimentos/sales-pipeline-section'
import { SalesTimelineChart } from '@/components/empreendimentos/sales-timeline-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { cn, formatCurrency } from '@/lib/utils'

type ProjectSalesSummary = components['schemas']['ProjectSalesSummary']

interface ProjectCommercialTabProps {
  project: ProjectDetailResponse
}

function SalesKpiCards({ data }: { data: ProjectSalesSummary }) {
  const inProgress = data.pending_signature_count + data.pending_payment_count

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground">Total de Vendas</p>
          <p className="tabular-nums mt-1 text-2xl font-bold">{data.total_sales}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Fechadas</p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.closed_count}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Em Andamento</p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {inProgress}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Perdidas</p>
          <p
            className={cn(
              'tabular-nums mt-1 text-2xl font-bold',
              data.lost_count > 0 ? 'text-red-600 dark:text-red-400' : ''
            )}
          >
            {data.lost_count}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SalesMonetaryCard({ data }: { data: ProjectSalesSummary }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col justify-center space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Vendido</span>
          <span className="tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.total_sold_cents / 100)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Em Propostas</span>
          <span className="tabular-nums text-sm font-medium">
            {formatCurrency(data.total_proposal_cents / 100)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Preco Medio</span>
          <span className="tabular-nums text-sm font-medium">
            {formatCurrency(data.avg_sale_price_cents / 100)}
          </span>
        </div>
        {data.avg_discount_percentage != null && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Desconto Medio</span>
              <span className="tabular-nums text-sm font-medium">
                {Number(data.avg_discount_percentage).toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function ProjectCommercialTab({ project }: ProjectCommercialTabProps) {
  const hasSalesData =
    project.sales_summary ||
    (project.sales_timeline?.entries && project.sales_timeline.entries.length > 0)

  if (!hasSalesData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhuma venda registrada neste empreendimento.</p>
        <p className="text-sm text-muted-foreground">
          Registre vendas para visualizar o pipeline comercial.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {project.sales_summary && (
        <>
          <SalesKpiCards data={project.sales_summary} />

          <div className="grid gap-4 lg:grid-cols-2">
            <SalesPipelineSection data={project.sales_summary} />
            <SalesMonetaryCard data={project.sales_summary} />
          </div>
        </>
      )}

      {project.sales_timeline?.entries && project.sales_timeline.entries.length > 0 && (
        <SalesTimelineChart data={project.sales_timeline} />
      )}

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => navigate('/vendas')}
        >
          Ver todas as vendas
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
