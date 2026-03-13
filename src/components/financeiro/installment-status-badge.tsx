import {
  type InstallmentStatus,
  translateInstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type InstallmentStatusValue = (typeof InstallmentStatus)[keyof typeof InstallmentStatus]

const statusStyles: Record<InstallmentStatusValue, string> = {
  scheduled:
    'rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  invoiced:
    'rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  partial:
    'rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300',
  paid: 'rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  canceled:
    'rounded-full border border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
  overdue:
    'rounded-full border border-red-600/40 bg-red-600/15 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-400',
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
