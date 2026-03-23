import { Plus } from 'lucide-react'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UnitDetailDrawer } from '@/components/unidades/unit-detail-drawer'
import { UnitsFilters } from '@/components/unidades/units-filters'
import { UnitsPagination } from '@/components/unidades/units-pagination'
import { UnitsTable } from '@/components/unidades/units-table'
import { type UnitSummaryResponse, useUnitsTable } from '@/hooks/use-units-table'

export default function UnidadesPage() {
  const {
    data,
    isLoading,
    hasActiveFilters,
    handleClearFilters,
    filters,
    pagination,
    sort,
    projects,
  } = useUnitsTable()

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleRowClick(unit: UnitSummaryResponse) {
    setSelectedUnitId(unit.id)
    setDrawerOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie as unidades dos seus empreendimentos e controle disponibilidade.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/unidades/novo')}>
            <Plus className="size-4" />
            Nova Unidade
          </Button>
        </div>

        <UnitsFilters
          filters={filters}
          projects={projects}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        <Card className="overflow-hidden p-0">
          <UnitsTable
            data={data}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            sort={sort}
            onRowClick={handleRowClick}
          />
          <UnitsPagination {...pagination} />
        </Card>
      </div>

      <UnitDetailDrawer
        unitId={selectedUnitId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </AppLayout>
  )
}
