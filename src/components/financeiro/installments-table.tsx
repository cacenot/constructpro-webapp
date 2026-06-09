import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { InstallmentSummaryItemResponse } from '@/hooks/use-installments'
import { isInstallmentOverdue } from '@/lib/installment-overdue'
import { type InstallmentsTableMeta, installmentsColumns } from './installments-columns'

interface InstallmentsTableProps {
  data: InstallmentSummaryItemResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onViewDetails: (installment: InstallmentSummaryItemResponse) => void
  selectedId?: string
  sort: string
  onSort: (value: string) => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
}

export function InstallmentsTable({
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
}: InstallmentsTableProps) {
  return (
    <DataTableInfinite
      aria-label="Parcelas da carteira"
      columns={installmentsColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      meta={{ sort, onSort } satisfies InstallmentsTableMeta}
      onRowClick={onViewDetails}
      getRowId={(installment) => installment.id}
      isRowSelected={(installment) => installment.id === selectedId}
      rowClassName={(installment) =>
        isInstallmentOverdue(installment) ? 'bg-destructive/[0.04] hover:bg-destructive/[0.08]' : ''
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={total > 0 ? `Fim da lista · ${total} parcelas` : undefined}
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Receipt className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhuma parcela com os filtros aplicados.'
              : 'Nenhuma parcela na carteira.'}
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
