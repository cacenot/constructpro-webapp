import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, CalendarIcon, Loader2, Save } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type BrasilApiCepResponse, CEPInput } from '@/components/ui/cep-input'
import { FeaturesInput } from '@/components/ui/features-input'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UFSelect } from '@/components/ui/uf-select'
import { capitalizeNameBR } from '@/lib/text-formatters'
import { cn } from '@/lib/utils'
import {
  PROJECT_TEXT_LIMITS,
  type ProjectCreateFormData,
  projectCreateSchema,
} from '@/schemas/project.schema'

/**
 * Project status options with translations
 */
const PROJECT_STATUS_OPTIONS = [
  { value: 'construction', label: 'Em Construção' },
  { value: 'finished', label: 'Concluído' },
] as const

interface ProjectFormProps {
  /** Initial data for edit mode */
  initialData?: Partial<ProjectCreateFormData>
  /** Called when form is submitted successfully */
  onSubmit: (data: ProjectCreateFormData) => Promise<void>
  /** Called when back button is clicked */
  onBack: () => void
  /** Whether the form is in edit mode */
  isEdit?: boolean
  /** Whether the form is submitting */
  isSubmitting?: boolean
}

/**
 * Project form component for creating and editing projects
 */
export function ProjectForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: ProjectFormProps) {
  const form = useForm<ProjectCreateFormData>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      name: initialData?.name || '',
      status: initialData?.status || 'construction',
      description: initialData?.description || '',
      address: initialData?.address || '',
      number: initialData?.number || '',
      district: initialData?.district || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal_code: initialData?.postal_code || '',
      floors: initialData?.floors || '',
      delivery_date: initialData?.delivery_date || null,
      features: initialData?.features || [],
    },
  })

  const handleCepFetched = React.useCallback(
    (data: BrasilApiCepResponse) => {
      form.setValue('city', capitalizeNameBR(data.city), { shouldValidate: true })
      form.setValue('state', data.state, { shouldValidate: true })

      const currentAddress = form.getValues('address')
      const currentDistrict = form.getValues('district')

      if (!currentAddress && data.street) {
        form.setValue('address', capitalizeNameBR(data.street), { shouldValidate: true })
      }
      if (!currentDistrict && data.neighborhood) {
        form.setValue('district', capitalizeNameBR(data.neighborhood), { shouldValidate: true })
      }
    },
    [form]
  )

  const handleSubmit = async (data: ProjectCreateFormData) => {
    await onSubmit(data)
  }

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
              {isEdit ? 'Editar Empreendimento' : 'Novo Empreendimento'}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados do empreendimento'
                : 'Preencha os dados para cadastrar um novo empreendimento'}
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name and Status */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-8">
                    <FormLabel>Nome do Empreendimento *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={PROJECT_TEXT_LIMITS.NAME}
                        placeholder="Ex: Residencial Vista Verde"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUS_OPTIONS.map((option) => (
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
                      value={field.value || ''}
                      maxLength={PROJECT_TEXT_LIMITS.DESCRIPTION}
                      placeholder="Descreva o empreendimento, características, diferenciais..."
                      className="min-h-24 resize-y"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/{PROJECT_TEXT_LIMITS.DESCRIPTION} caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEP, City, State */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <CEPInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        onCepFetched={handleCepFetched}
                        country="BR"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6">
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={PROJECT_TEXT_LIMITS.CITY}
                        placeholder="Nome da cidade"
                        readOnly
                        className="bg-muted/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>UF *</FormLabel>
                    <FormControl>
                      <UFSelect value={field.value || ''} onValueChange={field.onChange} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address, Number, District */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6">
                    <FormLabel>Logradouro *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={PROJECT_TEXT_LIMITS.ADDRESS}
                        placeholder="Rua, Avenida, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Número *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={PROJECT_TEXT_LIMITS.NUMBER} placeholder="123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={PROJECT_TEXT_LIMITS.DISTRICT}
                        placeholder="Nome do bairro"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Floors and Delivery Date */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="floors"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Andares</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        type="number"
                        min="1"
                        max="999"
                        maxLength={PROJECT_TEXT_LIMITS.FLOORS}
                        placeholder="Ex: 12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_date"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>Data de Entrega Prevista</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {field.value
                              ? format(new Date(field.value), 'dd/MM/yyyy', { locale: ptBR })
                              : 'Selecione uma data'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                          defaultMonth={field.value ? new Date(field.value) : undefined}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Features */}
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Características e Diferenciais</FormLabel>
                  <FormControl>
                    <FeaturesInput
                      value={field.value || []}
                      onChange={field.onChange}
                      maxLength={PROJECT_TEXT_LIMITS.FEATURE}
                    />
                  </FormControl>
                  <FormDescription>
                    Selecione ou adicione características do empreendimento
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
