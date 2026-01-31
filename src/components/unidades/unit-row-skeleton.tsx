import { Skeleton } from '@/components/ui/skeleton'

export function UnitRowSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          {/* ID Badge */}
          <Skeleton className="h-5 w-12 shrink-0" />

          {/* Name + Project */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>

          {/* Category + Area */}
          <div className="hidden md:flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Price */}
          <div className="hidden lg:block">
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Status Badge */}
          <Skeleton className="h-6 w-20 shrink-0" />

          {/* Actions */}
          <Skeleton className="size-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}
