import { FileText } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { ContractTableRow } from '@/hooks/use-contracts-table'
import { createContractColumns } from './contract-columns'

// Estável no escopo de módulo: o DataTableRow é memoizado e exige getRowId com
// referência estável para não re-renderizar a lista inteira ao mudar o estado.
const getContractRowId = (contract: ContractTableRow) => String(contract.id)

interface ContractsTableProps {
  data: ContractTableRow[]
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

export function ContractsTable({
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
}: ContractsTableProps) {
  const columns = useMemo(() => createContractColumns(), [])

  return (
    <DataTableInfinite
      aria-label="Contratos"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      getRowId={getContractRowId}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'contrato' : 'contratos'}` : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <FileText className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhum contrato encontrado com esses filtros.'
              : 'Nenhum contrato cadastrado ainda.'}
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
