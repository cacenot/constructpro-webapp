import { getUnitCategoryOptions } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { AreaInput } from '@/components/ui/area-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import { FeaturesInput } from '@/components/ui/features-input'
import { FloorSelect } from '@/components/ui/floor-select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ProjectAutocomplete, type SelectedProject } from '@/components/ui/project-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getUnitFeaturesSuggestions,
  UNIT_TEXT_LIMITS,
  type UnitFormData,
  unitFormSchema,
} from '@/schemas/unit.schema'

// Get category options from API client
const categoryOptions = getUnitCategoryOptions('pt-BR')

interface UnitFormProps {
  /** Initial data for edit mode */
  initialData?: Partial<UnitFormData> & {
    /** Project info for edit mode */
    project?: {
      id: number
      name: string
      floors: number | null
    }
  }
  /** Called when form is submitted successfully */
  onSubmit: (data: UnitFormData) => Promise<void>
  /** Called when back button is clicked */
  onBack: () => void
  /** Whether the form is in edit mode */
  isEdit?: boolean
  /** Whether the form is submitting */
  isSubmitting?: boolean
}

/**
 * Unit form component for creating and editing units
 */
export function UnitForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: UnitFormProps) {
  // Track selected project info for floor select
  const [selectedProject, setSelectedProject] = React.useState<SelectedProject | null>(
    initialData?.project ?? null
  )

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      category: initialData?.category ?? undefined,
      project_id: initialData?.project_id ?? undefined,
      area: initialData?.area ?? undefined,
      price_cents: initialData?.price_cents ?? undefined,
      description: initialData?.description ?? '',
      apartment_type: initialData?.apartment_type ?? '',
      bedrooms: initialData?.bedrooms ?? null,
      bathrooms: initialData?.bathrooms ?? null,
      garages: initialData?.garages ?? null,
      floor: initialData?.floor ?? null,
      features: initialData?.features ?? [],
    },
  })

  // Watch project_id to reset floor when project changes
  const projectId = useWatch({ control: form.control, name: 'project_id' })

  // Reset floor when project changes (only if not initial load)
  const isInitialMount = React.useRef(true)
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only reset if project actually changed
    if (projectId !== initialData?.project_id) {
      form.setValue('floor', null)
    }
  }, [projectId, form, initialData?.project_id])

  const handleProjectChange = React.useCallback(
    (project: SelectedProject | null) => {
      setSelectedProject(project)
      form.setValue('project_id', project?.id ?? (undefined as unknown as number), {
        shouldValidate: true,
      })
    },
    [form]
  )

  const handleSubmit = async (data: UnitFormData) => {
    await onSubmit(data)
  }

  // Get unit features suggestions (from env or defaults)
  const featuresSuggestions = React.useMemo(() => getUnitFeaturesSuggestions(), [])

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
            <h2 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Editar Unidade' : 'Nova Unidade'}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados da unidade'
                : 'Preencha os dados para cadastrar uma nova unidade'}
            </p>
          </div>
        </div>

        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name and Project */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Nome da Unidade *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={UNIT_TEXT_LIMITS.NAME}
                        placeholder="Ex: Apt 101, Casa 05"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-8">
                    <FormLabel>Empreendimento *</FormLabel>
                    <FormControl>
                      <ProjectAutocomplete
                        value={field.value}
                        onChange={handleProjectChange}
                        disabled={isEdit}
                      />
                    </FormControl>
                    {isEdit && (
                      <FormDescription>
                        O empreendimento não pode ser alterado após a criação.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Apartment Type */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Categoria *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="apartment_type"
                render={({ field }) => (
                  <FormItem className="sm:col-span-8">
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        maxLength={UNIT_TEXT_LIMITS.APARTMENT_TYPE}
                        placeholder="Ex: 2 Quartos, 3 Suítes, Comercial 50m²"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      maxLength={UNIT_TEXT_LIMITS.DESCRIPTION}
                      placeholder="Descreva a unidade, diferenciais, observações..."
                      className="min-h-24 resize-y"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/{UNIT_TEXT_LIMITS.DESCRIPTION} caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Area, Bedrooms, Bathrooms */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Área *</FormLabel>
                    <FormControl>
                      <AreaInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Quartos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number.parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Banheiros</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number.parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="garages"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Vagas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number.parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Floor */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Andar</FormLabel>
                    <FormControl>
                      <FloorSelect
                        value={field.value}
                        onChange={field.onChange}
                        maxFloors={selectedProject?.floors}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader>
            <CardTitle>Preço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="price_cents"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Valor de Tabela *</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>Preço da unidade na tabela de vendas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diferenciais da Unidade</FormLabel>
                  <FormControl>
                    <FeaturesInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      suggestions={featuresSuggestions}
                      maxLength={UNIT_TEXT_LIMITS.FEATURE}
                    />
                  </FormControl>
                  <FormDescription>
                    Selecione ou adicione características específicas desta unidade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {isEdit ? 'Atualizando...' : 'Cadastrando...'}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {isEdit ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
