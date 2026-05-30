import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { UserCheck } from 'lucide-react'
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
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { createBrokerColumns } from './broker-columns'

interface BrokerTableProps {
  data: BrokerResponse[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const SKELETON_ROWS = 10

export function BrokerTable({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: BrokerTableProps) {
  const columns = createBrokerColumns()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
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
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
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
                  <UserCheck className="size-10 opacity-40" />
                  <p className="text-sm">
                    {hasActiveFilters
                      ? 'Nenhum corretor encontrado com os filtros aplicados.'
                      : 'Nenhum corretor cadastrado.'}
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
