import { UserCog } from 'lucide-react'
import { useMemo } from 'react'
import { navigate } from 'vike/client/router'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { createBrokerColumns } from './broker-columns'

// Estáveis no escopo de módulo: o DataTableRow é memoizado e exige onRowClick/getRowId
// com referência estável para não re-renderizar a lista inteira ao selecionar.
const handleBrokerRowClick = (broker: BrokerResponse) => navigate(`/corretores/${broker.id}`)
const getBrokerRowId = (broker: BrokerResponse) => String(broker.id)

interface BrokerTableProps {
  data: BrokerResponse[]
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

export function BrokerTable({
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
}: BrokerTableProps) {
  const columns = useMemo(() => createBrokerColumns(), [])

  return (
    <DataTableInfinite
      aria-label="Corretores"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onRowClick={handleBrokerRowClick}
      getRowId={getBrokerRowId}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'corretor' : 'corretores'}` : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <UserCog className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhum corretor encontrado com esses filtros.'
              : 'Nenhum corretor cadastrado ainda.'}
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
