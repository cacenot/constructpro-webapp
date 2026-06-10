import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type Row,
  type RowData,
  type TableMeta,
  useReactTable,
} from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { memo, type ReactNode, type RefObject } from 'react'
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
                      'h-11 px-2 align-middle text-[0.6875rem] font-medium uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground sm:px-4',
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
            rows.map((row) => (
              <DataTableRow
                key={row.id}
                row={row}
                clickable={!!onRowClick}
                selected={isRowSelected?.(row.original) ?? false}
                extraClass={rowClassName?.(row.original)}
                onRowClick={onRowClick}
              />
            ))
          )}
        </tbody>
      </table>

      {bottomSlot}
    </div>
  )
}

interface DataTableRowProps<TData> {
  row: Row<TData>
  clickable: boolean
  selected: boolean
  extraClass?: string
  onRowClick?: (row: TData) => void
}

/**
 * Linha memoizada: com `data`/`columns` estáveis, o TanStack mantém a identidade
 * de `row`, então mudar a seleção re-renderiza só as 2 linhas afetadas em vez da
 * lista inteira (custo dominante com infinite scroll + popovers por célula).
 * Requer `onRowClick` estável no chamador (useCallback) para o memo valer.
 */
function DataTableRowInner<TData>({
  row,
  clickable,
  selected,
  extraClass,
  onRowClick,
}: DataTableRowProps<TData>) {
  return (
    <tr
      data-state={selected ? 'selected' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onRowClick?.(row.original) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onRowClick?.(row.original)
              }
            }
          : undefined
      }
      className={cn(
        'border-b transition-colors outline-none',
        clickable && 'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50',
        'data-[state=selected]:bg-muted',
        extraClass
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const align = cell.column.columnDef.meta?.align ?? 'left'
        return (
          <td
            key={cell.id}
            className={cn(
              'px-2 py-3.5 align-middle sm:px-4',
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
}

const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner
