import { ArrowLeft, Check, Loader2, Save } from 'lucide-react'
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { SelectedProject } from '@/components/ui/project-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import type { SaleFormData } from '@/schemas/sale.schema'
import { InstallmentScheduleBuilder } from './installment-schedule-builder'

interface IndexType {
  code: string
}

interface SaleFormStep3Props {
  form: UseFormReturn<SaleFormData>
  selectedUnit: SelectedUnit | null
  selectedProject: SelectedProject | null
  onBack: () => void
  onBackToStep1: () => void
  isSubmitting: boolean
  indexTypes: IndexType[]
  indexTypesLoading?: boolean
  watchedSchedules: SaleFormData['installment_schedules'] | undefined
  fields: FieldArrayWithId<SaleFormData, 'installment_schedules', 'id'>[]
  append: UseFieldArrayAppend<SaleFormData, 'installment_schedules'>
  remove: UseFieldArrayRemove
  maxInstallmentsPerMonth?: number
  sameIndexForAll: boolean
  onToggleChange: (value: boolean) => void
}

export function SaleFormStep3({
  form,
  selectedUnit,
  selectedProject,
  onBack,
  onBackToStep1,
  isSubmitting,
  indexTypes,
  indexTypesLoading,
  watchedSchedules,
  fields,
  append,
  remove,
  maxInstallmentsPerMonth,
  sameIndexForAll,
  onToggleChange,
}: SaleFormStep3Props) {
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

      {/* Card Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle: Usar o mesmo índice para toda a proposta */}
          <div className="flex items-center gap-3 py-1">
            <Switch
              id="same-index-for-all"
              checked={sameIndexForAll}
              onCheckedChange={onToggleChange}
            />
            <label
              htmlFor="same-index-for-all"
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
                      disabled={indexTypesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={indexTypesLoading ? 'Carregando...' : 'Selecione'}
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

          <InstallmentScheduleBuilder
            form={form}
            fields={fields}
            append={append}
            remove={remove}
            watchedSchedules={watchedSchedules}
            maxInstallmentsPerMonth={maxInstallmentsPerMonth}
            sameIndexForAll={sameIndexForAll}
            indexTypes={indexTypes}
            indexTypesLoading={indexTypesLoading}
          />
        </CardContent>
      </Card>

      {/* Ações do Step 3 */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar
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
              Salvar Proposta
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
