import { ConstructionProgressSection } from '@/components/empreendimentos/construction-progress-section'
import { ProjectVitalsStrip } from '@/components/empreendimentos/project-vitals-strip'
import { SalesPipelineSection } from '@/components/empreendimentos/sales-pipeline-section'
import { SalesTimelineChart } from '@/components/empreendimentos/sales-timeline-chart'
import { UnitAvailabilityChart } from '@/components/empreendimentos/unit-availability-chart'
import type { ProjectDetailResponse } from '@/hooks/useProjects'

interface ProjectOverviewTabProps {
  project: ProjectDetailResponse
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const hasAnyData =
    project.unit_summary ||
    project.sales_summary ||
    project.financial_summary ||
    (project.sales_timeline?.entries && project.sales_timeline.entries.length > 0) ||
    (project.progress_updates && project.progress_updates.length > 0)

  if (!hasAnyData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          Este empreendimento ainda nao possui dados analiticos.
        </p>
        <p className="text-sm text-muted-foreground">
          Cadastre unidades e registre vendas para visualizar os indicadores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <ProjectVitalsStrip
        unitSummary={project.unit_summary}
        financialSummary={project.financial_summary}
      />

      {/* Charts side by side */}
      {(project.sales_summary || project.unit_summary) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {project.sales_summary && <SalesPipelineSection data={project.sales_summary} />}
          {project.unit_summary && <UnitAvailabilityChart data={project.unit_summary} />}
        </div>
      )}

      {/* Construction Progress */}
      {project.progress_updates && project.progress_updates.length > 0 && (
        <ConstructionProgressSection updates={project.progress_updates} />
      )}

      {/* Sales Timeline */}
      {project.sales_timeline?.entries && project.sales_timeline.entries.length > 0 && (
        <SalesTimelineChart data={project.sales_timeline} />
      )}
    </div>
  )
}
