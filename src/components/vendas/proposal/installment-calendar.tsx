import * as React from 'react'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { computeMonthlyBreakdown, type MonthlyCell } from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import {
  INSTALLMENT_KIND_LABELS,
  type InstallmentKind,
  type SaleFormData,
} from '@/schemas/sale.schema'
import { KIND_DOT } from './constants'
import { REVEAL } from './section'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
const ABBR = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const money = (c: number) => `R$ ${formatCentsToDisplay(c) || '0,00'}`

function dominantKind(cells: MonthlyCell[]): InstallmentKind {
  const ks = cells.map((c) => c.kind)
  if (ks.includes('key_delivery')) return 'key_delivery'
  if (ks.includes('balloon')) return 'balloon'
  if (ks.includes('entry')) return 'entry'
  if (ks.includes('regular')) return 'regular'
  return 'extra'
}

interface Props {
  schedules: SaleFormData['installment_schedules'] | undefined
  /** Índice global da proposta (quando "mesmo índice"); herdado por grupos sem índice próprio. */
  globalIndexCode?: string | null
  className?: string
}

export function InstallmentCalendar({ schedules, globalIndexCode = null, className }: Props) {
  const breakdown = React.useMemo(
    () => computeMonthlyBreakdown(schedules ?? [], globalIndexCode),
    [schedules, globalIndexCode]
  )
  const years = React.useMemo(() => {
    const ys = new Set<number>()
    for (const key of breakdown.keys()) ys.add(Number(key.slice(0, 4)))
    return [...ys].sort((a, b) => a - b)
  }, [breakdown])

  // Conjunto de chaves que devem animar (entraram desde o último render).
  const prevKeys = React.useRef<Set<string>>(new Set())
  const animKeys = React.useMemo(() => {
    const current = new Set<string>()
    for (const [k, cells] of breakdown) current.add(`${k}:${cells.length}`)
    const fresh = new Set<string>()
    for (const k of current) {
      const [monthKey] = k.split(':')
      if (!prevKeys.current.has(k) && monthKey) fresh.add(monthKey)
    }
    prevKeys.current = current
    return fresh
  }, [breakdown])

  const [hover, setHover] = React.useState<{ key: string; x: number; y: number } | null>(null)

  if (!years.length) return null

  return (
    <div className={cn('relative', className)}>
      <div className="grid grid-cols-[1.5rem_repeat(12,1fr)] gap-1 text-[0.6rem] text-muted-foreground">
        <span />
        {ABBR.map((a, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: month positions are fixed (0–11), never reordered
          <span key={i} className="text-center">
            {a}
          </span>
        ))}
      </div>
      {years.map((yr) => (
        <div key={yr} className="mt-1 grid grid-cols-[1.5rem_repeat(12,1fr)] items-center gap-1">
          <span className="text-[0.6rem] text-muted-foreground">{String(yr).slice(2)}</span>
          {Array.from({ length: 12 }, (_, m) => {
            const key = `${yr}-${String(m + 1).padStart(2, '0')}`
            const cells = breakdown.get(key)
            const filled = !!cells?.length
            return (
              <button
                type="button"
                key={key}
                aria-label={
                  filled
                    ? `${MONTHS[m]} ${yr}: ${cells.length} parcela(s)`
                    : `${MONTHS[m]} ${yr}: sem parcelas`
                }
                className={cn(
                  'aspect-square rounded-[3px] transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none',
                  filled ? KIND_DOT[dominantKind(cells)] : 'bg-muted',
                  filled && animKeys.has(key) && REVEAL
                )}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ key, x: r.left + r.width / 2, y: r.bottom })
                }}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ key, x: r.left + r.width / 2, y: r.bottom })
                }}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
              />
            )
          })}
        </div>
      ))}

      {hover && <CalendarPopover hover={hover} cells={breakdown.get(hover.key) ?? []} />}
    </div>
  )
}

function CalendarPopover({
  hover,
  cells,
}: {
  hover: { key: string; x: number; y: number }
  cells: MonthlyCell[]
}) {
  const [yr, mo] = hover.key.split('-')
  const total = cells.reduce((s, c) => s + c.amount, 0)
  const WIDTH = 232
  const left = Math.max(8, Math.min(hover.x - WIDTH / 2, window.innerWidth - WIDTH - 8))
  return (
    <div
      role="tooltip"
      style={{ position: 'fixed', left, top: hover.y + 8, width: WIDTH }}
      className="z-50 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg"
    >
      <p className="mb-2 font-semibold">
        {MONTHS[Number(mo) - 1]} {yr}
      </p>
      {cells.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma parcela</p>
      ) : (
        <>
          {cells.map((c, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: cells in a month popover are ephemeral display-only items
            <div key={i} className="mb-1.5 flex items-start justify-between gap-2">
              <span className="flex min-w-0 items-start gap-1.5">
                <span className={cn('mt-1 size-2 shrink-0 rounded-[2px]', KIND_DOT[c.kind])} />
                <span className="min-w-0">
                  <span className="block leading-tight">{INSTALLMENT_KIND_LABELS[c.kind]}</span>
                  {c.indexCode && (
                    <span className="block font-mono text-[0.6rem] leading-tight text-muted-foreground">
                      {c.indexCode}
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap tabular-nums">
                {c.amount ? money(c.amount) : 'a definir'}
              </span>
            </div>
          ))}
          <div className="mt-1 flex justify-between gap-2 border-t border-border pt-1.5 font-semibold">
            <span>Total</span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">{money(total)}</span>
          </div>
          <p className="mt-1 text-[0.6rem] text-muted-foreground">
            {cells.length} parcela{cells.length > 1 ? 's' : ''} no mês
          </p>
        </>
      )}
    </div>
  )
}
