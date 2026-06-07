import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Rótulo de console em maiúsculas (KPIs, vitais, fases). Tipografia `label` do design system. */
export function StatLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Linha rótulo → valor de um painel de detalhe. Valor tabular, alinhado à direita. */
export function DataRow({
  label,
  value,
  mono,
  tone,
  strong,
  hint,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  tone?: 'success' | 'destructive'
  strong?: boolean
  /** Texto de ajuda contextual: vira um ícone de info com tooltip ao lado do rótulo. */
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Sobre: ${label}`}
                className="inline-flex text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span
        className={cn(
          'text-right text-sm tabular-nums',
          mono && 'font-mono',
          strong && 'font-semibold text-foreground',
          tone === 'success' && 'text-success',
          tone === 'destructive' && 'text-destructive'
        )}
      >
        {value}
      </span>
    </div>
  )
}
