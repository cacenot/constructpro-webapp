import type * as React from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { AgencyAutocomplete, type SelectedAgency } from '@/components/ui/agency-autocomplete'
import { BrokerAutocomplete, type SelectedBroker } from '@/components/ui/broker-autocomplete'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { REVEAL } from './section'

interface ProposalMediationProps {
  // biome-ignore lint/suspicious/noExplicitAny: suporta SaleFormData e SaleEditFormData
  form: UseFormReturn<any>
  watchedBrokerId: number | null | undefined
  watchedAgencyId: number | null | undefined
  /** Teto da soma corretor + imobiliária, em %. 0 = sem teto configurado. */
  maxCommissionRate: number
  /** Informa o corretor selecionado (para o resumo da etapa). */
  onBrokerSelect?: (broker: SelectedBroker | null) => void
  /** Informa a imobiliária selecionada (para o resumo da etapa). */
  onAgencySelect?: (agency: SelectedAgency | null) => void
  disabled?: boolean
}

/**
 * Mediação da venda: corretor + imobiliária e comissões. Ao escolher só o corretor,
 * preenche a comissão com o teto da organização; ao adicionar imobiliária, divide
 * 50/50. Cada campo é limitado ao que resta do teto.
 */
export function ProposalMediation({
  form,
  watchedBrokerId,
  watchedAgencyId,
  maxCommissionRate,
  onBrokerSelect,
  onAgencySelect,
  disabled,
}: ProposalMediationProps) {
  const brokerRate = useWatch({ control: form.control, name: 'commission_broker_rate' }) as
    | number
    | null
    | undefined
  const agencyRate = useWatch({ control: form.control, name: 'commission_agency_rate' }) as
    | number
    | null
    | undefined

  const hasCap = maxCommissionRate > 0
  const brokerMax = hasCap ? round(maxCommissionRate - (agencyRate ?? 0)) : undefined
  const agencyMax = hasCap ? round(maxCommissionRate - (brokerRate ?? 0)) : undefined

  const handleBrokerChange = (broker: SelectedBroker | null) => {
    form.setValue('broker_id', broker?.id ?? null, { shouldValidate: true })
    onBrokerSelect?.(broker)
    if (!broker) {
      form.setValue('agency_id', null)
      form.setValue('commission_broker_rate', null)
      form.setValue('commission_agency_rate', null)
      onAgencySelect?.(null)
    } else if (hasCap && form.getValues('commission_broker_rate') == null) {
      // Só corretor → preenche com o teto da organização
      form.setValue('commission_broker_rate', maxCommissionRate, { shouldValidate: true })
    }
  }

  const handleAgencyChange = (agency: SelectedAgency | null) => {
    form.setValue('agency_id', agency?.id ?? null, { shouldValidate: true })
    onAgencySelect?.(agency)
    if (!agency) {
      form.setValue('commission_agency_rate', null)
      if (watchedBrokerId && hasCap) {
        form.setValue('commission_broker_rate', maxCommissionRate, { shouldValidate: true })
      }
    } else if (hasCap) {
      // Corretor + imobiliária → divide o teto 50/50
      const half = round(maxCommissionRate / 2)
      form.setValue('commission_broker_rate', half, { shouldValidate: true })
      form.setValue('commission_agency_rate', maxCommissionRate - half, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-4">
      {/* Corretor + comissão */}
      <div className="grid items-start gap-4 sm:grid-cols-12">
        <div className="flex flex-col gap-1.5 sm:col-span-8">
          <Label>Corretor</Label>
          <BrokerAutocomplete
            value={watchedBrokerId}
            onChange={handleBrokerChange}
            disabled={disabled}
          />
        </div>

        {watchedBrokerId ? (
          <RateField
            form={form}
            name="commission_broker_rate"
            max={brokerMax}
            disabled={disabled}
          />
        ) : null}
      </div>

      {/* Imobiliária + comissão */}
      <div className="grid items-start gap-4 sm:grid-cols-12">
        <div className="flex flex-col gap-1.5 sm:col-span-8">
          <Label>Imobiliária</Label>
          <AgencyAutocomplete
            value={watchedAgencyId}
            onChange={handleAgencyChange}
            disabled={disabled || !watchedBrokerId}
            placeholder={
              watchedBrokerId ? 'Selecione uma imobiliária...' : 'Selecione um corretor primeiro'
            }
          />
        </div>

        {watchedAgencyId ? (
          <RateField
            form={form}
            name="commission_agency_rate"
            max={agencyMax}
            disabled={disabled}
          />
        ) : null}
      </div>
    </div>
  )
}

function round(value: number) {
  return Math.round(value * 10000) / 10000
}

function RateField({
  form,
  name,
  max,
  disabled,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  form: UseFormReturn<any>
  name: string
  max?: number
  disabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={`sm:col-span-4 ${REVEAL}`}>
          <FormLabel>Comissão (%)</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={max}
              placeholder="Ex.: 1,5"
              className="tabular-nums"
              value={field.value ?? ''}
              disabled={disabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.onChange(e.target.value ? Number(e.target.value) : null)
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
