import type { ReactNode } from 'react'
import { useRef } from 'react'
import { DataTable, type DataTableProps } from '@/components/ui/data-table'
import { useIntersection } from '@/hooks/use-intersection'

export interface DataTableInfiniteProps<TData>
  extends Omit<DataTableProps<TData>, 'bottomSlot' | 'scrollRef'> {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  /** Disparado quando a sentinela entra em tela — chame `fetchNextPage` aqui. */
  onReachEnd?: () => void
  /** Rótulo discreto do fim da lista (ex.: "Fim · 63 parcelas"). */
  endLabel?: ReactNode
  /** Antecipação do prefetch antes de a sentinela aparecer. Default `300px`. */
  prefetchMargin?: string
}

const LOADING_MORE_ROWS = 3

/**
 * Tabela base com scroll infinito: header e chrome ficam parados, só as linhas
 * rolam, e ao chegar perto do fim uma sentinela (IntersectionObserver) pede a
 * próxima página. Mostra skeleton de "carregando mais" e o marco de fim da lista.
 */
export function DataTableInfinite<TData>({
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
  endLabel,
  prefetchMargin = '300px',
  data,
  isLoading,
  ...rest
}: DataTableInfiniteProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Só busca quando o scroller está de fato perto do fim. A checagem de geometria
  // no momento do disparo blinda contra a rajada de mount (quando o flex ainda não
  // fixou a altura e a sentinela aparece em tela por um instante).
  const sentinelRef = useIntersection<HTMLDivElement>(
    () => {
      const el = scrollRef.current
      if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 400) onReachEnd?.()
    },
    {
      enabled: !!hasNextPage && !isFetchingNextPage && !isLoading,
      root: scrollRef,
      rootMargin: prefetchMargin,
    }
  )

  const hasRows = data.length > 0

  const bottomSlot = (
    <>
      {hasNextPage && !isLoading && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}

      {!hasNextPage && hasRows && !isLoading && endLabel != null && (
        <div className="border-t px-4 py-4 text-center text-xs tabular-nums text-muted-foreground">
          {endLabel}
        </div>
      )}
    </>
  )

  return (
    <DataTable
      data={data}
      isLoading={isLoading}
      scrollRef={scrollRef}
      bottomSlot={bottomSlot}
      autoFillSkeleton
      loadingMoreRows={isFetchingNextPage ? LOADING_MORE_ROWS : 0}
      {...rest}
    />
  )
}
