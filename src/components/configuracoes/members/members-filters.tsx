import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MembersTableFilters } from '@/hooks/use-members-table'

interface MembersFiltersProps extends MembersTableFilters {
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function MembersFilters({
  search,
  setSearch,
  hasActiveFilters,
  onClearFilters,
}: MembersFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {hasActiveFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClearFilters}>
              <X className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Limpar filtros</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
