import { getContractStatusOptions } from '@cacenot/construct-pro-api-client'
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
import type { ContractsTableFilters } from '@/hooks/use-contracts-table'

const statusOptions = getContractStatusOptions('pt-BR')

const indexTypeOptions = [
  { value: 'all', label: 'Todos os índices' },
  { value: 'CUB', label: 'CUB' },
  { value: 'IGPM', label: 'IGP-M' },
  { value: 'IPCA', label: 'IPCA' },
]

const periodOptions = [
  { value: 'all', label: 'Todo o período' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'year', label: 'Este ano' },
]

export function ContractsFilters({
  search,
  statusFilter,
  indexTypeFilter,
  periodFilter,
  onlyPendingContracts,
  onlyOverdueContracts,
  setSearch,
  setStatusFilter,
  setIndexTypeFilter,
  setPeriodFilter,
  setOnlyPendingContracts,
  setOnlyOverdueContracts,
}: ContractsTableFilters) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, venda..."
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
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={indexTypeFilter} onValueChange={setIndexTypeFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Índice" />
        </SelectTrigger>
        <SelectContent>
          {indexTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={periodFilter} onValueChange={setPeriodFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
        <Switch
          id="only-pending"
          checked={onlyPendingContracts}
          onCheckedChange={setOnlyPendingContracts}
        />
        <Label htmlFor="only-pending" className="text-sm cursor-pointer">
          Apenas contratos pendentes
        </Label>
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
        <Switch
          id="only-overdue"
          checked={onlyOverdueContracts}
          onCheckedChange={setOnlyOverdueContracts}
        />
        <Label htmlFor="only-overdue" className="text-sm cursor-pointer">
          Apenas inadimplentes
        </Label>
      </div>
    </div>
  )
}
