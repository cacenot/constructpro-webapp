import { Percent } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { CommissionItem } from '@/hooks/use-commissions-table'
import { createCommissionColumns } from './commission-columns'

// Estável no escopo de módulo: o DataTableRow é memoizado e exige getRowId com
// referência estável para não re-renderizar a lista inteira a cada página nova.
const getCommissionRowId = (commission: CommissionItem) => String(commission.id)

interface CommissionTableProps {
  data: CommissionItem[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
}

export function CommissionTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  total,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
}: CommissionTableProps) {
  const columns = useMemo(() => createCommissionColumns(), [])

  return (
    <DataTableInfinite
      aria-label="Comissões"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      getRowId={getCommissionRowId}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'comissão' : 'comissões'}` : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Percent className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhuma comissão encontrada com esses filtros.'
              : 'Nenhuma comissão no período.'}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      }
    />
  )
}
