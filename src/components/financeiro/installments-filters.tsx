import {
  getInstallmentKindOptions,
  getInstallmentStatusOptions,
  InstallmentKind,
  InstallmentStatus,
} from '@cacenot/construct-pro-api-client'
import { TriangleAlert, X } from 'lucide-react'
import { ProjectFilter } from '@/components/filters/project-filter'
import { Button } from '@/components/ui/button'
import { CustomerFilter } from '@/components/ui/customer-filter'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { MultiSelectFilter, type MultiSelectOption } from '@/components/ui/multi-select-filter'
import type { InstallmentsTableFilters } from '@/hooks/use-installments-table'
import { cn } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'

const statusOptions = getInstallmentStatusOptions('pt-BR')
const kindOptions = getInstallmentKindOptions('pt-BR')

const statusSelectOptions: MultiSelectOption[] = Object.values(InstallmentStatus).map((value) => {
  const option = statusOptions.find((opt) => opt.value === value)
  return { value, label: option?.label ?? value }
})

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
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-2 [&>*]:shrink-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
      <ProjectFilter value={projectFilter} onChange={setProjectFilter} />
      <CustomerFilter value={customerFilter} onChange={setCustomerFilter} />

      <MultiSelectFilter
        options={statusSelectOptions}
        value={statusFilter}
        onChange={setStatusFilter}
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

      <Button
        type="button"
        variant="outline"
        aria-pressed={overdueOnly}
        onClick={() => setOverdueOnly(!overdueOnly)}
        className={cn(
          'gap-2 font-normal',
          overdueOnly &&
            'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
        )}
      >
        <TriangleAlert className="size-4" />
        Em atraso
      </Button>

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
