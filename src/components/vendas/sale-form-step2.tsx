import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
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

interface Broker {
  id: number
  full_name: string
}

interface Agency {
  id: number
  trade_name?: string | null
  legal_name: string
}

interface SaleFormStep2Props {
  form: UseFormReturn<SaleFormData>
  selectedUnit: SelectedUnit | null
  selectedProject: SelectedProject | null
  onBack: () => void
  onNext: () => void
  brokers: Broker[]
  brokersLoading: boolean
  brokersError: boolean
  agencies: Agency[]
  agenciesLoading: boolean
  agenciesError: boolean
  watchedBrokerId: number | null | undefined
  watchedAgencyId: number | null | undefined
  onBackToStep1: () => void
}

export function SaleFormStep2({
  form,
  selectedUnit,
  selectedProject,
  onBack,
  onNext,
  brokers,
  brokersLoading,
  brokersError,
  agencies,
  agenciesLoading,
  agenciesError,
  watchedBrokerId,
  watchedAgencyId,
  onBackToStep1,
}: SaleFormStep2Props) {
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
              onClick={onBackToStep1}
              aria-label="Alterar seleção de empreendimento e unidade"
            >
              Alterar
            </Button>
          </CardContent>
        </Card>
      )}

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

      {/* Ações do Step 2 */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>
        <Button type="button" onClick={onNext}>
          Avançar
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
