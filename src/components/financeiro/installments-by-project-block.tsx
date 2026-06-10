import { Building2, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type InstallmentProjectBreakdown,
  type InstallmentsQuery,
  useInstallmentsByProject,
} from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'

interface InstallmentsByProjectBlockProps {
  /** Filtros ativos da tela (vindos do hook). project_id/paginação são removidos:
   * o bloco agrupa por projeto e sempre mostra a carteira inteira. */
  baseParams: InstallmentsQuery
  onSelectProject: (projectId: number) => void
}

function pctOf(rate: string | undefined): number {
  return Math.min(100, Math.max(0, Number(rate ?? 0) || 0))
}

/**
 * Carteira por empreendimento — onde está o dinheiro e o risco. Uma linha por
 * projeto (ordenada por a-receber desc pelo backend), com barra de progresso do
 * recebido, o saldo a receber e o atraso em coral. Clicar recorta a aba Parcelas
 * para aquele empreendimento. Espelha GET /installments/by-project.
 */
export function InstallmentsByProjectBlock({
  baseParams,
  onSelectProject,
}: InstallmentsByProjectBlockProps) {
  // Agrupa por projeto: descarta project_id (recorte) e a paginação.
  const params = useMemo(() => {
    const { project_id, page, page_size, sort_by, ...rest } = baseParams
    return rest
  }, [baseParams])

  const { data, isLoading, isError } = useInstallmentsByProject(params)
  const items = data?.items ?? []

  if (isLoading) return <ByProjectBlockSkeleton />
  if (isError) {
    return (
      <ByProjectShell>
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a carteira por empreendimento.
          </p>
        </div>
      </ByProjectShell>
    )
  }
  if (items.length === 0) return null

  return (
    <ByProjectShell count={items.length}>
      <div className="-mx-2 flex flex-col">
        {items.map((item) => (
          <ProjectRow key={item.project.id} item={item} onSelect={onSelectProject} />
        ))}
      </div>
    </ByProjectShell>
  )
}

function ByProjectShell({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-baseline justify-between gap-4 p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold">Carteira por empreendimento</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A receber e inadimplência por projeto
          </p>
        </div>
        {count != null && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {count} {count === 1 ? 'empreendimento' : 'empreendimentos'}
          </span>
        )}
      </header>
      <div className="px-5 pb-4">{children}</div>
    </Card>
  )
}

function ProjectRow({
  item,
  onSelect,
}: {
  item: InstallmentProjectBreakdown
  onSelect: (projectId: number) => void
}) {
  const pct = pctOf(item.payment_progress_percentage)
  const remaining = item.total_remaining_amount?.cents ?? 0
  const overdue = item.total_overdue_amount?.cents ?? 0
  const overdueCount = item.overdue_count ?? 0

  return (
    <button
      type="button"
      onClick={() => onSelect(item.project.id)}
      className="group flex items-center gap-4 rounded-md px-2 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Building2 className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{item.project.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {Math.round(pct)}% recebido
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-36 shrink-0 text-right">
        <div className="text-sm font-medium tabular-nums">{formatCurrency(remaining / 100)}</div>
        {overdue > 0 ? (
          <div className="text-xs text-destructive tabular-nums">
            {formatCurrency(overdue / 100)} em atraso
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">em dia</div>
        )}
      </div>
      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 sm:block" />
      {overdueCount > 0 && <span className="sr-only">{overdueCount} parcelas em atraso</span>}
    </button>
  )
}

function ByProjectBlockSkeleton() {
  return (
    <ByProjectShell>
      <div className="flex flex-col gap-3 py-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-2">
            <Skeleton className="size-4 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    </ByProjectShell>
  )
}
