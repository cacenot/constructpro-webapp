import { AppLayout } from '@/components/app-layout'
import { CommissionFilters } from '@/components/comissoes/commission-filters'
import { CommissionSummaryCards } from '@/components/comissoes/commission-summary-cards'
import { CommissionTable } from '@/components/comissoes/commission-table'
import { PageHeader } from '@/components/ui/page-header'
import { useCommissionsTable } from '@/hooks/use-commissions-table'

export default function ComissoesPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    summary,
    summaryLoading,
    hasActiveFilters,
    handleClearFilters,
    filters,
  } = useCommissionsTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Comissões"
          description="Acompanhe comissões por corretor, imobiliária e período."
          className="shrink-0"
        />

        <div className="shrink-0">
          <CommissionSummaryCards summary={summary} isLoading={summaryLoading} />
        </div>

        <div className="shrink-0">
          <CommissionFilters {...filters} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <CommissionTable
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
