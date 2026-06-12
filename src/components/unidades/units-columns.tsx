import { translateUnitCategory } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { MoneyCell, MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { SortableHeader } from '@/components/ui/sortable-header'
import type { UnitSummaryResponse } from '@/hooks/use-units-table'
import { formatArea, formatId } from '@/lib/utils'
import { UnitDeleteDialog } from './unit-delete-dialog'
import { UnitStatusBadge } from './unit-status-badge'

export interface UnitsTableMeta {
  sort: string
  onSort: (value: string) => void
  onViewDetails: (unit: UnitSummaryResponse) => void
}

export const unitsColumns: ColumnDef<UnitSummaryResponse>[] = [
  {
    id: 'id',
    header: ({ table }) => {
      const meta = table.options.meta as UnitsTableMeta | undefined
      if (!meta) return 'ID'
      return <SortableHeader label="ID" field="id" currentSort={meta.sort} onSort={meta.onSort} />
    },
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatId(row.original.id)}
      </span>
    ),
  },
  {
    id: 'name',
    header: ({ table }) => {
      const meta = table.options.meta as UnitsTableMeta | undefined
      if (!meta) return 'Nome'
      return (
        <SortableHeader label="Nome" field="name" currentSort={meta.sort} onSort={meta.onSort} />
      )
    },
    cell: ({ row }) => (
      <PrimaryCell
        title={row.original.name}
        subtitle={translateUnitCategory(row.original.category, 'pt-BR')}
      />
    ),
    meta: { skeleton: { lines: 2 } },
  },
  {
    id: 'project',
    header: 'Empreendimento',
    cell: ({ row }) => (
      <MutedCell>
        {row.original.project_name ? (
          <span className="block truncate max-w-[180px]">{row.original.project_name}</span>
        ) : null}
      </MutedCell>
    ),
    meta: { className: 'hidden sm:table-cell', headClassName: 'hidden sm:table-cell' },
  },
  {
    id: 'area',
    header: ({ table }) => {
      const meta = table.options.meta as UnitsTableMeta | undefined
      if (!meta) return 'Área'
      return (
        <SortableHeader label="Área" field="area" currentSort={meta.sort} onSort={meta.onSort} />
      )
    },
    cell: ({ row }) => (
      <MutedCell>
        <span className="tabular-nums">{formatArea(row.original.area)}</span>
      </MutedCell>
    ),
    meta: {
      align: 'right',
      className: 'hidden md:table-cell',
      headClassName: 'hidden md:table-cell',
    },
  },
  {
    id: 'price',
    header: ({ table }) => {
      const meta = table.options.meta as UnitsTableMeta | undefined
      if (!meta) return 'Preço'
      return (
        <SortableHeader
          label="Preço"
          field="price_cents"
          currentSort={meta.sort}
          onSort={meta.onSort}
        />
      )
    },
    cell: ({ row }) => <MoneyCell value={row.original.price.cents / 100} />,
    meta: { align: 'right' },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { status } = row.original
      if (!status) return null
      return <UnitStatusBadge status={status} />
    },
    meta: { skeleton: { variant: 'badge' } },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as UnitsTableMeta | undefined
      return <UnitRowActions unit={row.original} onViewDetails={meta?.onViewDetails} />
    },
    meta: { align: 'right', skeleton: { variant: 'actions' } },
  },
]

function UnitRowActions({
  unit,
  onViewDetails,
}: {
  unit: UnitSummaryResponse
  onViewDetails?: (unit: UnitSummaryResponse) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <RowActionsMenu>
        <DropdownMenuItem onClick={() => onViewDetails?.(unit)}>Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/unidades/${unit.id}/editar`)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/vendas/novo?unidade=${unit.id}`)}>
          Nova venda
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Excluir
        </DropdownMenuItem>
      </RowActionsMenu>

      <UnitDeleteDialog
        unitId={unit.id}
        unitName={unit.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
