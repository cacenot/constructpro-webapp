import { Skeleton } from '@/components/ui/skeleton'

export function ContractRowSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          {/* ID Badge */}
          <Skeleton className="h-5 w-12 shrink-0" />

          {/* Cliente + Venda Info */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>

          {/* Valor Principal (hidden lg:block) */}
          <div className="hidden lg:block w-40 shrink-0">
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Índice de Correção (hidden lg:block) */}
          <div className="hidden lg:block w-20 shrink-0">
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Status */}
          <div className="w-32 shrink-0">
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Data de Assinatura (hidden xl:block) */}
          <div className="hidden xl:block w-32 shrink-0">
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Actions */}
          <Skeleton className="size-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}
