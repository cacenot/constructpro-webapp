import { type SaleStatus, translateSaleStatus } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<(typeof SaleStatus)[keyof typeof SaleStatus], string> = {
  proposal:
    'rounded-full border bg-pipeline-proposta  text-pipeline-proposta-fg  border-pipeline-proposta-dot/30',
  pending_signature:
    'rounded-full border bg-pipeline-assinatura text-pipeline-assinatura-fg border-pipeline-assinatura-dot/30',
  pending_payment:
    'rounded-full border bg-pipeline-reservado text-pipeline-reservado-fg border-pipeline-reservado-dot/30',
  closed:
    'rounded-full border bg-pipeline-fechado   text-pipeline-fechado-fg   border-pipeline-fechado-dot/30',
  lost: 'rounded-full border bg-pipeline-perdido   text-pipeline-perdido-fg   border-pipeline-perdido-dot/30',
}

type SaleStatusValue = (typeof SaleStatus)[keyof typeof SaleStatus]

interface SaleStatusBadgeProps {
  status: SaleStatusValue
}

export function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateSaleStatus(status, 'pt-BR')}
    </Badge>
  )
}
