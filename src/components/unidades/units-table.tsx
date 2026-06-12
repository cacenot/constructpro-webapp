import { Building } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { UnitSummaryResponse } from '@/hooks/use-units-table'
import { type UnitsTableMeta, unitsColumns } from './units-columns'

// Estável no escopo de módulo: o DataTableRow é memoizado e exige getRowId com
// referência estável para não re-renderizar a lista inteira ao selecionar.
const getUnitRowId = (unit: UnitSummaryResponse) => String(unit.id)

interface UnitsTableProps {
  data: UnitSummaryResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onViewDetails: (unit: UnitSummaryResponse) => void
  selectedId?: number | null
  sort: string
  onSort: (value: string) => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
}

export function UnitsTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  onViewDetails,
  selectedId,
  sort,
  onSort,
  total,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
}: UnitsTableProps) {
  return (
    <DataTableInfinite
      aria-label="Unidades"
      columns={unitsColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      meta={{ sort, onSort, onViewDetails } satisfies UnitsTableMeta}
      onRowClick={onViewDetails}
      getRowId={getUnitRowId}
      isRowSelected={(unit) => unit.id === selectedId}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'unidade' : 'unidades'}` : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Building className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhuma unidade encontrada com os filtros aplicados.'
              : 'Nenhuma unidade cadastrada.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/unidades/novo')}>
              Cadastrar unidade
            </Button>
          )}
        </div>
      }
    />
  )
}
