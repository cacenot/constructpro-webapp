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
  Save,
} from 'lucide-react'
import * as React from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
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
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { computeContractEndDate, formatBRDate } from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import {
  type InstallmentScheduleFormData,
  installmentKindValues,
  type SaleEditFormData,
  saleEditFormSchema,
} from '@/schemas/sale.schema'
import { InstallmentScheduleBuilder } from './installment-schedule-builder'
import { SaleStatusBadge } from './sale-status-badge'

const EDIT_GROUP_LABELS = {
  entry: 'Entradas',
  regular: 'Parcelas Regulares',
  balloon: 'Balões / Reforços',
  key_delivery: 'Entrega das Chaves',
  extra: 'Extras',
} as const

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

  const hasPerGroupIndex = sale.installment_schedules?.some(
    (s) => s.index_type_code != null && s.index_type_code !== ''
  )

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
      same_index_for_all: !hasPerGroupIndex,
      index_type_code: hasPerGroupIndex ? '' : (sale.index_type_code ?? ''),
      installment_schedules:
        sale.installment_schedules && sale.installment_schedules.length > 0
          ? sale.installment_schedules.map((s) => ({
              kind: s.kind,
              payment_method: s.payment_method,
              quantity: s.quantity,
              amount: s.amount,
              index_type_code: s.index_type_code ?? null,
              specific_date: s.specific_date ?? null,
              recurrence_type: s.recurrence_type ?? null,
              recurrence_day: s.start_date ? new Date(`${s.start_date}T12:00:00`).getDate() : null,
              recurrence_month:
                s.recurrence_type === 'yearly' && s.start_date
                  ? new Date(`${s.start_date}T12:00:00`).getMonth() + 1
                  : null,
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
                index_type_code: null,
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

  const sameIndexForAll =
    useWatch({
      control: form.control,
      name: 'same_index_for_all',
    }) ?? !hasPerGroupIndex

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

        {/* Card 2: Configuração de Índice */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle: Usar o mesmo índice para toda a proposta */}
            <div className="flex items-center gap-3 py-1">
              <Switch
                id="edit-same-index-for-all"
                checked={sameIndexForAll}
                onCheckedChange={handleToggleChange}
                disabled={!isEditable}
              />
              <label
                htmlFor="edit-same-index-for-all"
                className="cursor-pointer text-sm font-medium leading-none"
              >
                Usar o mesmo índice para toda a proposta
              </label>
            </div>

            {/* Seletor global (Modo A — toggle ON) */}
            {sameIndexForAll && (
              <div className="grid gap-4 sm:grid-cols-12">
                <FormField
                  control={form.control}
                  name="index_type_code"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Índice de Correção *</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        disabled={!isEditable || indexTypesQuery.isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                indexTypesQuery.isLoading ? 'Carregando...' : 'Selecione'
                              }
                            />
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
            )}
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
            <InstallmentScheduleBuilder
              form={form}
              fields={fields}
              append={append}
              remove={remove}
              watchedSchedules={watchedSchedules}
              disabled={!isEditable}
              sameIndexForAll={sameIndexForAll}
              indexTypes={indexTypes}
              indexTypesLoading={indexTypesQuery.isLoading}
            />
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
                {(() => {
                  const groupTotals = installmentKindValues
                    .map((kind) => ({
                      kind,
                      subtotal: watchedSchedules.reduce(
                        (sum, s) =>
                          s.kind === kind ? sum + (s.quantity ?? 0) * (s.amount ?? 0) : sum,
                        0
                      ),
                    }))
                    .filter(({ subtotal }) => subtotal > 0)
                  if (groupTotals.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Detalhamento</p>
                      <div className="space-y-1">
                        {groupTotals.map(({ kind, subtotal }) => (
                          <div key={kind} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{EDIT_GROUP_LABELS[kind]}</span>
                            <span className={cn('font-medium tabular-nums')}>
                              R$ {formatCentsToDisplay(subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
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
