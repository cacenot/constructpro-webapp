import { ArrowLeft, Check, ChevronDown, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import * as React from 'react'
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput, formatCentsToDisplay } from '@/components/ui/currency-input'
import { CustomerAutocomplete, type SelectedCustomer } from '@/components/ui/customer-autocomplete'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { SelectedProject } from '@/components/ui/project-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import { computeAllowedDates, computeDefaultStartDate } from '@/lib/installment-utils'
import {
  ASSET_TYPE_LABELS,
  type AssetType,
  INSTALLMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  type SaleFormData,
} from '@/schemas/sale.schema'

interface Broker {
  id: number
  full_name: string
}

interface Agency {
  id: number
  trade_name?: string | null
  legal_name: string
}

interface IndexType {
  code: string
}

interface SaleFormStep2Props {
  form: UseFormReturn<SaleFormData>
  selectedUnit: SelectedUnit | null
  selectedProject: SelectedProject | null
  onBack: () => void
  isSubmitting: boolean
  brokers: Broker[]
  brokersLoading: boolean
  brokersError: boolean
  agencies: Agency[]
  agenciesLoading: boolean
  agenciesError: boolean
  indexTypes: IndexType[]
  watchedBrokerId: number | null | undefined
  watchedAgencyId: number | null | undefined
  watchedSchedules: SaleFormData['installment_schedules'] | undefined
  fields: FieldArrayWithId<SaleFormData, 'installment_schedules', 'id'>[]
  append: UseFieldArrayAppend<SaleFormData, 'installment_schedules'>
  remove: UseFieldArrayRemove
}

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

export function SaleFormStep2({
  form,
  selectedUnit,
  selectedProject,
  onBack,
  isSubmitting,
  brokers,
  brokersLoading,
  brokersError,
  agencies,
  agenciesLoading,
  agenciesError,
  indexTypes,
  watchedBrokerId,
  watchedAgencyId,
  watchedSchedules,
  fields,
  append,
  remove,
}: SaleFormStep2Props) {
  const quantityInputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const lastEntryRef = React.useRef<HTMLDivElement | null>(null)

  const handleCustomerChange = React.useCallback(
    (customer: SelectedCustomer | null) => {
      form.setValue('customer_id', customer?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

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

  return (
    <div className="space-y-6">
      {/* Chip read-only: empreendimento + unidade selecionados */}
      {selectedUnit && selectedProject && (
        <Card className="border-muted bg-muted/50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium">{selectedProject.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUnit.name}
                  {selectedUnit.price_cents
                    ? ` · R$ ${formatCentsToDisplay(selectedUnit.price_cents)}`
                    : ''}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Alterar seleção de empreendimento e unidade"
            >
              Alterar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card Dados da Venda */}
      <Card>
        <CardHeader>
          <CardTitle aria-live="polite">Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-12">
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
                    disabled={brokersLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            brokersLoading
                              ? 'Carregando...'
                              : brokersError
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
                    disabled={!watchedBrokerId || agenciesLoading}
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
                              : agenciesLoading
                                ? 'Carregando...'
                                : agenciesError
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

      {/* Card Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entrada — N entradas dinâmicas */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Entrada</p>
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
                    {isNotFirst && (
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
                              <CurrencyInput value={f.value} onChange={f.onChange} />
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
                              <DatePicker value={f.value} onChange={f.onChange} />
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
                                      <Input placeholder="ABC-1234" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="Toyota" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="Corolla" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="000.000" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="000.000" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="TM-XXXXXX" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="Yamaha" {...f} value={f.value ?? ''} />
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
                                      <Input placeholder="242X" {...f} value={f.value ?? ''} />
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

          {/* Parcelas */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Parcelas</p>
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
                  <DropdownMenuItem onSelect={addBimonthlySchedule}>Bimestrais</DropdownMenuItem>
                  <DropdownMenuItem onSelect={addQuarterlySchedule}>Trimestrais</DropdownMenuItem>
                  <DropdownMenuItem onSelect={addSemestralSchedule}>Semestrais</DropdownMenuItem>
                  <DropdownMenuItem onSelect={addYearlySchedule}>Anuais</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  recurrenceType === 'yearly' ? !recurrenceDay || !recurrenceMonth : !recurrenceDay

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
                  <div key={field.id} className="space-y-4 rounded-lg border border-border p-4">
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
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const val = e.target.value
                                      ? Number.parseInt(e.target.value, 10)
                                      : null
                                    f.onChange(val)
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

      {/* Ações do Step 2 */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar ao Step 1
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Criando proposta...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Criar Proposta
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
