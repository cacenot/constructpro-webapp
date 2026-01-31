import { translateUnitStatus, type UnitResponse } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type UnitStatus = NonNullable<UnitResponse['status']>

const statusConfig: Record<UnitStatus, string> = {
  available: 'border-success/50 bg-success/20 text-success dark:text-success',
  reserved: 'border-warning/50 bg-warning/20 text-warning dark:text-warning',
  sold: 'border-border bg-muted text-muted-foreground',
  unavailable: 'border-destructive/50 bg-destructive/20 text-destructive dark:text-destructive',
}

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <Badge variant="secondary" className={cn(statusConfig[status])}>
      {translateUnitStatus(status, 'pt-BR')}
    </Badge>
  )
}
