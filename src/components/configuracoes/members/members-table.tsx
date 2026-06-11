import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import type { MembersTableSort, UserResponse } from '@/hooks/use-members-table'
import { createMembersColumns, type MembersTableMeta } from './members-columns'

interface MembersTableProps {
  data: UserResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  sort: MembersTableSort
  onEditRoles: (member: UserResponse) => void
  onRemove: (member: UserResponse) => void
}

// Estável no escopo de módulo: o DataTableRow é memoizado e exige getRowId com
// referência estável para não re-renderizar a lista inteira. O id é um uuid (string).
const getMemberRowId = (member: UserResponse) => String(member.id)

export function MembersTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  sort,
  onEditRoles,
  onRemove,
}: MembersTableProps) {
  const columns = useMemo(
    () => createMembersColumns({ onEditRoles, onRemove }),
    [onEditRoles, onRemove]
  )

  return (
    <DataTable
      aria-label="Membros da organização"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      getRowId={getMemberRowId}
      meta={{ sort: sort.sort, onSort: sort.setSort } satisfies MembersTableMeta}
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhum membro encontrado com os filtros aplicados.'
              : 'Nenhum membro encontrado.'}
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
