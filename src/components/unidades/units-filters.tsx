import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProjectFilter } from '@/components/ui/project-filter'
import type { UnitsTableFilters } from '@/hooks/use-units-table'

interface UnitsFiltersProps {
  filters: UnitsTableFilters
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function UnitsFilters({ filters, hasActiveFilters, onClearFilters }: UnitsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-48 max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="pl-9"
          maxLength={120}
        />
      </div>
      <ProjectFilter
        value={filters.projectFilter || null}
        onChange={(id) => filters.setProjectFilter(id ?? 0)}
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
