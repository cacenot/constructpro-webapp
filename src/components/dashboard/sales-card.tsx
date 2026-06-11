import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SaleStatusBadge } from '@/components/vendas/sale-status-badge'
import { useSalesSummary } from '@/hooks/use-sales-summary'
import { cn, formatCurrency } from '@/lib/utils'

const fromCents = (cents: number) => formatCurrency(cents / 100)

/**
 * Vendas no dashboard: funil compacto (pipeline aberto + fechadas no mês),
 * par de VGVs e as 3 vendas mais recentes. Tudo de uma chamada ao /sales/summary.
 */
export function SalesCard() {
  const { data, isLoading, isError } = useSalesSummary({ page_size: 3 })

  if (isLoading) return <SalesCardSkeleton />

  const summary = data?.summary
  const recents = data?.items ?? []

  if (isError || !summary) {
    return (
      <Card className="gap-0 py-0">
        <div className="flex h-48 items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as vendas.</p>
        </div>
      </Card>
    )
  }

  const funnel = [
    { label: 'Propostas', count: summary.pipeline?.proposal?.count ?? 0 },
    { label: 'Ag. assinatura', count: summary.pipeline?.pending_signature?.count ?? 0 },
    { label: 'Ag. pagamento', count: summary.pipeline?.pending_payment?.count ?? 0 },
    { label: 'Fechadas no mês', count: summary.month.closed_count ?? 0, success: true },
  ]

  const hasAnySale =
    (summary.pipeline?.total_open_count ?? 0) > 0 || (summary.month.closed_count ?? 0) > 0

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        {hasAnySale ? (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
              {funnel.map((stage) => (
                <div key={stage.label} className="bg-muted/30 px-3 py-2.5">
                  <div
                    className={cn(
                      'text-lg font-semibold tabular-nums',
                      stage.success && 'text-success'
                    )}
                  >
                    {stage.count}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{stage.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <div className="text-[11px] text-muted-foreground">VGV em negociação</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums">
                  {fromCents(summary.pipeline?.total_open_amount?.cents ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">VGV fechado no mês</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                  {fromCents(summary.month.closed_amount?.cents ?? 0)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
            <a href="/vendas" className="text-xs font-medium text-primary hover:underline">
              Registrar uma venda →
            </a>
          </div>
        )}
      </div>

      {recents.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Recentes
          </p>
          <div className="-mx-2 flex flex-col">
            {recents.map((sale) => (
              <a
                key={sale.id}
                href={`/vendas/${sale.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {sale.customer?.full_name ?? 'Cliente'}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {sale.unit?.name}
                    {sale.unit?.project?.name ? ` · ${sale.unit.project.name}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-sm font-medium tabular-nums">
                    {fromCents(sale.amount?.cents ?? 0)}
                  </span>
                  <SaleStatusBadge status={sale.status} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function SalesCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
        <div className="mt-4 flex gap-8">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="space-y-2 border-t px-5 py-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </Card>
  )
}
