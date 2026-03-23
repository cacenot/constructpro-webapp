import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Users } from 'lucide-react'
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
import type { CustomerResponse, CustomersTableSort } from '@/hooks/use-customers-table'
import { createCustomersColumns } from './customers-columns'

interface CustomersTableProps {
  data: CustomerResponse[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  sort: CustomersTableSort
}

const SKELETON_ROWS = 10

export function CustomersTable({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  sort,
}: CustomersTableProps) {
  const columns = createCustomersColumns({
    sort: sort.sort,
    onSort: sort.setSort,
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
                  <Skeleton className="h-5 w-14" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden sm:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Users className="size-10 opacity-40" />
                  <p className="text-sm">
                    {hasActiveFilters
                      ? 'Nenhum cliente encontrado com os filtros aplicados.'
                      : 'Nenhum cliente cadastrado.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
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
    </div>
  )
}
