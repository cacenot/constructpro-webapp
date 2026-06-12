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
import {
  memo,
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Forma do skeleton de uma coluna no carregamento inicial. Espelha a receita de
 * célula real (`data-table-cells`) para o estado de loading não destoar do
 * conteúdo que o substitui: âncora de duas linhas, pill de badge, box de ações.
 * Default (sem declaração): uma barra de texto de uma linha.
 */
export interface SkeletonSpec {
  variant?: 'text' | 'badge' | 'actions'
  /** Linhas de texto (variant `text`). Use 2 para âncora/valor+legenda. Default 1. */
  lines?: 1 | 2
  /** Largura da barra principal (ex.: `w-[60%]`, `w-24`). Default por alinhamento. */
  width?: string
  /** Largura da 2ª barra quando `lines: 2`. Default por alinhamento. */
  subWidth?: string
}

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
    /** Forma do skeleton desta coluna no carregamento inicial. */
    skeleton?: SkeletonSpec
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
  /**
   * Em layout fill-height, mede o container e renderiza skeleton rows suficientes
   * para preencher a viewport (em vez do número fixo). Ligado pelo `DataTableInfinite`.
   */
  autoFillSkeleton?: boolean
  /**
   * Nº de skeleton rows (fiéis ao shape das colunas) anexadas após as linhas reais
   * enquanto a próxima página carrega. Ligado pelo `DataTableInfinite`. Default 0.
   */
  loadingMoreRows?: number
  className?: string
  'aria-label'?: string
}

const DEFAULT_SKELETON_ROWS = 12
const MIN_SKELETON_ROWS = 6
const HEADER_HEIGHT = 44 // <thead> h-11
const ROW_HEIGHT_TWO_LINE = 64 // py-3.5 + duas barras
const ROW_HEIGHT_ONE_LINE = 48 // py-3.5 + uma barra

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
  autoFillSkeleton = false,
  loadingMoreRows = 0,
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

  // Ref interno garantido (o `scrollRef` externo é opcional): usamos para medir o
  // container e o repassamos ao chamador quando fornecido.
  const innerRef = useRef<HTMLDivElement | null>(null)
  const setScrollNode = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node
      if (scrollRef) scrollRef.current = node
    },
    [scrollRef]
  )

  // Altura estimada da linha = a da célula mais alta. Como a âncora (2 linhas) está
  // sempre visível, tabelas com qualquer coluna `lines: 2` usam a estimativa maior.
  const estimatedRowHeight = useMemo(
    () =>
      columns.some((column) => column.meta?.skeleton?.lines === 2)
        ? ROW_HEIGHT_TWO_LINE
        : ROW_HEIGHT_ONE_LINE,
    [columns]
  )

  const [autoSkeletonRows, setAutoSkeletonRows] = useState<number | null>(null)

  // Preenche a viewport: mede a altura disponível e converte em nº de skeleton rows,
  // reagindo a resize. Só ativo no fill-height (DataTableInfinite) e durante o loading.
  useLayoutEffect(() => {
    if (!autoFillSkeleton || !showSkeleton) return
    const el = innerRef.current
    if (!el) return
    let raf = 0
    const measure = () => {
      const available = el.clientHeight - HEADER_HEIGHT
      if (available <= 0) return
      setAutoSkeletonRows(Math.max(MIN_SKELETON_ROWS, Math.round(available / estimatedRowHeight)))
    }
    // Mede agora e re-mede no próximo frame: no primeiro mount (full page load) a
    // cadeia `h-svh`/flex pode não ter assentado no tick do layout effect, e o
    // clientHeight inicial vem menor (ou 0) que o final — caindo no fallback. O rAF
    // relê já com o layout estável. O ResizeObserver cobre os resizes seguintes.
    measure()
    raf = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [autoFillSkeleton, showSkeleton, estimatedRowHeight])

  const effectiveSkeletonRows =
    autoFillSkeleton && autoSkeletonRows != null ? autoSkeletonRows : skeletonRows

  return (
    <div
      ref={setScrollNode}
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
            <SkeletonRows columns={columns} count={effectiveSkeletonRows} />
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
            <>
              {rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  clickable={!!onRowClick}
                  selected={isRowSelected?.(row.original) ?? false}
                  extraClass={rowClassName?.(row.original)}
                  onRowClick={onRowClick}
                />
              ))}
              {loadingMoreRows > 0 && <SkeletonRows columns={columns} count={loadingMoreRows} />}
            </>
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

/**
 * Linhas de skeleton fiéis ao shape das colunas (mesmo padding, alinhamento e
 * visibilidade por breakpoint das linhas reais). Usado no carregamento inicial e,
 * anexado após as linhas reais, no "carregando mais" do scroll infinito.
 */
function SkeletonRows<TData>({ columns, count }: { columns: ColumnDef<TData>[]; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows têm índice estável
        <tr key={rowIndex} className="border-b">
          {columns.map((column, colIndex) => {
            const align = column.meta?.align ?? 'left'
            return (
              <td
                // biome-ignore lint/suspicious/noArrayIndexKey: célula de skeleton
                key={column.id ?? colIndex}
                className={cn(
                  'px-2 py-3.5 align-middle sm:px-4',
                  ALIGN[align],
                  column.meta?.className
                )}
              >
                <SkeletonCell spec={column.meta?.skeleton} align={align} />
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

/**
 * Conteúdo do skeleton de uma célula, fiel à receita real da coluna. Respeita o
 * alinhamento (`meta.align`) para que valores monetários encostem à direita como o
 * conteúdo que substituem.
 */
function SkeletonCell({
  spec,
  align,
}: {
  spec?: SkeletonSpec
  align: 'left' | 'right' | 'center'
}) {
  const variant = spec?.variant ?? 'text'

  if (variant === 'actions') {
    return (
      <div className="flex justify-end">
        <Skeleton className="size-8 rounded-md" />
      </div>
    )
  }

  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  if (variant === 'badge') {
    return (
      <div className={cn('flex', justify)}>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    )
  }

  const items =
    align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'
  const mainWidth = spec?.width ?? (align === 'right' ? 'w-16' : 'w-[62%]')
  const subWidth = spec?.subWidth ?? (align === 'right' ? 'w-12' : 'w-[42%]')

  return (
    <div className={cn('flex flex-col gap-2', items)}>
      <Skeleton className={cn('h-4 min-w-16', mainWidth)} />
      {spec?.lines === 2 && <Skeleton className={cn('h-3 min-w-12', subWidth)} />}
    </div>
  )
}
