import { type components, translateContractStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ContractStatus = components['schemas']['ContractStatus']

const statusStyles: Record<ContractStatus, string> = {
  pending:
    'rounded-full border bg-pipeline-proposta   text-pipeline-proposta-fg   border-pipeline-proposta-dot/30',
  active:
    'rounded-full border bg-pipeline-fechado    text-pipeline-fechado-fg    border-pipeline-fechado-dot/30',
  in_default:
    'rounded-full border bg-pipeline-perdido    text-pipeline-perdido-fg    border-pipeline-perdido-dot/30',
  settled:
    'rounded-full border bg-pipeline-reservado  text-pipeline-reservado-fg  border-pipeline-reservado-dot/30',
  canceled: 'rounded-full border border-border bg-muted text-muted-foreground',
  terminated: 'rounded-full border border-border bg-muted text-muted-foreground',
}

interface ContractStatusBadgeProps {
  status: ContractStatus
  className?: string
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status], className)}>
      {translateContractStatus(status, 'pt-BR')}
    </Badge>
  )
}
