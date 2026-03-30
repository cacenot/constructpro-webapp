import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { MembersTablePagination } from '@/hooks/use-members-table'

const MAX_VISIBLE_PAGES = 5

export function MembersPagination({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  setPage,
}: MembersTablePagination) {
  if (totalPages <= 1) return null

  const start = Math.max(
    1,
    Math.min(page - Math.floor(MAX_VISIBLE_PAGES / 2), totalPages - MAX_VISIBLE_PAGES + 1)
  )
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1)
  const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground tabular-nums">
        {total > 0 ? `${startItem}–${endItem} de ${total} membros` : 'Nenhum membro'}
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
          </PaginationItem>

          {start > 1 && (
            <>
              <PaginationItem>
                <Button variant="outline" size="sm" disabled={isLoading} onClick={() => setPage(1)}>
                  1
                </Button>
              </PaginationItem>
              {start > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {visiblePages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <Button
                variant={pageNumber === page ? 'default' : 'outline'}
                size="sm"
                disabled={isLoading}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            </PaginationItem>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || isLoading}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Próxima
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
