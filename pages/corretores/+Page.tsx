import { UserPlus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { BrokerFilters } from '@/components/corretores/broker-filters'
import { BrokerTable } from '@/components/corretores/broker-table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useBrokersTable } from '@/hooks/use-brokers-table'

export default function BrokersPage() {
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
  } = useBrokersTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Corretores"
          description="Gerencie os corretores parceiros."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/corretores/novo')}>
              <UserPlus className="size-4" />
              Novo Corretor
            </Button>
          }
        />

        <div className="shrink-0">
          <BrokerFilters
            {...filters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <BrokerTable
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
