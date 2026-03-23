import { translateUnitCategory, type UnitSummaryResponse } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatId } from '@/lib/utils'
import { UnitStatusBadge } from './unit-status-badge'

function SortIcon({ column, sort }: { column: string; sort: string }) {
  if (!sort.startsWith(column)) return <ArrowUpDown className="ml-1 size-3 text-muted-foreground" />
  return sort.endsWith(':asc') ? (
    <ArrowUp className="ml-1 size-3" />
  ) : (
    <ArrowDown className="ml-1 size-3" />
  )
}

interface UnitsColumnsCallbacks {
  sort: string
  onSort: (value: string) => void
  onRowClick: (unit: UnitSummaryResponse) => void
}

export function createUnitsColumns({
  sort,
  onSort,
  onRowClick,
}: UnitsColumnsCallbacks): ColumnDef<UnitSummaryResponse>[] {
  function toggleSort(column: string) {
    if (sort === `${column}:desc`) {
      onSort(`${column}:asc`)
    } else {
      onSort(`${column}:desc`)
    }
  }

  return [
    {
      id: 'id',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('id')}
        >
          ID
          <SortIcon column="id" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="tabular-nums font-mono text-xs shrink-0">
          {formatId(row.original.id)}
        </Badge>
      ),
    },
    {
      id: 'name',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('name')}
        >
          Nome
          <SortIcon column="name" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {translateUnitCategory(row.original.category, 'pt-BR')}
          </span>
        </div>
      ),
    },
    {
      id: 'project',
      header: () => <span className="hidden sm:block">Empreendimento</span>,
      cell: ({ row }) => (
        <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[160px]">
          {row.original.project_name}
        </span>
      ),
    },
    {
      id: 'area',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium hidden md:flex"
          onClick={() => toggleSort('area')}
        >
          Área
          <SortIcon column="area" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="hidden md:block text-sm tabular-nums text-muted-foreground">
          {row.original.area} m²
        </span>
      ),
    },
    {
      id: 'price',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('price_cents')}
        >
          Preço
          <SortIcon column="price_cents" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums font-medium">
          {formatCurrency(Number(row.original.price))}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { status } = row.original
        if (!status) return null
        return <UnitStatusBadge status={status} />
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const unit = row.original
        return (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="shrink-0">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ações</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onRowClick(unit)}>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigate(`/empreendimentos/${unit.project_id}/unidades/${unit.id}/editar`)
                }
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/vendas/novo?unidade=${unit.id}`)}>
                Nova venda
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
