import { Building2, MapPin, MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
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

interface ProjectCardProps {
  project: {
    id: number
    name: string
    status: 'construction' | 'finished'
    city?: string
    district?: string
    project_photos?: string[]
  }
}

const statusConfig = {
  construction: {
    label: 'Em Construção',
    className:
      'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  },
  finished: {
    label: 'Finalizado',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const primaryPhoto = project.project_photos?.[0]
  const location = [project.district, project.city].filter(Boolean).join(' - ')

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
      onClick={() => navigate(`/empreendimentos/${project.id}`)}
    >
      {/* Foto */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={project.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="size-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Menu de ações (overlay) */}
        <div className="absolute left-3 top-3 z-10">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="bg-white/90 backdrop-blur-sm dark:bg-black/90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ações</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/empreendimentos/${project.id}`)
                }}
              >
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/empreendimentos/${project.id}/editar`)
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/empreendimentos/${project.id}/unidades`)
                }}
              >
                Ver unidades
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-2 p-4">
        {/* Nome */}
        <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
          {project.name}
        </h3>

        {/* Status Badge */}
        <Badge variant="secondary" className={statusConfig[project.status].className}>
          {statusConfig[project.status].label}
        </Badge>

        {/* Localização */}
        {location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
