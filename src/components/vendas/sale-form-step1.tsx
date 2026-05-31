import { ArrowRight } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { ProjectAutocomplete, type SelectedProject } from '@/components/ui/project-autocomplete'
import { type SelectedUnit, UnitAutocomplete } from '@/components/ui/unit-autocomplete'
import type { SaleFormData } from '@/schemas/sale.schema'

interface SaleFormStep1Props {
  form: UseFormReturn<SaleFormData>
  selectedProject: SelectedProject | null
  onProjectChange: (project: SelectedProject | null) => void
  selectedUnit: SelectedUnit | null
  onUnitChange: (unit: SelectedUnit | null) => void
  onNext: () => void
}

export function SaleFormStep1({
  form,
  selectedProject,
  onProjectChange,
  selectedUnit,
  onUnitChange,
  onNext,
}: SaleFormStep1Props) {
  const canProceed = selectedProject !== null && selectedUnit !== null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle aria-live="polite">Empreendimento e Unidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Empreendimento *</Label>
            <ProjectAutocomplete value={selectedProject?.id ?? null} onChange={onProjectChange} />
          </div>

          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade *</FormLabel>
                <FormControl>
                  <UnitAutocomplete
                    value={field.value}
                    onChange={onUnitChange}
                    projectId={selectedProject?.id}
                    disabled={!selectedProject}
                    placeholder={
                      selectedProject
                        ? 'Selecione uma unidade...'
                        : 'Selecione um empreendimento primeiro'
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" disabled={!canProceed} onClick={onNext}>
          Próximo
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
