import {
  type InstallmentStatus,
  translateInstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type InstallmentStatusValue = (typeof InstallmentStatus)[keyof typeof InstallmentStatus]

/**
 * Status Glow Rule: tinte translúcido + borda da cor + dot de 6px com halo.
 * O dot herda a cor do texto (`bg-current`); o glow é o que faz o status saltar
 * sobre o grafite. Cancelado não brilha, é estado morto, não pede atenção.
 */
const statusStyles: Record<InstallmentStatusValue, { badge: string; glow: boolean }> = {
  scheduled: { badge: 'border-warning/30 bg-warning/10 text-warning', glow: true },
  invoiced: { badge: 'border-info/30 bg-info/10 text-info', glow: true },
  partial: { badge: 'border-info/30 bg-info/10 text-info', glow: true },
  paid: { badge: 'border-success/30 bg-success/10 text-success', glow: true },
  canceled: { badge: 'border-border bg-muted text-muted-foreground', glow: false },
}

interface InstallmentStatusBadgeProps {
  status: InstallmentStatusValue
}

export function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
  const { badge, glow } = statusStyles[status]
  return (
    <Badge variant="ghost" className={cn('gap-1.5 rounded-full border', badge)}>
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full bg-current', glow && 'shadow-[0_0_5px_currentColor]')}
      />
      {translateInstallmentStatus(status, 'pt-BR')}
    </Badge>
  )
}
