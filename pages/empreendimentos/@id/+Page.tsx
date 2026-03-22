import { ArrowLeft, ArrowRight, Building2, MapPin, Pencil } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { FinancialOverviewSection } from '@/components/empreendimentos/financial-overview-section'
import { ProjectStatusBadge } from '@/components/empreendimentos/project-status-badge'
import { SalesPipelineSection } from '@/components/empreendimentos/sales-pipeline-section'
import { SalesTimelineChart } from '@/components/empreendimentos/sales-timeline-chart'
import { UnitCategoriesChart } from '@/components/empreendimentos/unit-categories-chart'
import { UnitSummaryCards } from '@/components/empreendimentos/unit-summary-cards'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectDetail } from '@/hooks/useProjects'

function formatAddress(project: {
  address: string
  number: string
  district: string
  city: string
  state: string
  complement?: string | null
}) {
  const parts = [`${project.address}, ${project.number}`]
  if (project.complement) parts[0] += ` — ${project.complement}`
  parts.push(`${project.district}, ${project.city}/${project.state}`)
  return parts.join(' — ')
}

export default function ProjectDetailPage() {
  const pageContext = usePageContext()
  const projectId = Number(pageContext.routeParams?.id)

  const { data: project, isLoading, error } = useProjectDetail(projectId)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-64" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-40" />
          <Skeleton className="h-72" />
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Empreendimento não encontrado</p>
          <Button variant="link" onClick={() => navigate('/empreendimentos')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  const hasUnitCategories = project.unit_categories && project.unit_categories.length > 0
  const hasTimelineEntries =
    project.sales_timeline?.entries && project.sales_timeline.entries.length > 0
  const hasData =
    project.unit_summary ||
    hasUnitCategories ||
    project.sales_summary ||
    project.financial_summary ||
    hasTimelineEntries

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Voltar */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          onClick={() => navigate('/empreendimentos')}
        >
          <ArrowLeft className="size-4" />
          Voltar para Empreendimentos
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              {project.status && <ProjectStatusBadge status={project.status} />}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {formatAddress(project)}
            </div>
            {project.delivery_date && (
              <p className="text-sm text-muted-foreground">
                Previsão de entrega:{' '}
                {new Date(project.delivery_date as string).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/empreendimentos/${project.id}/editar`)}
            >
              <Pencil className="size-4" />
              Editar
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/empreendimentos/${project.id}/unidades`)}
            >
              <Building2 className="size-4" />
              Ver Unidades
            </Button>
          </div>
        </div>

        {!hasData && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Este empreendimento ainda não possui dados analíticos.
            </p>
            <p className="text-sm text-muted-foreground">
              Cadastre unidades e registre vendas para visualizar os indicadores.
            </p>
          </div>
        )}

        {/* Unit Summary */}
        {project.unit_summary && <UnitSummaryCards data={project.unit_summary} />}

        {/* Categories + Sales Pipeline side by side */}
        {(hasUnitCategories || project.sales_summary) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {project.unit_categories && project.unit_categories.length > 0 && (
              <UnitCategoriesChart data={project.unit_categories} />
            )}
            {project.sales_summary && <SalesPipelineSection data={project.sales_summary} />}
          </div>
        )}

        {/* Financial Overview */}
        {project.financial_summary && <FinancialOverviewSection data={project.financial_summary} />}

        {/* Sales Timeline */}
        {project.sales_timeline?.entries && project.sales_timeline.entries.length > 0 && (
          <SalesTimelineChart data={project.sales_timeline} />
        )}

        {/* Footer links */}
        {hasData && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => navigate(`/empreendimentos/${project.id}/unidades`)}
            >
              Ver todas as unidades
              <ArrowRight className="size-4" />
            </Button>
            {project.sales_summary && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => navigate('/vendas')}
              >
                Ver todas as vendas
                <ArrowRight className="size-4" />
              </Button>
            )}
            {project.financial_summary && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => navigate('/contratos')}
              >
                Ver contratos
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
