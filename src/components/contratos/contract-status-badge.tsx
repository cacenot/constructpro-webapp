import { type ContractStatusType, translateContractStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<ContractStatusType, string> = {
  pending:
    'rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  active:
    'rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  in_default:
    'rounded-full border border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 font-semibold',
  settled:
    'rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  canceled:
    'rounded-full border border-gray-500/30 bg-gray-500/10 text-gray-700 dark:border-gray-400/30 dark:bg-gray-400/10 dark:text-gray-300',
  terminated:
    'rounded-full border border-gray-500/30 bg-gray-500/10 text-gray-700 dark:border-gray-400/30 dark:bg-gray-400/10 dark:text-gray-300',
}

interface ContractStatusBadgeProps {
  status: ContractStatusType
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateContractStatus(status, 'pt-BR')}
    </Badge>
  )
}
