import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
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
import type { SaleSummaryResponse } from '@/hooks/use-sales-summary'
import { ApproveSaleDialog } from './approve-sale-dialog'
import { createSalesColumns } from './sales-columns'
import { SignContractDialog } from './sign-contract-dialog'

interface SalesTableProps {
  data: SaleSummaryResponse[]
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const SKELETON_ROWS = 10

export function SalesTable({ data, isLoading, hasActiveFilters, onClearFilters }: SalesTableProps) {
  const [signSaleId, setSignSaleId] = useState<number | null>(null)
  const [payEntrySaleId, setPayEntrySaleId] = useState<number | null>(null)
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null)

  const columns = createSalesColumns({
    onSignContract: (sale) => setSignSaleId(sale.id),
    onPayEntry: (sale) => setPayEntrySaleId(sale.id),
    onApproveSale: (sale) => setApproveSaleId(sale.id),
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  return (
    <>
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
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-6 py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell px-6 py-3">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-6 py-3">
                    <Skeleton className="h-3 w-24" />
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
                    <TrendingUp className="size-10 opacity-40" />
                    <p className="text-sm">
                      {hasActiveFilters
                        ? 'Nenhuma venda encontrada com os filtros aplicados.'
                        : 'Nenhuma venda cadastrada.'}
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

      {signSaleId !== null && (
        <SignContractDialog
          open={true}
          onOpenChange={(open) => !open && setSignSaleId(null)}
          saleId={signSaleId}
        />
      )}

      {payEntrySaleId !== null && (
        <PayInstallmentDialog
          open={true}
          onOpenChange={(open: boolean) => !open && setPayEntrySaleId(null)}
          saleId={payEntrySaleId}
        />
      )}

      {approveSaleId !== null && (
        <ApproveSaleDialog
          open={true}
          onOpenChange={(open) => !open && setApproveSaleId(null)}
          saleId={approveSaleId}
        />
      )}
    </>
  )
}
