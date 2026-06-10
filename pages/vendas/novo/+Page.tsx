import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import type { SelectedCustomer } from '@/components/ui/customer-autocomplete'
import type { SelectedProject } from '@/components/ui/project-autocomplete'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import { createEntrySchedule } from '@/components/vendas/proposal/constants'
import { ProposalPartiesCreate } from '@/components/vendas/proposal/proposal-parties'
import { ProposalWorkbench } from '@/components/vendas/proposal/proposal-workbench'
import { useProposalData } from '@/hooks/use-proposal-data'
import { handleApiError, throwApiError } from '@/lib/api-error'
import { deriveRecurrenceFields } from '@/lib/installment-utils'
import { rateToWireString } from '@/lib/utils'
import { type SaleFormData, saleFormSchema } from '@/schemas/sale.schema'

export default function SaleNewPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const data = useProposalData()

  const [selectedProject, setSelectedProject] = React.useState<SelectedProject | null>(null)
  const [selectedUnit, setSelectedUnit] = React.useState<SelectedUnit | null>(null)
  const [selectedCustomer, setSelectedCustomer] = React.useState<SelectedCustomer | null>(null)

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      unit_id: undefined,
      customer_id: undefined,
      same_index_for_all: true,
      index_type_code: '',
      installment_schedules: [createEntrySchedule()],
      broker_id: null,
      commission_broker_rate: null,
      agency_id: null,
      commission_agency_rate: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (formData: SaleFormData) => {
      const firstNonEntryIndex = formData.same_index_for_all
        ? undefined
        : (formData.installment_schedules.find((s) => s.kind !== 'entry')?.index_type_code ??
          undefined)

      const { data: result, error } = await client.POST('/api/v1/sales', {
        body: {
          unit_id: formData.unit_id,
          customer_id: formData.customer_id,
          // Toggle ON: usa global. Toggle OFF: POST requer field — deriva do 1º grupo não-entry
          index_type_code: formData.same_index_for_all
            ? (formData.index_type_code ?? '')
            : (firstNonEntryIndex ?? ''),
          installment_schedules: formData.installment_schedules.map((schedule) => {
            const derived =
              schedule.recurrence_type && schedule.start_date
                ? deriveRecurrenceFields(schedule.start_date, schedule.recurrence_type)
                : {
                    recurrence_day: schedule.recurrence_day ?? undefined,
                    recurrence_month: schedule.recurrence_month ?? undefined,
                  }
            return {
              kind: schedule.kind,
              payment_method: schedule.payment_method,
              quantity: schedule.quantity,
              amount: schedule.amount,
              specific_date: schedule.specific_date ?? undefined,
              recurrence_type: schedule.recurrence_type ?? undefined,
              recurrence_day: derived.recurrence_day ?? undefined,
              recurrence_month: derived.recurrence_month ?? undefined,
              start_date: schedule.start_date ?? undefined,
              ...(!formData.same_index_for_all &&
              schedule.kind !== 'entry' &&
              schedule.index_type_code
                ? { index_type_code: schedule.index_type_code }
                : {}),
              ...(schedule.payment_method === 'asset' && schedule.asset_proposal
                ? {
                    asset_proposal: schedule.asset_proposal as {
                      type: string
                      asset_metadata: Record<string, unknown>
                    },
                  }
                : {}),
            }
          }),
          broker_id: formData.broker_id ?? undefined,
          commission_broker_rate: formData.commission_broker_rate
            ? rateToWireString(formData.commission_broker_rate)
            : undefined,
          agency_id: formData.agency_id ?? undefined,
          commission_agency_rate: formData.commission_agency_rate
            ? rateToWireString(formData.commission_agency_rate)
            : undefined,
        },
      })

      if (error) throwApiError(error, 'Erro ao criar proposta')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const handleSubmit = async (formData: SaleFormData) => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success('Proposta criada.')
      navigate('/vendas')
    } catch (error) {
      handleApiError(error, 'Erro ao criar proposta')
    }
  }

  const handleUnitChange = React.useCallback(
    (unit: SelectedUnit | null) => {
      setSelectedUnit(unit)
      form.setValue('unit_id', unit?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

  const handleProjectChange = React.useCallback(
    (project: SelectedProject | null) => {
      if (project?.id !== selectedProject?.id) {
        form.setValue('unit_id', undefined as unknown as number)
        setSelectedUnit(null)
      }
      setSelectedProject(project)
    },
    [form, selectedProject]
  )

  const handleCustomerChange = React.useCallback(
    (customer: SelectedCustomer | null) => {
      setSelectedCustomer(customer)
      form.setValue('customer_id', customer?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

  const partiesSummary =
    selectedUnit && selectedCustomer
      ? `${selectedUnit.name} · ${selectedCustomer.full_name}`
      : 'Empreendimento, unidade e cliente'

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <ProposalWorkbench
          form={form}
          mode="create"
          eyebrow="Vendas"
          title="Nova proposta"
          unitPriceCents={selectedUnit?.price_cents ?? 0}
          submitLabel="Salvar proposta"
          isSubmitting={createMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/vendas')}
          partiesSummary={partiesSummary}
          parties={
            <ProposalPartiesCreate
              form={form}
              selectedProject={selectedProject}
              onProjectChange={handleProjectChange}
              onUnitChange={handleUnitChange}
              onCustomerChange={handleCustomerChange}
            />
          }
          {...data}
        />
      </div>
    </AppLayout>
  )
}
