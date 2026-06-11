import { Plus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ContractsFilters } from '@/components/contratos/contracts-filters'
import { ContractsTable } from '@/components/contratos/contracts-table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useContractsTable } from '@/hooks/use-contracts-table'

export default function ContratosPage() {
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
  } = useContractsTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Contratos"
          description="Gerencie contratos de financiamento e acompanhe o ciclo de vida dos contratos."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/contratos/novo')}>
              <Plus className="size-4" />
              Novo Contrato
            </Button>
          }
        />

        <div className="shrink-0">
          <ContractsFilters {...filters} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <ContractsTable
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
          />
        </div>
      </div>
    </AppLayout>
  )
}
