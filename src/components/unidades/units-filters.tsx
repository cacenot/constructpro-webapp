import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProjectOption, UnitsTableFilters } from '@/hooks/use-units-table'

interface UnitsFiltersProps {
  filters: UnitsTableFilters
  projects: ProjectOption[]
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function UnitsFilters({
  filters,
  projects,
  hasActiveFilters,
  onClearFilters,
}: UnitsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.projectFilter === 0 ? 'all' : String(filters.projectFilter)}
        onValueChange={(value) => filters.setProjectFilter(value === 'all' ? 0 : Number(value))}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Empreendimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os empreendimentos</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
