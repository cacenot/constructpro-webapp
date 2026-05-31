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
  ChevronDown,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  const indexTypes = indexTypesQuery.data?.items ?? []
  const brokers = brokersQuery.data?.items ?? []
  const agencies = agenciesQuery.data?.items ?? []

  const form = useForm<SaleEditFormData>({
    resolver: zodResolver(saleEditFormSchema),
    defaultValues: {
      index_type_code: sale.index_type_code ?? '',
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
      broker_id: sale.broker?.id ?? null,
      commission_broker_rate: sale.commission_broker_rate?.ppm
        ? sale.commission_broker_rate.ppm / 10000
        : null,
      agency_id: sale.agency?.id ?? null,
      commission_agency_rate: sale.commission_agency_rate?.ppm
        ? sale.commission_agency_rate.ppm / 10000
        : null,
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
    return watchedSchedules.reduce((sum, s) => sum + (s.quantity ?? 0) * (s.amount ?? 0), 0)
  }, [watchedSchedules])

  const contractEnd = React.useMemo(() => {
    if (!watchedSchedules) return { endDate: null, totalMonths: 0 }
    return computeContractEndDate(watchedSchedules)
  }, [watchedSchedules])

  const unitPriceCents = sale.unit_price?.cents ?? 0
  const diff = totalFinanced - unitPriceCents
  const diffPercent = unitPriceCents > 0 ? (diff / unitPriceCents) * 100 : 0

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

  const addBimonthlySchedule = React.useCallback(() => {
    const recurrenceDay = 10
    const startDate = computeDefaultStartDate('bimonthly', recurrenceDay, null)
    append({
      kind: 'regular',
      payment_method: 'boleto',
      quantity: 1,
      amount: 0,
      specific_date: null,
      recurrence_type: 'bimonthly',
      recurrence_day: recurrenceDay,
      recurrence_month: null,
      start_date: startDate || null,
    })
  }, [append])

  const addQuarterlySchedule = React.useCallback(() => {
    const recurrenceDay = 10
    const startDate = computeDefaultStartDate('quarterly', recurrenceDay, null)
    append({
      kind: 'regular',
      payment_method: 'boleto',
      quantity: 1,
      amount: 0,
      specific_date: null,
      recurrence_type: 'quarterly',
      recurrence_day: recurrenceDay,
      recurrence_month: null,
      start_date: startDate || null,
    })
  }, [append])

  const addSemestralSchedule = React.useCallback(() => {
    const recurrenceDay = 10
    const startDate = computeDefaultStartDate('semestral', recurrenceDay, null)
    append({
      kind: 'regular',
      payment_method: 'boleto',
      quantity: 1,
      amount: 0,
      specific_date: null,
      recurrence_type: 'semestral',
      recurrence_day: recurrenceDay,
      recurrence_month: null,
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

        {/* Card 3: Comissão */}
        <Card>
          <CardHeader>
            <CardTitle>Comissão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditable ? (
              <>
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
                            <SelectItem value="">Nenhum corretor</SelectItem>
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
                          <FormLabel>Taxa do Corretor (%)</FormLabel>
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
                            <SelectItem value="">Nenhuma imobiliária</SelectItem>
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
                          <FormLabel>Taxa da Imobiliária (%)</FormLabel>
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
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <p className="text-sm text-muted-foreground">Corretor</p>
                    <p className="text-sm font-medium">{sale.broker?.full_name ?? '—'}</p>
                  </div>
                  <div className="sm:col-span-4">
                    <p className="text-sm text-muted-foreground">Taxa do Corretor (%)</p>
                    <p className="text-sm font-medium">
                      {sale.commission_broker_rate?.ppm != null
                        ? `${(sale.commission_broker_rate.ppm / 10000).toFixed(2)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <p className="text-sm text-muted-foreground">Imobiliária</p>
                    <p className="text-sm font-medium">
                      {sale.agency?.trade_name ?? sale.agency?.legal_name ?? '—'}
                    </p>
                  </div>
                  <div className="sm:col-span-4">
                    <p className="text-sm text-muted-foreground">Taxa da Imobiliária (%)</p>
                    <p className="text-sm font-medium">
                      {sale.commission_agency_rate?.ppm != null
                        ? `${(sale.commission_agency_rate.ppm / 10000).toFixed(2)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Pagamento (Entrada + Parcelas) */}
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
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="mr-2 size-4" />
                            Adicionar Parcelas
                            <ChevronDown className="ml-2 size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adicionar grupo de parcelas</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Tipo de Parcela</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={addMonthlySchedule}>Mensais</DropdownMenuItem>
                      <DropdownMenuItem onSelect={addBimonthlySchedule}>
                        Bimestrais
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={addQuarterlySchedule}>
                        Trimestrais
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={addSemestralSchedule}>
                        Semestrais
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={addYearlySchedule}>Anuais</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {fields.length <= 1 && (
                <p className="mb-3 text-sm text-muted-foreground">
                  Clique em "Adicionar Parcelas" para adicionar parcelas mensais, bimestrais,
                  trimestrais, semestrais ou anuais.
                </p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  if (index === 0) return null
                  const schedule = watchedSchedules?.[index]
                  const recurrenceType = schedule?.recurrence_type as
                    | 'monthly'
                    | 'bimonthly'
                    | 'quarterly'
                    | 'semestral'
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
                    <div key={field.id} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {schedule?.kind ? INSTALLMENT_KIND_LABELS[schedule.kind] : '—'}
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
                          name={`installment_schedules.${index}.amount`}
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
                                    if (
                                      recurrenceType &&
                                      (recurrenceType === 'monthly' ||
                                        recurrenceType === 'bimonthly' ||
                                        recurrenceType === 'quarterly' ||
                                        recurrenceType === 'semestral' ||
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
                                    disabled={!isEditable}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null
                                      f.onChange(val)
                                      if (recurrenceType === 'yearly') {
                                        const newStartDate = computeDefaultStartDate(
                                          'yearly',
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

        {/* Card 5: Resumo Financeiro */}
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
                  R$ {formatCentsToDisplay(sale.unit_price?.cents) || '0,00'}
                </p>
              </div>

              {totalFinanced > 0 && (
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
                        <ArrowUp className="size-5 text-warning" />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-warning">
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
                                ({schedule.quantity}x R$ {formatCentsToDisplay(schedule.amount)})
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
