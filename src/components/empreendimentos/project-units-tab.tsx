import { ArrowRight } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { UnitCategoriesChart } from '@/components/empreendimentos/unit-categories-chart'
import { UnitSummaryCards } from '@/components/empreendimentos/unit-summary-cards'
import { Button } from '@/components/ui/button'
import type { ProjectDetailResponse } from '@/hooks/useProjects'

interface ProjectUnitsTabProps {
  project: ProjectDetailResponse
}

export function ProjectUnitsTab({ project }: ProjectUnitsTabProps) {
  const hasUnitData =
    project.unit_summary || (project.unit_categories && project.unit_categories.length > 0)

  if (!hasUnitData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhuma unidade cadastrada neste empreendimento.</p>
        <p className="text-sm text-muted-foreground">
          Cadastre unidades para visualizar o inventario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {project.unit_summary && <UnitSummaryCards data={project.unit_summary} />}

      {project.unit_categories && project.unit_categories.length > 0 && (
        <UnitCategoriesChart data={project.unit_categories} />
      )}

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => navigate(`/empreendimentos/${project.id}/unidades`)}
        >
          Ver todas as unidades
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
