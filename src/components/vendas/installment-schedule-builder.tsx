import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
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
  computeDefaultStartDate,
  computeInstallmentsPerMonth,
} from '@/lib/installment-utils'
import {
  ASSET_TYPE_LABELS,
  type AssetType,
  INSTALLMENT_KIND_LABELS,
  INSTALLMENT_PERIODICITY_LABELS,
  type InstallmentKind,
  type InstallmentPeriodicity,
  type InstallmentScheduleFormData,
  installmentKindValues,
  PAYMENT_METHOD_LABELS,
} from '@/schemas/sale.schema'

const GROUP_LABELS: Record<InstallmentKind, string> = {
  entry: 'Entradas',
  regular: 'Parcelas Regulares',
  balloon: 'Balões / Reforços',
  key_delivery: 'Entrega das Chaves',
  extra: 'Extras',
}

const NON_ENTRY_KINDS = ['regular', 'balloon', 'key_delivery', 'extra'] as const

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

// Session-scoped cache: same allowedDates set → same disabledDates list
const _disabledDatesCache = new Map<string, string[]>()

function getDisabledDates(allowedDates: string[]): string[] {
  if (!allowedDates.length) return []
  const key = allowedDates.join(',')
  const cached = _disabledDatesCache.get(key)
  if (cached) return cached
  const today = new Date()
  const result = Array.from({ length: 10957 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return allowedDates.includes(iso) ? '' : iso
  }).filter(Boolean)
  _disabledDatesCache.set(key, result)
  return result
}

function getScheduleBadgeLabel(kind: InstallmentKind, recurrenceType?: string | null): string {
  if (kind === 'regular' && recurrenceType) {
    return INSTALLMENT_PERIODICITY_LABELS[recurrenceType as InstallmentPeriodicity] ?? 'Regular'
  }
  if (kind === 'extra' && recurrenceType) {
    const label = INSTALLMENT_PERIODICITY_LABELS[recurrenceType as InstallmentPeriodicity]
    return label ? `Extra · ${label}` : 'Extra'
  }
  return INSTALLMENT_KIND_LABELS[kind] ?? kind
}

