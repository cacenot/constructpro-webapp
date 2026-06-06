import type { components } from '@cacenot/construct-pro-api-client'
import { ArrowRight } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { SalesPipelineSection } from '@/components/empreendimentos/sales-pipeline-section'
import { SalesTimelineChart } from '@/components/empreendimentos/sales-timeline-chart'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { Button } from '@/components/ui/button'
import type { ProjectDetailResponse } from '@/hooks/useProjects'

type ProjectSalesSummary = components['schemas']['ProjectSalesSummary']

interface ProjectCommercialTabProps {
  project: ProjectDetailResponse
}

function SalesFunnelStrip({ data }: { data: ProjectSalesSummary }) {
  const inProgress = data.pending_signature_count + data.pending_payment_count

  const vitals: Vital[] = [
    { label: 'Total de vendas', value: data.total_sales },
    {
      label: 'Fechadas',
      value: data.closed_count,
      tone: data.closed_count > 0 ? 'success' : 'default',
    },
    { label: 'Em andamento', value: inProgress, tone: inProgress > 0 ? 'warning' : 'default' },
    {
      label: 'Perdidas',
      value: data.lost_count,
      tone: data.lost_count > 0 ? 'destructive' : 'default',
    },
  ]

  return <VitalsStrip vitals={vitals} />
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
          Registre vendas para visualizar o funil comercial.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {project.sales_summary && (
        <>
          <SalesFunnelStrip data={project.sales_summary} />
          {/* O pipeline já reúne o funil (donut + contagens) e os valores comerciais. */}
          <SalesPipelineSection data={project.sales_summary} />
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
