import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query'

/** Uma página de uma lista paginada por offset (page/page_size) do backend. */
export interface TablePage<TItem, TResponse = unknown> {
  items: TItem[]
  total: number
  /** Resposta crua da página (ex.: bloco `summary` agregado, igual em toda página). */
  response?: TResponse
}

interface UseInfiniteTableOptions<TItem, TResponse> {
  queryKey: QueryKey
  /** Busca a página `page` (1-based). Deve devolver itens + total da carteira. */
  fetchPage: (page: number) => Promise<TablePage<TItem, TResponse>>
  pageSize: number
  enabled?: boolean
}

/**
 * Converte a paginação por offset do backend (page/page_size) em scroll infinito,
 * padronizando a forma para toda tabela do projeto: acumula os itens, calcula
 * `hasNextPage` por total e expõe o `response` da 1ª página (onde mora o `summary`,
 * idêntico em todas as páginas sob os mesmos filtros). Casa com `DataTableInfinite`.
 */
export function useInfiniteTable<TItem, TResponse = unknown>({
  queryKey,
  fetchPage,
  pageSize,
  enabled = true,
}: UseInfiniteTableOptions<TItem, TResponse>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0)
      const more = loaded < lastPage.total && lastPage.items.length >= pageSize
      return more ? allPages.length + 1 : undefined
    },
    enabled,
  })

  const rows = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const firstResponse = query.data?.pages[0]?.response

  return {
    rows,
    total,
    firstResponse,
    /** Carregamento inicial (primeira página). */
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
    isError: query.isError,
  }
}
