import { UserPlus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { CustomersFilters } from '@/components/clientes/customers-filters'
import { CustomersTable } from '@/components/clientes/customers-table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useCustomersTable } from '@/hooks/use-customers-table'

export default function CustomersPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasActiveFilters,
    handleClearFilters,
    filters,
    sort,
    setSort,
  } = useCustomersTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Clientes"
          description="Gerencie sua base de clientes e contatos."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/clientes/novo')}>
              <UserPlus className="size-4" />
              Novo Cliente
            </Button>
          }
        />

        <div className="shrink-0">
          <CustomersFilters
            {...filters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <CustomersTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            total={total}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onReachEnd={fetchNextPage}
            sort={sort}
            onSort={setSort}
          />
        </div>
      </div>
    </AppLayout>
  )
}
