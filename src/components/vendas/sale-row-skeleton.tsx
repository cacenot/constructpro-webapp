import { Skeleton } from '@/components/ui/skeleton'

export function SaleRowSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          {/* ID Badge */}
          <Skeleton className="h-5 w-12 shrink-0" />

          {/* Venda Info */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>

          {/* Cliente (hidden md:flex) */}
          <div className="hidden md:flex items-center gap-2 w-48 shrink-0">
            <Skeleton className="size-6 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Vendedor (hidden lg:flex) */}
          <div className="hidden lg:flex items-center gap-2 w-40 shrink-0">
            <Skeleton className="size-5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Valores (hidden xl:flex) */}
          <div className="hidden xl:flex flex-col gap-1 w-44 shrink-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>

          {/* Status */}
          <div className="w-32 shrink-0">
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Tempo (hidden md:block) */}
          <div className="hidden md:block w-32 shrink-0">
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Actions */}
          <Skeleton className="size-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}
