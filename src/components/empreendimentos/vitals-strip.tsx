import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Tom semântico do valor de um vital. `default` herda marfim (texto primário);
 * os demais usam as cores semânticas do sistema. Status nunca é fundo chapado:
 * aqui ele tinge só o número, sobre o grafite.
 */
type VitalTone = 'default' | 'success' | 'warning' | 'info' | 'destructive'

export interface Vital {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: VitalTone
}

interface VitalsStripProps {
  vitals: Vital[]
  className?: string
}

const TONE: Record<VitalTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
}

/** Quantas colunas no desktop conforme o nº de vitais (instrumento de células iguais). */
const LG_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

/**
 * KPI Strip — o painel de instrumentos da Sala de Controle. Uma única superfície
 * (`bg-border`) com células `bg-card` separadas por `gap-px`, formando hairlines
 * perfeitas em qualquer wrap. Substitui a grade de cards idênticos.
 */
export function VitalsStrip({ vitals, className }: VitalsStripProps) {
  return (
    <div
      className={cn(
        // 1 coluna no mobile: valores monetários de 6-7 dígitos cabem inteiros
        // (em 2 colunas a célula estreita cortava o VGV). Adensa a partir do sm.
        'grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2',
        LG_COLS[vitals.length] ?? 'lg:grid-cols-4',
        className
      )}
    >
      {vitals.map((vital) => (
        <div
          key={vital.label}
          // No range de 2 colunas (sm→lg), o último item ímpar ocupa as duas para
          // não ficar órfão. Abaixo de sm é 1 coluna — sem col-span, senão o span
          // forçaria uma 2ª coluna implícita e quebraria o layout mobile.
          className="flex flex-col gap-1.5 bg-card p-4 sm:max-lg:last:odd:col-span-2 sm:p-5"
        >
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
