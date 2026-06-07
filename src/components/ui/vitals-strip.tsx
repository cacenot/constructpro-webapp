import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * KPI Strip — o painel de instrumentos da Sala de Controle. Uma única superfície
 * (`bg-border`) com células `bg-card` separadas por `gap-px`, formando hairlines
 * perfeitas em qualquer wrap. Substitui a grade de cards idênticos. Ver DESIGN.md.
 */

/** Tom semântico do valor. `default` herda marfim; os demais tingem só o número
 * (status nunca é fundo chapado). */
export type VitalTone = 'default' | 'success' | 'warning' | 'info' | 'destructive'

export interface Vital {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: VitalTone
}

const TONE: Record<VitalTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
}

/** Colunas no desktop conforme o nº de células (instrumento de células iguais). */
const LG_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

// 1 coluna no mobile (valores de 6-7 dígitos cabem inteiros); adensa a partir do sm.
const STRIP =
  'grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2'
// No range de 2 colunas (sm→lg), o último item ímpar ocupa as duas p/ não ficar órfão.
const CELL = 'flex flex-col gap-1.5 bg-card p-4 sm:max-lg:last:odd:col-span-2 sm:p-5'

interface VitalsStripProps {
  vitals: Vital[]
  className?: string
}

export function VitalsStrip({ vitals, className }: VitalsStripProps) {
  return (
    <div className={cn(STRIP, LG_COLS[vitals.length] ?? 'lg:grid-cols-4', className)}>
      {vitals.map((vital) => (
        <div key={vital.label} className={CELL}>
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {vital.label}
          </span>
          <span
            className={cn(
              'tabular-nums text-2xl font-semibold leading-none tracking-tight',
              TONE[vital.tone ?? 'default']
            )}
          >
            {vital.value}
          </span>
          {vital.sub != null && (
            <span className="tabular-nums text-xs text-muted-foreground">{vital.sub}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Casca de loading que espelha a superfície da strip, para não pular layout. */
export function VitalsStripSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn(STRIP, LG_COLS[count] ?? 'lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
          key={i}
          className={CELL}
        >
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-7 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
