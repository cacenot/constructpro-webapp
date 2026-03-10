import { getSaleStatusOptions, SaleStatus } from '@cacenot/construct-pro-api-client'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SalesTableFilters } from '@/hooks/use-sales-table'

const statusOptions = getSaleStatusOptions('pt-BR')

export function SalesFilters({
  search,
  statusFilter,
  periodFilter,
  onlyMySales,
  setSearch,
  setStatusFilter,
  setPeriodFilter,
  setOnlyMySales,
}: SalesTableFilters) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, unidade, empreendimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.values(SaleStatus).map((value) => {
            const option = statusOptions.find((opt) => opt.value === value)
            return (
              <SelectItem key={value} value={value}>
                {option?.label || value}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <Select value={periodFilter} onValueChange={setPeriodFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo o período</SelectItem>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
          <SelectItem value="year">Este ano</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
        <Switch id="my-sales" checked={onlyMySales} onCheckedChange={setOnlyMySales} />
        <Label htmlFor="my-sales" className="text-sm cursor-pointer">
          Apenas minhas vendas
        </Label>
      </div>
    </div>
  )
}
