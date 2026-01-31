import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CNPJInput } from '@/components/ui/document-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { capitalizeNameBR } from '@/lib/text-formatters'
import {
  type CustomerPJCreateFormData,
  customerPJCreateSchema,
  TEXT_LIMITS,
} from '@/schemas/customer.schema'
import { AddressFormFields } from './address-form-fields'

interface CustomerPJFormProps {
  /** Initial data for edit mode */
  initialData?: Partial<CustomerPJCreateFormData & { cpf_cnpj?: string }>
  /** Called when form is submitted successfully */
  onSubmit: (data: CustomerPJCreateFormData) => Promise<void>
  /** Called when back button is clicked */
  onBack: () => void
  /** Whether the form is in edit mode */
  isEdit?: boolean
  /** Whether the form is submitting */
  isSubmitting?: boolean
}

/**
 * Customer form for Pessoa Jurídica (Company)
 */
export function CustomerPJForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: CustomerPJFormProps) {
  const form = useForm<CustomerPJCreateFormData>({
    resolver: zodResolver(customerPJCreateSchema),
    defaultValues: {
      type: 'company',
      full_name: initialData?.full_name || '',
      legal_name: initialData?.legal_name || '',
      cpf_cnpj: initialData?.cpf_cnpj || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      address_number: initialData?.address_number || '',
      neighborhood: initialData?.neighborhood || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal_code: initialData?.postal_code || '',
      complement: initialData?.complement || '',
      country: initialData?.country || 'BR',
    },
  })

  const handleSubmit = async (data: CustomerPJCreateFormData) => {
    const submitData = {
      ...data,
      // Clean empty strings to null
      email: data.email?.trim() || null,
    }
    await onSubmit(submitData as CustomerPJCreateFormData)
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
              {isEdit ? 'Editar Cliente' : 'Novo Cliente'} - Pessoa Jurídica
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados da empresa'
                : 'Preencha os dados para cadastrar uma nova empresa'}
            </p>
          </div>
        </div>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line 1: CNPJ */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <CNPJInput value={field.value} onChange={field.onChange} disabled={isEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line 2: Trade Name (Nome Fantasia) */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={TEXT_LIMITS.FULL_NAME}
                      placeholder="Nome comercial da empresa"
                      onBlur={(e) => {
                        const formatted = capitalizeNameBR(e.target.value)
                        if (formatted !== e.target.value) {
                          field.onChange(formatted)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line 3: Legal Name (Razão Social) */}
            <FormField
              control={form.control}
              name="legal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      maxLength={TEXT_LIMITS.LEGAL_NAME}
                      placeholder="Razão social registrada"
                      onBlur={(e) => {
                        const formatted = capitalizeNameBR(e.target.value)
                        if (formatted !== e.target.value) {
                          field.onChange(formatted)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line 4: Phone and Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        defaultCountry="BR"
                        international
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        value={field.value || ''}
                        maxLength={TEXT_LIMITS.EMAIL}
                        placeholder="contato@empresa.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressFormFields />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
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
