import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import * as React from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import type { SelectedProject } from '@/components/ui/project-autocomplete'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import { useTenantConfig } from '@/hooks/use-tenant-config'
import { computeContractEndDate } from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import { type SaleFormData, saleFormSchema } from '@/schemas/sale.schema'
import { SaleFormStep1 } from './sale-form-step1'
import { SaleFormStep2 } from './sale-form-step2'
import { SaleFormStep3 } from './sale-form-step3'
import { SaleFormSummary } from './sale-form-summary'

interface SaleFormProps {
  onSubmit: (data: SaleFormData) => Promise<void>
  onBack: () => void
  isSubmitting?: boolean
}

export function SaleForm({ onSubmit, onBack, isSubmitting = false }: SaleFormProps) {
  const { client } = useApiClient()
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const { data: tenantConfig } = useTenantConfig()
  const maxInstallmentsPerMonth =
    (tenantConfig as { max_installments_per_month?: number } | undefined)
      ?.max_installments_per_month ?? 2
  const [selectedUnit, setSelectedUnit] = React.useState<SelectedUnit | null>(null)
  const [selectedProject, setSelectedProject] = React.useState<SelectedProject | null>(null)

  const indexTypesQuery = useQuery({
    queryKey: ['index-types'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/index-types/', {
        params: { query: { page: 1, page_size: 100 } },
      })
      if (error) throw new Error('Falha ao carregar índices de correção')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })

  const brokersQuery = useQuery({
    queryKey: ['brokers-select'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/brokers', {
        params: { query: { page: 1, page_size: 100 } },
      })
      if (error) throw new Error('Falha ao carregar corretores')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const agenciesQuery = useQuery({
    queryKey: ['agencies-select'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/agencies', {
        params: { query: { page: 1, page_size: 100 } },
      })
      if (error) throw new Error('Falha ao carregar imobiliárias')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const brokers = brokersQuery.data?.items ?? []
  const agencies = agenciesQuery.data?.items ?? []
  const indexTypes = indexTypesQuery.data?.items ?? []

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      unit_id: undefined,
      customer_id: undefined,
      same_index_for_all: true,
      index_type_code: '',
      installment_schedules: [
        {
          kind: 'entry',
          payment_method: 'pix',
          quantity: 1,
          amount: 0,
          specific_date: null,
          recurrence_type: null,
          recurrence_day: null,
          recurrence_month: null,
          start_date: null,
          asset_proposal: null,
        },
      ],
      broker_id: null,
      commission_broker_rate: null,
      agency_id: null,
      commission_agency_rate: null,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'installment_schedules',
  })

  const watchedSchedules = useWatch({
    control: form.control,
    name: 'installment_schedules',
  })

  const sameIndexForAll =
    useWatch({
      control: form.control,
      name: 'same_index_for_all',
    }) ?? true

  const handleToggleChange = React.useCallback(
    (value: boolean) => {
      form.setValue('same_index_for_all', value)
      const schedules = form.getValues('installment_schedules')
      if (!value) {
        // ON → OFF: pré-preencher índice global nos grupos existentes
        const globalIndex = form.getValues('index_type_code')
        if (globalIndex) {
          schedules.forEach((_, i) => {
            form.setValue(`installment_schedules.${i}.index_type_code`, globalIndex)
          })
        }
      } else {
        // OFF → ON: usar índice do primeiro grupo não-entry como global
        const firstNonEntry = schedules.find((s) => s.kind !== 'entry')
        form.setValue('index_type_code', firstNonEntry?.index_type_code ?? '')
      }
    },
    [form]
  )

  const watchedBrokerId = useWatch({
    control: form.control,
    name: 'broker_id',
  })

  const watchedAgencyId = useWatch({
    control: form.control,
    name: 'agency_id',
  })

  const totalFinanced = React.useMemo(() => {
    if (!watchedSchedules) return 0
    return watchedSchedules.reduce((sum, s) => {
      return sum + (s.quantity ?? 0) * (s.amount ?? 0)
    }, 0)
  }, [watchedSchedules])

  const contractEnd = React.useMemo(() => {
    if (!watchedSchedules) return { endDate: null, totalMonths: 0 }
    return computeContractEndDate(watchedSchedules)
  }, [watchedSchedules])

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

  const summaryProps = {
    selectedUnit,
    watchedSchedules,
    totalFinanced,
    contractEnd,
    currentStep: step,
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voltar</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Nova Proposta</h2>
            <p className="mt-1 text-muted-foreground">
              Preencha os dados para cadastrar uma nova proposta de venda
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center">
          {/* Step 1 */}
          <li className="flex items-center" aria-current={step === 1 ? 'step' : undefined}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {step > 1 ? <Check className="size-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm">Dados da Venda</span>
          </li>

          <li className="mx-4 h-px flex-1 bg-border" aria-hidden="true" />

          {/* Step 2 */}
          <li className="flex items-center" aria-current={step === 2 ? 'step' : undefined}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                step > 2
                  ? 'bg-primary text-primary-foreground'
                  : step === 2
                    ? 'bg-primary text-primary-foreground'
                    : 'border-2 border-muted-foreground text-muted-foreground'
              )}
            >
              {step > 2 ? <Check className="size-4" /> : '2'}
            </div>
            <span className={cn('ml-2 text-sm', step < 2 && 'text-muted-foreground')}>
              Comissão
            </span>
          </li>

          <li className="mx-4 h-px flex-1 bg-border" aria-hidden="true" />

          {/* Step 3 */}
          <li className="flex items-center" aria-current={step === 3 ? 'step' : undefined}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                step === 3
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground text-muted-foreground'
              )}
            >
              3
            </div>
            <span className={cn('ml-2 text-sm', step < 3 && 'text-muted-foreground')}>
              Pagamento
            </span>
          </li>
        </ol>

        {/* Steps — grid com sidebar em todos os steps */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            {step === 1 && (
              <SaleFormStep1
                form={form}
                selectedProject={selectedProject}
                onProjectChange={handleProjectChange}
                selectedUnit={selectedUnit}
                onUnitChange={handleUnitChange}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <SaleFormStep2
                form={form}
                selectedUnit={selectedUnit}
                selectedProject={selectedProject}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                onBackToStep1={() => setStep(1)}
                brokers={brokers}
                brokersLoading={brokersQuery.isLoading}
                brokersError={brokersQuery.isError}
                agencies={agencies}
                agenciesLoading={agenciesQuery.isLoading}
                agenciesError={agenciesQuery.isError}
                watchedBrokerId={watchedBrokerId}
                watchedAgencyId={watchedAgencyId}
              />
            )}

            {step === 3 && (
              <SaleFormStep3
                form={form}
                selectedUnit={selectedUnit}
                selectedProject={selectedProject}
                onBack={() => setStep(2)}
                onBackToStep1={() => setStep(1)}
                isSubmitting={isSubmitting}
                indexTypes={indexTypes}
                indexTypesLoading={indexTypesQuery.isLoading}
                watchedSchedules={watchedSchedules}
                fields={fields}
                append={append}
                remove={remove}
                maxInstallmentsPerMonth={maxInstallmentsPerMonth}
                sameIndexForAll={sameIndexForAll}
                onToggleChange={handleToggleChange}
              />
            )}
          </div>

          {/* Resumo Financeiro (sticky sidebar) */}
          <div className="lg:sticky lg:top-24">
            <SaleFormSummary {...summaryProps} />
          </div>
        </div>
      </form>
    </Form>
  )
}
