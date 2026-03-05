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

/**
 * Compute the default start date based on recurrence_day/month.
 * Returns the next occurrence of that day/month.
 */
function computeDefaultStartDate(
  kind: 'monthly' | 'yearly',
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string {
  if (!recurrenceDay) return ''

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  if (kind === 'monthly') {
    // Find the next occurrence of recurrenceDay
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const dayToUse = Math.min(recurrenceDay, daysInCurrentMonth)

    // If the day hasn't passed in the current month, use it
    if (dayToUse >= currentDay) {
      return formatDateISO(currentYear, currentMonth + 1, dayToUse)
    }

    // Otherwise, use next month
    const nextMonth = currentMonth + 1
    const daysInNextMonth = new Date(currentYear, nextMonth + 1, 0).getDate()
    const dayInNextMonth = Math.min(recurrenceDay, daysInNextMonth)

    if (nextMonth === 11) {
      return formatDateISO(currentYear + 1, 1, dayInNextMonth)
    }
    return formatDateISO(currentYear, nextMonth + 1, dayInNextMonth)
  }

  if (kind === 'yearly' && recurrenceMonth) {
    const month = recurrenceMonth - 1
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
    const dayToUse = Math.min(recurrenceDay, daysInMonth)

    // If the day/month hasn't passed this year, use it
    if (month > currentMonth || (month === currentMonth && dayToUse >= currentDay)) {
      return formatDateISO(currentYear, recurrenceMonth, dayToUse)
    }

    // Otherwise, use next year
    const daysInNextYear = new Date(currentYear + 1, month + 1, 0).getDate()
    const dayInNextYear = Math.min(recurrenceDay, daysInNextYear)
    return formatDateISO(currentYear + 1, recurrenceMonth, dayInNextYear)
  }

  return ''
}

/**
 * Compute the allowed dates for a date input based on recurrence_day and optionally recurrence_month.
 * For monthly: only the given day of every month for the next 30 years.
 * For yearly: only the given day/month for the next 30 years.
 * Returns an array of YYYY-MM-DD strings.
 */
function computeAllowedDates(
  kind: 'monthly' | 'yearly',
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string[] {
  if (!recurrenceDay) return []
  const dates: string[] = []
  const now = new Date()
  const startYear = now.getFullYear()
  const endYear = startYear + 30

  if (kind === 'monthly') {
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const day = Math.min(recurrenceDay, daysInMonth)
        const d = new Date(year, month, day)
        if (
          d >= now ||
          (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
        ) {
          dates.push(formatDateISO(year, month + 1, day))
        }
      }
    }
  } else if (kind === 'yearly' && recurrenceMonth) {
    for (let year = startYear; year <= endYear; year++) {
      const month = recurrenceMonth - 1
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const day = Math.min(recurrenceDay, daysInMonth)
      const d = new Date(year, month, day)
      if (d >= now || d.getFullYear() === now.getFullYear()) {
        dates.push(formatDateISO(year, recurrenceMonth, day))
      }
    }
  }

  return dates
}

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Compute the end date of the contract based on all schedules.
 */
function computeContractEndDate(schedules: SaleFormData['installment_schedules']): {
  endDate: Date | null
  totalMonths: number
} {
  let latestDate: Date | null = null
  let totalMonths = 0

  for (const schedule of schedules) {
    if (schedule.kind === 'entry' && schedule.specific_date) {
      const d = new Date(schedule.specific_date)
      if (!latestDate || d > latestDate) latestDate = d
    }

    if (schedule.kind === 'monthly' && schedule.start_date && schedule.recurrence_day) {
      const start = new Date(schedule.start_date)
      const months = (schedule.quantity ?? 1) - 1
      const end = new Date(start)
      end.setMonth(end.getMonth() + months)
      if (!latestDate || end > latestDate) latestDate = end
      if (months + 1 > totalMonths) totalMonths = months + 1
    }

    if (schedule.kind === 'yearly' && schedule.start_date && schedule.recurrence_day) {
      const start = new Date(schedule.start_date)
      const years = (schedule.quantity ?? 1) - 1
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + years)
      if (!latestDate || end > latestDate) latestDate = end
    }
  }

  return { endDate: latestDate, totalMonths }
}

function formatBRDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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
          amount_cents: 0,
          specific_date: null,
          recurrence_type: null,
          recurrence_day: null,
          recurrence_month: null,
          start_date: null,
        },
      ],
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

  const totalFinanced = React.useMemo(() => {
    if (!watchedSchedules) return 0
    return watchedSchedules.reduce((sum, s) => {
      return sum + (s.quantity ?? 0) * (s.amount_cents ?? 0)
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
      kind: 'monthly',
      payment_method: 'boleto',
      quantity: 1,
      amount_cents: 0,
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
      kind: 'yearly',
      payment_method: 'boleto',
      quantity: 1,
      amount_cents: 0,
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
                      <CustomerAutocomplete value={field.value} onChange={handleCustomerChange} />
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
                  name="installment_schedules.0.amount_cents"
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
                  <Button type="button" variant="outline" size="sm" onClick={addMonthlySchedule}>
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
                  const kind = schedule?.kind as 'monthly' | 'yearly' | undefined
                  const recurrenceDay = schedule?.recurrence_day
                  const recurrenceMonth = schedule?.recurrence_month

                  const isDateDisabled =
                    kind === 'yearly' ? !recurrenceDay || !recurrenceMonth : !recurrenceDay

                  const allowedDates =
                    kind && !isDateDisabled
                      ? computeAllowedDates(kind, recurrenceDay, recurrenceMonth)
                      : []

                  const disabledDates = Array.from({ length: 10957 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() + i)
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    return allowedDates.includes(iso) ? '' : iso
                  }).filter(Boolean)

                  return (
                    <div key={field.id} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {INSTALLMENT_KIND_LABELS[kind ?? ''] ?? kind}
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
                          name={`installment_schedules.${index}.amount_cents`}
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
                                    if (kind && (kind === 'monthly' || kind === 'yearly')) {
                                      const newStartDate = computeDefaultStartDate(
                                        kind,
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

                        {kind === 'yearly' && (
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
                                      if (kind === 'yearly') {
                                        const newStartDate = computeDefaultStartDate(
                                          kind,
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
                                  Preencha o dia{kind === 'yearly' ? ' e mês' : ''} de vencimento
                                  primeiro
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

        {/* Card 3: Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        <Equal className="size-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Igual ao preço
                        </span>
                      </>
                    ) : diff > 0 ? (
                      <>
                        <ArrowUp className="size-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                            + R$ {formatCentsToDisplay(diff)}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {diffPercent.toFixed(1)}% acima
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="size-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
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
                      const subtotal = (schedule.quantity ?? 0) * (schedule.amount_cents ?? 0)
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
                                {formatCentsToDisplay(schedule.amount_cents)})
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
      </form>
    </Form>
  )
}
