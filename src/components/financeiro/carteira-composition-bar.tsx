import type { InstallmentListSummary } from '@/hooks/use-installments'
import { cn, formatCurrency } from '@/lib/utils'

interface CarteiraCompositionBarProps {
  summary: InstallmentListSummary | null | undefined
  isLoading: boolean
  className?: string
}

/** Percentual pt-BR sem casas falsas: 62 → "62", 62.5 → "62,5". */
function pct(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

interface Segment {
  key: string
  label: string
  cents: number
  /** Cor do preenchimento da barra. */
  fill: string
  /** Cor do dot da legenda (herda no texto via currentColor). */
  legend: string
}

/**
 * Pulso da carteira como instrumento único, não como grade de KPIs. Uma barra de
 * composição lê, num glance, quanto do emitido já entrou (Recebido), quanto falta
 * em dia (A receber) e quanto está vencido (Em atraso, em coral). A correção
 * acumulada entra como nota, pois já está embutida no valor atual. Filtro-scoped.
 */
export function CarteiraCompositionBar({
  summary,
  isLoading,
  className,
}: CarteiraCompositionBarProps) {
  if (isLoading) return <CarteiraCompositionBarSkeleton className={className} />

  const issued = summary?.total_current_amount?.cents ?? 0
  const paid = summary?.total_paid_amount?.cents ?? 0
  const remaining = summary?.total_remaining_amount?.cents ?? Math.max(0, issued - paid)
  const overdue = summary?.total_overdue_amount?.cents ?? 0
  const correction = summary?.total_correction_amount?.cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const onTime = Math.max(0, remaining - overdue)

  const segments: Segment[] = [
    { key: 'paid', label: 'Recebido', cents: paid, fill: 'bg-success', legend: 'text-success' },
    {
      key: 'on_time',
      label: 'A receber',
      cents: onTime,
      fill: 'bg-muted-foreground/40',
      legend: 'text-muted-foreground',
    },
    {
      key: 'overdue',
      label: 'Em atraso',
      cents: overdue,
      fill: 'bg-destructive',
      legend: 'text-destructive',
    },
  ]

  const isEmpty = issued <= 0
  const paidPct = issued > 0 ? (paid / issued) * 100 : 0

  return (
    <section
      aria-label="Composição da carteira de recebíveis"
      className={cn('rounded-lg border bg-card p-4 sm:p-5', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Carteira
        </span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(issued / 100)}
          </span>{' '}
          emitido
        </span>
      </div>

      <div
        className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={
          isEmpty
            ? 'Sem recebíveis na carteira'
            : `Recebido ${formatCurrency(paid / 100)}, a receber ${formatCurrency(onTime / 100)}, em atraso ${formatCurrency(overdue / 100)}`
        }
      >
        {!isEmpty &&
          segments.map((segment) => {
            const width = issued > 0 ? (segment.cents / issued) * 100 : 0
            if (width <= 0) return null
            return (
              <div
                key={segment.key}
                className={cn('h-full transition-[width] duration-500 ease-out', segment.fill)}
                style={{ width: `${width}%` }}
              />
            )
          })}
      </div>

      {isEmpty ? (
        <p className="mt-3 text-sm text-muted-foreground">Sem recebíveis na carteira.</p>
      ) : (
        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2">
              <span className={cn('size-2 shrink-0 rounded-full bg-current', segment.legend)} />
              <dt className="text-muted-foreground">{segment.label}</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(segment.cents / 100)}</dd>
              {segment.key === 'paid' && issued > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  ({pct(paidPct)}%)
                </span>
              )}
              {segment.key === 'overdue' && overdueCount > 0 && (
                <span className="text-xs text-destructive tabular-nums">
                  · {overdueCount} {overdueCount === 1 ? 'parcela' : 'parcelas'}
                </span>
              )}
            </div>
          ))}

          {correction > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden>·</span>
              inclui{' '}
              <span className="font-medium tabular-nums text-warning">
                {formatCurrency(correction / 100)}
              </span>{' '}
              de correção
            </div>
          )}
        </dl>
      )}
    </section>
  )
}

export function CarteiraCompositionBarSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn('rounded-lg border bg-card p-4 sm:p-5', className)}>
      <div className="flex items-baseline justify-between">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-muted" />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton da legenda
          <div key={index} className="h-4 w-40 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </section>
  )
}
