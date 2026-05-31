import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  Equal,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import * as React from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, formatCentsToDisplay } from '@/components/ui/currency-input'
import { CustomerAutocomplete, type SelectedCustomer } from '@/components/ui/customer-autocomplete'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type SelectedUnit, UnitAutocomplete } from '@/components/ui/unit-autocomplete'
import {
  computeAllowedDates,
  computeContractEndDate,
  computeDefaultStartDate,
  formatBRDate,
} from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import {
  INSTALLMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  type SaleFormData,
  saleFormSchema,
} from '@/schemas/sale.schema'

interface SaleFormProps {
  onSubmit: (data: SaleFormData) => Promise<void>
  onBack: () => void
  isSubmitting?: boolean
}

export function SaleForm({ onSubmit, onBack, isSubmitting = false }: SaleFormProps) {
  const { client } = useApiClient()
  const [selectedUnit, setSelectedUnit] = React.useState<SelectedUnit | null>(null)

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

  const indexTypes = indexTypesQuery.data?.items ?? []

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

  const handleCustomerChange = React.useCallback(
    (customer: SelectedCustomer | null) => {
      form.setValue('customer_id', customer?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

  const quantityInputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const addMonthlySchedule = React.useCallback(() => {
    const recurrenceDay = 10
    const startDate = computeDefaultStartDate('monthly', recurrenceDay, null)
    append({
      kind: 'regular',
      payment_method: 'boleto',
      quantity: 1,
      amount: 0,
      specific_date: null,
      recurrence_type: 'monthly',
      recurrence_day: recurrenceDay,
      recurrence_month: null,
      start_date: startDate || null,
    })
  }, [append])

  const addYearlySchedule = React.useCallback(() => {
    const recurrenceDay = 15
    const recurrenceMonth = 12
    const startDate = computeDefaultStartDate('yearly', recurrenceDay, recurrenceMonth)
    append({
      kind: 'regular',
      payment_method: 'boleto',
      quantity: 1,
      amount: 0,
      specific_date: null,
      recurrence_type: 'yearly',
      recurrence_day: recurrenceDay,
      recurrence_month: recurrenceMonth,
      start_date: startDate || null,
    })
  }, [append])

  // Focus on quantity input when new installment is added
  React.useEffect(() => {
    const lastIndex = fields.length - 1
    if (lastIndex > 0) {
      // Defer focus to allow DOM to update
      setTimeout(() => {
        quantityInputRefs.current[lastIndex]?.focus()
      }, 0)
    }
  }, [fields.length])

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

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left column: Form cards */}
          <div className="space-y-6">
            {/* Card 1: Dados da Venda */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-6">
                        <FormLabel>Unidade *</FormLabel>
                        <FormControl>
                          <UnitAutocomplete value={field.value} onChange={handleUnitChange} />
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
                          <CustomerAutocomplete
                            value={field.value}
                            onChange={handleCustomerChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="index_type_code"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-4">
                        <FormLabel>Índice de Correção *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {indexTypes.map((indexType) => (
                              <SelectItem key={indexType.code} value={indexType.code}>
                                {indexType.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card Comissão */}
            <Card>
              <CardHeader>
                <CardTitle>Comissão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="broker_id"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-6">
                        <FormLabel>Corretor</FormLabel>
                        <Select
                          value={field.value?.toString() ?? ''}
                          onValueChange={(val) => {
                            const num = val ? Number(val) : null
                            field.onChange(num)
                            if (!num) {
                              form.setValue('agency_id', null)
                              form.setValue('commission_broker_rate', null)
                              form.setValue('commission_agency_rate', null)
                            }
                          }}
                          disabled={brokersQuery.isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  brokersQuery.isLoading
                                    ? 'Carregando...'
                                    : brokersQuery.isError
                                      ? 'Erro ao carregar corretores'
                                      : 'Selecione um corretor'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id.toString()}>
                                {broker.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedBrokerId && (
                    <FormField
                      control={form.control}
                      name="commission_broker_rate"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Taxa de Comissão do Corretor (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Ex: 1.5"
                              value={field.value ?? ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                field.onChange(e.target.value ? Number(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="agency_id"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-6">
                        <FormLabel>Imobiliária</FormLabel>
                        <Select
                          value={field.value?.toString() ?? ''}
                          onValueChange={(val) => {
                            const num = val ? Number(val) : null
                            field.onChange(num)
                            if (!num) {
                              form.setValue('commission_agency_rate', null)
                            }
                          }}
                          disabled={!watchedBrokerId || agenciesQuery.isLoading}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="w-full"
                              aria-disabled={!watchedBrokerId ? 'true' : undefined}
                            >
                              <SelectValue
                                placeholder={
                                  !watchedBrokerId
                                    ? 'Selecione um corretor primeiro'
                                    : agenciesQuery.isLoading
                                      ? 'Carregando...'
                                      : agenciesQuery.isError
                                        ? 'Erro ao carregar imobiliárias'
                                        : 'Selecione uma imobiliária'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id.toString()}>
                                {agency.trade_name ?? agency.legal_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedAgencyId && (
                    <FormField
                      control={form.control}
                      name="commission_agency_rate"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Taxa de Comissão da Imobiliária (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Ex: 3.0"
                              value={field.value ?? ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                field.onChange(e.target.value ? Number(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Pagamento (Entrada + Parcelas) */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Entrada section */}
                <div>
                  <p className="mb-3 text-sm font-medium">Entrada</p>
                  <div className="grid gap-4 sm:grid-cols-12">
                    <FormField
                      control={form.control}
                      name="installment_schedules.0.amount"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Valor da Entrada *</FormLabel>
                          <FormControl>
                            <CurrencyInput value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installment_schedules.0.specific_date"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Data de Pagamento *</FormLabel>
                          <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installment_schedules.0.payment_method"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Forma de Pagamento *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Parcelas section */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium">Parcelas</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMonthlySchedule}
                      >
                        <Plus className="mr-2 size-4" />
                        Mensais
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addYearlySchedule}>
                        <Plus className="mr-2 size-4" />
                        Anuais
                      </Button>
                    </div>
                  </div>

                  {fields.length <= 1 && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      Clique em "Mensais" ou "Anuais" para adicionar parcelas.
                    </p>
                  )}

                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      if (index === 0) return null
                      const schedule = watchedSchedules?.[index]
                      const recurrenceType = schedule?.recurrence_type as
                        | 'monthly'
                        | 'yearly'
                        | undefined
                      const recurrenceDay = schedule?.recurrence_day
                      const recurrenceMonth = schedule?.recurrence_month

                      const isDateDisabled =
                        recurrenceType === 'yearly'
                          ? !recurrenceDay || !recurrenceMonth
                          : !recurrenceDay

                      const allowedDates =
                        recurrenceType && !isDateDisabled
                          ? computeAllowedDates(recurrenceType, recurrenceDay, recurrenceMonth)
                          : []

                      const disabledDates = Array.from({ length: 10957 }, (_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() + i)
                        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        return allowedDates.includes(iso) ? '' : iso
                      }).filter(Boolean)

                      return (
                        <div
                          key={field.id}
                          className="rounded-lg border border-border p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                              {schedule?.kind ? INSTALLMENT_KIND_LABELS[schedule.kind] : '—'}
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover parcela</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-12">
                            <FormField
                              control={form.control}
                              name={`installment_schedules.${index}.quantity`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>Quantidade *</FormLabel>
                                  <FormControl>
                                    <Input
                                      ref={(el) => {
                                        quantityInputRefs.current[index] = el
                                      }}
                                      type="number"
                                      min="1"
                                      value={f.value ?? ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        f.onChange(
                                          e.target.value ? Number.parseInt(e.target.value, 10) : 1
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`installment_schedules.${index}.amount`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-3">
                                  <FormLabel>Valor da Parcela *</FormLabel>
                                  <FormControl>
                                    <CurrencyInput value={f.value} onChange={f.onChange} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`installment_schedules.${index}.payment_method`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-3">
                                  <FormLabel>Pagamento *</FormLabel>
                                  <Select value={f.value} onValueChange={f.onChange}>
                                    <FormControl>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.entries(PAYMENT_METHOD_LABELS).map(([v, label]) => (
                                        <SelectItem key={v} value={v}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`installment_schedules.${index}.recurrence_day`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>Dia Vcto. *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="31"
                                      value={f.value ?? ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = e.target.value
                                          ? Number.parseInt(e.target.value, 10)
                                          : null
                                        f.onChange(val)
                                        // Update start_date with new default
                                        if (
                                          recurrenceType &&
                                          (recurrenceType === 'monthly' ||
                                            recurrenceType === 'yearly')
                                        ) {
                                          const newStartDate = computeDefaultStartDate(
                                            recurrenceType,
                                            val,
                                            recurrenceMonth
                                          )
                                          form.setValue(
                                            `installment_schedules.${index}.start_date`,
                                            newStartDate || null
                                          )
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {recurrenceType === 'yearly' && (
                              <FormField
                                control={form.control}
                                name={`installment_schedules.${index}.recurrence_month`}
                                render={({ field: f }) => (
                                  <FormItem className="sm:col-span-2">
                                    <FormLabel>Mês *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={f.value ?? ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const val = e.target.value
                                            ? Number.parseInt(e.target.value, 10)
                                            : null
                                          f.onChange(val)
                                          // Update start_date with new default
                                          if (recurrenceType === 'yearly') {
                                            const newStartDate = computeDefaultStartDate(
                                              recurrenceType,
                                              recurrenceDay,
                                              val
                                            )
                                            form.setValue(
                                              `installment_schedules.${index}.start_date`,
                                              newStartDate || null
                                            )
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-12">
                            <FormField
                              control={form.control}
                              name={`installment_schedules.${index}.start_date`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-4">
                                  <FormLabel>Data de Início *</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      value={f.value}
                                      onChange={f.onChange}
                                      disabled={isDateDisabled}
                                      disabledDates={disabledDates}
                                    />
                                  </FormControl>
                                  {isDateDisabled && (
                                    <p className="text-xs text-muted-foreground">
                                      Preencha o dia{recurrenceType === 'yearly' ? ' e mês' : ''} de
                                      vencimento primeiro
                                    </p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Cadastrar Proposta
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right column: Resumo Financeiro (sticky sidebar) */}
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
                            <span className="text-sm font-medium text-success">Igual ao preço</span>
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
                                    ({schedule.quantity}x R$ {formatCentsToDisplay(schedule.amount)}
                                    )
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
      </form>
    </Form>
  )
}
