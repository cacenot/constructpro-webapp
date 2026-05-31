import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Check, Equal } from 'lucide-react'
import * as React from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { Form } from '@/components/ui/form'
import type { SelectedProject } from '@/components/ui/project-autocomplete'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import { computeContractEndDate, formatBRDate } from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import { INSTALLMENT_KIND_LABELS, type SaleFormData, saleFormSchema } from '@/schemas/sale.schema'
import { SaleFormStep1 } from './sale-form-step1'
import { SaleFormStep2 } from './sale-form-step2'

interface SaleFormProps {
  onSubmit: (data: SaleFormData) => Promise<void>
  onBack: () => void
  isSubmitting?: boolean
}

export function SaleForm({ onSubmit, onBack, isSubmitting = false }: SaleFormProps) {
  const { client } = useApiClient()
  const [step, setStep] = React.useState<1 | 2>(1)
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

  const handleSubmit = async (data: SaleFormData) => {
    await onSubmit(data)
  }

  const unitPriceCents = selectedUnit?.price_cents ?? 0
  const diff = totalFinanced - unitPriceCents
  const diffPercent = unitPriceCents > 0 ? (diff / unitPriceCents) * 100 : 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          <li className="flex items-center" aria-current={step === 1 ? 'step' : undefined}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                'bg-primary text-primary-foreground'
              )}
            >
              {step > 1 ? <Check className="size-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm">
              <span className="hidden sm:inline">Empreendimento e </span>Unidade
            </span>
          </li>
          <li className="mx-4 h-px flex-1 bg-border" aria-hidden="true" />
          <li className="flex items-center" aria-current={step === 2 ? 'step' : undefined}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                step === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground text-muted-foreground'
              )}
            >
              2
            </div>
            <span className={cn('ml-2 text-sm', step < 2 && 'text-muted-foreground')}>
              Financeiro
            </span>
          </li>
        </ol>

        {/* Steps */}
        {step === 1 ? (
          <SaleFormStep1
            form={form}
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
            selectedUnit={selectedUnit}
            onUnitChange={handleUnitChange}
            onNext={() => setStep(2)}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
            <SaleFormStep2
              form={form}
              selectedUnit={selectedUnit}
              selectedProject={selectedProject}
              onBack={() => setStep(1)}
              isSubmitting={isSubmitting}
              brokers={brokers}
              brokersLoading={brokersQuery.isLoading}
              brokersError={brokersQuery.isError}
              agencies={agencies}
              agenciesLoading={agenciesQuery.isLoading}
              agenciesError={agenciesQuery.isError}
              indexTypes={indexTypes}
              watchedBrokerId={watchedBrokerId}
              watchedAgencyId={watchedAgencyId}
              watchedSchedules={watchedSchedules}
              fields={fields}
              append={append}
              remove={remove}
            />

            {/* Resumo Financeiro (sticky sidebar) */}
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Financiado</p>
                      <p className="text-2xl font-bold tabular-nums">
                        R$ {formatCentsToDisplay(totalFinanced) || '0,00'}
                      </p>
                    </div>

                    {selectedUnit && (
                      <div>
                        <p className="text-sm text-muted-foreground">Preço da Unidade</p>
                        <p className="text-2xl font-bold tabular-nums">
                          R$ {formatCentsToDisplay(unitPriceCents) || '0,00'}
                        </p>
                      </div>
                    )}

                    {selectedUnit && totalFinanced > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Diferença</p>
                        <div className="flex items-center gap-2">
                          {diff === 0 ? (
                            <>
                              <Equal className="size-5 text-success" />
                              <span className="text-sm font-medium text-success">
                                Igual ao preço
                              </span>
                            </>
                          ) : diff > 0 ? (
                            <>
                              <ArrowUp className="size-5 text-success" />
                              <div>
                                <p className="text-lg font-bold tabular-nums text-success">
                                  + R$ {formatCentsToDisplay(diff)}
                                </p>
                                <p className="text-xs tabular-nums text-muted-foreground">
                                  {diffPercent.toFixed(1)}% acima
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="size-5 text-warning" />
                              <div>
                                <p className="text-lg font-bold tabular-nums text-warning">
                                  - R$ {formatCentsToDisplay(Math.abs(diff))}
                                </p>
                                <p className="text-xs tabular-nums text-muted-foreground">
                                  {Math.abs(diffPercent).toFixed(1)}% abaixo
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {contractEnd.endDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Previsão de Término</p>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="size-5 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-bold tabular-nums">
                              {formatBRDate(contractEnd.endDate)}
                            </p>
                            {contractEnd.totalMonths > 0 && (
                              <p className="text-xs tabular-nums text-muted-foreground">
                                {contractEnd.totalMonths} meses
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {watchedSchedules && watchedSchedules.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Detalhamento</p>
                        <div className="space-y-1">
                          {watchedSchedules.map((schedule, index) => {
                            const subtotal = (schedule.quantity ?? 0) * (schedule.amount ?? 0)
                            if (subtotal === 0) return null
                            return (
                              <div
                                key={fields[index]?.id ?? index}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {INSTALLMENT_KIND_LABELS[schedule.kind] ?? schedule.kind}
                                  {schedule.quantity > 1 && (
                                    <span className="ml-1 tabular-nums">
                                      ({schedule.quantity}x R${' '}
                                      {formatCentsToDisplay(schedule.amount)})
                                    </span>
                                  )}
                                </span>
                                <span className={cn('font-medium tabular-nums')}>
                                  R$ {formatCentsToDisplay(subtotal)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}
