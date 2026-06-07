import {
  getInstallmentKindOptions,
  getInstallmentStatusOptions,
  InstallmentKind,
  InstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { X } from 'lucide-react'
import { ProjectFilter } from '@/components/filters/project-filter'
import { Button } from '@/components/ui/button'
import { CustomerFilter } from '@/components/ui/customer-filter'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { MultiSelectFilter, type MultiSelectOption } from '@/components/ui/multi-select-filter'
import type { InstallmentsTableFilters } from '@/hooks/use-installments-table'
import { PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'

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

const methodSelectOptions: MultiSelectOption[] = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
)

interface InstallmentsFiltersProps extends InstallmentsTableFilters {
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function InstallmentsFilters({
  statusFilter,
  kindFilter,
  paymentMethodFilter,
  dueDateRange,
  paidAtRange,
  customerFilter,
  projectFilter,
  setStatusFilter,
  setKindFilter,
  setPaymentMethodFilter,
  setDueDateRange,
  setPaidAtRange,
  setCustomerFilter,
  setProjectFilter,
  hasActiveFilters,
  onClearFilters,
}: InstallmentsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ProjectFilter value={projectFilter} onChange={setProjectFilter} />

      <CustomerFilter value={customerFilter} onChange={setCustomerFilter} />

      <MultiSelectFilter
        options={statusSelectOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Status"
        className="w-44"
      />

      <MultiSelectFilter
        options={kindSelectOptions}
        value={kindFilter}
        onChange={setKindFilter}
        placeholder="Tipo"
        className="w-40"
      />

      <MultiSelectFilter
        options={methodSelectOptions}
        value={paymentMethodFilter}
        onChange={setPaymentMethodFilter}
        placeholder="Forma de pagamento"
        className="w-52"
      />

      <DateRangeFilter value={dueDateRange} onChange={setDueDateRange} placeholder="Vencimento" />

      <DateRangeFilter value={paidAtRange} onChange={setPaidAtRange} placeholder="Recebido em" />

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 gap-1.5 text-muted-foreground"
        >
          <X className="size-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
