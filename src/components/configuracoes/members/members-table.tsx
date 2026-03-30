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
import type { MembersTableSort, UserResponse } from '@/hooks/use-members-table'
import { createMembersColumns } from './members-columns'

interface MembersTableProps {
  data: UserResponse[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  sort: MembersTableSort
  onEditRoles: (member: UserResponse) => void
  onRemove: (member: UserResponse) => void
}

const SKELETON_ROWS = 5

export function MembersTable({
  data,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  sort,
  onEditRoles,
  onRemove,
}: MembersTableProps) {
  const columns = createMembersColumns({
    sort: sort.sort,
    onSort: sort.setSort,
    onEditRoles,
    onRemove,
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
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
              <TableRow key={i}>
                <TableCell className="px-6 py-3">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="hidden lg:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="px-6 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="hidden lg:table-cell px-6 py-3">
                  <Skeleton className="h-4 w-20" />
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
                      ? 'Nenhum membro encontrado com os filtros aplicados.'
                      : 'Nenhum membro na organização.'}
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
