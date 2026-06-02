import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
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
import type { CommissionItem } from '@/hooks/use-commissions-table'
import { commissionColumns } from './commission-columns'

interface CommissionTableProps {
  data: CommissionItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const SKELETON_ROWS = 5

export function CommissionTable({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: CommissionTableProps) {
  const table = useReactTable({
    data,
    columns: commissionColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  return (
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
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
            <TableRow key={i}>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="hidden md:table-cell px-6 py-3">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell px-6 py-3">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden lg:table-cell px-6 py-3">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="hidden lg:table-cell px-6 py-3">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={commissionColumns.length} className="px-6 py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Nenhuma comissão encontrada</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-4">
                    Limpar filtros
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
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
  )
}
