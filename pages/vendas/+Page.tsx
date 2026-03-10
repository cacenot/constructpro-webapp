import { Plus, TrendingUp } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesFilters } from '@/components/vendas/sales-filters'
import { SalesPagination } from '@/components/vendas/sales-pagination'
import { SalesTable } from '@/components/vendas/sales-table'
import { useSalesTable } from '@/hooks/use-sales-table'

export default function VendasPage() {
  const { data, isLoading, total, hasActiveFilters, handleClearFilters, filters, pagination } =
    useSalesTable()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="mt-2 text-muted-foreground">
              Acompanhe o funil de vendas e gerencie propostas, reservas e contratos.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/vendas/novo')}>
            <Plus className="size-4" />
            Nova Proposta
          </Button>
        </div>

        {/* Filters */}
        <SalesFilters {...filters} />

        {/* Table */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="size-4" />
              {isLoading ? 'Carregando...' : `${total} vendas`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SalesTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
          <SalesPagination {...pagination} />
        </Card>
      </div>
    </AppLayout>
  )
}
