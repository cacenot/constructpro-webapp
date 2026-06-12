import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { UnitDetailDrawer } from '@/components/unidades/unit-detail-drawer'
import { UnitsFilters } from '@/components/unidades/units-filters'
import { UnitsTable } from '@/components/unidades/units-table'
import { type UnitSummaryResponse, useUnitsTable } from '@/hooks/use-units-table'

export default function UnidadesPage() {
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
    sort,
    setSort,
  } = useUnitsTable()

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Estável: é o onRowClick da tabela — uma referência nova quebraria a memoização
  // por linha (DataTableRow) e voltaria a re-renderizar a lista inteira ao selecionar.
  const handleViewDetails = useCallback((unit: UnitSummaryResponse) => {
    setSelectedUnitId(unit.id)
    setDrawerOpen(true)
  }, [])

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Unidades"
          description="Gerencie as unidades dos seus empreendimentos e controle disponibilidade."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/unidades/novo')}>
              <Plus className="size-4" />
              Nova Unidade
            </Button>
          }
        />

        <div className="shrink-0">
          <UnitsFilters
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <UnitsTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onViewDetails={handleViewDetails}
            selectedId={selectedUnitId}
            sort={sort}
            onSort={setSort}
            total={total}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onReachEnd={fetchNextPage}
          />
        </div>
      </div>

      <UnitDetailDrawer
        unitId={selectedUnitId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </AppLayout>
  )
}
