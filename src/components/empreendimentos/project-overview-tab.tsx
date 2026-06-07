import type { components } from '@cacenot/construct-pro-api-client'
import { ConstructionProgressSection } from '@/components/empreendimentos/construction-progress-section'
import { ProjectAboutSection } from '@/components/empreendimentos/project-about-section'
import { ProjectLegalSection } from '@/components/empreendimentos/project-legal-section'
import { SalesPipelineSection } from '@/components/empreendimentos/sales-pipeline-section'
import { SalesTimelineChart } from '@/components/empreendimentos/sales-timeline-chart'
import { UnitAvailabilityChart } from '@/components/empreendimentos/unit-availability-chart'
import type { ProjectDetailResponse } from '@/hooks/useProjects'

interface ProjectOverviewTabProps {
  project: ProjectDetailResponse
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const hasAnalytics = Boolean(
    project.sales_summary ||
      project.unit_summary ||
      project.financial_summary ||
      (project.sales_timeline?.entries && project.sales_timeline.entries.length > 0) ||
      (project.progress_updates && project.progress_updates.length > 0)
  )

  const hasAbout = Boolean(
    project.description ||
      project.total_area ||
      project.floors ||
      project.delivery_date ||
      project.features?.length
  )

  const hasLegal = Boolean(
    project.cnpj ||
      project.legal_name ||
      project.trade_name ||
      project.state_registration ||
      project.municipal_registration ||
      project.incorporation_registry_number ||
      project.mother_property_registration ||
      project.cno ||
      project.construction_permit_number ||
      project.occupancy_permit_number
  )

  if (!hasAnalytics && !hasAbout && !hasLegal) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          Este empreendimento ainda não possui dados analíticos.
        </p>
        <p className="text-sm text-muted-foreground">
          Cadastre unidades e registre vendas para visualizar os indicadores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Saúde em um olhar: funil comercial + funil de unidades lado a lado */}
      {(project.sales_summary || project.unit_summary) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {project.sales_summary && <SalesPipelineSection data={project.sales_summary} />}
          {project.unit_summary && <UnitAvailabilityChart data={project.unit_summary} />}
        </div>
      )}

      {project.progress_updates && project.progress_updates.length > 0 && (
        <ConstructionProgressSection
          updates={project.progress_updates as components['schemas']['ProgressUpdate-Input'][]}
        />
      )}

      {project.sales_timeline?.entries && project.sales_timeline.entries.length > 0 && (
        <SalesTimelineChart data={project.sales_timeline} />
      )}

      {/* Identidade do empreendimento: ficha técnica + pessoa jurídica/registros.
          Painéis em largura cheia para os grupos internos respirarem. */}
      {hasAbout && <ProjectAboutSection project={project} />}
      <ProjectLegalSection project={project} />
    </div>
  )
}
