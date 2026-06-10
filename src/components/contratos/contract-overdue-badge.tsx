import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ContractOverdueBadgeProps {
  /** Quando false/null/undefined, o componente não renderiza nada. */
  isOverdue: boolean | null | undefined
  className?: string
}

/**
 * Pill de inadimplência do contrato — sinal derivado (is_overdue), ortogonal ao
 * status (ciclo de vida). Só aparece quando o contrato está inadimplente:
 * assinado, não-terminal e com >=1 parcela vencida com saldo. Ver construct-pro-api #140.
 */
export function ContractOverdueBadge({ isOverdue, className }: ContractOverdueBadgeProps) {
  if (!isOverdue) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 rounded-full border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
      Inadimplente
    </Badge>
  )
}
