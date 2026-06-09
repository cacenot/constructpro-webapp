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

const OVERDUE_BADGE = 'border-destructive/30 bg-destructive/10 text-destructive'

interface InstallmentStatusBadgeProps {
  status: InstallmentStatusValue
  /**
   * Inadimplência derivada (ver lib/installment-overdue). Quando `true`, o badge
   * vira "Em atraso" (coral) no lugar do status base — pendente continua pendente,
   * mas quando vence em aberto a comunicação muda. Não há status `overdue` no back.
   */
  overdue?: boolean
  daysOverdue?: number
}

export function InstallmentStatusBadge({
  status,
  overdue,
  daysOverdue,
}: InstallmentStatusBadgeProps) {
  if (overdue) {
    return (
      <Badge variant="ghost" className={cn('gap-1.5 rounded-full border', OVERDUE_BADGE)}>
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"
        />
        Em atraso
        {daysOverdue && daysOverdue > 0 ? (
          <span className="tabular-nums opacity-80">· {daysOverdue}d</span>
        ) : null}
      </Badge>
    )
  }

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
