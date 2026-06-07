import { ArrowLeft, Building2, CalendarClock, Landmark, MapPin, Pencil } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { ProjectStatusBadge } from '@/components/empreendimentos/project-status-badge'
import { Button } from '@/components/ui/button'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { formatMonthYear } from '@/lib/format-date'
import { formatDocument } from '@/lib/text-formatters'

interface ProjectHeroHeaderProps {
  project: ProjectDetailResponse
}

function formatAddress(project: {
  address: string
  number: string
  district: string
  city: string
  state: string
}) {
  return `${project.address}, ${project.number} · ${project.district}, ${project.city}/${project.state}`
}

/** Frase de entrega/obra: previsão + distância relativa, com tom de alerta quando atrasada. */
function deliverySignal(project: ProjectDetailResponse): { text: string; warn: boolean } | null {
  if (project.status === 'finished') {
    return project.delivery_date
      ? { text: `Entregue em ${formatMonthYear(project.delivery_date)}`, warn: false }
      : null
  }
  if (!project.delivery_date) return null

  const target = new Date(project.delivery_date)
  if (Number.isNaN(target.getTime())) return null

  const now = new Date()
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  const when = formatMonthYear(project.delivery_date)

  if (months < 0) {
    const late = Math.abs(months)
    return {
      text: `Entrega prevista ${when} · ${late} ${late === 1 ? 'mês' : 'meses'} em atraso`,
      warn: true,
    }
  }
  if (months === 0) return { text: `Entrega prevista ${when} · neste mês`, warn: false }
  const distance =
    months >= 24
      ? `~${Math.round(months / 12)} anos`
      : `~${months} ${months === 1 ? 'mês' : 'meses'}`
  return { text: `Entrega prevista ${when} · em ${distance}`, warn: false }
}

export function ProjectHeroHeader({ project }: ProjectHeroHeaderProps) {
  const delivery = deliverySignal(project)
  // SPE própria: o empreendimento declara alguma identidade de pessoa jurídica.
  const speName = project.trade_name ?? project.legal_name
  const hasSpe = Boolean(project.cnpj || speName)

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate('/empreendimentos')}
      >
        <ArrowLeft className="size-4" />
        Voltar para Empreendimentos
      </Button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* Identidade do empreendimento */}
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            {project.status && <ProjectStatusBadge status={project.status} />}
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{formatAddress(project)}</span>
            </div>
            {delivery && (
              <div className="flex items-center gap-1.5">
                <CalendarClock className="size-4 shrink-0" />
                <span className={delivery.warn ? 'text-warning' : undefined}>{delivery.text}</span>
              </div>
            )}
            {hasSpe && (
              <div className="flex min-w-0 items-center gap-1.5">
                <Landmark className="size-4 shrink-0" />
                <span className="min-w-0 truncate">
                  SPE
                  {speName && <span className="text-foreground/80"> · {speName}</span>}
                  {project.cnpj && (
                    <span className="ml-1.5 font-mono text-xs">{formatDocument(project.cnpj)}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => navigate(`/empreendimentos/${project.id}/editar`)}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button className="gap-1.5" onClick={() => navigate(`/unidades?project=${project.id}`)}>
            <Building2 className="size-4" />
            Ver unidades
          </Button>
        </div>
      </div>
    </div>
  )
}
