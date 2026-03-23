import { UserPlus, Users } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { CustomersFilters } from '@/components/clientes/customers-filters'
import { CustomersPagination } from '@/components/clientes/customers-pagination'
import { CustomersTable } from '@/components/clientes/customers-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomersTable } from '@/hooks/use-customers-table'

export default function CustomersPage() {
  const {
    data,
    isLoading,
    total,
    hasActiveFilters,
    handleClearFilters,
    filters,
    pagination,
    sort,
  } = useCustomersTable()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="mt-2 text-muted-foreground">Gerencie sua base de clientes e contatos.</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/clientes/novo')}>
            <UserPlus className="size-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <CustomersFilters {...filters} />

        {/* Table */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="size-4" />
              {isLoading ? 'Carregando...' : `${total} clientes`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CustomersTable
              data={data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              sort={sort}
            />
          </CardContent>
          <CustomersPagination {...pagination} />
        </Card>
      </div>
    </AppLayout>
  )
}
