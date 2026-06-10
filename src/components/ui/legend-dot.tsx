import { cn } from '@/lib/utils'

/** Item de legenda: dot colorido + rótulo. Cor via classe `bg-*` no dot. */
export function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} />
      {label}
    </span>
  )
}
