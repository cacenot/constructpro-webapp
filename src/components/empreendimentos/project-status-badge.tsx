import { type ProjectStatusType, translateProjectStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<ProjectStatusType, string> = {
  construction:
    'rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  finished:
    'rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
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
