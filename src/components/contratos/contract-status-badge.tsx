import { type ContractStatusType, translateContractStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<ContractStatusType, string> = {
  pending:
    'rounded-full border bg-pipeline-proposta  text-pipeline-proposta-fg  border-pipeline-proposta-dot/30',
  active:
    'rounded-full border bg-pipeline-fechado   text-pipeline-fechado-fg   border-pipeline-fechado-dot/30',
  in_default:
    'rounded-full border bg-pipeline-perdido   text-pipeline-perdido-fg   border-pipeline-perdido-dot/30 font-semibold',
  settled:
    'rounded-full border bg-pipeline-reservado text-pipeline-reservado-fg border-pipeline-reservado-dot/30',
  canceled: 'rounded-full border bg-muted text-muted-foreground border-border',
  terminated: 'rounded-full border bg-muted text-muted-foreground border-border',
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