function formatMonthBR(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const name = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', {
    month: 'long',
  })
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}/${year}`
}

interface InstallmentScheduleBuilderProps {
  // biome-ignore lint/suspicious/noExplicitAny: builder supports both SaleFormData and SaleEditFormData
  form: UseFormReturn<any>
  // biome-ignore lint/suspicious/noExplicitAny: builder supports both SaleFormData and SaleEditFormData
  fields: FieldArrayWithId<any, 'installment_schedules'>[]
  // biome-ignore lint/suspicious/noExplicitAny: builder supports both SaleFormData and SaleEditFormData
  append: UseFieldArrayAppend<any, 'installment_schedules'>
  remove: UseFieldArrayRemove
  watchedSchedules: InstallmentScheduleFormData[] | undefined
  disabled?: boolean
  maxInstallmentsPerMonth?: number
  sameIndexForAll?: boolean
  indexTypes?: { code: string }[]
  indexTypesLoading?: boolean
}

export function InstallmentScheduleBuilder({
  form,
  fields,
  append,
  remove,
  watchedSchedules,
  disabled = false,
  maxInstallmentsPerMonth,
  sameIndexForAll = true,
  indexTypes = [],
  indexTypesLoading = false,
}: InstallmentScheduleBuilderProps) {
  const quantityInputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const lastEntryRef = React.useRef<HTMLDivElement | null>(null)

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

  // Group schedules by kind: kind → array of field indices
  const groupedIndices = React.useMemo(() => {
    const map = new Map<InstallmentKind, number[]>()
    for (const kind of installmentKindValues) map.set(kind, [])
    fields.forEach((field, index) => {
      // biome-ignore lint/suspicious/noExplicitAny: field type is any
      const kind = (watchedSchedules?.[index]?.kind ?? (field as any).kind) as InstallmentKind
      if (kind) map.get(kind)?.push(index)
    })
    return map
  }, [fields, watchedSchedules])

  const entryIndices = groupedIndices.get('entry') ?? []

  const violatedMonths = React.useMemo(() => {
    if (!maxInstallmentsPerMonth || maxInstallmentsPerMonth <= 0 || !watchedSchedules) return []
    const perMonth = computeInstallmentsPerMonth(watchedSchedules)
    const result: { month: string; count: number }[] = []
    for (const [month, count] of perMonth) {
      if (count > maxInstallmentsPerMonth) result.push({ month, count })
    }
    return result.sort((a, b) => a.month.localeCompare(b.month))
  }, [maxInstallmentsPerMonth, watchedSchedules])

  function groupSubtotal(kind: InstallmentKind): number {
    const indices = groupedIndices.get(kind) ?? []
    if (!watchedSchedules) return 0
    return indices.reduce(
      (sum, i) => sum + (watchedSchedules[i]?.quantity ?? 0) * (watchedSchedules[i]?.amount ?? 0),
      0
    )
  }

  // Add functions
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

  const addBalloonSchedule = React.useCallback(() => {
    const recurrenceDay = 15
    const recurrenceMonth = 12
    const startDate = computeDefaultStartDate('yearly', recurrenceDay, recurrenceMonth)
    append({
      kind: 'balloon',
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

  const addKeyDeliverySchedule = React.useCallback(() => {
    append({
      kind: 'key_delivery',
      payment_method: 'boleto',
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

  const addExtraSchedule = React.useCallback(() => {
    const recurrenceDay = 10
    const startDate = computeDefaultStartDate('monthly', recurrenceDay, null)
    append({
      kind: 'extra',
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

  const hasNonEntrySchedules = NON_ENTRY_KINDS.some((k) => (groupedIndices.get(k)?.length ?? 0) > 0)

  return (
    <div className="space-y-6">
      {/* ── Grupo: Entradas ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">{GROUP_LABELS.entry}</p>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              R$ {formatCentsToDisplay(groupSubtotal('entry')) || '0,00'}
            </span>
          </div>
          {!disabled && (
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
          {entryIndices.map((realIndex, entryIdx) => {
            const schedule = watchedSchedules?.[realIndex]
            const paymentMethod = schedule?.payment_method
            const assetProposal = schedule?.asset_proposal
            const assetType = assetProposal?.type
            const isNotFirst = entryIdx > 0
            const isLastEntry = entryIdx === entryIndices.length - 1

            return (
              <div
                key={fields[realIndex]?.id ?? realIndex}
                ref={isNotFirst && isLastEntry ? lastEntryRef : null}
                className="space-y-4 rounded-xl border border-border/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Entrada</Badge>
                  {isNotFirst && !disabled && (
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
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name={`installment_schedules.${realIndex}.quantity`}
                    render={({ field: f }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Qtd. *</FormLabel>
                        <FormControl>
                          <Input
                            ref={(el) => {
                              quantityInputRefs.current[realIndex] = el
                            }}
                            type="number"
                            min="1"
                            disabled={disabled}
                            value={f.value ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              f.onChange(e.target.value ? Number.parseInt(e.target.value, 10) : 1)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`installment_schedules.${realIndex}.amount`}
                    render={({ field: f }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel>Valor da Entrada *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={f.value}
                            onChange={f.onChange}
                            disabled={disabled}
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
                      <FormItem className="sm:col-span-3">
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
                          disabled={disabled}
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

                  <FormField
                    control={form.control}
                    name={`installment_schedules.${realIndex}.specific_date`}
                    render={({ field: f }) => (
                      <FormItem className="sm:col-span-4">
                        <FormLabel>Data de Pagamento *</FormLabel>
                        <FormControl>
                          <DatePicker value={f.value} onChange={f.onChange} disabled={disabled} />
                        </FormControl>
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
                                disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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
                                    disabled={disabled}
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

      {/* ── Grupos não-entrada ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium">Parcelas</p>
          {!disabled && (
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
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Parcelas Regulares</DropdownMenuLabel>
                <DropdownMenuItem onSelect={addMonthlySchedule}>Mensais</DropdownMenuItem>
                <DropdownMenuItem onSelect={addBimonthlySchedule}>Bimestrais</DropdownMenuItem>
                <DropdownMenuItem onSelect={addQuarterlySchedule}>Trimestrais</DropdownMenuItem>
                <DropdownMenuItem onSelect={addSemestralSchedule}>Semestrais</DropdownMenuItem>
                <DropdownMenuItem onSelect={addYearlySchedule}>Anuais</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Outros Tipos</DropdownMenuLabel>
                <DropdownMenuItem onSelect={addBalloonSchedule}>Balão / Reforço</DropdownMenuItem>
                <DropdownMenuItem onSelect={addKeyDeliverySchedule}>
                  Entrega das Chaves
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={addExtraSchedule}>Extra</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {violatedMonths.length > 0 && (
          <div className="space-y-1 mt-2 mb-3">
            {violatedMonths.map(({ month, count }) => (
              <p key={month} className="text-sm text-destructive">
                ⚠️ <strong>{formatMonthBR(month)}</strong>: {count} parcelas — limite é{' '}
                {maxInstallmentsPerMonth}. Ajuste as datas ou reduza as quantidades.
              </p>
            ))}
          </div>
        )}

        {!hasNonEntrySchedules && (
          <p className="mb-3 text-sm text-muted-foreground">
            Clique em "Adicionar Parcelas" para adicionar parcelas.
          </p>
        )}

        <div className="space-y-6">
          {NON_ENTRY_KINDS.map((kind) => {
            const indices = groupedIndices.get(kind) ?? []
            if (indices.length === 0) return null

            return (
              <div key={kind}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{GROUP_LABELS[kind]}</p>
                  <span className="text-sm font-medium tabular-nums">
                    R$ {formatCentsToDisplay(groupSubtotal(kind)) || '0,00'}
                  </span>
                </div>

                <div className="space-y-4">
                  {indices.map((index) => {
                    const schedule = watchedSchedules?.[index]
                    const currentKind = (schedule?.kind ??
                      // biome-ignore lint/suspicious/noExplicitAny: field type is any
                      (fields[index] as any).kind) as InstallmentKind
                    const recurrenceType = schedule?.recurrence_type as
                      | 'monthly'
                      | 'bimonthly'
                      | 'quarterly'
                      | 'semestral'
                      | 'yearly'
                      | undefined

                    // key_delivery uses specific_date; all others use recurrence_day + start_date
                    const usesSpecificDate = currentKind === 'key_delivery'

                    const recurrenceDay = schedule?.recurrence_day
                    const recurrenceMonth = schedule?.recurrence_month

                    const isDateDisabled = usesSpecificDate
                      ? false
                      : recurrenceType === 'yearly'
                        ? !recurrenceDay || !recurrenceMonth
                        : !recurrenceDay

                    const allowedDates =
                      !usesSpecificDate && recurrenceType && !isDateDisabled
                        ? computeAllowedDates(recurrenceType, recurrenceDay, recurrenceMonth)
                        : []

                    const disabledDates = getDisabledDates(allowedDates)

                    return (
                      <div
                        key={fields[index]?.id ?? index}
                        className="space-y-4 rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {getScheduleBadgeLabel(currentKind, recurrenceType)}
                          </Badge>
                          {!disabled && (
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

                        {/* Seletor de índice por grupo (Modo B — toggle OFF) */}
                        {!sameIndexForAll && (
                          <>
                            <div className="grid gap-4 sm:grid-cols-12">
                              <FormField
                                control={form.control}
                                name={`installment_schedules.${index}.index_type_code`}
                                render={({ field: f }) => (
                                  <FormItem className="sm:col-span-4">
                                    <FormLabel>Índice de Correção *</FormLabel>
                                    <Select
                                      value={f.value ?? ''}
                                      onValueChange={f.onChange}
                                      disabled={disabled || indexTypesLoading}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue
                                            placeholder={
                                              indexTypesLoading ? 'Carregando...' : 'Selecione'
                                            }
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {indexTypes.map((t) => (
                                          <SelectItem key={t.code} value={t.code}>
                                            {t.code}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator className="my-4" />
                          </>
                        )}

                        {/* Fields: key_delivery uses specific_date; others use recurrence fields */}
                        {usesSpecificDate ? (
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
                                      disabled={disabled}
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
                                    <CurrencyInput
                                      value={f.value}
                                      onChange={f.onChange}
                                      disabled={disabled}
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
                                    disabled={disabled}
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
                              name={`installment_schedules.${index}.specific_date`}
                              render={({ field: f }) => (
                                <FormItem className="sm:col-span-4">
                                  <FormLabel>Data de Entrega *</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      value={f.value}
                                      onChange={f.onChange}
                                      disabled={disabled}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <>
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
                                        disabled={disabled}
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
                                      <CurrencyInput
                                        value={f.value}
                                        onChange={f.onChange}
                                        disabled={disabled}
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
                                      disabled={disabled}
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
                                        disabled={disabled}
                                        value={f.value ?? ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const val = e.target.value
                                            ? Number.parseInt(e.target.value, 10)
                                            : null
                                          f.onChange(val)
                                          if (recurrenceType) {
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
                                          disabled={disabled}
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
                                        disabled={isDateDisabled || disabled}
                                        disabledDates={disabledDates}
                                      />
                                    </FormControl>
                                    {isDateDisabled && !disabled && (
                                      <p className="text-xs text-muted-foreground">
                                        Preencha o dia
                                        {recurrenceType === 'yearly' ? ' e mês' : ''} de vencimento
                                        primeiro
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
