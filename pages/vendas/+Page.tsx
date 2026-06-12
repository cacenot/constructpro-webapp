import { Plus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { SalesFilters } from '@/components/vendas/sales-filters'
import { SalesTable } from '@/components/vendas/sales-table'
import { useSalesTable } from '@/hooks/use-sales-table'

export default function VendasPage() {
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
  } = useSalesTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Vendas"
          description="Acompanhe o funil de vendas e gerencie propostas, reservas e contratos."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/vendas/novo')}>
              <Plus className="size-4" />
              Nova Proposta
            </Button>
          }
        />

        <div className="shrink-0">
          <SalesFilters {...filters} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <SalesTable
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
