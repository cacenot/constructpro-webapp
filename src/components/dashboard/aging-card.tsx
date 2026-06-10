import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentsSummary } from '@/hooks/use-installments'
import { type AgingBucketKey, agingBucketHref } from '@/lib/installment-aging'
import { cn, formatCurrency } from '@/lib/utils'

// Coral (destructive) escalando por opacidade: quanto mais velho o atraso, mais
// intenso. Uma só voz semântica (coral = atraso), a idade modula a intensidade.
const OVERDUE_BUCKETS: { key: AgingBucketKey; label: string; accent: string }[] = [
  { key: 'd1_30', label: '1-30 dias', accent: 'text-destructive/55' },
  { key: 'd31_60', label: '31-60 dias', accent: 'text-destructive/75' },
  { key: 'd61_90', label: '61-90 dias', accent: 'text-destructive/90' },
  { key: 'd90_plus', label: '90+ dias', accent: 'text-destructive' },
]

function plural(count: number): string {
  return count === 1 ? 'parcela' : 'parcelas'
}

/**
 * Parcelas vencidas por idade (versão compacta do dashboard) + maiores atrasos.
 * Cada faixa deep-linka o /financeiro já recortado (estado nuqs na URL).
 */
export function AgingCard() {
  // Mesma key do hero ({ page_size: 1 }) — o TanStack deduplica o fetch.
  const { data, isLoading, isError } = useInstallmentsSummary({ page_size: 1 })
  const topOverdue = useInstallmentsSummary({
    overdue: true,
    // due_date:asc com overdue=true ⇒ vencidas mais antigas primeiro (maior atraso em dias).
    // Ordenar por valor exigiria campo de amount na whitelist de sort do backend (#157).
    sort_by: ['due_date:asc'],
    page_size: 3,
  })

  if (isLoading) return <AgingCardSkeleton />

  const summary = data?.summary ?? null
  const overdueTotal = summary?.total_overdue_amount?.cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const buckets = OVERDUE_BUCKETS.map((meta) => {
    const bucket = summary?.aging?.[meta.key]
    return { ...meta, count: bucket?.count ?? 0, cents: bucket?.amount?.cents ?? 0 }
  })
  const hasOverdue = overdueTotal > 0 || overdueCount > 0
  const topItems = topOverdue.data?.items ?? []

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold">Parcelas vencidas</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Por tempo de atraso</p>
        </div>
        {hasOverdue && (
          <div className="shrink-0 text-right">
            <div className="text-xl font-semibold leading-none tracking-tight tabular-nums text-destructive">
              {formatCurrency(overdueTotal / 100)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {overdueCount} {plural(overdueCount)}
            </div>
          </div>
        )}
      </header>

      <div className="px-5 pb-4">
        {isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o aging.</p>
        ) : hasOverdue ? (
          <>
            <div
              aria-hidden
              className="mb-3 flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
            >
              {buckets.map(
                (bucket) =>
                  bucket.cents > 0 && (
                    <div
                      key={bucket.key}
                      className={cn('h-full min-w-[3px] bg-current', bucket.accent)}
                      style={{ width: `${(bucket.cents / overdueTotal) * 100}%` }}
                    />
                  )
              )}
            </div>

            <div className="-mx-2 flex flex-col">
              {buckets.map((bucket) => (
                // href recalculado por render: mantém o recorte de datas fresco (refetch-on-focus re-renderiza).
                <a
                  key={bucket.key}
                  href={agingBucketHref(bucket.key)}
                  className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full bg-current',
                      bucket.accent,
                      bucket.cents > 0 && 'shadow-[0_0_6px_currentColor]'
                    )}
                  />
                  <span className="whitespace-nowrap text-sm">{bucket.label}</span>
                  <span className="ml-auto flex items-baseline gap-3">
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {bucket.count}
                      <span className="sr-only"> {plural(bucket.count)}</span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-right text-sm font-medium tabular-nums sm:w-24',
                        bucket.cents === 0 ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      {formatCurrency(bucket.cents / 100)}
                    </span>
                  </span>
                  <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 sm:block" />
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-success/[0.08] px-4 py-3.5">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-success">Carteira em dia</p>
              <p className="text-xs text-muted-foreground">Nenhuma parcela em atraso.</p>
            </div>
          </div>
        )}
      </div>

      {/* Erro do topOverdue degrada silencioso (mesmo endpoint do summary — falhas
          correlacionadas; o estado de erro do card principal já cobre o usuário). */}
      {hasOverdue && topOverdue.isLoading && (
        <div className="space-y-1.5 border-t px-5 py-3">
          <Skeleton className="h-3 w-24" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      )}
      {hasOverdue && !topOverdue.isLoading && topItems.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Maiores atrasos
          </p>
          <div className="-mx-2 flex flex-col">
            {topItems.map((item) => (
              <a
                key={item.id}
                href={`/financeiro?parcela=${item.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 truncate text-sm">
                  {item.customer?.full_name ?? 'Cliente'}
                  <span className="ml-2 text-xs text-destructive tabular-nums">
                    {item.days_overdue} {item.days_overdue === 1 ? 'dia' : 'dias'}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCurrency((item.remaining_amount?.cents ?? 0) / 100)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function AgingCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-24" />
      </header>
      <div className="px-5 pb-5">
        <Skeleton className="mb-3 h-2 w-full rounded-full" />
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </Card>
  )
}
