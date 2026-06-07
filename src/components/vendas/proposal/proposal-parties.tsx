import type { UseFormReturn } from 'react-hook-form'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { CustomerAutocomplete, type SelectedCustomer } from '@/components/ui/customer-autocomplete'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { ProjectAutocomplete, type SelectedProject } from '@/components/ui/project-autocomplete'
import { type SelectedUnit, UnitAutocomplete } from '@/components/ui/unit-autocomplete'
import type { SaleFormData } from '@/schemas/sale.schema'
import { CONSOLE_LABEL } from './section'

interface ProposalPartiesCreateProps {
  form: UseFormReturn<SaleFormData>
  selectedProject: SelectedProject | null
  onProjectChange: (project: SelectedProject | null) => void
  onUnitChange: (unit: SelectedUnit | null) => void
  onCustomerChange: (customer: SelectedCustomer | null) => void
}

/** Variante de criação: empreendimento → unidade → cliente, via autocomplete. */
export function ProposalPartiesCreate({
  form,
  selectedProject,
  onProjectChange,
  onUnitChange,
  onCustomerChange,
}: ProposalPartiesCreateProps) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-12">
      <div className="flex flex-col gap-1.5 sm:col-span-6">
        <Label>Empreendimento *</Label>
        <ProjectAutocomplete value={selectedProject?.id ?? null} onChange={onProjectChange} />
      </div>

      <FormField
        control={form.control}
        name="unit_id"
        render={({ field }) => (
          <FormItem className="sm:col-span-6">
            <FormLabel>Unidade *</FormLabel>
            <FormControl>
              <UnitAutocomplete
                value={field.value}
                onChange={onUnitChange}
                projectId={selectedProject?.id}
                disabled={!selectedProject}
                placeholder={
                  selectedProject
                    ? 'Selecione uma unidade…'
                    : 'Selecione um empreendimento primeiro'
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customer_id"
        render={({ field }) => (
          <FormItem className="sm:col-span-6">
            <FormLabel>Cliente *</FormLabel>
            <FormControl>
              <CustomerAutocomplete value={field.value} onChange={onCustomerChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

interface ProposalPartiesReadonlyProps {
  unitName: string
  projectName?: string | null
  customerName: string
  unitPriceCents: number
}

/** Variante de edição: partes da venda são imutáveis após criação — só leitura. */
export function ProposalPartiesReadonly({
  unitName,
  projectName,
  customerName,
  unitPriceCents,
}: ProposalPartiesReadonlyProps) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-3">
      <Field
        label="Unidade"
        value={unitName}
        sub={projectName ?? undefined}
        className="col-span-2 lg:col-span-1"
      />
      <Field label="Cliente" value={customerName} />
      <Field
        label="Preço de tabela"
        value={`R$ ${formatCentsToDisplay(unitPriceCents) || '0,00'}`}
        numeric
      />
    </dl>
  )
}

function Field({
  label,
  value,
  sub,
  numeric,
  className,
}: {
  label: string
  value: string
  sub?: string
  numeric?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 bg-card p-4 ${className ?? ''}`}>
      <dt className={CONSOLE_LABEL}>{label}</dt>
      <dd className={`truncate text-sm font-medium ${numeric ? 'tabular-nums' : ''}`}>
        {value || '—'}
      </dd>
      {sub != null && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
