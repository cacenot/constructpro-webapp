import { ArrowLeft, Check, Loader2, Save } from 'lucide-react'
import * as React from 'react'
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { CustomerAutocomplete, type SelectedCustomer } from '@/components/ui/customer-autocomplete'
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
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import type { SaleFormData } from '@/schemas/sale.schema'
import { InstallmentScheduleBuilder } from './installment-schedule-builder'

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
  const handleCustomerChange = React.useCallback(
    (customer: SelectedCustomer | null) => {
      form.setValue('customer_id', customer?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

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
        <CardContent>
          <InstallmentScheduleBuilder
            form={form}
            fields={fields}
            append={append}
            remove={remove}
            watchedSchedules={watchedSchedules}
          />
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
