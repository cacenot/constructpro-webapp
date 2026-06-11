import { Users } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { CustomerResponse } from '@/hooks/use-customers-table'
import { type CustomersTableMeta, customersColumns } from './customers-columns'

// Estáveis no escopo de módulo: o DataTableRow é memoizado e exige onRowClick/getRowId
// com referência estável para não re-renderizar a lista inteira ao selecionar.
const handleCustomerRowClick = (customer: CustomerResponse) => navigate(`/clientes/${customer.id}`)
const getCustomerRowId = (customer: CustomerResponse) => String(customer.id)

interface CustomersTableProps {
  data: CustomerResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
  sort: string
  onSort: (value: string) => void
}

export function CustomersTable({
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
  sort,
  onSort,
}: CustomersTableProps) {
  return (
    <DataTableInfinite
      aria-label="Clientes"
      columns={customersColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onRowClick={handleCustomerRowClick}
      getRowId={getCustomerRowId}
      meta={{ sort, onSort } satisfies CustomersTableMeta}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'cliente' : 'clientes'}` : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhum cliente encontrado com esses filtros.'
              : 'Nenhum cliente cadastrado.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/clientes/novo')}>
              Cadastrar cliente
            </Button>
          )}
        </div>
      }
    />
  )
}
