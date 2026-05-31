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
  ASSET_TYPE_LABELS,
  type AssetType,
  INSTALLMENT_KIND_LABELS,
  type InstallmentScheduleFormData,
  PAYMENT_METHOD_LABELS,
  type SaleEditFormData,
  saleEditFormSchema,
} from '@/schemas/sale.schema'
import { SaleStatusBadge } from './sale-status-badge'

type SaleResponse = components['schemas']['SaleResponse']

function getDefaultAssetMetadata(type: AssetType) {
  switch (type) {
    case 'vehicle':
      return { type, plate: '', renavam: '', brand: '', model: '', year: '' as unknown as number }
    case 'real_estate':
      return {
        type,
        address: '',
        property_type: '',
        area_sqm: '' as unknown as number,
        registration_number: '',
      }
    case 'land':
      return { type, address: '', area_sqm: '' as unknown as number, registration_number: '' }
    case 'boat':
      return {
        type,
        registration: '',
        length_meters: '' as unknown as number,
        brand: '',
        model: '',
        year: '' as unknown as number,
      }
  }
}

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
      installment_schedules:
        sale.installment_schedules && sale.installment_schedules.length > 0
          ? sale.installment_schedules.map((s) => ({
              kind: s.kind,
              payment_method: s.payment_method,
              quantity: s.quantity,
              amount: s.amount,
              specific_date: s.specific_date ?? null,
              recurrence_type: s.recurrence_type ?? null,
              recurrence_day: null,
              recurrence_month: null,
              start_date: s.start_date ?? null,
              asset_proposal: (s.asset_proposal ??
                null) as InstallmentScheduleFormData['asset_proposal'],
            }))
          : [
              {
                kind: 'entry' as const,
                payment_method: 'pix' as const,
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
  const lastEntryRef = React.useRef<HTMLDivElement | null>(null)

  const addEntrySchedule = React.useCallback(() => {
    append({
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
    })
  }, [append])

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: lastEntryRef is a stable ref
  React.useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [fields.length])

  const entryFields = fields
    .map((field, index) => ({ field, index }))
    .filter(({ index }) => (watchedSchedules?.[index]?.kind ?? fields[index]?.kind) === 'entry')

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
            {/* Entrada — N entradas dinâmicas */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Entrada</p>
                {isEditable && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="outline" size="sm" onClick={addEntrySchedule}>
                        <Plus className="mr-2 size-4" />
                        Adicionar Entrada
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar nova entrada</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="space-y-3">
                {entryFields.map(({ field, index: realIndex }, entryIdx) => {
                  const schedule = watchedSchedules?.[realIndex]
                  const paymentMethod = schedule?.payment_method
                  const assetProposal = schedule?.asset_proposal
                  const assetType = assetProposal?.type
                  const isNotFirst = entryIdx > 0

                  return (
                    <div
                      key={field.id}
                      ref={isNotFirst && entryIdx === entryFields.length - 1 ? lastEntryRef : null}
                      className="relative rounded-xl border border-border/50 p-4 space-y-4"
                    >
                      {isNotFirst && isEditable && (
                        <div className="absolute right-3 top-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(realIndex)}
                                className="size-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover entrada</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-12">
                        <FormField
                          control={form.control}
                          name={`installment_schedules.${realIndex}.amount`}
                          render={({ field: f }) => (
                            <FormItem className="sm:col-span-4">
                              <FormLabel>Valor da Entrada *</FormLabel>
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
                          name={`installment_schedules.${realIndex}.specific_date`}
                          render={({ field: f }) => (
                            <FormItem className="sm:col-span-4">
                              <FormLabel>Data de Pagamento *</FormLabel>
                              <FormControl>
                                <DatePicker
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
                          name={`installment_schedules.${realIndex}.payment_method`}
                          render={({ field: f }) => (
                            <FormItem className="sm:col-span-4">
                              <FormLabel>Forma de Pagamento *</FormLabel>
                              <Select
                                value={f.value}
                                onValueChange={(val) => {
                                  f.onChange(val)
                                  if (val !== 'asset') {
                                    form.setValue(
                                      `installment_schedules.${realIndex}.asset_proposal`,
                                      null
                                    )
                                  }
                                }}
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

                      {/* Sub-form de bem */}
                      {paymentMethod === 'asset' && (
                        <>
                          <Separator className="my-1" />
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-12">
                              <FormField
                                control={form.control}
                                name={`installment_schedules.${realIndex}.asset_proposal`}
                                render={() => (
                                  <FormItem className="sm:col-span-12">
                                    <FormLabel>Tipo de Bem *</FormLabel>
                                    <Select
                                      value={assetType ?? ''}
                                      onValueChange={(val) => {
                                        const type = val as AssetType
                                        form.setValue(
                                          `installment_schedules.${realIndex}.asset_proposal`,
                                          { type, asset_metadata: getDefaultAssetMetadata(type) },
                                          { shouldValidate: true }
                                        )
                                      }}
                                      disabled={!isEditable}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
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

                            {assetType === 'vehicle' && (
                              <div className="grid gap-4 sm:grid-cols-12">
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.plate`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Placa *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="ABC-1234"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.renavam`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>RENAVAM *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="12345678901"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.brand`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Marca *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Toyota"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.model`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-8">
                                      <FormLabel>Modelo *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Corolla"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.year`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Ano *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="2024"
                                          min={1900}
                                          max={2030}
                                          className="tabular-nums"
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            f.onChange(e.target.value ? Number(e.target.value) : '')
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {assetType === 'real_estate' && (
                              <div className="grid gap-4 sm:grid-cols-12">
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.address`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-8">
                                      <FormLabel>Endereço *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Rua, número, bairro"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.property_type`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Tipo de Imóvel *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Apartamento"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.area_sqm`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-6">
                                      <FormLabel>Área (m²) *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          min={0}
                                          className="tabular-nums"
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            f.onChange(e.target.value ? Number(e.target.value) : '')
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.registration_number`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-6">
                                      <FormLabel>Nº de Registro *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="000.000"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {assetType === 'land' && (
                              <div className="grid gap-4 sm:grid-cols-12">
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.address`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-8">
                                      <FormLabel>Endereço *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Localização do terreno"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.area_sqm`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Área (m²) *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          min={0}
                                          className="tabular-nums"
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            f.onChange(e.target.value ? Number(e.target.value) : '')
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.registration_number`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-12">
                                      <FormLabel>Nº de Registro *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="000.000"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {assetType === 'boat' && (
                              <div className="grid gap-4 sm:grid-cols-12">
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.registration`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Registro *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="TM-XXXXXX"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.length_meters`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Comprimento (m) *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          min={0}
                                          className="tabular-nums"
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            f.onChange(e.target.value ? Number(e.target.value) : '')
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.brand`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Marca *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Yamaha"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.model`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-8">
                                      <FormLabel>Modelo *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="242X"
                                          {...f}
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`installment_schedules.${realIndex}.asset_proposal.asset_metadata.year`}
                                  render={({ field: f }) => (
                                    <FormItem className="sm:col-span-4">
                                      <FormLabel>Ano *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="2024"
                                          min={1900}
                                          max={2030}
                                          className="tabular-nums"
                                          value={f.value ?? ''}
                                          disabled={!isEditable}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            f.onChange(e.target.value ? Number(e.target.value) : '')
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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

              {fields.filter((_, i) => (watchedSchedules?.[i]?.kind ?? fields[i]?.kind) !== 'entry')
                .length === 0 && (
                <p className="mb-3 text-sm text-muted-foreground">
                  Clique em "Adicionar Parcelas" para adicionar parcelas mensais, bimestrais,
                  trimestrais, semestrais ou anuais.
                </p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const currentKind =
                    watchedSchedules?.[index]?.kind ?? (field as { kind?: string }).kind
                  if (currentKind === 'entry') return null
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
