import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string
  field: string
  currentSort?: string
  onSort: (field: string) => void
}) {
  const parts = currentSort?.split(':') ?? ['', 'asc']
  const [currentField, currentDir] = parts
  const isActive = currentField === field

  const handleClick = () => {
    if (isActive && currentDir === 'asc') {
      onSort(`${field}:desc`)
    } else {
      onSort(`${field}:asc`)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      onClick={handleClick}
    >
      {label}
      {isActive ? (
        currentDir === 'asc' ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </Button>
  )
}
