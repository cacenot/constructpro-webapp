import { UserCheck, UserPlus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { BrokerFilters } from '@/components/corretores/broker-filters'
import { BrokerPagination } from '@/components/corretores/broker-pagination'
import { BrokerTable } from '@/components/corretores/broker-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBrokersTable } from '@/hooks/use-brokers-table'

export default function BrokersPage() {
  const { data, isLoading, total, hasActiveFilters, handleClearFilters, filters, pagination } =
    useBrokersTable()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Corretores</h1>
            <p className="mt-2 text-muted-foreground">Gerencie os corretores parceiros.</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/corretores/novo')}>
            <UserPlus className="size-4" />
            Novo Corretor
          </Button>
        </div>

        {/* Filters */}
        <BrokerFilters
          {...filters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserCheck className="size-4" />
              {isLoading ? 'Carregando...' : `${total} corretores`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BrokerTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
          <BrokerPagination {...pagination} />
        </Card>
      </div>
    </AppLayout>
  )
}
