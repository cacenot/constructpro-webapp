import { CustomerType, getCustomerTypeOptions } from '@cacenot/construct-pro-api-client'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CustomersTableFilters } from '@/hooks/use-customers-table'

const typeOptions = getCustomerTypeOptions('pt-BR')

export function CustomersFilters({
  search,
  typeFilter,
  setSearch,
  setTypeFilter,
}: CustomersTableFilters) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Tipo de pessoa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {Object.values(CustomerType).map((value) => {
            const option = typeOptions.find((opt) => opt.value === value)
            return (
              <SelectItem key={value} value={value}>
                {option?.label ?? value}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
