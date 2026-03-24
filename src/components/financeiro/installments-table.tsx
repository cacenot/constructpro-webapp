import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'
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
import type { InstallmentResponse } from '@/hooks/use-installments'
import { type InstallmentsTableMeta, installmentsColumns } from './installments-columns'

interface InstallmentsTableProps {
  data: InstallmentResponse[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  onPayInstallment: (installment: InstallmentResponse) => void
  onIssueBoleto: (installment: InstallmentResponse) => void
  onViewDetails: (installment: InstallmentResponse) => void
  sort: string
  onSort: (value: string) => void
}

const SKELETON_ROWS = 10

export function InstallmentsTable({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onPayInstallment,
  onIssueBoleto,
  onViewDetails,
  sort,
  onSort,
}: InstallmentsTableProps) {
  const table = useReactTable({
    data,
    columns: installmentsColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    meta: {
      onPayInstallment,
      onIssueBoleto,
      onViewDetails,
      sort,
      onSort,
    } satisfies InstallmentsTableMeta,
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
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no meaningful key
            <TableRow key={i}>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell className="px-6 py-3">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-5 w-24 rounded-full" />
              </TableCell>
              <TableCell className="px-6 py-3">
                <Skeleton className="h-7 w-7 rounded-md" />
              </TableCell>
            </TableRow>
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={installmentsColumns.length} className="py-12 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Receipt className="size-10 opacity-40" />
                <p className="text-sm">
                  {hasActiveFilters
                    ? 'Nenhuma parcela encontrada com os filtros aplicados.'
                    : 'Nenhuma parcela cadastrada.'}
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
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewDetails(row.original)}
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
  )
}
