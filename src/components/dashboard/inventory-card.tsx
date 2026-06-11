import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useUnitsInventory } from '@/hooks/use-units-inventory'
import { useProjectsSummary } from '@/hooks/useProjects'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

// Semáforo imobiliário do espelho de vendas (≠ linguagem do funil):
// disponível = verde, reservada = âmbar, vendida = coral.
const STOCK_STATUSES = [
  { key: 'available', label: 'Disponíveis', accent: 'text-success' },
  { key: 'reserved', label: 'Reservadas', accent: 'text-warning' },
  { key: 'sold', label: 'Vendidas', accent: 'text-destructive' },
] as const

/**
 * Operacional no dashboard: estoque de unidades por status + VGV a vender, e o
 * progresso de vendas dos empreendimentos (top 4 por % vendido).
 */
export function InventoryCard() {
  const inventory = useUnitsInventory()
  const projects = useProjectsSummary({ page: 1, page_size: 50 })

  if (inventory.isLoading || projects.isLoading) return <InventoryCardSkeleton />

  const byStatus = inventory.data?.summary?.by_status
  const items = projects.data?.items ?? []
  // Top 4 por % vendido — tenants têm poucos projetos; ordenar no cliente.
  const topProjects = [...items]
    .sort((a, b) => Number(b.sold_percentage) - Number(a.sold_percentage))
    .slice(0, 4)

  const hasUnits = byStatus ? STOCK_STATUSES.some((s) => (byStatus[s.key]?.count ?? 0) > 0) : false

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        {inventory.isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o estoque.</p>
        ) : hasUnits && byStatus ? (
          <>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
              {STOCK_STATUSES.map((status) => (
                <div key={status.key} className="bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-lg font-semibold tabular-nums">
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]',
                        status.accent
                      )}
                    />
                    {byStatus[status.key]?.count ?? 0}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{status.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Estoque a vender:{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency((byStatus.available?.vgv?.cents ?? 0) / 100)}
              </span>{' '}
              em VGV
            </p>
          </>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada ainda.</p>
            <a href="/empreendimentos" className="text-xs font-medium text-primary hover:underline">
              Cadastrar um empreendimento →
            </a>
          </div>
        )}
      </div>

      {topProjects.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Empreendimentos
          </p>
          <div className="-mx-2 flex flex-col">
            {topProjects.map((project) => (
              <a
                key={project.id}
                href={`/empreendimentos/${project.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-36 shrink-0 truncate text-sm">{project.name}</span>
                <Progress value={Number(project.sold_percentage)} className="h-1.5 flex-1" />
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {project.sold_count}/{project.total_units}
                </span>
                <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                  {formatPercent(Number(project.sold_percentage), 0)}%
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function InventoryCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
        <Skeleton className="mt-3 h-4 w-48" />
      </div>
      <div className="space-y-2 border-t px-5 py-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    </Card>
  )
}
