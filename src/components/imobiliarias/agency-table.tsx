import { Building2 } from 'lucide-react'
import { useMemo } from 'react'
import { navigate } from 'vike/client/router'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { AgencyResponse } from '@/hooks/use-agencies-table'
import { createAgencyColumns } from './agency-columns'

// Estáveis no escopo de módulo: o DataTableRow é memoizado e exige onRowClick/getRowId
// com referência estável para não re-renderizar a lista inteira ao selecionar.
const handleAgencyRowClick = (agency: AgencyResponse) => navigate(`/imobiliarias/${agency.id}`)
const getAgencyRowId = (agency: AgencyResponse) => String(agency.id)

interface AgencyTableProps {
  data: AgencyResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
}

export function AgencyTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  total,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
}: AgencyTableProps) {
  const columns = useMemo(() => createAgencyColumns(), [])

  return (
    <DataTableInfinite
      aria-label="Imobiliárias"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onRowClick={handleAgencyRowClick}
      getRowId={getAgencyRowId}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={
        total > 0
          ? `Fim da lista · ${total} ${total === 1 ? 'imobiliária' : 'imobiliárias'}`
          : undefined
      }
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Building2 className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhuma imobiliária encontrada com esses filtros.'
              : 'Nenhuma imobiliária cadastrada ainda.'}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      }
    />
  )
}
