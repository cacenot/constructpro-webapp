import { MapPin, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { ProjectStatusBadge } from '@/components/empreendimentos/project-status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProjectSummaryItem } from '@/hooks/useProjects'
import { formatMonthYear } from '@/lib/format-date'

interface ProjectCardProps {
  project: ProjectSummaryItem
}

/** Iniciais do empreendimento, ignorando prefixos tipo [SEED] e sufixos #NN. */
function getMonogram(name: string): string {
  const words = name
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/#\d+/g, ' ')
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))

  const [first = '', second = ''] = words
  if (words.length === 0) return '—'
  if (words.length === 1) return first.slice(0, 2).toUpperCase()
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase()
}

/** "Bairro · Cidade/UF" — o que houver, na ordem certa. */
function formatLocation(project: ProjectCardProps['project']): string {
  const cityUf = [project.city, project.state].filter(Boolean).join('/')
  return [project.district, cityUf].filter(Boolean).join(' · ')
}

const compactBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Textura de planta baixa: grid de hairlines de 32px, marca da casa "na planta". */
const blueprintGrid = {
  backgroundImage:
    'linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const primaryPhoto = project.project_photos?.[0]
  const location = formatLocation(project)
  const monogram = getMonogram(project.name)
  const soldPct = Math.round(Number(project.sold_percentage))
  const vgvInReais = project.total_vgv.cents / 100
  const [imgFailed, setImgFailed] = useState(false)
  const showPhoto = Boolean(primaryPhoto) && !imgFailed

  return (
    <Card className="group relative overflow-hidden transition-colors duration-200 hover:bg-elevated has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background">
      {/* Cover */}
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        {showPhoto ? (
          <>
            <img
              src={primaryPhoto}
              alt={project.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
            {/* Scrim — ancora status/ações sobre fotos claras */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent"
            />
          </>
        ) : (
          <>
            {/* Grid de planta */}
            <div aria-hidden className="absolute inset-0" style={blueprintGrid} />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent"
            />
            {/* Monograma — identidade tipográfica por empreendimento */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-black text-6xl leading-none tracking-tighter text-foreground/[0.06] transition-colors duration-300 group-hover:text-primary/[0.12]"
            >
              {monogram}
            </span>
          </>
        )}

        {/* Status — leitura no scan, canto superior esquerdo */}
        <div className="absolute left-3 top-3">
          <ProjectStatusBadge status={project.status} />
        </div>

        {/* Menu de ações — acima do stretched link */}
        <div className="absolute right-3 top-3 z-20">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ações</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/empreendimentos/${project.id}`)}>
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/empreendimentos/${project.id}/editar`)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/unidades?project=${project.id}`)}>
                Ver unidades
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conteúdo — ficha + mini-painel de carteira */}
      <div className="space-y-2.5 border-t border-border/60 p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight">
            <a
              href={`/empreendimentos/${project.id}`}
              className="line-clamp-1 outline-none transition-colors after:absolute after:inset-0 after:z-10 group-hover:text-primary"
            >
              {project.name}
            </a>
          </h3>
          {location && (
            <div className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="line-clamp-1 min-w-0">{location}</span>
            </div>
          )}
        </div>

        {/* Mini KPI strip — espelha a KPI Strip de assinatura */}
        <div className="grid grid-cols-2 divide-x divide-border/60 overflow-hidden rounded-md bg-muted/40">
          <div className="px-3 py-2">
            <p className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
              Vendido
            </p>
            <p className="text-base font-bold text-success leading-tight tabular-nums">
              {soldPct}%
            </p>
            <p className="tabular-nums text-[0.625rem] text-muted-foreground">
              {project.sold_count}/{project.total_units} unid.
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
              VGV
            </p>
            <p className="tabular-nums text-base font-bold leading-tight">
              {compactBRL.format(vgvInReais)}
            </p>
            <p className="text-[0.625rem] text-muted-foreground tabular-nums">
              {project.status === 'finished'
                ? 'entregue'
                : project.delivery_date
                  ? `entrega ${formatMonthYear(project.delivery_date)}`
                  : 'entrega a definir'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
