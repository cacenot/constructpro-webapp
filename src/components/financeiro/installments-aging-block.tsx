import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { InstallmentListSummary } from '@/hooks/use-installments'
import type { AgingBucketKey } from '@/hooks/use-installments-table'
import { cn, formatCurrency } from '@/lib/utils'

interface InstallmentsAgingBlockProps {
  summary: InstallmentListSummary | null | undefined
  isLoading: boolean
  onSelectBucket: (bucket: AgingBucketKey) => void
}

/**
 * Inadimplência por idade — o gargalo da carteira, lido numa olhada. As quatro
 * faixas de atraso compõem uma barra de severidade (coral escalando do recente
 * ao crítico) + um detalhamento clicável que recorta a aba Parcelas naquela
 * faixa. Sem atraso, vira estado positivo "carteira em dia". A vencer (não
 * vencido) entra como contexto separado, em âmbar. Espelha InstallmentAging.
 */

// Coral (destructive) escalando por opacidade: quanto mais velho o atraso, mais
// intenso. Uma só voz semântica (coral = atraso), a idade modula a intensidade.
const OVERDUE_BUCKETS: { key: AgingBucketKey; label: string; accent: string }[] = [
  { key: 'd1_30', label: '1-30 dias', accent: 'text-destructive/55' },
  { key: 'd31_60', label: '31-60 dias', accent: 'text-destructive/75' },
  { key: 'd61_90', label: '61-90 dias', accent: 'text-destructive/90' },
  { key: 'd90_plus', label: '90+ dias', accent: 'text-destructive' },
]

function readBucket(
  aging: InstallmentListSummary['aging'],
  key: AgingBucketKey
): { count: number; cents: number } {
  const bucket = aging?.[key]
  return { count: bucket?.count ?? 0, cents: bucket?.amount?.cents ?? 0 }
}

function plural(count: number): string {
  return count === 1 ? 'parcela' : 'parcelas'
}

export function InstallmentsAgingBlock({
  summary,
  isLoading,
  onSelectBucket,
}: InstallmentsAgingBlockProps) {
  if (isLoading) return <AgingBlockSkeleton />

  const aging = summary?.aging
  const overdueTotal = summary?.total_overdue_amount?.cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const notDue = readBucket(aging, 'not_due')
  const buckets = OVERDUE_BUCKETS.map((meta) => ({ ...meta, ...readBucket(aging, meta.key) }))
  const hasOverdue = overdueTotal > 0 || overdueCount > 0

  return (
    <Card className="max-w-2xl gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold">Inadimplência por idade</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recebíveis vencidos por faixa de atraso
          </p>
        </div>
        {hasOverdue && (
          <div className="shrink-0 text-right">
            <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-destructive">
              {formatCurrency(overdueTotal / 100)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {overdueCount} {plural(overdueCount)} {overdueCount === 1 ? 'vencida' : 'vencidas'}
            </div>
          </div>
        )}
      </header>

      <div className="px-5 pb-4">
        {hasOverdue ? (
          <>
            <div
              aria-hidden
              className="mb-4 flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-muted"
            >
              {buckets.map(
                (bucket) =>
                  bucket.cents > 0 && (
                    <div
                      key={bucket.key}
                      className={cn(
                        'h-full min-w-[3px] bg-current transition-[width] duration-300',
                        bucket.accent
                      )}
                      style={{ width: `${(bucket.cents / overdueTotal) * 100}%` }}
                    />
                  )
              )}
            </div>

            <div className="-mx-2 flex flex-col">
              {buckets.map((bucket) => (
                <AgingRow
                  key={bucket.key}
                  accent={bucket.accent}
                  label={bucket.label}
                  count={bucket.count}
                  cents={bucket.cents}
                  muted={bucket.cents === 0}
                  onSelect={() => onSelectBucket(bucket.key)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-success/[0.08] px-4 py-3.5">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-success">Carteira em dia</p>
              <p className="text-xs text-muted-foreground">Nenhuma parcela vencida no período.</p>
            </div>
          </div>
        )}
      </div>

      {notDue.cents > 0 && (
        <div className="border-t px-5 py-2">
          <div className="-mx-2">
            <AgingRow
              accent="text-warning"
              label="A vencer"
              count={notDue.count}
              cents={notDue.cents}
              labelMuted
              onSelect={() => onSelectBucket('not_due')}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

function AgingRow({
  accent,
  label,
  count,
  cents,
  muted = false,
  labelMuted = false,
  onSelect,
}: {
  accent: string
  label: string
  count: number
  cents: number
  muted?: boolean
  labelMuted?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full bg-current',
          accent,
          !muted && 'shadow-[0_0_6px_currentColor]'
        )}
      />
      <span
        className={cn(
          'whitespace-nowrap text-sm',
          labelMuted ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {label}
      </span>
      <span className="ml-auto flex items-baseline gap-3">
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
          {count} {plural(count)}
        </span>
        <span
          className={cn(
            'shrink-0 whitespace-nowrap text-right text-sm font-medium tabular-nums sm:w-28',
            muted ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {formatCurrency(cents / 100)}
        </span>
      </span>
      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 sm:block" />
    </button>
  )
}

function AgingBlockSkeleton() {
  return (
    <Card className="max-w-2xl gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="space-y-2">
          <Skeleton className="ml-auto h-6 w-28" />
          <Skeleton className="ml-auto h-3 w-24" />
        </div>
      </header>
      <div className="px-5 pb-5">
        <Skeleton className="mb-4 h-2.5 w-full rounded-full" />
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </Card>
  )
}
