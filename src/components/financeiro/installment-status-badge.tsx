import {
  type InstallmentStatus,
  translateInstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type InstallmentStatusValue = (typeof InstallmentStatus)[keyof typeof InstallmentStatus]

const statusStyles: Record<InstallmentStatusValue, string> = {
  scheduled: 'rounded-full border border-warning/30 bg-warning/10 text-warning',
  invoiced: 'rounded-full border border-info/30 bg-info/10 text-info',
  partial: 'rounded-full border border-info/30 bg-info/10 text-info',
  paid: 'rounded-full border border-success/30 bg-success/10 text-success',
  canceled: 'rounded-full border bg-muted text-muted-foreground border-border',
  overdue:
    'rounded-full border border-destructive/30 bg-destructive/10 text-destructive font-semibold',
}

interface InstallmentStatusBadgeProps {
  status: InstallmentStatusValue
}

export function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateInstallmentStatus(status, 'pt-BR')}
    </Badge>
  )
}
