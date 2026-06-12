import { Building2 } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { AgencyFilters } from '@/components/imobiliarias/agency-filters'
import { AgencyTable } from '@/components/imobiliarias/agency-table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useAgenciesTable } from '@/hooks/use-agencies-table'

export default function AgenciesPage() {
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
  } = useAgenciesTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Imobiliárias"
          description="Gerencie as imobiliárias parceiras."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/imobiliarias/novo')}>
              <Building2 className="size-4" />
              Nova Imobiliária
            </Button>
          }
        />

        <div className="shrink-0">
          <AgencyFilters
            {...filters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <AgencyTable
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
