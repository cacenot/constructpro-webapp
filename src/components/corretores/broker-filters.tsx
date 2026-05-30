import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { BrokersTableFilters } from '@/hooks/use-brokers-table'

interface BrokerFiltersProps extends BrokersTableFilters {
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function BrokerFilters({
  search,
  setSearch,
  hasActiveFilters,
  onClearFilters,
}: BrokerFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou CRECI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
