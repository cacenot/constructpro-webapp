import { type ProjectStatusType, translateProjectStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<ProjectStatusType, string> = {
  construction:
    'rounded-full border bg-pipeline-reservado text-pipeline-reservado-fg border-pipeline-reservado-dot/30',
  finished:
    'rounded-full border bg-pipeline-fechado   text-pipeline-fechado-fg   border-pipeline-fechado-dot/30',
}

interface ProjectStatusBadgeProps {
  status: ProjectStatusType
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateProjectStatus(status, 'pt-BR')}
    </Badge>
  )
}
