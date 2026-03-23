import { ArrowLeft, Building2, Calendar, MapPin, Pencil } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { ProjectStatusBadge } from '@/components/empreendimentos/project-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { formatCurrency } from '@/lib/utils'

interface ProjectHeroHeaderProps {
  project: ProjectDetailResponse
}

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

export function ProjectHeroHeader({ project }: ProjectHeroHeaderProps) {
  const unitSummary = project.unit_summary
  const soldPct =
    unitSummary && unitSummary.total_units > 0
      ? ((unitSummary.sold_count / unitSummary.total_units) * 100).toFixed(1)
      : null

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate('/empreendimentos')}
      >
        <ArrowLeft className="size-4" />
        Voltar para Empreendimentos
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Project info */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.status && <ProjectStatusBadge status={project.status} />}
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              {formatAddress(project)}
            </div>
            {project.delivery_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 shrink-0" />
                Previsao de entrega:{' '}
                {new Date(project.delivery_date as string).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/empreendimentos/${project.id}/editar`)}
                >
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar empreendimento</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/empreendimentos/${project.id}/unidades`)}
                >
                  <Building2 className="size-4" />
                  Ver Unidades
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver unidades do empreendimento</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right: Vitals mini-card */}
        {unitSummary && (
          <Card className="shrink-0 border-primary/10 lg:w-72">
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Unidades</p>
                  <p className="tabular-nums text-2xl font-bold">{unitSummary.total_units}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-xs text-muted-foreground">Vendido</p>
                  <p className="tabular-nums text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {soldPct}%
                  </p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">VGV Total</p>
                <p className="tabular-nums mt-0.5 text-lg font-bold">
                  {formatCurrency(unitSummary.total_vgv_cents / 100)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
