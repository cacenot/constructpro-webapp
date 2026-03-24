import {
  getInstallmentKindOptions,
  getInstallmentStatusOptions,
  InstallmentKind,
  InstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { CustomerFilter } from '@/components/ui/customer-filter'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { MultiSelectFilter, type MultiSelectOption } from '@/components/ui/multi-select-filter'
import type { InstallmentsTableFilters } from '@/hooks/use-installments-table'

const statusOptions = getInstallmentStatusOptions('pt-BR')
const kindOptions = getInstallmentKindOptions('pt-BR')

const statusLabelOverrides: Partial<Record<string, string>> = {
  overdue: 'Em atraso',
}

const statusSelectOptions: MultiSelectOption[] = Object.values(InstallmentStatus).map((value) => {
  const option = statusOptions.find((opt) => opt.value === value)
  return {
    value,
    label: statusLabelOverrides[value] ?? option?.label ?? value,
  }
})

const kindSelectOptions: MultiSelectOption[] = Object.values(InstallmentKind).map((value) => {
  const option = kindOptions.find((opt) => opt.value === value)
  return {
    value,
    label: option?.label || value,
  }
})

export function InstallmentsFilters({
  statusFilter,
  kindFilter,
  dueDateRange,
  customerFilter,
  setStatusFilter,
  setKindFilter,
  setDueDateRange,
  setCustomerFilter,
}: InstallmentsTableFilters) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangeFilter value={dueDateRange} onChange={setDueDateRange} placeholder="Vencimento" />

      <MultiSelectFilter
        options={statusSelectOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Status"
        className="w-48"
      />

      <MultiSelectFilter
        options={kindSelectOptions}
        value={kindFilter}
        onChange={setKindFilter}
        placeholder="Tipo"
        className="w-40"
      />

      {/* TODO: Wire customer_id to installments API when backend adds support */}
      <CustomerFilter value={customerFilter} onChange={setCustomerFilter} disabled />
    </div>
  )
}
