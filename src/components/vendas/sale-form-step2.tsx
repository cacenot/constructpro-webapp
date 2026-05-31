import { ArrowLeft, Check, Loader2, Plus, Save, Trash2 } from 'lucide-react'
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

  const handleCustomerChange = React.useCallback(
    (customer: SelectedCustomer | null) => {
      form.setValue('customer_id', customer?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

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

  React.useEffect(() => {
    const lastIndex = fields.length - 1
    if (lastIndex > 0) {
      setTimeout(() => {
        quantityInputRefs.current[lastIndex]?.focus()
      }, 0)
    }
  }, [fields.length])

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

      {/* Card Dados da Venda (sem unit_id — gerenciado pelo Step 1) */}
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
          {/* Entrada */}
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

          {/* Parcelas */}
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
                const recurrenceType = schedule?.recurrence_type as 'monthly' | 'yearly' | undefined
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
                                    (recurrenceType === 'monthly' || recurrenceType === 'yearly')
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
