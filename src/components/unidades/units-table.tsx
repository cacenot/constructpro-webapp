import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Building2, CloudAlert, Plus, RefreshCw } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UnitSummaryResponse, UnitsTableSort } from '@/hooks/use-units-table'
import { cn } from '@/lib/utils'
import { createUnitsColumns } from './units-columns'

interface UnitsTableProps {
  data: UnitSummaryResponse[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  sort: UnitsTableSort
  onRowClick: (unit: UnitSummaryResponse) => void
}

const SKELETON_ROWS = 10

export function UnitsTable({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  sort,
  onRowClick,
}: UnitsTableProps) {
  const columns = createUnitsColumns({
    sort: sort.sort,
    onSort: sort.setSort,
    onRowClick,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-6">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no meaningful key
              <TableRow key={i}>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <CloudAlert className="size-10 text-destructive opacity-80" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Não foi possível carregar as unidades
                    </p>
                    <p className="text-xs">Verifique sua conexão e tente novamente.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={isFetching}
                    onClick={onRetry}
                  >
                    <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
                    {isFetching ? 'Tentando…' : 'Tentar novamente'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Building2 className="size-10 opacity-40" />
                  {hasActiveFilters ? (
                    <>
                      <p className="text-sm">
                        Nenhuma unidade encontrada com os filtros aplicados.
                      </p>
                      <Button variant="ghost" size="sm" onClick={onClearFilters}>
                        Limpar filtros
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Nenhuma unidade cadastrada
                        </p>
                        <p className="text-xs">
                          Cadastre a primeira unidade para começar a vender.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => navigate('/unidades/novo')}
                      >
                        <Plus className="size-3.5" />
                        Cadastrar primeira unidade
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={0}
                aria-label={`Ver detalhes da unidade ${row.original.name}`}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                onClick={() => onRowClick(row.original)}
                onKeyDown={(e) => {
                  // Só responde quando a própria linha está focada — evita que Enter/Espaço
                  // no kebab de ações (filho da linha) abra o drawer por bubbling.
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(row.original)
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-6 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
