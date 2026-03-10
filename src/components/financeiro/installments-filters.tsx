import {
  getInstallmentKindOptions,
  getInstallmentStatusOptions,
  InstallmentKind,
  InstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InstallmentsTableFilters } from '@/hooks/use-installments-table'

const statusOptions = getInstallmentStatusOptions('pt-BR')
const kindOptions = getInstallmentKindOptions('pt-BR')

export function InstallmentsFilters({
  statusFilter,
  kindFilter,
  dueDateRange,
  setStatusFilter,
  setKindFilter,
  setDueDateRange,
}: InstallmentsTableFilters) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangeFilter value={dueDateRange} onChange={setDueDateRange} placeholder="Vencimento" />

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.values(InstallmentStatus).map((value) => {
            const option = statusOptions.find((opt) => opt.value === value)
            return (
              <SelectItem key={value} value={value}>
                {option?.label || value}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <Select value={kindFilter} onValueChange={setKindFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {Object.values(InstallmentKind).map((value) => {
            const option = kindOptions.find((opt) => opt.value === value)
            return (
              <SelectItem key={value} value={value}>
                {option?.label || value}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
