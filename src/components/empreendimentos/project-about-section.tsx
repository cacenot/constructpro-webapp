import { Info } from 'lucide-react'
import { DetailPanel } from '@/components/empreendimentos/detail-panel'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { formatDate } from '@/lib/format-date'
import { formatArea } from '@/lib/utils'

interface ProjectAboutSectionProps {
  project: ProjectDetailResponse
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

/** Ficha técnica do empreendimento: o "o que é isto" que a tela antiga descartava. */
export function ProjectAboutSection({ project }: ProjectAboutSectionProps) {
  const facts: { label: string; value: string }[] = []
  if (project.total_area) facts.push({ label: 'Área total', value: formatArea(project.total_area) })
  if (project.floors) facts.push({ label: 'Pavimentos', value: project.floors })
  if (project.delivery_date)
    facts.push({ label: 'Previsão de entrega', value: formatDate(project.delivery_date) })

  const features = project.features ?? []
  const hasContent = Boolean(project.description) || facts.length > 0 || features.length > 0
  if (!hasContent) return null

  return (
    <DetailPanel title="Sobre o empreendimento" icon={Info}>
      <div className="space-y-5">
        {project.description && (
          <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}

        {facts.length > 0 && (
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {facts.map((fact) => (
              <Fact key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        )}

        {features.length > 0 && (
          <div className="space-y-2">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Comodidades
            </p>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground/80"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </DetailPanel>
  )
}
