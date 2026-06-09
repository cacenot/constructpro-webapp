import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowData,
  type TableMeta,
  useReactTable,
} from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Alinhamento e classes por coluna, lidos do `meta` de cada ColumnDef. Aditivo:
// colunas que não declaram nada herdam o default (esquerda, padding padrão).
declare module '@tanstack/react-table' {
  // biome-ignore lint/correctness/noUnusedVariables: assinatura exigida pela augmentation
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center'
    /** Classe extra na célula do corpo. */
    className?: string
    /** Classe extra na célula de cabeçalho. */
    headClassName?: string
  }
}

const ALIGN: Record<'left' | 'right' | 'center', string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** Carregamento inicial — pinta linhas de skeleton. */
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Conteúdo do estado vazio (ícone + copy + ação). Mostrado quando não há linhas. */
  empty?: ReactNode
  onRowClick?: (row: TData) => void
  /** Classe condicional por linha (ex.: realce de inadimplência). */
  rowClassName?: (row: TData) => string
  isRowSelected?: (row: TData) => boolean
  getRowId?: (row: TData, index: number) => string
  /** Meta repassado ao TanStack Table (ex.: estado de ordenação e callbacks). */
  meta?: unknown
  /** Renderizado dentro do container de scroll, após a tabela (rodapé do infinite). */
  bottomSlot?: ReactNode
  /** Ref do container de scroll — usado como raiz do IntersectionObserver. */
  scrollRef?: RefObject<HTMLDivElement | null>
  skeletonRows?: number
  className?: string
  'aria-label'?: string
}

const DEFAULT_SKELETON_ROWS = 12

/**
 * Tabela base do projeto: header sticky, container de scroll fill-height (só as
 * linhas rolam) e estados padronizados (loading, erro, vazio). Densidade e voz de
 * console seguem o DESIGN.md (label em maiúsculas, hairlines, tonal lift no hover).
 * É a fundação de `DataTableInfinite`.
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  empty,
  onRowClick,
  rowClassName,
  isRowSelected,
  getRowId,
  meta,
  bottomSlot,
  scrollRef,
  skeletonRows = DEFAULT_SKELETON_ROWS,
  className,
  'aria-label': ariaLabel,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowId,
    meta: meta as TableMeta<TData> | undefined,
  })

  const rows = table.getRowModel().rows
  const columnCount = columns.length
  const showSkeleton = isLoading && rows.length === 0

  return (
    <div
      ref={scrollRef}
      className={cn('min-h-0 flex-1 overflow-auto overscroll-contain bg-card', className)}
    >
      <table className="w-full caption-bottom text-sm" aria-label={ariaLabel}>
        <thead className="sticky top-0 z-10 bg-card">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => {
                const align = header.column.columnDef.meta?.align ?? 'left'
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'h-11 px-4 align-middle text-[0.6875rem] font-medium uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground',
                      ALIGN[align],
                      header.column.columnDef.meta?.headClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {showSkeleton ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows têm índice estável
              <tr key={rowIndex} className="border-b">
                {columns.map((_column, colIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: células de skeleton
                  <td key={colIndex} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-[60%] min-w-12" />
                  </td>
                ))}
              </tr>
            ))
          ) : isError ? (
            <tr>
              <td colSpan={columnCount} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <AlertTriangle className="size-9 text-destructive/70" />
                  <p className="text-sm">Não foi possível carregar os dados.</p>
                  {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      Tentar novamente
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="py-16 text-center">
                {empty ?? <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const clickable = !!onRowClick
              return (
                <tr
                  key={row.id}
                  data-state={isRowSelected?.(row.original) ? 'selected' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    clickable
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onRowClick(row.original)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b transition-colors outline-none',
                    clickable && 'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50',
                    'data-[state=selected]:bg-muted',
                    rowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = cell.column.columnDef.meta?.align ?? 'left'
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3.5 align-middle',
                          ALIGN[align],
                          cell.column.columnDef.meta?.className
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {bottomSlot}
    </div>
  )
}
