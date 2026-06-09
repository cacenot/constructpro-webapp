import { AlertTriangle, ChevronDown, Lock, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CurrencyInput, formatCentsToDisplay } from '@/components/ui/currency-input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { NumberStepper } from '@/components/ui/number-stepper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  balanceGroupAmount,
  computeChainedStart,
  computeDefaultStartDate,
  computeMonthlySpan,
  computeScheduleEnd,
  deriveRecurrenceFields,
  deriveRecurringFromSpan,
  formatBRDate,
} from '@/lib/installment-utils'
import {
  INSTALLMENT_PERIODICITY_LABELS,
  type InstallmentKind,
  type InstallmentPeriodicity,
  type InstallmentScheduleFormData,
  installmentKindValues,
} from '@/schemas/sale.schema'
import { AssetProposalFields } from './asset-proposal-fields'
import {
  BALLOON_PERIODICITY_OPTIONS,
  createEntrySchedule,
  GROUP_LABELS,
  NON_ENTRY_KINDS,
  PAYMENT_METHOD_OPTIONS,
} from './constants'
import { CONSOLE_LABEL, REVEAL } from './section'

type Recurrence = 'monthly' | 'bimonthly' | 'quarterly' | 'semestral' | 'yearly'

function formatMonthBR(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const name = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'long' })
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}/${year}`
}

function periodicityChip(kind: InstallmentKind, recurrence?: string | null): string {
  if (kind === 'key_delivery') return 'Chaves'
  // Reforço/balão e parcela exibem a própria periodicidade (a sazonalidade do reforço
  // é editável no card; a parcela é sempre mensal).
  if (recurrence) return INSTALLMENT_PERIODICITY_LABELS[recurrence as InstallmentPeriodicity] ?? ''
  if (kind === 'balloon') return 'Balão'
  return GROUP_LABELS[kind]
}

/** Quantas parcelas dessa periodicidade cabem em um ano (atalho "±1 ano" do stepper). */
function installmentsPerYear(recurrence?: Recurrence | null): number {
  switch (recurrence) {
    case 'monthly':
      return 12
    case 'bimonthly':
      return 6
    case 'quarterly':
      return 4
    case 'semestral':
      return 2
    default:
      return 1
  }
}

interface InstallmentLedgerProps {
  // biome-ignore lint/suspicious/noExplicitAny: suporta SaleFormData e SaleEditFormData
  form: UseFormReturn<any>
  // biome-ignore lint/suspicious/noExplicitAny: idem
  fields: FieldArrayWithId<any, 'installment_schedules', 'id'>[]
  // biome-ignore lint/suspicious/noExplicitAny: idem
  append: UseFieldArrayAppend<any, 'installment_schedules'>
  remove: UseFieldArrayRemove
  watchedSchedules: InstallmentScheduleFormData[] | undefined
  disabled?: boolean
  sameIndexForAll?: boolean
  indexTypes?: { code: string }[]
  indexTypesLoading?: boolean
  violations?: { month: string; count: number }[]
  maxInstallmentsPerMonth?: number
  saldo?: number
}

export function InstallmentLedger({
  form,
  fields,
  append,
  remove,
  watchedSchedules,
  disabled = false,
  sameIndexForAll = true,
  indexTypes = [],
  indexTypesLoading = false,
  violations = [],
  maxInstallmentsPerMonth,
  saldo = 0,
}: InstallmentLedgerProps) {
  // Índices de cada kind dentro do field array.
  const groupedIndices = React.useMemo(() => {
    const map = new Map<InstallmentKind, number[]>()
    for (const kind of installmentKindValues) map.set(kind, [])
    fields.forEach((field, index) => {
      // biome-ignore lint/suspicious/noExplicitAny: field é genérico
      const kind = (watchedSchedules?.[index]?.kind ?? (field as any).kind) as InstallmentKind
      if (kind) map.get(kind)?.push(index)
    })
    return map
  }, [fields, watchedSchedules])

  const entryIndices = groupedIndices.get('entry') ?? []
  const hasNonEntry = NON_ENTRY_KINDS.some((k) => (groupedIndices.get(k)?.length ?? 0) > 0)

  const subtotal = React.useCallback(
    (kind: InstallmentKind) => {
      const indices = groupedIndices.get(kind) ?? []
      if (!watchedSchedules) return 0
      return indices.reduce(
        (sum, i) => sum + (watchedSchedules[i]?.quantity ?? 0) * (watchedSchedules[i]?.amount ?? 0),
        0
      )
    },
    [groupedIndices, watchedSchedules]
  )

  const [unlocked, setUnlocked] = React.useState<Set<number>>(new Set())

  // Keeps chained monthly group starts in sync when an earlier group is edited.
  // Safety: the `expected !== current` guard means once all starts are correct
  // the effect fires no setValue calls, so no further re-renders are triggered —
  // preventing an infinite loop.
  React.useEffect(() => {
    if (!watchedSchedules) return

    // Build ordered list of field-array indices that are monthly regular schedules.
    const monthlyIndices: number[] = []
    watchedSchedules.forEach((s, i) => {
      if (s?.kind === 'regular' && s?.recurrence_type === 'monthly') {
        monthlyIndices.push(i)
      }
    })
    // monthlyIndices is already in ascending order because forEach preserves order.

    if (monthlyIndices.length < 2) return

    for (let pos = 1; pos < monthlyIndices.length; pos++) {
      const idx = monthlyIndices[pos] as number
      if (unlocked.has(idx)) continue // user broke the chain for this group

      const prevIdx = monthlyIndices[pos - 1] as number
      const prev = watchedSchedules[prevIdx]
      if (!prev?.start_date) continue // can't compute without anchor

      const day = new Date(`${prev.start_date}T12:00:00`).getDate()
      const expected = computeChainedStart(prev, day)
      if (!expected) continue

      const current = watchedSchedules[idx]?.start_date
      if (expected !== current) {
        form.setValue(`installment_schedules.${idx}.start_date`, expected)
        form.setValue(
          `installment_schedules.${idx}.recurrence_day`,
          deriveRecurrenceFields(expected, 'monthly').recurrence_day
        )
      }
    }
  }, [watchedSchedules, unlocked, form])

  const groupRange = React.useCallback(
    (indices: number[]): string | null => {
      if (!watchedSchedules || !indices.length) return null
      let start: Date | null = null
      let end: Date | null = null
      for (const i of indices) {
        const s = watchedSchedules[i]
        if (!s?.start_date) continue
        const sd = new Date(`${s.start_date}T12:00:00`)
        const ed = computeScheduleEnd(s)
        if (!start || sd < start) start = sd
        if (ed && (!end || ed > end)) end = ed
      }
      if (!start || !end) return null
      return `${formatBRDate(start)} → ${formatBRDate(end)}`
    },
    [watchedSchedules]
  )

  const addRecurring = React.useCallback(
    (kind: 'regular' | 'balloon' | 'extra', recurrence: Recurrence) => {
      const isYearly = recurrence === 'yearly'
      const day = isYearly ? 15 : 10
      const periodMonthsMap: Record<Recurrence, number> = {
        monthly: 1,
        bimonthly: 2,
        quarterly: 3,
        semestral: 6,
        yearly: 12,
      }

      // Mensais encadeiam (sem sobreposição) após o último grupo mensal.
      if (kind === 'regular' && recurrence === 'monthly') {
        const list = (watchedSchedules ?? []) as InstallmentScheduleFormData[]
        const lastMonthly = [...list]
          .reverse()
          .find((s) => s.kind === 'regular' && s.recurrence_type === 'monthly' && s.start_date)
        const startDate = lastMonthly
          ? computeChainedStart(lastMonthly, day)
          : computeDefaultStartDate('monthly', day, null)
        append({
          kind,
          payment_method: 'boleto',
          quantity: 1,
          amount: 0,
          specific_date: null,
          recurrence_type: 'monthly',
          recurrence_day: day,
          recurrence_month: null,
          start_date: startDate || null,
          asset_proposal: null,
        })
        return
      }

      // Balões/reforços: quantidade derivada do span das mensais + saldo distribuído.
      const span = computeMonthlySpan((watchedSchedules ?? []) as InstallmentScheduleFormData[])
      const period = periodMonthsMap[recurrence] ?? 1
      const derived = span ? deriveRecurringFromSpan(span, period, day) : null
      const quantity = derived?.quantity ?? 1
      const startISO =
        derived?.startISO ?? computeDefaultStartDate(recurrence, day, isYearly ? 12 : null)
      const perAmount = saldo > 0 ? balanceGroupAmount(0, quantity, saldo) : 0
      const { recurrence_day, recurrence_month } = startISO
        ? deriveRecurrenceFields(startISO, recurrence)
        : { recurrence_day: day, recurrence_month: isYearly ? 12 : null }
      append({
        kind,
        payment_method: 'boleto',
        quantity,
        amount: perAmount,
        specific_date: null,
        recurrence_type: recurrence,
        recurrence_day,
        recurrence_month,
        start_date: startISO || null,
        asset_proposal: null,
      })
    },
    [append, watchedSchedules, saldo]
  )

  const addKeyDelivery = React.useCallback(() => {
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

  return (
    <div className="space-y-8">
      {/* ───── Entradas ───── */}
      <div className="space-y-3">
        <GroupHeader label={GROUP_LABELS.entry} value={subtotal('entry')}>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(createEntrySchedule())}
            >
              <Plus className="size-4" />
              Entrada
            </Button>
          )}
        </GroupHeader>

        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {entryIndices.map((realIndex, entryIdx) => {
            const schedule = watchedSchedules?.[realIndex]
            const isAsset = schedule?.payment_method === 'asset'
            const canRemove = entryIdx > 0 && !disabled

            return (
              <div
                key={fields[realIndex]?.id ?? realIndex}
                // Entrada inicial não anima no load; entradas adicionais revelam ao surgir.
                className={`space-y-3 p-3 sm:p-4 ${entryIdx > 0 ? REVEAL : ''}`}
              >
                <RowStrip
                  label={`Entrada ${entryIdx + 1}`}
                  onRemove={canRemove ? () => remove(realIndex) : undefined}
                  removeTooltip="Remover entrada"
                />

                <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name={`installment_schedules.${realIndex}.amount`}
                    render={({ field: f }) => (
                      <FormItem className="col-span-2 sm:col-span-4">
                        <FormLabel className={CONSOLE_LABEL}>Valor *</FormLabel>
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
                      <FormItem className="col-span-1 sm:col-span-4">
                        <FormLabel className={CONSOLE_LABEL}>Forma *</FormLabel>
                        <Select
                          value={f.value}
                          onValueChange={(val) => {
                            f.onChange(val)
                            if (val !== 'asset')
                              form.setValue(
                                `installment_schedules.${realIndex}.asset_proposal`,
                                null
                              )
                          }}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_METHOD_OPTIONS.map(([value, label]) => (
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
                      <FormItem className="col-span-1 sm:col-span-4">
                        <FormLabel className={CONSOLE_LABEL}>Vencimento *</FormLabel>
                        <FormControl>
                          <DatePicker value={f.value} onChange={f.onChange} disabled={disabled} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isAsset && (
                  <AssetProposalFields
                    form={form}
                    index={realIndex}
                    assetType={schedule?.asset_proposal?.type}
                    disabled={disabled}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ───── Parcelas (não-entrada) ───── */}
      <div className="space-y-3">
        <GroupHeader label="Parcelas e reforços">
          {!disabled && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="size-4" />
                      Adicionar
                      <ChevronDown className="size-4 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar grupo de parcelas</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => addRecurring('regular', 'monthly')}>
                  Parcela mensal
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addRecurring('balloon', 'yearly')}>
                  Reforço / Balão
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={addKeyDelivery}>Entrega das chaves</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </GroupHeader>

        {violations.length > 0 && (
          <div
            className={`flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 ${REVEAL}`}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="space-y-0.5 text-xs text-warning">
              {violations.map(({ month, count }) => (
                <p key={month}>
                  <strong className="font-semibold">{formatMonthBR(month)}</strong>: {count}{' '}
                  parcelas no mês, acima do limite de {maxInstallmentsPerMonth}. Ajuste as datas ou
                  as quantidades.
                </p>
              ))}
            </div>
          </div>
        )}

        {!hasNonEntry ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma parcela ainda. Use <span className="text-foreground">Adicionar</span> para
            incluir mensais, balões ou entrega das chaves.
          </p>
        ) : (
          <div className="space-y-6">
            {NON_ENTRY_KINDS.map((kind) => {
              const indices = groupedIndices.get(kind) ?? []
              if (indices.length === 0) return null
              const firstMonthlyIndex = groupedIndices.get('regular')?.[0]
              const range = groupRange(indices)
              return (
                <div key={kind} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-foreground">
                      {GROUP_LABELS[kind]}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      R$ {formatCentsToDisplay(subtotal(kind)) || '0,00'}
                    </span>
                  </div>
                  {range && (
                    <p className="text-[0.6875rem] tabular-nums text-muted-foreground">{range}</p>
                  )}

                  <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                    {indices.map((index) => {
                      const schedule = watchedSchedules?.[index]
                      const isMonthly =
                        schedule?.kind === 'regular' && schedule?.recurrence_type === 'monthly'
                      const chainedLocked =
                        isMonthly && index !== firstMonthlyIndex && !unlocked.has(index)
                      return (
                        <InstallmentRow
                          key={fields[index]?.id ?? index}
                          form={form}
                          index={index}
                          schedule={schedule}
                          // biome-ignore lint/suspicious/noExplicitAny: field genérico
                          fallbackKind={(fields[index] as any)?.kind as InstallmentKind}
                          disabled={disabled}
                          sameIndexForAll={sameIndexForAll}
                          indexTypes={indexTypes}
                          indexTypesLoading={indexTypesLoading}
                          onRemove={() => remove(index)}
                          chainedLocked={chainedLocked}
                          onUnlock={() => setUnlocked((s) => new Set(s).add(index))}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-componentes ────────────────────────────────────────────────────── */

function GroupHeader({
  label,
  value,
  children,
}: {
  label: string
  value?: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h3 className={CONSOLE_LABEL}>{label}</h3>
        {value != null && (
          <span className="text-sm font-medium tabular-nums text-foreground">
            R$ {formatCentsToDisplay(value) || '0,00'}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function RowStrip({
  label,
  control,
  onRemove,
  removeTooltip,
}: {
  label: string
  /** Substitui o chip estático por um controle (ex.: select de sazonalidade do reforço). */
  control?: React.ReactNode
  onRemove?: () => void
  removeTooltip: string
}) {
  return (
    <div className="flex items-center justify-between">
      {control ?? (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
      )}
      {onRemove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{removeTooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

interface InstallmentRowProps {
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  form: UseFormReturn<any>
  index: number
  schedule: InstallmentScheduleFormData | undefined
  fallbackKind: InstallmentKind
  disabled: boolean
  sameIndexForAll: boolean
  indexTypes: { code: string }[]
  indexTypesLoading: boolean
  onRemove: () => void
  chainedLocked?: boolean
  onUnlock?: () => void
}

function InstallmentRow({
  form,
  index,
  schedule,
  fallbackKind,
  disabled,
  sameIndexForAll,
  indexTypes,
  indexTypesLoading,
  onRemove,
  chainedLocked = false,
  onUnlock,
}: InstallmentRowProps) {
  const kind = (schedule?.kind ?? fallbackKind) as InstallmentKind
  const recurrence = schedule?.recurrence_type as Recurrence | null | undefined
  const usesSpecificDate = kind === 'key_delivery'
  const recurrenceDay = schedule?.recurrence_day
  const recurrenceMonth = schedule?.recurrence_month

  // Sazonalidade editável no card, só para reforços/balões (parcela é sempre mensal).
  const isBalloon = kind === 'balloon'
  const handlePeriodicityChange = (value: string) => {
    const rec = value as Recurrence
    const month = rec === 'yearly' ? (recurrenceMonth ?? 12) : null
    form.setValue(`installment_schedules.${index}.recurrence_type`, rec)
    form.setValue(`installment_schedules.${index}.recurrence_month`, month)
    const next = computeDefaultStartDate(rec, recurrenceDay, month)
    form.setValue(`installment_schedules.${index}.start_date`, next || null)
  }

  return (
    <div className={`space-y-3 p-3 sm:p-4 ${REVEAL}`}>
      <RowStrip
        label={periodicityChip(kind, recurrence)}
        control={
          isBalloon && !disabled ? (
            <PeriodicityChipSelect
              value={recurrence ?? 'yearly'}
              onChange={handlePeriodicityChange}
            />
          ) : undefined
        }
        onRemove={disabled ? undefined : onRemove}
        removeTooltip="Remover parcela"
      />

      <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-12">
        <FormField
          control={form.control}
          name={`installment_schedules.${index}.quantity`}
          render={({ field: f, fieldState }) => (
            <FormItem className="col-span-1 sm:col-span-3">
              <FormLabel className={CONSOLE_LABEL}>Qtd. *</FormLabel>
              <FormControl>
                <NumberStepper
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  min={1}
                  bigStep={installmentsPerYear(recurrence)}
                  stepLabel={recurrence === 'monthly' ? 'mês' : 'parcela'}
                  bigStepLabel="ano"
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
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
            <FormItem className="col-span-1 sm:col-span-3">
              <FormLabel className={CONSOLE_LABEL}>Valor *</FormLabel>
              <FormControl>
                <CurrencyInput value={f.value} onChange={f.onChange} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`installment_schedules.${index}.payment_method`}
          render={({ field: f }) => (
            <FormItem className="col-span-1 sm:col-span-2">
              <FormLabel className={CONSOLE_LABEL}>Forma *</FormLabel>
              <Select value={f.value} onValueChange={f.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map(([value, label]) => (
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

        {usesSpecificDate ? (
          <FormField
            control={form.control}
            name={`installment_schedules.${index}.specific_date`}
            render={({ field: f }) => (
              <FormItem className="col-span-1 sm:col-span-4">
                <FormLabel className={CONSOLE_LABEL}>Entrega *</FormLabel>
                <FormControl>
                  <DatePicker value={f.value} onChange={f.onChange} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name={`installment_schedules.${index}.start_date`}
            render={({ field: f }) => (
              <FormItem className="col-span-2 sm:col-span-6">
                <FormLabel className={CONSOLE_LABEL}>Início *</FormLabel>
                {chainedLocked ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                      <Lock className="size-3.5" />
                      <span className="tabular-nums">
                        {f.value ? formatBRDate(new Date(`${f.value}T12:00:00`)) : '—'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={onUnlock}
                    >
                      Destravar
                    </Button>
                  </div>
                ) : (
                  <FormControl>
                    <DatePicker
                      value={f.value}
                      disabled={disabled}
                      onChange={(v) => {
                        f.onChange(v)
                        if (v && recurrence) {
                          const d = deriveRecurrenceFields(v, recurrence)
                          form.setValue(
                            `installment_schedules.${index}.recurrence_day`,
                            d.recurrence_day
                          )
                          form.setValue(
                            `installment_schedules.${index}.recurrence_month`,
                            d.recurrence_month
                          )
                        }
                      }}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Índice por grupo (toggle "mesmo índice" desligado), nunca para entradas. */}
        {!sameIndexForAll && (
          <FormField
            control={form.control}
            name={`installment_schedules.${index}.index_type_code`}
            render={({ field: f }) => (
              <FormItem className="col-span-2 sm:col-span-3">
                <FormLabel className={CONSOLE_LABEL}>Índice *</FormLabel>
                <Select
                  value={f.value ?? ''}
                  onValueChange={f.onChange}
                  disabled={disabled || indexTypesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={indexTypesLoading ? 'Carregando…' : 'Selecione'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {indexTypes.map((t) => (
                      <SelectItem key={t.code} value={t.code} className="font-mono text-xs">
                        {t.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  )
}

/** Chip-select compacto da sazonalidade do reforço, no lugar do rótulo da linha. */
function PeriodicityChipSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Sazonalidade do reforço"
        className="h-6 w-auto gap-1 rounded-full border-0 bg-muted px-2.5 py-0 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground focus:ring-1 data-[state=open]:bg-accent data-[state=open]:text-foreground [&>svg]:size-3 [&>svg]:opacity-70"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {BALLOON_PERIODICITY_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
