import { AppLayout } from '@/components/app-layout'
import { CommissionFilters } from '@/components/comissoes/commission-filters'
import { CommissionPagination } from '@/components/comissoes/commission-pagination'
import { CommissionSummaryCards } from '@/components/comissoes/commission-summary-cards'
import { CommissionTable } from '@/components/comissoes/commission-table'
import { Card, CardContent } from '@/components/ui/card'
import { useCommissionsTable } from '@/hooks/use-commissions-table'

export default function ComissoesPage() {
  const { data, isLoading, summary, hasActiveFilters, handleClearFilters, filters, pagination } =
    useCommissionsTable()

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe comissões por corretor, imobiliária e período.
          </p>
        </div>

        <CommissionSummaryCards summary={summary} isLoading={isLoading} />

        <CommissionFilters {...filters} />

        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-0">
            <CommissionTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
          <CommissionPagination {...pagination} />
        </Card>
      </div>
    </AppLayout>
  )
}
