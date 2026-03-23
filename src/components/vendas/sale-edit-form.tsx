import {
  type components,
  SaleStatus,
  translateSaleStatus,
  useApiClient,
} from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, formatCentsToDisplay } from '@/components/ui/currency-input'
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
  type SaleEditFormData,
  saleEditFormSchema,
} from '@/schemas/sale.schema'
import { SaleStatusBadge } from './sale-status-badge'

type SaleResponse = components['schemas']['SaleResponse']

interface SaleEditFormProps {
  sale: SaleResponse
  onSubmit: (data: SaleEditFormData) => Promise<void>
  onBack: () => void
  isSubmitting?: boolean
}

export function SaleEditForm({ sale, onSubmit, onBack, isSubmitting = false }: SaleEditFormProps) {
  const { client } = useApiClient()
  const isEditable = sale.status === SaleStatus.proposal

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

  const form = useForm<SaleEditFormData>({
    resolver: zodResolver(saleEditFormSchema),
    defaultValues: {
      index_type_code: sale.contract?.index_type_code ?? '',
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
    return watchedSchedules.reduce((sum, s) => sum + (s.quantity ?? 0) * (s.amount_cents ?? 0), 0)
  }, [watchedSchedules])

  const contractEnd = React.useMemo(() => {
    if (!watchedSchedules) return { endDate: null, totalMonths: 0 }
    return computeContractEndDate(watchedSchedules)
  }, [watchedSchedules])

  const diff = totalFinanced - sale.unit_price_cents
  const diffPercent = sale.unit_price_cents > 0 ? (diff / sale.unit_price_cents) * 100 : 0

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

  React.useEffect(() => {
    const lastIndex = fields.length - 1
    if (lastIndex > 0) {
      setTimeout(() => {
        quantityInputRefs.current[lastIndex]?.focus()
      }, 0)
    }
  }, [fields.length])

  const handleSubmit = async (data: SaleEditFormData) => {
    await onSubmit(data)
  }

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
            <h2 className="text-2xl font-bold tracking-tight">Editar Proposta</h2>
            <p className="mt-1 text-muted-foreground">
              Altere o índice de correção e o cronograma de parcelas
            </p>
          </div>
        </div>

        {/* Guard: not editable */}
        {!isEditable && sale.status && (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>Edição não disponível</AlertTitle>
            <AlertDescription>
              Esta proposta não pode ser editada pois seu status é{' '}
              <strong>{translateSaleStatus(sale.status, 'pt-BR')}</strong>. Apenas propostas em
              aberto podem ter índice e parcelas alterados.
            </AlertDescription>
          </Alert>
        )}

        {/* Card 1: Dados da Venda (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <p className="text-sm text-muted-foreground">Unidade</p>
                <p className="text-sm font-medium">{sale.unit?.name ?? '—'}</p>
              </div>
              <div className="sm:col-span-5">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">{sale.customer?.full_name ?? '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Status</p>
                {sale.status ? (
                  <SaleStatusBadge status={sale.status} />
                ) : (
                  <span className="text-sm font-medium">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Índice de Correção */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="index_type_code"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Índice de Correção *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!isEditable}
                    >
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

        {/* Card 3: Pagamento (Entrada + Parcelas) */}
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
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!isEditable}
                        />
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
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!isEditable}
                        />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isEditable}
                      >
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
                {isEditable && (
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
                )}
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
                        {isEditable && (
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
                        )}
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
                                  disabled={!isEditable}
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
                                <CurrencyInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  disabled={!isEditable}
                                />
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
                              <Select
                                value={f.value}
                                onValueChange={f.onChange}
                                disabled={!isEditable}
                              >
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
                                  disabled={!isEditable}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const val = e.target.value
                                      ? Number.parseInt(e.target.value, 10)
                                      : null
                                    f.onChange(val)
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
                                    disabled={!isEditable}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null
                                      f.onChange(val)
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
                                  disabled={isDateDisabled || !isEditable}
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

        {/* Card 4: Resumo Financeiro */}
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

              <div>
                <p className="text-sm text-muted-foreground">Preço de Tabela</p>
                <p className="text-2xl font-bold tabular-nums">
                  R$ {formatCentsToDisplay(sale.unit_price_cents) || '0,00'}
                </p>
              </div>

              {totalFinanced > 0 && (
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
          <Button type="submit" disabled={isSubmitting || !isEditable}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
