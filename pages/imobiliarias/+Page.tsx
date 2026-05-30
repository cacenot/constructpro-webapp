import { Building2 } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { AgencyFilters } from '@/components/imobiliarias/agency-filters'
import { AgencyPagination } from '@/components/imobiliarias/agency-pagination'
import { AgencyTable } from '@/components/imobiliarias/agency-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgenciesTable } from '@/hooks/use-agencies-table'

export default function AgenciesPage() {
  const { data, isLoading, total, hasActiveFilters, handleClearFilters, filters, pagination } =
    useAgenciesTable()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Imobiliárias</h1>
            <p className="mt-2 text-muted-foreground">Gerencie as imobiliárias parceiras.</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/imobiliarias/novo')}>
            <Building2 className="size-4" />
            Nova Imobiliária
          </Button>
        </div>

        {/* Filters */}
        <AgencyFilters
          {...filters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="size-4" />
              {isLoading ? 'Carregando...' : `${total} imobiliárias`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AgencyTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
          <AgencyPagination {...pagination} />
        </Card>
      </div>
    </AppLayout>
  )
}
