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

// "Em atraso" não é status do backend (é condição derivada, filtro `overdue`),
// mas para o usuário é um recorte de status como outro qualquer: entra como
// pseudo-opção no mesmo select e é separado de volta no onChange.
const OVERDUE_OPTION = 'overdue'

const statusSelectOptions: MultiSelectOption[] = [
  { value: OVERDUE_OPTION, label: 'Em atraso' },
  ...Object.values(InstallmentStatus).map((value) => {
    const option = statusOptions.find((opt) => opt.value === value)
    return { value: value as string, label: option?.label ?? value }
  }),
]

const kindSelectOptions: MultiSelectOption[] = Object.values(InstallmentKind).map((value) => {
  const option = kindOptions.find((opt) => opt.value === value)
  return { value, label: option?.label || value }
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
  overdueOnly,
  dueDateRange,
  paidAtRange,
  customerFilter,
  projectFilter,
  setStatusFilter,
  setKindFilter,
  setPaymentMethodFilter,
  setOverdueOnly,
  setDueDateRange,
  setPaidAtRange,
  setCustomerFilter,
  setProjectFilter,
  hasActiveFilters,
  onClearFilters,
}: InstallmentsFiltersProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 sm:flex-wrap sm:overflow-visible">
      <ProjectFilter value={projectFilter} onChange={setProjectFilter} />
      <CustomerFilter value={customerFilter} onChange={setCustomerFilter} />

      <MultiSelectFilter
        options={statusSelectOptions}
        value={overdueOnly ? [OVERDUE_OPTION, ...statusFilter] : statusFilter}
        onChange={(next) => {
          const wantsOverdue = next.includes(OVERDUE_OPTION)
          if (wantsOverdue !== overdueOnly) setOverdueOnly(wantsOverdue)
          const statuses = next.filter((v) => v !== OVERDUE_OPTION)
          if (statuses.join(',') !== statusFilter.join(',')) setStatusFilter(statuses)
        }}
        placeholder="Status"
      />
      <MultiSelectFilter
        options={kindSelectOptions}
        value={kindFilter}
        onChange={setKindFilter}
        placeholder="Tipo"
      />
      <MultiSelectFilter
        options={methodSelectOptions}
        value={paymentMethodFilter}
        onChange={setPaymentMethodFilter}
        placeholder="Forma"
      />

      <span className="hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden />

      <DateRangeFilter value={dueDateRange} onChange={setDueDateRange} placeholder="Vencimento" />
      <DateRangeFilter value={paidAtRange} onChange={setPaidAtRange} placeholder="Recebido em" />

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          onClick={onClearFilters}
          className="ml-auto gap-1.5 text-muted-foreground"
        >
          <X className="size-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
