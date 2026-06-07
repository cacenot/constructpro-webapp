import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DetailPanelProps {
  title: string
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
  className?: string
}

/** Painel de detalhe: título de console + corpo. Card só quando agrupa de verdade. */
export function DetailPanel({ title, icon: Icon, children, className }: DetailPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface DataRowProps {
  label: ReactNode
  value: ReactNode
  mono?: boolean
  tone?: 'success' | 'warning' | 'destructive'
  strong?: boolean
}

/** Linha rótulo → valor de um painel. Valor tabular, alinhado à direita. */
export function DataRow({ label, value, mono, tone, strong }: DataRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-right text-sm tabular-nums',
          mono && 'font-mono',
          strong && 'font-semibold text-foreground',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'destructive' && 'text-destructive'
        )}
      >
        {value}
      </span>
    </div>
  )
}
